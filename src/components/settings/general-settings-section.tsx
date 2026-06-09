import { UploadSimpleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useRef } from "react";
import { useAppearanceContext } from "../../app/providers/appearance-context";
import { useFeatureSettingsContext } from "../../app/providers/feature-settings-context";
import { useLocationContext } from "../../app/providers/location-context";
import { useShortcutsContext } from "../../app/providers/shortcuts-context";
import { useWeatherContext } from "../../app/providers/weather-context";
import { queryKeys } from "../../queries/query-keys";
import {
	buildConfigBackup,
	importConfigBackup,
} from "../../services/config-backup-service";
import {
	downloadJson,
	readFileAsText,
} from "../../services/config-file-service";
import { AppButton } from "../common/button";
import { toaster } from "../toast/toast";
import styles from "./general-settings-section.module.css";
import { FeatureToggle, SettingsSection } from "./settings-controls";
import { SettingsDialog } from "./settings-dialog";

export function GeneralSettingsSection() {
	const queryClient = useQueryClient();
	const { features, replaceFeatures, setFeatureEnabled } =
		useFeatureSettingsContext();
	const { setLocation } = useLocationContext();
	const { replaceShortcuts } = useShortcutsContext();
	const { setBlur } = useAppearanceContext();
	const { refresh } = useWeatherContext();
	const importInputRef = useRef<HTMLInputElement | null>(null);

	async function handleExportConfig() {
		const backupResult = await buildConfigBackup();
		if (!backupResult.ok) {
			toaster.error(backupResult.message);
			return;
		}

		downloadJson("startpage-config.json", backupResult.data);
		toaster.success("Config exported.");
	}

	function handleImportConfigButton() {
		importInputRef.current?.click();
	}

	async function handleImportConfig(event: ChangeEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = "";
		if (!file) {
			return;
		}

		try {
			const text = await readFileAsText(file);
			const payload = JSON.parse(text) as unknown;
			const importResult = await importConfigBackup(payload);
			if (!importResult.ok) {
				toaster.error(importResult.message);
				return;
			}

			const config = importResult.data;
			replaceFeatures(config.features);
			replaceShortcuts(config.shortcuts);
			setLocation(config.weatherLocation);
			setBlur(config.wallpaperSettings.blur);
			if (config.wallpaperIncluded) {
				queryClient.setQueryData(queryKeys.wallpaper(), {
					imageUrl: config.wallpaperImage,
					palette: config.colorPalette,
				});
			}
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.waterSettings() }),
				queryClient.invalidateQueries({ queryKey: ["water"] }),
				queryClient.invalidateQueries({ queryKey: queryKeys.wallpaper() }),
			]);
			await refresh(true, config.weatherLocation ?? undefined);
			toaster.success("Config imported.");
		} catch (error) {
			const message =
				error instanceof SyntaxError
					? "Config file must be valid JSON."
					: error instanceof Error
						? error.message
						: "Failed to import config.";
			toaster.error(message);
		}
	}

	return (
		<SettingsSection
			title="General"
			description="Choose which widgets are visible and manage your startpage backup."
		>
			<div className={styles.toggleList}>
				<FeatureToggle
					label="Water"
					checked={features.water}
					onChange={(checked) => setFeatureEnabled("water", checked)}
				/>
				<FeatureToggle
					label="Clock"
					checked={features.clock}
					onChange={(checked) => setFeatureEnabled("clock", checked)}
				/>
				<FeatureToggle
					label="Weather"
					checked={features.weather}
					onChange={(checked) => setFeatureEnabled("weather", checked)}
				/>
				<FeatureToggle
					label="Export Wallpaper"
					checked={features.includeWallpaperInExport}
					onChange={(checked) =>
						setFeatureEnabled("includeWallpaperInExport", checked)
					}
				/>
			</div>

			<SettingsDialog.FooterPortal>
				<AppButton variant="filled" onPress={handleExportConfig}>
					Export Config
				</AppButton>

				<AppButton variant="filled" onPress={handleImportConfigButton}>
					<UploadSimpleIcon size={16} weight="bold" />
					Import Config
				</AppButton>
				<input
					ref={importInputRef}
					type="file"
					accept="application/json,.json"
					onChange={handleImportConfig}
					className={styles.hiddenImportInput}
					aria-label="Import config file"
				/>
			</SettingsDialog.FooterPortal>
		</SettingsSection>
	);
}
