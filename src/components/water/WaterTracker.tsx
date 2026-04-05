import { DropIcon, DropSimpleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
	Button,
	Dialog,
	DialogTrigger,
	Heading,
	Modal,
	ModalOverlay,
} from "react-aria-components";
import {
	useSetTodayCupCountMutation,
	useWaterToday,
	useWaterWeek,
} from "../../queries/water-query";
import { toaster } from "../../utils/toast";
import styles from "./WaterTracker.module.css";

interface WeeklyWaterChartProps {
	consumedByDay: Array<{ label: string; consumedLiters: number }>;
	goalLiters: number;
}

function WeeklyWaterChart({
	consumedByDay,
	goalLiters,
}: WeeklyWaterChartProps) {
	const width = 520;
	const height = 240;
	const chartTop = 20;
	const chartBottom = 180;
	const chartHeight = chartBottom - chartTop;
	const chartLeft = 24;
	const barWidth = 48;
	const barGap = 20;
	const maxValue = Math.max(
		goalLiters,
		...consumedByDay.map((day) => day.consumedLiters),
		1,
	);

	const goalY =
		chartBottom - (Math.min(goalLiters, maxValue) / maxValue) * chartHeight;

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="Current week water consumption chart"
			className={styles.chart}
		>
			<line
				x1={chartLeft}
				y1={goalY}
				x2={width - chartLeft}
				y2={goalY}
				className={styles.goalLine}
			/>
			<text x={chartLeft} y={goalY - 6} className={styles.goalLabel}>
				Goal {goalLiters.toFixed(1)}L
			</text>

			{consumedByDay.map((day, index) => {
				const valueHeight = (day.consumedLiters / maxValue) * chartHeight;
				const x = chartLeft + index * (barWidth + barGap);
				const y = chartBottom - valueHeight;

				return (
					<g key={day.label}>
						<rect
							x={x}
							y={y}
							width={barWidth}
							height={valueHeight}
							rx={8}
							className={styles.chartBar}
						/>
						<text
							x={x + barWidth / 2}
							y={chartBottom + 18}
							className={styles.dayLabel}
						>
							{day.label}
						</text>
						<text x={x + barWidth / 2} y={y - 8} className={styles.valueLabel}>
							{day.consumedLiters.toFixed(1)}L
						</text>
					</g>
				);
			})}
		</svg>
	);
}

export function WaterTracker() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const waterTodayQuery = useWaterToday();
	const waterWeekQuery = useWaterWeek();
	const setCupMutation = useSetTodayCupCountMutation();

	const today = waterTodayQuery.data;
	const consumedLiters = today?.consumedLiters ?? 0;
	const goalLiters = today?.goalLiters ?? 1;
	const totalCups = today?.totalCups ?? 0;
	const consumedCups = today?.consumedCups ?? 0;
	const progressPercent = Math.min((consumedLiters / goalLiters) * 100, 100);

	const cupIndexes = useMemo(
		() => Array.from({ length: totalCups }, (_, index) => index + 1),
		[totalCups],
	);

	async function handleSetCupCount(cupCount: number) {
		try {
			await setCupMutation.mutateAsync(cupCount);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to update water amount.";
			toaster.error(message);
		}
	}

	return (
		<div className={styles.container}>
			<DialogTrigger isOpen={dialogOpen} onOpenChange={setDialogOpen}>
				<Button className={styles.progressButton}>
					<div className={styles.progressTrack} aria-hidden="true">
						<div
							className={styles.progressFill}
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
					<span className={styles.amountText}>
						{consumedLiters.toFixed(1)}L / {goalLiters.toFixed(1)}L
					</span>
				</Button>

				<ModalOverlay className={styles.overlay} isDismissable>
					<Modal className={styles.modal}>
						<Dialog className={styles.dialog}>
							{({ close }) => (
								<>
									<header className={styles.dialogHeader}>
										<Heading slot="title" className={styles.title}>
											Weekly Water Intake
										</Heading>
										<Button className={styles.closeButton} onPress={close}>
											Close
										</Button>
									</header>
									<div className={styles.dialogBody}>
										{waterWeekQuery.data ? (
											<WeeklyWaterChart
												consumedByDay={waterWeekQuery.data.days}
												goalLiters={waterWeekQuery.data.goalLiters}
											/>
										) : waterWeekQuery.error instanceof Error ? (
											<p className={styles.errorMessage}>
												{waterWeekQuery.error.message}
											</p>
										) : (
											<p className={styles.statusMessage}>Loading chart...</p>
										)}
									</div>
								</>
							)}
						</Dialog>
					</Modal>
				</ModalOverlay>
			</DialogTrigger>

			<div className={styles.cupsRow}>
				{cupIndexes.map((cupCount) => {
					const isConsumed = cupCount <= consumedCups;

					return (
						<Button
							key={cupCount}
							className={styles.cupTick}
							onClick={() => handleSetCupCount(cupCount)}
							aria-label={`Set water to ${cupCount} cups`}
							aria-pressed={isConsumed}
						>
							{isConsumed ? (
								<DropSimpleIcon size={16} weight="fill" className={styles.cupIcon} />
							) : (
								<DropIcon size={16} weight="regular" className={styles.cupIcon} />
							)}
						</Button>
					);
				})}
			</div>
		</div>
	);
}
