import { useEffect, useMemo, useState } from "react";

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

export function useClock() {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const timer = window.setInterval(() => {
			setNow(new Date());
		}, 1000);

		return () => {
			window.clearInterval(timer);
		};
	}, []);

	return useMemo(
		() => ({
			time: timeFormatter.format(now),
			date: dateFormatter.format(now),
		}),
		[now],
	);
}
