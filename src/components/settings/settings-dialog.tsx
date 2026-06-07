import { CaretDownIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type ChangeEvent,
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	Button,
	ColorArea,
	ColorField,
	ColorPicker,
	ColorSlider,
	ColorSwatch,
	ColorThumb,
	Dialog,
	DialogTrigger,
	Heading,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	Modal,
	ModalOverlay,
	Popover,
	parseColor,
	Select,
	SelectValue,
	SliderTrack,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
} from "react-aria-components";
import { useAppearanceContext } from "../../app/providers/appearance-context";
import { useFeatureSettingsContext } from "../../app/providers/feature-settings-context";
import { useLocationContext } from "../../app/providers/location-context";
import { useShortcutsContext } from "../../app/providers/shortcuts-context";
import { useWallpaperContext } from "../../app/providers/wallpaper-context";
import { useWeatherContext } from "../../app/providers/weather-context";
import { apiKeyRotator } from "../../config/api-keys";
import type { LocationConfig } from "../../config/location";
import {
	normalizeShortcutInput,
	SHORTCUT_ICON_OPTIONS,
	type ShortcutConfig,
	validateShortcutInput,
} from "../../config/shortcuts";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import {
	useUpdateWaterSettingsMutation,
	useWaterSettings,
} from "../../hooks/use-water";
import { queryKeys } from "../../queries/query-keys";
import { resolveResult } from "../../queries/result-adapter";
import {
	buildConfigBackup,
	importConfigBackup,
} from "../../services/config-backup-service";
import { persistLocation } from "../../services/location-service";
import { geocodeCity } from "../../services/weather-service";
import { Slider } from "../common/slider";
import { toaster } from "../toast/toast";
import styles from "./settings-dialog.module.css";

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
									<Tabs className={styles.tabs} defaultSelectedKey="general">
										<TabList
											aria-label="Settings sections"
											className={styles.tabList}
										>
											<Tab id="general" className={styles.tab}>
												General
											</Tab>
											<Tab id="weather" className={styles.tab}>
												Weather
											</Tab>
											<Tab id="shortcuts" className={styles.tab}>
												Shortcuts
											</Tab>
											<Tab id="wallpaper" className={styles.tab}>
												Wallpaper
											</Tab>
											<Tab id="water" className={styles.tab}>
												Water
											</Tab>
											<Tab id="apiKeys" className={styles.tab}>
												API Keys
											</Tab>
										</TabList>
										<TabPanels className={styles.tabPanels}>
											<TabPanel id="general" className={styles.tabPanel}>
												<GeneralSettingsSection />
											</TabPanel>
											<TabPanel id="weather" className={styles.tabPanel}>
												<WeatherSettingsSection close={close} />
											</TabPanel>
											<TabPanel id="shortcuts" className={styles.tabPanel}>
												<ShortcutsSettingsSection />
											</TabPanel>
											<TabPanel id="wallpaper" className={styles.tabPanel}>
												<WallpaperSettingsSection />
											</TabPanel>
											<TabPanel id="water" className={styles.tabPanel}>
												<WaterSettingsSection />
											</TabPanel>
											<TabPanel id="apiKeys" className={styles.tabPanel}>
												<ApiKeysSettingsSection />
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

function downloadJson(filename: string, data: unknown): void {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}

type WeatherSettingsSectionProps = {
	close: () => void;
};

type SettingsSectionProps = {
	title: string;
	description?: string;
	children: ReactNode;
};

function SettingsSection({
	title,
	description,
	children,
}: SettingsSectionProps) {
	return (
		<section className={styles.section}>
			<h3>{title}</h3>
			{description && <p className={styles.description}>{description}</p>}
			{children}
		</section>
	);
}

type SettingsFieldProps = {
	label: string;
	htmlFor: string;
	children: ReactNode;
};

function SettingsField({ label, htmlFor, children }: SettingsFieldProps) {
	return (
		<div className={styles.field}>
			<label htmlFor={htmlFor}>{label}</label>
			{children}
		</div>
	);
}

type SettingsErrorMessageProps = {
	message: string | null;
};

function SettingsErrorMessage({ message }: SettingsErrorMessageProps) {
	if (!message) {
		return null;
	}

	return (
		<div role="alert" aria-live="polite" className={styles.errorMessage}>
			{message}
		</div>
	);
}

type AriaSelectFieldProps<T extends string> = {
	id: string;
	label: string;
	value: T;
	options: readonly { id: T; label: string }[];
	onChange: (value: T) => void;
};

