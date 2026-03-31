import { useMemo, useState } from 'react'

import type { ExperimentSnapshot } from '../../shared/types'

import { ExperimentRow } from './experiment-row'

type ExperimentsTabProps = {
	experiments: ExperimentSnapshot[]
	forcedVariations: Record<string, number>
	onSetOverride: (experimentKey: string, variationIndex: number) => void
	onRemoveOverride: (experimentKey: string) => void
	onClearAll: () => void
}

export const ExperimentsTab = ({
	experiments,
	forcedVariations,
	onSetOverride,
	onRemoveOverride,
	onClearAll,
}: ExperimentsTabProps) => {
	const [search, setSearch] = useState('')

	const filteredExperiments = useMemo(() => {
		if (!search) {
			return experiments
		}

		const lower = search.toLowerCase()

		return experiments.filter(
			(e) => e.key.toLowerCase().includes(lower) || (e.name?.toLowerCase().includes(lower) ?? false)
		)
	}, [experiments, search])

	const hasOverrides = Object.keys(forcedVariations).length > 0

	return (
		<div>
			<div className="mb-3 flex items-center gap-3">
				<input
					type="text"
					placeholder="Filter experiments..."
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
					{filteredExperiments.length} experiment
					{filteredExperiments.length !== 1 ? 's' : ''}
				</span>
			</div>

			{!filteredExperiments.length ? (
				<div className="py-8 text-center text-panel-text-secondary">
					{search ? 'No experiments match your filter' : 'No experiments loaded'}
				</div>
			) : (
				<table className="w-full">
					<thead>
						<tr className="border-b border-panel-border text-left text-xs text-panel-text-secondary">
							<th className="px-3 py-2 font-medium">Key</th>
							<th className="px-3 py-2 font-medium">Variation</th>
							<th className="px-3 py-2 font-medium">Value</th>
							<th className="px-3 py-2 text-center font-medium">Status</th>
							<th className="px-3 py-2 text-center font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filteredExperiments.map((experiment) => (
							<ExperimentRow
								key={experiment.key}
								experiment={experiment}
								isOverridden={experiment.key in forcedVariations}
								forcedVariation={forcedVariations[experiment.key]}
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
