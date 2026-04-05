interface ApiKeysConfig {
	keys: string[];
	currentIndex: number;
}

class ApiKeyRotator {
	private config: ApiKeysConfig;

	constructor() {
		this.config = this.loadKeys();
	}

	private loadKeys(): ApiKeysConfig {
		const keys: string[] = [];

		const key1 = import.meta.env.VITE_WEATHER_API_KEY_1;
		const key2 = import.meta.env.VITE_WEATHER_API_KEY_2;
		const key3 = import.meta.env.VITE_WEATHER_API_KEY_3;

		if (key1) keys.push(key1);
		if (key2) keys.push(key2);
		if (key3) keys.push(key3);

		const savedIndex = localStorage.getItem("weather_api_key_index");
		const currentIndex = savedIndex ? parseInt(savedIndex, 10) : 0;

		return { keys, currentIndex: Math.min(currentIndex, keys.length - 1) };
	}

	getCurrentKey(): string | null {
		if (this.config.keys.length === 0) return null;
		return this.config.keys[this.config.currentIndex];
	}

	getNextKey(): string | null {
		if (this.config.keys.length === 0) return null;
		if (this.config.keys.length === 1) return this.config.keys[0];

		this.config.currentIndex =
			(this.config.currentIndex + 1) % this.config.keys.length;
		localStorage.setItem(
			"weather_api_key_index",
			this.config.currentIndex.toString(),
		);

		return this.config.keys[this.config.currentIndex];
	}

	getAllKeys(): string[] {
		return [...this.config.keys];
	}

	hasKeys(): boolean {
		return this.config.keys.length > 0;
	}
}

export const apiKeyRotator = new ApiKeyRotator();
