import {
	AirplaneTiltIcon,
	AmazonLogoIcon,
	ArticleIcon,
	BankIcon,
	BehanceLogoIcon,
	BookmarkSimpleIcon,
	BrainIcon,
	BriefcaseIcon,
	CalendarIcon,
	CameraIcon,
	ChartLineIcon,
	ChatCircleTextIcon,
	CloudIcon,
	CodeIcon,
	CreditCardIcon,
	DatabaseIcon,
	DiscordLogoIcon,
	DribbbleLogoIcon,
	DropboxLogoIcon,
	EnvelopeSimpleIcon,
	FacebookLogoIcon,
	FigmaLogoIcon,
	FileTextIcon,
	FilmSlateIcon,
	FolderIcon,
	ForkKnifeIcon,
	GameControllerIcon,
	GithubLogoIcon,
	GlobeIcon,
	GoogleChromeLogoIcon,
	GoogleDriveLogoIcon,
	GoogleLogoIcon,
	GooglePhotosLogoIcon,
	GraduationCapIcon,
	HeartIcon,
	HouseIcon,
	ImageIcon,
	InstagramLogoIcon,
	LinkedinLogoIcon,
	MagnifyingGlassIcon,
	MapPinIcon,
	MicrosoftExcelLogoIcon,
	MicrosoftOutlookLogoIcon,
	MicrosoftTeamsLogoIcon,
	MusicNotesIcon,
	NewspaperIcon,
	NotionLogoIcon,
	PaintBrushIcon,
	PaletteIcon,
	PaypalLogoIcon,
	PenNibIcon,
	RedditLogoIcon,
	ShieldCheckIcon,
	ShoppingBagIcon,
	ShoppingCartIcon,
	SlackLogoIcon,
	SparkleIcon,
	SpotifyLogoIcon,
	StackOverflowLogoIcon,
	StorefrontIcon,
	TerminalIcon,
	TwitchLogoIcon,
	TwitterLogoIcon,
	XLogoIcon,
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
	amazon: AmazonLogoIcon,
	google: GoogleLogoIcon,
	chrome: GoogleChromeLogoIcon,
	drive: GoogleDriveLogoIcon,
	photos: GooglePhotosLogoIcon,
	instagram: InstagramLogoIcon,
	facebook: FacebookLogoIcon,
	x: XLogoIcon,
	twitter: TwitterLogoIcon,
	linkedin: LinkedinLogoIcon,
	reddit: RedditLogoIcon,
	twitch: TwitchLogoIcon,
	discord: DiscordLogoIcon,
	slack: SlackLogoIcon,
	spotify: SpotifyLogoIcon,
	stackoverflow: StackOverflowLogoIcon,
	figma: FigmaLogoIcon,
	dribbble: DribbbleLogoIcon,
	behance: BehanceLogoIcon,
	notion: NotionLogoIcon,
	dropbox: DropboxLogoIcon,
	paypal: PaypalLogoIcon,
	outlook: MicrosoftOutlookLogoIcon,
	excel: MicrosoftExcelLogoIcon,
	teams: MicrosoftTeamsLogoIcon,
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
	shopping: ShoppingBagIcon,
	cart: ShoppingCartIcon,
	store: StorefrontIcon,
	camera: CameraIcon,
	image: ImageIcon,
	design: PaintBrushIcon,
	palette: PaletteIcon,
	writing: PenNibIcon,
	work: BriefcaseIcon,
	news: NewspaperIcon,
	learning: GraduationCapIcon,
	games: GameControllerIcon,
	movies: FilmSlateIcon,
	travel: AirplaneTiltIcon,
	maps: MapPinIcon,
	home: HouseIcon,
	finance: ChartLineIcon,
	bank: BankIcon,
	payments: CreditCardIcon,
	food: ForkKnifeIcon,
	favorites: HeartIcon,
	folder: FolderIcon,
	docs: FileTextIcon,
	article: ArticleIcon,
	cloud: CloudIcon,
	database: DatabaseIcon,
	terminal: TerminalIcon,
	security: ShieldCheckIcon,
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