function AriaSelectField<T extends string>({
	id,
	label,
	onChange,
	options,
	value,
}: AriaSelectFieldProps<T>) {
	return (
		<Select
			aria-label={label}
			selectedKey={value}
			onSelectionChange={(key) => onChange(key as T)}
			className={styles.selectField}
		>
			<Label className={styles.controlLabel}>{label}</Label>
			<Button className={styles.selectButton} id={id}>
				<SelectValue className={styles.selectValue} />
				<CaretDownIcon size={16} weight="bold" aria-hidden="true" />
			</Button>
			<Popover className={styles.selectPopover}>
				<ListBox className={styles.selectList}>
					{options.map((option) => (
						<ListBoxItem
							key={option.id}
							id={option.id}
							textValue={option.label}
							className={styles.selectItem}
						>
							{option.label}
						</ListBoxItem>
					))}
				</ListBox>
			</Popover>
		</Select>
	);
}

type AriaColorFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
};

function AriaColorField({ label, onChange, value }: AriaColorFieldProps) {
	return (
		<ColorPicker
			aria-label={label}
			value={parseColor(value)}
			onChange={(color) => onChange(color.toString("hex"))}
		>
			<DialogTrigger>
				<Button className={styles.colorPickerButton}>
					<ColorSwatch className={styles.colorSwatch} />
					<span>{label}</span>
				</Button>
				<Popover className={styles.colorPickerPopover} placement="bottom start">
					<Dialog className={styles.colorPickerDialog}>
						<ColorArea
							colorSpace="hsb"
							xChannel="saturation"
							yChannel="brightness"
							className={styles.colorArea}
						>
							<ColorThumb className={styles.colorThumb} />
						</ColorArea>
						<ColorSlider
							colorSpace="hsb"
							channel="hue"
							className={styles.colorSlider}
						>
							<SliderTrack className={styles.colorSliderTrack}>
								<ColorThumb className={styles.colorThumb} />
							</SliderTrack>
						</ColorSlider>
						<ColorField className={styles.colorField}>
							<Label className={styles.controlLabel}>Hex</Label>
							<Input className={styles.colorFieldInput} />
						</ColorField>
					</Dialog>
				</Popover>
			</DialogTrigger>
		</ColorPicker>
	);
}

function GeneralSettingsSection() {
	const queryClient = useQueryClient();
	const { features, replaceFeatures, setFeatureEnabled } =
		useFeatureSettingsContext();
	const { setLocation } = useLocationContext();
	const { replaceShortcuts } = useShortcutsContext();
	const { setBlur } = useAppearanceContext();
	const { refresh } = useWeatherContext();

	async function handleExportConfig() {
		const backupResult = await buildConfigBackup();
		if (!backupResult.ok) {
			toaster.error(backupResult.message);
			return;
		}

		downloadJson("startpage-config.json", backupResult.data);
		toaster.success("Config exported.");
	}

	async function handleImportConfig(event: ChangeEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = "";
		if (!file) {
			return;
		}

		try {
			const text = await readFileAsText(file);
			const payload = JSON.parse(text) as unknown;
			const importResult = await importConfigBackup(payload);
			if (!importResult.ok) {
				toaster.error(importResult.message);
				return;
			}

			const config = importResult.data;
			replaceFeatures(config.features);
			replaceShortcuts(config.shortcuts);
			setLocation(config.weatherLocation);
			setBlur(config.wallpaperSettings.blur);
			if (config.wallpaperIncluded) {
				queryClient.setQueryData(queryKeys.wallpaper(), {
					imageUrl: config.wallpaperImage,
					palette: config.colorPalette,
				});
			}
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.waterSettings() }),
				queryClient.invalidateQueries({ queryKey: ["water"] }),
				queryClient.invalidateQueries({ queryKey: queryKeys.wallpaper() }),
			]);
			await refresh(true, config.weatherLocation ?? undefined);
			toaster.success("Config imported.");
		} catch (error) {
			const message =
				error instanceof SyntaxError
					? "Config file must be valid JSON."
					: error instanceof Error
						? error.message
						: "Failed to import config.";
			toaster.error(message);
		}
	}

	return (
		<SettingsSection
			title="General"
			description="Choose which widgets are visible and manage your startpage backup."
		>
			<div className={styles.toggleList}>
				<FeatureToggle
					label="Water"
					checked={features.water}
					onChange={(checked) => setFeatureEnabled("water", checked)}
				/>
				<FeatureToggle
					label="Clock"
					checked={features.clock}
					onChange={(checked) => setFeatureEnabled("clock", checked)}
				/>
				<FeatureToggle
					label="Weather"
					checked={features.weather}
					onChange={(checked) => setFeatureEnabled("weather", checked)}
				/>
				<FeatureToggle
					label="Export Wallpaper"
					checked={features.includeWallpaperInExport}
					onChange={(checked) =>
						setFeatureEnabled("includeWallpaperInExport", checked)
					}
				/>
			</div>

			<div className={styles.backupActions}>
				<button
					type="button"
					className={styles.outlinedButton}
					onClick={handleExportConfig}
				>
					Export Config
				</button>

				<label className={styles.importButton}>
					<UploadSimpleIcon size={16} weight="bold" />
					Import Config
					<input
						type="file"
						accept="application/json,.json"
						onChange={handleImportConfig}
					/>
				</label>
			</div>
		</SettingsSection>
	);
}

