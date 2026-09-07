import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@rozenite/agent-shared'
import { describe, expect, it } from 'vitest'

import { decodeCursor, encodeCursor, paginate, sanitizeLimit } from './pagination'

describe('sanitizeLimit', () => {
	it('falls back to the default limit for a missing or unusable value', () => {
		expect(sanitizeLimit(undefined)).toBe(DEFAULT_PAGE_LIMIT)
		expect(sanitizeLimit(0)).toBe(DEFAULT_PAGE_LIMIT)
		expect(sanitizeLimit(-5)).toBe(DEFAULT_PAGE_LIMIT)
		expect(sanitizeLimit(1.5)).toBe(DEFAULT_PAGE_LIMIT)
	})

	it('caps the limit so one call cannot return everything', () => {
		expect(sanitizeLimit(500)).toBe(MAX_PAGE_LIMIT)
		expect(sanitizeLimit(7)).toBe(7)
	})
})

describe('cursors', () => {
	it('round-trips an offset', () => {
		expect(decodeCursor(encodeCursor(0))).toBe(0)
		expect(decodeCursor(encodeCursor(42))).toBe(42)
	})

	it('rejects a cursor it did not mint, with a message that says how to recover', () => {
		expect(() => decodeCursor('garbage')).toThrow(/without a cursor to restart pagination/u)
		expect(() => decodeCursor('v1:-1')).toThrow(/without a cursor/u)
		expect(() => decodeCursor('v1:abc')).toThrow(/without a cursor/u)
		expect(() => decodeCursor('v0:3')).toThrow(/without a cursor/u)
	})
})

describe('paginate', () => {
	const items = Array.from({ length: 5 }, (_, index) => index)

	it('reports the total and advertises a next cursor while pages remain', () => {
		const first = paginate(items, { limit: 2 })

		expect(first).toMatchObject({ items: [0, 1], total: 5 })
		expect(first.page.hasMore).toBe(true)
		expect(first.page.nextCursor).toBeTypeOf('string')
	})

	it('walks every item exactly once across pages', () => {
		const collected: number[] = []
		let cursor: string | undefined

		do {
			const page = paginate(items, { cursor, limit: 2 })

			collected.push(...page.items)
			cursor = page.page.nextCursor
		} while (cursor !== undefined)

		expect(collected).toEqual(items)
	})

	it('omits the next cursor on the last page', () => {
		const page = paginate(items, { limit: 10 })

		expect(page.page.hasMore).toBe(false)
		expect(page.page.nextCursor).toBeUndefined()
	})
})
