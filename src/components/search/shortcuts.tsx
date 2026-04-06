import {
	BrainIcon,
	ChatCircleTextIcon,
	EnvelopeSimpleIcon,
	GithubLogoIcon,
	SparkleIcon,
	YoutubeLogoIcon,
} from "@phosphor-icons/react";
import styles from "./shortcuts.module.css";

const shortcuts = [
	{ href: "https://github.com", label: "GitHub", icon: GithubLogoIcon },
	{ href: "https://youtube.com", label: "YouTube", icon: YoutubeLogoIcon },
	{ href: "https://gmail.com", label: "Gmail", icon: EnvelopeSimpleIcon },
	{ href: "https://claude.ai/new", label: "Claude", icon: BrainIcon },
	{ href: "https://chatgpt.com", label: "ChatGPT", icon: ChatCircleTextIcon },
	{ href: "https://gemini.google.com/app", label: "Gemini", icon: SparkleIcon },
];

export function Shortcuts() {
	return (
		<nav className={styles.shortcuts} aria-label="Shortcuts">
			{shortcuts.map((shortcut) => (
				<a
					key={shortcut.href}
					href={shortcut.href}
					target="_blank"
					rel="noreferrer noopener"
					className={styles.shortcutLink}
				>
					<shortcut.icon size={18} weight="duotone" aria-hidden="true" />
					{shortcut.label}
				</a>
			))}
		</nav>
	);
}
