import { apiKeyRotator } from "../config/api-keys";
import {
	type FeatureSettings,
	getFeatureSettings,
	normalizeFeatureSettings,
	saveFeatureSettings,
} from "../config/features";
import {
	clearLocation,
	getStoredLocation,
	type LocationConfig,
	saveLocation,
} from "../config/location";
import {
	getWallpaperSettings,
	saveWallpaperSettings,
	type WallpaperSettings,
} from "../config/wallpaper";
import {
	getWaterHistory,
	getWaterSettings,
	saveWaterHistory,
	saveWaterSettings,
	type WaterHistory,
	type WaterSettings,
} from "../config/water";
import { err, ok, type Result } from "../types/result";
import {
	getStoredWallpaperBackup,
	replaceStoredWallpaperBackup,
} from "./wallpaper-storage-service";

const CONFIG_VERSION = 1;

export type AppConfigBackup = {
	version: 1;
	exportedAt: string;
	features: FeatureSettings;
	weatherLocation: LocationConfig | null;
	waterSettings: WaterSettings;
	waterHistory: WaterHistory;
	wallpaperSettings: WallpaperSettings;
	weatherApiKeys: {
		keysInputValue: string;
		currentIndex: number;
	};
	wallpaperIncluded: boolean;
	wallpaperImage: string | null;
	colorPalette: Record<string, string> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readStringRecord(value: unknown): Record<string, string> | null {
	if (value === null) {
		return null;
	}

	if (!isRecord(value)) {
		throw new Error("Invalid color palette.");
	}

	const next: Record<string, string> = {};
	for (const [key, entry] of Object.entries(value)) {
		if (typeof entry !== "string") {
			throw new Error("Invalid color palette.");
		}
		next[key] = entry;
	}

	return next;
}

function readLocation(value: unknown): LocationConfig | null {
	if (value === null) {
		return null;
	}

	if (!isRecord(value)) {
		throw new Error("Invalid weather location.");
	}

	if (
		typeof value.city !== "string" ||
		typeof value.country !== "string" ||
		typeof value.latitude !== "number" ||
		typeof value.longitude !== "number" ||
		!Number.isFinite(value.latitude) ||
		!Number.isFinite(value.longitude)
	) {
		throw new Error("Invalid weather location.");
	}

	return {
		city: value.city,
		country: value.country,
		latitude: value.latitude,
		longitude: value.longitude,
	};
}

function readWaterSettings(value: unknown): WaterSettings {
	if (!isRecord(value)) {
		throw new Error("Invalid water settings.");
	}

	return {
		dailyGoalLiters: readNumber(value.dailyGoalLiters, 2),
		cupSizeMl: readNumber(value.cupSizeMl, 250),
	};
}

function readWaterHistory(value: unknown): WaterHistory {
	if (!isRecord(value)) {
		throw new Error("Invalid water history.");
	}

	const next: WaterHistory = {};
	for (const [dateKey, consumedLiters] of Object.entries(value)) {
		if (
			typeof consumedLiters !== "number" ||
			!Number.isFinite(consumedLiters)
		) {
			throw new Error("Invalid water history.");
		}

		next[dateKey] = consumedLiters;
	}

	return next;
}

function readWallpaperSettings(value: unknown): WallpaperSettings {
	if (!isRecord(value)) {
		throw new Error("Invalid wallpaper settings.");
	}

	return {
		blur: readNumber(value.blur, 0),
	};
}

function readApiKeys(value: unknown): AppConfigBackup["weatherApiKeys"] {
	if (!isRecord(value) || typeof value.keysInputValue !== "string") {
		throw new Error("Invalid weather API keys.");
	}

	return {
		keysInputValue: value.keysInputValue,
		currentIndex: readNumber(value.currentIndex, 0),
	};
}

function parseBackup(
	input: unknown,
): Result<AppConfigBackup, "invalid_config"> {
	if (!isRecord(input) || input.version !== CONFIG_VERSION) {
		return err(
			"invalid_config",
			"Config file is not a supported startpage config.",
		);
	}

	try {
		const wallpaperImage =
			typeof input.wallpaperImage === "string" ? input.wallpaperImage : null;
		const wallpaperIncluded =
			typeof input.wallpaperIncluded === "boolean"
				? input.wallpaperIncluded
				: true;

		return ok({
			version: CONFIG_VERSION,
			exportedAt:
				typeof input.exportedAt === "string"
					? input.exportedAt
					: new Date().toISOString(),
			features: normalizeFeatureSettings(input.features),
			weatherLocation: readLocation(input.weatherLocation),
			waterSettings: readWaterSettings(input.waterSettings),
			waterHistory: readWaterHistory(input.waterHistory),
			wallpaperSettings: readWallpaperSettings(input.wallpaperSettings),
			weatherApiKeys: readApiKeys(input.weatherApiKeys),
			wallpaperIncluded,
			wallpaperImage,
			colorPalette: readStringRecord(input.colorPalette),
		});
	} catch (error) {
		return err(
			"invalid_config",
			error instanceof Error ? error.message : "Config file is invalid.",
		);
	}
}

export async function buildConfigBackup(): Promise<
	Result<AppConfigBackup, "storage_error">
> {
	const wallpaperResult = await getStoredWallpaperBackup();
	if (!wallpaperResult.ok) {
		return wallpaperResult;
	}
	const features = getFeatureSettings();
	const includeWallpaper = features.includeWallpaperInExport;

	return ok({
		version: CONFIG_VERSION,
		exportedAt: new Date().toISOString(),
		features,
		weatherLocation: getStoredLocation(),
		waterSettings: getWaterSettings(),
		waterHistory: getWaterHistory(),
		wallpaperSettings: getWallpaperSettings(),
		weatherApiKeys: apiKeyRotator.getBackup(),
		wallpaperIncluded: includeWallpaper,
		wallpaperImage: includeWallpaper ? wallpaperResult.data.imageUrl : null,
		colorPalette: includeWallpaper ? wallpaperResult.data.palette : null,
	});
}

export async function importConfigBackup(
	input: unknown,
): Promise<Result<AppConfigBackup, "invalid_config" | "storage_error">> {
	const parsed = parseBackup(input);
	if (!parsed.ok) {
		return parsed;
	}

	const config = parsed.data;

	try {
		saveFeatureSettings(config.features);
		if (config.weatherLocation) {
			saveLocation(config.weatherLocation);
		} else {
			clearLocation();
		}
		saveWaterSettings(config.waterSettings);
		saveWaterHistory(config.waterHistory);
		saveWallpaperSettings(config.wallpaperSettings);
		apiKeyRotator.replaceFromBackup(config.weatherApiKeys);

		if (config.wallpaperIncluded) {
			const wallpaperResult = await replaceStoredWallpaperBackup({
				imageUrl: config.wallpaperImage,
				palette: config.colorPalette,
			});
			if (!wallpaperResult.ok) {
				return wallpaperResult;
			}
		}

		return ok(config);
	} catch {
		return err("storage_error", "Failed to import config.");
	}
}
