import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WaterSettings } from "../config/water";
import {
	getCurrentWeekWaterData,
	getHydrationSettings,
	getTodayWaterData,
	setTodayWaterByCupCount,
	updateHydrationSettings,
} from "../services/water-service";
import { queryKeys } from "./queryKeys";
import { resolveResult } from "./result-adapter";

export function useWaterSettings() {
	return useQuery({
		queryKey: queryKeys.waterSettings(),
		queryFn: () => resolveResult(getHydrationSettings()),
	});
}

export function useWaterToday() {
	return useQuery({
		queryKey: queryKeys.waterToday(),
		queryFn: () => resolveResult(getTodayWaterData()),
	});
}

export function useWaterWeek() {
	return useQuery({
		queryKey: queryKeys.waterWeek(),
		queryFn: () => resolveResult(getCurrentWeekWaterData()),
	});
}

export function useSetTodayCupCountMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (cupCount: number) =>
			resolveResult(setTodayWaterByCupCount(cupCount)),
		onSuccess: (todayData) => {
			queryClient.setQueryData(queryKeys.waterToday(), todayData);
			queryClient.invalidateQueries({ queryKey: queryKeys.waterWeek() });
		},
	});
}

export function useUpdateWaterSettingsMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (settings: WaterSettings) =>
			resolveResult(updateHydrationSettings(settings)),
		onSuccess: async (settings) => {
			queryClient.setQueryData(queryKeys.waterSettings(), settings);

			// Refresh dependent water views immediately after settings change.
			await Promise.all([
				queryClient.fetchQuery({
					queryKey: queryKeys.waterToday(),
					queryFn: () => resolveResult(getTodayWaterData()),
				}),
				queryClient.fetchQuery({
					queryKey: queryKeys.waterWeek(),
					queryFn: () => resolveResult(getCurrentWeekWaterData()),
				}),
			]);

			queryClient.invalidateQueries({ queryKey: ["water", "today"] });
			queryClient.invalidateQueries({ queryKey: ["water", "week"] });
		},
	});
}
