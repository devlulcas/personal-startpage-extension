import {
	BookmarkSimpleIcon,
	BrainIcon,
	CalendarIcon,
	ChatCircleTextIcon,
	CodeIcon,
	EnvelopeSimpleIcon,
	GithubLogoIcon,
	GlobeIcon,
	MagnifyingGlassIcon,
	MusicNotesIcon,
	SparkleIcon,
	YoutubeLogoIcon,
} from "@phosphor-icons/react";
import type { ComponentType, CSSProperties } from "react";
import { useShortcutsContext } from "../../app/providers/shortcuts-context";
import type { ShortcutIconId } from "../../config/shortcuts";
import styles from "./shortcuts.module.css";

type ShortcutIcon = ComponentType<{
	size?: number;
	weight?: "regular" | "duotone";
	"aria-hidden"?: boolean | "true" | "false";
}>;

const shortcutIcons: Record<ShortcutIconId, ShortcutIcon> = {
	github: GithubLogoIcon,
	youtube: YoutubeLogoIcon,
	mail: EnvelopeSimpleIcon,
	chat: ChatCircleTextIcon,
	sparkle: SparkleIcon,
	brain: BrainIcon,
	globe: GlobeIcon,
	search: MagnifyingGlassIcon,
	bookmarks: BookmarkSimpleIcon,
	code: CodeIcon,
	music: MusicNotesIcon,
	calendar: CalendarIcon,
};

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
