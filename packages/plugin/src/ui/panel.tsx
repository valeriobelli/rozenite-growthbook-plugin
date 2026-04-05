import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { PLUGIN_ID } from '../shared/constants'
import type { GrowthBookEventMap } from '../shared/event-map'
import type { DebugLogEntry, GrowthBookSnapshot } from '../shared/types'

import { AttributesTab } from './components/attributes-tab'
import { ErrorFallback } from './components/error'
import { ExperimentsTab } from './components/experiments-tab'
import { FeaturesTab } from './components/features-tab'
import { Loader } from './components/loader'
import { LogsTab } from './components/logs-tab'
import { SdkInfoTab } from './components/sdk-info-tab'
import { SettingsTab } from './components/settings-tab'
import type { TabId } from './components/tab-bar'
import { TabBar } from './components/tab-bar'
import './globals.css'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// 24 hours
			gcTime: 1000 * 60 * 60 * 24,
		},
	},
})

const asyncStoragePersister = createAsyncStoragePersister({
	key: 'rozenite-growthbook-plugin-query-cache',
	storage: window.localStorage,
})

const Panel = () => {
	const [snapshot, setSnapshot] = useState<GrowthBookSnapshot | null>(null)
	const [activeTab, setActiveTab] = useState<TabId>('features')
	const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([])
	const client = useRozeniteDevToolsClient<GrowthBookEventMap>({
		pluginId: PLUGIN_ID,
	})

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
				setDebugLogs((prev) => prev.concat(entry))
			}),
			client.onMessage('gb:debug-logs-batch', (entries) => {
				setDebugLogs((prev) => prev.concat(entries))
			}),
		]

		// We request the snapshot every 500ms until we receive it,
		// to handle the case where the panel is opened before the connection is fully established
		const retryTimer = setInterval(() => {
			if (received) {
				clearInterval(retryTimer)

				return
			}

			client.send('gb:request-snapshot', {})
		}, 500)

		return () => {
			clearInterval(retryTimer)

			subscriptions.forEach((subscription) => {
				subscription.remove()
			})
		}
	}, [client])

	if (!client) {
		return <Loader>Connecting to device...</Loader>
	}

	if (!snapshot) {
		return <Loader>Waiting for app sending GrowthBook data...</Loader>
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
							client.send('gb:set-feature-override', { key, value })
						}}
						onRemoveOverride={(key) => {
							client.send('gb:remove-feature-override', { key })
						}}
						onClearAll={() => {
							client.send('gb:clear-feature-overrides', {})
						}}
					/>
				)}
				{activeTab === 'experiments' && (
					<ExperimentsTab
						experiments={snapshot.experiments}
						forcedVariations={snapshot.forcedVariations}
						onSetOverride={(experimentKey, variationIndex) => {
							client.send('gb:set-variation-override', {
								experimentKey,
								variationIndex,
							})
						}}
						onRemoveOverride={(experimentKey) => {
							client.send('gb:remove-variation-override', { experimentKey })
						}}
						onClearAll={() => {
							client.send('gb:clear-variation-overrides', {})
						}}
					/>
				)}
				{activeTab === 'attributes' && (
					<AttributesTab
						apiHost={snapshot.sdkInfo.apiHost}
						attributes={snapshot.attributes}
						onSave={(attributes) => {
							client.send('gb:set-attributes', { attributes })
						}}
					/>
				)}
				{activeTab === 'logs' && (
					<LogsTab
						logs={debugLogs}
						onClear={() => {
							setDebugLogs([])
						}}
					/>
				)}
				{activeTab === 'sdk-info' && <SdkInfoTab sdkInfo={snapshot.sdkInfo} />}
				{activeTab === 'settings' && <SettingsTab sdkApiHost={snapshot.sdkInfo.apiHost} />}
			</div>
		</div>
	)
}

const GrowthBookPanel = () => (
	<ErrorBoundary FallbackComponent={ErrorFallback}>
		<PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
			<Panel />
		</PersistQueryClientProvider>
	</ErrorBoundary>
)

export default GrowthBookPanel
