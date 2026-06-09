import { useWallpaperContext } from "../../app/providers/wallpaper-context";
import styles from "./wallpaper.module.css";

export function Wallpaper({ children }: { children: React.ReactNode }) {
	const { wallpaperImage } = useWallpaperContext();

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
		</>
	);
}
