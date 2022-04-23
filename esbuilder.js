require('esbuild').buildSync({
    entryPoints: ['src/main.ts', 'src/preload.ts', 'src/resourceswapper.ts', 'src/settingsui.ts', 'src/utils.ts'],
    bundle: false,
    format: 'cjs',
    minify: false,
    platform: 'node',
    target: "es2020",
    sourcemap: false,
    outdir: 'app',
    tsconfig: 'tsconfig.json',
  })