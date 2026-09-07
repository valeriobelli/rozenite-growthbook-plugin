import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	workspaces: {
		example: {
			entry: ['src/App.tsx'],
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
			ignoreDependencies: ['react-native', 'react-native-web', 'tailwindcss'],
			project: ['src/**/*.{ts,tsx}', '*.{ts,mts}'],
		},
	},
}

export default config
