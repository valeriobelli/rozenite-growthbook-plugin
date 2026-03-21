export type SerializedFeatureRule = {
	id?: string
	type: 'force' | 'experiment' | 'rollout'
	coverage?: number
	force?: unknown
	variations?: unknown[]
	condition?: Record<string, unknown>
}

export type FeatureSnapshot = {
	key: string
	value: unknown
	source: string
	on: boolean
	ruleId: string
	experimentKey?: string
	variationId?: number
	defaultValue?: unknown
	rules?: SerializedFeatureRule[]
}

export type ExperimentSnapshot = {
	key: string
	name?: string
	variationId: number
	value: unknown
	inExperiment: boolean
	hashAttribute: string
	hashValue: string
	variations: unknown[]
	meta?: Array<{ key?: string; name?: string }>
}

export type SdkInfoSnapshot = {
	apiHost: string
	clientKey: string
	featuresCount: number
	experimentsCount: number
	debug: boolean
	usingRemoteEval: boolean
	timestamp: number
}

export type DebugLogEntry = {
	id: string
	timestamp: number
	featureKey: string
	result: {
		value: unknown
		source: string
		on: boolean
		ruleId: string
	}
	defaultValue?: unknown
}

export type GrowthBookSnapshot = {
	features: FeatureSnapshot[]
	experiments: ExperimentSnapshot[]
	attributes: Record<string, unknown>
	forcedFeatures: Record<string, unknown>
	forcedVariations: Record<string, number>
	sdkInfo: SdkInfoSnapshot
	debugLogs: DebugLogEntry[]
}

export type FeatureOverride = {
	key: string
	value: unknown
}

export type VariationOverride = {
	experimentKey: string
	variationIndex: number
}

export type AttributeUpdate = {
	attributes: Record<string, unknown>
}
