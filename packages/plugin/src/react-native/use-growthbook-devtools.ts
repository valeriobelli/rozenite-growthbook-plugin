import { type as t } from 'arktype'
import { useCallback, useEffect, useRef, useState } from 'react'

import { PLUGIN_ID } from '../shared/constants'
import type { GrowthBookEventMap } from '../shared/event-map'
import type {
	DebugLogEntry,
	ExperimentSnapshot,
	FeatureSnapshot,
	GrowthBookSnapshot,
	SdkInfoSnapshot,
} from '../shared/types'

const MAX_DEBUG_LOGS = 500
const ROZENITE_DOMAIN = 'rozenite'

const pluginMessageSchema = t({
	payload: 'unknown',
	pluginId: 'string',
	type: 'string',
})

type FuseboxDomain = {
	name: string
	onMessage: {
		addEventListener: (listener: (message: unknown) => void) => void
		removeEventListener: (listener: (message: unknown) => void) => void
	}
	sendMessage: (message: unknown) => void
}

type FuseboxGlobal = {
	__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__?: FuseboxDispatcher
	[key: string]: unknown
}

type FuseboxDispatcher = {
	BINDING_NAME: string
	initializeDomain: (name: string) => FuseboxDomain
	onDomainInitialization: {
		addEventListener: (listener: (domain: FuseboxDomain) => void) => void
		removeEventListener: (listener: (domain: FuseboxDomain) => void) => void
	}
}

type Subscription = { remove: () => void }

type DevToolsClient<TEventMap extends Record<string, unknown>> = {
	send: <K extends keyof TEventMap>(type: K, payload: TEventMap[K]) => void
	onMessage: <K extends keyof TEventMap>(type: K, listener: (payload: TEventMap[K]) => void) => Subscription
}

