// crankshaft's build script. uses esbuild, which is a fast js build tool written in go.

const args = process.argv.filter(a => a.startsWith("--"))
const building = args.includes("--build")
console.log("building:", building)

require('esbuild').buildSync({
	// keep this manually in-sync!
	entryPoints: [
		'src/main.ts',
		'src/menu.ts',
		'src/preload.ts',
		'src/resourceswapper.ts',
		'src/settingsui.ts',
		'src/switches.ts',
		'src/userscripts.ts',
		'src/utils.ts',
	],
	bundle: false,
	minify: building,
	sourcemap: false,
	format: 'cjs',
	platform: 'node',
	target: "es2020", // electron 10.4.7 => chromium 85 => released in 2020
	banner: {
		js: "\"use strict\";"
	},
	outdir: 'app',
	tsconfig: 'tsconfig.json',
})