import type { RozeniteConfig } from '@rozenite/vite-plugin'

import type { GrowthBookEventMap } from './src/shared/event-map'
import type {
	AttributeUpdate,
	DebugLogEntry,
	ExperimentSnapshot,
	FeatureOverride,
	FeatureSnapshot,
	GrowthBookSnapshot,
	VariationOverride,
} from './src/shared/types'

// Fixtures mirror example/src/App.tsx so the Dev Host renders what the example app would report.
const ATTRIBUTES: Record<string, unknown> = {
	age: 28,
	country: 'US',
	id: 'user-123',
	loggedIn: true,
	plan: 'pro',
}

const FEATURES: FeatureSnapshot[] = [
	{ key: 'banner-text', on: true, ruleId: '', source: 'defaultValue', value: 'Welcome to the app!' },
	{ key: 'dark-mode', on: true, ruleId: '', source: 'force', value: true },
	{ key: 'max-items', on: true, ruleId: '', source: 'defaultValue', value: 10 },
	{
		experimentKey: 'new-checkout-experiment',
		key: 'new-checkout-flow',
		on: true,
		ruleId: '',
		source: 'experiment',
		value: true,
		variationId: 1,
	},
	{
		key: 'price-config',
		on: true,
		ruleId: '',
		source: 'defaultValue',
		value: { currency: 'USD', showDecimals: true },
	},
]

const EXPERIMENTS: ExperimentSnapshot[] = [
	{
		hashAttribute: 'id',
		hashValue: 'user-123',
		inExperiment: true,
		key: 'new-checkout-experiment',
		meta: [
			{ key: 'control', name: 'Control' },
			{ key: 'variant', name: 'New Flow' },
		],
		name: 'New checkout flow',
		value: true,
		variationId: 1,
		variations: [false, true],
	},
]

const createSnapshot = (): GrowthBookSnapshot => ({
	attributes: { ...ATTRIBUTES },
	debugLogs: [],
	experiments: EXPERIMENTS.map((experiment) => ({ ...experiment })),
	features: FEATURES.map((feature) => ({ ...feature })),
	forcedFeatures: {},
	forcedVariations: {},
	sdkInfo: {
		apiHost: 'https://cdn.growthbook.io',
		clientKey: 'test-client-key',
		debug: true,
		experimentsCount: EXPERIMENTS.length,
		featuresCount: FEATURES.length,
		timestamp: Date.now(),
		usingRemoteEval: false,
	},
})

const createEmptySnapshot = (): GrowthBookSnapshot => {
	const snapshot = createSnapshot()

	return {
		...snapshot,
		experiments: [],
		features: [],
		sdkInfo: { ...snapshot.sdkInfo, experimentsCount: 0, featuresCount: 0 },
	}
}

// Re-derives features and experiments from the forced maps the way the SDK re-evaluates after
// setForcedFeatures/setForcedVariations, so overriding from the panel visibly changes values.
const evaluate = (snapshot: GrowthBookSnapshot): GrowthBookSnapshot => ({
	...snapshot,
	experiments: EXPERIMENTS.map((experiment) => {
		if (!(experiment.key in snapshot.forcedVariations)) {
			return { ...experiment }
		}

		const variationId = snapshot.forcedVariations[experiment.key]

		return { ...experiment, value: experiment.variations[variationId], variationId }
	}),
	features: FEATURES.map((feature) => {
		if (!(feature.key in snapshot.forcedFeatures)) {
			return { ...feature }
		}

		const value = snapshot.forcedFeatures[feature.key]

		return { ...feature, on: Boolean(value), source: 'override', value }
	}),
})

let logCounter = 0

const createDebugLogs = (features: FeatureSnapshot[]): DebugLogEntry[] =>
	features.map((feature) => ({
		featureKey: feature.key,
		id: `dev-host-log-${++logCounter}`,
		result: {
			on: feature.on,
			ruleId: feature.ruleId,
			source: feature.source,
			value: feature.value,
		},
		timestamp: Date.now(),
	}))

// Panel messages arrive untyped. Rozenite evaluates this file with `new Function`, without a
// module loader, so arktype is unreachable here and the guards have to be hand-rolled.
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const asFeatureOverride = (payload: unknown): FeatureOverride | null => {
	if (!isRecord(payload) || typeof payload.key !== 'string') {
		return null
	}

	return { key: payload.key, value: payload.value }
}

const readFeatureKey = (payload: unknown): string | null => asFeatureOverride(payload)?.key ?? null

