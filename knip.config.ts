import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	workspaces: {
		'.': {
			entry: ['commitlint.config.mts', 'oxfmt.config.mts', 'oxlint.config.mts'],
			ignoreDependencies: ['@commitlint/config-conventional'],
		},
		'packages/plugin': {
			entry: [
				'react-native.ts',
				'rozenite.config.ts',
				'src/ui/panel.tsx',
				'src/react-native/use-growthbook-devtools.ts',
			],
			project: ['src/**/*.{ts,tsx}', '*.{ts,mts}'],
			ignoreDependencies: ['react-dom', 'react-native', 'react-native-web'],
		},
		example: {
			entry: ['src/App.tsx', 'metro.config.js'],
			project: ['src/**/*.{ts,tsx}', '*.{js,ts}'],
			ignoreDependencies: ['@babel/core', 'expo-updates'],
		},
	},
}

export default config
