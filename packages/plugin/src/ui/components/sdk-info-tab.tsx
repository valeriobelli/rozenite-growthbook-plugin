import type { ReactNode } from 'react'
import { useState } from 'react'

import type { SdkInfoSnapshot } from '../../shared/types'
import { useApiKey, useClearApiKey, useIsCloud, useSetApiKey, useSetIsCloud } from '../atoms'
import { CLOUD_API_HOST } from '../constants'

const maskKey = (key: string) =>
	key.length <= 8 ? key : `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`

const formatTimestamp = (ts: number) => new Date(ts).toLocaleString()

interface InfoCardRootProps {
	children: ReactNode
}

const InfoCardRoot = ({ children }: InfoCardRootProps) => (
	<div className="rounded border border-panel-border bg-panel-surface p-4">{children}</div>
)

interface InfoCardLabelProps {
	children: ReactNode
}

const InfoCardLabel = ({ children }: InfoCardLabelProps) => (
	<div className="mb-1 text-xs text-panel-text-secondary">{children}</div>
)

interface InfoCardContentProps {
	children: ReactNode
}

const InfoCardContent = ({ children }: InfoCardContentProps) => (
	<div className="text-sm text-panel-text">{children}</div>
)

const InfoCard = {
	Content: InfoCardContent,
	Label: InfoCardLabel,
	Root: InfoCardRoot,
}

interface IsCloudCardProps {
	sdkApiHost: string
}

const IsCloudCard = ({ sdkApiHost }: IsCloudCardProps) => {
	const isCloud = useIsCloud()
	const setIsCloud = useSetIsCloud()

	return (
		<InfoCard.Root>
			<InfoCard.Label>Backend</InfoCard.Label>
			<InfoCard.Content>
				<label className="flex cursor-pointer items-center gap-2">
					<input
						checked={isCloud}
						className="accent-panel-accent"
						type="checkbox"
						onChange={(e) => {
							setIsCloud(e.target.checked)
						}}
					/>
					<span>GrowthBook Cloud</span>
				</label>
				<p className="mt-2 text-xs text-panel-text-secondary">
					{isCloud ? `API calls use ${CLOUD_API_HOST}` : `API calls use SDK host: ${sdkApiHost || 'Not configured'}`}
				</p>
			</InfoCard.Content>
		</InfoCard.Root>
	)
}

const ApiKeyCard = () => {
	const apiKey = useApiKey()
	const setApiKey = useSetApiKey()
	const clearApiKey = useClearApiKey()

	const [inputValue, setInputValue] = useState('')

	if (apiKey !== null) {
		return (
			<InfoCard.Root>
				<InfoCard.Label>Management API Key</InfoCard.Label>
				<InfoCard.Content>
					<div className="flex items-center justify-between gap-2">
						<span className="font-mono">{maskKey(apiKey)}</span>
						<button
							type="button"
							className="rounded px-2 py-1 text-xs text-panel-text-secondary hover:text-panel-text"
							onClick={clearApiKey}>
							Clear
						</button>
					</div>
				</InfoCard.Content>
			</InfoCard.Root>
		)
	}

	return (
		<InfoCard.Root>
			<InfoCard.Label>Management API Key</InfoCard.Label>
			<InfoCard.Content>
				<form
					className="flex gap-2"
					onSubmit={(e) => {
						e.preventDefault()

						if (!inputValue.trim()) {
							return
						}

						setApiKey(inputValue.trim())
						setInputValue('')
					}}>
					<input
						type="password"
						className="flex-1 rounded border border-panel-border bg-panel-bg px-2 py-1 font-mono text-xs text-panel-text placeholder:text-panel-text-secondary"
						placeholder="secret_..."
						value={inputValue}
						onChange={(e) => {
							setInputValue(e.target.value)
						}}
					/>
					<button
						type="submit"
						className="rounded bg-panel-accent px-3 py-1 text-xs text-white disabled:opacity-40"
						disabled={!inputValue.trim()}>
						Save
					</button>
				</form>
			</InfoCard.Content>
		</InfoCard.Root>
	)
}

interface SdkInfoTabProps {
	sdkInfo: SdkInfoSnapshot
}

export const SdkInfoTab = ({ sdkInfo }: SdkInfoTabProps) => (
	<div className="grid grid-cols-2 gap-3">
		<InfoCard.Root>
			<InfoCard.Label>API Host</InfoCard.Label>
			<InfoCard.Content>
				<span className={sdkInfo.apiHost ? 'font-mono' : 'text-panel-text-secondary'}>
					{sdkInfo.apiHost || 'Not configured'}
				</span>
			</InfoCard.Content>
		</InfoCard.Root>

		<InfoCard.Root>
			<InfoCard.Label>Client Key</InfoCard.Label>
			<InfoCard.Content>
				<span className={sdkInfo.clientKey ? 'font-mono' : 'text-panel-text-secondary'}>
					{sdkInfo.clientKey ? maskKey(sdkInfo.clientKey) : 'Not configured'}
				</span>
			</InfoCard.Content>
		</InfoCard.Root>

		<InfoCard.Root>
			<InfoCard.Label>Features</InfoCard.Label>
			<InfoCard.Content>
				<span className="text-lg font-semibold">{sdkInfo.featuresCount}</span>
			</InfoCard.Content>
		</InfoCard.Root>

		<InfoCard.Root>
			<InfoCard.Label>Experiments</InfoCard.Label>
			<InfoCard.Content>
				<span className="text-lg font-semibold">{sdkInfo.experimentsCount}</span>
			</InfoCard.Content>
		</InfoCard.Root>

		<InfoCard.Root>
			<InfoCard.Label>Remote Evaluation</InfoCard.Label>
			<InfoCard.Content>
				<span className={sdkInfo.usingRemoteEval ? 'text-green-400' : 'text-panel-text-secondary'}>
					{sdkInfo.usingRemoteEval ? 'Enabled' : 'Disabled'}
				</span>
			</InfoCard.Content>
		</InfoCard.Root>

		<div className="col-span-2">
			<InfoCard.Root>
				<InfoCard.Label>Last Updated</InfoCard.Label>
				<InfoCard.Content>
					<span className="text-panel-text-secondary">{formatTimestamp(sdkInfo.timestamp)}</span>
				</InfoCard.Content>
			</InfoCard.Root>
		</div>

		<div className="col-span-2">
			<IsCloudCard sdkApiHost={sdkInfo.apiHost} />
		</div>

		<div className="col-span-2">
			<ApiKeyCard />
		</div>
	</div>
)
