export interface WaterSettings {
	dailyGoalLiters: number;
	cupSizeMl: number;
}

type WaterHistory = Record<string, number>;

const WATER_SETTINGS_KEY = "water_settings";
const WATER_HISTORY_KEY = "water_history";
const MIN_DAILY_GOAL_LITERS = 0.5;
const MAX_DAILY_GOAL_LITERS = 10;
const MIN_CUP_SIZE_ML = 50;
const MAX_CUP_SIZE_ML = 2000;

const DEFAULT_WATER_SETTINGS: WaterSettings = {
	dailyGoalLiters: 2,
	cupSizeMl: 250,
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function isFinitePositive(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function normalizeWaterSettings(input: unknown): WaterSettings {
	if (!input || typeof input !== "object") {
		return { ...DEFAULT_WATER_SETTINGS };
	}

	const raw = input as Partial<WaterSettings>;
	const goal = isFinitePositive(raw.dailyGoalLiters)
		? raw.dailyGoalLiters
		: DEFAULT_WATER_SETTINGS.dailyGoalLiters;
	const cup = isFinitePositive(raw.cupSizeMl)
		? raw.cupSizeMl
		: DEFAULT_WATER_SETTINGS.cupSizeMl;

	return {
		dailyGoalLiters: clamp(goal, MIN_DAILY_GOAL_LITERS, MAX_DAILY_GOAL_LITERS),
		cupSizeMl: clamp(cup, MIN_CUP_SIZE_ML, MAX_CUP_SIZE_ML),
	};
}

export function getWaterSettings(): WaterSettings {
	const stored = localStorage.getItem(WATER_SETTINGS_KEY);
	if (!stored) {
		return { ...DEFAULT_WATER_SETTINGS };
	}

	try {
		return normalizeWaterSettings(JSON.parse(stored));
	} catch {
		return { ...DEFAULT_WATER_SETTINGS };
	}
}

export function saveWaterSettings(settings: WaterSettings): void {
	const normalized = normalizeWaterSettings(settings);
	localStorage.setItem(WATER_SETTINGS_KEY, JSON.stringify(normalized));
}

function normalizeWaterHistory(input: unknown): WaterHistory {
	if (!input || typeof input !== "object") {
		return {};
	}

	const next: WaterHistory = {};
	for (const [dateKey, consumed] of Object.entries(input as WaterHistory)) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
			continue;
		}

		if (!Number.isFinite(consumed) || consumed < 0) {
			continue;
		}

		next[dateKey] = clamp(consumed, 0, MAX_DAILY_GOAL_LITERS * 3);
	}

	return next;
}

export function getWaterHistory(): WaterHistory {
	const stored = localStorage.getItem(WATER_HISTORY_KEY);
	if (!stored) {
		return {};
	}

	try {
		return normalizeWaterHistory(JSON.parse(stored));
	} catch {
		return {};
	}
}

export function saveWaterHistory(history: WaterHistory): void {
	const normalized = normalizeWaterHistory(history);
	localStorage.setItem(WATER_HISTORY_KEY, JSON.stringify(normalized));
}
