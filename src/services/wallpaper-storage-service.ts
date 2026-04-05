import { err, ok, type Result } from "../types/result";
import {
	applyColorPalette,
	extractColorsFromImage,
} from "../utils/color-extractor";

const COLOR_PALETTE_KEY = "startpage_color_palette";
const DB_NAME = "startpage_db";
const STORE_NAME = "wallpaper";
const WALLPAPER_RECORD_KEY = "image";

interface WallpaperLoadResult {
	imageUrl: string | null;
	palette: Record<string, string> | null;
}

async function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
	});
}

async function putValue(key: string, value: string): Promise<void> {
	const db = await openDB();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		const request = store.put(value, key);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

async function getValue(key: string): Promise<string | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readonly");
		const store = tx.objectStore(STORE_NAME);
		const request = store.get(key);
		request.onerror = () => reject(request.error);
		request.onsuccess = () =>
			resolve((request.result as string | undefined) ?? null);
	});
}

async function clearStore(): Promise<void> {
	const db = await openDB();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		const request = store.clear();
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

export async function saveWallpaper(
	file: File,
): Promise<Result<WallpaperLoadResult, "invalid_image" | "storage_error">> {
	if (!file.type.startsWith("image/")) {
		return err("invalid_image", "Only image files can be used as wallpaper.");
	}

	try {
		const dataUrl = await readFileAsDataUrl(file);
		await putValue(WALLPAPER_RECORD_KEY, dataUrl);

		const palette = await extractColorsFromImage(dataUrl);
		if (palette) {
			localStorage.setItem(COLOR_PALETTE_KEY, JSON.stringify(palette));
			applyColorPalette(palette);
		}

		return ok({ imageUrl: dataUrl, palette });
	} catch {
		return err("storage_error", "Failed to save wallpaper.");
	}
}

export async function loadWallpaper(): Promise<
	Result<WallpaperLoadResult, "storage_error">
> {
	try {
		const paletteRaw = localStorage.getItem(COLOR_PALETTE_KEY);
		const palette = paletteRaw
			? (JSON.parse(paletteRaw) as Record<string, string>)
			: null;

		if (palette) {
			applyColorPalette(palette);
		}

		const imageUrl = await getValue(WALLPAPER_RECORD_KEY);
		return ok({ imageUrl, palette });
	} catch {
		return err("storage_error", "Failed to load saved wallpaper.");
	}
}

export async function resetWallpaper(): Promise<Result<null, "storage_error">> {
	try {
		localStorage.removeItem(COLOR_PALETTE_KEY);
		await clearStore();
		return ok(null);
	} catch {
		return err("storage_error", "Failed to reset wallpaper.");
	}
}
