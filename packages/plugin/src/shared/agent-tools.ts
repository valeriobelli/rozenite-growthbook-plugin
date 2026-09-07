import type { AgentToolContract, JSONSchema7, PageEnvelope } from '@rozenite/agent-shared'
import { defineAgentToolContract, definePaginatedAgentToolContract } from '@rozenite/agent-shared'
import { type } from 'arktype'

import type { SdkInfoSnapshot } from './types'

const toInputSchema = (schema: { toJsonSchema: () => object }): JSONSchema7 => {
	const inputSchema: JSONSchema7 = {}

	// arktype emits a draft 2020-12 `$schema` key. `AgentTool.inputSchema` is
	// JSONSchema7, so the key is dropped rather than advertised as draft-07.
	for (const [key, value] of Object.entries(schema.toJsonSchema())) {
		if (key === '$schema') {
			continue
		}

		inputSchema[key] = value
	}

	return inputSchema
}

// Descriptions are noun phrases on purpose: arktype uses the same string for the
// JSON Schema `description` and for the "must be ..." clause of a failed argument,
// so a sentence here would read as a broken error message to the calling agent.
const pageProperties = {
	'cursor?': type('string').describe('an opaque cursor from a previous call, passed back unchanged'),
	'limit?': type('number.integer').describe('an integer page size (default 20, maximum 100)'),
} as const

// `additionalProperties: false` so the contract says "no arguments" outright.
// An empty `properties` alone still permits extra keys, which would read to an
// agent as though `{ foo: 'bar' }` were a meaningful call.
const NO_ARGS_INPUT_SCHEMA: JSONSchema7 = { additionalProperties: false, properties: {}, type: 'object' }

export const ListFeaturesArgs = type({ ...pageProperties })

export const GetFeatureArgs = type({
	key: type('string').describe('a feature key, as returned by list-features'),
})

export const ListExperimentsArgs = type({ ...pageProperties })

export const SetFeatureOverrideArgs = type({
	key: type('string').describe('a feature key'),
	value: type('unknown').describe('the value to force (any JSON value the feature can hold)'),
})

export const RemoveFeatureOverrideArgs = type({
	key: type('string').describe('the feature key whose override is removed'),
})

export const SetVariationOverrideArgs = type({
	experimentKey: type('string').describe('an experiment key, as returned by list-experiments'),
	variationIndex: type('number.integer').describe('a zero-based index into the experiment variations'),
})

export const RemoveVariationOverrideArgs = type({
	experimentKey: type('string').describe('the experiment key whose forced variation is removed'),
})

export const PatchAttributesArgs = type({
	attributes: type('Record<string, unknown>').describe(
		'a map of attributes to merge into the current ones; attributes not named keep their value'
	),
})

export const ReplaceAttributesArgs = type({
	attributes: type('Record<string, unknown>').describe(
		'the complete new attribute map; every attribute not named in it is deleted'
	),
})

export const RemoveAttributesArgs = type({
	keys: type('string[]').describe('the names of the attributes to delete'),
})

// An agent may send no arguments at all, and `type({})` rejects `undefined`, so
// these tools carry a hand-written schema and their handlers ignore the parameter.
export type NoArgs = undefined
export type ListFeaturesArgs = typeof ListFeaturesArgs.infer
export type GetFeatureArgs = typeof GetFeatureArgs.infer
export type ListExperimentsArgs = typeof ListExperimentsArgs.infer
export type SetFeatureOverrideArgs = typeof SetFeatureOverrideArgs.infer
export type RemoveFeatureOverrideArgs = typeof RemoveFeatureOverrideArgs.infer
export type SetVariationOverrideArgs = typeof SetVariationOverrideArgs.infer
export type RemoveVariationOverrideArgs = typeof RemoveVariationOverrideArgs.infer
export type PatchAttributesArgs = typeof PatchAttributesArgs.infer
export type ReplaceAttributesArgs = typeof ReplaceAttributesArgs.infer
export type RemoveAttributesArgs = typeof RemoveAttributesArgs.infer

