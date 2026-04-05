import { type } from 'arktype'

export const SDKArchetype = type({
	attributes: 'Record<string, unknown>',
	'description?': 'string',
	id: 'string',
	name: 'string',
})

export const SDKAttribute = type({
	datatype: "'string' | 'number' | 'boolean' | 'enum' | 'secureString' | 'string[]' | 'number[]' | 'secureString[]'",
	'description?': 'string',
	'enum?': 'string',
	property: 'string',
})

export const ArchetypesResponse = type({
	archetypes: SDKArchetype.array(),
})

export const AttributesResponse = type({
	attributes: SDKAttribute.array(),
})

export type SDKArchetype = typeof SDKArchetype.infer
export type SDKAttribute = typeof SDKAttribute.infer
