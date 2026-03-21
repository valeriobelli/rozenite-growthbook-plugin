import { type } from 'arktype'
import { useState } from 'react'

import { JsonViewer } from './json-viewer'

const attributesSchema = type('Record<string, unknown>')

type AttributesTabProps = {
	attributes: Record<string, unknown>
	onSave: (attributes: Record<string, unknown>) => void
}

export function AttributesTab({ attributes, onSave }: AttributesTabProps) {
	const [editing, setEditing] = useState(false)
	const [editValue, setEditValue] = useState('')
	const [error, setError] = useState<string | null>(null)

	const handleEditStart = () => {
		setEditValue(JSON.stringify(attributes, null, 2))
		setEditing(true)
	}

	const handleSave = () => {
		let raw: unknown
		try {
			raw = JSON.parse(editValue)
		} catch {
			setError('Invalid JSON')

			return
		}

		const result = attributesSchema(raw)

		if (result instanceof type.errors) {
			setError('Attributes must be a JSON object')

			return
		}

		setError(null)

		onSave(result)
		setEditing(false)
	}

	const handleCancel = () => {
		setEditing(false)
		setError(null)

		setEditValue(JSON.stringify(attributes, null, 2))
	}

	const entries = Object.entries(attributes)

	return (
		<div>
			<div className="mb-3 flex items-center justify-between">
				<span className="text-xs text-panel-text-secondary">
					{entries.length} attribute{entries.length !== 1 ? 's' : ''}
				</span>
				{editing ? (
					<div className="flex gap-2">
						<button
							type="button"
							className="rounded bg-panel-accent px-3 py-1.5 text-xs text-white"
							onClick={handleSave}>
							Save
						</button>
						<button
							type="button"
							className="rounded px-3 py-1.5 text-xs text-panel-text-secondary hover:text-panel-text"
							onClick={handleCancel}>
							Cancel
						</button>
					</div>
				) : (
					<button
						type="button"
						className="rounded bg-panel-surface px-3 py-1.5 text-xs text-panel-text-secondary hover:text-panel-text"
						onClick={handleEditStart}>
						Edit
					</button>
				)}
			</div>

			{error !== null && <div className="mb-3 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}

			{editing ? (
				<textarea
					className="h-80 w-full rounded border border-panel-border bg-panel-surface p-3 font-mono text-sm text-panel-text"
					value={editValue}
					onChange={(e) => {
						setEditValue(e.target.value)
						setError(null)
					}}
					spellCheck={false}
				/>
			) : entries.length === 0 ? (
				<div className="py-8 text-center text-panel-text-secondary">No attributes set</div>
			) : (
				<table className="w-full">
					<thead>
						<tr className="border-b border-panel-border text-left text-xs text-panel-text-secondary">
							<th className="px-3 py-2 font-medium">Key</th>
							<th className="px-3 py-2 font-medium">Value</th>
						</tr>
					</thead>
					<tbody>
						{entries.map(([key, value]) => (
							<tr key={key} className="border-b border-panel-border hover:bg-panel-surface/50">
								<td className="px-3 py-2 font-mono text-sm text-panel-accent">{key}</td>
								<td className="px-3 py-2 text-sm">
									<JsonViewer data={value} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	)
}
