import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
	getWallpaperSettings,
	saveWallpaperSettings,
} from "../../config/wallpaper";

interface AppearanceContextValue {
	blur: number;
	setBlur: (blur: number) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [blur, setBlurState] = useState(() => getWallpaperSettings().blur);

	useEffect(() => {
		document.documentElement.style.setProperty("--wallpaper-blur", `${blur}px`);
		saveWallpaperSettings({ blur });
	}, [blur]);

	const value = useMemo<AppearanceContextValue>(
		() => ({
			blur,
			setBlur: setBlurState,
		}),
		[blur],
	);

	return (
		<AppearanceContext.Provider value={value}>
			{children}
		</AppearanceContext.Provider>
	);
}

export function useAppearanceContext(): AppearanceContextValue {
	const context = useContext(AppearanceContext);
	if (!context) {
		throw new Error(
			"useAppearanceContext must be used within AppearanceProvider.",
		);
	}

	return context;
}
