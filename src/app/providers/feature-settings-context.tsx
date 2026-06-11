import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { toaster } from "../../components/toast/toast";
import {
	type FeatureSettings,
	getFeatureSettings,
	saveFeatureSettings,
} from "../../config/features";

type FeatureSettingsContextValue = {
	features: FeatureSettings;
	setFeatureEnabled: (
		feature: keyof FeatureSettings,
		enabled: boolean,
	) => boolean;
	replaceFeatures: (features: FeatureSettings) => boolean;
};

const FeatureSettingsContext =
	createContext<FeatureSettingsContextValue | null>(null);

export function FeatureSettingsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [features, setFeatures] = useState(() => getFeatureSettings());

	const persistFeatures = useCallback((next: FeatureSettings) => {
		try {
			saveFeatureSettings(next);
			setFeatures(next);
			return true;
		} catch (error) {
			toaster.error(
				error instanceof Error
					? error.message
					: "Failed to save feature settings.",
			);
			return false;
		}
	}, []);

	const setFeatureEnabled = useCallback(
		(feature: keyof FeatureSettings, enabled: boolean) => {
			return persistFeatures({ ...features, [feature]: enabled });
		},
		[features, persistFeatures],
	);

	const replaceFeatures = useCallback(
		(nextFeatures: FeatureSettings) => {
			return persistFeatures(nextFeatures);
		},
		[persistFeatures],
	);

	const value = useMemo<FeatureSettingsContextValue>(
		() => ({
			features,
			setFeatureEnabled,
			replaceFeatures,
		}),
		[features, replaceFeatures, setFeatureEnabled],
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
