import type { ReactNode } from "react";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "react-aria-components";
import styles from "./settings-tabs.module.css";

type SettingsTabKey =
	| "general"
	| "weather"
	| "shortcuts"
	| "wallpaper"
	| "water"
	| "notes"
	| "apiKeys";

type SettingsTab = {
	id: SettingsTabKey;
	label: string;
	content: ReactNode;
};

type SettingsTabsProps = {
	tabs: SettingsTab[];
};

export function SettingsTabs({ tabs }: SettingsTabsProps) {
	return (
		<Tabs className={styles.tabs} defaultSelectedKey="general">
			<TabList aria-label="Settings sections" className={styles.tabList}>
				{tabs.map((tab) => (
					<Tab key={tab.id} id={tab.id} className={styles.tab}>
						<span className={styles.tabLabel}>{tab.label}</span>
					</Tab>
				))}
			</TabList>
			<TabPanels className={styles.tabPanels}>
				{tabs.map((tab) => (
					<TabPanel key={tab.id} id={tab.id} className={styles.tabPanel}>
						{tab.content}
					</TabPanel>
				))}
			</TabPanels>
		</Tabs>
	);
}
