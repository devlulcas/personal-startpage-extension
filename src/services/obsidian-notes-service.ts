import { getObsidianNotesSettings } from "../config/notes";
import type { Note } from "../types/note";
import { err, ok, type Result } from "../types/result";

type ObsidianExportError = "invalid_settings" | "open_error";

const CLIPBOARD_FALLBACK_CONTENT =
	"Obsidian could not read the clipboard for this note. Return to StartPage and try saving again.";

function sanitizeFileName(fileName: string): string {
	return fileName
		.replace(/[\\/:*?"<>|#^[\]]/g, "-")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^\.+/, "")
		.slice(0, 120);
}

function normalizeFolderPath(folder: string): string {
	return folder
		.split("/")
		.map((segment) => sanitizeFileName(segment))
		.filter(Boolean)
		.join("/");
}

async function writeClipboardText(text: string): Promise<boolean> {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fall through to the extension-compatible textarea path.
		}
	}

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "true");
	textarea.style.position = "fixed";
	textarea.style.inset = "0";
	textarea.style.opacity = "0";
	document.body.append(textarea);
	textarea.select();

	try {
		return document.execCommand("copy");
	} catch {
		return false;
	} finally {
		textarea.remove();
	}
}

async function openObsidianUrl(
	url: string,
): Promise<Result<null, "open_error">> {
	try {
		if (typeof chrome !== "undefined" && chrome.tabs?.update) {
			try {
				await chrome.tabs.update({ url });
				return ok(null);
			} catch {
				// Fall through to the browser navigation path.
			}
		}

		window.location.assign(url);
	} catch {
		return err("open_error", "Failed to open Obsidian.");
	}

	return ok(null);
}

export async function exportNoteToObsidian(
	note: Note,
): Promise<Result<null, ObsidianExportError>> {
	const settings = getObsidianNotesSettings();
	if (!settings.vault || !settings.folder) {
		return err(
			"invalid_settings",
			"Set an Obsidian vault and folder in notes settings first.",
		);
	}

	const noteName = sanitizeFileName(note.title) || "Untitled Note";
	const folderPath = normalizeFolderPath(settings.folder);
	const filePath = `${folderPath}/${noteName}`;
	const urlParams = new URLSearchParams({
		file: filePath,
		overwrite: "true",
		silent: "true",
		vault: settings.vault,
	});

	const clipboardWritten = await writeClipboardText(note.content);
	if (clipboardWritten) {
		urlParams.set("clipboard", "true");
		urlParams.set("content", CLIPBOARD_FALLBACK_CONTENT);
	} else {
		urlParams.set("content", note.content);
	}

	const openResult = await openObsidianUrl(`obsidian://new?${urlParams}`);
	if (!openResult.ok) {
		return openResult;
	}

	return ok(null);
}
