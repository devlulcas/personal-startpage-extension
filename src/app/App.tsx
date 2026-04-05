import { GearSixIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "react-aria-components";
import { Bookmarks } from "../components/bookmark/Bookmarks";
import { Clock } from "../components/clock/Clock";
import { DragOverlay } from "../components/common/DragOverlay";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { SearchBar } from "../components/search/SearchBar";
import { Shortcuts } from "../components/search/Shortcuts";
import { SettingsDialog } from "../components/settings/SettingsDialog";
import { WaterTracker } from "../components/water/WaterTracker";
import { WeatherWidget } from "../components/weather/WeatherWidget";
import { toaster } from "../utils/toast";
import styles from "./App.module.css";
import { useWallpaperContext } from "./providers/WallpaperContext";

function ErrorFallback() {
	return (
		<div className={styles.errorFallback}>
			Something went wrong while rendering the page.
		</div>
	);
}

export function App() {
	const { isDraggingFile, wallpaperImage } = useWallpaperContext();
	const [settingsOpen, setSettingsOpen] = useState(false);

	useEffect(() => {
		function onUnhandledRejection(event: PromiseRejectionEvent) {
			const reason =
				event.reason instanceof Error
					? event.reason.message
					: "Unexpected async error";
			toaster.error(reason);
		}

		window.addEventListener("unhandledrejection", onUnhandledRejection);

		return () => {
			window.removeEventListener("unhandledrejection", onUnhandledRejection);
		};
	}, []);

	return (
		<ErrorBoundary fallback={<ErrorFallback />}>
			{wallpaperImage && (
				<img
					src={wallpaperImage}
					alt="Wallpaper"
					className={styles.wallpaperImage}
				/>
			)}
			<div className={styles.backgroundBlur} />

			<div className={styles.topLeftWidget}>
				<WaterTracker />
			</div>

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
				<Clock />

				<WeatherWidget onOpenSettings={() => setSettingsOpen(true)} />

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

			<DragOverlay active={isDraggingFile} />
		</ErrorBoundary>
	);
}
