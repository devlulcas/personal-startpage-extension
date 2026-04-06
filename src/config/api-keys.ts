type ApiKeysConfig = {
	keys: string[];
	currentIndex: number;
	keysInputValue: string;
};

class ApiKeyRotator {
	private config: ApiKeysConfig;
	private static readonly API_KEYS_STORAGE_KEY = "weather_api_keys";
	private static readonly API_KEY_INDEX_STORAGE_KEY = "weather_api_key_index";

	constructor() {
		this.config = this.loadKeys();
	}

	private parseKeysInput(input: string): string[] {
		return input
			.split(",")
			.map((key) => key.trim())
			.filter((key) => key.length > 0);
	}

	private loadKeys(): ApiKeysConfig {
		const keysInputValue =
			localStorage.getItem(ApiKeyRotator.API_KEYS_STORAGE_KEY) ?? "";
		const keys = this.parseKeysInput(keysInputValue);
		const savedIndex = localStorage.getItem(
			ApiKeyRotator.API_KEY_INDEX_STORAGE_KEY,
		);
		const currentIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
		const normalizedIndex =
			keys.length > 0 ? Math.min(currentIndex, keys.length - 1) : 0;

		return {
			keys,
			currentIndex: normalizedIndex,
			keysInputValue,
		};
	}

	setKeysFromInput(input: string): void {
		const keysInputValue = input.trim();
		const keys = this.parseKeysInput(keysInputValue);
		const currentIndex =
			keys.length > 0 ? Math.min(this.config.currentIndex, keys.length - 1) : 0;

		this.config = {
			keys,
			currentIndex,
			keysInputValue,
		};

		localStorage.setItem(ApiKeyRotator.API_KEYS_STORAGE_KEY, keysInputValue);
		localStorage.setItem(
			ApiKeyRotator.API_KEY_INDEX_STORAGE_KEY,
			currentIndex.toString(),
		);
	}

	getKeysInputValue(): string {
		return this.config.keysInputValue;
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
			ApiKeyRotator.API_KEY_INDEX_STORAGE_KEY,
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
