import type { CSSProperties } from "react";
import { useShortcutsContext } from "../../app/providers/shortcuts-context";
import type { ShortcutIconId } from "../../config/shortcuts";
import { shortcutIcons } from "./shortcut-icons";
import styles from "./shortcuts.module.css";

export function Shortcuts() {
	const { shortcuts } = useShortcutsContext();

	if (shortcuts.length === 0) {
		return null;
	}

	return (
		<nav className={styles.shortcuts} aria-label="Shortcuts">
			{shortcuts.map((shortcut) => (
				<ShortcutLink key={shortcut.id} shortcut={shortcut} />
			))}
		</nav>
	);
}

type ShortcutLinkProps = {
	shortcut: {
		href: string;
		label: string;
		icon: ShortcutIconId;
		color: string;
	};
};

function ShortcutLink({ shortcut }: ShortcutLinkProps) {
	const Icon = shortcutIcons[shortcut.icon];

	return (
		<a
			href={shortcut.href}
			target="_blank"
			rel="noreferrer noopener"
			className={styles.shortcutLink}
			style={{ "--shortcut-color": shortcut.color } as CSSProperties}
		>
			<Icon size={18} weight="duotone" aria-hidden="true" />
			{shortcut.label}
		</a>
	);
}
