import type { ObsidianNotesSettings } from "../types/note";

const STORAGE_KEY = "notes_obsidian_settings";

const DEFAULT_OBSIDIAN_NOTES_SETTINGS: ObsidianNotesSettings = {
	vault: "",
	folder: "",
	saveToObsidianShortcutEnabled: true,
	glassTransparency: 46,
	glassTransparencyStrong: 58,
	glassTransparencySoft: 30,
};

function normalizeString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function normalizePercentage(value: unknown, fallback: number): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(Math.max(Math.round(value), 0), 90);
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

export function normalizeObsidianNotesSettings(
	input: unknown,
): ObsidianNotesSettings {
	if (!input || typeof input !== "object") {
		return { ...DEFAULT_OBSIDIAN_NOTES_SETTINGS };
	}

	const raw = input as Partial<ObsidianNotesSettings>;
	return {
		vault: normalizeString(raw.vault),
		folder: normalizeString(raw.folder),
		saveToObsidianShortcutEnabled: normalizeBoolean(
			raw.saveToObsidianShortcutEnabled,
			DEFAULT_OBSIDIAN_NOTES_SETTINGS.saveToObsidianShortcutEnabled,
		),
		glassTransparency: normalizePercentage(
			raw.glassTransparency,
			DEFAULT_OBSIDIAN_NOTES_SETTINGS.glassTransparency,
		),
		glassTransparencyStrong: normalizePercentage(
			raw.glassTransparencyStrong,
			DEFAULT_OBSIDIAN_NOTES_SETTINGS.glassTransparencyStrong,
		),
		glassTransparencySoft: normalizePercentage(
			raw.glassTransparencySoft,
			DEFAULT_OBSIDIAN_NOTES_SETTINGS.glassTransparencySoft,
		),
	};
}

export function getObsidianNotesSettings(): ObsidianNotesSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return { ...DEFAULT_OBSIDIAN_NOTES_SETTINGS };
		}

		return normalizeObsidianNotesSettings(JSON.parse(stored));
	} catch {
		return { ...DEFAULT_OBSIDIAN_NOTES_SETTINGS };
	}
}

export function saveObsidianNotesSettings(
	settings: ObsidianNotesSettings,
): void {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(normalizeObsidianNotesSettings(settings)),
		);
	} catch (error) {
		throw new Error(
			error instanceof Error
				? `Failed to save notes settings: ${error.message}`
				: "Failed to save notes settings.",
		);
	}
}
