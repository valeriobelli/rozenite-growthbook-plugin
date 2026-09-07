import { createRequire } from 'node:module'

import { defineConfig } from 'vitest/config'

const requireFromHere = createRequire(import.meta.url)

export default defineConfig({
	test: {
		alias: {
			// @rozenite/agent-bridge ships CommonJS, so Node hands it the CommonJS
			// build of @rozenite/plugin-bridge while an ESM import gets the ESM one.
			// Two copies mean two React contexts, and the agent hooks then find no
			// channel from RozeniteChannelProvider. Pinning every importer to the
			// CommonJS build keeps one instance, and one context, in the test process.
			'@rozenite/plugin-bridge': requireFromHere.resolve('@rozenite/plugin-bridge'),
		},
		environment: 'happy-dom',
		include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
	},
})
