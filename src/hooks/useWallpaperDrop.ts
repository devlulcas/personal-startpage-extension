import { useEffect, useState } from "react";

interface UseWallpaperDropOptions {
	onImageDropped: (file: File) => Promise<void>;
}

export function useWallpaperDrop(options: UseWallpaperDropOptions) {
	const { onImageDropped } = options;
	const [isDraggingFile, setIsDraggingFile] = useState(false);

	useEffect(() => {
		let dragCounter = 0;

		function onDragEnter(event: DragEvent) {
			event.preventDefault();
			if (!event.dataTransfer?.types.includes("Files")) {
				return;
			}

			dragCounter += 1;
			setIsDraggingFile(true);
		}

		function onDragLeave(event: DragEvent) {
			event.preventDefault();
			dragCounter = Math.max(0, dragCounter - 1);
			if (dragCounter === 0) {
				setIsDraggingFile(false);
			}
		}

		function onDragOver(event: DragEvent) {
			event.preventDefault();
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "copy";
			}
		}

		async function onDrop(event: DragEvent) {
			event.preventDefault();
			dragCounter = 0;
			setIsDraggingFile(false);

			const files = event.dataTransfer?.files;
			if (!files || files.length === 0) {
				return;
			}

			const imageFile = Array.from(files).find((file) =>
				file.type.startsWith("image/"),
			);
			if (!imageFile) {
				return;
			}

			await onImageDropped(imageFile);
		}

		async function onPaste(event: ClipboardEvent) {
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

				await onImageDropped(file);
				break;
			}
		}

		document.addEventListener("dragenter", onDragEnter);
		document.addEventListener("dragleave", onDragLeave);
		document.addEventListener("dragover", onDragOver);
		document.addEventListener("drop", onDrop);
		document.addEventListener("paste", onPaste);

		return () => {
			document.removeEventListener("dragenter", onDragEnter);
			document.removeEventListener("dragleave", onDragLeave);
			document.removeEventListener("dragover", onDragOver);
			document.removeEventListener("drop", onDrop);
			document.removeEventListener("paste", onPaste);
		};
	}, [onImageDropped]);

	return {
		isDraggingFile,
	};
}
