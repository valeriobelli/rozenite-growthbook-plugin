import { atom, useAtomValue, useSetAtom } from 'jotai'
import { useState } from 'react'

import type { SDKAttribute } from './data-provider/codecs'

const KNOWN_TYPES: ReadonlyArray<SDKAttribute['datatype']> = [
	'boolean',
	'enum',
	'number',
	'number[]',
	'secureString',
	'secureString[]',
	'string',
	'string[]',
]

const toggleAtom = atom(false, (get, set, nextValue?: boolean) => {
	const update = nextValue ?? !get(toggleAtom)

	set(toggleAtom, update)
})

const InitialState = () => {
	const toggle = useSetAtom(toggleAtom)

	return (
		<div className="mt-3">
			<button
				type="button"
				className="text-xs text-panel-text-secondary hover:text-panel-text"
				onClick={() => {
					toggle()
				}}>
				+ Add Field
			</button>
		</div>
	)
}

interface FormProps {
	onAdd: (key: string, datatype: SDKAttribute['datatype']) => void
}

const Form = ({ onAdd }: FormProps) => {
	const [newFieldKey, setNewFieldKey] = useState('')
	const [newFieldType, setNewFieldType] = useState<SDKAttribute['datatype']>('string')
	const toggle = useSetAtom(toggleAtom)

	const handleAddField = () => {
		onAdd(newFieldKey.trim(), newFieldType)

		toggle()
	}

	return (
		<div className="mt-3">
			<div className="flex items-center gap-2">
				<input
					type="text"
					placeholder="Attribute name"
					className="min-w-0 flex-1 rounded border border-panel-border bg-panel-surface px-2 py-1.5 text-sm text-panel-text placeholder:text-panel-text-secondary focus:outline-none focus:ring-1 focus:ring-panel-accent"
					value={newFieldKey}
					onChange={(e) => {
						setNewFieldKey(e.target.value)
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							handleAddField()
						}

						if (e.key === 'Escape') {
							toggle()
						}
					}}
					// eslint-disable-next-line jsx-a11y/no-autofocus
					autoFocus
				/>

				<select
					className="rounded border border-panel-border bg-panel-surface px-2 py-1.5 text-xs text-panel-text"
					value={newFieldType}
					onChange={(event) => {
						const dataType = KNOWN_TYPES.find((type) => type === event.target.value)

						if (!dataType) {
							return
						}

						setNewFieldType(dataType)
					}}>
					{KNOWN_TYPES.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>

				<button
					type="button"
					className="rounded bg-panel-accent px-3 py-1.5 text-xs text-white disabled:opacity-40"
					disabled={!newFieldKey.trim()}
					onClick={handleAddField}>
					Add
				</button>

				<button
					type="button"
					aria-label="Cancel"
					className="text-sm text-panel-text-secondary hover:text-panel-text"
					onClick={() => {
						toggle()
					}}>
					✕
				</button>
			</div>
		</div>
	)
}

interface AddCustomFormProps {
	onAdd: (key: string, datatype: SDKAttribute['datatype']) => void
}

export const AddCustomForm = ({ onAdd }: AddCustomFormProps) => {
	const formIsOpen = useAtomValue(toggleAtom)

	if (!formIsOpen) {
		return <InitialState />
	}

	return <Form onAdd={onAdd} />
}
