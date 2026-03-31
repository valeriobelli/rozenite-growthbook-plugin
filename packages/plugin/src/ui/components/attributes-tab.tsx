import { type } from 'arktype'
import { useRef, useState } from 'react'

import { BooleanInput } from './attribute-inputs/boolean-input'
import { EnumInput } from './attribute-inputs/enum-input'
import { NumberArrayInput } from './attribute-inputs/number-array-input'
import { NumberInput } from './attribute-inputs/number-input'
import { StringArrayInput } from './attribute-inputs/string-array-input'
import { TextInput } from './attribute-inputs/text-input'
import { useData } from './data-provider'
import type { SDKAttribute } from './data-provider/codecs'

const attributesSchema = type('Record<string, unknown>')
const booleanSchema = type('boolean')
const numberSchema = type('number')
const stringSchema = type('string')
const stringArraySchema = type('string[]')
const numberArraySchema = type('number[]')

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

type AttributesTabProps = {
	attributes: Record<string, unknown>
	onSave: (attributes: Record<string, unknown>) => void
}

const defaultValueForType = (datatype: SDKAttribute['datatype']) => {
	switch (datatype) {
		case 'boolean':
			return false
		case 'number':
			return 0
		case 'string':
		case 'secureString':
		case 'enum':
			return ''
		case 'string[]':
		case 'secureString[]':
		case 'number[]':
			return []
	}
}

const AttributeInput = ({
	attrKey,
	onChange,
	schemaAttr,
	value,
}: {
	attrKey: string
	onChange: (value: unknown) => void
	schemaAttr: SDKAttribute | undefined
	value: unknown
}) => {
	const datatype = schemaAttr?.datatype

	if (datatype === 'boolean') {
		const parsed = booleanSchema(value)
		const checked = parsed instanceof type.errors ? false : parsed

		return <BooleanInput checked={checked} onChange={onChange} />
	}

	if (datatype === 'number') {
		const parsed = numberSchema(value)
		const numValue = parsed instanceof type.errors ? 0 : parsed

		return <NumberInput key={`${attrKey}-${numValue}`} initialValue={numValue.toString()} onChange={onChange} />
	}

	if (datatype === 'enum' && schemaAttr) {
		const parsed = stringSchema(value)
		const strValue = parsed instanceof type.errors ? '' : parsed

		const options = (schemaAttr.enum ?? '')
			.split(',')
			.map((o) => o.trim())
			.filter(Boolean)

		return <EnumInput onChange={onChange} options={options} value={strValue} />
	}

	if (datatype === 'string[]' || datatype === 'secureString[]') {
		const parsed = stringArraySchema(value)
		const items = parsed instanceof type.errors ? [] : parsed

		return <StringArrayInput onChange={onChange} value={items} />
	}

	if (datatype === 'number[]') {
		const parsed = numberArraySchema(value)
		const items = parsed instanceof type.errors ? [] : parsed

		return <NumberArrayInput onChange={onChange} value={items} />
	}

	// string, secureString, or no schema
	const parsed = stringSchema(value)
	const strValue = parsed instanceof type.errors ? '' : parsed

	return <TextInput key={`${attrKey}-${strValue}`} initialValue={strValue} onBlurSave={onChange} />
}

