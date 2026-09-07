import { defineAgentToolDescriptors } from '@rozenite/agent-shared'

import { growthbookToolDefinitions, growthbookToolNames } from './src/shared/agent-tools'
import { PLUGIN_ID } from './src/shared/constants'

export const growthbookTools = defineAgentToolDescriptors(PLUGIN_ID, growthbookToolDefinitions)

export { growthbookToolDefinitions, growthbookToolNames, PLUGIN_ID }

export type {
	AttributesResult,
	ClearFeatureOverridesResult,
	ClearVariationOverridesResult,
	ExperimentListItem,
	FeatureListItem,
	FeatureView,
	GetFeatureArgs,
	GetFeatureResult,
	GetStateResult,
	ListExperimentsArgs,
	ListExperimentsResult,
	ListFeaturesArgs,
	ListFeaturesResult,
	NoArgs,
	PatchAttributesArgs,
	RemoveAttributesArgs,
	RemoveAttributesResult,
	RemoveFeatureOverrideArgs,
	RemoveFeatureOverrideResult,
	RemoveVariationOverrideArgs,
	RemoveVariationOverrideResult,
	ReplaceAttributesArgs,
	SetFeatureOverrideArgs,
	SetFeatureOverrideResult,
	SetVariationOverrideArgs,
	SetVariationOverrideResult,
} from './src/shared/agent-tools'
export type { SdkInfoSnapshot } from './src/shared/types'
