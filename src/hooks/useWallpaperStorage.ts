import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "../queries/queryKeys";
import { resolveResult } from "../queries/result-adapter";
import {
	loadWallpaper,
	resetWallpaper,
	saveWallpaper,
} from "../services/wallpaper-storage-service";

export function useWallpaperStorage() {
	const queryClient = useQueryClient();
	const wallpaperQuery = useQuery({
		queryKey: queryKeys.wallpaper(),
		queryFn: () => resolveResult(loadWallpaper()),
		staleTime: Number.POSITIVE_INFINITY,
	});

	const saveWallpaperMutation = useMutation({
		mutationFn: (file: File) => resolveResult(saveWallpaper(file)),
		onSuccess: (wallpaper) => {
			queryClient.setQueryData(queryKeys.wallpaper(), wallpaper);
		},
	});

	const resetWallpaperMutation = useMutation({
		mutationFn: () => resolveResult(resetWallpaper()),
		onSuccess: () => {
			queryClient.setQueryData(queryKeys.wallpaper(), {
				imageUrl: null,
				palette: null,
			});
		},
	});

	const setWallpaperFromFile = useCallback(
		async (file: File) => {
			await saveWallpaperMutation.mutateAsync(file);
		},
		[saveWallpaperMutation],
	);

	const clearWallpaper = useCallback(async () => {
		await resetWallpaperMutation.mutateAsync();
	}, [resetWallpaperMutation]);

	return {
		wallpaperImage: wallpaperQuery.data?.imageUrl ?? null,
		loading: wallpaperQuery.isPending,
		setWallpaperFromFile,
		clearWallpaper,
	};
}
