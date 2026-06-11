import { useState } from "react";
import {
	getObsidianNotesSettings,
	saveObsidianNotesSettings,
} from "../../config/notes";
import { AppButton } from "../common/button";
import { Slider } from "../common/slider";
import { toaster } from "../toast/toast";
import { SettingsField, SettingsSection } from "./settings-controls";
import { SettingsDialog } from "./settings-dialog";

export function NotesSettingsSection() {
	const [settings, setSettings] = useState(() => getObsidianNotesSettings());

	function handleSave() {
		try {
			saveObsidianNotesSettings(settings);
			toaster.success("Notes settings saved.");
		} catch (error) {
			toaster.error(
				error instanceof Error
					? error.message
					: "Failed to save notes settings.",
			);
		}
	}

	return (
		<SettingsSection
			title="Notes"
			description="Choose where manual Obsidian exports should create Markdown files."
		>
			<SettingsField label="Obsidian Vault" htmlFor="obsidian-vault-input">
				<input
					id="obsidian-vault-input"
					value={settings.vault}
					onChange={(event) =>
						setSettings((currentSettings) => ({
							...currentSettings,
							vault: event.currentTarget.value,
						}))
					}
					placeholder="Personal"
					autoComplete="off"
				/>
			</SettingsField>

			<SettingsField label="Vault Folder" htmlFor="obsidian-folder-input">
				<input
					id="obsidian-folder-input"
					value={settings.folder}
					onChange={(event) =>
						setSettings((currentSettings) => ({
							...currentSettings,
							folder: event.currentTarget.value,
						}))
					}
					placeholder="Inbox/StartPage"
					autoComplete="off"
				/>
			</SettingsField>

			<Slider
				label="Glass Transparency"
				minValue={0}
				maxValue={90}
				step={1}
				value={settings.glassTransparency}
				onChange={(value) =>
					setSettings((currentSettings) => ({
						...currentSettings,
						glassTransparency: value,
					}))
				}
				formatOptions={{ style: "unit", unit: "percent" }}
			/>

			<Slider
				label="Strong Glass Transparency"
				minValue={0}
				maxValue={90}
				step={1}
				value={settings.glassTransparencyStrong}
				onChange={(value) =>
					setSettings((currentSettings) => ({
						...currentSettings,
						glassTransparencyStrong: value,
					}))
				}
				formatOptions={{ style: "unit", unit: "percent" }}
			/>

			<Slider
				label="Soft Glass Transparency"
				minValue={0}
				maxValue={90}
				step={1}
				value={settings.glassTransparencySoft}
				onChange={(value) =>
					setSettings((currentSettings) => ({
						...currentSettings,
						glassTransparencySoft: value,
					}))
				}
				formatOptions={{ style: "unit", unit: "percent" }}
			/>

			<SettingsDialog.FooterPortal>
				<AppButton onPress={handleSave}>Save Notes Settings</AppButton>
			</SettingsDialog.FooterPortal>
		</SettingsSection>
	);
}
