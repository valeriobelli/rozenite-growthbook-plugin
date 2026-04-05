import { useSuspenseQuery } from '@tanstack/react-query'
import { type } from 'arktype'

import { invariant } from '../../../../shared/utils'

import { ArchetypesResponse, AttributesResponse } from './codecs'

const fetchArchetypes = async (apiHost: string, apiKey: string) => {
	const response = await fetch(`${apiHost}/api/v1/archetypes`, {
		headers: { Authorization: `Bearer ${apiKey}` },
	})

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`)
	}

	const data = ArchetypesResponse(await response.json())

	invariant(!(data instanceof type.errors), 'Invalid archetypes response')

	return data.archetypes
}

const fetchAttributeSchema = async (apiHost: string, apiKey: string) => {
	const response = await fetch(`${apiHost}/api/v1/attributes`, {
		headers: { Authorization: `Bearer ${apiKey}` },
	})

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`)
	}

	const data = AttributesResponse(await response.json())

	invariant(!(data instanceof type.errors), 'Invalid attribute schema response')

	return data.attributes
}

export const useGrowthBookApi = ({ apiHost, apiKey }: { apiHost: string; apiKey: string }) => {
	const archetypesQuery = useSuspenseQuery({
		queryFn: () => fetchArchetypes(apiHost, apiKey),
		queryKey: ['archetypes', apiHost, apiKey],
	})

	const attributesQuery = useSuspenseQuery({
		queryFn: () => fetchAttributeSchema(apiHost, apiKey),
		queryKey: ['attributes', apiHost, apiKey],
	})

	return {
		archetypes: archetypesQuery.data,
		attributes: attributesQuery.data,
	}
}
