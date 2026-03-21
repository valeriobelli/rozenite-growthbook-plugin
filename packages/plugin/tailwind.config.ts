import type { Config } from 'tailwindcss'

const config: Config = {
	content: ['./src/ui/**/*.{ts,tsx}'],
	darkMode: 'class',
	plugins: [],
	theme: {
		extend: {
			colors: {
				override: {
					DEFAULT: '#f0883e',
					bg: 'rgba(240, 136, 62, 0.1)',
				},
				panel: {
					accent: 'var(--panel-accent)',
					bg: 'var(--panel-bg)',
					border: 'var(--panel-border)',
					surface: 'var(--panel-surface)',
					text: 'var(--panel-text)',
					'text-secondary': 'var(--panel-text-secondary)',
				},
				value: {
					boolean: '#d2a8ff',
					null: '#6a737d',
					number: '#79b8ff',
					object: '#e8b656',
					string: '#a8db8f',
				},
			},
		},
	},
}

export default config
