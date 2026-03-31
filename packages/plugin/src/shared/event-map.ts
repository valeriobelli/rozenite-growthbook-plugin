import type { AttributeUpdate, DebugLogEntry, FeatureOverride, GrowthBookSnapshot, VariationOverride } from './types'

export type GrowthBookEventMap = {
	'gb:init': { timeout?: number }
	'gb:snapshot': GrowthBookSnapshot
	'gb:state-update': GrowthBookSnapshot
	'gb:debug-log': DebugLogEntry
	'gb:debug-logs-batch': DebugLogEntry[]
	'gb:request-snapshot': Record<string, unknown>
	'gb:set-feature-override': FeatureOverride
	'gb:remove-feature-override': { key: string }
	'gb:clear-feature-overrides': Record<string, unknown>
	'gb:set-variation-override': VariationOverride
	'gb:remove-variation-override': { experimentKey: string }
	'gb:clear-variation-overrides': Record<string, unknown>
	'gb:set-attributes': AttributeUpdate
}
