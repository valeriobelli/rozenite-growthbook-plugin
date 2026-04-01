import { atom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const apiKey = atomWithStorage<string | null>('rozenite-growthbook-plugin-api-key', null)

const isCloud = atomWithStorage('rozenite-growthbook-plugin-is-cloud', true)

const setApiKey = atom(null, (_, set, newKey: string) => {
	set(apiKey, newKey)
})

const clearApiKey = atom(null, (_, set) => {
	set(apiKey, null)
})

const setIsCloud = atom(null, (_, set, value: boolean) => {
	set(isCloud, value)
})

export const useApiKey = () => useAtomValue(apiKey)

export const useSetApiKey = () => useSetAtom(setApiKey)

export const useClearApiKey = () => useSetAtom(clearApiKey)

export const useIsCloud = () => useAtomValue(isCloud)

export const useSetIsCloud = () => useSetAtom(setIsCloud)
