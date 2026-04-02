import { useDeferredValue, useMemo, useState } from 'react'

import type { FeatureSnapshot } from '../../shared/types'

import { FeatureRow } from './feature-row'

type FeaturesTabProps = {
	features: FeatureSnapshot[]
	forcedFeatures: Record<string, unknown>
	onSetOverride: (key: string, value: unknown) => void
	onRemoveOverride: (key: string) => void
	onClearAll: () => void
}

export const FeaturesTab = ({
	features,
	forcedFeatures,
	onSetOverride,
	onRemoveOverride,
	onClearAll,
}: FeaturesTabProps) => {
	const [search, setSearch] = useState('')
	const deferredSearch = useDeferredValue(search)

	const filteredFeatures = useMemo(
		() => features.filter((f) => f.key.toLowerCase().includes(deferredSearch.trim().toLowerCase())),
		[features, deferredSearch]
	)

	const hasOverrides = Object.keys(forcedFeatures).length > 0

	return (
		<div>
			<div className="mb-3 flex items-center gap-3">
				<input
					type="text"
					aria-label="Filter features"
					placeholder="Filter features..."
					className="flex-1 rounded border border-panel-border bg-panel-surface px-3 py-1.5 text-sm text-panel-text placeholder:text-panel-text-secondary"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value)
					}}
				/>
				{hasOverrides && (
					<button
						type="button"
						className="rounded bg-override-bg px-3 py-1.5 text-xs text-override hover:bg-override/20"
						onClick={onClearAll}>
						Clear all overrides
					</button>
				)}
				<span className="text-xs text-panel-text-secondary">
					{filteredFeatures.length} feature
					{filteredFeatures.length !== 1 ? 's' : ''}
				</span>
			</div>

			{filteredFeatures.length === 0 ? (
				<div className="py-8 text-center text-panel-text-secondary">
					{search ? 'No features match your filter' : 'No features loaded'}
				</div>
			) : (
				<table className="w-full">
					<thead>
						<tr className="border-b border-panel-border text-left text-xs text-panel-text-secondary">
							<th className="px-3 py-2 font-medium">Key</th>
							<th className="px-3 py-2 font-medium">Value</th>
							<th className="px-3 py-2 font-medium">Source</th>
							<th className="px-3 py-2 text-center font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filteredFeatures.map((feature) => (
							<FeatureRow
								key={feature.key}
								feature={feature}
								isOverridden={feature.key in forcedFeatures}
								overriddenValue={forcedFeatures[feature.key]}
								onSetOverride={onSetOverride}
								onRemoveOverride={onRemoveOverride}
							/>
						))}
					</tbody>
				</table>
			)}
		</div>
	)
}
