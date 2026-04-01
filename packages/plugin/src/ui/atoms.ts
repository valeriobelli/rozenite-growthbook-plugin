import { atom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const apiKey = atomWithStorage<string | null>('rozenite-growthbook-plugin-api-key', null)

const setApiKey = atom(null, (_, set, newKey: string) => {
	set(apiKey, newKey)
})

const clearApiKey = atom(null, (_, set) => {
	set(apiKey, null)
})

export const useApiKey = () => useAtomValue(apiKey)

export const useSetApiKey = () => useSetAtom(setApiKey)

export const useClearApiKey = () => useSetAtom(clearApiKey)
