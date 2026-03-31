export function invariant(condition: unknown, message = 'Invariant violation'): asserts condition {
	if (condition) {
		return
	}

	throw new Error(message)
}
