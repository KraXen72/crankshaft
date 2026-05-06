// crankshaft's build script. uses esbuild, which is a fast js build tool written in go.
import * as esbuild from "esbuild";
import type { BuildOptions, Plugin } from "esbuild";
import * as fs from "fs";

const args = process.argv.filter(a => a.startsWith("--"))
const building = args.includes("--build")
const watching = args.includes("--watch")
const metaFile = args.includes("--meta")
console.log("building(minifying):", building, "watching:", watching)

fs.rmSync("app/main.js", { force: true });
fs.rmSync("app/preload.js", { force: true });
fs.rmSync("app/socialpreload.js", { force: true });

const buildLogger: Plugin = {
	name: 'build-logger',
	setup(build) {
		build.onEnd(result => console.log(`build completed with ${result.errors.length} errors`))
	},
}

const buildOptions: BuildOptions = {
	// keep this manually in-sync!
	entryPoints: [
		'src/main.ts',
		'src/preload.ts',
		'src/socialpreload.ts'
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

async function watch(extraOptions: BuildOptions) {
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
