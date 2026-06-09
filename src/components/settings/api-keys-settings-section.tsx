import { useEffect, useState } from "react";
import { useWeatherContext } from "../../app/providers/weather-context";
import { apiKeyRotator } from "../../config/api-keys";
import { AppButton } from "../common/button";
import { toaster } from "../toast/toast";
import {
	SettingsErrorMessage,
	SettingsField,
	SettingsSection,
} from "./settings-controls";
import { SettingsDialog } from "./settings-dialog";

export function ApiKeysSettingsSection() {
	const { refresh } = useWeatherContext();
	const [apiKeysInput, setApiKeysInput] = useState(() =>
		apiKeyRotator.getKeysInputValue(),
	);
	const [apiKeysErrorMessage, setApiKeysErrorMessage] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setApiKeysInput(apiKeyRotator.getKeysInputValue());
		setApiKeysErrorMessage(null);
	}, []);

	async function handleSaveApiKeys() {
		const parsedKeys = apiKeysInput
			.split(",")
			.map((key) => key.trim())
			.filter((key) => key.length > 0);
		if (parsedKeys.length === 0) {
			setApiKeysErrorMessage("Please provide at least one API key.");
			return;
		}

		apiKeyRotator.setKeysFromInput(apiKeysInput);
		setApiKeysInput(apiKeyRotator.getKeysInputValue());
		setApiKeysErrorMessage(null);
		await refresh(true);
		toaster.success("Weather API keys saved.");
	}

	return (
		<SettingsSection
			title="Weather API Keys"
			description="Enter one or more OpenWeather API keys separated by commas."
		>
			<SettingsField label="API Keys" htmlFor="weather-api-keys-input">
				<input
					id="weather-api-keys-input"
					type="text"
					value={apiKeysInput}
					onChange={(event) => {
						setApiKeysInput(event.currentTarget.value);
						setApiKeysErrorMessage(null);
					}}
					placeholder="key_1,key_2,key_3"
					autoComplete="off"
				/>
			</SettingsField>

			<SettingsErrorMessage message={apiKeysErrorMessage} />

			<SettingsDialog.FooterPortal>
				<AppButton variant="filled" onPress={handleSaveApiKeys}>
					Save API Keys
				</AppButton>
			</SettingsDialog.FooterPortal>
		</SettingsSection>
	);
}