type FeatureToggleProps = {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
};

function FeatureToggle({ label, checked, onChange }: FeatureToggleProps) {
	return (
		<label className={styles.switchRow}>
			<span>{label}</span>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.currentTarget.checked)}
			/>
		</label>
	);
}

type ShortcutFormState = Omit<ShortcutConfig, "id">;

const DEFAULT_SHORTCUT_FORM: ShortcutFormState = {
	label: "",
	href: "",
	icon: "globe",
	color: "#7c3aed",
};

function ShortcutsSettingsSection() {
	const { addShortcut, deleteShortcut, shortcuts, updateShortcut } =
		useShortcutsContext();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<ShortcutFormState>(DEFAULT_SHORTCUT_FORM);
	const [shortcutErrorMessage, setShortcutErrorMessage] = useState<
		string | null
	>(null);

	const editingShortcut = shortcuts.find(
		(shortcut) => shortcut.id === editingId,
	);
	const formTitle = editingShortcut ? "Edit Shortcut" : "Add Shortcut";

	function resetForm() {
		setEditingId(null);
		setForm(DEFAULT_SHORTCUT_FORM);
		setShortcutErrorMessage(null);
	}

	function handleEditShortcut(shortcut: ShortcutConfig) {
		setEditingId(shortcut.id);
		setForm({
			label: shortcut.label,
			href: shortcut.href,
			icon: shortcut.icon,
			color: shortcut.color,
		});
		setShortcutErrorMessage(null);
	}

	function handleDeleteShortcut(id: string) {
		deleteShortcut(id);
		if (editingId === id) {
			resetForm();
		}
		toaster.success("Shortcut deleted.");
	}

	function handleSaveShortcut() {
		const validationMessage = validateShortcutInput(form);
		if (validationMessage) {
			setShortcutErrorMessage(validationMessage);
			return;
		}

		const normalizedForm = normalizeShortcutInput(form);
		if (editingId) {
			updateShortcut(editingId, normalizedForm);
			toaster.success("Shortcut updated.");
		} else {
			addShortcut(normalizedForm);
			toaster.success("Shortcut added.");
		}

		resetForm();
	}

	return (
		<SettingsSection
			title="Shortcuts"
			description="Create quick links for the sites and tools you use often."
		>
			<div className={styles.shortcutList}>
				{shortcuts.length === 0 ? (
					<p className={styles.emptyMessage}>No shortcuts configured.</p>
				) : (
					shortcuts.map((shortcut) => (
						<div key={shortcut.id} className={styles.shortcutRow}>
							<div
								className={styles.shortcutSwatch}
								style={{ "--shortcut-color": shortcut.color } as CSSProperties}
								aria-hidden="true"
							/>
							<div className={styles.shortcutSummary}>
								<span>{shortcut.label}</span>
								<a
									href={shortcut.href}
									target="_blank"
									rel="noreferrer noopener"
								>
									{shortcut.href}
								</a>
							</div>
							<div className={styles.shortcutActions}>
								<button
									type="button"
									className={styles.textButton}
									onClick={() => handleEditShortcut(shortcut)}
								>
									Edit
								</button>
								<button
									type="button"
									className={styles.textButton}
									onClick={() => handleDeleteShortcut(shortcut.id)}
								>
									Delete
								</button>
							</div>
						</div>
					))
				)}
			</div>

			<div className={styles.shortcutForm}>
				<h4>{formTitle}</h4>

				<SettingsField label="Name" htmlFor="shortcut-name-input">
					<input
						id="shortcut-name-input"
						value={form.label}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								label: event.currentTarget.value,
							}))
						}
						placeholder="Docs"
						autoComplete="off"
					/>
				</SettingsField>

				<SettingsField label="Link" htmlFor="shortcut-link-input">
					<input
						id="shortcut-link-input"
						type="url"
						value={form.href}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								href: event.currentTarget.value,
							}))
						}
						placeholder="https://example.com"
						autoComplete="off"
					/>
				</SettingsField>

				<div className={styles.shortcutFormGrid}>
					<AriaSelectField
						id="shortcut-icon-select"
						label="Icon"
						value={form.icon}
						options={SHORTCUT_ICON_OPTIONS}
						onChange={(icon) =>
							setForm((current) => ({
								...current,
								icon,
							}))
						}
					/>

					<AriaColorField
						label="Background"
						value={form.color}
						onChange={(color) =>
							setForm((current) => ({
								...current,
								color,
							}))
						}
					/>
				</div>

				<SettingsErrorMessage message={shortcutErrorMessage} />

				<div className={styles.shortcutFormActions}>
					<button
						type="button"
						className={styles.filledButton}
						onClick={handleSaveShortcut}
					>
						{editingShortcut ? "Save Shortcut" : "Add Shortcut"}
					</button>
					{editingShortcut && (
						<button
							type="button"
							className={styles.outlinedButton}
							onClick={resetForm}
						>
							Cancel
						</button>
					)}
				</div>
			</div>
		</SettingsSection>
	);
}

