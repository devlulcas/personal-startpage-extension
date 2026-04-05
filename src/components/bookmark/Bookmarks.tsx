import { useCallback } from "react";
import { useBookmarksContext } from "../../app/providers/BookmarksContext";
import { deleteBookmarkByUrl } from "../../services/bookmarks-service";
import type { Bookmark } from "../../types/bookmark";
import { toaster } from "../../utils/toast";
import { BookmarkItem } from "./BookmarkItem";
import styles from "./Bookmarks.module.css";

export function Bookmarks() {
	const { bookmarks, loading, errorMessage, refresh } = useBookmarksContext();
	const handleDeleteBookmark = useCallback(
		async (bookmark: Bookmark) => {
			const result = await deleteBookmarkByUrl(bookmark.url);
			if (!result.ok) {
				toaster.error(result.message);
				return;
			}

			await refresh();
			toaster.success("Bookmark deleted.");
		},
		[refresh],
	);

	if (loading) {
		return <p className={styles.status}>Loading bookmarks...</p>;
	}

	if (errorMessage) {
		return <p className={styles.status}>{errorMessage}</p>;
	}

	return (
		<ul className={styles.bookmarkList}>
			{bookmarks.map((bookmark) => (
				<BookmarkItem
					key={bookmark.url}
					bookmark={bookmark}
					onDeleteBookmark={handleDeleteBookmark}
				/>
			))}
		</ul>
	);
}
