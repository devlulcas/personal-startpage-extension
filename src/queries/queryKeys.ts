import type { LocationConfig } from "../config/location";

function toLocationKey(location: LocationConfig): string {
	return `${location.latitude}:${location.longitude}`;
}

function toDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function toCurrentWeekKey(date: Date): string {
	const next = new Date(date);
	next.setHours(0, 0, 0, 0);

	const day = next.getDay();
	const offset = day === 0 ? -6 : 1 - day;
	next.setDate(next.getDate() + offset);
	return toDateKey(next);
}

export const queryKeys = {
	weather: (location: LocationConfig | null) =>
		["weather", location ? toLocationKey(location) : "no-location"] as const,
	geocode: (city: string) => ["geocode", city.trim().toLowerCase()] as const,
	bookmarks: () => ["bookmarks"] as const,
	wallpaper: () => ["wallpaper"] as const,
	waterSettings: () => ["water", "settings"] as const,
	waterToday: (date = new Date()) =>
		["water", "today", toDateKey(date)] as const,
	waterWeek: (date = new Date()) =>
		["water", "week", toCurrentWeekKey(date)] as const,
};
