import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useSearchSubmit } from "../../hooks/use-search-submit";
import styles from "./search-bar.module.css";

export function SearchBar() {
	const [query, setQuery] = useState("");
	const submitSearch = useSearchSubmit();

	function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		submitSearch(query);
	}

	return (
		<form onSubmit={handleSubmit} className={styles.searchContainer}>
			<input
				type="text"
				name="q"
				value={query}
				onChange={(event) => setQuery(event.currentTarget.value)}
				placeholder="Search"
				autoComplete="off"
				className={styles.searchInput}
			/>
			<button type="submit" aria-label="Search" className={styles.searchButton}>
				<MagnifyingGlassIcon size={22} weight="bold" />
			</button>
		</form>
	);
}
