import { CaretDownIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
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
	Input,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	parseColor,
	Select,
	SelectValue,
	SliderTrack,
	Switch,
} from "react-aria-components";
import styles from "./settings-controls.module.css";

type SettingsSectionProps = {
	title: string;
	description?: string;
	children: ReactNode;
};

export function SettingsSection({
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

export function SettingsField({
	label,
	htmlFor,
	children,
}: SettingsFieldProps) {
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

export function SettingsErrorMessage({ message }: SettingsErrorMessageProps) {
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

export function AriaSelectField<T extends string>({
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
			<Popover
				className={styles.selectPopover}
				isNonModal
				maxHeight={220}
				containerPadding={8}
			>
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

export function AriaColorField({
	label,
	onChange,
	value,
}: AriaColorFieldProps) {
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

type FeatureToggleProps = {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
};

export function FeatureToggle({
	label,
	checked,
	onChange,
}: FeatureToggleProps) {
	return (
		<Switch
			className={styles.switchRow}
			isSelected={checked}
			onChange={onChange}
		>
			<span>{label}</span>
			<span className={styles.switchTrack} aria-hidden="true">
				<span className={styles.switchHandle} />
			</span>
		</Switch>
	);
}
