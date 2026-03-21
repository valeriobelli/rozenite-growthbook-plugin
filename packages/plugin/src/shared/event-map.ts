import type { AttributeUpdate, DebugLogEntry, FeatureOverride, GrowthBookSnapshot, VariationOverride } from './types'

export type GrowthBookEventMap = {
	'gb:snapshot': GrowthBookSnapshot
	'gb:state-update': GrowthBookSnapshot
	'gb:debug-log': DebugLogEntry
	'gb:debug-logs-batch': DebugLogEntry[]
	'gb:request-snapshot': undefined
	'gb:set-feature-override': FeatureOverride
	'gb:remove-feature-override': { key: string }
	'gb:clear-feature-overrides': undefined
	'gb:set-variation-override': VariationOverride
	'gb:remove-variation-override': { experimentKey: string }
	'gb:clear-variation-overrides': undefined
	'gb:set-attributes': AttributeUpdate
	'gb:set-debug': { enabled: boolean }
}
