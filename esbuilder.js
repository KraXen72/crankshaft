// crankshaft's build script. uses esbuild, which is a fast js build tool written in go.
const esbuild = require('esbuild');
const fs = require('fs');

const args = process.argv.filter(a => a.startsWith("--"))
const building = args.includes("--build")
const watching = args.includes("--watch")
const syncDL = args.includes("--syncdl")
console.log("building(minifying):", building, "watching:", watching)

const buildLogger = {
	name: 'build-logger',
	setup(build) {
		build.onEnd(result => console.log(`build completed with ${result.errors.length} errors`))
	},
}

const buildOptions = {
	// keep this manually in-sync!
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

async function syncDownloadLinks() {
	const req = await fetch(`https://api.github.com/repos/KraXen72/crankshaft/releases`);
	const res = await req.json();
	const releases = res.filter(r => !(r.prerelease || r.draft))
	const latestStable = releases[0]
	const dlLinksByName = Object.fromEntries(latestStable.assets.map(asset => [asset.name, asset.browser_download_url]))
	
	// console.log(latestStable)
	const downloadMarkdown = `**Download:** [Windows (x64)](${dlLinksByName['crankshaft-setup-win-x64.exe']}) - [Mac (x64)](${dlLinksByName['crankshaft-portable-mac-x64.dmg']}) - [Linux (x86_64 AppImage)](${dlLinksByName['crankshaft-portable-linux-x86_64.AppImage']}) - [Linux (i386 AppImage)](${dlLinksByName['crankshaft-portable-linux-i386.AppImage']}) - [Other](${latestStable.html_url})  `
	// console.log(downloadMarkdown)

	const readmeLines = fs.readFileSync('./README.md', { encoding: 'utf-8' }).split("\n")
	for (let i = 0; i < readmeLines.length; i++) {
		if (!readmeLines[i].startsWith("**Download:** [Windows (x64)](")) continue;
		readmeLines[i] = downloadMarkdown
		break;
	}
	
	fs.writeFileSync('./README.md', readmeLines.join("\n"), { encoding: 'utf-8' })
	console.log("[updated readme with latest stable download links]")
}

if (syncDL) syncDownloadLinks()
	
if (watching) {
	watch({ plugins: [ buildLogger ] });
} else {
	esbuild.buildSync(buildOptions)
}
