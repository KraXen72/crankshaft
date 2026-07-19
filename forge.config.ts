import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerAppImage } from "@reforged/maker-appimage";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { PublisherGitHub } from "@electron-forge/publisher-github"


export const VERSION = "44.0.0-nightly.20260522"

export default {
    packagerConfig: {
        name: "crankshaft",
        executableName: "crankshaft",
        appBundleId: "com.kraxen72.crankshaft",
        icon: "./build/icon",
        appCategoryType: "public.app-category.games",
        appCopyright: "",
        ignore: /^\/(?!(src|assets|build|node_modules|package\.json|README\.md|LICENSE))/,
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
        new MakerSquirrel({
            setupIcon: "./build/icon.ico",
            iconUrl: "https://raw.githubusercontent.com/KraXen72/crankshaft/refs/heads/master/build/icon.ico",
        })
    ],
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
