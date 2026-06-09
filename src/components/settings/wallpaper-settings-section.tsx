import { UploadSimpleIcon } from "@phosphor-icons/react";
import { type DragEvent, useRef, useState } from "react";
import { useAppearanceContext } from "../../app/providers/appearance-context";
import { useWallpaperContext } from "../../app/providers/wallpaper-context";
import { AppButton } from "../common/button";
import { Slider } from "../common/slider";
import { SettingsSection } from "./settings-controls";
import { SettingsDialog } from "./settings-dialog";
import styles from "./wallpaper-settings-section.module.css";

export function WallpaperSettingsSection() {
	const { clearWallpaper, setWallpaperFromFile } = useWallpaperContext();
	const { blur, setBlur } = useAppearanceContext();
	const [isWallpaperDropActive, setIsWallpaperDropActive] = useState(false);
	const wallpaperDragDepth = useRef(0);

	async function handleResetWallpaper() {
		await clearWallpaper();
	}

	function hasDraggedFiles(event: DragEvent<HTMLElement>) {
		return event.dataTransfer.types.includes("Files");
	}

	function handleWallpaperDragEnter(event: DragEvent<HTMLElement>) {
		if (!hasDraggedFiles(event)) {
			return;
		}

		event.preventDefault();
		wallpaperDragDepth.current += 1;
		setIsWallpaperDropActive(true);
	}

	function handleWallpaperDragOver(event: DragEvent<HTMLElement>) {
		if (!hasDraggedFiles(event)) {
			return;
		}

		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
	}

	function handleWallpaperDragLeave(event: DragEvent<HTMLElement>) {
		if (!hasDraggedFiles(event)) {
			return;
		}

		event.preventDefault();
		wallpaperDragDepth.current = Math.max(0, wallpaperDragDepth.current - 1);
		if (wallpaperDragDepth.current === 0) {
			setIsWallpaperDropActive(false);
		}
	}

	async function handleWallpaperDrop(event: DragEvent<HTMLElement>) {
		if (!hasDraggedFiles(event)) {
			return;
		}

		event.preventDefault();
		wallpaperDragDepth.current = 0;
		setIsWallpaperDropActive(false);

		const imageFile = Array.from(event.dataTransfer.files).find((file) =>
			file.type.startsWith("image/"),
		);
		if (!imageFile) {
			return;
		}

		await setWallpaperFromFile(imageFile);
	}

	return (
		<SettingsSection
			title="Wallpaper"
			description="Drop an image in the wallpaper zone to set it as your background."
		>
			<section
				className={
					isWallpaperDropActive
						? styles.wallpaperDropZoneActive
						: styles.wallpaperDropZone
				}
				aria-label="Wallpaper image drop zone"
				onDragEnter={handleWallpaperDragEnter}
				onDragOver={handleWallpaperDragOver}
				onDragLeave={handleWallpaperDragLeave}
				onDrop={handleWallpaperDrop}
			>
				<UploadSimpleIcon
					size={30}
					weight="duotone"
					className={styles.wallpaperDropIcon}
				/>
				<div className={styles.wallpaperDropText}>
					<strong>
						{isWallpaperDropActive ? "Drop image here" : "Drag an image here"}
					</strong>
					<span>Set it as your wallpaper</span>
				</div>
			</section>

			<div className={styles.sliderField}>
				<Slider
					label={`Background Blur (${blur}px)`}
					minValue={0}
					maxValue={32}
					step={2}
					value={blur}
					onChange={setBlur}
					className={styles.blurSlider}
				/>
			</div>

			<SettingsDialog.FooterPortal>
				<AppButton variant="filled" onPress={handleResetWallpaper}>
					Reset Wallpaper
				</AppButton>
			</SettingsDialog.FooterPortal>
		</SettingsSection>
	);
}
