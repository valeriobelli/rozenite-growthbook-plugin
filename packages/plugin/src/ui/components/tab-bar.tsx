export type TabId = 'features' | 'experiments' | 'attributes' | 'logs' | 'sdk-info' | 'settings'

type Tab = {
	id: TabId
	label: string
}

const TABS: Tab[] = [
	{ id: 'features', label: 'Features' },
	{ id: 'experiments', label: 'Experiments' },
	{ id: 'attributes', label: 'Attributes' },
	{ id: 'logs', label: 'Logs' },
	{ id: 'sdk-info', label: 'SDK Info' },
	{ id: 'settings', label: 'Settings' },
]

type TabBarProps = {
	activeTab: TabId
	onTabChange: (tab: TabId) => void
}

export const TabBar = ({ activeTab, onTabChange }: TabBarProps) => (
	<div className="flex border-b border-panel-border bg-panel-surface">
		{TABS.map((tab) => (
			<button
				key={tab.id}
				type="button"
				className={`px-4 py-2 text-sm font-medium transition-colors ${
					activeTab === tab.id
						? 'border-b-2 border-panel-accent text-panel-text'
						: 'text-panel-text-secondary hover:text-panel-text'
				}`}
				onClick={() => {
					onTabChange(tab.id)
				}}>
				{tab.label}
			</button>
		))}
	</div>
)
