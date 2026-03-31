import type { ReactNode } from 'react'
import { useState } from 'react'

import type { SdkInfoSnapshot } from '../../shared/types'

import { useData } from './data-provider'

type SdkInfoTabProps = {
	sdkInfo: SdkInfoSnapshot
}

const maskKey = (key: string) => {
	if (key.length <= 8) {
		return key
	}

	return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`
}

const formatTimestamp = (ts: number) => new Date(ts).toLocaleString()

type InfoCardProps = {
	label: string
	children: ReactNode
}

const InfoCard = ({ label, children }: InfoCardProps) => (
	<div className="rounded border border-panel-border bg-panel-surface p-4">
		<div className="mb-1 text-xs text-panel-text-secondary">{label}</div>
		<div className="text-sm text-panel-text">{children}</div>
	</div>
)

const ApiKeyCard = () => {
	const { apiKey, saveApiKey, clearApiKey } = useData()

	const [inputValue, setInputValue] = useState('')

	if (apiKey !== null) {
		return (
			<InfoCard label="Management API Key">
				<div className="flex items-center justify-between gap-2">
					<span className="font-mono">{maskKey(apiKey)}</span>
					<button
						type="button"
						className="rounded px-2 py-1 text-xs text-panel-text-secondary hover:text-panel-text"
						onClick={clearApiKey}>
						Clear
					</button>
				</div>
			</InfoCard>
		)
	}

	return (
		<InfoCard label="Management API Key">
			<form
				className="flex gap-2"
				onSubmit={(e) => {
					e.preventDefault()

					if (inputValue.trim()) {
						saveApiKey(inputValue.trim())
						setInputValue('')
					}
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
		</InfoCard>
	)
}

export const SdkInfoTab = ({ sdkInfo }: SdkInfoTabProps) => (
	<div className="grid grid-cols-2 gap-3">
		<InfoCard label="API Host">
			<span className="font-mono">
				{sdkInfo.apiHost || <span className="text-panel-text-secondary">Not configured</span>}
			</span>
		</InfoCard>

		<InfoCard label="Client Key">
			<span className="font-mono">
				{sdkInfo.clientKey ? (
					maskKey(sdkInfo.clientKey)
				) : (
					<span className="text-panel-text-secondary">Not configured</span>
				)}
			</span>
		</InfoCard>

		<InfoCard label="Features">
			<span className="text-lg font-semibold">{sdkInfo.featuresCount}</span>
		</InfoCard>

		<InfoCard label="Experiments">
			<span className="text-lg font-semibold">{sdkInfo.experimentsCount}</span>
		</InfoCard>

		<InfoCard label="Remote Evaluation">
			<span className={sdkInfo.usingRemoteEval ? 'text-green-400' : 'text-panel-text-secondary'}>
				{sdkInfo.usingRemoteEval ? 'Enabled' : 'Disabled'}
			</span>
		</InfoCard>

		<div className="col-span-2">
			<InfoCard label="Last Updated">
				<span className="text-panel-text-secondary">{formatTimestamp(sdkInfo.timestamp)}</span>
			</InfoCard>
		</div>

		<div className="col-span-2">
			<ApiKeyCard />
		</div>
	</div>
)
