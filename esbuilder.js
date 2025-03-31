// crankshaft's build script. uses esbuild, which is a fast js build tool written in go.
const esbuild = require("esbuild");
const fs = require("node:fs");

const args = process.argv.filter(a => a.startsWith("--"))
const building = args.includes("--build")
const watching = args.includes("--watch")
const metaFile = args.includes("--meta")
console.log("building(minifying):", building, "watching:", watching)

fs.rmSync("app/main.js", { force: true })
fs.rmSync("app/preload.js", { force: true })

/**
 * @type {import('esbuild').Plugin}
 */
const buildLogger = {
	name: 'build-logger',
	setup(build) {
		build.onEnd(result => console.log(`build completed with ${result.errors.length} errors`))
	},
}

/**
 * @type {import('esbuild').BuildOptions}
 */
const buildOptions = {
	// keep this manually in-sync!
	entryPoints: [
		'src/main.ts',
		'src/preload.ts'
	],
	bundle: true,
	minify: building,
	sourcemap: building ? false : "inline",
	metafile: metaFile,
	format: 'cjs',
	platform: 'node',
	target: ["node22", "chrome136"], // electron 12.2.3
	outdir: 'app',
	tsconfig: 'tsconfig.json',
	external: ["electron"]
}

/**
 * @param {import('esbuild').BuildOptions} extraOptions 
 */
async function watch(extraOptions) {
	const ctx = await esbuild.context({ ...buildOptions, ...extraOptions })
	await ctx.watch()
}

if (watching) {
	watch({ plugins: [ buildLogger ] })
} else {
	const result = esbuild.buildSync(buildOptions)
	if (metaFile) {
		fs.writeFileSync("metafile.json", JSON.stringify(result.metafile))
	}
}
