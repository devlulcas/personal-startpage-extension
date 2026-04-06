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
	const toastKey = toastQueue.add(
		{
			message,
			variant,
		},
		{
			timeout: variant === "error" ? 5000 : 5200,
			onClose: () => {
				activeToastKeys.delete(toastKey);
			},
		},
	);
	activeToastKeys.add(toastKey);
}

export const toaster = {
	success(message: string) {
		showToast(message, "success");
	},
	error(message: string) {
		showToast(message, "error");
	},
	dismiss() {
		for (const toastKey of activeToastKeys) {
			toastQueue.close(toastKey);
		}
		activeToastKeys.clear();
	},
};

function AppToast(props: ToastProps<AppToastContent>) {
	const variantClass =
		props.toast.content.variant === "success" ? styles.success : styles.error;

	return <Toast {...props} className={`${styles.toast} ${variantClass}`} />;
}

export function AppToaster() {
	return (
		<ToastRegion queue={toastQueue} className={styles.container}>
			{({ toast }) => (
				<AppToast toast={toast}>
					<ToastContent className={styles.content}>
						<ToastIcon variant={toast.content.variant} />
						<Text slot="title" className={styles.message}>
							{toast.content.message}
						</Text>
					</ToastContent>
					<Button
						slot="close"
						aria-label="Close toast"
						className={styles.closeButton}
					>
						<XIcon size={16} weight="bold" />
					</Button>
				</AppToast>
			)}
		</ToastRegion>
	);
}
