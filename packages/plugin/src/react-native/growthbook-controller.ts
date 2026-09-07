import type {
	AttributesResult,
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
	PatchAttributesArgs,
	RemoveAttributesArgs,
	RemoveAttributesResult,
	RemoveFeatureOverrideArgs,
	RemoveVariationOverrideArgs,
	ReplaceAttributesArgs,
	SetFeatureOverrideArgs,
	SetVariationOverrideArgs,
} from '../shared/agent-tools'
import { paginate } from '../shared/pagination'
import type {
	DebugLogEntry,
	ExperimentSnapshot,
	FeatureSnapshot,
	GrowthBookSnapshot,
	SdkInfoSnapshot,
} from '../shared/types'

export interface GrowthBookInstance {
	debug: boolean
	version?: string
	getFeatures(): Record<string, unknown>
	getExperiments(): Array<{
		key: string
		variations: unknown[]
		meta?: Array<{ key?: string; name?: string }>
	}>
	getAttributes(): Record<string, unknown>
	getForcedFeatures(): Map<string, unknown>
	setForcedFeatures(map: Map<string, unknown>): void
	getForcedVariations(): Record<string, number>
	setForcedVariations(vars: Record<string, number>): Promise<void>
	setAttributes(attrs: Record<string, unknown>): Promise<void>
	evalFeature(key: string): {
		value: unknown
		source: string
		on: boolean
		off: boolean
		ruleId: string
		experiment?: { key: string }
		experimentResult?: { variationId: number }
	}
	getAllResults(): Map<
		string,
		{
			experiment: {
				key: string
				variations: unknown[]
				hashAttribute?: string
				meta?: Array<{ key?: string; name?: string }>
				name?: string
			}
			result: {
				value: unknown
				variationId: number
				inExperiment: boolean
				hashAttribute: string
				hashValue: string
			}
		}
	>
	getApiInfo?(): [string, string]
	isRemoteEval?(): boolean
	setRenderer(renderer: (() => void) | null): void
	subscribe?: (callback: (experiment?: unknown, result?: unknown) => void) => () => void
}

export const buildFeatureSnapshots = (gb: GrowthBookInstance): FeatureSnapshot[] =>
	Object.keys(gb.getFeatures()).map((key) => {
		const result = gb.evalFeature(key)

		return {
			experimentKey: result.experiment?.key,
			key,
			on: result.on,
			ruleId: result.ruleId,
			source: result.source,
			value: result.value,
			variationId: result.experimentResult?.variationId,
		}
	})

const buildExperimentSnapshots = (gb: GrowthBookInstance): ExperimentSnapshot[] =>
	[...gb.getAllResults().entries()].map(([, { experiment, result }]) => ({
		hashAttribute: result.hashAttribute,
		hashValue: result.hashValue,
		inExperiment: result.inExperiment,
		key: experiment.key,
		meta: experiment.meta,
		name: experiment.name,
		value: result.value,
		variationId: result.variationId,
		variations: [...experiment.variations],
	}))

const buildSdkInfo = (gb: GrowthBookInstance): SdkInfoSnapshot => {
	const [apiHost = '', clientKey = ''] = gb.getApiInfo?.() ?? []

	return {
		apiHost,
		clientKey,
		debug: gb.debug,
		experimentsCount: gb.getAllResults().size,
		featuresCount: Object.keys(gb.getFeatures()).length,
		timestamp: Date.now(),
		usingRemoteEval: gb.isRemoteEval?.() ?? false,
	}
}

const serializeForcedFeatures = (map: Map<string, unknown>): Record<string, unknown> =>
	Object.fromEntries(map.entries())

let logIdCounter = 0

export const buildDebugLogsFromSnapshots = (features: FeatureSnapshot[], timestamp: number): DebugLogEntry[] =>
	features.map((feature) => ({
		featureKey: feature.key,
		id: `log-${++logIdCounter}`,
		result: {
			on: feature.on,
			ruleId: feature.ruleId,
			source: feature.source,
			value: feature.value,
		},
		timestamp,
	}))

const buildSnapshot = (
	gb: GrowthBookInstance,
	debugLogs: DebugLogEntry[],
	prebuiltFeatures?: FeatureSnapshot[]
): GrowthBookSnapshot => {
	const features = prebuiltFeatures ?? buildFeatureSnapshots(gb)
	const experiments = buildExperimentSnapshots(gb)

	return {
		attributes: gb.getAttributes(),
		debugLogs,
		experiments,
		features,
		forcedFeatures: serializeForcedFeatures(gb.getForcedFeatures()),
		forcedVariations: gb.getForcedVariations(),
		sdkInfo: buildSdkInfo(gb),
	}
}

