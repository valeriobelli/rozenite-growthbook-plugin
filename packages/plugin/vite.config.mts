import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { rozenitePlugin } from '@rozenite/vite-plugin'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	base: './',
	build: {
		emptyOutDir: false,
		minify: true,
		outDir: './dist',
		reportCompressedSize: false,
		sourcemap: false,
	},
	plugins: [rozenitePlugin({ tailwind: true })],
	root: dirname,
})
