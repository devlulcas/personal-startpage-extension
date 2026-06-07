import type { ButtonRenderProps } from "react-aria-components";
import { Button as AriaButton, type ButtonProps } from "react-aria-components";
import styles from "./button.module.css";

type AppButtonVariant = "filled" | "outlined" | "text";
type AppButtonRenderProps = ButtonRenderProps & {
	defaultClassName: string | undefined;
};

type AppButtonProps = ButtonProps & {
	variant?: AppButtonVariant;
};

export function AppButton({
	className,
	variant = "filled",
	...props
}: AppButtonProps) {
	const variantClass = styles[variant];
	const resolvedClassName =
		typeof className === "function"
			? (renderProps: AppButtonRenderProps) =>
					[styles.button, variantClass, className(renderProps)]
						.filter(Boolean)
						.join(" ")
			: [styles.button, variantClass, className].filter(Boolean).join(" ");

	return <AriaButton className={resolvedClassName} {...props} />;
}

export function AppIconButton({ className, ...props }: ButtonProps) {
	const resolvedClassName =
		typeof className === "function"
			? (renderProps: AppButtonRenderProps) =>
					[styles.iconButton, className(renderProps)].filter(Boolean).join(" ")
			: [styles.iconButton, className].filter(Boolean).join(" ");

	return <AriaButton className={resolvedClassName} {...props} />;
}
