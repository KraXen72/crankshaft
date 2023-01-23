require('esbuild').buildSync({
	entryPoints: [
		'src/main.ts',
		'src/preload.ts',
		'src/resourceswapper.ts',
		'src/settingsui.ts',
		'src/utils.ts',
		'src/menu.ts',
		'src/userscripts.ts',
		'src/switches.ts',
	],
	bundle: false,
	format: 'cjs',
	minify: false,
	platform: 'node',
	target: "es2020",
	sourcemap: false,
	banner: {
		js: "\"use strict\";"
	},
	outdir: 'app',
	tsconfig: 'tsconfig.json',
})