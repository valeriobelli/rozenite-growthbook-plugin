import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge'
import { useEffect, useRef } from 'react'

import { MAX_DEBUG_LOGS, PLUGIN_ID } from '../shared/constants'
import type { GrowthBookEventMap } from '../shared/event-map'
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

export type GrowthBookDevToolsOptions = {
	gb: GrowthBookInstance
}

let logIdCounter = 0

const buildFeatureSnapshots = (gb: GrowthBookInstance): FeatureSnapshot[] =>
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

const buildDebugLogsFromSnapshots = (features: FeatureSnapshot[], timestamp: number): DebugLogEntry[] =>
	features.map((f) => ({
		featureKey: f.key,
		id: `log-${++logIdCounter}`,
		result: {
			on: f.on,
			ruleId: f.ruleId,
			source: f.source,
			value: f.value,
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

export const useGrowthBookDevTools = ({ gb }: GrowthBookDevToolsOptions) => {
	const client = useRozeniteDevToolsClient<GrowthBookEventMap>({ pluginId: PLUGIN_ID })

	const debugLogsRef = useRef<DebugLogEntry[]>([])

	useEffect(() => {
		if (!client) {
			return
		}

		let isSyncing = false

		const handleStateChange = () => {
			// Guard against re-entrance: buildFeatureSnapshots calls evalFeature which
			// fires the gb.subscribe callback synchronously, which would call us again
			if (isSyncing) {
				return
			}

			isSyncing = true

			const featureSnapshots = buildFeatureSnapshots(gb)

			const newLogs = buildDebugLogsFromSnapshots(featureSnapshots, Date.now())

			const allLogs = debugLogsRef.current.concat(newLogs).slice(-MAX_DEBUG_LOGS)

			debugLogsRef.current = allLogs

			const snapshot = buildSnapshot(gb, allLogs, featureSnapshots)

			client.send('gb:state-update', snapshot)
			client.send('gb:debug-logs-batch', newLogs)

			isSyncing = false
		}

		gb.debug = true

		// Patch public state-mutating methods so any SDK state change notifies devtools
		// immediately, without depending on gb.subscribe (which only fires on experiment evaluation)
		const originalSetAttributes = gb.setAttributes.bind(gb)
		gb.setAttributes = async (attrs) => {
			await originalSetAttributes(attrs)
			handleStateChange()
		}

		const originalSetForcedFeatures = gb.setForcedFeatures.bind(gb)
		gb.setForcedFeatures = (map) => {
			originalSetForcedFeatures(map)
			handleStateChange()
		}

		const originalSetForcedVariations = gb.setForcedVariations.bind(gb)
		gb.setForcedVariations = async (vars) => {
			await originalSetForcedVariations(vars)
			handleStateChange()
		}

		const subscriptions = [
			...(gb.subscribe ? [{ remove: gb.subscribe(handleStateChange) }] : []),
			client.onMessage('gb:request-snapshot', () => {
				client.send('gb:snapshot', buildSnapshot(gb, debugLogsRef.current))
			}),
			client.onMessage('gb:set-feature-override', ({ key, value }) => {
				const current = gb.getForcedFeatures()

				current.set(key, value)

				gb.setForcedFeatures(current)
			}),
			client.onMessage('gb:remove-feature-override', ({ key }) => {
				const current = gb.getForcedFeatures()

				current.delete(key)

				gb.setForcedFeatures(current)
			}),
			client.onMessage('gb:clear-feature-overrides', () => {
				const current = gb.getForcedFeatures()

				current.clear()

				gb.setForcedFeatures(current)
			}),
			client.onMessage('gb:set-variation-override', ({ experimentKey, variationIndex }) => {
				const current = gb.getForcedVariations()

				void gb.setForcedVariations({
					...current,
					[experimentKey]: variationIndex,
				})
			}),
			client.onMessage('gb:remove-variation-override', ({ experimentKey }) => {
				const current = gb.getForcedVariations()

				delete current[experimentKey]

				void gb.setForcedVariations(current)
			}),
			client.onMessage('gb:clear-variation-overrides', () => {
				void gb.setForcedVariations({})
			}),
			client.onMessage('gb:set-attributes', ({ attributes }) => {
				void gb.setAttributes(attributes)
			}),
		]

		return () => {
			gb.setAttributes = originalSetAttributes
			gb.setForcedFeatures = originalSetForcedFeatures
			gb.setForcedVariations = originalSetForcedVariations

			subscriptions.forEach((subscription) => {
				subscription.remove()
			})
		}
	}, [client, gb])

	return client
}
