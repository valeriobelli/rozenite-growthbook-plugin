import type { PropsWithChildren, ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'

import { invariant } from '../../../shared/utils'
import { useApiKey } from '../../atoms'

import type { Archetype, SDKAttribute } from './codecs'
import { useGrowthBookApi } from './hooks'

type DataProviderContextType = {
	archetypes: Archetype[]
	attributeSchema: SDKAttribute[]
}

const Context = createContext<DataProviderContextType | null>(null)

const DefaultDataProvider = ({ children }: PropsWithChildren) => {
	const value = useMemo(
		() => ({
			archetypes: [],
			attributeSchema: [],
		}),
		[]
	)

	return <Context.Provider value={value}>{children}</Context.Provider>
}

const ApiDataProvider = ({ apiKey, apiHost, children }: PropsWithChildren<{ apiHost: string; apiKey: string }>) => {
	const { archetypes, attributeSchema } = useGrowthBookApi({ apiHost, apiKey })

	const value = useMemo(
		() => ({
			archetypes,
			attributeSchema,
		}),
		[archetypes, attributeSchema]
	)

	return <Context.Provider value={value}>{children}</Context.Provider>
}

type Props = {
	children: ReactNode
	apiHost?: string
}

export const DataProvider = ({ apiHost, children }: Props) => {
	const apiKey = useApiKey()

	if (!apiHost || !apiKey) {
		return <DefaultDataProvider>{children}</DefaultDataProvider>
	}

	return (
		<ApiDataProvider apiHost={apiHost} apiKey={apiKey}>
			{children}
		</ApiDataProvider>
	)
}

export const useData = () => {
	const context = useContext(Context)

	invariant(context, 'useData must be used within a DataProvider')

	return context
}
