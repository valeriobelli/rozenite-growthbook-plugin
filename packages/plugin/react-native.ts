import type { GrowthBookDevToolsOptions } from './src/react-native/use-growthbook-devtools'

type UseGrowthBookDevTools = (options: GrowthBookDevToolsOptions) => void

const isDev = process.env.NODE_ENV !== 'production'
const isServer = typeof window === 'undefined'
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'

let useGrowthBookDevTools: UseGrowthBookDevTools

if (isDev && isReactNative && !isServer) {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const mod = require('./src/react-native/use-growthbook-devtools') as { useGrowthBookDevTools: UseGrowthBookDevTools }

	useGrowthBookDevTools = mod.useGrowthBookDevTools
} else {
	useGrowthBookDevTools = () => undefined
}

export type { ExperimentSnapshot, FeatureSnapshot, GrowthBookSnapshot } from './src/shared/types'
export { useGrowthBookDevTools }
