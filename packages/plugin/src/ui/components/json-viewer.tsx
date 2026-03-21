import { useState } from 'react'

type JsonViewerProps = {
	data: unknown
	depth?: number
	maxDepth?: number
}

function getValueColor(value: unknown): string {
	if (value === null || value === undefined) {
		return 'text-value-null'
	}

	if (typeof value === 'string') {
		return 'text-value-string'
	}

	if (typeof value === 'number') {
		return 'text-value-number'
	}

	if (typeof value === 'boolean') {
		return 'text-value-boolean'
	}

	return 'text-value-object'
}

function formatValue(value: unknown): string {
	if (value === null) {
		return 'null'
	}

	if (value === undefined) {
		return 'undefined'
	}

	if (typeof value === 'string') {
		return `"${value}"`
	}

	return JSON.stringify(value)
}

export function JsonViewer({ data, depth = 0, maxDepth = 5 }: JsonViewerProps) {
	const [expanded, setExpanded] = useState(depth < 2)

	if (data === null || data === undefined || typeof data !== 'object') {
		return <span className={getValueColor(data)}>{formatValue(data)}</span>
	}

	const isArray = Array.isArray(data)
	const entries: [string, unknown][] = Object.entries(data)

	const openBracket = isArray ? '[' : '{'
	const closeBracket = isArray ? ']' : '}'

	if (entries.length === 0) {
		return (
			<span className="text-panel-text-secondary">
				{openBracket}
				{closeBracket}
			</span>
		)
	}

	if (depth >= maxDepth) {
		return (
			<span className="text-panel-text-secondary">
				{openBracket}...{closeBracket}
			</span>
		)
	}

	return (
		<span>
			<button
				type="button"
				className="text-panel-text-secondary hover:text-panel-text"
				onClick={() => {
					setExpanded(!expanded)
				}}>
				{expanded ? '▾' : '▸'} {openBracket}
			</button>
			{expanded ? (
				<>
					<div className="ml-4">
						{entries.map(([key, entryValue]) => (
							<div key={key}>
								<span className="text-panel-accent">{key}</span>
								<span className="text-panel-text-secondary">: </span>
								<JsonViewer data={entryValue} depth={depth + 1} maxDepth={maxDepth} />
							</div>
						))}
					</div>
					<span className="text-panel-text-secondary">{closeBracket}</span>
				</>
			) : (
				<span className="text-panel-text-secondary">
					{entries.length} {isArray ? 'items' : 'keys'}
					{closeBracket}
				</span>
			)}
		</span>
	)
}

export function InlineValue({ value }: { value: unknown }) {
	if (typeof value === 'object' && value !== null) {
		const str = JSON.stringify(value)

		return (
			<span className="text-value-object">
				{str.slice(0, 80)}
				{str.length > 80 ? '...' : ''}
			</span>
		)
	}

	return <span className={getValueColor(value)}>{formatValue(value)}</span>
}
