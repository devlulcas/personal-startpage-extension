import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocationContext } from "../../app/providers/location-context";
import { useWeatherContext } from "../../app/providers/weather-context";
import type { LocationConfig } from "../../config/location";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { queryKeys } from "../../queries/query-keys";
import { resolveResult } from "../../queries/result-adapter";
import { persistLocation } from "../../services/location-service";
import { geocodeCity } from "../../services/weather-service";
import { AppButton } from "../common/button";
import { toaster } from "../toast/toast";
import {
	SettingsErrorMessage,
	SettingsField,
	SettingsSection,
} from "./settings-controls";
import { SettingsDialog } from "./settings-dialog";
import styles from "./weather-settings-section.module.css";

export function WeatherSettingsSection() {
	const { refresh } = useWeatherContext();
	const { location, setLocation } = useLocationContext();
	const [cityQuery, setCityQuery] = useState(location?.city ?? "");
	const debouncedCity = useDebouncedValue(cityQuery, 500);
	const shouldResolveCity = debouncedCity.trim().length >= 2;
	const geocodeQuery = useQuery({
		queryKey: queryKeys.geocode(debouncedCity),
		queryFn: () => resolveResult(geocodeCity(debouncedCity)),
		enabled: shouldResolveCity,
	});

	const pendingGeo = useMemo(() => {
		if (!shouldResolveCity) {
			return location
				? {
						city: location.city,
						lat: location.latitude,
						lon: location.longitude,
						country: location.country,
					}
				: null;
		}

		if (!geocodeQuery.data) {
			return null;
		}

		return {
			city: geocodeQuery.data.name,
			lat: geocodeQuery.data.lat,
			lon: geocodeQuery.data.lon,
			country: geocodeQuery.data.country,
		};
	}, [geocodeQuery.data, location, shouldResolveCity]);

	const errorMessage = useMemo(() => {
		if (geocodeQuery.error instanceof Error) {
			return geocodeQuery.error.message;
		}

		return null;
	}, [geocodeQuery.error]);

	const canSave = pendingGeo !== null;

	const handleSave = async () => {
		if (!pendingGeo) {
			return;
		}

		const nextLocation: LocationConfig = {
			city: pendingGeo.city,
			latitude: pendingGeo.lat,
			longitude: pendingGeo.lon,
			country: pendingGeo.country,
		};

		const saveResult = persistLocation(nextLocation);
		if (!saveResult.ok) {
			toaster.error(saveResult.message);
			return;
		}

		setLocation(nextLocation);
		await refresh(true, nextLocation);
		toaster.success("Settings saved.");
		close();
	};

	return (
		<SettingsSection title="Weather Location">
			<SettingsField label="City Name" htmlFor="city-input">
				<input
					id="city-input"
					value={cityQuery}
					onChange={(event) => setCityQuery(event.currentTarget.value)}
					placeholder="Enter city name"
					autoComplete="off"
				/>
			</SettingsField>

			{pendingGeo && (
				<div className={styles.preview}>
					<span>{pendingGeo.city}</span>
					<span>
						{pendingGeo.lat.toFixed(4)}, {pendingGeo.lon.toFixed(4)}
					</span>
				</div>
			)}

			<SettingsErrorMessage message={errorMessage} />

			<SettingsDialog.FooterPortal>
				<AppButton onPress={handleSave} isDisabled={!canSave}>
					Save Weather Settings
				</AppButton>
			</SettingsDialog.FooterPortal>
		</SettingsSection>
	);
}
