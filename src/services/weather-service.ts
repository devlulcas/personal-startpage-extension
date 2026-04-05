import { apiKeyRotator } from "../config/api-keys";
import type { LocationConfig } from "../config/location";
import { err, ok, type Result } from "../types/result";

export interface WeatherData {
	temperature: number;
	feelsLike: number;
	humidity: number;
	windSpeed: number;
	description: string;
	icon: string;
	location: string;
	units: "metric" | "imperial";
}

interface OpenWeatherResponse {
	main: {
		temp: number;
		feels_like: number;
		humidity: number;
	};
	wind: {
		speed: number;
	};
	weather: Array<{
		description: string;
		icon: string;
	}>;
	name: string;
}

interface GeocodingResponse {
	name: string;
	lat: number;
	lon: number;
	country: string;
	state?: string;
}

type WeatherError = "no_api_key" | "network_error" | "api_error";
type GeocodeError = "network_error" | "not_found";

const API_BASE = "https://api.openweathermap.org";
const CACHE_KEY = "weather_cache";
const CACHE_DURATION = 10 * 60 * 1000;

interface CacheEntry {
	data: WeatherData;
	timestamp: number;
	cacheKey: string;
}

function makeLocationCacheKey(location: LocationConfig): string {
	return `${location.latitude}:${location.longitude}:${location.units}`;
}

function getCache(): CacheEntry | null {
	const stored = localStorage.getItem(CACHE_KEY);
	if (!stored) return null;

	try {
		return JSON.parse(stored) as CacheEntry;
	} catch {
		return null;
	}
}

function setCache(data: WeatherData, cacheKey: string): void {
	const entry: CacheEntry = {
		data,
		timestamp: Date.now(),
		cacheKey,
	};
	localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

function isCacheValid(entry: CacheEntry, cacheKey: string): boolean {
	return (
		Date.now() - entry.timestamp < CACHE_DURATION && entry.cacheKey === cacheKey
	);
}

async function fetchWithRotation<T>(
	path: string,
	params: URLSearchParams,
): Promise<Result<T, WeatherError>> {
	const keys = apiKeyRotator.getAllKeys();
	if (keys.length === 0) {
		return err(
			"no_api_key",
			"No weather API key configured. Set VITE_WEATHER_API_KEY_1.",
		);
	}

	let attempts = 0;
	let lastErrorMessage = "Failed to fetch weather data.";

	while (attempts < keys.length) {
		const apiKey = apiKeyRotator.getCurrentKey();
		if (!apiKey) {
			return err("no_api_key", "No weather API key configured.");
		}

		const requestParams = new URLSearchParams(params);
		requestParams.set("appid", apiKey);

		try {
			const response = await fetch(
				`${API_BASE}${path}?${requestParams.toString()}`,
			);

			if (response.status === 401) {
				apiKeyRotator.getNextKey();
				attempts += 1;
				continue;
			}

			if (!response.ok) {
				const message = `OpenWeather request failed with status ${response.status}.`;
				return err("api_error", message);
			}

			const payload = (await response.json()) as T;
			return ok(payload);
		} catch {
			apiKeyRotator.getNextKey();
			attempts += 1;
			lastErrorMessage = "Network error while fetching weather.";
		}
	}

	return err("network_error", lastErrorMessage);
}

export async function geocodeCity(
	city: string,
): Promise<Result<GeocodingResponse, GeocodeError>> {
	const query = city.trim();
	if (!query) {
		return err("not_found", "Please enter a city name.");
	}

	const params = new URLSearchParams({ q: query, limit: "1" });
	const response = await fetchWithRotation<GeocodingResponse[]>(
		"/geo/1.0/direct",
		params,
	);

	if (!response.ok) {
		if (response.error === "no_api_key") {
			return err("network_error", response.message);
		}
		return err("network_error", response.message);
	}

	const firstResult = response.data[0];
	if (!firstResult) {
		return err("not_found", "Could not find this city.");
	}

	return ok(firstResult);
}

export async function getWeather(
	location: LocationConfig,
	forceRefresh = false,
): Promise<Result<WeatherData, WeatherError>> {
	const cacheKey = makeLocationCacheKey(location);
	const cached = getCache();

	if (!forceRefresh && cached && isCacheValid(cached, cacheKey)) {
		return ok(cached.data);
	}

	const params = new URLSearchParams({
		lat: String(location.latitude),
		lon: String(location.longitude),
		units: location.units,
	});

	const response = await fetchWithRotation<OpenWeatherResponse>(
		"/data/2.5/weather",
		params,
	);

	if (!response.ok) {
		if (cached?.data) {
			return ok(cached.data);
		}

		return response;
	}

	const weather = response.data;
	const normalized: WeatherData = {
		temperature: Math.round(weather.main.temp),
		feelsLike: Math.round(weather.main.feels_like),
		humidity: weather.main.humidity,
		windSpeed: Math.round(weather.wind.speed),
		description: weather.weather[0]?.description ?? "Unknown",
		icon: weather.weather[0]?.icon ?? "01d",
		location: weather.name,
		units: location.units,
	};

	setCache(normalized, cacheKey);
	return ok(normalized);
}
