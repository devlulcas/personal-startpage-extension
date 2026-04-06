import { createContext, useContext, useMemo } from "react";
import { useBookmarks } from "../../hooks/use-bookmarks";
import type { Bookmark } from "../../types/bookmark";

type BookmarksContextValue = {
	bookmarks: Bookmark[];
	loading: boolean;
	errorMessage: string | null;
	refresh: () => Promise<void>;
};

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
	const { bookmarks, loading, errorMessage, refresh } = useBookmarks();

	const value = useMemo<BookmarksContextValue>(
		() => ({
			bookmarks,
			loading,
			errorMessage,
			refresh,
		}),
		[bookmarks, errorMessage, loading, refresh],
	);

	return (
		<BookmarksContext.Provider value={value}>
			{children}
		</BookmarksContext.Provider>
	);
}

export function useBookmarksContext(): BookmarksContextValue {
	const context = useContext(BookmarksContext);
	if (!context) {
		throw new Error(
			"useBookmarksContext must be used within BookmarksProvider.",
		);
	}

	return context;
}
