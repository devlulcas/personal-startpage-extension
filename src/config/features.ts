export type FeatureSettings = {
	water: boolean;
	clock: boolean;
	weather: boolean;
	includeWallpaperInExport: boolean;
};

const STORAGE_KEY = "feature_settings";

const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
	water: true,
	clock: true,
	weather: true,
	includeWallpaperInExport: true,
};

function isBoolean(value: unknown): value is boolean {
	return typeof value === "boolean";
}

export function normalizeFeatureSettings(input: unknown): FeatureSettings {
	if (!input || typeof input !== "object") {
		return { ...DEFAULT_FEATURE_SETTINGS };
	}

	const raw = input as Partial<FeatureSettings>;

	return {
		water: isBoolean(raw.water) ? raw.water : DEFAULT_FEATURE_SETTINGS.water,
		clock: isBoolean(raw.clock) ? raw.clock : DEFAULT_FEATURE_SETTINGS.clock,
		weather: isBoolean(raw.weather)
			? raw.weather
			: DEFAULT_FEATURE_SETTINGS.weather,
		includeWallpaperInExport: isBoolean(raw.includeWallpaperInExport)
			? raw.includeWallpaperInExport
			: DEFAULT_FEATURE_SETTINGS.includeWallpaperInExport,
	};
}

export function getFeatureSettings(): FeatureSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return { ...DEFAULT_FEATURE_SETTINGS };
		}

		return normalizeFeatureSettings(JSON.parse(stored));
	} catch {
		return { ...DEFAULT_FEATURE_SETTINGS };
	}
}

export function saveFeatureSettings(settings: FeatureSettings): void {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(normalizeFeatureSettings(settings)),
		);
	} catch (error) {
		throw new Error(
			error instanceof Error
				? `Failed to save feature settings: ${error.message}`
				: "Failed to save feature settings.",
		);
	}
}
