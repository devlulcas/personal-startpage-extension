import { GearSixIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "react-aria-components";
import { Bookmarks } from "../components/bookmark/bookmarks";
import { Clock } from "../components/clock/clock";
import { ErrorBoundary } from "../components/common/error-boundary";
import { SearchBar } from "../components/search/search-bar";
import { Shortcuts } from "../components/search/shortcuts";
import { SettingsDialog } from "../components/settings/settings-dialog";
import { Wallpaper } from "../components/wallpaper/wallpaper";
import { WaterTracker } from "../components/water/water-tracker";
import { WeatherWidget } from "../components/weather/weather-widget";
import { useUnhandledRejectionHandler } from "../hooks/use-unhandled-rejection-handler";
import styles from "./app.module.css";
import { useFeatureSettingsContext } from "./providers/feature-settings-context";

function ErrorFallback() {
	return (
		<div className={styles.errorFallback}>
			Something went wrong while rendering the page.
		</div>
	);
}

export function App() {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const { features } = useFeatureSettingsContext();

	useUnhandledRejectionHandler();

	return (
		<ErrorBoundary fallback={<ErrorFallback />}>
			<Wallpaper>
				{features.water && (
					<div className={styles.topLeftWidget}>
						<WaterTracker />
					</div>
				)}

				<main className={styles.main}>
					<div className={styles.contentWrapper}>
						<section className={styles.bookmarksSection}>
							<Bookmarks />
						</section>

						<section className={styles.searchSection}>
							<SearchBar />
							<Shortcuts />
						</section>
					</div>
				</main>

				<footer className={styles.footer}>
					{features.clock && (
						<div className={styles.clockSlot}>
							<Clock />
						</div>
					)}

					{features.weather && (
						<WeatherWidget onOpenSettings={() => setSettingsOpen(true)} />
					)}

					<SettingsDialog isOpen={settingsOpen} onOpenChange={setSettingsOpen}>
						<Button
							type="button"
							className={styles.settingsButton}
							aria-label="Open settings"
						>
							<GearSixIcon size={22} weight="duotone" />
						</Button>
					</SettingsDialog>
				</footer>
			</Wallpaper>
		</ErrorBoundary>
	);
}
