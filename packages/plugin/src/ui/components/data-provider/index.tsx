import type { PropsWithChildren, ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'

import { invariant } from '../../../shared/utils'

import type { Archetype, SDKAttribute } from './codecs'
import { useApiKey, useGrowthBookApi } from './hooks'

type DataProviderContextType = {
	apiKey: string | null
	saveApiKey: (key: string) => void
	clearApiKey: () => void
	archetypes: Archetype[]
	attributeSchema: SDKAttribute[]
}

const Context = createContext<DataProviderContextType | null>(null)

const DefaultDataProvider = ({
	saveApiKey,
	clearApiKey,
	children,
}: PropsWithChildren<Pick<DataProviderContextType, 'saveApiKey' | 'clearApiKey'>>) => {
	const value = useMemo(
		() => ({
			apiKey: null,
			archetypes: [],
			attributeSchema: [],
			clearApiKey,
			saveApiKey,
		}),
		[saveApiKey, clearApiKey]
	)

	return <Context.Provider value={value}>{children}</Context.Provider>
}

const ApiDataProvider = ({
	apiKey,
	apiHost,
	clearApiKey,
	saveApiKey,
	children,
}: PropsWithChildren<
	{ apiHost: string; apiKey: string } & Required<Pick<DataProviderContextType, 'saveApiKey' | 'clearApiKey'>>
>) => {
	const { archetypes, attributeSchema } = useGrowthBookApi({ apiHost, apiKey })

	const value = useMemo(
		() => ({
			apiKey,
			archetypes,
			attributeSchema,
			clearApiKey,
			saveApiKey,
		}),
		[apiKey, archetypes, attributeSchema, saveApiKey, clearApiKey]
	)

	return <Context.Provider value={value}>{children}</Context.Provider>
}

type Props = {
	children: ReactNode
	apiHost?: string
}

export const DataProvider = ({ apiHost, children }: Props) => {
	const { apiKey, ...apiKeyHandlers } = useApiKey()

	if (!apiHost || !apiKey) {
		return <DefaultDataProvider {...apiKeyHandlers}>{children}</DefaultDataProvider>
	}

	return (
		<ApiDataProvider apiHost={apiHost} apiKey={apiKey} {...apiKeyHandlers}>
			{children}
		</ApiDataProvider>
	)
}

export const useData = () => {
	const context = useContext(Context)

	invariant(context, 'useData must be used within a DataProvider')

	return context
}
