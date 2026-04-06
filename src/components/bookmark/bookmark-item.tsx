import { LinkIcon, TrashIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { Menu, MenuItem, MenuSection, Popover } from "react-aria-components";
import type { Bookmark } from "../../types/bookmark";
import styles from "./bookmark-item.module.css";

type BookmarkItemProps = {
	bookmark: Bookmark;
	onDeleteBookmark: (bookmark: Bookmark) => Promise<void>;
};

export function BookmarkItem({
	bookmark,
	onDeleteBookmark,
}: BookmarkItemProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const contextMenuAnchorRef = useRef<HTMLAnchorElement | null>(null);
	const handleContextMenu = (event: React.MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsMenuOpen(true);
	};

	return (
		<li className={styles.bookmarkItem}>
			<a
				href={bookmark.url}
				className={styles.bookmarkLink}
				onContextMenu={handleContextMenu}
				ref={contextMenuAnchorRef}
			>
				{bookmark.icon ? (
					<img
						src={bookmark.icon}
						alt={bookmark.title}
						className={styles.bookmarkIcon}
					/>
				) : (
					<LinkIcon
						size={20}
						weight="duotone"
						className={styles.fallbackIcon}
						aria-hidden="true"
					/>
				)}
				<span className={styles.bookmarkTitle}>{bookmark.title}</span>
			</a>

			<Popover
				className={styles.contextMenuPopover}
				isOpen={isMenuOpen}
				triggerRef={contextMenuAnchorRef}
				onOpenChange={setIsMenuOpen}
			>
				<Menu className={styles.contextMenu}>
					<MenuSection>
						<MenuItem
							onAction={() => onDeleteBookmark(bookmark)}
							className={styles.contextMenuItem}
						>
							<TrashIcon size={20} weight="duotone" />
							Delete bookmark
						</MenuItem>
					</MenuSection>
				</Menu>
			</Popover>
		</li>
	);
}
