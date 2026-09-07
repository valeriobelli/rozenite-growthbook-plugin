export function invariant(condition: unknown, message = 'Invariant violation'): asserts condition {
	if (condition) {
		return
	}

	throw new Error(message)
}

export function assertNever(value: never, message = 'Unexpected value'): never {
	throw new Error(`${message}: ${String(value)}`)
}
