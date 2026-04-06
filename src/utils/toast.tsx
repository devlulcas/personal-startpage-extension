import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Toaster, toast } from "react-hot-toast";
import styles from "./toast.module.css";

type ToastVariant = "success" | "error";

interface ToastContentProps {
	message: string;
	variant: ToastVariant;
	visible: boolean;
}

function ToastContent({ message, variant, visible }: ToastContentProps) {
	const variantClass =
		variant === "success" ? styles.successToast : styles.errorToast;
	const icon =
		variant === "success" ? (
			<CheckCircleIcon size={20} weight="duotone" />
		) : (
			<WarningCircleIcon size={20} weight="duotone" />
		);

	return (
		<div
			className={`${styles.toast} ${variantClass} ${visible ? styles.visible : styles.hidden}`}
			role="status"
		>
			<span className={styles.icon} aria-hidden="true">
				{icon}
			</span>
			<span className={styles.message}>{message}</span>
		</div>
	);
}

function showToast(message: string, variant: ToastVariant) {
	toast.custom(
		(toastContext) => (
			<ToastContent
				message={message}
				variant={variant}
				visible={toastContext.visible}
			/>
		),
		{ duration: variant === "error" ? 4200 : 3200 },
	);
}

export const toaster = {
	success(message: string) {
		showToast(message, "success");
	},
	error(message: string) {
		showToast(message, "error");
	},
	dismiss() {
		toast.dismiss();
	},
};

export function AppToaster() {
	return (
		<Toaster
			position="bottom-right"
			gutter={10}
			containerClassName={styles.container}
			toastOptions={{
				style: {
					background: "transparent",
					boxShadow: "none",
					padding: 0,
				},
			}}
		/>
	);
}
