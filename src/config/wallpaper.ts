export type WallpaperSettings = {
	blur: number;
};

const STORAGE_KEY = "wallpaper_settings";

const DEFAULT_SETTINGS: WallpaperSettings = {
	blur: 0,
};

export function getWallpaperSettings(): WallpaperSettings {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return { ...DEFAULT_SETTINGS };

	try {
		return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export function saveWallpaperSettings(
	settings: Partial<WallpaperSettings>,
): void {
	const current = getWallpaperSettings();
	const updated = { ...current, ...settings };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	applyWallpaperSettings(updated);
}

function applyWallpaperSettings(settings: WallpaperSettings): void {
	document.documentElement.style.setProperty(
		"--wallpaper-blur",
		`${settings.blur}px`,
	);
}
