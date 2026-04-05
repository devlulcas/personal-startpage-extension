import { useCallback } from "react";
import { resolveSearchEngine } from "../config/search-engines";

export function useSearchSubmit() {
	return useCallback((query: string) => {
		const trimmed = query.trim();
		if (!trimmed) {
			return;
		}

		const { engine, searchTerm } = resolveSearchEngine(trimmed);
		if (!searchTerm) {
			return;
		}

		const target = new URL(engine.url);
		target.searchParams.set(engine.searchParam, searchTerm);
		window.location.assign(target.toString());
	}, []);
}
