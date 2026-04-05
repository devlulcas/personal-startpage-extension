import { useClock } from "../../hooks/useClock";
import styles from "./Clock.module.css";

export function Clock() {
	const { time, date } = useClock();

	return (
		<div className={styles.clockWidget}>
			<span className={styles.time}>{time}</span>
			<span className={styles.date}>{date}</span>
		</div>
	);
}
