import { UploadSimpleIcon } from "@phosphor-icons/react";
import styles from "./DragOverlay.module.css";

interface DragOverlayProps {
	active: boolean;
}

export function DragOverlay({ active }: DragOverlayProps) {
	if (!active) {
		return null;
	}

	return (
		<div className={styles.overlay}>
			<div className={styles.content}>
				<UploadSimpleIcon size={34} weight="duotone" className={styles.icon} />
				<p>Drop image to set as wallpaper</p>
			</div>
		</div>
	);
}
