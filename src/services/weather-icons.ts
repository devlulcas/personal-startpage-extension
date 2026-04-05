const weatherIconMap: Record<string, WeatherIconName> = {
	"01d": "sun",
	"01n": "moon",
	"02d": "cloud-sun",
	"02n": "cloud-moon",
	"03d": "cloud",
	"03n": "cloud",
	"04d": "cloud",
	"04n": "cloud",
	"09d": "cloud-rain",
	"09n": "cloud-rain",
	"10d": "cloud-rain",
	"10n": "cloud-rain",
	"11d": "cloud-lightning",
	"11n": "cloud-lightning",
	"13d": "snowflake",
	"13n": "snowflake",
	"50d": "cloud-fog",
	"50n": "cloud-fog",
};

export type WeatherIconName =
	| "sun"
	| "moon"
	| "cloud-sun"
	| "cloud-moon"
	| "cloud"
	| "cloud-rain"
	| "cloud-lightning"
	| "snowflake"
	| "cloud-fog";

export function getWeatherIconName(iconCode: string): WeatherIconName {
	return weatherIconMap[iconCode] ?? "sun";
}
