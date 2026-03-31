const getValueColor = (value: unknown) => {
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

const formatValue = (value: unknown) => {
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

export const InlineValue = ({ value }: { value: unknown }) => {
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
