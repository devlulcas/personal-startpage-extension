import { XIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import {
	Dialog,
	DialogTrigger,
	Heading,
	Modal,
	ModalOverlay,
} from "react-aria-components";
import { AppIconButton } from "../common/button";
import styles from "./settings-dialog.module.css";
import {
	ApiKeysSettingsSection,
	GeneralSettingsSection,
	ShortcutsSettingsSection,
	WallpaperSettingsSection,
	WaterSettingsSection,
	WeatherSettingsSection,
} from "./settings-sections";
import { SettingsTabs } from "./settings-tabs";

type SettingsDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
};

export function SettingsDialog({
	isOpen,
	onOpenChange,
	children,
}: SettingsDialogProps) {
	const tabs = [
		{
			id: "general" as const,
			label: "General",
			content: <GeneralSettingsSection />,
		},
		{
			id: "weather" as const,
			label: "Weather",
			content: null,
		},
		{
			id: "shortcuts" as const,
			label: "Shortcuts",
			content: <ShortcutsSettingsSection />,
		},
		{
			id: "wallpaper" as const,
			label: "Wallpaper",
			content: <WallpaperSettingsSection />,
		},
		{
			id: "water" as const,
			label: "Water",
			content: <WaterSettingsSection />,
		},
		{
			id: "apiKeys" as const,
			label: "API Keys",
			content: <ApiKeysSettingsSection />,
		},
	];

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
			{children}
			<ModalOverlay className={styles.overlay} isDismissable>
				<Modal className={styles.modal}>
					<Dialog className={styles.dialog}>
						{({ close }) => (
							<>
								<header className={styles.header}>
									<Heading slot="title" className={styles.title}>
										Settings
									</Heading>
									<AppIconButton onPress={close} aria-label="Close settings">
										<XIcon size={18} weight="bold" />
									</AppIconButton>
								</header>

								<div className={styles.body}>
									<SettingsTabs
										tabs={tabs.map((tab) =>
											tab.id === "weather"
												? {
														...tab,
														content: <WeatherSettingsSection close={close} />,
													}
												: tab,
										)}
									/>
								</div>
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}
