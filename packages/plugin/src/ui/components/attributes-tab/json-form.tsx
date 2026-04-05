import { type } from 'arktype'
import { useState } from 'react'

const attributesSchema = type('Record<string, unknown>')

export interface AttributeJsonFormProps {
	attributes?: Record<string, unknown>
	onCancel: () => void
	onSave: (result: Record<string, unknown>) => void
}

export function AttributesTabJsonForm({ attributes = {}, onCancel, onSave }: AttributeJsonFormProps) {
	const [jsonValue, setJsonValue] = useState(() => JSON.stringify(attributes, null, 2))
	const [dirty, setDirty] = useState(false)
	const [jsonError, setJsonError] = useState<string | null>(null)

	const handleJsonApply = () => {
		let raw: unknown

		try {
			raw = JSON.parse(jsonValue)
		} catch {
			setJsonError('Invalid JSON')

			return
		}

		const result = attributesSchema(raw)

		if (result instanceof type.errors) {
			setJsonError('Attributes must be a JSON object')

			return
		}

		onSave(result)
	}

	return (
		<div>
			<textarea
				className="h-80 w-full rounded border border-panel-border bg-panel-surface p-3 font-mono text-sm text-panel-text focus:outline-none focus:ring-1 focus:ring-panel-accent"
				value={jsonValue}
				onChange={(e) => {
					setJsonValue(e.target.value)
					setJsonError(null)
					setDirty(true)
				}}
				spellCheck={false}
			/>

			{Boolean(jsonError) && (
				<div aria-live="polite" aria-atomic="true" className="mt-1 min-h-0">
					<div className="rounded bg-panel-error-bg px-3 py-2 text-xs text-panel-error">{jsonError}</div>
				</div>
			)}

			<div className="mt-2 flex justify-end gap-2">
				<button
					type="button"
					className="rounded px-3 py-1.5 text-xs text-panel-text-secondary hover:text-panel-text"
					onClick={onCancel}>
					Cancel
				</button>

				<button
					type="button"
					className="rounded bg-panel-accent px-3 py-1.5 text-xs text-white disabled:opacity-40"
					disabled={!dirty || Boolean(jsonError)}
					onClick={handleJsonApply}>
					Apply
				</button>
			</div>
		</div>
	)
}
