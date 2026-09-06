import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Suspense, useCallback, useMemo, useState } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'

import { assertNever } from '../../../shared/utils'
import { ErrorFallback as BaseErrorFallback } from '../error'
import { Loader } from '../loader'

import { AddCustomForm } from './add-custom-form'
import { Archetypes } from './archetypes'
import { DataProvider, useData } from './data-provider'
import type { SDKArchetype, SDKAttribute } from './data-provider/codecs'
import { AttributesTabEmptyState } from './empty-state'
import { AttributesTabForm } from './form'
import { AttributesTabJsonForm } from './json-form'

type AttributesTabProps = {
	apiHost: string
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
		default:
			return assertNever(datatype)
	}
}

const ErrorFallback = (props: FallbackProps) => {
	const { reset } = useQueryErrorResetBoundary()

	return <BaseErrorFallback {...props} onReset={reset} />
}

const AttributesTabInner = ({ attributes, onSave }: AttributesTabProps) => {
	const [originalAttributes, setOriginalAttributes] = useState(attributes)
	const [customAttributeKeys, setCustomAttributeKeys] = useState(new Set<string>())
	const [jsonMode, setJsonMode] = useState(false)

	const { sdkArchetypes, sdkAttributes } = useData()

	const overriddenKeys = useMemo(() => {
		const original = originalAttributes

		return new Set(
			Object.keys(attributes).filter((key) => JSON.stringify(attributes[key]) !== JSON.stringify(original[key]))
		)
	}, [attributes, originalAttributes])

	const hasOverrides = overriddenKeys.size > 0

	const handleFieldChange = useCallback(
		(key: string, value: unknown) => {
			onSave({ ...attributes, [key]: value })
		},
		[attributes, onSave]
	)

	const handleReset = useCallback(
		(key: string) => {
			const next = { ...attributes }

			if (key in originalAttributes) {
				next[key] = originalAttributes[key]
			} else {
				delete next[key]
			}

			setOriginalAttributes(next)

			onSave(next)
		},
		[attributes, onSave, originalAttributes]
	)

	const handleClearOverrides = useCallback(() => {
		onSave(originalAttributes)
		setCustomAttributeKeys(new Set())
	}, [onSave, originalAttributes])

	const handleDeleteCustom = useCallback(
		(key: string) => {
			const next = { ...attributes }

			delete next[key]

			setCustomAttributeKeys((prev) => {
				const updated = new Set(prev)

				updated.delete(key)

				return updated
			})

			onSave(next)
		},
		[attributes, onSave]
	)

	const handleAddField = useCallback(
		(newFieldKey: string, newFieldType: SDKAttribute['datatype']) => {
			if (!newFieldKey.trim()) {
				return
			}

			const key = newFieldKey.trim()

			handleFieldChange(key, defaultValueForType(newFieldType))
			setCustomAttributeKeys((prev) => new Set([...prev, key]))
		},
		[handleFieldChange]
	)

	const handleApplyArchetype = useCallback(
		(archetype: SDKArchetype) => {
			onSave(archetype.attributes)
			setCustomAttributeKeys(new Set())
		},
		[onSave]
	)

	const handleJsonApply = useCallback(
		(result: Record<string, unknown>) => {
			const newCustomKeys = Object.keys(result).filter((key) => !(key in originalAttributes))

			onSave(result)
			setCustomAttributeKeys(new Set(newCustomKeys))
			setJsonMode(false)
		},
		[onSave, originalAttributes]
	)

	const handleJsonCancel = useCallback(() => {
		setJsonMode(false)
	}, [])

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
								setJsonMode(e.target.checked)
							}}
						/>
						JSON input
					</label>
				</div>
			</div>

			{sdkArchetypes.length > 0 && <Archetypes archetypes={sdkArchetypes} onSelectArchetype={handleApplyArchetype} />}

			{jsonMode ? (
				<AttributesTabJsonForm attributes={attributes} onCancel={handleJsonCancel} onSave={handleJsonApply} />
			) : Object.keys(attributes).length === 0 ? (
				<AttributesTabEmptyState />
			) : (
				<AttributesTabForm
					attributes={attributes}
					customAttributeKeys={customAttributeKeys}
					onChange={handleFieldChange}
					onDelete={handleDeleteCustom}
					onReset={handleReset}
					overriddenKeys={overriddenKeys}
					sdkAttributes={sdkAttributes}
				/>
			)}

			{!jsonMode && <AddCustomForm onAdd={handleAddField} />}
		</div>
	)
}

export const AttributesTab = (props: AttributesTabProps) => (
	<ErrorBoundary FallbackComponent={ErrorFallback}>
		<Suspense fallback={<Loader>Fetching GrowthBook data...</Loader>}>
			<DataProvider apiHost={props.apiHost}>
				<AttributesTabInner {...props} />
			</DataProvider>
		</Suspense>
	</ErrorBoundary>
)
