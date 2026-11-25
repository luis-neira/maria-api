// Application errors. Services throw these; only the error handler knows the HTTP status for each code.
export type ErrorCode =
	| "BAD_REQUEST"
	| "NOT_FOUND"
	| "CONFLICT"
	| "VALIDATION_ERROR";

export class AppError extends Error {
	// A field, not a constructor parameter property: Node's type stripping (erasableSyntaxOnly) rejects those
	readonly code: ErrorCode;

	constructor(code: ErrorCode, message: string) {
		super(message);
		this.name = "AppError";
		this.code = code;
	}
}
