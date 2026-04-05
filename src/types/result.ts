export type Result<T, E extends string = never> =
	| { ok: true; data: T }
	| { ok: false; error: E; message: string };

export function ok<T>(data: T): Result<T, never> {
	return { ok: true, data };
}

export function err<const E extends string>(
	error: E,
	message: string,
): Result<never, E> {
	return { ok: false, error, message };
}
