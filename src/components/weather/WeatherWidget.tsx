import {
	CloudFogIcon,
	CloudIcon,
	CloudLightningIcon,
	CloudMoonIcon,
	CloudRainIcon,
	CloudSunIcon,
	MoonIcon,
	SnowflakeIcon,
	SunIcon,
} from "@phosphor-icons/react";
import { useEffect } from "react";
import { useWeatherContext } from "../../app/providers/WeatherContext";
import {
	getWeatherIconName,
	type WeatherIconName,
} from "../../services/weather-icons";
import { toaster } from "../../utils/toast";
import styles from "./WeatherWidget.module.css";

interface WeatherWidgetProps {
	onOpenSettings: () => void;
}

export function WeatherWidget({ onOpenSettings }: WeatherWidgetProps) {
	const { weather, loading, errorMessage } = useWeatherContext();
	const iconName = getWeatherIconName(weather?.icon ?? "01d");

	useEffect(() => {
		if (errorMessage) {
			toaster.error(errorMessage);
		}
	}, [errorMessage]);

	return (
		<div className={styles.weatherWidget}>
			<button
				type="button"
				className={styles.weatherIcon}
				onClick={onOpenSettings}
				aria-label="Open weather settings"
			>
				<WeatherIcon iconName={iconName} />
			</button>
			<div className={styles.weatherInfo}>
				<span className={styles.temperature}>
					{loading
						? "Loading..."
						: weather
							? `${weather.temperature}${weather.units === "metric" ? "°C" : "°F"}`
							: "--°"}
				</span>
				<span className={styles.location}>
					{weather?.location ?? "Configure location"}
				</span>
			</div>
		</div>
	);
}

function WeatherIcon({ iconName }: { iconName: WeatherIconName }) {
	switch (iconName) {
		case "moon":
			return <MoonIcon size={24} weight="duotone" />;
		case "cloud-sun":
			return <CloudSunIcon size={24} weight="duotone" />;
		case "cloud-moon":
			return <CloudMoonIcon size={24} weight="duotone" />;
		case "cloud":
			return <CloudIcon size={24} weight="duotone" />;
		case "cloud-rain":
			return <CloudRainIcon size={24} weight="duotone" />;
		case "cloud-lightning":
			return <CloudLightningIcon size={24} weight="duotone" />;
		case "snowflake":
			return <SnowflakeIcon size={24} weight="duotone" />;
		case "cloud-fog":
			return <CloudFogIcon size={24} weight="duotone" />;
		default:
			return <SunIcon size={24} weight="duotone" />;
	}
}
