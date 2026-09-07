import { cleanup, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { growthbookToolNames } from '../shared/agent-tools'
import { PLUGIN_ID } from '../shared/constants'

import { callTool, expectResult, setupHarness, TOOL_COUNT } from './agent-test-harness'

const setup = setupHarness

afterEach(() => {
	cleanup()
})

describe('registration', () => {
	it('registers every tool under the plugin domain', async () => {
		const { registered } = await setup()

		expect(registered.map((tool) => tool.name).sort()).toEqual(
			Object.values(growthbookToolNames)
				.map((name) => `${PLUGIN_ID}.${name}`)
				.sort()
		)
	})

	it('re-registers when an agent session attaches', async () => {
		const { agent, registered } = await setup()

		registered.length = 0
		agent.send('agent-session-ready', { sessionId: 'session-1' })

		await waitFor(() => {
			expect(registered).toHaveLength(TOOL_COUNT)
		})
	})
})

describe('read tools', () => {
	it('lists the features the SDK knows', async () => {
		const { agent } = await setup()

		const result = await expectResult<{
			items: Array<{ key: string; on: boolean; overridden: boolean }>
			total: number
		}>(agent, growthbookToolNames.listFeatures, {})

		expect(result.total).toBe(3)
		expect(result.items.map((item) => item.key).sort()).toEqual(['banner-text', 'dark-mode', 'max-items'])
		expect(result.items.every((item) => !item.overridden)).toBe(true)
	})

	it('pages through the features with the cursor it hands back', async () => {
		const { agent } = await setup()

		type Page = { items: Array<{ key: string }>; page: { hasMore: boolean; nextCursor?: string } }

		const first = await expectResult<Page>(agent, growthbookToolNames.listFeatures, { limit: 2 })

		expect(first.items).toHaveLength(2)
		expect(first.page.hasMore).toBe(true)

		const second = await expectResult<Page>(agent, growthbookToolNames.listFeatures, {
			cursor: first.page.nextCursor,
			limit: 2,
		})

		expect(second.items).toHaveLength(1)
		expect(second.page.hasMore).toBe(false)
	})

	it('reports an unknown feature key as a failed call', async () => {
		const { agent } = await setup()

		const outcome = await callTool(agent, growthbookToolNames.getFeature, { key: 'nope' })

		expect(outcome.success).toBe(false)
		expect(outcome.error).toMatch(/is not registered in the SDK/u)
	})

	it('returns attributes, overrides and sdk info together', async () => {
		const { agent } = await setup()

		const state = await expectResult<{
			attributes: Record<string, unknown>
			forcedFeatures: Record<string, unknown>
			sdkInfo: { clientKey: string }
		}>(agent, growthbookToolNames.getState, {})

		expect(state.attributes).toMatchObject({ country: 'US', id: 'user-123' })
		expect(state.forcedFeatures).toEqual({})
		expect(state.sdkInfo.clientKey).toBe('test-client-key')
	})
})

describe('write tools', () => {
	it('forces a feature value and reports the re-evaluated feature', async () => {
		const { agent } = await setup()

		const result = await expectResult<{ feature: { on: boolean; overridden: boolean; value: unknown } }>(
			agent,
			growthbookToolNames.setFeatureOverride,
			{ key: 'dark-mode', value: false }
		)

		expect(result.feature).toMatchObject({ on: false, overridden: true, value: false })
	})

	it('removes one override and leaves the others alone', async () => {
		const { agent } = await setup()

		await expectResult(agent, growthbookToolNames.setFeatureOverride, { key: 'dark-mode', value: false })
		await expectResult(agent, growthbookToolNames.setFeatureOverride, { key: 'max-items', value: 99 })

		const removed = await expectResult<{ feature: { overridden: boolean }; removed: boolean }>(
			agent,
			growthbookToolNames.removeFeatureOverride,
			{ key: 'dark-mode' }
		)

		expect(removed).toMatchObject({ removed: true })
		expect(removed.feature.overridden).toBe(false)

		const state = await expectResult<{ forcedFeatures: Record<string, unknown> }>(
			agent,
			growthbookToolNames.getState,
			{}
		)

		expect(state.forcedFeatures).toEqual({ 'max-items': 99 })
	})

	it('clears every override and says how many it dropped', async () => {
		const { agent } = await setup()

		await expectResult(agent, growthbookToolNames.setFeatureOverride, { key: 'dark-mode', value: false })
		await expectResult(agent, growthbookToolNames.setFeatureOverride, { key: 'max-items', value: 99 })

		expect(await expectResult(agent, growthbookToolNames.clearFeatureOverrides, {})).toEqual({ cleared: 2 })
	})

	it('forces an experiment variation', async () => {
		const { agent } = await setup()

		const result = await expectResult<{ forcedVariations: Record<string, number> }>(
			agent,
			growthbookToolNames.setVariationOverride,
			{ experimentKey: 'checkout-flow', variationIndex: 1 }
		)

		expect(result.forcedVariations).toEqual({ 'checkout-flow': 1 })

		const experiments = await expectResult<{ items: Array<{ forcedVariationIndex?: number; variationId: number }> }>(
			agent,
			growthbookToolNames.listExperiments,
			{}
		)

		expect(experiments.items[0]).toMatchObject({ forcedVariationIndex: 1, variationId: 1 })
	})

	it('merges on patch and drops the rest on replace', async () => {
		const { agent } = await setup()

		const patched = await expectResult<{ attributes: Record<string, unknown> }>(
			agent,
			growthbookToolNames.patchAttributes,
			{ attributes: { country: 'IT' } }
		)

		expect(patched.attributes).toMatchObject({ country: 'IT', id: 'user-123', plan: 'pro' })

		const replaced = await expectResult<{ attributes: Record<string, unknown> }>(
			agent,
			growthbookToolNames.replaceAttributes,
			{ attributes: { country: 'IT' } }
		)

		expect(replaced.attributes).toEqual({ country: 'IT' })
	})

	it('deletes only the named attributes', async () => {
		const { agent } = await setup()

		const result = await expectResult<{ attributes: Record<string, unknown>; removed: string[] }>(
			agent,
			growthbookToolNames.removeAttributes,
			{ keys: ['plan', 'never-set'] }
		)

		expect(result.removed).toEqual(['plan'])
		expect(result.attributes).toEqual({ country: 'US', id: 'user-123' })
	})

	it('re-evaluates the rules after an attribute change', async () => {
		const { agent } = await setup()

		// The fake mirrors example/src/App.tsx: dark-mode is forced on for country US.
		const before = await expectResult<{ feature: { on: boolean } }>(agent, growthbookToolNames.getFeature, {
			key: 'dark-mode',
		})

		expect(before.feature.on).toBe(true)

		await expectResult(agent, growthbookToolNames.patchAttributes, { attributes: { country: 'IT' } })

		const after = await expectResult<{ feature: { on: boolean; source: string } }>(
			agent,
			growthbookToolNames.getFeature,
			{ key: 'dark-mode' }
		)

		expect(after.feature).toMatchObject({ on: false, source: 'defaultValue' })
	})
})

describe('argument validation', () => {
	it('rejects a mistyped argument with the arktype message', async () => {
		const { agent } = await setup()

		const outcome = await callTool(agent, growthbookToolNames.setFeatureOverride, { key: 1, value: false })

		expect(outcome.success).toBe(false)
		expect(outcome.error).toMatch(/key must be a feature key/u)
	})

	it('rejects a missing argument instead of forcing undefined', async () => {
		const { agent } = await setup()

		const outcome = await callTool(agent, growthbookToolNames.setFeatureOverride, { key: 'dark-mode' })

		expect(outcome.success).toBe(false)
		expect(outcome.error).toMatch(/value must be present/u)
	})

	it('rejects a cursor it did not mint', async () => {
		const { agent } = await setup()

		const outcome = await callTool(agent, growthbookToolNames.listFeatures, { cursor: 'garbage' })

		expect(outcome.success).toBe(false)
		expect(outcome.error).toMatch(/without a cursor to restart pagination/u)
	})
})
