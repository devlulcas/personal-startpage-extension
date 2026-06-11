import type { Note, NoteSummary } from "../types/note";
import { err, ok, type Result } from "../types/result";

const DB_NAME = "startpage_notes";
const DB_VERSION = 1;
const STORE_NAME = "notes";

type NotesStorageError = "storage_error" | "not_found";
type NoteInput = {
	title?: string;
	content?: string;
};

function toRequestPromise<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function openNotesDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains(STORE_NAME)) {
				const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
				store.createIndex("updatedAt", "updatedAt");
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function withNotesStore<T>(
	mode: IDBTransactionMode,
	callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
	const database = await openNotesDatabase();

	try {
		const transaction = database.transaction(STORE_NAME, mode);
		const store = transaction.objectStore(STORE_NAME);
		return await toRequestPromise(callback(store));
	} finally {
		database.close();
	}
}

function nowIso(): string {
	return new Date().toISOString();
}

function createNoteId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeTitle(title: string): string {
	const nextTitle = title.trim();
	return nextTitle || "Untitled Note";
}

function toNoteSummary(note: Note): NoteSummary {
	return {
		id: note.id,
		title: note.title,
		createdAt: note.createdAt,
		updatedAt: note.updatedAt,
	};
}

function sortNotesByUpdatedAt(notes: NoteSummary[]): NoteSummary[] {
	return notes.sort((first, second) =>
		second.updatedAt.localeCompare(first.updatedAt),
	);
}

export async function listNotes(): Promise<
	Result<NoteSummary[], "storage_error">
> {
	try {
		const notes = await withNotesStore<Note[]>("readonly", (store) =>
			store.getAll(),
		);

		return ok(sortNotesByUpdatedAt(notes.map(toNoteSummary)));
	} catch {
		return err("storage_error", "Failed to load notes.");
	}
}

export async function getNote(
	noteId: string,
): Promise<Result<Note, NotesStorageError>> {
	try {
		const note = await withNotesStore<Note | undefined>("readonly", (store) =>
			store.get(noteId),
		);

		if (!note) {
			return err("not_found", "Note not found.");
		}

		return ok(note);
	} catch {
		return err("storage_error", "Failed to load note.");
	}
}

export async function createNote(
	input: NoteInput = {},
): Promise<Result<Note, "storage_error">> {
	try {
		const timestamp = nowIso();
		const note: Note = {
			id: createNoteId(),
			title: normalizeTitle(input.title ?? "Untitled Note"),
			content: input.content ?? "",
			createdAt: timestamp,
			updatedAt: timestamp,
		};

		await withNotesStore<IDBValidKey>("readwrite", (store) => store.add(note));
		return ok(note);
	} catch {
		return err("storage_error", "Failed to create note.");
	}
}

export async function updateNote(
	noteId: string,
	input: NoteInput,
): Promise<Result<Note, NotesStorageError>> {
	try {
		const note = await withNotesStore<Note | undefined>("readonly", (store) =>
			store.get(noteId),
		);

		if (!note) {
			return err("not_found", "Note not found.");
		}

		const nextNote: Note = {
			...note,
			title:
				input.title === undefined ? note.title : normalizeTitle(input.title),
			content: input.content === undefined ? note.content : input.content,
			updatedAt: nowIso(),
		};

		await withNotesStore<IDBValidKey>("readwrite", (store) =>
			store.put(nextNote),
		);
		return ok(nextNote);
	} catch {
		return err("storage_error", "Failed to save note.");
	}
}

export async function duplicateNote(
	noteId: string,
): Promise<Result<Note, NotesStorageError>> {
	const noteResult = await getNote(noteId);
	if (!noteResult.ok) {
		return noteResult;
	}

	return createNote({
		title: `${noteResult.data.title} Copy`,
		content: noteResult.data.content,
	});
}

export async function deleteNote(
	noteId: string,
): Promise<Result<null, "storage_error">> {
	try {
		await withNotesStore<undefined>("readwrite", (store) =>
			store.delete(noteId),
		);
		return ok(null);
	} catch {
		return err("storage_error", "Failed to delete note.");
	}
}
