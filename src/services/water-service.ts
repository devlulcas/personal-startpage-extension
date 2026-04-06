import {
	getWaterHistory,
	getWaterSettings,
	saveWaterHistory,
	saveWaterSettings,
	type WaterSettings,
} from "../config/water";
import { err, ok, type Result } from "../types/result";

type WeeklyWaterDay = {
	dateKey: string;
	label: string;
	consumedLiters: number;
};

type WeeklyWaterData = {
	days: WeeklyWaterDay[];
	goalLiters: number;
};

type TodayWaterData = {
	dateKey: string;
	consumedLiters: number;
	goalLiters: number;
	cupSizeMl: number;
	totalCups: number;
	consumedCups: number;
};

function toDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function toWeekdayLabel(date: Date): string {
	return date.toLocaleDateString(undefined, { weekday: "short" });
}

function getStartOfWeekMonday(reference: Date): Date {
	const date = new Date(reference);
	date.setHours(0, 0, 0, 0);

	const day = date.getDay();
	const offset = day === 0 ? -6 : 1 - day;
	date.setDate(date.getDate() + offset);
	return date;
}

function roundToTwo(value: number): number {
	return Math.round(value * 100) / 100;
}

function getConsumedLitersByDate(dateKey: string): number {
	const history = getWaterHistory();
	return history[dateKey] ?? 0;
}

function validateWaterSettings(
	settings: WaterSettings,
): Result<null, "invalid_settings"> {
	if (
		!Number.isFinite(settings.dailyGoalLiters) ||
		settings.dailyGoalLiters <= 0
	) {
		return err(
			"invalid_settings",
			"Daily goal must be a number greater than zero.",
		);
	}

	if (!Number.isFinite(settings.cupSizeMl) || settings.cupSizeMl <= 0) {
		return err(
			"invalid_settings",
			"Cup size must be a number greater than zero.",
		);
	}

	return ok(null);
}

function toTotalCups(goalLiters: number, cupSizeMl: number): number {
	const cups = Math.ceil((goalLiters * 1000) / cupSizeMl);
	return Math.max(1, Math.min(cups, 24));
}

export async function getHydrationSettings(): Promise<
	Result<WaterSettings, "storage_error">
> {
	try {
		return ok(getWaterSettings());
	} catch {
		return err("storage_error", "Failed to load water settings.");
	}
}

export async function updateHydrationSettings(
	settings: WaterSettings,
): Promise<Result<WaterSettings, "invalid_settings" | "storage_error">> {
	const validation = validateWaterSettings(settings);
	if (!validation.ok) {
		return validation;
	}

	try {
		saveWaterSettings(settings);
		return ok(getWaterSettings());
	} catch {
		return err("storage_error", "Failed to save water settings.");
	}
}

export async function getTodayWaterData(
	referenceDate = new Date(),
): Promise<Result<TodayWaterData, "storage_error">> {
	try {
		const settings = getWaterSettings();
		const dateKey = toDateKey(referenceDate);
		const consumedLiters = getConsumedLitersByDate(dateKey);
		const totalCups = toTotalCups(settings.dailyGoalLiters, settings.cupSizeMl);
		const litersPerCup = settings.cupSizeMl / 1000;
		const consumedCups = Math.round(consumedLiters / litersPerCup);

		return ok({
			dateKey,
			consumedLiters,
			goalLiters: settings.dailyGoalLiters,
			cupSizeMl: settings.cupSizeMl,
			totalCups,
			consumedCups: Math.max(0, Math.min(consumedCups, totalCups)),
		});
	} catch {
		return err("storage_error", "Failed to load today's water data.");
	}
}

export async function setTodayWaterByCupCount(
	cupCount: number,
	referenceDate = new Date(),
): Promise<Result<TodayWaterData, "invalid_amount" | "storage_error">> {
	if (!Number.isInteger(cupCount) || cupCount < 0) {
		return err(
			"invalid_amount",
			"Water cup amount must be a positive integer.",
		);
	}

	try {
		const settings = getWaterSettings();
		const totalCups = toTotalCups(settings.dailyGoalLiters, settings.cupSizeMl);
		const safeCupCount = Math.min(cupCount, totalCups);
		const consumedLiters = roundToTwo(
			(safeCupCount * settings.cupSizeMl) / 1000,
		);
		const dateKey = toDateKey(referenceDate);

		const history = getWaterHistory();
		history[dateKey] = consumedLiters;
		saveWaterHistory(history);

		return ok({
			dateKey,
			consumedLiters,
			goalLiters: settings.dailyGoalLiters,
			cupSizeMl: settings.cupSizeMl,
			totalCups,
			consumedCups: safeCupCount,
		});
	} catch {
		return err("storage_error", "Failed to save today's water amount.");
	}
}

export async function getCurrentWeekWaterData(
	referenceDate = new Date(),
): Promise<Result<WeeklyWaterData, "storage_error">> {
	try {
		const settings = getWaterSettings();
		const history = getWaterHistory();
		const start = getStartOfWeekMonday(referenceDate);
		const days: WeeklyWaterDay[] = [];

		for (let index = 0; index < 7; index += 1) {
			const date = new Date(start);
			date.setDate(start.getDate() + index);

			const dateKey = toDateKey(date);
			days.push({
				dateKey,
				label: toWeekdayLabel(date),
				consumedLiters: history[dateKey] ?? 0,
			});
		}

		return ok({
			days,
			goalLiters: settings.dailyGoalLiters,
		});
	} catch {
		return err("storage_error", "Failed to load current week water data.");
	}
}
