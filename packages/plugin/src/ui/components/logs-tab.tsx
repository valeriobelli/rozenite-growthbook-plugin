import { useEffect, useMemo, useRef, useState } from 'react'

import type { DebugLogEntry } from '../../shared/types'

import { InlineValue } from './json-viewer'

type LogsTabProps = {
	logs: DebugLogEntry[]
	onClear: () => void
}

const formatTimestamp = (ts: number): string => {
	const date = new Date(ts)

	return date.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})
}

export const LogsTab = ({ logs, onClear }: LogsTabProps) => {
	const [search, setSearch] = useState('')

	const scrollRef = useRef<HTMLDivElement>(null)

	const filteredLogs = useMemo(() => {
		if (!search) {
			return logs
		}

		const lower = search.toLowerCase()

		return logs.filter((log) => log.featureKey.toLowerCase().includes(lower))
	}, [logs, search])

	useEffect(() => {
		const el = scrollRef.current

		if (!el) {
			return
		}

		el.scrollTop = el.scrollHeight
	}, [filteredLogs.length])

	return (
		<div className="flex h-full flex-col">
			<div className="mb-3 flex items-center gap-3">
				<input
					type="text"
					aria-label="Filter by feature key"
					placeholder="Filter by feature key..."
					className="flex-1 rounded border border-panel-border bg-panel-surface px-3 py-1.5 text-sm text-panel-text placeholder:text-panel-text-secondary"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value)
					}}
				/>
				<button
					type="button"
					className="rounded bg-panel-surface px-3 py-1.5 text-xs text-panel-text-secondary hover:text-panel-text"
					onClick={onClear}>
					Clear
				</button>
				<span className="text-xs text-panel-text-secondary">
					{filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
				</span>
			</div>

			{filteredLogs.length === 0 ? (
				<div className="py-8 text-center text-panel-text-secondary">
					{search ? 'No logs match your filter' : 'No debug logs yet'}
				</div>
			) : (
				<div ref={scrollRef} className="flex-1 overflow-auto">
					<table className="w-full">
						<thead className="sticky top-0 bg-panel-bg">
							<tr className="border-b border-panel-border text-left text-xs text-panel-text-secondary">
								<th className="px-3 py-2 font-medium">Time</th>
								<th className="px-3 py-2 font-medium">Feature</th>
								<th className="px-3 py-2 font-medium">Value</th>
								<th className="px-3 py-2 font-medium">Source</th>
								<th className="px-3 py-2 font-medium">Rule</th>
							</tr>
						</thead>
						<tbody>
							{filteredLogs.map((log) => (
								<tr key={log.id} className="border-b border-panel-border hover:bg-panel-surface/50">
									<td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-panel-text-secondary">
										{formatTimestamp(log.timestamp)}
									</td>
									<td className="px-3 py-1.5 font-mono text-sm">{log.featureKey}</td>
									<td className="px-3 py-1.5 text-sm">
										<InlineValue value={log.result.value} />
									</td>
									<td className="px-3 py-1.5">
										<span className="rounded bg-panel-surface px-2 py-0.5 text-xs text-panel-text-secondary">
											{log.result.source}
										</span>
									</td>
									<td className="px-3 py-1.5 font-mono text-xs text-panel-text-secondary">
										{log.result.ruleId || '-'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