// ---------------------------------------------------------------------------
// Custom device-side hook that bypasses the bridge's cached channel.
//
// The bridge's `useRozeniteDevToolsClient` creates a channel via
// `initializeDomain` the first time the hook runs. If the Fusebox CDP binding
// exists before DevTools actually connects (common in React Native's new
// architecture), the domain is initialised against a dead CDP session. The
// bridge caches this channel at module scope (`c` in the bundle), so later
// reconnections never produce a fresh channel.
//
// This hook listens for `onDomainInitialization` directly. Every time a new
// "rozenite" domain appears (DevTools connects/reconnects) it creates a
// brand-new client backed by *that* domain instance, causing all React
// effects to re-run with a connected transport.
// ---------------------------------------------------------------------------
function useDeviceDevToolsClient(): DevToolsClient<GrowthBookEventMap> | null {
	const [client, setClient] = useState<DevToolsClient<GrowthBookEventMap> | null>(null)

	useEffect(() => {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Fusebox private API not exposed on globalThis type
		const g = globalThis as unknown as FuseboxGlobal

		const dispatcher: FuseboxDispatcher | undefined = g.__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__
		if (!dispatcher) {
			return
		}

		let cancelled = false
		let currentCleanup: (() => void) | null = null

		const connectWithDomain = (domain: FuseboxDomain) => {
			if (cancelled) {
				return
			}

			currentCleanup?.()

			// Type-erased map: runtime dispatch can't statically link each key
			// to its payload type, so we use `never` and cast at the dispatch site.
			const handlers = new Map<string, Set<(payload: never) => void>>()

			const messageHandler = (rawMessage: unknown) => {
				// Match the bridge's async delivery (setTimeout) so subscribers
				// never run synchronously inside the domain's event dispatch.
				setTimeout(() => {
					const msg = pluginMessageSchema(rawMessage)

					if (msg instanceof t.errors) {
						return
					}

					if (msg.pluginId !== PLUGIN_ID) {
						return
					}

					handlers.get(msg.type)?.forEach((handler) => {
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- type-erased dispatch: payload type is validated by onMessage generics
						handler(msg.payload as never)
					})
				})
			}

			domain.onMessage.addEventListener(messageHandler)

			const newClient: DevToolsClient<GrowthBookEventMap> = {
				onMessage: (type, listener) => {
					const key = type as string

					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- type-erased map: each key maps to a specific handler type at runtime
					const set = (handlers.get(key) as Set<typeof listener> | undefined) ?? new Set<typeof listener>()

					set.add(listener)
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion
					handlers.set(key, set as Set<(payload: never) => void>)

					return {
						remove: () => {
							set.delete(listener)
						},
					}
				},
				send: (type, payload) => {
					domain.sendMessage({ payload, pluginId: PLUGIN_ID, type })
				},
			}

			currentCleanup = () => {
				handlers.clear()
				domain.onMessage.removeEventListener(messageHandler)
			}

			setClient(newClient)
		}

		const bindingName: string | undefined = dispatcher.BINDING_NAME

		const tryConnect = () => {
			if (cancelled) {
				return false
			}

			if (!bindingName || g[bindingName] === undefined || g[bindingName] === null) {
				return false
			}

			try {
				connectWithDomain(dispatcher.initializeDomain(ROZENITE_DOMAIN))

				return true
			} catch {
				return false
			}
		}

		// Try immediate connection (DevTools already open)
		const connected = tryConnect()

		// Poll for the CDP binding to appear — it's created when DevTools
		// connects to the device, which may happen after the app starts.
		// `onDomainInitialization` is NOT reliable for this because nobody
		// calls `initializeDomain` on the device when DevTools connects late.
		let pollTimer: ReturnType<typeof setInterval> | null = null

		if (!connected) {
			pollTimer = setInterval(() => {
				if (tryConnect() && pollTimer !== null) {
					clearInterval(pollTimer)
					pollTimer = null
				}
			}, 500)
		}

		// Keep the event listener as a fallback for domain re-initialisation
		// (e.g. DevTools disconnects then reconnects)
		const initHandler = (domain: FuseboxDomain) => {
			if (domain.name !== ROZENITE_DOMAIN) {
				return
			}

			connectWithDomain(domain)
		}

		dispatcher.onDomainInitialization.addEventListener(initHandler)

		return () => {
			cancelled = true

			if (pollTimer !== null) {
				clearInterval(pollTimer)
			}

			currentCleanup?.()
			dispatcher.onDomainInitialization.removeEventListener(initHandler)
		}
	}, [])

	return client
}

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
}

export type GrowthBookDevToolsOptions = {
	gb: GrowthBookInstance
}

let logIdCounter = 0

