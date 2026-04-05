import type { PropsWithChildren, ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'

import { invariant } from '../../../../shared/utils'
import { useApiKey, useIsCloud } from '../../../atoms'
import { CLOUD_API_HOST } from '../../../constants'

import type { SDKArchetype, SDKAttribute } from './codecs'
import { useGrowthBookApi } from './hooks'

type DataProviderContextType = {
	sdkArchetypes: SDKArchetype[]
	sdkAttributes: SDKAttribute[]
}

const Context = createContext<DataProviderContextType | null>(null)

const defaultValue: DataProviderContextType = {
	sdkArchetypes: [],
	sdkAttributes: [],
}

function DefaultDataProvider({ children }: PropsWithChildren) {
	return <Context.Provider value={defaultValue}>{children}</Context.Provider>
}

const ApiDataProvider = ({ apiKey, apiHost, children }: PropsWithChildren<{ apiHost: string; apiKey: string }>) => {
	const { archetypes, attributes } = useGrowthBookApi({ apiHost, apiKey })

	const value = useMemo(
		() => ({
			sdkArchetypes: archetypes,
			sdkAttributes: attributes,
		}),
		[archetypes, attributes]
	)

	return <Context.Provider value={value}>{children}</Context.Provider>
}

type Props = {
	children: ReactNode
	apiHost?: string
}

export const DataProvider = ({ apiHost, children }: Props) => {
	const apiKey = useApiKey()
	const isCloud = useIsCloud()

	const effectiveApiHost = isCloud ? CLOUD_API_HOST : apiHost

	if (!effectiveApiHost || !apiKey) {
		return <DefaultDataProvider>{children}</DefaultDataProvider>
	}

	return (
		<ApiDataProvider apiHost={effectiveApiHost} apiKey={apiKey}>
			{children}
		</ApiDataProvider>
	)
}

export const useData = () => {
	const context = useContext(Context)

	invariant(context, 'useData must be used within a DataProvider')

	return context
}
