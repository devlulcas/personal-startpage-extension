import { GearSixIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "react-aria-components";
import { Bookmarks } from "../components/bookmark/bookmarks";
import { Clock } from "../components/clock/clock";
import { DragOverlay } from "../components/common/drag-overlay";
import { ErrorBoundary } from "../components/common/error-boundary";
import { SearchBar } from "../components/search/search-bar";
import { Shortcuts } from "../components/search/shortcuts";
import { SettingsDialog } from "../components/settings/settings-dialog";
import { toaster } from "../components/toast/toast";
import { WaterTracker } from "../components/water/water-tracker";
import { WeatherWidget } from "../components/weather/weather-widget";
import styles from "./app.module.css";
import { useWallpaperContext } from "./providers/wallpaper-context";

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
				<button
					type="button"
					onClick={() => {
						toaster.success("Test");
					}}
				>
					Test
				</button>
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
