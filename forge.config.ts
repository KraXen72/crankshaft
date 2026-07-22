import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerAppImage } from "@reforged/maker-appimage";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { PublisherGitHub } from "@electron-forge/publisher-github"
import { MakerNSIS } from "./MakerNSIS.ts";
import { renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const VERSION = "44.0.0-nightly.20260522"

export default {
    packagerConfig: {
        name: "crankshaft",
        executableName: "crankshaft",
        appBundleId: "com.kraxen72.crankshaft",
        icon: "./build/icon",
        appCategoryType: "public.app-category.games",
        appCopyright: "",
        ignore: /^\/(?!(src|assets|node_modules|package\.json|README\.md|LICENSE))/,
        prune: true,
        // asar: true,
        download: {
            unsafelyDisableChecksums: true,
            mirrorOptions: {
                customDir: `v${VERSION}-patched-2`,
                mirror: "https://github.com/thegu5/electron/releases/download/",
                nightlyMirror: "https://github.com/thegu5/electron/releases/download/",
            }
        },
        protocols: [
            {
                name: "Crankshaft Comp Match Host",
                schemes: ["crankshaft"]
            }
        ]
    },
    outDir: "dist",
    
    makers: [
        new MakerAppImage({
            options: {
                bin: "crankshaft",
                categories: ["Game"],
                icon: "./build/icon.png",
                mimeType: ["x-scheme-handler/crankshaft"]
            },
            
        }),
        new MakerDMG({
            icon: "./build/icon.icns",
            iconSize: 128 // ?
        }),
        new MakerNSIS()
    ],
    hooks: {
        postPackage: async (config, { platform, outputPaths }) => {
            if (platform !== "linux") return;

            for (const buildPath of outputPaths) {
                const exeName = config.packagerConfig.executableName;
                const realBin = join(buildPath, `${exeName}.bin`);
                const wrapper = join(buildPath, exeName);

                renameSync(wrapper, realBin);

                writeFileSync(
                    wrapper,
                    `#!/bin/sh\nDIR="$(dirname "$(readlink -f "$0")")"\nexec "$DIR/${exeName}.bin" --ozone-platform=x11 "$@"\n`,
                    { mode: 0o755 }
                );
            }
        }
    },
    publishers: [
        new PublisherGitHub({
            repository: {
                owner: "KraXen72",
                name: "crankshaft",
            },
            draft: true,
            force: true,
            tagPrefix: ""
        })
    ]
} satisfies ForgeConfig
