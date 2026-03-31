import { type } from 'arktype'

export const Archetype = type({
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
	archetypes: Archetype.array(),
})

export const AttributeSchemaResponse = type({
	attributes: SDKAttribute.array(),
})

export type Archetype = typeof Archetype.infer
export type SDKAttribute = typeof SDKAttribute.infer
