import {
	CheckCircleIcon,
	WarningCircleIcon,
	XIcon,
} from "@phosphor-icons/react";
import {
	Button,
	Text,
	UNSTABLE_Toast as Toast,
	UNSTABLE_ToastContent as ToastContent,
	type ToastProps,
	UNSTABLE_ToastQueue as ToastQueue,
	UNSTABLE_ToastRegion as ToastRegion,
} from "react-aria-components";
import styles from "./toast.module.css";

type ToastVariant = "success" | "error";

type AppToastContent = {
	message: string;
	variant: ToastVariant;
};

const toastQueue = new ToastQueue<AppToastContent>();
const activeToastKeys = new Set<string>();
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();
const toastAutoCloseEndTime = new Map<string, number>();
const toastPausedRemainingMs = new Map<string, number>();
type ViewTransitionDocument = Document & {
	startViewTransition?: (update: () => void) => void;
};

function runWithViewTransition(update: () => void) {
	if (typeof document === "undefined") {
		update();
		return;
	}

	const viewTransitionDocument = document as ViewTransitionDocument;
	if (!viewTransitionDocument.startViewTransition) {
		update();
		return;
	}

	viewTransitionDocument.startViewTransition(update);
}

function ToastIcon({ variant }: Pick<AppToastContent, "variant">) {
	const Icon = variant === "success" ? CheckCircleIcon : WarningCircleIcon;

	return (
		<span className={styles.icon} aria-hidden="true">
			<Icon size={20} weight="duotone" />
		</span>
	);
}

function clearToastAutoCloseState(toastKey: string) {
	const timer = toastTimers.get(toastKey);
	if (timer) {
		clearTimeout(timer);
		toastTimers.delete(toastKey);
	}
	toastAutoCloseEndTime.delete(toastKey);
	toastPausedRemainingMs.delete(toastKey);
}

function pauseToastAutoClose(toastKey: string) {
	const timer = toastTimers.get(toastKey);
	if (timer === undefined) {
		return;
	}
	clearTimeout(timer);
	toastTimers.delete(toastKey);
	const endTime = toastAutoCloseEndTime.get(toastKey);
	if (endTime === undefined) {
		return;
	}
	const remainingMs = Math.max(0, endTime - Date.now());
	toastPausedRemainingMs.set(toastKey, remainingMs);
	toastAutoCloseEndTime.delete(toastKey);
}

function resumeToastAutoClose(toastKey: string) {
	const remainingMs = toastPausedRemainingMs.get(toastKey);
	toastPausedRemainingMs.delete(toastKey);
	if (remainingMs === undefined) {
		return;
	}
	if (remainingMs <= 0) {
		closeToast(toastKey);
		return;
	}
	const newEndTime = Date.now() + remainingMs;
	toastAutoCloseEndTime.set(toastKey, newEndTime);
	const timer = setTimeout(() => {
		toastTimers.delete(toastKey);
		toastAutoCloseEndTime.delete(toastKey);
		closeToast(toastKey);
	}, remainingMs);
	toastTimers.set(toastKey, timer);
}

function showToast(message: string, variant: ToastVariant) {
	let toastKey = "";
	const timeout = variant === "error" ? 5000 : 5200;
	runWithViewTransition(() => {
		toastKey = toastQueue.add(
			{
				message,
				variant,
			},
			{
				onClose: () => {
					activeToastKeys.delete(toastKey);
					clearToastAutoCloseState(toastKey);
				},
			},
		);
		activeToastKeys.add(toastKey);
	});

	const endTime = Date.now() + timeout;
	toastAutoCloseEndTime.set(toastKey, endTime);
	const timer = setTimeout(() => {
		toastTimers.delete(toastKey);
		toastAutoCloseEndTime.delete(toastKey);
		closeToast(toastKey);
	}, timeout);
	toastTimers.set(toastKey, timer);
}

function closeToast(toastKey: string) {
	clearToastAutoCloseState(toastKey);

	runWithViewTransition(() => {
		toastQueue.close(toastKey);
		activeToastKeys.delete(toastKey);
	});
}

export const toaster = {
	success(message: string) {
		showToast(message, "success");
	},
	error(message: string) {
		showToast(message, "error");
	},
	dismiss() {
		runWithViewTransition(() => {
			for (const toastKey of activeToastKeys) {
				toastQueue.close(toastKey);
				clearToastAutoCloseState(toastKey);
			}
			activeToastKeys.clear();
		});
	},
};

function AppToast(props: ToastProps<AppToastContent>) {
	const variantClass =
		props.toast.content.variant === "success" ? styles.success : styles.error;

	return (
		<Toast
			{...props}
			className={`${styles.toast} ${variantClass}`}
			onPointerEnter={() => {
				pauseToastAutoClose(props.toast.key);
			}}
			onPointerLeave={() => {
				resumeToastAutoClose(props.toast.key);
			}}
		/>
	);
}

export function AppToaster() {
	return (
		<ToastRegion
			queue={toastQueue}
			className={styles.container}
			style={{ viewTransitionName: "toast-region" }}
		>
			{({ toast }) => (
				<AppToast toast={toast}>
					<ToastContent className={styles.content}>
						<ToastIcon variant={toast.content.variant} />
						<Text slot="title" className={styles.message}>
							{toast.content.message}
						</Text>
					</ToastContent>
					<Button
						aria-label="Close toast"
						className={styles.closeButton}
						onPress={() => {
							closeToast(toast.key);
						}}
					>
						<XIcon size={16} weight="bold" />
					</Button>
				</AppToast>
			)}
		</ToastRegion>
	);
}