export type FeatureListItem = {
	key: string
	on: boolean
	overridden: boolean
	ruleId: string
	source: string
	value: unknown
}

export type FeatureView = FeatureListItem & {
	experimentKey?: string
	variationId?: number
}

export type ExperimentListItem = {
	forcedVariationIndex?: number
	hashAttribute: string
	inExperiment: boolean
	key: string
	name?: string
	variationId: number
}

export type ListFeaturesResult = {
	items: FeatureListItem[]
	page: PageEnvelope
	total: number
}

export type GetFeatureResult = {
	feature: FeatureView
}

export type ListExperimentsResult = {
	items: ExperimentListItem[]
	page: PageEnvelope
	total: number
}

export type GetStateResult = {
	attributes: Record<string, unknown>
	forcedFeatures: Record<string, unknown>
	forcedVariations: Record<string, number>
	sdkInfo: SdkInfoSnapshot
}

export type SetFeatureOverrideResult = {
	feature: FeatureView
}

export type RemoveFeatureOverrideResult = {
	feature: FeatureView
	key: string
	removed: boolean
}

export type ClearFeatureOverridesResult = {
	cleared: number
}

export type SetVariationOverrideResult = {
	experimentKey: string
	forcedVariations: Record<string, number>
	variationIndex: number
}

export type RemoveVariationOverrideResult = {
	experimentKey: string
	forcedVariations: Record<string, number>
	removed: boolean
}

export type ClearVariationOverridesResult = {
	cleared: number
}

export type AttributesResult = {
	attributes: Record<string, unknown>
}

export type RemoveAttributesResult = {
	attributes: Record<string, unknown>
	removed: string[]
}