const buildFeatureView = (gb: GrowthBookInstance, key: string): FeatureView => {
	const result = gb.evalFeature(key)

	return {
		experimentKey: result.experiment?.key,
		key,
		on: result.on,
		overridden: gb.getForcedFeatures().has(key),
		ruleId: result.ruleId,
		source: result.source,
		value: result.value,
		variationId: result.experimentResult?.variationId,
	}
}

const toFeatureListItem = (view: FeatureView): FeatureListItem => ({
	key: view.key,
	on: view.on,
	overridden: view.overridden,
	ruleId: view.ruleId,
	source: view.source,
	value: view.value,
})

const buildExperimentListItems = (gb: GrowthBookInstance): ExperimentListItem[] => {
	const forcedVariations = gb.getForcedVariations()

	return [...gb.getAllResults().values()].map(({ experiment, result }) => ({
		forcedVariationIndex: forcedVariations[experiment.key],
		hashAttribute: result.hashAttribute,
		inExperiment: result.inExperiment,
		key: experiment.key,
		name: experiment.name,
		variationId: result.variationId,
	}))
}

/**
 * Every GrowthBook read and write the plugin performs, in one place. Both the
 * DevTools panel message handlers and the agent tool handlers call it, so the
 * two surfaces cannot drift apart.
 *
 * Write operations deliberately do not read their result back: `evalFeature`
 * fires `gb.subscribe` synchronously, so the caller decides when a read may
 * emit a state update. See `useGrowthBookDevTools`.
 */
export const createGrowthBookController = (gb: GrowthBookInstance) => ({
	clearFeatureOverrides: (): number => {
		const current = gb.getForcedFeatures()
		const cleared = current.size

		current.clear()
		gb.setForcedFeatures(current)

		return cleared
	},

	clearVariationOverrides: async (): Promise<number> => {
		const cleared = Object.keys(gb.getForcedVariations()).length

		await gb.setForcedVariations({})

		return cleared
	},

	getFeature: ({ key }: GetFeatureArgs): GetFeatureResult => {
		if (!Object.hasOwn(gb.getFeatures(), key)) {
			throw new Error(`Feature "${key}" is not registered in the SDK. Call list-features to see the known keys.`)
		}

		return { feature: buildFeatureView(gb, key) }
	},

	getState: (): GetStateResult => ({
		attributes: gb.getAttributes(),
		forcedFeatures: serializeForcedFeatures(gb.getForcedFeatures()),
		forcedVariations: gb.getForcedVariations(),
		sdkInfo: buildSdkInfo(gb),
	}),

	listExperiments: (request: ListExperimentsArgs): ListExperimentsResult =>
		paginate(buildExperimentListItems(gb), request),

	listFeatures: (request: ListFeaturesArgs): ListFeaturesResult =>
		paginate(
			Object.keys(gb.getFeatures()).map((key) => toFeatureListItem(buildFeatureView(gb, key))),
			request
		),

	patchAttributes: async ({ attributes }: PatchAttributesArgs): Promise<AttributesResult> => {
		const next = { ...gb.getAttributes(), ...attributes }

		await gb.setAttributes(next)

		return { attributes: next }
	},

	readSnapshot: (debugLogs: DebugLogEntry[], prebuiltFeatures?: FeatureSnapshot[]): GrowthBookSnapshot =>
		buildSnapshot(gb, debugLogs, prebuiltFeatures),

	removeAttributes: async ({ keys }: RemoveAttributesArgs): Promise<RemoveAttributesResult> => {
		const current = gb.getAttributes()
		const removed = keys.filter((key) => Object.hasOwn(current, key))
		const next = { ...current }

		for (const key of removed) {
			delete next[key]
		}

		await gb.setAttributes(next)

		return { attributes: next, removed }
	},

	removeFeatureOverride: ({ key }: RemoveFeatureOverrideArgs): boolean => {
		const current = gb.getForcedFeatures()
		const removed = current.delete(key)

		gb.setForcedFeatures(current)

		return removed
	},

	removeVariationOverride: async ({ experimentKey }: RemoveVariationOverrideArgs): Promise<boolean> => {
		const current = gb.getForcedVariations()
		const removed = Object.hasOwn(current, experimentKey)

		delete current[experimentKey]
		await gb.setForcedVariations(current)

		return removed
	},

	replaceAttributes: async ({ attributes }: ReplaceAttributesArgs): Promise<AttributesResult> => {
		await gb.setAttributes(attributes)

		return { attributes }
	},

	setFeatureOverride: ({ key, value }: SetFeatureOverrideArgs): void => {
		const current = gb.getForcedFeatures()

		current.set(key, value)
		gb.setForcedFeatures(current)
	},

	setVariationOverride: async ({ experimentKey, variationIndex }: SetVariationOverrideArgs): Promise<void> => {
		await gb.setForcedVariations({
			...gb.getForcedVariations(),
			[experimentKey]: variationIndex,
		})
	},
})

export type GrowthBookController = ReturnType<typeof createGrowthBookController>
