import { useState } from 'react'

import type { FeatureSnapshot } from '../../shared/types'

import { InlineValue } from './json-viewer'

type FeatureRowProps = {
	feature: FeatureSnapshot
	isOverridden: boolean
	overriddenValue: unknown
	onSetOverride: (key: string, value: unknown) => void
	onRemoveOverride: (key: string) => void
}

export const FeatureRow = ({
	feature,
	isOverridden,
	overriddenValue,
	onSetOverride,
	onRemoveOverride,
}: FeatureRowProps) => {
	const [editing, setEditing] = useState(false)
	const [editValue, setEditValue] = useState('')

	const displayValue = isOverridden ? overriddenValue : feature.value

	const isBoolean = typeof displayValue === 'boolean'

	const handleToggle = () => {
		if (!isBoolean) {
			return
		}

		onSetOverride(feature.key, !displayValue)
	}

	const handleEditSave = () => {
		try {
			const parsed = JSON.parse(editValue) as unknown

			onSetOverride(feature.key, parsed)
			setEditing(false)
		} catch {
			// Keep editing on invalid JSON
		}
	}

	const handleEditStart = () => {
		setEditValue(JSON.stringify(displayValue, null, 2))
		setEditing(true)
	}

	return (
		<tr className="border-b border-panel-border hover:bg-panel-surface/50">
			<td className="px-3 py-2 font-mono text-sm">
				<span className={isOverridden ? 'text-override' : ''}>{feature.key}</span>
			</td>
			<td className="px-3 py-2">
				{editing ? (
					<div className="flex items-center gap-2">
						<input
							type="text"
							aria-label={`Edit value for ${feature.key}`}
							className="flex-1 rounded border border-panel-border bg-panel-bg px-2 py-1 text-sm text-panel-text"
							value={editValue}
							onChange={(e) => {
								setEditValue(e.target.value)
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleEditSave()
								}
								if (e.key === 'Escape') {
									setEditing(false)
								}
							}}
						/>
						<button
							type="button"
							className="rounded bg-panel-accent px-2 py-1 text-xs text-white"
							onClick={handleEditSave}>
							Save
						</button>
						<button
							type="button"
							className="rounded px-2 py-1 text-xs text-panel-text-secondary hover:text-panel-text"
							onClick={() => {
								setEditing(false)
							}}>
							Cancel
						</button>
					</div>
				) : (
					<button
						type="button"
						className="inline-flex cursor-pointer items-center leading-none"
						role={isBoolean ? 'switch' : undefined}
						aria-checked={isBoolean ? displayValue : undefined}
						aria-label={isBoolean ? `Toggle ${feature.key}` : `Edit value for ${feature.key}`}
						onClick={isBoolean ? handleToggle : handleEditStart}>
						{isBoolean ? (
							<span
								className={`relative inline-block h-4 w-8 overflow-hidden rounded-full transition-colors ${
									displayValue ? 'bg-panel-success' : 'bg-panel-border'
								}`}>
								<span
									className={`absolute left-0 top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
										displayValue ? 'translate-x-4' : 'translate-x-0.5'
									}`}
								/>
							</span>
						) : (
							<InlineValue value={displayValue} />
						)}
					</button>
				)}
			</td>
			<td className="px-3 py-2">
				<span className="rounded bg-panel-surface px-2 py-0.5 text-xs text-panel-text-secondary">{feature.source}</span>
			</td>
			<td className="px-3 py-2 text-center">
				{isOverridden ? (
					<button
						type="button"
						className="rounded bg-override-bg px-2 py-0.5 text-xs text-override hover:bg-override/20"
						onClick={() => {
							onRemoveOverride(feature.key)
						}}>
						Reset
					</button>
				) : !isBoolean ? (
					<button
						type="button"
						className="rounded px-2 py-0.5 text-xs text-panel-text-secondary hover:text-panel-text"
						onClick={handleEditStart}>
						Override
					</button>
				) : null}
			</td>
		</tr>
	)
}
