import type { SdkInfoSnapshot } from '../../shared/types'

type SdkInfoTabProps = {
	sdkInfo: SdkInfoSnapshot
	onToggleDebug: (enabled: boolean) => void
}

function maskClientKey(key: string): string {
	if (key.length <= 8) {
		return key
	}

	return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`
}

function formatTimestamp(ts: number): string {
	return new Date(ts).toLocaleString()
}

type InfoCardProps = {
	label: string
	children: React.ReactNode
}

function InfoCard({ label, children }: InfoCardProps) {
	return (
		<div className="rounded border border-panel-border bg-panel-surface p-4">
			<div className="mb-1 text-xs text-panel-text-secondary">{label}</div>
			<div className="text-sm text-panel-text">{children}</div>
		</div>
	)
}

export function SdkInfoTab({ sdkInfo, onToggleDebug }: SdkInfoTabProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<InfoCard label="API Host">
				<span className="font-mono">
					{sdkInfo.apiHost || <span className="text-panel-text-secondary">Not configured</span>}
				</span>
			</InfoCard>

			<InfoCard label="Client Key">
				<span className="font-mono">
					{sdkInfo.clientKey ? (
						maskClientKey(sdkInfo.clientKey)
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

			<InfoCard label="Debug Mode">
				<button
					type="button"
					className="flex cursor-pointer items-center gap-2"
					onClick={() => {
						onToggleDebug(!sdkInfo.debug)
					}}>
					<span
						className={`relative h-5 w-9 flex-none rounded-full transition-colors ${
							sdkInfo.debug ? 'bg-green-500' : 'bg-panel-border'
						}`}>
						<span
							className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
								sdkInfo.debug ? 'translate-x-4' : 'translate-x-0'
							}`}
						/>
					</span>
					<span className="text-sm">{sdkInfo.debug ? 'Enabled' : 'Disabled'}</span>
				</button>
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
		</div>
	)
}
