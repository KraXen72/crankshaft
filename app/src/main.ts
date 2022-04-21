import * as path from 'path';
import * as fs from 'fs';
import 'v8-compile-cache'
import { shell, app, ipcMain, BrowserWindow, protocol, dialog, Menu, MenuItem, MenuItemConstructorOptions } from 'electron'
//@ts-ignore
import * as Swapper from './resourceswapper';

// Credits / mentions

// Gato/creepycats - Gatoclient
// LukeTheDuke - Gatoclient-lite
// Mixaz - IDKR source code, Mac, linux and win build action.yml
// Giant - JANREX client
// deadcell - css for setting description

let swapperPath = path.join(app.getPath("documents"), "Crankshaft/swapper");
let settingsPath = path.join(app.getPath("documents"), "Crankshaft/settings.json");
let userscriptPath = path.join(app.getPath("documents"), "Crankshaft/scripts")
let userscriptPathTracker = path.resolve(userscriptPath, "tracker.json")

const settingsSkeleton = {
    fpsUncap: true,
    inProcessGPU: false,
    disableAccelerated2D: false,
    hideAds: true,
    fullscreen: false,
    resourceSwapper: true,
    userscripts: false,
    clientSplash: true,
    // skyColor: false,
    // skyColorValue: "#ff0000",
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
if (!fs.existsSync(userscriptPath)) { fs.mkdirSync(userscriptPath, { recursive: true }); };
if (!fs.existsSync(userscriptPathTracker)) { fs.writeFileSync(userscriptPathTracker, "{}", {encoding: "utf-8"}) }

// Before we can read the settings, we need to make sure they exist, if they don't, then we create a template
if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(settingsSkeleton, null, 2), { encoding: "utf-8", flag: 'wx' });
}

// Read settings to apply them to the command line arguments
let userPrefs = JSON.parse(fs.readFileSync(settingsPath, {encoding: "utf-8"}));

// Fullscreen Handler
let mainWindowIsFullscreen = false;
let mainWindow: BrowserWindow

// console log to electron console because krunker turns browser console off
ipcMain.on('logMainConsole', (event, data) => { console.log(data); });

//send settings to preload
ipcMain.on('preloadNeedSettings', (event) => {
    mainWindow.webContents.send('preloadSettings', settingsPath, userPrefs.hideAds, app.getVersion(), __dirname);
});

//send usercript path to preload
ipcMain.on("preloadNeedsUserscriptPath", (event) => {
    mainWindow.webContents.send('preloadUserscriptPath', userscriptPath, __dirname);
})

//preload is sending back updated settings
ipcMain.on("preloadSendsNewSettings", (event, data) => {
    Object.assign(userPrefs, data)
    //TODO reapply settings

    if (userPrefs.fullscreen) {
        mainWindow.setFullScreen(true);
        mainWindowIsFullscreen = true;
    }
})

/** open a custom generic window with our menu, hidden */
function customGenericWin(url: string, providedMenu: Menu) {
    const genericWin = new BrowserWindow({
        autoHideMenuBar: true,
        show: false,
        width: 1600,
        height: 900,
        center: true
    })
    genericWin.setMenu(providedMenu)
    genericWin.setMenuBarVisibility(false)
    genericWin.loadURL(url)
    genericWin.once('ready-to-show', () => { genericWin.show(); });
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
        scheme: "crankshaft-swap",
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
        protocol.registerFileProtocol("crankshaft-swap", (request, callback) => callback(decodeURI(request.url.replace(/crankshaft-swap:/, ""))));
    }

    mainWindow = new BrowserWindow({
        show: false,
        width: 1830,
        height: 1000,
        center: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    //general ready to show, runs when window refreshes or loads url
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        mainWindow.webContents.send('injectClientCss', userPrefs.clientSplash, userPrefs.hideAds, userPrefs.userscripts, app.getVersion());
    });
    if (userPrefs.fullscreen) {
        mainWindow.setFullScreen(true);
        mainWindowIsFullscreen = true;
    }
    //mainWindow.removeMenu();
    mainWindow.loadURL('https://krunker.io');

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
                { label: "Relaunch Client", accelerator: "F12", click: () => { app.relaunch(); app.exit(); }},
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
        label: "About Crankshaft",
        submenu: [
            { label: "Refresh", role: "reload", accelerator: "F5"},
            { label: "Github repo", registerAccelerator: false, click: () => {shell.openExternal(`https://github.com/KraXen72/crankshaft`)}},
            { label: "Client Discord", registerAccelerator: false, click: () => {shell.openExternal(`https://discord.gg/ZeVuxG7gQJ`)}}
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
        if (url.includes('https://krunker.io/social.html')) {
            event.preventDefault()

            const socialWindow = new BrowserWindow({
                autoHideMenuBar: true,
                show: false,
                width: 1600,
                height: 900,
                center: true,
                //@ts-ignore
                preload: "./socialPreload.js"
            });
            socialWindow.setMenu(strippedMenu);
            socialWindow.setMenuBarVisibility(false)
            socialWindow.loadURL("https://krunker.io/social.html")
            socialWindow.once('ready-to-show', () => { socialWindow.show() })
            event.newGuest = socialWindow
            // handle social page url switching
            socialWindow.webContents.on('will-navigate', (e, url) => {
                if (url.includes('https://krunker.io/social.html')) {
                    socialWindow.loadURL(url);
                } else {
                    e.preventDefault()
                    shell.openExternal(url)
                } 
            })
            //fully destroy the window once it's closed instead of previous implementation where it just stayed hidden
            socialWindow.once('closed', () => { socialWindow.destroy() })
        } else if (freeSpinHostnames.some(fsUrl => url.includes(fsUrl))) {
            let pick = dialog.showMessageBoxSync({
                title: "Opening new url",
                noLink: true,
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
                    customGenericWin(url, strippedMenu)
                    break;
            }
            //for comp just load it into the main url
        } else if (url.includes("comp.krunker.io")) {
            event.preventDefault()
            mainWindow.loadURL(url)
        } else { //i guess we have to open custom windows for that or so
            event.preventDefault()
            customGenericWin(url, strippedMenu)
        }
    })

    // Resource Swapper
    if (userPrefs.resourceSwapper) {
        const CrankshaftSwapInstance = new Swapper(mainWindow, "normal", swapperPath)
        CrankshaftSwapInstance.init();
    }

    //nice memory leak lmao
    mainWindow.on('close', function () { app.exit() })
});

app.on('window-all-closed', () => { app.exit() })