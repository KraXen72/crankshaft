const electron = require('electron');
const path = require('path');
const fs = require('fs');
const { app, ipcMain, BrowserWindow, protocol, dialog } = electron;
require('v8-compile-cache');

// Gato/creepycats - Gatoclient
// Mixaz - IDKR source code (used so many fucking times)
// ando - Billboards, modding, etc
// Giant - JANREX client
// LukeTheDuke - Gatoclient-lite
// KraXen72 - fixes and settings rewrite, splash rewrite

let swapperPath = path.join(app.getPath("documents"), "GatoclientLite/swapper");
let settingsPath = path.join(app.getPath("documents"), "GatoclientLite/settings.json");
const settingsSkeleton = { 
    fpsUncap: true,  
    inProcessGPU: false, 
    disableAccelerated2D: false, 
    fullscreen: false, 
    resourceSwapper: true,
    clientSplash: true, 
    skyColor: false, 
    skyColorValue: "#ff0000", 
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

// Before we can read the settings, we need to make sure they exist, if they don't, then we create a template
if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(settingsSkeleton, null, 2), { encoding: "utf-8", flag: 'wx' });
}

// Read settings to apply them to the command line arguments
let userPrefs = JSON.parse(fs.readFileSync(settingsPath));

// Fullscreen Handler
let mainWindowIsFullscreen = false;
let /*splashWindow,*/ mainWindow, socialWindow

// inter process communication

// Give App Version to window
ipcMain.on('app_version', (event) => { event.sender.send('app_version', { version: app.getVersion() });});
ipcMain.on('logMainConsole', (event, data) => { console.log(data); });

//send settings to preload
ipcMain.on('preloadNeedSettings', (event) => {
    mainWindow.webContents.send('preloadSettings', path.join(app.getPath("documents"), "GatoclientLite/settings.json"), app.getVersion(), __dirname);
});

//if swapper works without this, we're golden => it does!
//app.commandLine.appendSwitch("disable-web-security");

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
    app.commandLine.appendSwitch("renderer-process-limit", 100);
    app.commandLine.appendSwitch("max-active-webgl-contexts", 100);
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
    app.commandLine.appendSwitch('high-dpi-support', 1)
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
        scheme: "gato-swap",
        privileges: {
            secure: true,
            corsEnabled: true,
            bypassCSP: true
        }
    }]);
}
// if (userPrefs.clientSplash) {
//     protocol.registerSchemesAsPrivileged([{
//         scheme: "crankshaft",
//         privileges: {
//             secure: true,
//             corsEnabled: true,
//             bypassCSP: true
//         }
//     }]);
// }

//Listen for app to get ready
app.on('ready', function () {

    if (userPrefs.resourceSwapper) {
        protocol.registerFileProtocol("gato-swap", (request, callback) => callback(decodeURI(request.url.replace(/gato-swap:/, ""))));
    }
    // if (userPrefs.clientSplash) {
    //     protocol.registerFileProtocol('crankshaft', (request, callback) => {
    //         const url = request.url.slice(7)
    //         callback({ path: path.normalize(`${__dirname}/${url}`) })
    //     })
    // }

    app.setAppUserModelId(process.execPath);
    
    mainWindow = new BrowserWindow({
        show: false,
        width: 1600,
        height: 900,
        center: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    //general ready to show, runs when window refreshes or loads url
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        mainWindow.webContents.send('injectClientCss', userPrefs.clientSplash, app.getVersion());
    });
    if (userPrefs.fullscreen) {
        mainWindow.setFullScreen(true);
        mainWindowIsFullscreen = true;
    }
    mainWindow.removeMenu();
    mainWindow.loadURL('https://krunker.io');

    if (userPrefs.logDebugToConsole) {
        console.log("GPU INFO BEGIN")
        app.getGPUInfo('complete').then(completeObj => {
                console.dir(completeObj);
        });
        
        console.log("GPU FEATURES BEGIN")
        console.dir(app.getGPUFeatureStatus());
    }
    
    socialWindow = new BrowserWindow({
        autoHideMenuBar: true,
        show: false,
        width: 1600,
        height: 900,
        center: true
    });
    socialWindow.removeMenu();

    // Add Shortcuts
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // Developer Console
        if (input.control && input.key.toLowerCase() === 'i') {
            event.preventDefault();
            mainWindow.webContents.openDevTools();
        }
        //these keys do some big action like reload the app or page, so they can be considered mutually exclusive, so we can use a switch
        switch (input.key) {
            case "F5": // F5 to Reload Lobby
                event.preventDefault();
                mainWindow.reload();
                break;
            case "F6": // F6 to Find New Lobby
                event.preventDefault();
                mainWindow.loadURL('https://krunker.io');
                break;
            case "F11": // F11 to fullscreen
                event.preventDefault();
                mainWindow.setFullScreen(!mainWindowIsFullscreen);
                mainWindowIsFullscreen = !mainWindowIsFullscreen;
                break;
            case "F12": // F12 to relaunch
                event.preventDefault();
                app.relaunch();
                app.exit();
                break;
            default:
                break;
        }
    })


    // Resource Swapper
    if (userPrefs.resourceSwapper) {
        const Swapper = require("./resourceswapper");
        const gatoSwapInstance = new Swapper(mainWindow, "normal", swapperPath)
        gatoSwapInstance.init();
    }

    // Handle opening social/editor page
    mainWindow.webContents.on("new-window", (event, url) => {
        // I hope this fixes the bug with the shitty Amazon Ad
        event.preventDefault();
        if (url.includes('https://krunker.io/social.html')) {
            socialWindow.loadURL(url);
            socialWindow.show();
        }
        else {
            require('electron').shell.openExternal(url);
        }
    });

    // Handle Social Page Switching
    socialWindow.webContents.on("new-window", (event, url) => {
       event.preventDefault();
       if (url.includes('https://krunker.io/social.html')) {
            socialWindow.loadURL(url);
       }
    });

    socialWindow.on("close", (event) => {
       event.preventDefault();
       console.log("SOCIAL CLOSED")
       socialWindow.loadURL("about:blank");
       socialWindow.hide();
    });
    
    //nice memory leak lmao
    mainWindow.on('close', function () { app.exit() });
});

app.on('window-all-closed', () => { app.exit() })