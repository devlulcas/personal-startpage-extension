import { createContext, useContext, useMemo, useState } from "react";
import {
	type FeatureSettings,
	getFeatureSettings,
	saveFeatureSettings,
} from "../../config/features";

type FeatureSettingsContextValue = {
	features: FeatureSettings;
	setFeatureEnabled: (feature: keyof FeatureSettings, enabled: boolean) => void;
	replaceFeatures: (features: FeatureSettings) => void;
};

const FeatureSettingsContext =
	createContext<FeatureSettingsContextValue | null>(null);

export function FeatureSettingsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [features, setFeatures] = useState(() => getFeatureSettings());

	const value = useMemo<FeatureSettingsContextValue>(
		() => ({
			features,
			setFeatureEnabled: (feature, enabled) => {
				setFeatures((current) => {
					const next = { ...current, [feature]: enabled };
					saveFeatureSettings(next);
					return next;
				});
			},
			replaceFeatures: (nextFeatures) => {
				saveFeatureSettings(nextFeatures);
				setFeatures(nextFeatures);
			},
		}),
		[features],
	);

	return (
		<FeatureSettingsContext.Provider value={value}>
			{children}
		</FeatureSettingsContext.Provider>
	);
}

export function useFeatureSettingsContext(): FeatureSettingsContextValue {
	const context = useContext(FeatureSettingsContext);
	if (!context) {
		throw new Error(
			"useFeatureSettingsContext must be used within FeatureSettingsProvider.",
		);
	}

	return context;
}
