import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { LocationConfig } from "../config/location";
import { queryKeys } from "../queries/queryKeys";
import { ResultQueryError, resolveResult } from "../queries/result-adapter";
import { getWeather, type WeatherData } from "../services/weather-service";

const WEATHER_STALE_TIME = 10 * 60 * 1000;

interface UseWeatherReturn {
	weather: WeatherData | null;
	loading: boolean;
	errorMessage: string | null;
	refresh: (
		force?: boolean,
		overrideLocation?: LocationConfig,
	) => Promise<void>;
}

export function useWeather(location: LocationConfig | null): UseWeatherReturn {
	const queryClient = useQueryClient();
	const queryKey = queryKeys.weather(location);
	const weatherQuery = useQuery({
		queryKey,
		queryFn: async () => {
			if (!location) {
				throw new ResultQueryError(
					"invalid_location",
					"Location is not configured.",
				);
			}

			return resolveResult(getWeather(location));
		},
		enabled: location !== null,
		staleTime: WEATHER_STALE_TIME,
	});

	const refresh = useCallback(
		async (force = false, overrideLocation?: LocationConfig) => {
			const targetLocation = overrideLocation ?? location;
			if (!targetLocation) {
				return;
			}

			if (force) {
				const nextWeather = await resolveResult(
					getWeather(targetLocation, true),
				);
				queryClient.setQueryData(
					queryKeys.weather(targetLocation),
					nextWeather,
				);
				return;
			}

			await queryClient.fetchQuery({
				queryKey: queryKeys.weather(targetLocation),
				queryFn: () => resolveResult(getWeather(targetLocation)),
				staleTime: WEATHER_STALE_TIME,
			});
		},
		[location, queryClient],
	);

	const errorMessage =
		weatherQuery.error instanceof Error ? weatherQuery.error.message : null;

	return {
		weather: weatherQuery.data ?? null,
		loading: weatherQuery.isLoading,
		errorMessage,
		refresh,
	};
}
