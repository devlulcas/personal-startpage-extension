import { X as XIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Dialog,
	DialogTrigger,
	Heading,
	Modal,
	ModalOverlay,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
} from "react-aria-components";
import { useAppearanceContext } from "../../app/providers/AppearanceContext";
import { useLocationContext } from "../../app/providers/LocationContext";
import { useWallpaperContext } from "../../app/providers/WallpaperContext";
import { useWeatherContext } from "../../app/providers/WeatherContext";
import { Slider } from "../../components/common/Slider";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { queryKeys } from "../../queries/queryKeys";
import { resolveResult } from "../../queries/result-adapter";
import {
	useUpdateWaterSettingsMutation,
	useWaterSettings,
} from "../../queries/water-query";
import { persistLocation } from "../../services/location-service";
import { geocodeCity } from "../../services/weather-service";
import { toaster } from "../../utils/toast";
import styles from "./SettingsDialog.module.css";

interface SettingsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

export function SettingsDialog({
	isOpen,
	onOpenChange,
	children,
}: SettingsDialogProps) {
	const { location, setLocation } = useLocationContext();
	const { refresh } = useWeatherContext();
	const { clearWallpaper } = useWallpaperContext();
	const { blur, setBlur } = useAppearanceContext();
	const waterSettingsQuery = useWaterSettings();
	const updateWaterSettingsMutation = useUpdateWaterSettingsMutation();

	const [cityQuery, setCityQuery] = useState(location?.city ?? "");
	const [units, setUnits] = useState<"metric" | "imperial">(
		location?.units ?? "metric",
	);
	const [pendingGeo, setPendingGeo] = useState<{
		city: string;
		lat: number;
		lon: number;
		country: string;
	} | null>(
		location
			? {
					city: location.city,
					lat: location.latitude,
					lon: location.longitude,
					country: location.country,
				}
			: null,
	);
	const [goalLitersInput, setGoalLitersInput] = useState("2");
	const [cupSizeInput, setCupSizeInput] = useState("250");
	const [waterErrorMessage, setWaterErrorMessage] = useState<string | null>(
		null,
	);

	const debouncedCity = useDebouncedValue(cityQuery, 500);
	const shouldResolveCity = isOpen && debouncedCity.trim().length >= 2;
	const geocodeQuery = useQuery({
		queryKey: queryKeys.geocode(debouncedCity),
		queryFn: () => resolveResult(geocodeCity(debouncedCity)),
		enabled: shouldResolveCity,
	});

	useEffect(() => {
		setCityQuery(location?.city ?? "");
		setUnits(location?.units ?? "metric");
		setPendingGeo(
			location
				? {
						city: location.city,
						lat: location.latitude,
						lon: location.longitude,
						country: location.country,
					}
				: null,
		);
	}, [location]);

	useEffect(() => {
		if (!waterSettingsQuery.data) {
			return;
		}

		setGoalLitersInput(String(waterSettingsQuery.data.dailyGoalLiters));
		setCupSizeInput(String(waterSettingsQuery.data.cupSizeMl));
		setWaterErrorMessage(null);
	}, [waterSettingsQuery.data]);

	useEffect(() => {
		if (!shouldResolveCity) {
			setPendingGeo(
				location
					? {
							city: location.city,
							lat: location.latitude,
							lon: location.longitude,
							country: location.country,
						}
					: null,
			);
			return;
		}

		if (!geocodeQuery.data) {
			setPendingGeo(null);
			return;
		}

		setPendingGeo({
			city: geocodeQuery.data.name,
			lat: geocodeQuery.data.lat,
			lon: geocodeQuery.data.lon,
			country: geocodeQuery.data.country,
		});
	}, [geocodeQuery.data, location, shouldResolveCity]);

	const errorMessage = useMemo(() => {
		if (!shouldResolveCity) {
			return null;
		}

		if (geocodeQuery.error instanceof Error) {
			return geocodeQuery.error.message;
		}

		return null;
	}, [geocodeQuery.error, shouldResolveCity]);

	const canSave = useMemo(() => pendingGeo !== null, [pendingGeo]);

	async function handleSave(close: () => void) {
		if (!pendingGeo) {
			return;
		}

		const nextLocation = {
			city: pendingGeo.city,
			latitude: pendingGeo.lat,
			longitude: pendingGeo.lon,
			country: pendingGeo.country,
			units,
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
	}

	async function handleResetWallpaper() {
		await clearWallpaper();
	}

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
									<Button onPress={close} className={styles.iconButton}>
										<XIcon size={18} weight="bold" />
									</Button>
								</header>

								<div className={styles.body}>
									<Tabs className={styles.tabs} defaultSelectedKey="weather">
										<TabList
											aria-label="Settings sections"
											className={styles.tabList}
										>
											<Tab id="weather" className={styles.tab}>
												Weather
											</Tab>
											<Tab id="wallpaper" className={styles.tab}>
												Wallpaper
											</Tab>
											<Tab id="water" className={styles.tab}>
												Water
											</Tab>
										</TabList>
										<TabPanels className={styles.tabPanels}>
											<TabPanel id="weather" className={styles.tabPanel}>
												<section className={styles.section}>
													<h3>Weather Location</h3>
													<div className={styles.field}>
														<label htmlFor="city-input">City Name</label>
														<input
															id="city-input"
															value={cityQuery}
															onChange={(event) =>
																setCityQuery(event.currentTarget.value)
															}
															placeholder="Enter city name"
															autoComplete="off"
														/>
													</div>

													{pendingGeo && (
														<div className={styles.preview}>
															<span>{pendingGeo.city}</span>
															<span>
																{pendingGeo.lat.toFixed(4)},{" "}
																{pendingGeo.lon.toFixed(4)}
															</span>
														</div>
													)}

													<div className={styles.toggleRow}>
														<span>Temperature Unit</span>
														<div className={styles.toggleGroup}>
															<button
																type="button"
																className={
																	units === "metric"
																		? styles.selectedChip
																		: styles.chip
																}
																onClick={() => setUnits("metric")}
															>
																°C
															</button>
															<button
																type="button"
																className={
																	units === "imperial"
																		? styles.selectedChip
																		: styles.chip
																}
																onClick={() => setUnits("imperial")}
															>
																°F
															</button>
														</div>
													</div>

													{errorMessage && (
														<div className={styles.errorMessage}>
															{errorMessage}
														</div>
													)}

													<Button
														onPress={() => handleSave(close)}
														isDisabled={!canSave}
														className={styles.filledButton}
													>
														Save Weather Settings
													</Button>
												</section>
											</TabPanel>
											<TabPanel id="wallpaper" className={styles.tabPanel}>
												<section className={styles.section}>
													<h3>Wallpaper</h3>
													<p className={styles.description}>
														Drag and drop an image onto the page to set it as
														your wallpaper.
													</p>

													<div className={styles.field}>
														<Slider
															label={`Background Blur (${blur}px)`}
															minValue={0}
															maxValue={32}
															step={2}
															value={blur}
															onChange={setBlur}
															className={styles.blurSlider}
														/>
													</div>

													<button
														type="button"
														className={styles.outlinedButton}
														onClick={handleResetWallpaper}
													>
														Reset Wallpaper
													</button>
												</section>
											</TabPanel>
											<TabPanel id="water" className={styles.tabPanel}>
												<section className={styles.section}>
													<h3>Water Tracker</h3>
													<p className={styles.description}>
														Set your daily hydration goal and the cup size used
														by the progress cups.
													</p>

													<div className={styles.field}>
														<label htmlFor="water-goal-input">
															Daily Goal (liters)
														</label>
														<input
															id="water-goal-input"
															type="number"
															min={0.5}
															step={0.1}
															value={goalLitersInput}
															onChange={(event) =>
																setGoalLitersInput(event.currentTarget.value)
															}
														/>
													</div>

													<div className={styles.field}>
														<label htmlFor="water-cup-size-input">
															Cup Size (ml)
														</label>
														<input
															id="water-cup-size-input"
															type="number"
															min={50}
															step={10}
															value={cupSizeInput}
															onChange={(event) =>
																setCupSizeInput(event.currentTarget.value)
															}
														/>
													</div>

													<button
														type="button"
														className={styles.outlinedButton}
														onClick={handleSaveWaterSettings}
													>
														Save Water Settings
													</button>

													{waterErrorMessage && (
														<div className={styles.errorMessage}>
															{waterErrorMessage}
														</div>
													)}
												</section>
											</TabPanel>
										</TabPanels>
									</Tabs>
								</div>

								<footer className={styles.footer}>
									<Button onPress={close} className={styles.textButton}>
										Close
									</Button>
								</footer>
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	);
}
