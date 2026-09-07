import { WaitForTimeoutError, waitForMessage } from '@rozenite/testing'
import { cleanup, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { growthbookToolNames } from '../shared/agent-tools'
import type { GrowthBookEventMap } from '../shared/event-map'

import { callTool, expectResult, setupHarness, waitForFirstSnapshot } from './agent-test-harness'

const settle = () =>
	new Promise((resolve) => {
		setTimeout(resolve, 50)
	})

afterEach(() => {
	cleanup()
})

describe('panel and agent stay in step', () => {
	it('pushes a state update to the panel when an agent forces a feature', async () => {
		const { agent, panel, stateUpdates } = await setupHarness()

		await waitForFirstSnapshot(panel)
		stateUpdates.length = 0

		await expectResult(agent, growthbookToolNames.setFeatureOverride, { key: 'dark-mode', value: false })

		await waitFor(() => {
			expect(stateUpdates.length).toBeGreaterThan(0)
		})

		expect(stateUpdates.at(-1)?.forcedFeatures).toEqual({ 'dark-mode': false })
	})

	it('pushes a state update when an agent changes attributes', async () => {
		const { agent, panel, stateUpdates } = await setupHarness()

		await waitForFirstSnapshot(panel)
		stateUpdates.length = 0

		await expectResult(agent, growthbookToolNames.patchAttributes, { attributes: { country: 'IT' } })

		await waitFor(() => {
			expect(stateUpdates.length).toBeGreaterThan(0)
		})

		expect(stateUpdates.at(-1)?.attributes).toMatchObject({ country: 'IT', id: 'user-123' })
	})

	// Reading the SDK calls evalFeature, which notifies the subscribers. Without the
	// suppression in useGrowthBookDevTools, a readOnly tool would push a state update
	// and append one synthetic debug log per feature on every call.
	it('sends nothing to the panel for a read-only tool call', async () => {
		const { agent, panel, stateUpdates } = await setupHarness()

		const first = await waitForFirstSnapshot(panel)

		stateUpdates.length = 0

		await expectResult(agent, growthbookToolNames.listFeatures, {})
		await expectResult(agent, growthbookToolNames.getFeature, { key: 'dark-mode' })
		await expectResult(agent, growthbookToolNames.getState, {})
		await settle()

		expect(stateUpdates).toHaveLength(0)

		const second = await waitForFirstSnapshot(panel)

		expect(second.debugLogs).toHaveLength(first.debugLogs.length)
	})

	it('keeps serving the panel protocol after the refactor', async () => {
		const { agent, panel, stateUpdates } = await setupHarness()

		await waitForFirstSnapshot(panel)
		stateUpdates.length = 0

		// The panel always sends the complete attribute map, so this replaces it.
		panel.send('gb:set-attributes', { attributes: { country: 'IT', id: 'user-123' } })

		await waitFor(() => {
			expect(stateUpdates.length).toBeGreaterThan(0)
		})

		expect(stateUpdates.at(-1)?.attributes).toEqual({ country: 'IT', id: 'user-123' })

		const feature = await expectResult<{ feature: { on: boolean } }>(agent, growthbookToolNames.getFeature, {
			key: 'dark-mode',
		})

		expect(feature.feature.on).toBe(false)
	})

	it('still emits the debug log batch the panel Logs tab reads', async () => {
		const { agent, panel } = await setupHarness()

		await waitForFirstSnapshot(panel)

		const batch = waitForMessage<GrowthBookEventMap, 'gb:debug-logs-batch'>(panel, 'gb:debug-logs-batch', {
			timeoutMs: 2000,
		})

		await expectResult(agent, growthbookToolNames.setFeatureOverride, { key: 'dark-mode', value: false })

		expect((await batch).length).toBeGreaterThan(0)
	})
})

describe('transport failures', () => {
	it('fails the call instead of hanging when the device cannot be reached', async () => {
		const { agent, pair } = await setupHarness()

		pair.dropPanelToDevice(true)

		await expect(callTool(agent, growthbookToolNames.getState, {})).rejects.toThrow(WaitForTimeoutError)
	})
})
