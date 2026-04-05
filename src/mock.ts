export function generateArrayOf<T>(
	length: number,
	filler: (index: number) => T,
): T[] {
	return Array.from({ length }, (_, index) => filler(index));
}
