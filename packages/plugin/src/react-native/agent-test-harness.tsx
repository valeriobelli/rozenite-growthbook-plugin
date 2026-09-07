import type { RozeniteDevToolsClient } from '@rozenite/plugin-bridge'
import { getRozeniteDevToolsClient, RozeniteChannelProvider } from '@rozenite/plugin-bridge'
import type { FakeChannelPair } from '@rozenite/testing'
import { connectFakePair, waitForMessage } from '@rozenite/testing'
import { render, waitFor } from '@testing-library/react'
import { expect } from 'vitest'

import { growthbookToolDefinitions } from '../shared/agent-tools'
import { PLUGIN_ID } from '../shared/constants'
import type { GrowthBookEventMap } from '../shared/event-map'
import type { GrowthBookSnapshot } from '../shared/types'

import type { GrowthBookInstance } from './growthbook-controller'
import { createFakeGrowthBook } from './growthbook-fake'
import { useGrowthBookDevTools } from './use-growthbook-devtools'

/** The bridge registers agent tools under its own plugin id, not the plugin's. */
const AGENT_PLUGIN_ID = 'rozenite-agent'

export const TOOL_COUNT = Object.keys(growthbookToolDefinitions).length

const TIMEOUT_MS = 2000

type RegisteredTool = {
	description: string
	inputSchema: Record<string, unknown>
	name: string
}

export type AgentEventMap = {
	'agent-session-ready': { sessionId?: string }
	'register-tool': { tools: RegisteredTool[] }
	'tool-call': { arguments: unknown; callId: string; toolName: string }
	'tool-result': { callId: string; error?: string; result?: unknown; success: boolean }
	'unregister-tool': { toolNames: string[] }
}

export type AgentClient = RozeniteDevToolsClient<AgentEventMap>
export type PanelClient = RozeniteDevToolsClient<GrowthBookEventMap>

export type Harness = {
	agent: AgentClient
	gb: GrowthBookInstance
	pair: FakeChannelPair
	panel: PanelClient
	registered: RegisteredTool[]
	stateUpdates: GrowthBookSnapshot[]
}

let callCounter = 0

export const callTool = (agent: AgentClient, toolName: string, args: unknown) => {
	const callId = `call-${++callCounter}`

	agent.send('tool-call', { arguments: args, callId, toolName: `${PLUGIN_ID}.${toolName}` })

	return waitForMessage<AgentEventMap, 'tool-result'>(
		agent,
		'tool-result',
		{ timeoutMs: TIMEOUT_MS },
		(payload) => payload.callId === callId
	)
}

export const expectResult = async <TResult,>(agent: AgentClient, toolName: string, args: unknown): Promise<TResult> => {
	const outcome = await callTool(agent, toolName, args)

	expect(outcome.error).toBeUndefined()
	expect(outcome.success).toBe(true)

	// The wire result is unknown by construction. Each test asserts the shape it
	// expects right after this call, which is the check that matters.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return outcome.result as TResult
}

/**
 * The device answers only once its client has resolved and subscribed, and the
 * bridge does not buffer. The real panel polls for the first snapshot for the
 * same reason (see `src/ui/panel.tsx`), so the harness does too.
 */
export const waitForFirstSnapshot = async (panel: PanelClient): Promise<GrowthBookSnapshot> => {
	for (let attempt = 0; attempt < 50; attempt += 1) {
		panel.send('gb:request-snapshot', {})

		const snapshot = await waitForMessage<GrowthBookEventMap, 'gb:snapshot'>(panel, 'gb:snapshot', {
			timeoutMs: 50,
		}).catch(() => null)

		if (snapshot) {
			return snapshot
		}
	}

	throw new Error('The device never answered gb:request-snapshot.')
}

export const setupHarness = async (gb: GrowthBookInstance = createFakeGrowthBook()): Promise<Harness> => {
	const pair = connectFakePair()

	const panel = await getRozeniteDevToolsClient<GrowthBookEventMap>(PLUGIN_ID, { channel: pair.panel })
	const agent = await getRozeniteDevToolsClient<AgentEventMap>(AGENT_PLUGIN_ID, { channel: pair.panel })

	const registered: RegisteredTool[] = []
	const stateUpdates: GrowthBookSnapshot[] = []

	agent.onMessage('register-tool', ({ tools }) => {
		registered.push(...tools)
	})

	panel.onMessage('gb:state-update', (snapshot) => {
		stateUpdates.push(snapshot)
	})

	const Host = () => {
		useGrowthBookDevTools(gb)

		return null
	}

	render(
		<RozeniteChannelProvider channel={pair.device} role="device">
			<Host />
		</RozeniteChannelProvider>
	)

	await waitFor(() => {
		expect(registered).toHaveLength(TOOL_COUNT)
	})

	return { agent, gb, pair, panel, registered, stateUpdates }
}
