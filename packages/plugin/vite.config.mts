import { rozenitePlugin } from '@rozenite/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
	base: './',
	build: {
		emptyOutDir: false,
		minify: true,
		outDir: './dist',
		reportCompressedSize: false,
		sourcemap: false,
	},
	plugins: [rozenitePlugin()],
	root: __dirname,
})
