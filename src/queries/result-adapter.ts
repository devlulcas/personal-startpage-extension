import type { Result } from "../types/result";

export class ResultQueryError<E extends string = string> extends Error {
	code: E;

	constructor(code: E, message: string) {
		super(message);
		this.code = code;
	}
}

function unwrapResult<T, E extends string>(result: Result<T, E>): T {
	if (result.ok) {
		return result.data;
	}

	throw new ResultQueryError(result.error, result.message);
}

export async function resolveResult<T, E extends string>(
	resultPromise: Promise<Result<T, E>>,
): Promise<T> {
	const result = await resultPromise;
	return unwrapResult(result);
}
