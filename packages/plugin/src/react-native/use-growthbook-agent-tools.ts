import { useRozenitePluginAgentTool } from '@rozenite/agent-bridge'
import type { Type } from 'arktype'
import { type } from 'arktype'

import {
	GetFeatureArgs,
	growthbookToolDefinitions,
	ListExperimentsArgs,
	ListFeaturesArgs,
	PatchAttributesArgs,
	RemoveAttributesArgs,
	RemoveFeatureOverrideArgs,
	RemoveVariationOverrideArgs,
	ReplaceAttributesArgs,
	SetFeatureOverrideArgs,
	SetVariationOverrideArgs,
} from '../shared/agent-tools'
import { PLUGIN_ID } from '../shared/constants'

import type { GrowthBookController } from './growthbook-controller'

interface Props {
	controller: GrowthBookController
	runSuppressed: <TResult>(read: () => TResult) => TResult
}

/**
 * The bridge does no argument validation of its own and types the handler
 * parameter from the contract, so the value still arrives unchecked at runtime.
 * A thrown error is how the bridge reports a failed call to the agent.
 */
const narrow = <TSchema extends Type>(schema: TSchema, raw: unknown): TSchema['infer'] => {
	const args = schema(raw)

	if (args instanceof type.errors) {
		throw new Error(args.summary)
	}

	return args
}

export const useGrowthBookAgentTools = ({ controller, runSuppressed }: Props) => {
	useRozenitePluginAgentTool({
		handler: (raw) => runSuppressed(() => controller.listFeatures(narrow(ListFeaturesArgs, raw))),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.listFeatures,
	})

	useRozenitePluginAgentTool({
		handler: (raw) => runSuppressed(() => controller.getFeature(narrow(GetFeatureArgs, raw))),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.getFeature,
	})

	useRozenitePluginAgentTool({
		handler: (raw) => runSuppressed(() => controller.listExperiments(narrow(ListExperimentsArgs, raw))),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.listExperiments,
	})

	useRozenitePluginAgentTool({
		handler: () => runSuppressed(() => controller.getState()),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.getState,
	})

	// Writes run unsuppressed so the panel still receives gb:state-update, then the
	// response is read back suppressed so a second update is not emitted.
	useRozenitePluginAgentTool({
		handler: (raw) => {
			const args = narrow(SetFeatureOverrideArgs, raw)

			controller.setFeatureOverride(args)

			return runSuppressed(() => controller.getFeature({ key: args.key }))
		},
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.setFeatureOverride,
	})

	useRozenitePluginAgentTool({
		handler: (raw) => {
			const args = narrow(RemoveFeatureOverrideArgs, raw)
			const removed = controller.removeFeatureOverride(args)

			return runSuppressed(() => ({
				...controller.getFeature({ key: args.key }),
				key: args.key,
				removed,
			}))
		},
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.removeFeatureOverride,
	})

	useRozenitePluginAgentTool({
		handler: () => ({ cleared: controller.clearFeatureOverrides() }),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.clearFeatureOverrides,
	})

	useRozenitePluginAgentTool({
		handler: async (raw) => {
			const args = narrow(SetVariationOverrideArgs, raw)

			await controller.setVariationOverride(args)

			return {
				experimentKey: args.experimentKey,
				forcedVariations: controller.getState().forcedVariations,
				variationIndex: args.variationIndex,
			}
		},
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.setVariationOverride,
	})

	useRozenitePluginAgentTool({
		handler: async (raw) => {
			const args = narrow(RemoveVariationOverrideArgs, raw)
			const removed = await controller.removeVariationOverride(args)

			return {
				experimentKey: args.experimentKey,
				forcedVariations: controller.getState().forcedVariations,
				removed,
			}
		},
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.removeVariationOverride,
	})

	useRozenitePluginAgentTool({
		handler: async () => ({ cleared: await controller.clearVariationOverrides() }),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.clearVariationOverrides,
	})

	useRozenitePluginAgentTool({
		handler: (raw) => controller.patchAttributes(narrow(PatchAttributesArgs, raw)),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.patchAttributes,
	})

	useRozenitePluginAgentTool({
		handler: (raw) => controller.replaceAttributes(narrow(ReplaceAttributesArgs, raw)),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.replaceAttributes,
	})

	useRozenitePluginAgentTool({
		handler: (raw) => controller.removeAttributes(narrow(RemoveAttributesArgs, raw)),
		pluginId: PLUGIN_ID,
		tool: growthbookToolDefinitions.removeAttributes,
	})
}
