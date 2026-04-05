import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "../queries/queryKeys";
import { resolveResult } from "../queries/result-adapter";
import { getBookmarks } from "../services/bookmarks-service";
import type { Bookmark } from "../types/bookmark";

export function useBookmarks() {
	const bookmarksQuery = useQuery<Bookmark[]>({
		queryKey: queryKeys.bookmarks(),
		queryFn: () => resolveResult(getBookmarks()),
		staleTime: 5 * 60 * 1000,
	});

	const refresh = useCallback(async () => {
		await bookmarksQuery.refetch();
	}, [bookmarksQuery]);

	return {
		bookmarks: bookmarksQuery.data ?? [],
		loading: bookmarksQuery.isPending,
		errorMessage:
			bookmarksQuery.error instanceof Error
				? bookmarksQuery.error.message
				: null,
		refresh,
	};
}
