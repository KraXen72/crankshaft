import * as path from 'path';
import * as fs from 'fs';
import { shell, app, ipcMain, BrowserWindow, protocol, dialog, Menu, MenuItem, MenuItemConstructorOptions } from 'electron'
import { Swapper } from './resourceswapper';
///<reference path="global.d.ts" />

// Credits / mentions

// Gato/creepycats - Gatoclient
// LukeTheDuke - Gatoclient-lite
// Mixaz and IDKR team - https://github.com/idkr-client/idkr
// Giant - JANREX client
// deadcell - css for setting description
// Tae - logo for the client

let swapperPath = path.join(app.getPath("documents"), "Crankshaft/swapper");
let settingsPath = path.join(app.getPath("documents"), "Crankshaft/settings.json");
let userscriptsPath = path.join(app.getPath("documents"), "Crankshaft/scripts")
let userscriptTrackerPath = path.resolve(userscriptsPath, "tracker.json")

app.userAgentFallback = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Electron/10.4.7 Safari/537.36`

const settingsSkeleton = {
    fpsUncap: true,
    inProcessGPU: false,
    disableAccelerated2D: false,
    hideAds: true,
    menuTimer: false,
    fullscreen: false,
    resourceSwapper: true,
    userscripts: false,
    clientSplash: true,
    "angle-backend": "default",
    logDebugToConsole: false,
    safeFlags_removeUselessFeatures: false,
    safeFlags_helpfulFlags: false,
    safeFlags_gpuRasterizing: false,
    experimentalFlags_increaseLimits: false,
    experimentalFlags_lowLatency: false,
    experimentalFlags_experimental: false
}

if (!fs.existsSync(swapperPath)) { fs.mkdirSync(swapperPath, { recursive: true }); };
if (!fs.existsSync(userscriptsPath)) { fs.mkdirSync(userscriptsPath, { recursive: true }); };
if (!fs.existsSync(userscriptTrackerPath)) { fs.writeFileSync(userscriptTrackerPath, "{}", {encoding: "utf-8"}) }

// Before we can read the settings, we need to make sure they exist, if they don't, then we create a template
if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(settingsSkeleton, null, 2), { encoding: "utf-8", flag: 'wx' });
}

// Read settings to apply them to the command line arguments
let userPrefs = settingsSkeleton
Object.assign(userPrefs, JSON.parse(fs.readFileSync(settingsPath, {encoding: "utf-8"})))

// Fullscreen Handler
let mainWindow: BrowserWindow
let socialWindowReference: BrowserWindow

// console log to electron console because krunker turns browser console off
ipcMain.on('logMainConsole', (event, data) => { console.log(data); });

//send settings to preload
ipcMain.on('settingsUI_requests_userPrefs', (event) => {
    mainWindow.webContents.send('main_sends_userPrefs', settingsPath, userPrefs);
});

//send usercript path to preload
ipcMain.on("preload_requests_userscriptPath", (event) => {
    mainWindow.webContents.send('main_sends_userscriptPath', userscriptsPath, __dirname);
})

//preload is sending back updated settings
ipcMain.on("settingsUI_updates_userPrefs", (event, data) => {
    Object.assign(userPrefs, data)

    //mainWindow.setFullScreen(userPrefs.fullscreen);
})

/** open a custom generic window with our menu, hidden */
function customGenericWin(url: string, providedMenu: Menu) {
    const genericWin = new BrowserWindow({
        autoHideMenuBar: true,
        show: false,
        width: 1600,
        height: 900,
        center: true,
        webPreferences: {
            spellcheck: false
        }
    })
    genericWin.setMenu(providedMenu)
    genericWin.setMenuBarVisibility(false)
    genericWin.loadURL(url)
    genericWin.once('ready-to-show', () => { genericWin.show(); });
    genericWin.once('close', () => { genericWin.destroy() })

    return genericWin
}


if (userPrefs.safeFlags_removeUselessFeatures) {
    //remove useless features
    app.commandLine.appendSwitch("disable-breakpad"); //crash reporting
    app.commandLine.appendSwitch("disable-print-preview");
    app.commandLine.appendSwitch('disable-metrics-repo')
    app.commandLine.appendSwitch('disable-metrics')
    app.commandLine.appendSwitch("disable-2d-canvas-clip-aa");
    app.commandLine.appendSwitch("disable-bundled-ppapi-flash");
    app.commandLine.appendSwitch("disable-logging");
    app.commandLine.appendSwitch('disable-hang-monitor')

    console.log("Removed useless features")
}
if (userPrefs.safeFlags_helpfulFlags) {
    //enable (potentially) helpful stuff
    app.commandLine.appendSwitch("enable-javascript-harmony");
    app.commandLine.appendSwitch("enable-future-v8-vm-features");
    app.commandLine.appendSwitch("enable-webgl2-compute-context");

    console.log("Applied helpful flags")
}
if (userPrefs.experimentalFlags_increaseLimits) {
    //increase limits
    app.commandLine.appendSwitch("renderer-process-limit", "100");
    app.commandLine.appendSwitch("max-active-webgl-contexts", "100");
    app.commandLine.appendSwitch("webrtc-max-cpu-consumption-percentage=100");
    app.commandLine.appendSwitch("ignore-gpu-blacklist");

    console.log("Applied flags to increase limits")
}
if (userPrefs.experimentalFlags_lowLatency) {
    //experimental low-latency flags by KraXen72
    app.commandLine.appendSwitch('enable-highres-timer') //supposedly lowers latency
    app.commandLine.appendSwitch('enable-quic') //enables an experimental low-latency protocol that might or might not be used, who knows
    app.commandLine.appendSwitch('enable-accelerated-2d-canvas');

    console.log("Applied latency-reducing flags")
}
if (userPrefs.experimentalFlags_experimental) {
    //experimental-er flags added by KraXen72
    //do they crash the game? not for me. do they actually help? ¯\_(ツ)_/¯
    app.commandLine.appendSwitch('disable-low-end-device-mode')
    app.commandLine.appendSwitch('high-dpi-support', "1")
    app.commandLine.appendSwitch('ignore-gpu-blacklist')
    app.commandLine.appendSwitch('no-pings')
    app.commandLine.appendSwitch('no-proxy-server')

    console.log('Enabled Experiments');
}
if (userPrefs.safeFlags_gpuRasterizing) {
    //gpu rasterization enabling by KraXen72
    // do they crash the game? not for me. do they actually help? yeah kind of. depending on your gpu etc.
    app.commandLine.appendSwitch("enable-gpu-rasterization")
    app.commandLine.appendSwitch("disable-zero-copy") //this is really important, otherwise the game crashes.
    console.log("GPU rasterization active")
}

if (userPrefs.fpsUncap) {
    app.commandLine.appendSwitch('disable-frame-rate-limit');
    app.commandLine.appendSwitch('disable-gpu-vsync');
    console.log('Removed FPS Cap');
}
if (userPrefs['angle-backend'] !== 'default') {
    if (userPrefs['angle-backend'] == 'vulkan') {
        app.commandLine.appendSwitch("use-angle", "vulkan");
        app.commandLine.appendSwitch("use-vulkan");
        app.commandLine.appendSwitch("--enable-features=Vulkan");

        console.log("VULKAN INITIALIZED")
    } else {
        app.commandLine.appendSwitch("use-angle", userPrefs['angle-backend']);

        console.log('Using Angle: ' + userPrefs['angle-backend']);
    }

}
if (userPrefs.inProcessGPU) {
    app.commandLine.appendSwitch("in-process-gpu");
    console.log('In Process GPU is active');
}

// Workaround for Electron 8.x
if (userPrefs.resourceSwapper) {
    protocol.registerSchemesAsPrivileged([{
        scheme: "krunker-resource-swapper",
        privileges: {
            secure: true,
            corsEnabled: true,
            bypassCSP: true
        }
    }]);
}

//Listen for app to get ready
app.on('ready', function () {
    app.setAppUserModelId(process.execPath);

    if (userPrefs.resourceSwapper) {
        protocol.registerFileProtocol("krunker-resource-swapper", (request, callback) => callback(decodeURI(request.url.replace(/krunker-resource-swapper:/, ""))));
    }

    mainWindow = new BrowserWindow({
        show: false,
        width: 1600,
        height: 900,
        center: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            spellcheck: false
        }
    });

    //general ready to show, runs when window refreshes or loads url
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        //TODO this is getting long, rewrite
        mainWindow.webContents.send('injectClientCSS', userPrefs.clientSplash, {hideAds: userPrefs.hideAds, menuTimer: userPrefs.menuTimer}, userPrefs.userscripts, app.getVersion());
    });
    if (userPrefs.fullscreen) {
        mainWindow.setFullScreen(true);
    }

    mainWindow.loadURL('https://krunker.io')

    if (userPrefs.logDebugToConsole) {
        console.log("GPU INFO BEGIN")
        app.getGPUInfo('complete').then(completeObj => {
            console.dir(completeObj);
        });

        console.log("GPU FEATURES BEGIN")
        console.dir(app.getGPUFeatureStatus());
    }

    const csMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [
        {
            label: "Crankshaft",
            submenu: [
                {label: "Reload this game", accelerator: "F5", click: () => {mainWindow.reload()}},
                { label: "Find new Lobby", accelerator: "F6", click: () => { mainWindow.loadURL('https://krunker.io'); } },
                { label: "Relaunch Client", accelerator: "F10", click: () => { app.relaunch(); app.exit(); }},
                { role: 'toggleDevTools', accelerator: "F12"},
                { type: 'separator' },
                { label: "Github repo", registerAccelerator: false, click: () => {shell.openExternal(`https://github.com/KraXen72/crankshaft`)}},
                { label: "Client Discord", registerAccelerator: false, click: () => {shell.openExternal(`https://discord.gg/ZeVuxG7gQJ`)}}
            ]
        },
        {
            label: "System",
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ]
    const strippedTemplate: (MenuItemConstructorOptions | MenuItem)[]  = [
        {
        label: "Crankshaft",
        submenu: [
            { label: "Refresh", role: "reload", accelerator: "F5"},
            { label: "Github repository", registerAccelerator: false, click: () => {shell.openExternal(`https://github.com/KraXen72/crankshaft`)}},
            { label: "Crankshaft Discord", registerAccelerator: false, click: () => {shell.openExternal(`https://discord.gg/ZeVuxG7gQJ`)}}
        ]
    }, csMenuTemplate[1] ]

    const csMenu = Menu.buildFromTemplate(csMenuTemplate)
    const strippedMenu = Menu.buildFromTemplate(strippedTemplate)
    mainWindow.setMenu(csMenu)
    mainWindow.setAutoHideMenuBar(true)
    mainWindow.setMenuBarVisibility(false)

    mainWindow.webContents.on('new-window', (event, url) => {
        console.log("url trying to open: ", url)
        const freeSpinHostnames = [
            "youtube.com",
            "twitch.tv",
            "twitter.com",
            "reddit.com",
            "discord.com",
            "accounts.google.com"
        ]
        if (url.includes('https://krunker.io/social.html') && typeof socialWindowReference !== "undefined") {
            socialWindowReference.loadURL(url) //if a designated socialWindow exists already, just load the url there
        } else if (freeSpinHostnames.some(fsUrl => url.includes(fsUrl))) {
            let pick = dialog.showMessageBoxSync({
                title: "Opening new url",
                noLink: false,
                message: `You're trying to open ${url}`,
                buttons: ["Open in default browser", "Open as a new window in client", "Open in this window", "Don't open"]
            })
            switch (pick) {
                case 0: //open in default browser
                    event.preventDefault()
                    shell.openExternal(url)
                    break;
                case 3: //don't open
                    event.preventDefault()
                    break;
                case 2: //load as main window
                    event.preventDefault()
                    mainWindow.loadURL(url)
                    break;
                case 1: //open as a new window in client
                default:
                    event.preventDefault()
                    const genericWin = customGenericWin(url, strippedMenu)
                    event.newGuest = genericWin
                    break;
            }
            //for comp just load it into the main url
        } else if (url.includes("comp.krunker.io") || url.includes("https://krunker.io/?game") || (url.includes("https://krunker.io/?game") && url.includes("&matchId="))) {
            event.preventDefault()
            mainWindow.loadURL(url)
        } else { //for any other link, fall back to creating a custom window with strippedMenu. 
            event.preventDefault()
            const genericWin = customGenericWin(url, strippedMenu)
            event.newGuest = genericWin
            
            // if the window is social, create and assign a new socialWindow
            if (url.includes('https://krunker.io/social.html')) { 
                socialWindowReference = genericWin
                genericWin.once('close', () => { socialWindowReference = void 0 }) //remove reference once window is closed

                genericWin.webContents.on('will-navigate', (e, url) => { //new social pages will just replace the url in this one window
                    if (url.includes('https://krunker.io/social.html')) {
                        genericWin.loadURL(url);
                    } else {
                        e.preventDefault()
                        shell.openExternal(url)
                    }
                })
            }
            
        }
    })

    // mainWindow.webContents.on("will-navigate", (event: Event, url: string) => {
    //     console.log(url)
    // })

    // Resource Swapper, thanks idkr
    if (userPrefs.resourceSwapper) {
        const CrankshaftSwapInstance = new Swapper(mainWindow, "normal", swapperPath)
        CrankshaftSwapInstance.init();
    }

    //nice memory leak lmao
    mainWindow.on('close', function () { app.exit() })
});

app.on('window-all-closed', () => { app.exit() })