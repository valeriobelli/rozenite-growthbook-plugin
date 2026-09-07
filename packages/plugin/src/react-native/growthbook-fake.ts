import type { GrowthBookInstance } from './growthbook-controller'

type FakeFeature = {
	defaultValue: unknown
	forceWhen?: {
		attribute: string
		equals: unknown
		value: unknown
	}
}

type FakeExperiment = {
	hashAttribute: string
	key: string
	name?: string
	variations: unknown[]
}

export type FakeGrowthBookOptions = {
	attributes?: Record<string, unknown>
	experiments?: FakeExperiment[]
	features?: Record<string, FakeFeature>
}

/**
 * A stand-in for a GrowthBook instance, for tests only.
 *
 * `GrowthBookInstance` is a structural interface — the plugin never imports
 * `@growthbook/growthbook` — so a fake needs no SDK.
 */
export const createFakeGrowthBook = (options: FakeGrowthBookOptions = {}) => {
	const features: Record<string, FakeFeature> = options.features ?? {
		'banner-text': { defaultValue: 'Welcome to the app!' },
		'dark-mode': {
			defaultValue: false,
			forceWhen: { attribute: 'country', equals: 'US', value: true },
		},
		'max-items': { defaultValue: 10 },
	}

	const experiments: FakeExperiment[] = options.experiments ?? [
		{ hashAttribute: 'id', key: 'checkout-flow', name: 'Checkout flow', variations: ['control', 'variant'] },
	]

	let attributes: Record<string, unknown> = options.attributes ?? {
		country: 'US',
		id: 'user-123',
		plan: 'pro',
	}

	const forcedFeatures = new Map<string, unknown>()
	let forcedVariations: Record<string, number> = {}
	const subscribers = new Set<() => void>()

	const notify = () => {
		subscribers.forEach((subscriber) => {
			subscriber()
		})
	}

	const gb: GrowthBookInstance = {
		debug: false,
		evalFeature: (key) => {
			// The real SDK notifies on evaluation. Reproducing that here is the point
			// of the fake: it is what makes a read re-enter the state-change handler.
			notify()

			if (forcedFeatures.has(key)) {
				const value = forcedFeatures.get(key)

				return { off: !value, on: Boolean(value), ruleId: '', source: 'override', value }
			}

			const feature = features[key]

			if (!feature) {
				return { off: true, on: false, ruleId: '', source: 'unknownFeature', value: null }
			}

			const { forceWhen } = feature

			if (forceWhen && attributes[forceWhen.attribute] === forceWhen.equals) {
				return {
					off: !forceWhen.value,
					on: Boolean(forceWhen.value),
					ruleId: 'rule-0',
					source: 'force',
					value: forceWhen.value,
				}
			}

			return {
				off: !feature.defaultValue,
				on: Boolean(feature.defaultValue),
				ruleId: '',
				source: 'defaultValue',
				value: feature.defaultValue,
			}
		},
		getAllResults: () =>
			new Map(
				experiments.map((experiment) => {
					const variationId = forcedVariations[experiment.key] ?? 0
					const hashValue = attributes[experiment.hashAttribute]

					return [
						experiment.key,
						{
							experiment: {
								hashAttribute: experiment.hashAttribute,
								key: experiment.key,
								name: experiment.name,
								variations: experiment.variations,
							},
							result: {
								hashAttribute: experiment.hashAttribute,
								hashValue: typeof hashValue === 'string' ? hashValue : '',
								inExperiment: true,
								value: experiment.variations[variationId],
								variationId,
							},
						},
					]
				})
			),
		getApiInfo: () => ['https://cdn.growthbook.io', 'test-client-key'],
		getAttributes: () => attributes,
		getExperiments: () => experiments.map(({ key, variations }) => ({ key, variations })),
		getFeatures: () => Object.fromEntries(Object.keys(features).map((key) => [key, {}])),
		getForcedFeatures: () => forcedFeatures,
		getForcedVariations: () => forcedVariations,
		isRemoteEval: () => false,
		setAttributes: (next) => {
			attributes = next
			notify()

			return Promise.resolve()
		},
		setForcedFeatures: (map) => {
			if (map !== forcedFeatures) {
				forcedFeatures.clear()
				map.forEach((value, key) => {
					forcedFeatures.set(key, value)
				})
			}

			notify()
		},
		setForcedVariations: (next) => {
			forcedVariations = { ...next }
			notify()

			return Promise.resolve()
		},
		setRenderer: () => undefined,
		subscribe: (callback) => {
			const subscriber = () => {
				callback()
			}

			subscribers.add(subscriber)

			return () => {
				subscribers.delete(subscriber)
			}
		},
	}

	return gb
}