function buildFeatureSnapshots(gb: GrowthBookInstance): FeatureSnapshot[] {
	const features = gb.getFeatures()

	return Object.keys(features).map((key) => {
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
}

function buildExperimentSnapshots(gb: GrowthBookInstance): ExperimentSnapshot[] {
	const allResults = gb.getAllResults()
	const snapshots: ExperimentSnapshot[] = []

	for (const [, { experiment, result }] of allResults) {
		snapshots.push({
			hashAttribute: result.hashAttribute,
			hashValue: result.hashValue,
			inExperiment: result.inExperiment,
			key: experiment.key,
			meta: experiment.meta,
			name: experiment.name,
			value: result.value,
			variationId: result.variationId,
			variations: [...experiment.variations],
		})
	}

	return snapshots
}

function buildSdkInfo(gb: GrowthBookInstance): SdkInfoSnapshot {
	const [apiHost, clientKey] = gb.getApiInfo?.() ?? ['', '']

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

function serializeForcedFeatures(map: Map<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {}

	for (const [key, value] of map) {
		result[key] = value
	}

	return result
}

function buildDebugLogsFromSnapshots(features: FeatureSnapshot[], timestamp: number): DebugLogEntry[] {
	return features.map((f) => ({
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
}

function buildSnapshot(
	gb: GrowthBookInstance,
	debugLogs: DebugLogEntry[],
	prebuiltFeatures?: FeatureSnapshot[]
): GrowthBookSnapshot {
	return {
		attributes: gb.getAttributes(),
		debugLogs,
		experiments: buildExperimentSnapshots(gb),
		features: prebuiltFeatures ?? buildFeatureSnapshots(gb),
		forcedFeatures: serializeForcedFeatures(gb.getForcedFeatures()),
		forcedVariations: { ...gb.getForcedVariations() },
		sdkInfo: buildSdkInfo(gb),
	}
}

export function useGrowthBookDevTools({ gb }: GrowthBookDevToolsOptions): void {
	const client = useDeviceDevToolsClient()

	const debugLogsRef = useRef<DebugLogEntry[]>([])
	const rafIdRef = useRef<number | null>(null)

	const sendSnapshot = useCallback(() => {
		if (!client) {
			return
		}
		const snapshot = buildSnapshot(gb, debugLogsRef.current)

		client.send('gb:snapshot', snapshot)
	}, [client, gb])

	useEffect(() => {
		if (!client) {
			return
		}

		gb.debug = true

		// Set up request-snapshot handler BEFORE sending initial snapshot
		// to avoid race where panel's request arrives before handler is registered
		const requestSnapshotSub = client.onMessage('gb:request-snapshot', () => {
			sendSnapshot()
		})

		sendSnapshot()

		// Throttled devtools update — does NOT block the original renderer
		const handleStateChange = () => {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current)
			}

			rafIdRef.current = requestAnimationFrame(() => {
				rafIdRef.current = null

				// Build features once and reuse for both snapshot and debug logs,
				// avoiding a second evalFeature pass per feature.
				const featureSnapshots = buildFeatureSnapshots(gb)

				const newLogs = buildDebugLogsFromSnapshots(featureSnapshots, Date.now())

				const allLogs = [...debugLogsRef.current, ...newLogs].slice(-MAX_DEBUG_LOGS)
				debugLogsRef.current = allLogs

				const snapshot = buildSnapshot(gb, allLogs, featureSnapshots)

				client.send('gb:state-update', snapshot)
				client.send('gb:debug-logs-batch', newLogs)
			})
		}

		// Capture the existing renderer (set by GrowthBookProvider) before overwriting.
		// GrowthBook stores it as a private `_renderer` property — access via cast.
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const originalRenderer = (gb as unknown as { _renderer: (() => void) | null })._renderer

		gb.setRenderer(() => {
			originalRenderer?.()
			handleStateChange()
		})

		return () => {
			requestSnapshotSub.remove()

			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current)
			}

			gb.setRenderer(originalRenderer)
		}
	}, [client, gb, sendSnapshot])

	useEffect(() => {
		if (!client) {
			return
		}

		const subscriptions = [
			client.onMessage('gb:set-feature-override', ({ key, value }) => {
				const current = gb.getForcedFeatures()
				const updated = new Map([...current, [key, value]])

				gb.setForcedFeatures(updated)
			}),

			client.onMessage('gb:remove-feature-override', ({ key }) => {
				const current = gb.getForcedFeatures()
				const updated = new Map(current)

				updated.delete(key)
				gb.setForcedFeatures(updated)
			}),

			client.onMessage('gb:clear-feature-overrides', () => {
				gb.setForcedFeatures(new Map())
			}),

			client.onMessage('gb:set-variation-override', ({ experimentKey, variationIndex }) => {
				const current = gb.getForcedVariations()

				void gb.setForcedVariations({
					...current,
					[experimentKey]: variationIndex,
				})
			}),

			client.onMessage('gb:remove-variation-override', ({ experimentKey }) => {
				const current = { ...gb.getForcedVariations() }

				delete current[experimentKey]

				void gb.setForcedVariations(current)
			}),

			client.onMessage('gb:clear-variation-overrides', () => {
				void gb.setForcedVariations({})
			}),

			client.onMessage('gb:set-attributes', ({ attributes }) => {
				void gb.setAttributes(attributes)
			}),

			client.onMessage('gb:set-debug', ({ enabled }) => {
				gb.debug = enabled

				sendSnapshot()
			}),
		]

		return () => {
			for (const sub of subscriptions) {
				sub.remove()
			}
		}
	}, [client, gb, sendSnapshot])
}
