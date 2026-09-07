import type { PageEnvelope } from '@rozenite/agent-shared'
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '@rozenite/agent-shared'

// Cursors are opaque to the agent. The version prefix lets a cursor minted by an
// older build be rejected outright instead of silently paging from a wrong offset.
const CURSOR_PREFIX = 'v1:'

const INVALID_CURSOR_MESSAGE = 'Invalid cursor. Call the tool again without a cursor to restart pagination.'

export const encodeCursor = (offset: number): string => `${CURSOR_PREFIX}${offset}`

export const decodeCursor = (cursor: string): number => {
	if (!cursor.startsWith(CURSOR_PREFIX)) {
		throw new Error(INVALID_CURSOR_MESSAGE)
	}

	const offset = Number(cursor.slice(CURSOR_PREFIX.length))

	if (!Number.isSafeInteger(offset) || offset < 0) {
		throw new Error(INVALID_CURSOR_MESSAGE)
	}

	return offset
}

export const sanitizeLimit = (limit: number | undefined): number => {
	if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1) {
		return DEFAULT_PAGE_LIMIT
	}

	return Math.min(limit, MAX_PAGE_LIMIT)
}

export type PageOf<TItem> = {
	items: TItem[]
	page: PageEnvelope
	total: number
}

export type PageRequest = {
	cursor?: string
	limit?: number
}

export const paginate = <TItem>(items: TItem[], request: PageRequest): PageOf<TItem> => {
	const limit = sanitizeLimit(request.limit)
	const offset = request.cursor === undefined ? 0 : decodeCursor(request.cursor)
	const end = Math.min(offset + limit, items.length)
	const hasMore = end < items.length

	return {
		items: items.slice(offset, end),
		page: {
			hasMore,
			limit,
			...(hasMore ? { nextCursor: encodeCursor(end) } : {}),
		},
		total: items.length,
	}
}
