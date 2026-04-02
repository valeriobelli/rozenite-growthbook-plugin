import type { ReactNode } from 'react'

import type { SdkInfoSnapshot } from '../../shared/types'

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

interface SdkInfoTabProps {
	sdkInfo: SdkInfoSnapshot
}

export const SdkInfoTab = ({ sdkInfo }: SdkInfoTabProps) => (
	<div className="grid grid-cols-1 gap-3 min-[320px]:grid-cols-2">
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
				<span className={sdkInfo.usingRemoteEval ? 'text-panel-success' : 'text-panel-text-secondary'}>
					{sdkInfo.usingRemoteEval ? 'Enabled' : 'Disabled'}
				</span>
			</InfoCard.Content>
		</InfoCard.Root>

		<InfoCard.Root>
			<InfoCard.Label>Last Updated</InfoCard.Label>
			<InfoCard.Content>
				<span className="text-panel-text-secondary">{formatTimestamp(sdkInfo.timestamp)}</span>
			</InfoCard.Content>
		</InfoCard.Root>
	</div>
)
