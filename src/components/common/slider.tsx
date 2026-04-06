import { clsx } from "clsx";
import type { SliderProps as AriaSliderProps } from "react-aria-components";
import {
	Slider as AriaSlider,
	Label,
	SliderOutput,
	SliderThumb,
	SliderTrack,
} from "react-aria-components";
import styles from "./slider.module.css";

type SliderProps<T> = Omit<AriaSliderProps<T>, "className"> & {
	className?: string;
	label?: string;
	thumbLabels?: string[];
};

export function Slider<T extends number | number[]>({
	label,
	thumbLabels,
	className,
	...props
}: SliderProps<T>) {
	return (
		<AriaSlider {...props} className={clsx(styles.slider, className)}>
			{label && <Label className={styles.label}>{label}</Label>}
			<SliderOutput className={styles.output}>
				{({ state }) =>
					state.values.map((_, i) => state.getThumbValueLabel(i)).join(" - ")
				}
			</SliderOutput>
			<SliderTrack className={styles.track}>
				{({ state, isDisabled }) => (
					<>
						<div
							className={styles.trackBase}
							data-disabled={isDisabled || undefined}
						>
							{state.values.length === 1 ? (
								<div
									className={styles.fill}
									style={
										{
											"--size": `${state.getThumbPercent(0) * 100}%`,
										} as React.CSSProperties
									}
								/>
							) : state.values.length === 2 ? (
								<div
									className={styles.fill}
									style={
										{
											"--start": `${state.getThumbPercent(0) * 100}%`,
											"--size": `${(state.getThumbPercent(1) - state.getThumbPercent(0)) * 100}%`,
										} as React.CSSProperties
									}
								/>
							) : null}
						</div>
						{state.values.map((value, i) => (
							<SliderThumb
								key={`thumb-${String(value)}-${thumbLabels?.[i] ?? ""}`}
								index={i}
								aria-label={thumbLabels?.[i]}
								className={styles.thumb}
							/>
						))}
					</>
				)}
			</SliderTrack>
		</AriaSlider>
	);
}
