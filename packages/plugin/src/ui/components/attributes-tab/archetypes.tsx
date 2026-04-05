import { useState } from 'react'

import type { SDKArchetype } from './data-provider/codecs'

interface ArchetypesProps {
	archetypes: SDKArchetype[]
	onSelectArchetype: (archetype: SDKArchetype) => void
}

export const Archetypes = ({ archetypes, onSelectArchetype }: ArchetypesProps) => {
	const [selectedArchetypeId, setSelectedArchetypeId] = useState('')

	return (
		<div className="mb-3 flex items-center gap-2">
			<select
				className="flex-1 rounded border border-panel-border bg-panel-surface px-2 py-1.5 text-xs text-panel-text"
				value={selectedArchetypeId}
				onChange={(e) => {
					setSelectedArchetypeId(e.target.value)
				}}>
				<option value="">Select archetype...</option>

				{archetypes.map(({ id, name }) => (
					<option key={id} value={id}>
						{name}
					</option>
				))}
			</select>

			<button
				type="button"
				className="rounded bg-panel-surface px-3 py-1.5 text-xs text-panel-text-secondary hover:text-panel-text disabled:opacity-40"
				disabled={!selectedArchetypeId}
				onClick={() => {
					const archetype = archetypes.find(({ id }) => id === selectedArchetypeId)

					if (!archetype) {
						return
					}

					onSelectArchetype(archetype)
				}}>
				Apply
			</button>
		</div>
	)
}