export const AttributesTab = ({ attributes, onSave }: AttributesTabProps) => {
	const originalAttributesRef = useRef(attributes)

	const [customAttributeKeys, setCustomAttributeKeys] = useState<Set<string>>(new Set())
	const [jsonMode, setJsonMode] = useState(false)
	const [jsonValue, setJsonValue] = useState('')
	const [jsonError, setJsonError] = useState<string | null>(null)
	const [showAddForm, setShowAddForm] = useState(false)
	const [newFieldKey, setNewFieldKey] = useState('')
	const [newFieldType, setNewFieldType] = useState<SDKAttribute['datatype']>('string')
	const [selectedArchetypeId, setSelectedArchetypeId] = useState('')

	const { archetypes, attributeSchema } = useData()

	const schemaByProperty = new Map(attributeSchema.map((attr) => [attr.property, attr]))

	const isOverridden = (key: string) =>
		JSON.stringify(attributes[key]) !== JSON.stringify(originalAttributesRef.current[key])

	const hasOverrides = Object.keys(attributes).some(isOverridden)

	const handleFieldChange = (key: string, value: unknown) => {
		onSave({ ...attributes, [key]: value })
	}

	const handleReset = (key: string) => {
		const next = { ...attributes }

		if (key in originalAttributesRef.current) {
			next[key] = originalAttributesRef.current[key]
		} else {
			delete next[key]
		}

		onSave(next)
	}

	const handleClearOverrides = () => {
		onSave(originalAttributesRef.current)
		setCustomAttributeKeys(new Set())
	}

	const handleDeleteCustom = (key: string) => {
		const next = { ...attributes }

		delete next[key]

		setCustomAttributeKeys((prev) => {
			const updated = new Set(prev)

			updated.delete(key)

			return updated
		})

		onSave(next)
	}

	const handleAddField = () => {
		if (!newFieldKey.trim()) {
			return
		}

		const key = newFieldKey.trim()

		handleFieldChange(key, defaultValueForType(newFieldType))
		setCustomAttributeKeys((prev) => new Set([...prev, key]))
		setNewFieldKey('')
		setNewFieldType('string')
		setShowAddForm(false)
	}

	const handleApplyArchetype = () => {
		const archetype = archetypes.find((a) => a.id === selectedArchetypeId)

		if (!archetype) {
			return
		}

		onSave(archetype.attributes)
		setCustomAttributeKeys(new Set())
		setSelectedArchetypeId('')
	}

	const handleToggleJsonMode = (enabled: boolean) => {
		setJsonMode(enabled)

		if (!enabled) {
			setJsonError(null)

			return
		}

		setJsonValue(JSON.stringify(attributes, null, 2))
		setJsonError(null)
	}

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

		const newCustomKeys = Object.keys(result).filter((key) => !(key in originalAttributesRef.current))

		setCustomAttributeKeys(new Set(newCustomKeys))
		setJsonError(null)
		setJsonMode(false)
		onSave(result)
	}

	const handleJsonCancel = () => {
		setJsonMode(false)
		setJsonError(null)
		setJsonValue('')
	}

	const schemaEntries = Object.entries(attributes).filter(([key]) => !customAttributeKeys.has(key))

	const customEntries = Object.entries(attributes).filter(([key]) => customAttributeKeys.has(key))

	return (
		<div>
			<div className="mb-3 flex items-center justify-between">
				<span className="text-xs font-semibold uppercase tracking-wider text-panel-text-secondary">
					User Attributes
				</span>

				<div className="flex items-center gap-3">
					{hasOverrides && !jsonMode && (
						<button type="button" className="text-xs text-override hover:underline" onClick={handleClearOverrides}>
							Clear overrides
						</button>
					)}

					<label className="flex cursor-pointer items-center gap-1.5 text-xs text-panel-text-secondary">
						<input
							type="checkbox"
							className="accent-panel-accent"
							checked={jsonMode}
							onChange={(e) => {
								handleToggleJsonMode(e.target.checked)
							}}
						/>
						JSON input
					</label>
				</div>
			</div>

			{archetypes.length > 0 && (
				<div className="mb-3 flex items-center gap-2">
					<select
						className="flex-1 rounded border border-panel-border bg-panel-surface px-2 py-1.5 text-xs text-panel-text"
						value={selectedArchetypeId}
						onChange={(e) => {
							setSelectedArchetypeId(e.target.value)
						}}>
						<option value="">Select archetype...</option>
						{archetypes.map((archetype) => (
							<option key={archetype.id} value={archetype.id}>
								{archetype.name}
							</option>
						))}
					</select>

					<button
						type="button"
						className="rounded bg-panel-surface px-3 py-1.5 text-xs text-panel-text-secondary hover:text-panel-text disabled:opacity-40"
						disabled={!selectedArchetypeId}
						onClick={handleApplyArchetype}>
						Apply
					</button>
				</div>
			)}

			{jsonMode ? (
				<div>
					<textarea
						className="h-80 w-full rounded border border-panel-border bg-panel-surface p-3 font-mono text-sm text-panel-text focus:outline-none focus:ring-1 focus:ring-panel-accent"
						value={jsonValue}
						onChange={(e) => {
							setJsonValue(e.target.value)
							setJsonError(null)
						}}
						spellCheck={false}
					/>

					{jsonError !== null && (
						<div className="mt-1 rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">{jsonError}</div>
					)}

					<div className="mt-2 flex justify-end gap-2">
						<button
							type="button"
							className="rounded px-3 py-1.5 text-xs text-panel-text-secondary hover:text-panel-text"
							onClick={handleJsonCancel}>
							Cancel
						</button>

						<button
							type="button"
							className="rounded bg-panel-accent px-3 py-1.5 text-xs text-white disabled:opacity-40"
							disabled={jsonValue === JSON.stringify(attributes, null, 2) || jsonError !== null}
							onClick={handleJsonApply}>
							Apply
						</button>
					</div>
				</div>
			) : Object.keys(attributes).length === 0 ? (
				<div className="py-8 text-center text-panel-text-secondary">No attributes set</div>
			) : (
				<div className="flex flex-col gap-2">
					{schemaEntries.map(([key, value]) => (
						<div key={key} className="flex items-center gap-2">
							<span className="w-32 shrink-0 font-mono text-sm text-panel-accent" title={key}>
								{key}
							</span>

							<div className="min-w-0 flex-1">
								<AttributeInput
									attrKey={key}
									value={value}
									schemaAttr={schemaByProperty.get(key)}
									onChange={(v) => {
										handleFieldChange(key, v)
									}}
								/>
							</div>

							<div className="w-5 shrink-0">
								{isOverridden(key) && (
									<button
										type="button"
										className="text-override hover:text-override/80"
										title="Reset to original"
										onClick={() => {
											handleReset(key)
										}}>
										↺
									</button>
								)}
							</div>
						</div>
					))}

					{customEntries.length > 0 && (
						<>
							<hr className="border-panel-border" />

							{customEntries.map(([key, value]) => (
								<div key={key} className="flex items-center gap-2">
									<span className="w-32 shrink-0 font-mono text-sm text-panel-accent" title={key}>
										{key}
									</span>

									<div className="min-w-0 flex-1">
										<AttributeInput
											attrKey={key}
											value={value}
											schemaAttr={schemaByProperty.get(key)}
											onChange={(v) => {
												handleFieldChange(key, v)
											}}
										/>
									</div>

									<div className="w-5 shrink-0">
										<button
											type="button"
											className="text-red-400 hover:text-red-300"
											title="Remove attribute"
											onClick={() => {
												handleDeleteCustom(key)
											}}>
											✕
										</button>
									</div>
								</div>
							))}
						</>
					)}
				</div>
			)}

			{!jsonMode && (
				<div className="mt-3">
					{showAddForm ? (
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
										setShowAddForm(false)
									}
								}}
								// eslint-disable-next-line jsx-a11y/no-autofocus
								autoFocus
							/>

							<select
								className="rounded border border-panel-border bg-panel-surface px-2 py-1.5 text-xs text-panel-text"
								value={newFieldType}
								onChange={(e) => {
									const dt = KNOWN_TYPES.find((t) => t === e.target.value)

									if (dt) {
										setNewFieldType(dt)
									}
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
								className="text-sm text-panel-text-secondary hover:text-panel-text"
								onClick={() => {
									setShowAddForm(false)
								}}>
								✕
							</button>
						</div>
					) : (
						<button
							type="button"
							className="text-xs text-panel-text-secondary hover:text-panel-text"
							onClick={() => {
								setShowAddForm(true)
							}}>
							+ Add Field
						</button>
					)}
				</div>
			)}
		</div>
	)
}
