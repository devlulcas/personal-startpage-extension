import { XIcon } from "@phosphor-icons/react";
import { createContext, type ReactNode, use, useState } from "react";
import {
	Dialog,
	DialogTrigger,
	Heading,
	Modal,
	ModalOverlay,
} from "react-aria-components";
import { createPortal } from "react-dom";
import { AppIconButton } from "../common/button";
import { ApiKeysSettingsSection } from "./api-keys-settings-section";
import { GeneralSettingsSection } from "./general-settings-section";
import styles from "./settings-dialog.module.css";
import { SettingsTabs } from "./settings-tabs";
import { ShortcutsSettingsSection } from "./shortcuts-settings-section";
import { WallpaperSettingsSection } from "./wallpaper-settings-section";
import { WaterSettingsSection } from "./water-settings-section";
import { WeatherSettingsSection } from "./weather-settings-section";

const tabs = [
	{
		id: "general" as const,
		label: "General",
		content: <GeneralSettingsSection />,
	},
	{
		id: "weather" as const,
		label: "Weather",
		content: <WeatherSettingsSection />,
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

const SettingsDialogContext = createContext<HTMLElement | null>(null);
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
	const [element, setElement] = useState<HTMLElement | null>(null);

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
			{children}
			<ModalOverlay className={styles.overlay} isDismissable>
				<Modal className={styles.modal}>
					<Dialog className={styles.dialog}>
						{({ close }) => (
							<SettingsDialogContext value={element}>
								<header className={styles.header}>
									<Heading slot="title" className={styles.title}>
										Settings
									</Heading>
									<AppIconButton onPress={close} aria-label="Close settings">
										<XIcon size={18} weight="bold" />
									</AppIconButton>
								</header>

								<div className={styles.body}>
									<SettingsTabs tabs={tabs} />
								</div>

								<footer
									ref={(el) => setElement(el)}
									className={styles.footer}
								/>
							</SettingsDialogContext>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}

function DialogFooterPortal({ children }: { children: React.ReactNode }) {
	const element = use(SettingsDialogContext);

	if (!element) {
		return null;
	}

	return createPortal(children, element);
}

SettingsDialog.FooterPortal = DialogFooterPortal;
