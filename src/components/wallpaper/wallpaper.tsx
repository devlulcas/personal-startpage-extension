import { useWallpaperContext } from "../../app/providers/wallpaper-context";
import { DragOverlay } from "../common/drag-overlay";
import styles from "./wallpaper.module.css";

export function Wallpaper({ children }: { children: React.ReactNode }) {
	const { isDraggingFile, wallpaperImage } = useWallpaperContext();

	return (
		<>
			{wallpaperImage && (
				<img
					src={wallpaperImage}
					alt="Wallpaper"
					className={styles.wallpaperImage}
				/>
			)}
			<div className={styles.backgroundBlur} />

			{children}

			<DragOverlay active={isDraggingFile} />
		</>
	);
}
