export type LocationConfig = {
	city: string;
	latitude: number;
	longitude: number;
	country: string;
};

const STORAGE_KEY = "weather_location";

export function getStoredLocation(): LocationConfig | null {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return null;

	try {
		return JSON.parse(stored) as LocationConfig;
	} catch {
		return null;
	}
}

export function saveLocation(location: LocationConfig): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}
