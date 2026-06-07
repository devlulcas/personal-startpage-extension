import { useEffect } from "react";
import { toaster } from "../components/toast/toast";

export function useUnhandledRejectionHandler() {
	useEffect(() => {
		function onUnhandledRejection(event: PromiseRejectionEvent) {
			const reason =
				event.reason instanceof Error
					? event.reason.message
					: "Unexpected async error";
			toaster.error(reason);
		}

		window.addEventListener("unhandledrejection", onUnhandledRejection);

		return () => {
			window.removeEventListener("unhandledrejection", onUnhandledRejection);
		};
	}, []);
}
