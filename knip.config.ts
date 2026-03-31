import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	workspaces: {
		'.': {
			entry: ['commitlint.config.mts'],
			ignoreDependencies: ['@commitlint/config-conventional'],
		},
		example: {
			entry: ['src/App.tsx', 'metro.config.js'],
			ignoreDependencies: ['@babel/core', 'expo-updates'],
			project: ['src/**/*.{ts,tsx}', '*.{js,ts}'],
		},
		'packages/plugin': {
			entry: [
				'react-native.ts',
				'rozenite.config.ts',
				'src/ui/panel.tsx',
				'src/react-native/use-growthbook-devtools.ts',
			],
			ignoreDependencies: ['react-native', 'react-native-web'],
			project: ['src/**/*.{ts,tsx}', '*.{ts,mts}'],
		},
	},
}

export default config
