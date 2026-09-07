import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { MAX_DEBUG_LOGS, PLUGIN_ID } from '../shared/constants'
import type { GrowthBookEventMap } from '../shared/event-map'
import type { DebugLogEntry } from '../shared/types'

import type { GrowthBookInstance } from './growthbook-controller'
import { buildDebugLogsFromSnapshots, buildFeatureSnapshots, createGrowthBookController } from './growthbook-controller'
import { useGrowthBookAgentTools } from './use-growthbook-agent-tools'

export type { GrowthBookInstance } from './growthbook-controller'

export const useGrowthBookDevTools = (gb: GrowthBookInstance) => {
	const client = useRozeniteDevToolsClient<GrowthBookEventMap>({ pluginId: PLUGIN_ID })

	const debugLogsRef = useRef<DebugLogEntry[]>([])
	const isSyncingRef = useRef(false)

	const controller = useMemo(() => createGrowthBookController(gb), [gb])

	// The re-entrance flag lives in a ref rather than the effect closure so the
	// agent read handlers can share it. Without suppression a readOnly tool would
	// push a state update and append one debug log per feature on every call.
	const runSuppressed = useCallback(<TResult>(read: () => TResult): TResult => {
		const wasSuppressed = isSyncingRef.current

		isSyncingRef.current = true

		try {
			return read()
		} finally {
			isSyncingRef.current = wasSuppressed
		}
	}, [])

	useEffect(() => {
		if (!client) {
			return () => {}
		}

		const handleStateChange = () => {
			// Guard against re-entrance: buildFeatureSnapshots calls evalFeature which
			// fires the gb.subscribe callback synchronously, which would call us again
			if (isSyncingRef.current) {
				return
			}

			isSyncingRef.current = true

			try {
				const featureSnapshots = buildFeatureSnapshots(gb)

				const newLogs = buildDebugLogsFromSnapshots(featureSnapshots, Date.now())

				const allLogs = debugLogsRef.current.concat(newLogs).slice(-MAX_DEBUG_LOGS)

				debugLogsRef.current = allLogs

				client.send('gb:state-update', controller.readSnapshot(allLogs, featureSnapshots))
				client.send('gb:debug-logs-batch', newLogs)
			} finally {
				isSyncingRef.current = false
			}
		}

		// oxlint-disable-next-line react/immutability
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
				client.send(
					'gb:snapshot',
					runSuppressed(() => controller.readSnapshot(debugLogsRef.current))
				)
			}),
			client.onMessage('gb:set-feature-override', (override) => {
				controller.setFeatureOverride(override)
			}),
			client.onMessage('gb:remove-feature-override', (override) => {
				controller.removeFeatureOverride(override)
			}),
			client.onMessage('gb:clear-feature-overrides', () => {
				controller.clearFeatureOverrides()
			}),
			client.onMessage('gb:set-variation-override', (override) => {
				void controller.setVariationOverride(override)
			}),
			client.onMessage('gb:remove-variation-override', (override) => {
				void controller.removeVariationOverride(override)
			}),
			client.onMessage('gb:clear-variation-overrides', () => {
				void controller.clearVariationOverrides()
			}),
			// The panel always sends the complete attribute map, so this replaces it.
			client.onMessage('gb:set-attributes', (update) => {
				void controller.replaceAttributes(update)
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
	}, [client, controller, gb, runSuppressed])

	useGrowthBookAgentTools({ controller, runSuppressed })

	return client
}
