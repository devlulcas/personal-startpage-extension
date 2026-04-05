import { AppearanceProvider } from "./AppearanceContext";
import { BookmarksProvider } from "./BookmarksContext";
import { LocationProvider } from "./LocationContext";
import { QueryProvider } from "./QueryProvider";
import { WallpaperProvider } from "./WallpaperContext";
import { WeatherProvider } from "./WeatherContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<QueryProvider>
			<AppearanceProvider>
				<LocationProvider>
					<WallpaperProvider>
						<BookmarksProvider>
							<WeatherProvider>{children}</WeatherProvider>
						</BookmarksProvider>
					</WallpaperProvider>
				</LocationProvider>
			</AppearanceProvider>
		</QueryProvider>
	);
}