function WeatherSettingsSection({ close }: WeatherSettingsSectionProps) {
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

			<Button
				onPress={handleSave}
				isDisabled={!canSave}
				className={styles.filledButton}
			>
				Save Weather Settings
			</Button>
		</SettingsSection>
	);
}

function WallpaperSettingsSection() {
	const { clearWallpaper } = useWallpaperContext();
	const { blur, setBlur } = useAppearanceContext();

	async function handleResetWallpaper() {
		await clearWallpaper();
	}

	return (
		<SettingsSection
			title="Wallpaper"
			description="Drag and drop an image onto the page to set it as your wallpaper."
		>
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
		</SettingsSection>
	);
}

function WaterSettingsSection() {
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

			<button
				type="button"
				className={styles.outlinedButton}
				onClick={handleSaveWaterSettings}
			>
				Save Water Settings
			</button>

			<SettingsErrorMessage message={waterErrorMessage} />
		</SettingsSection>
	);
}

function ApiKeysSettingsSection() {
	const { refresh } = useWeatherContext();
	const [apiKeysInput, setApiKeysInput] = useState(() =>
		apiKeyRotator.getKeysInputValue(),
	);
	const [apiKeysErrorMessage, setApiKeysErrorMessage] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setApiKeysInput(apiKeyRotator.getKeysInputValue());
		setApiKeysErrorMessage(null);
	}, []);

	async function handleSaveApiKeys() {
		const parsedKeys = apiKeysInput
			.split(",")
			.map((key) => key.trim())
			.filter((key) => key.length > 0);
		if (parsedKeys.length === 0) {
			setApiKeysErrorMessage("Please provide at least one API key.");
			return;
		}

		apiKeyRotator.setKeysFromInput(apiKeysInput);
		setApiKeysInput(apiKeyRotator.getKeysInputValue());
		setApiKeysErrorMessage(null);
		await refresh(true);
		toaster.success("Weather API keys saved.");
	}

	return (
		<SettingsSection
			title="Weather API Keys"
			description="Enter one or more OpenWeather API keys separated by commas."
		>
			<SettingsField label="API Keys" htmlFor="weather-api-keys-input">
				<input
					id="weather-api-keys-input"
					type="text"
					value={apiKeysInput}
					onChange={(event) => {
						setApiKeysInput(event.currentTarget.value);
						setApiKeysErrorMessage(null);
					}}
					placeholder="key_1,key_2,key_3"
					autoComplete="off"
				/>
			</SettingsField>

			<button
				type="button"
				className={styles.outlinedButton}
				onClick={handleSaveApiKeys}
			>
				Save API Keys
			</button>

			<SettingsErrorMessage message={apiKeysErrorMessage} />
		</SettingsSection>
	);
}
