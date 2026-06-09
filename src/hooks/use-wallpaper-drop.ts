import { useEffect } from "react";

type UseWallpaperPasteOptions = {
	onImagePasted: (file: File) => Promise<void>;
};

export function useWallpaperPaste(options: UseWallpaperPasteOptions) {
	const { onImagePasted } = options;
	useEffect(() => {
		const onPaste = async (event: ClipboardEvent) => {
			const items = event.clipboardData?.items;
			if (!items) {
				return;
			}

			for (const item of items) {
				if (!item.type.startsWith("image/")) {
					continue;
				}

				const file = item.getAsFile();
				if (!file) {
					continue;
				}

				await onImagePasted(file);
				break;
			}
		};

		document.addEventListener("paste", onPaste);

		return () => {
			document.removeEventListener("paste", onPaste);
		};
	}, [onImagePasted]);
}
