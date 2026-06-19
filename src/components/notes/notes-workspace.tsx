import {
	ArrowLeftIcon,
	CopyIcon,
	ExportIcon,
	NotePencilIcon,
	PlusIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Menu, MenuItem, Popover } from "react-aria-components";
import { getObsidianNotesSettings } from "../../config/notes";
import {
	createNote,
	deleteNote,
	duplicateNote,
	getNote,
	listNotes,
	updateNote,
} from "../../services/notes-storage-service";
import { exportNoteToObsidian } from "../../services/obsidian-notes-service";
import type { Note, NoteSummary } from "../../types/note";
import { AppButton, AppIconButton } from "../common/button";
import { toaster } from "../toast/toast";
import { MarkdownEditor } from "./markdown-editor";
import styles from "./notes-workspace.module.css";
import "./editor-global.css";

type NotesWorkspaceProps = {
	onClose: () => void;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type MobileView = "list" | "editor";
type NoteActionMenuState = {
	noteId: string;
	x: number;
	y: number;
};

function formatUpdatedAt(value: string): string {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}

function toSummary(note: Note): NoteSummary {
	return {
		id: note.id,
		title: note.title,
		createdAt: note.createdAt,
		updatedAt: note.updatedAt,
	};
}

function sortSummaries(notes: NoteSummary[]): NoteSummary[] {
	return [...notes].sort((first, second) =>
		second.updatedAt.localeCompare(first.updatedAt),
	);
}

function upsertSummary(notes: NoteSummary[], note: Note): NoteSummary[] {
	const summary = toSummary(note);
	const existingIndex = notes.findIndex((item) => item.id === note.id);
	if (existingIndex === -1) {
		return sortSummaries([summary, ...notes]);
	}

	const nextNotes = [...notes];
	nextNotes[existingIndex] = summary;
	return sortSummaries(nextNotes);
}

export function NotesWorkspace({ onClose }: NotesWorkspaceProps) {
	const notesSettings = getObsidianNotesSettings();
	const [notes, setNotes] = useState<NoteSummary[]>([]);
	const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
	const [selectedNote, setSelectedNote] = useState<Note | null>(null);
	const [titleDraft, setTitleDraft] = useState("");
	const [contentDraft, setContentDraft] = useState("");
	const [loading, setLoading] = useState(true);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [isSavingForObsidian, setIsSavingForObsidian] = useState(false);
	const [isExportingToObsidian, setIsExportingToObsidian] = useState(false);
	const [mobileView, setMobileView] = useState<MobileView>("list");
	const [noteActionMenu, setNoteActionMenu] =
		useState<NoteActionMenuState | null>(null);
	const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const saveOperationIdRef = useRef(0);
	const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const actionMenuTriggerRef = useRef<HTMLDivElement | null>(null);
	const disposableNoteIdsRef = useRef(new Set<string>());

	const hasNotes = notes.length > 0;
	const isSavingToObsidian = isSavingForObsidian || isExportingToObsidian;
	const selectedNoteChanged = selectedNote
		? selectedNote.title !== titleDraft || selectedNote.content !== contentDraft
		: false;
	const statusLabel = useMemo(() => {
		if (saveStatus === "saving") {
			return "Saving";
		}

		if (saveStatus === "saved") {
			return "Saved";
		}

		if (saveStatus === "error") {
			return "Error";
		}

		return selectedNoteChanged ? "Unsaved" : "Saved";
	}, [saveStatus, selectedNoteChanged]);

	const isSelectedNoteDisposable =
		selectedNote !== null &&
		disposableNoteIdsRef.current.has(selectedNote.id) &&
		selectedNote.title === "Untitled Note" &&
		titleDraft === "Untitled Note" &&
		contentDraft.length === 0;

	const clearAutosaveTimer = useCallback(() => {
		if (autosaveTimeoutRef.current) {
			clearTimeout(autosaveTimeoutRef.current);
			autosaveTimeoutRef.current = null;
		}
	}, []);

	const applySavedNote = useCallback((note: Note) => {
		setSelectedNote(note);
		setNotes((currentNotes) => upsertSummary(currentNotes, note));
		if (note.title !== "Untitled Note" || note.content.length > 0) {
			disposableNoteIdsRef.current.delete(note.id);
		}
	}, []);

	const saveCurrentDraft = useCallback(async (): Promise<Note | null> => {
		if (!selectedNote) {
			return null;
		}

		if (!selectedNoteChanged) {
			return selectedNote;
		}

		clearAutosaveTimer();
		const operationId = saveOperationIdRef.current + 1;
		saveOperationIdRef.current = operationId;
		const noteId = selectedNote.id;

		setSaveStatus("saving");
		const updateResult = await updateNote(noteId, {
			title: titleDraft,
			content: contentDraft,
		});

		if (
			operationId !== saveOperationIdRef.current ||
			selectedNoteId !== noteId
		) {
			return null;
		}

		if (!updateResult.ok) {
			toaster.error(updateResult.message);
			setSaveStatus("error");
			return null;
		}

		applySavedNote(updateResult.data);
		setSaveStatus("saved");
		return updateResult.data;
	}, [
		applySavedNote,
		clearAutosaveTimer,
		contentDraft,
		selectedNote,
		selectedNoteChanged,
		selectedNoteId,
		titleDraft,
	]);

	const refreshNotes = useCallback(async () => {
		const notesResult = await listNotes();
		if (!notesResult.ok) {
			toaster.error(notesResult.message);
			return;
		}

		setNotes(notesResult.data);
		setSelectedNoteId((currentNoteId) => {
			if (
				currentNoteId &&
				notesResult.data.some((note) => note.id === currentNoteId)
			) {
				return currentNoteId;
			}

			return notesResult.data[0]?.id ?? null;
		});
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadInitialNotes() {
			setLoading(true);
			const notesResult = await listNotes();
			if (cancelled) {
				return;
			}

			if (!notesResult.ok) {
				toaster.error(notesResult.message);
				setLoading(false);
				return;
			}

			setNotes(notesResult.data);
			setSelectedNoteId(notesResult.data[0]?.id ?? null);
			setLoading(false);
		}

		loadInitialNotes();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		saveOperationIdRef.current += 1;
		clearAutosaveTimer();

		if (!selectedNoteId) {
			setSelectedNote(null);
			setTitleDraft("");
			setContentDraft("");
			setSaveStatus("idle");
			return;
		}

		let cancelled = false;
		const noteId = selectedNoteId;

		async function loadNote() {
			const noteResult = await getNote(noteId);
			if (cancelled) {
				return;
			}

			if (!noteResult.ok) {
				toaster.error(noteResult.message);
				await refreshNotes();
				return;
			}

			setSelectedNote(noteResult.data);
			setTitleDraft(noteResult.data.title);
			setContentDraft(noteResult.data.content);
			setSaveStatus("saved");
		}

		loadNote();

		return () => {
			cancelled = true;
		};
	}, [clearAutosaveTimer, refreshNotes, selectedNoteId]);

	useEffect(() => {
		if (!selectedNote || !selectedNoteChanged) {
			return;
		}

		clearAutosaveTimer();
		setSaveStatus("saving");
		autosaveTimeoutRef.current = setTimeout(async () => {
			await saveCurrentDraft();
		}, 450);

		return () => {
			clearAutosaveTimer();
		};
	}, [clearAutosaveTimer, saveCurrentDraft, selectedNote, selectedNoteChanged]);

	useEffect(() => {
		if (
			selectedNote &&
			disposableNoteIdsRef.current.has(selectedNote.id) &&
			(titleDraft !== "Untitled Note" || contentDraft.length > 0)
		) {
			disposableNoteIdsRef.current.delete(selectedNote.id);
		}
	}, [contentDraft, selectedNote, titleDraft]);

	useEffect(() => {
		return () => {
			saveOperationIdRef.current += 1;
			clearAutosaveTimer();
			if (longPressTimeoutRef.current) {
				clearTimeout(longPressTimeoutRef.current);
			}
		};
	}, [clearAutosaveTimer]);

	async function handleCreateNote() {
		await discardSelectedDisposableNote();

		const noteResult = await createNote();
		if (!noteResult.ok) {
			toaster.error(noteResult.message);
			return;
		}

		disposableNoteIdsRef.current.add(noteResult.data.id);
		setNotes((currentNotes) => upsertSummary(currentNotes, noteResult.data));
		setSelectedNoteId(noteResult.data.id);
		setMobileView("editor");
	}

	async function discardSelectedDisposableNote() {
		if (!selectedNote || !isSelectedNoteDisposable) {
			return false;
		}

		saveOperationIdRef.current += 1;
		clearAutosaveTimer();
		const deleteResult = await deleteNote(selectedNote.id);
		if (!deleteResult.ok) {
			toaster.error(deleteResult.message);
			return false;
		}

		disposableNoteIdsRef.current.delete(selectedNote.id);
		setNotes((currentNotes) =>
			currentNotes.filter((note) => note.id !== selectedNote.id),
		);
		setSelectedNote(null);
		setTitleDraft("");
		setContentDraft("");
		setSaveStatus("idle");
		return true;
	}

	async function handleDuplicateNote(noteId: string) {
		const duplicateResult = await duplicateNote(noteId);
		if (!duplicateResult.ok) {
			toaster.error(duplicateResult.message);
			return;
		}

		setNotes((currentNotes) =>
			upsertSummary(currentNotes, duplicateResult.data),
		);
		setSelectedNoteId(duplicateResult.data.id);
		setMobileView("editor");
		toaster.success("Note duplicated.");
	}

	async function handleDeleteNote(noteId: string) {
		const note = notes.find((item) => item.id === noteId);
		const confirmed = window.confirm(`Delete "${note?.title ?? "this note"}"?`);
		if (!confirmed) {
			return;
		}

		const deleteResult = await deleteNote(noteId);
		if (!deleteResult.ok) {
			toaster.error(deleteResult.message);
			return;
		}

		const nextNotes = notes.filter((item) => item.id !== noteId);
		disposableNoteIdsRef.current.delete(noteId);
		setNotes(nextNotes);
		if (selectedNoteId === noteId) {
			setSelectedNoteId(nextNotes[0]?.id ?? null);
			if (nextNotes.length === 0) {
				setMobileView("list");
			}
		}
		toaster.success("Note deleted.");
	}

	function openNoteActionMenu(noteId: string, x: number, y: number) {
		setNoteActionMenu({ noteId, x, y });
	}

	function handleNoteContextMenu(
		noteId: string,
		event: React.MouseEvent<HTMLElement>,
	) {
		event.preventDefault();
		openNoteActionMenu(noteId, event.clientX, event.clientY);
	}

	function handleNotePointerDown(
		noteId: string,
		event: React.PointerEvent<HTMLElement>,
	) {
		if (event.pointerType === "mouse") {
			return;
		}

		if (longPressTimeoutRef.current) {
			clearTimeout(longPressTimeoutRef.current);
		}

		longPressTimeoutRef.current = setTimeout(() => {
			openNoteActionMenu(noteId, event.clientX, event.clientY);
		}, 550);
	}

	function clearLongPressTimer() {
		if (longPressTimeoutRef.current) {
			clearTimeout(longPressTimeoutRef.current);
			longPressTimeoutRef.current = null;
		}
	}

	function handleNoteMenuAction(action: React.Key) {
		const noteId = noteActionMenu?.noteId;
		setNoteActionMenu(null);
		if (!noteId) {
			return;
		}

		if (action === "duplicate") {
			handleDuplicateNote(noteId);
		}

		if (action === "delete") {
			handleDeleteNote(noteId);
		}
	}

	const handleExportNote = useCallback(async () => {
		if (!selectedNote) {
			return;
		}

		if (isSavingToObsidian) {
			return;
		}

		setIsSavingForObsidian(true);
		let noteToExport: Note | null = null;
		try {
			noteToExport = await saveCurrentDraft();
		} finally {
			setIsSavingForObsidian(false);
		}
		if (!noteToExport) {
			return;
		}

		setIsExportingToObsidian(true);
		try {
			const exportResult = await exportNoteToObsidian(noteToExport);
			if (!exportResult.ok) {
				toaster.error(exportResult.message);
				return;
			}

			toaster.success("Saved to Obsidian.");
		} finally {
			setIsExportingToObsidian(false);
		}
	}, [isSavingToObsidian, saveCurrentDraft, selectedNote]);

	useEffect(() => {
		if (!notesSettings.saveToObsidianShortcutEnabled) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			const isSaveShortcut =
				event.key.toLowerCase() === "s" &&
				(event.ctrlKey || event.metaKey) &&
				!event.altKey;
			if (!isSaveShortcut) {
				return;
			}

			event.preventDefault();
			void handleExportNote();
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleExportNote, notesSettings.saveToObsidianShortcutEnabled]);

	async function handleSelectNote(noteId: string) {
		if (noteId === selectedNoteId) {
			setMobileView("editor");
			return;
		}

		await discardSelectedDisposableNote();
		setSelectedNoteId(noteId);
		setMobileView("editor");
	}

	async function handleBackToList() {
		await discardSelectedDisposableNote();
		setSelectedNoteId(null);
		setMobileView("list");
	}

	async function handleCloseNotes() {
		await discardSelectedDisposableNote();
		onClose();
	}

	if (loading) {
		return (
			<section className={styles.workspace} aria-label="Notes">
				<div className={styles.statusState}>Loading notes...</div>
			</section>
		);
	}

	return (
		<section
			className={styles.workspace}
			aria-label="Notes"
			style={
				{
					"--notes-glass-transparency": `${notesSettings.glassTransparency}%`,
					"--notes-glass-transparency-strong": `${notesSettings.glassTransparencyStrong}%`,
					"--notes-glass-transparency-soft": `${notesSettings.glassTransparencySoft}%`,
				} as React.CSSProperties
			}
		>
			<div className={styles.body} data-mobile-view={mobileView}>
				<aside className={styles.aside} aria-label="Note list">
					<div className={styles.asideHeader}>
						<h2 className={styles.asideTitle}>All Notes</h2>
						<AppIconButton
							className={styles.newButton}
							onPress={handleCreateNote}
							aria-label="Create note"
						>
							<PlusIcon size={18} weight="bold" />
						</AppIconButton>
					</div>

					<div className={styles.noteList}>
						{notes.map((note) => (
							<div
								key={note.id}
								className={styles.noteItem}
								data-selected={note.id === selectedNoteId}
							>
								<Button
									className={styles.noteMain}
									onPress={() => handleSelectNote(note.id)}
									onContextMenu={(event) =>
										handleNoteContextMenu(note.id, event)
									}
									onPointerDown={(event) =>
										handleNotePointerDown(note.id, event)
									}
									onPointerCancel={clearLongPressTimer}
									onPointerLeave={clearLongPressTimer}
									onPointerMove={clearLongPressTimer}
									onPointerUp={clearLongPressTimer}
									aria-label={`Open ${note.title}`}
								>
									<span className={styles.noteText}>
										<span className={styles.noteTitle}>{note.title}</span>
										<span className={styles.noteDate}>
											{formatUpdatedAt(note.updatedAt)}
										</span>
									</span>
								</Button>
							</div>
						))}
					</div>

					<div className={styles.asideFooter}>
						<AppButton
							variant="text"
							className={styles.backButton}
							onPress={handleCloseNotes}
						>
							<ArrowLeftIcon size={16} weight="bold" />
							Back
						</AppButton>
					</div>
				</aside>

				{selectedNote ? (
					<div className={styles.editorPane}>
						<header className={styles.editorHeader}>
							<AppIconButton
								className={styles.mobileBack}
								onPress={handleBackToList}
								aria-label="Back to notes"
							>
								<ArrowLeftIcon size={18} weight="bold" />
							</AppIconButton>
							<Input
								value={titleDraft}
								onChange={(event) => setTitleDraft(event.target.value)}
								className={styles.titleInput}
								aria-label="Note title"
							/>
						</header>
						<div className="editorSurface">
							<MarkdownEditor
								value={contentDraft}
								onChange={setContentDraft}
								ariaLabel="Markdown note content"
							/>
						</div>
						<footer className={styles.editorFooter}>
							<span className={styles.saveStatus}>{statusLabel}</span>
							<AppIconButton
								onPress={handleExportNote}
								isDisabled={isSavingToObsidian}
								aria-label={
									isSavingToObsidian
										? "Saving note to Obsidian"
										: "Save note to Obsidian"
								}
							>
								<ExportIcon size={18} weight="bold" />
							</AppIconButton>
						</footer>
					</div>
				) : (
					<div className={styles.emptyState}>
						<div className={styles.emptyStateContent}>
							<NotePencilIcon size={36} weight="duotone" />
							{hasNotes ? (
								<p className={styles.emptyText}>Select a note to edit.</p>
							) : (
								<>
									<h2 className={styles.emptyTitle}>No notes yet</h2>
									<p className={styles.emptyText}>
										Create a note to start writing Markdown.
									</p>
									<AppButton onPress={handleCreateNote}>
										<PlusIcon size={16} weight="bold" />
										New Note
									</AppButton>
								</>
							)}
						</div>
					</div>
				)}
			</div>

			<div
				ref={actionMenuTriggerRef}
				className={styles.contextMenuAnchor}
				style={{
					left: noteActionMenu ? noteActionMenu.x : 0,
					top: noteActionMenu ? noteActionMenu.y : 0,
				}}
			/>
			<Popover
				isOpen={noteActionMenu !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						setNoteActionMenu(null);
					}
				}}
				triggerRef={actionMenuTriggerRef}
				placement="bottom start"
				className={styles.contextMenuPopover}
			>
				<Menu
					aria-label="Note actions"
					className={styles.contextMenu}
					onAction={handleNoteMenuAction}
				>
					<MenuItem
						id="duplicate"
						textValue="Duplicate"
						className={styles.contextMenuItem}
					>
						<CopyIcon size={16} weight="bold" />
						Duplicate
					</MenuItem>
					<MenuItem
						id="delete"
						textValue="Delete"
						className={styles.contextMenuItem}
					>
						<TrashIcon size={16} weight="bold" />
						Delete
					</MenuItem>
				</Menu>
			</Popover>
		</section>
	);
}
