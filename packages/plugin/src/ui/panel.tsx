import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge'
import { useState, useEffect, useCallback } from 'react'

import { PLUGIN_ID } from '../shared/constants'
import type { GrowthBookEventMap } from '../shared/event-map'
import type { GrowthBookSnapshot, DebugLogEntry } from '../shared/types'

import { AttributesTab } from './components/attributes-tab'
import { ExperimentsTab } from './components/experiments-tab'
import { FeaturesTab } from './components/features-tab'
import { LogsTab } from './components/logs-tab'
import { SdkInfoTab } from './components/sdk-info-tab'
import './globals.css'
import { TabBar, type TabId } from './components/tab-bar'

export default function GrowthBookPanel() {
	const client = useRozeniteDevToolsClient<GrowthBookEventMap>({
		pluginId: PLUGIN_ID,
	})

	const [snapshot, setSnapshot] = useState<GrowthBookSnapshot | null>(null)
	const [activeTab, setActiveTab] = useState<TabId>('features')
	const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([])

	// Set up listeners first, then request snapshot with retry.
	// The device may not be ready yet when the panel first connects, so
	// retry until we get a response.
	useEffect(() => {
		if (!client) {
			return
		}

		let received = false

		const subscriptions = [
			client.onMessage('gb:snapshot', (data) => {
				received = true
				setSnapshot(data)
				setDebugLogs(data.debugLogs)
			}),
			client.onMessage('gb:state-update', (data) => {
				received = true
				setSnapshot(data)
			}),
			client.onMessage('gb:debug-log', (entry) => {
				setDebugLogs((prev) => [...prev, entry])
			}),
			client.onMessage('gb:debug-logs-batch', (entries) => {
				setDebugLogs((prev) => [...prev, ...entries])
			}),
		]

		client.send('gb:request-snapshot', undefined)

		const retryTimer = setInterval(() => {
			if (received) {
				return
			}

			client.send('gb:request-snapshot', undefined)
		}, 500)

		return () => {
			clearInterval(retryTimer)

			for (const sub of subscriptions) {
				sub.remove()
			}
		}
	}, [client])

	const sendEvent = useCallback(
		<K extends keyof GrowthBookEventMap>(type: K, payload: GrowthBookEventMap[K]) => {
			client?.send(type, payload)
		},
		[client]
	)

	const clearLogs = useCallback(() => {
		setDebugLogs([])
	}, [])

	if (!client) {
		return (
			<div className="flex h-screen items-center justify-center text-panel-text-secondary">Connecting to device...</div>
		)
	}

	if (!snapshot) {
		return (
			<div className="flex h-screen items-center justify-center text-panel-text-secondary">
				Waiting for GrowthBook data...
			</div>
		)
	}

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			<TabBar activeTab={activeTab} onTabChange={setActiveTab} />
			<div className="flex-1 overflow-auto p-3">
				{activeTab === 'features' && (
					<FeaturesTab
						features={snapshot.features}
						forcedFeatures={snapshot.forcedFeatures}
						onSetOverride={(key, value) => {
							sendEvent('gb:set-feature-override', { key, value })
						}}
						onRemoveOverride={(key) => {
							sendEvent('gb:remove-feature-override', { key })
						}}
						onClearAll={() => {
							sendEvent('gb:clear-feature-overrides', undefined)
						}}
					/>
				)}
				{activeTab === 'experiments' && (
					<ExperimentsTab
						experiments={snapshot.experiments}
						forcedVariations={snapshot.forcedVariations}
						onSetOverride={(experimentKey, variationIndex) => {
							sendEvent('gb:set-variation-override', {
								experimentKey,
								variationIndex,
							})
						}}
						onRemoveOverride={(experimentKey) => {
							sendEvent('gb:remove-variation-override', { experimentKey })
						}}
						onClearAll={() => {
							sendEvent('gb:clear-variation-overrides', undefined)
						}}
					/>
				)}
				{activeTab === 'attributes' && (
					<AttributesTab
						attributes={snapshot.attributes}
						onSave={(attributes) => {
							sendEvent('gb:set-attributes', { attributes })
						}}
					/>
				)}
				{activeTab === 'logs' && <LogsTab logs={debugLogs} onClear={clearLogs} />}
				{activeTab === 'sdk-info' && (
					<SdkInfoTab
						sdkInfo={snapshot.sdkInfo}
						onToggleDebug={(enabled) => {
							sendEvent('gb:set-debug', { enabled })
						}}
					/>
				)}
			</div>
		</div>
	)
}
