import { useEffect, useState } from "react";
import {
	useUpdateWaterSettingsMutation,
	useWaterSettings,
} from "../../hooks/use-water";
import { AppButton } from "../common/button";
import { toaster } from "../toast/toast";
import {
	SettingsErrorMessage,
	SettingsField,
	SettingsSection,
} from "./settings-controls";
import { SettingsDialog } from "./settings-dialog";

export function WaterSettingsSection() {
	const waterSettingsQuery = useWaterSettings();
	const updateWaterSettingsMutation = useUpdateWaterSettingsMutation();
	const [goalLitersInput, setGoalLitersInput] = useState("2");
	const [cupSizeInput, setCupSizeInput] = useState("250");
	const [waterErrorMessage, setWaterErrorMessage] = useState<string | null>(
		null,
	);

	useEffect(() => {
		if (!waterSettingsQuery.data) {
			return;
		}

		setGoalLitersInput(String(waterSettingsQuery.data.dailyGoalLiters));
		setCupSizeInput(String(waterSettingsQuery.data.cupSizeMl));
		setWaterErrorMessage(null);
	}, [waterSettingsQuery.data]);

	async function handleSaveWaterSettings() {
		const dailyGoalLiters = Number(goalLitersInput);
		const cupSizeMl = Number(cupSizeInput);

		if (!Number.isFinite(dailyGoalLiters) || dailyGoalLiters <= 0) {
			setWaterErrorMessage("Daily goal must be greater than 0 liters.");
			return;
		}

		if (!Number.isFinite(cupSizeMl) || cupSizeMl <= 0) {
			setWaterErrorMessage("Cup size must be greater than 0 ml.");
			return;
		}

		try {
			await updateWaterSettingsMutation.mutateAsync({
				dailyGoalLiters,
				cupSizeMl,
			});
			setWaterErrorMessage(null);
			toaster.success("Water settings saved.");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to save water settings.";
			setWaterErrorMessage(message);
		}
	}

	return (
		<SettingsSection
			title="Water Tracker"
			description="Set your daily hydration goal and the cup size used by the progress cups."
		>
			<SettingsField label="Daily Goal (liters)" htmlFor="water-goal-input">
				<input
					id="water-goal-input"
					type="number"
					min={0.5}
					step={0.1}
					value={goalLitersInput}
					onChange={(event) => setGoalLitersInput(event.currentTarget.value)}
				/>
			</SettingsField>

			<SettingsField label="Cup Size (ml)" htmlFor="water-cup-size-input">
				<input
					id="water-cup-size-input"
					type="number"
					min={50}
					step={10}
					value={cupSizeInput}
					onChange={(event) => setCupSizeInput(event.currentTarget.value)}
				/>
			</SettingsField>

			<SettingsErrorMessage message={waterErrorMessage} />

			<SettingsDialog.FooterPortal>
				<AppButton variant="filled" onPress={handleSaveWaterSettings}>
					Save Water Settings
				</AppButton>
			</SettingsDialog.FooterPortal>
		</SettingsSection>
	);
}
