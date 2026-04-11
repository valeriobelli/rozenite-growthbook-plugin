import { type } from 'arktype'
import { useMemo } from 'react'

import { BooleanInput } from './boolean-input'
import type { SDKAttribute } from './data-provider/codecs'
import { EnumInput } from './enum-input'
import { NumberArrayInput } from './number-array-input'
import { NumberInput } from './number-input'
import { StringArrayInput } from './string-array-input'
import { TextInput } from './text-input'

const booleanSchema = type('boolean')
const numberSchema = type('number')
const stringSchema = type('string')
const stringArraySchema = type('string[]')
const numberArraySchema = type('number[]')

interface AttributeInputProps {
	attrKey: string
	onChange: (value: unknown) => void
	schemaAttr: SDKAttribute | undefined
	value: unknown
}

function AttributeInput({ attrKey, onChange, schemaAttr, value }: AttributeInputProps) {
	const dataType = schemaAttr?.datatype

	if (dataType === 'boolean') {
		const parsed = booleanSchema(value)
		const checked = parsed instanceof type.errors ? false : parsed

		return <BooleanInput checked={checked} onChange={onChange} />
	}

	if (dataType === 'number') {
		const parsed = numberSchema(value)
		const numValue = parsed instanceof type.errors ? 0 : parsed

		return <NumberInput key={`${attrKey}-${numValue}`} initialValue={numValue.toString()} onChange={onChange} />
	}

	if (dataType === 'enum' && schemaAttr) {
		const parsed = stringSchema(value)
		const strValue = parsed instanceof type.errors ? '' : parsed

		const options = (schemaAttr.enum ?? '')
			.split(',')
			.map((o) => o.trim())
			.filter(Boolean)

		return <EnumInput onChange={onChange} options={options} value={strValue} />
	}

	if (dataType === 'string[]' || dataType === 'secureString[]') {
		const parsed = stringArraySchema(value)
		const items = parsed instanceof type.errors ? [] : parsed

		return <StringArrayInput onChange={onChange} value={items} />
	}

	if (dataType === 'number[]') {
		const parsed = numberArraySchema(value)
		const items = parsed instanceof type.errors ? [] : parsed

		return <NumberArrayInput onChange={onChange} value={items} />
	}

	if (dataType === 'string' || dataType === 'secureString') {
		const parsed = stringSchema(value)
		const strValue = parsed instanceof type.errors ? '' : parsed

		return <TextInput key={`${attrKey}-${strValue}`} initialValue={strValue} onBlurSave={onChange} />
	}

	if (typeof value === 'boolean') {
		const parsed = booleanSchema(value)
		const checked = parsed instanceof type.errors ? false : parsed

		return <BooleanInput checked={checked} onChange={onChange} />
	}

	if (typeof value === 'number') {
		const parsed = numberSchema(value)
		const numValue = parsed instanceof type.errors ? 0 : parsed

		return <NumberInput key={`${attrKey}-${numValue}`} initialValue={numValue.toString()} onChange={onChange} />
	}

	if (Array.isArray(value)) {
		const parsedAsNumArray = numberArraySchema(value)

		if (!(parsedAsNumArray instanceof type.errors)) {
			return <NumberArrayInput onChange={onChange} value={parsedAsNumArray} />
		}

		const parsedAsStrArray = stringArraySchema(value)
		const items = parsedAsStrArray instanceof type.errors ? [] : parsedAsStrArray

		return <StringArrayInput onChange={onChange} value={items} />
	}

	const strValue = typeof value === 'string' ? value : (JSON.stringify(value) ?? '')

	const handleChange = (inputValue: string) => {
		try {
			onChange(JSON.parse(inputValue))
		} catch {
			onChange(inputValue)
		}
	}

	return <TextInput key={`${attrKey}-${strValue}`} initialValue={strValue} onBlurSave={handleChange} />
}

interface AttributesTabFormProps {
	attributes: Record<string, unknown>
	customAttributeKeys: Set<string>
	onChange: (key: string, value: unknown) => void
	onDelete: (key: string) => void
	onReset: (key: string) => void
	overriddenKeys: Set<string>
	sdkAttributes: SDKAttribute[]
}

export function AttributesTabForm({
	attributes,
	customAttributeKeys,
	onChange,
	onDelete,
	onReset,
	overriddenKeys,
	sdkAttributes,
}: AttributesTabFormProps) {
	const schemaByProperty = useMemo(() => new Map(sdkAttributes.map((attr) => [attr.property, attr])), [sdkAttributes])

	const { custom: customEntries = [], schema: schemaEntries = [] } = useMemo(
		() => Object.groupBy(Object.entries(attributes), ([key]) => (customAttributeKeys.has(key) ? 'custom' : 'schema')),
		[attributes, customAttributeKeys]
	)

	return (
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
							onChange={(inputValue) => {
								onChange(key, inputValue)
							}}
						/>
					</div>

					<div className="w-5 shrink-0">
						{overriddenKeys.has(key) && (
							<button
								type="button"
								className="text-override hover:text-override/80"
								aria-label="Reset to original"
								onClick={() => {
									onReset(key)
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
										onChange(key, v)
									}}
								/>
							</div>

							<div className="w-5 shrink-0">
								<button
									type="button"
									className="text-panel-error hover:text-panel-error/80"
									aria-label="Remove attribute"
									onClick={() => {
										onDelete(key)
									}}>
									✕
								</button>
							</div>
						</div>
					))}
				</>
			)}
		</div>
	)
}
