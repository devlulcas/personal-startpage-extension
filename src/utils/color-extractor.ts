interface RGB {
	r: number;
	g: number;
	b: number;
}

interface HSL {
	h: number;
	s: number;
	l: number;
}

function rgbToHex(r: number, g: number, b: number): string {
	return (
		"#" +
		[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
	);
}

function rgbToHsl(r: number, g: number, b: number): HSL {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): RGB {
	h /= 360;
	s /= 100;
	l /= 100;

	let r: number, g: number, b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	};
}

function getLuminance(r: number, g: number, b: number): number {
	const [rs, gs, bs] = [r, g, b].map((c) => {
		c /= 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: RGB, color2: RGB): number {
	const l1 = getLuminance(color1.r, color1.g, color1.b);
	const l2 = getLuminance(color2.r, color2.g, color2.b);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

function getContrastingColor(background: RGB): RGB {
	const white = { r: 255, g: 255, b: 255 };
	const black = { r: 0, g: 0, b: 0 };

	const contrastWithWhite = getContrastRatio(background, white);
	const contrastWithBlack = getContrastRatio(background, black);

	return contrastWithWhite >= contrastWithBlack ? white : black;
}

function adjustLightness(
	l: number,
	targetL: number,
	strength: number = 1,
): number {
	return l + (targetL - l) * strength;
}

function medianCut(pixels: RGB[], depth: number): RGB[] {
	if (depth === 0 || pixels.length === 0) {
		const avg = pixels.reduce(
			(acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
			{ r: 0, g: 0, b: 0 },
		);
		if (pixels.length === 0) return [];
		return [
			{
				r: Math.round(avg.r / pixels.length),
				g: Math.round(avg.g / pixels.length),
				b: Math.round(avg.b / pixels.length),
			},
		];
	}

	const rangeR =
		Math.max(...pixels.map((p) => p.r)) - Math.min(...pixels.map((p) => p.r));
	const rangeG =
		Math.max(...pixels.map((p) => p.g)) - Math.min(...pixels.map((p) => p.g));
	const rangeB =
		Math.max(...pixels.map((p) => p.b)) - Math.min(...pixels.map((p) => p.b));

	let sortIndex: "r" | "g" | "b";
	if (rangeR >= rangeG && rangeR >= rangeB) sortIndex = "r";
	else if (rangeG >= rangeR && rangeG >= rangeB) sortIndex = "g";
	else sortIndex = "b";

	pixels.sort((a, b) => a[sortIndex] - b[sortIndex]);
	const mid = Math.floor(pixels.length / 2);

	const left = medianCut(pixels.slice(0, mid), depth - 1);
	const right = medianCut(pixels.slice(mid), depth - 1);

	return [...left, ...right];
}

function isVibrant(color: RGB): boolean {
	const hsl = rgbToHsl(color.r, color.g, color.b);
	return hsl.s > 40 && hsl.l > 15 && hsl.l < 85;
}

function isGoodPrimary(color: RGB): boolean {
	const hsl = rgbToHsl(color.r, color.g, color.b);
	return hsl.s > 20 && hsl.l > 20 && hsl.l < 85;
}

function extractDominantColors(
	imageData: ImageData,
	numColors: number = 5,
): RGB[] {
	const pixels: RGB[] = [];
	const data = imageData.data;

	const step = Math.max(1, Math.floor(data.length / 4 / 10000));

	for (let i = 0; i < data.length; i += 4 * step) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const a = data[i + 3];

		if (a < 128) continue;

		const hsl = rgbToHsl(r, g, b);
		if (hsl.l < 5 || hsl.l > 95) continue;

		pixels.push({ r, g, b });
	}

	if (pixels.length === 0) return [];

	const depth = Math.ceil(Math.log2(numColors * 2));
	const palette = medianCut(pixels, depth);

	const vibrant = palette.filter(isVibrant).sort((a, b) => {
		const hslA = rgbToHsl(a.r, a.g, a.b);
		const hslB = rgbToHsl(b.r, b.g, b.b);
		return (
			hslB.s * (1 - Math.abs(hslB.l - 50) / 50) -
			hslA.s * (1 - Math.abs(hslA.l - 50) / 50)
		);
	});

	const nonVibrant = palette.filter((c) => !isVibrant(c));

	const sortedColors = [...vibrant, ...nonVibrant];

	return sortedColors.slice(0, numColors);
}

function generateMaterialYouPalette(
	dominantColor: RGB,
): Record<string, string> {
	const hsl = rgbToHsl(dominantColor.r, dominantColor.g, dominantColor.b);
	const isDark = hsl.l < 50;

	const primarySaturation = Math.max(60, hsl.s);
	const primaryLightness = isDark
		? Math.min(65, hsl.l + 25)
		: Math.max(35, hsl.l - 25);

	const primary = hslToRgb(hsl.h, primarySaturation, primaryLightness);
	const onPrimary = getContrastingColor(primary);

	const primaryContainerLightness = isDark ? 85 : 25;
	const primaryContainer = hslToRgb(
		hsl.h,
		Math.max(30, primarySaturation - 20),
		primaryContainerLightness,
	);
	const onPrimaryContainer = getContrastingColor(primaryContainer);

	const secondaryLightness = adjustLightness(
		primaryLightness,
		isDark ? 60 : 45,
		0.8,
	);
	const secondary = hslToRgb(
		hsl.h,
		Math.max(20, primarySaturation - 30),
		secondaryLightness,
	);
	const onSecondary = getContrastingColor(secondary);

	const secondaryContainerLightness = isDark ? 80 : 20;
	const secondaryContainer = hslToRgb(
		hsl.h,
		Math.max(20, primarySaturation - 40),
		secondaryContainerLightness,
	);
	const onSecondaryContainer = getContrastingColor(secondaryContainer);

	const tertiaryHue = (hsl.h + 60) % 360;
	const tertiaryLightness = adjustLightness(
		primaryLightness,
		isDark ? 55 : 40,
		0.8,
	);
	const tertiary = hslToRgb(
		tertiaryHue,
		Math.max(40, primarySaturation - 10),
		tertiaryLightness,
	);
	const onTertiary = getContrastingColor(tertiary);

	const tertiaryContainerLightness = isDark ? 75 : 18;
	const tertiaryContainer = hslToRgb(
		tertiaryHue,
		Math.max(30, primarySaturation - 20),
		tertiaryContainerLightness,
	);
	const onTertiaryContainer = getContrastingColor(tertiaryContainer);

	const surfaceLightness = isDark ? 10 : 98;
	const surface = hslToRgb(hsl.h, Math.min(15, hsl.s * 0.2), surfaceLightness);

	const surfaceVariantLightness = isDark ? 28 : 90;
	const surfaceVariant = hslToRgb(
		hsl.h,
		Math.max(10, primarySaturation - 50),
		surfaceVariantLightness,
	);

	const onSurface = getContrastingColor(surface);
	const onSurfaceVariant = getContrastingColor(surfaceVariant);

	const background = { ...surface };
	const onBackground = { ...onSurface };

	const outlineLightness = isDark ? 50 : 60;
	const outline = hslToRgb(
		hsl.h,
		Math.max(10, primarySaturation - 40),
		outlineLightness,
	);

	const outlineVariantLightness = isDark ? 38 : 78;
	const outlineVariant = hslToRgb(
		hsl.h,
		Math.max(10, primarySaturation - 50),
		outlineVariantLightness,
	);

	const inverseSurfaceLightness = isDark ? 92 : 22;
	const inverseSurface = hslToRgb(
		hsl.h,
		Math.max(20, primarySaturation),
		inverseSurfaceLightness,
	);
	const inverseOnSurface = getContrastingColor(inverseSurface);

	const inversePrimaryLightness = isDark ? 45 : 65;
	const inversePrimary = hslToRgb(
		hsl.h,
		Math.max(60, primarySaturation),
		inversePrimaryLightness,
	);

	const surfaceDim = isDark ? hslToRgb(hsl.h, 5, 8) : hslToRgb(hsl.h, 3, 85);

	return {
		"--seed": rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b),
		"--primary": rgbToHex(primary.r, primary.g, primary.b),
		"--on-primary": rgbToHex(onPrimary.r, onPrimary.g, onPrimary.b),
		"--primary-container": rgbToHex(
			primaryContainer.r,
			primaryContainer.g,
			primaryContainer.b,
		),
		"--on-primary-container": rgbToHex(
			onPrimaryContainer.r,
			onPrimaryContainer.g,
			onPrimaryContainer.b,
		),
		"--secondary": rgbToHex(secondary.r, secondary.g, secondary.b),
		"--on-secondary": rgbToHex(onSecondary.r, onSecondary.g, onSecondary.b),
		"--secondary-container": rgbToHex(
			secondaryContainer.r,
			secondaryContainer.g,
			secondaryContainer.b,
		),
		"--on-secondary-container": rgbToHex(
			onSecondaryContainer.r,
			onSecondaryContainer.g,
			onSecondaryContainer.b,
		),
		"--tertiary": rgbToHex(tertiary.r, tertiary.g, tertiary.b),
		"--on-tertiary": rgbToHex(onTertiary.r, onTertiary.g, onTertiary.b),
		"--tertiary-container": rgbToHex(
			tertiaryContainer.r,
			tertiaryContainer.g,
			tertiaryContainer.b,
		),
		"--on-tertiary-container": rgbToHex(
			onTertiaryContainer.r,
			onTertiaryContainer.g,
			onTertiaryContainer.b,
		),
		"--error": isDark ? "#ffb4ab" : "#ba1a1a",
		"--on-error": isDark ? "#690005" : "#ffffff",
		"--error-container": isDark ? "#93000a" : "#ffdada",
		"--on-error-container": isDark ? "#ffdad6" : "#410002",
		"--background": rgbToHex(background.r, background.g, background.b),
		"--on-background": rgbToHex(onBackground.r, onBackground.g, onBackground.b),
		"--surface": rgbToHex(surface.r, surface.g, surface.b),
		"--surface-dim": rgbToHex(surfaceDim.r, surfaceDim.g, surfaceDim.b),
		"--surface-variant": rgbToHex(
			surfaceVariant.r,
			surfaceVariant.g,
			surfaceVariant.b,
		),
		"--on-surface": rgbToHex(onSurface.r, onSurface.g, onSurface.b),
		"--on-surface-variant": rgbToHex(
			onSurfaceVariant.r,
			onSurfaceVariant.g,
			onSurfaceVariant.b,
		),
		"--outline": rgbToHex(outline.r, outline.g, outline.b),
		"--outline-variant": rgbToHex(
			outlineVariant.r,
			outlineVariant.g,
			outlineVariant.b,
		),
		"--inverse-surface": rgbToHex(
			inverseSurface.r,
			inverseSurface.g,
			inverseSurface.b,
		),
		"--inverse-on-surface": rgbToHex(
			inverseOnSurface.r,
			inverseOnSurface.g,
			inverseOnSurface.b,
		),
		"--inverse-primary": rgbToHex(
			inversePrimary.r,
			inversePrimary.g,
			inversePrimary.b,
		),
		"--scrim": "#000000",
		"--shadow": isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.2)",
	};
}

export async function extractColorsFromImage(
	imageUrl: string,
): Promise<Record<string, string> | null> {
	return new Promise((resolve) => {
		const img = new Image();

		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				resolve(null);
				return;
			}

			const maxSize = 200;
			const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
			canvas.width = img.width * scale;
			canvas.height = img.height * scale;

			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

			const colors = extractDominantColors(imageData, 5);
			if (colors.length === 0) {
				resolve(null);
				return;
			}

			const vibrantColor = colors.find(isGoodPrimary) || colors[0];
			const palette = generateMaterialYouPalette(vibrantColor);

			resolve(palette);
		};

		img.onerror = () => resolve(null);

		if (imageUrl.startsWith("data:")) {
			img.src = imageUrl;
		} else {
			img.crossOrigin = "anonymous";
			img.src = imageUrl;
		}
	});
}

export function applyColorPalette(palette: Record<string, string>): void {
	const root = document.documentElement;

	Object.entries(palette).forEach(([property, value]) => {
		root.style.setProperty(property, value);
	});
}
