import { createContext, useCallback, useContext, useMemo } from "react";
import { toaster } from "../../components/toast/toast";
import { useWallpaperPaste } from "../../hooks/use-wallpaper-drop";
import { useWallpaperStorage } from "../../hooks/use-wallpaper-storage";

type WallpaperContextValue = {
	wallpaperImage: string | null;
	loading: boolean;
	setWallpaperFromFile: (file: File) => Promise<void>;
	clearWallpaper: () => Promise<void>;
};

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
	const {
		wallpaperImage,
		loading,
		setWallpaperFromFile: persistWallpaper,
		clearWallpaper: clearWallpaperStorage,
	} = useWallpaperStorage();

	const setWallpaperFromFile = useCallback(
		async (file: File) => {
			try {
				await persistWallpaper(file);
				toaster.success("Wallpaper updated.");
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to save wallpaper.";
				toaster.error(message);
			}
		},
		[persistWallpaper],
	);

	const clearWallpaper = useCallback(async () => {
		try {
			await clearWallpaperStorage();
			toaster.success("Wallpaper reset.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to reset wallpaper.";
			toaster.error(message);
		}
	}, [clearWallpaperStorage]);

	useWallpaperPaste({
		onImagePasted: setWallpaperFromFile,
	});

	const value = useMemo<WallpaperContextValue>(
		() => ({
			wallpaperImage,
			loading,
			setWallpaperFromFile,
			clearWallpaper,
		}),
		[clearWallpaper, loading, setWallpaperFromFile, wallpaperImage],
	);

	return (
		<WallpaperContext.Provider value={value}>
			{children}
		</WallpaperContext.Provider>
	);
}

export function useWallpaperContext(): WallpaperContextValue {
	const context = useContext(WallpaperContext);
	if (!context) {
		throw new Error(
			"useWallpaperContext must be used within WallpaperProvider.",
		);
	}

	return context;
}
