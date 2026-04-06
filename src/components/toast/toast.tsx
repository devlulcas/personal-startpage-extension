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
	UNSTABLE_ToastQueue as ToastQueue,
	UNSTABLE_ToastRegion as ToastRegion,
	type ToastProps,
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
	const icon =
		variant === "success" ? (
			<CheckCircleIcon size={20} weight="duotone" />
		) : (
			<WarningCircleIcon size={20} weight="duotone" />
		);

	return (
		<span className={styles.icon} aria-hidden="true">
			{icon}
		</span>
	);
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
					const timer = toastTimers.get(toastKey);
					if (timer) {
						clearTimeout(timer);
						toastTimers.delete(toastKey);
					}
				},
			},
		);
		activeToastKeys.add(toastKey);
	});

	const timer = setTimeout(() => {
		closeToast(toastKey);
	}, timeout);
	toastTimers.set(toastKey, timer);
}

function closeToast(toastKey: string) {
	const timer = toastTimers.get(toastKey);
	if (timer) {
		clearTimeout(timer);
		toastTimers.delete(toastKey);
	}

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
				const timer = toastTimers.get(toastKey);
				if (timer) {
					clearTimeout(timer);
					toastTimers.delete(toastKey);
				}
			}
			activeToastKeys.clear();
		});
	},
};

function AppToast(props: ToastProps<AppToastContent>) {
	const variantClass =
		props.toast.content.variant === "success" ? styles.success : styles.error;

	return <Toast {...props} className={`${styles.toast} ${variantClass}`} />;
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
