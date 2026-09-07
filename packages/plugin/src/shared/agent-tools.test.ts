import { type } from 'arktype'
import { describe, expect, it } from 'vitest'

import { growthbookToolDefinitions, growthbookToolNames, SetFeatureOverrideArgs } from './agent-tools'

const TOOL_COUNT = 13

const contracts = Object.entries(growthbookToolDefinitions).map(([name, tool]) => ({ name, tool }))

describe('tool contracts', () => {
	it('exposes every tool exactly once', () => {
		expect(contracts).toHaveLength(TOOL_COUNT)
		expect(Object.keys(growthbookToolNames)).toHaveLength(TOOL_COUNT)
	})

	it.each(contracts)('$name uses a kebab-case name', ({ tool }) => {
		expect(tool.name).toMatch(/^[a-z]+(-[a-z]+)*$/u)
	})

	it.each(contracts)('$name describes itself for an agent that has to choose', ({ tool }) => {
		expect(tool.description.length).toBeGreaterThan(40)
	})

	// arktype emits a draft 2020-12 `$schema`; AgentTool.inputSchema is JSONSchema7.
	it.each(contracts)('$name publishes an object input schema with no dialect key', ({ tool }) => {
		expect(tool.inputSchema).not.toHaveProperty('$schema')
		expect(tool.inputSchema.type).toBe('object')
	})

	it('keeps the arktype description of each argument', () => {
		expect(growthbookToolDefinitions.setFeatureOverride.inputSchema).toMatchObject({
			properties: {
				key: { description: 'a feature key', type: 'string' },
				value: { description: 'the value to force (any JSON value the feature can hold)' },
			},
			required: ['key', 'value'],
		})
	})

	it('marks exactly the tools that discard state as destructive', () => {
		const destructive = contracts
			.filter(({ tool }) => tool.destructive === true)
			.map(({ tool }) => tool.name)
			.sort()

		expect(destructive).toEqual(['clear-feature-overrides', 'clear-variation-overrides', 'replace-attributes'])
	})

	it('never marks a read-only tool as destructive', () => {
		const contradictory = contracts
			.filter(({ tool }) => tool.readOnly === true && tool.destructive !== undefined)
			.map(({ tool }) => tool.name)

		expect(contradictory).toEqual([])
	})

	it('says "no arguments" unambiguously for the tools that take none', () => {
		const noArgumentTools = ['clear-feature-overrides', 'clear-variation-overrides', 'get-state']

		const permissive = contracts
			.filter(({ tool }) => noArgumentTools.includes(tool.name) && tool.inputSchema.additionalProperties !== false)
			.map(({ tool }) => tool.name)

		expect(permissive).toEqual([])
	})

	it('declares cursor pagination only over fields the items actually carry', () => {
		expect(growthbookToolDefinitions.listFeatures.pagination).toMatchObject({ kind: 'cursor' })
		expect(growthbookToolDefinitions.listExperiments.pagination).toMatchObject({ kind: 'cursor' })

		expect(growthbookToolDefinitions.listFeatures.pagination?.defaultFields).toEqual(
			expect.arrayContaining(['key', 'on', 'value'])
		)
	})

	it('publishes the tool names so consumers do not hardcode them', () => {
		expect(growthbookToolNames.setFeatureOverride).toBe('set-feature-override')
	})
})

describe('argument narrowing', () => {
	it('accepts a well-formed call', () => {
		expect(SetFeatureOverrideArgs({ key: 'dark-mode', value: false })).toEqual({
			key: 'dark-mode',
			value: false,
		})
	})

	it('reports a missing or mistyped argument as an error, not a default', () => {
		const summaryOf = (result: unknown): string => (result instanceof type.errors ? result.summary : 'no error')

		expect(summaryOf(SetFeatureOverrideArgs({ key: 'dark-mode' }))).toMatch(/value must be present/u)
		expect(summaryOf(SetFeatureOverrideArgs({ key: 1, value: false }))).toMatch(/key must be a feature key/u)
	})
})
