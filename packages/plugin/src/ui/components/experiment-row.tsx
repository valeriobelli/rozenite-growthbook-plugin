import type { ExperimentSnapshot } from '../../shared/types'

import { InlineValue } from './json-viewer'

type ExperimentRowProps = {
	experiment: ExperimentSnapshot
	isOverridden: boolean
	forcedVariation: number | undefined
	onSetOverride: (experimentKey: string, variationIndex: number) => void
	onRemoveOverride: (experimentKey: string) => void
}

export function ExperimentRow({
	experiment,
	isOverridden,
	forcedVariation,
	onSetOverride,
	onRemoveOverride,
}: ExperimentRowProps) {
	const activeVariation = isOverridden ? (forcedVariation ?? experiment.variationId) : experiment.variationId

	return (
		<tr className="border-b border-panel-border hover:bg-panel-surface/50">
			<td className="px-3 py-2 font-mono text-sm">
				<span className={isOverridden ? 'text-override' : ''}>{experiment.key}</span>
				{Boolean(experiment.name) && <span className="ml-2 text-xs text-panel-text-secondary">{experiment.name}</span>}
			</td>
			<td className="px-3 py-2">
				<select
					className="rounded border border-panel-border bg-panel-surface px-2 py-1 text-sm text-panel-text"
					value={activeVariation}
					onChange={(e) => {
						onSetOverride(experiment.key, Number(e.target.value))
					}}>
					{experiment.variations.map((variation, index) => {
						const meta = experiment.meta?.[index]
						const label = meta?.name ?? meta?.key ?? `Variation ${index}`

						return (
							<option key={index} value={index}>
								{label}: {JSON.stringify(variation)}
							</option>
						)
					})}
				</select>
			</td>
			<td className="px-3 py-2">
				<InlineValue value={experiment.value} />
			</td>
			<td className="px-3 py-2 text-center">
				<span
					className={`inline-block rounded px-2 py-0.5 text-xs ${
						experiment.inExperiment ? 'bg-green-500/10 text-green-400' : 'bg-panel-surface text-panel-text-secondary'
					}`}>
					{experiment.inExperiment ? 'In experiment' : 'Not in experiment'}
				</span>
			</td>
			<td className="px-3 py-2 text-center">
				{isOverridden && (
					<button
						type="button"
						className="rounded bg-override-bg px-2 py-0.5 text-xs text-override hover:bg-override/20"
						onClick={() => {
							onRemoveOverride(experiment.key)
						}}>
						Reset
					</button>
				)}
			</td>
		</tr>
	)
}
