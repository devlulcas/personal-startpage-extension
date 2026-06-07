import { AppearanceProvider } from "./appearance-context";
import { BookmarksProvider } from "./bookmarks-context";
import { FeatureSettingsProvider } from "./feature-settings-context";
import { LocationProvider } from "./location-context";
import { QueryProvider } from "./query-provider";
import { ShortcutsProvider } from "./shortcuts-context";
import { WallpaperProvider } from "./wallpaper-context";
import { WeatherProvider } from "./weather-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<QueryProvider>
			<AppearanceProvider>
				<FeatureSettingsProvider>
					<LocationProvider>
						<WallpaperProvider>
							<BookmarksProvider>
								<ShortcutsProvider>
									<WeatherProvider>{children}</WeatherProvider>
								</ShortcutsProvider>
							</BookmarksProvider>
						</WallpaperProvider>
					</LocationProvider>
				</FeatureSettingsProvider>
			</AppearanceProvider>
		</QueryProvider>
	);
}