const asVariationOverride = (payload: unknown): VariationOverride | null => {
	if (!isRecord(payload) || typeof payload.experimentKey !== 'string' || typeof payload.variationIndex !== 'number') {
		return null
	}

	return { experimentKey: payload.experimentKey, variationIndex: payload.variationIndex }
}

const readExperimentKey = (payload: unknown): string | null => {
	if (!isRecord(payload) || typeof payload.experimentKey !== 'string') {
		return null
	}

	return payload.experimentKey
}

const asAttributeUpdate = (payload: unknown): AttributeUpdate | null => {
	if (!isRecord(payload) || !isRecord(payload.attributes)) {
		return null
	}

	return { attributes: payload.attributes }
}

const config: RozeniteConfig = {
	dev: {
		flows: [
			{
				autoRun: true,
				name: 'Simulated GrowthBook device',
				run: ({ onMessage, send, signal }) => {
					let state = createSnapshot()

					const emit = <TType extends keyof GrowthBookEventMap>(type: TType, payload: GrowthBookEventMap[TType]) => {
						send(type, payload)
					}

					// Mirrors useGrowthBookDevTools: every state change ships a full snapshot plus
					// the logs it produced, while gb:snapshot stays reserved for explicit requests.
					const commit = (next: GrowthBookSnapshot) => {
						const evaluated = evaluate(next)
						const logs = createDebugLogs(evaluated.features)

						state = { ...evaluated, debugLogs: evaluated.debugLogs.concat(logs) }

						emit('gb:state-update', state)
						emit('gb:debug-logs-batch', logs)
					}

					// 'out' is panel-to-host; without it a flow would also hear its own sends.
					const onPanelMessage = (type: keyof GrowthBookEventMap, listener: (payload: unknown) => void) => {
						onMessage({ direction: 'out', type }, (message) => {
							listener(message.payload)
						})
					}

					onPanelMessage('gb:request-snapshot', () => {
						emit('gb:snapshot', state)
					})

					onPanelMessage('gb:set-feature-override', (payload) => {
						const override = asFeatureOverride(payload)

						if (!override) {
							return
						}

						commit({
							...state,
							forcedFeatures: { ...state.forcedFeatures, [override.key]: override.value },
						})
					})

					onPanelMessage('gb:remove-feature-override', (payload) => {
						const key = readFeatureKey(payload)

						if (!key) {
							return
						}

						const forcedFeatures = { ...state.forcedFeatures }

						delete forcedFeatures[key]

						commit({ ...state, forcedFeatures })
					})

					onPanelMessage('gb:clear-feature-overrides', () => {
						commit({ ...state, forcedFeatures: {} })
					})

					onPanelMessage('gb:set-variation-override', (payload) => {
						const override = asVariationOverride(payload)

						if (!override) {
							return
						}

						commit({
							...state,
							forcedVariations: {
								...state.forcedVariations,
								[override.experimentKey]: override.variationIndex,
							},
						})
					})

					onPanelMessage('gb:remove-variation-override', (payload) => {
						const experimentKey = readExperimentKey(payload)

						if (experimentKey === null) {
							return
						}

						const forcedVariations = { ...state.forcedVariations }

						delete forcedVariations[experimentKey]

						commit({ ...state, forcedVariations })
					})

					onPanelMessage('gb:clear-variation-overrides', () => {
						commit({ ...state, forcedVariations: {} })
					})

					onPanelMessage('gb:set-attributes', (payload) => {
						const update = asAttributeUpdate(payload)

						if (!update) {
							return
						}

						commit({ ...state, attributes: update.attributes })
					})

					emit('gb:snapshot', state)

					// The dev host tears a flow's listeners down as soon as run() settles, so the
					// simulator has to stay pending until the flow is stopped.
					return new Promise<void>((resolve) => {
						signal.addEventListener(
							'abort',
							() => {
								resolve()
							},
							{ once: true }
						)
					})
				},
			},
		],
		presets: [
			{ name: 'Snapshot: baseline', payload: createSnapshot(), type: 'gb:snapshot' },
			{
				name: 'Snapshot: with overrides',
				payload: evaluate({
					...createSnapshot(),
					forcedFeatures: { 'dark-mode': false },
					forcedVariations: { 'new-checkout-experiment': 0 },
				}),
				type: 'gb:snapshot',
			},
			{ name: 'Snapshot: empty SDK', payload: createEmptySnapshot(), type: 'gb:snapshot' },
			{ name: 'Debug logs batch', payload: createDebugLogs(FEATURES), type: 'gb:debug-logs-batch' },
		],
	},
	panels: [
		{
			name: 'GrowthBook DevTools',
			source: './src/ui/panel.tsx',
		},
	],
}

export default config
