import { useEffect, useState } from "react";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "2-digit",
	month: "2-digit",
	weekday: "long",
});

function getClockData() {
	const now = new Date();

	return {
		time: timeFormatter.format(now),
		date: dateFormatter.format(now),
	};
}

export function useClock() {
	const [now, setNow] = useState(getClockData());

	useEffect(() => {
		const timer = window.setInterval(() => {
			setNow(getClockData());
		}, 1000);

		return () => {
			window.clearInterval(timer);
		};
	}, []);

	return now;
}
