import { generateArrayOf } from "../mock";
import type { Bookmark } from "../types/bookmark";
import { err, ok, type Result } from "../types/result";

type BookmarkError = "browser_api_unavailable" | "fetch_failed";
type DeleteBookmarkError =
	| "browser_api_unavailable"
	| "bookmark_not_found"
	| "delete_failed";

function getFaviconURL(nodeUrl: string): string {
	const url = new URL(chrome.runtime.getURL("/_favicon/"));
	url.searchParams.set("pageUrl", nodeUrl);
	url.searchParams.set("size", "32");
	return url.toString();
}

function toBookmark(node: chrome.bookmarks.BookmarkTreeNode): Bookmark | null {
	console.log(node);
	if (!node.url) {
		return null;
	}

	const icon = getFaviconURL(node.url);

	return {
		title: node.title || node.url,
		url: node.url,
		icon,
		lastUsedAt: node.dateLastUsed,
	};
}

function flattenBookmarks(
	nodes: chrome.bookmarks.BookmarkTreeNode[],
): Bookmark[] {
	const output: Bookmark[] = [];

	for (const node of nodes) {
		const bookmark = toBookmark(node);
		if (bookmark) {
			output.push(bookmark);
		}

		if (node.children?.length) {
			output.push(...flattenBookmarks(node.children));
		}
	}

	return output;
}

function sortRecentUsedBookmarks(bookmarks: Bookmark[]): Bookmark[] {
	return bookmarks.sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0));
}
export async function getBookmarks(): Promise<
	Result<Bookmark[], BookmarkError>
> {
	if (import.meta.env.DEV) {
		const mockBookmarks = generateArrayOf(10, (index) => ({
			title: `Bookmark ${index + 1}`,
			url: `https://example.com/${index + 1}`,
			icon: `https://picsum.photos/200/200?random=${index + 1}`,
			lastUsedAt: Date.now(),
		}));

		return ok(mockBookmarks);
	}

	if (!globalThis.chrome?.bookmarks?.getTree) {
		return err(
			"browser_api_unavailable",
			"Chrome bookmarks API is not available in this environment.",
		);
	}

	try {
		const tree = await chrome.bookmarks.getTree();
		const bookmarks = sortRecentUsedBookmarks(flattenBookmarks(tree));
		return ok(bookmarks);
	} catch {
		return err("fetch_failed", "Failed to load browser bookmarks.");
	}
}

export async function deleteBookmarkByUrl(
	url: string,
): Promise<Result<void, DeleteBookmarkError>> {
	if (
		!globalThis.chrome?.bookmarks?.search ||
		!globalThis.chrome?.bookmarks?.remove
	) {
		return err(
			"browser_api_unavailable",
			"Chrome bookmarks API is not available in this environment.",
		);
	}

	try {
		const matches = await chrome.bookmarks.search({ url });
		const bookmarkNode = matches.find((node) => Boolean(node.url));
		if (!bookmarkNode?.id) {
			return err("bookmark_not_found", "Bookmark not found.");
		}

		await chrome.bookmarks.remove(bookmarkNode.id);
		return ok(undefined);
	} catch {
		return err("delete_failed", "Failed to delete bookmark.");
	}
}
