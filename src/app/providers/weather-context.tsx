import { createContext, useCallback, useContext, useMemo } from "react";
import type { LocationConfig } from "../../config/location";
import { useWeather } from "../../hooks/use-weather";
import type { WeatherData } from "../../services/weather-service";
import { useLocationContext } from "./location-context";

type WeatherContextValue = {
	weather: WeatherData | null;
	loading: boolean;
	errorMessage: string | null;
	refresh: (
		force?: boolean,
		overrideLocation?: LocationConfig,
	) => Promise<void>;
};

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
	const { location } = useLocationContext();
	const {
		weather,
		loading,
		errorMessage,
		refresh: refreshWeather,
	} = useWeather(location);

	const refresh = useCallback(
		async (force = false, overrideLocation?: LocationConfig) => {
			if (!location && !overrideLocation) {
				return;
			}

			await refreshWeather(force, overrideLocation);
		},
		[location, refreshWeather],
	);

	const value = useMemo<WeatherContextValue>(
		() => ({
			weather,
			loading,
			errorMessage,
			refresh,
		}),
		[errorMessage, loading, refresh, weather],
	);

	return (
		<WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
	);
}

export function useWeatherContext(): WeatherContextValue {
	const context = useContext(WeatherContext);
	if (!context) {
		throw new Error("useWeatherContext must be used within WeatherProvider.");
	}

	return context;
}
