type SearchEngine = {
	name: string;
	url: string;
	icon: string;
	shortcut: string;
	searchParam: string;
};

const defaultSearchEngine: SearchEngine = {
	name: "Google",
	url: "https://www.google.com/search",
	icon: "https://www.google.com/favicon.ico",
	shortcut: "g",
	searchParam: "q",
};

const searchEngines: SearchEngine[] = [
	defaultSearchEngine,
	{
		name: "DuckDuckGo",
		url: "https://duckduckgo.com/",
		icon: "https://duckduckgo.com/favicon.ico",
		shortcut: "d",
		searchParam: "q",
	},
	{
		name: "Brave",
		url: "https://search.brave.com/search",
		icon: "https://search.brave.com/favicon.ico",
		shortcut: "b",
		searchParam: "q",
	},
	{
		name: "Wikipedia",
		url: "https://wikipedia.org/w/index.php",
		icon: "https://www.wikipedia.org/favicon.ico",
		shortcut: "w",
		searchParam: "search",
	},
];

export function resolveSearchEngine(query: string): {
	engine: SearchEngine;
	searchTerm: string;
} {
	if (query.startsWith("!")) {
		const [shortcut, ...rest] = query.slice(1).split(" ");
		const engine = searchEngines.find(
			(candidate) => candidate.shortcut === shortcut,
		);
		if (engine) {
			return { engine, searchTerm: rest.join(" ").trim() };
		}
	}

	return { engine: defaultSearchEngine, searchTerm: query };
}
