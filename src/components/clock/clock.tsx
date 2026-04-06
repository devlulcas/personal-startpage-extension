import { useClock } from "../../hooks/use-clock";
import styles from "./clock.module.css";

export function Clock() {
	const { time, date } = useClock();

	return (
		<div className={styles.clockWidget}>
			<span className={styles.time}>{time}</span>
			<span className={styles.date}>{date}</span>
		</div>
	);
}
