import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
import {
	bracketMatching,
	defaultHighlightStyle,
	HighlightStyle,
	StreamLanguage,
	syntaxHighlighting,
} from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { searchKeymap } from "@codemirror/search";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	keymap,
	lineNumbers,
	ViewPlugin,
	type ViewUpdate,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useMemo, useRef } from "react";

type MarkdownEditorProps = {
	value: string;
	onChange: (value: string) => void;
	ariaLabel: string;
};

const shellLanguage = StreamLanguage.define(shell);
const taskMarkerPattern = /^([ \t]*[-*+]\s+\[([ xX])\])/;

const notesHighlightStyle = HighlightStyle.define([
	{
		tag: tags.heading,
		color: "var(--notes-token-heading)",
		fontWeight: "700",
	},
	{ tag: tags.link, color: "var(--notes-token-link)" },
	{ tag: tags.keyword, color: "var(--notes-token-keyword)" },
	{ tag: tags.string, color: "var(--notes-token-string)" },
	{ tag: tags.number, color: "var(--notes-token-number)" },
	{ tag: tags.comment, color: "var(--notes-token-comment)" },
	{ tag: tags.variableName, color: "var(--notes-token-variable)" },
	{ tag: tags.typeName, color: "var(--notes-token-type)" },
	{ tag: tags.monospace, color: "var(--notes-token-monospace)" },
]);

function demoteH1Headings(markdownText: string): string {
	return markdownText.replace(/(^|\n)# (?=\S)/g, "$1## ");
}

function countH1DemotionsBeforePosition(
	markdownText: string,
	position: number,
) {
	const prefix = markdownText.slice(0, position);
	const matches = prefix.match(/(^|\n)# (?=\S)/g);
	return matches?.length ?? 0;
}

const preventH1Headings = EditorState.transactionFilter.of((transaction) => {
	if (!transaction.docChanged) {
		return transaction;
	}

	const nextText = transaction.newDoc.toString();
	const demotedText = demoteH1Headings(nextText);
	if (demotedText === nextText) {
		return transaction;
	}

	const nextHead = transaction.newSelection.main.head;
	const nextAnchor = transaction.newSelection.main.anchor;
	const headOffset = countH1DemotionsBeforePosition(nextText, nextHead);
	const anchorOffset = countH1DemotionsBeforePosition(nextText, nextAnchor);

	return [
		transaction,
		{
			changes: { from: 0, to: nextText.length, insert: demotedText },
			selection: EditorSelection.range(
				nextAnchor + anchorOffset,
				nextHead + headOffset,
			),
			sequential: true,
		},
	];
});

function buildTaskDecorations(view: EditorView): DecorationSet {
	const decorations = [];

	for (
		let lineNumber = 1;
		lineNumber <= view.state.doc.lines;
		lineNumber += 1
	) {
		const line = view.state.doc.line(lineNumber);
		const match = taskMarkerPattern.exec(line.text);
		if (!match) {
			continue;
		}

		const markerStart = line.from + match[1].lastIndexOf("[");
		const markerEnd = markerStart + 3;
		const isCompleted = match[2].toLowerCase() === "x";

		if (isCompleted) {
			decorations.push(
				Decoration.line({ class: "cm-taskLineCompleted" }).range(line.from),
			);
		}

		decorations.push(
			Decoration.mark({
				class: isCompleted
					? "cm-taskMarker cm-taskMarkerCompleted"
					: "cm-taskMarker cm-taskMarkerOpen",
			}).range(markerStart, markerEnd),
		);
	}

	return Decoration.set(decorations, true);
}

function toggleTaskAtPosition(view: EditorView, position: number): boolean {
	const line = view.state.doc.lineAt(position);
	const match = taskMarkerPattern.exec(line.text);
	if (!match) {
		return false;
	}

	const markerStart = line.from + match[1].lastIndexOf("[");
	const markerEnd = markerStart + 3;
	if (position < markerStart || position > markerEnd) {
		return false;
	}

	const nextMarker = match[2].toLowerCase() === "x" ? "[ ]" : "[x]";
	view.dispatch({
		changes: { from: markerStart, to: markerEnd, insert: nextMarker },
		selection: EditorSelection.cursor(markerEnd),
	});
	return true;
}

const taskListPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = buildTaskDecorations(view);
		}

		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = buildTaskDecorations(update.view);
			}
		}
	},
	{
		decorations: (value) => value.decorations,
		eventHandlers: {
			mousedown(event, view) {
				if (event.button !== 0) {
					return false;
				}

				const position = view.posAtCoords({
					x: event.clientX,
					y: event.clientY,
				});
				if (position === null || !toggleTaskAtPosition(view, position)) {
					return false;
				}

				event.preventDefault();
				return true;
			},
		},
	},
);

function fencedCodeLanguage(info: string) {
	const language = info.trim().toLowerCase().split(/\s+/)[0];

	if (["bash", "sh", "shell", "zsh", "fish"].includes(language)) {
		return shellLanguage;
	}

	if (["ts", "typescript"].includes(language)) {
		return javascript({ typescript: true }).language;
	}

	if (["tsx", "typescriptreact"].includes(language)) {
		return javascript({ typescript: true, jsx: true }).language;
	}

	if (["js", "javascript", "jsx", "javascriptreact"].includes(language)) {
		return javascript({ jsx: language.includes("x") }).language;
	}

	if (language === "json") {
		return json().language;
	}

	if (["yaml", "yml"].includes(language)) {
		return yaml().language;
	}

	return null;
}

export function MarkdownEditor({
	ariaLabel,
	onChange,
	value,
}: MarkdownEditorProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const viewRef = useRef<EditorView | null>(null);
	const initialValueRef = useRef(demoteH1Headings(value));
	const onChangeRef = useRef(onChange);

	onChangeRef.current = onChange;

	useEffect(() => {
		const demotedValue = demoteH1Headings(value);
		if (demotedValue !== value) {
			onChangeRef.current(demotedValue);
		}
	}, [value]);

	const extensions = useMemo(
		() => [
			lineNumbers(),
			history(),
			bracketMatching(),
			preventH1Headings,
			markdown({
				base: markdownLanguage,
				codeLanguages: fencedCodeLanguage,
			}),
			syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
			syntaxHighlighting(notesHighlightStyle),
			taskListPlugin,
			keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
			EditorView.lineWrapping,
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					onChangeRef.current(update.state.doc.toString());
				}
			}),
			EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
		],
		[ariaLabel],
	);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const view = new EditorView({
			parent: containerRef.current,
			state: EditorState.create({
				doc: initialValueRef.current,
				extensions,
			}),
		});
		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, [extensions]);

	useEffect(() => {
		const view = viewRef.current;
		if (!view) {
			return;
		}

		const demotedValue = demoteH1Headings(value);
		const currentValue = view.state.doc.toString();
		if (currentValue === demotedValue) {
			return;
		}

		view.dispatch({
			changes: {
				from: 0,
				to: currentValue.length,
				insert: demotedValue,
			},
		});
	}, [value]);

	return <div ref={containerRef} />;
}
