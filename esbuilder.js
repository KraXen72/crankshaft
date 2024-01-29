// crankshaft's build script. uses esbuild, which is a fast js build tool written in go.
const esbuild = require('esbuild');

const args = process.argv.filter(a => a.startsWith("--"))
const building = args.includes("--build")
const watching = args.includes("--watch")
console.log("building(minifying):", building, "watching:", watching)

const buildLogger = {
	name: 'build-logger',
	setup(build) {
		build.onEnd(result => console.log(`build completed with ${result.errors.length} errors`))
	},
}

const buildOptions = {
	// keep this manually in-sync! THANKS FOR LETTING ME KNOW!
	entryPoints: [
		'src/main.ts',
		'src/menu.ts',
		'src/preload.ts',
		'src/requesthandler.ts',
		'src/settingsui.ts',
		'src/switches.ts',
		'src/userscripts.ts',
		'src/matchmaker.ts',
		'src/utils_node.ts',
		'src/utils.ts',
		'src/userscriptvalidators.ts'
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
	tsconfig: 'tsconfig.json'
}

async function watch(extraOptions) {
	const ctx = await esbuild.context(Object.assign(buildOptions, extraOptions))
	await ctx.watch()
}

if (watching) {
	watch({ plugins: [ buildLogger ] });
} else {
	esbuild.buildSync(buildOptions)
}
