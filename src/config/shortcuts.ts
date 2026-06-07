export const SHORTCUT_ICON_OPTIONS = [
	{ id: "github", label: "GitHub" },
	{ id: "youtube", label: "YouTube" },
	{ id: "mail", label: "Mail" },
	{ id: "chat", label: "Chat" },
	{ id: "sparkle", label: "Sparkle" },
	{ id: "brain", label: "Brain" },
	{ id: "globe", label: "Globe" },
	{ id: "search", label: "Search" },
	{ id: "bookmarks", label: "Bookmarks" },
	{ id: "code", label: "Code" },
	{ id: "music", label: "Music" },
	{ id: "calendar", label: "Calendar" },
] as const;

export type ShortcutIconId = (typeof SHORTCUT_ICON_OPTIONS)[number]["id"];

export type ShortcutConfig = {
	id: string;
	label: string;
	href: string;
	icon: ShortcutIconId;
	color: string;
};

const STORAGE_KEY = "shortcuts";
const DEFAULT_ICON: ShortcutIconId = "globe";
const DEFAULT_COLOR = "#7c3aed";
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
	{
		id: "github",
		href: "https://github.com",
		label: "GitHub",
		icon: "github",
		color: "#24292f",
	},
	{
		id: "youtube",
		href: "https://youtube.com",
		label: "YouTube",
		icon: "youtube",
		color: "#ff0033",
	},
	{
		id: "gmail",
		href: "https://gmail.com",
		label: "Gmail",
		icon: "mail",
		color: "#ea4335",
	},
	{
		id: "claude",
		href: "https://claude.ai/new",
		label: "Claude",
		icon: "brain",
		color: "#d97757",
	},
	{
		id: "chatgpt",
		href: "https://chatgpt.com",
		label: "ChatGPT",
		icon: "chat",
		color: "#10a37f",
	},
	{
		id: "gemini",
		href: "https://gemini.google.com/app",
		label: "Gemini",
		icon: "sparkle",
		color: "#4285f4",
	},
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isShortcutIconId(value: unknown): value is ShortcutIconId {
	return SHORTCUT_ICON_OPTIONS.some((option) => option.id === value);
}

function createShortcutId(): string {
	if (globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeUrl(value: string): string | null {
	try {
		const url = new URL(value.trim());
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}

		return url.toString();
	} catch {
		return null;
	}
}

function normalizeShortcut(
	input: unknown,
	index: number,
): ShortcutConfig | null {
	if (!isRecord(input)) {
		return null;
	}

	const label = typeof input.label === "string" ? input.label.trim() : "";
	const rawHref = typeof input.href === "string" ? input.href : "";
	const href = normalizeUrl(rawHref);

	if (!label || !href) {
		return null;
	}

	const id =
		typeof input.id === "string" && input.id.trim()
			? input.id.trim()
			: `shortcut-${index}`;
	const color =
		typeof input.color === "string" && HEX_COLOR_PATTERN.test(input.color)
			? input.color
			: DEFAULT_COLOR;
	const icon = isShortcutIconId(input.icon) ? input.icon : DEFAULT_ICON;

	return {
		id,
		label,
		href,
		icon,
		color,
	};
}

export function createShortcutInput(
	input: Omit<ShortcutConfig, "id">,
): ShortcutConfig {
	return {
		...input,
		id: createShortcutId(),
	};
}

export function normalizeShortcuts(input: unknown): ShortcutConfig[] {
	if (!Array.isArray(input)) {
		return DEFAULT_SHORTCUTS.map((shortcut) => ({ ...shortcut }));
	}

	const shortcuts = input
		.map((shortcut, index) => normalizeShortcut(shortcut, index))
		.filter((shortcut): shortcut is ShortcutConfig => Boolean(shortcut));

	return shortcuts;
}

export function getShortcuts(): ShortcutConfig[] {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) {
		return DEFAULT_SHORTCUTS.map((shortcut) => ({ ...shortcut }));
	}

	try {
		return normalizeShortcuts(JSON.parse(stored));
	} catch {
		return DEFAULT_SHORTCUTS.map((shortcut) => ({ ...shortcut }));
	}
}

export function saveShortcuts(shortcuts: ShortcutConfig[]): void {
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify(normalizeShortcuts(shortcuts)),
	);
}

export function validateShortcutInput(
	input: Omit<ShortcutConfig, "id">,
): string | null {
	if (!input.label.trim()) {
		return "Shortcut name is required.";
	}

	if (!normalizeUrl(input.href)) {
		return "Shortcut link must be a valid http or https URL.";
	}

	if (!HEX_COLOR_PATTERN.test(input.color)) {
		return "Shortcut color must be a valid hex color.";
	}

	return null;
}

export function normalizeShortcutInput(
	input: Omit<ShortcutConfig, "id">,
): Omit<ShortcutConfig, "id"> {
	return {
		label: input.label.trim(),
		href: normalizeUrl(input.href) ?? input.href.trim(),
		icon: input.icon,
		color: input.color,
	};
}