export const growthbookToolDefinitions = {
	clearFeatureOverrides: defineAgentToolContract<NoArgs, ClearFeatureOverridesResult>({
		description:
			'Remove every forced feature value at once. Each feature goes back to the value the SDK evaluates for the current attributes.',
		destructive: true,
		idempotent: true,
		inputSchema: NO_ARGS_INPUT_SCHEMA,
		name: 'clear-feature-overrides',
	}),
	clearVariationOverrides: defineAgentToolContract<NoArgs, ClearVariationOverridesResult>({
		description:
			'Remove every forced experiment variation at once. Each experiment goes back to its normal hash-based assignment.',
		destructive: true,
		idempotent: true,
		inputSchema: NO_ARGS_INPUT_SCHEMA,
		name: 'clear-variation-overrides',
	}),
	getFeature: defineAgentToolContract<GetFeatureArgs, GetFeatureResult>({
		description:
			'Read one feature in full: the evaluated value, whether it is on, the rule and source that decided it, the experiment behind it, and whether an override is in force.',
		idempotent: true,
		inputSchema: toInputSchema(GetFeatureArgs),
		name: 'get-feature',
		readOnly: true,
	}),
	getState: defineAgentToolContract<NoArgs, GetStateResult>({
		description:
			'Read the current user attributes, the forced feature values, the forced experiment variations, and the SDK info in one call.',
		idempotent: true,
		inputSchema: NO_ARGS_INPUT_SCHEMA,
		name: 'get-state',
		readOnly: true,
	}),
	listExperiments: definePaginatedAgentToolContract<ListExperimentsArgs, ListExperimentsResult>({
		description:
			'List the experiments the SDK has evaluated, with the assigned variation and whether a variation is forced. Call get-state for the full forced-variation map.',
		idempotent: true,
		inputSchema: toInputSchema(ListExperimentsArgs),
		name: 'list-experiments',
		pagination: {
			defaultFields: ['key', 'variationId', 'inExperiment'],
			fields: ['key', 'name', 'variationId', 'inExperiment', 'hashAttribute', 'forcedVariationIndex'],
			kind: 'cursor',
		},
		readOnly: true,
	}),
	listFeatures: definePaginatedAgentToolContract<ListFeaturesArgs, ListFeaturesResult>({
		description:
			'List every feature the SDK knows, with its evaluated value and whether an override is in force. Call get-feature for the rule and experiment detail of one key.',
		idempotent: true,
		inputSchema: toInputSchema(ListFeaturesArgs),
		name: 'list-features',
		pagination: {
			defaultFields: ['key', 'on', 'value', 'overridden'],
			fields: ['key', 'on', 'value', 'source', 'ruleId', 'overridden'],
			kind: 'cursor',
		},
		readOnly: true,
	}),
	patchAttributes: defineAgentToolContract<PatchAttributesArgs, AttributesResult>({
		description:
			'Merge attributes into the current user attributes. Attributes not named keep their value. Prefer this over replace-attributes. Changing an attribute re-evaluates every feature and experiment.',
		idempotent: true,
		inputSchema: toInputSchema(PatchAttributesArgs),
		name: 'patch-attributes',
	}),
	removeAttributes: defineAgentToolContract<RemoveAttributesArgs, RemoveAttributesResult>({
		description: 'Delete the named user attributes. Attributes not named keep their value.',
		idempotent: true,
		inputSchema: toInputSchema(RemoveAttributesArgs),
		name: 'remove-attributes',
	}),
	removeFeatureOverride: defineAgentToolContract<RemoveFeatureOverrideArgs, RemoveFeatureOverrideResult>({
		description:
			'Remove the forced value of one feature. The feature goes back to the value the SDK evaluates for the current attributes.',
		idempotent: true,
		inputSchema: toInputSchema(RemoveFeatureOverrideArgs),
		name: 'remove-feature-override',
	}),
	removeVariationOverride: defineAgentToolContract<RemoveVariationOverrideArgs, RemoveVariationOverrideResult>({
		description:
			'Remove the forced variation of one experiment. The experiment goes back to its normal hash-based assignment.',
		idempotent: true,
		inputSchema: toInputSchema(RemoveVariationOverrideArgs),
		name: 'remove-variation-override',
	}),
	replaceAttributes: defineAgentToolContract<ReplaceAttributesArgs, AttributesResult>({
		description:
			'Replace the whole user attribute map. Every attribute not named in the argument is DELETED. Use patch-attributes unless you intend to drop the other attributes.',
		destructive: true,
		idempotent: true,
		inputSchema: toInputSchema(ReplaceAttributesArgs),
		name: 'replace-attributes',
	}),
	setFeatureOverride: defineAgentToolContract<SetFeatureOverrideArgs, SetFeatureOverrideResult>({
		description:
			'Force a feature to a given value on the device, whatever its rules say. The override lives in memory only and disappears when the app reloads.',
		idempotent: true,
		inputSchema: toInputSchema(SetFeatureOverrideArgs),
		name: 'set-feature-override',
	}),
	setVariationOverride: defineAgentToolContract<SetVariationOverrideArgs, SetVariationOverrideResult>({
		description:
			'Force an experiment to a given variation index on the device. The override lives in memory only and disappears when the app reloads.',
		idempotent: true,
		inputSchema: toInputSchema(SetVariationOverrideArgs),
		name: 'set-variation-override',
	}),
} as const satisfies Record<string, AgentToolContract>

export const growthbookToolNames = {
	clearFeatureOverrides: growthbookToolDefinitions.clearFeatureOverrides.name,
	clearVariationOverrides: growthbookToolDefinitions.clearVariationOverrides.name,
	getFeature: growthbookToolDefinitions.getFeature.name,
	getState: growthbookToolDefinitions.getState.name,
	listExperiments: growthbookToolDefinitions.listExperiments.name,
	listFeatures: growthbookToolDefinitions.listFeatures.name,
	patchAttributes: growthbookToolDefinitions.patchAttributes.name,
	removeAttributes: growthbookToolDefinitions.removeAttributes.name,
	removeFeatureOverride: growthbookToolDefinitions.removeFeatureOverride.name,
	removeVariationOverride: growthbookToolDefinitions.removeVariationOverride.name,
	replaceAttributes: growthbookToolDefinitions.replaceAttributes.name,
	setFeatureOverride: growthbookToolDefinitions.setFeatureOverride.name,
	setVariationOverride: growthbookToolDefinitions.setVariationOverride.name,
} as const
