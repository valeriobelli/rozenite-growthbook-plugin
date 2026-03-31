import { useSuspenseQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { useState } from 'react'

import { invariant } from '../../../shared/utils'

import { ArchetypesResponse, AttributeSchemaResponse } from './codecs'

const STORAGE_KEY = 'rozenite-gb-api-key'

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

	const data = AttributeSchemaResponse(await response.json())

	invariant(!(data instanceof type.errors), 'Invalid attribute schema response')

	return data.attributes
}

export const useGrowthBookApi = ({ apiHost, apiKey }: { apiHost: string; apiKey: string }) => {
	const archetypesQuery = useSuspenseQuery({
		queryFn: () => fetchArchetypes(apiHost, apiKey),
		queryKey: ['archetypes', apiHost, apiKey],
	})

	const attributeSchemaQuery = useSuspenseQuery({
		queryFn: () => fetchAttributeSchema(apiHost, apiKey),
		queryKey: ['attribute-schema', apiHost, apiKey],
	})

	return {
		archetypes: archetypesQuery.data ?? [],
		attributeSchema: attributeSchemaQuery.data ?? [],
	}
}

export const useApiKey = () => {
	const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))

	const saveApiKey = (key: string) => {
		localStorage.setItem(STORAGE_KEY, key)

		setApiKey(key)
	}

	const clearApiKey = () => {
		localStorage.removeItem(STORAGE_KEY)

		setApiKey(null)
	}

	return {
		apiKey,
		clearApiKey,
		saveApiKey,
	}
}
