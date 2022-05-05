import { join as pathJoin, resolve as pathResolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions, app, clipboard, dialog, ipcMain, protocol, shell } from 'electron';
import { Swapper } from './resourceswapper';

// /<reference path="global.d.ts" />

// Credits / mentions (if not mentioned on github)

/*
 * Gato/creepycats - Gatoclient
 * LukeTheDuke - Gatoclient-lite
 * Mixaz and IDKR team - https://github.com/idkr-client/idkr
 * Giant - JANREX client
 * Tae - logo for the client <3
 */


const docsPath = app.getPath('documents');
const swapperPath = pathJoin(docsPath, 'Crankshaft/swapper');
const settingsPath = pathJoin(docsPath, 'Crankshaft/settings.json');
const userscriptsPath = pathJoin(docsPath, 'Crankshaft/scripts');
const userscriptTrackerPath = pathJoin(userscriptsPath, 'tracker.json');

app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Electron/10.4.7 Safari/537.36';

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
	'angle-backend': 'default',
	logDebugToConsole: false,
	safeFlags_removeUselessFeatures: false,
	safeFlags_helpfulFlags: false,
	safeFlags_gpuRasterizing: false,
	experimentalFlags_increaseLimits: false,
	experimentalFlags_lowLatency: false,
	experimentalFlags_experimental: false
};

if (!existsSync(swapperPath)) mkdirSync(swapperPath, { recursive: true });
if (!existsSync(userscriptsPath)) mkdirSync(userscriptsPath, { recursive: true });
if (!existsSync(userscriptTrackerPath)) writeFileSync(userscriptTrackerPath, '{}', { encoding: 'utf-8' });

// Before we can read the settings, we need to make sure they exist, if they don't, then we create a template
if (!existsSync(settingsPath)) writeFileSync(settingsPath, JSON.stringify(settingsSkeleton, null, 2), { encoding: 'utf-8', flag: 'wx' });


// Read settings to apply them to the command line arguments
const userPrefs = settingsSkeleton;
Object.assign(userPrefs, JSON.parse(readFileSync(settingsPath, { encoding: 'utf-8' })));

// Fullscreen Handler
let mainWindow: BrowserWindow;
let socialWindowReference: BrowserWindow;

// console log to electron console because krunker turns browser console off
ipcMain.on('logMainConsole', (event, data) => { console.log(data); });

// send settings to preload
ipcMain.on('settingsUI_requests_userPrefs', event => {
	mainWindow.webContents.send('main_sends_userPrefs', settingsPath, userPrefs);
});

// send usercript path to preload
ipcMain.on('preload_requests_userscriptPath', event => {
	mainWindow.webContents.send('main_sends_userscriptPath', userscriptsPath, __dirname);
});

// preload is sending back updated settings
ipcMain.on('settingsUI_updates_userPrefs', (event, data) => {
	Object.assign(userPrefs, data);

	// mainWindow.setFullScreen(userPrefs.fullscreen);
});

const $assets = pathResolve(__dirname, '..', 'assets');
const hideAdsCSS = readFileSync(pathJoin($assets, 'hideAds.css'), { encoding: 'utf-8' });

/** open a custom generic window with our menu, hidden */
function customGenericWin(url: string, providedMenuTemplate: (MenuItemConstructorOptions | MenuItem)[], addAdditionalSubmenus = true) {
	const genericWin = new BrowserWindow({
		autoHideMenuBar: true,
		show: false,
		width: 1600,
		height: 900,
		center: true,
		webPreferences: { spellcheck: false }
	});

	// add additional submenus to the generic win
	if (addAdditionalSubmenus && Array.isArray(providedMenuTemplate[0].submenu)) {
		providedMenuTemplate[0].submenu = [
			...providedMenuTemplate[0].submenu,
			{ label: 'Copy current url to clipboard', accelerator: 'F7', click: () => { clipboard.writeText(genericWin.webContents.getURL()); } },
			{ type: 'separator' },
			{
				label: 'Go to previous page (Go Back)',
				registerAccelerator: false,
				click: () => {
					if (genericWin.webContents.canGoBack()) genericWin.webContents.goBack();
				}
			},
			{
				label: 'Go to next page (Go Forward)',
				registerAccelerator: false,
				click: () => {
					if (genericWin.webContents.canGoForward()) genericWin.webContents.goForward();
				}
			}
		];
	}
	const thisMenu = Menu.buildFromTemplate(providedMenuTemplate);

	genericWin.setMenu(thisMenu);
	genericWin.setMenuBarVisibility(false);
	genericWin.loadURL(url);
	genericWin.once('ready-to-show', () => { // if hideAds is enabled, hide them. then show the window
		if (userPrefs.hideAds) genericWin.webContents.insertCSS(hideAdsCSS);
		genericWin.show();
	});
	if (userPrefs.hideAds) { // re-inject hide ads even when going back and forth in history
		genericWin.webContents.on('did-navigate', () => { genericWin.webContents.insertCSS(hideAdsCSS); });
	}
	genericWin.once('close', () => { genericWin.destroy(); });

	return genericWin;
}


if (userPrefs.safeFlags_removeUselessFeatures) {
	app.commandLine.appendSwitch('disable-breakpad'); // crash reporting
	app.commandLine.appendSwitch('disable-print-preview');
	app.commandLine.appendSwitch('disable-metrics-repo');
	app.commandLine.appendSwitch('disable-metrics');
	app.commandLine.appendSwitch('disable-2d-canvas-clip-aa');
	app.commandLine.appendSwitch('disable-bundled-ppapi-flash');
	app.commandLine.appendSwitch('disable-logging');
	app.commandLine.appendSwitch('disable-hang-monitor');

	console.log('Removed useless features');
}
if (userPrefs.safeFlags_helpfulFlags) {
	app.commandLine.appendSwitch('enable-javascript-harmony');
	app.commandLine.appendSwitch('enable-future-v8-vm-features');
	app.commandLine.appendSwitch('enable-webgl2-compute-context');

	console.log('Applied helpful flags');
}
if (userPrefs.experimentalFlags_increaseLimits) {
	app.commandLine.appendSwitch('renderer-process-limit', '100');
	app.commandLine.appendSwitch('max-active-webgl-contexts', '100');
	app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage=100');
	app.commandLine.appendSwitch('ignore-gpu-blacklist');

	console.log('Applied flags to increase limits');
}
if (userPrefs.experimentalFlags_lowLatency) {
	app.commandLine.appendSwitch('enable-highres-timer'); // supposedly lowers latency
	app.commandLine.appendSwitch('enable-quic'); // enables an experimental low-latency protocol that might or might not be used, who knows
	app.commandLine.appendSwitch('enable-accelerated-2d-canvas');

	console.log('Applied latency-reducing flags');
}
if (userPrefs.experimentalFlags_experimental) {
	// do they crash the game? not for me. do they actually help? ¯\_(ツ)_/¯
	app.commandLine.appendSwitch('disable-low-end-device-mode');
	app.commandLine.appendSwitch('high-dpi-support', '1');
	app.commandLine.appendSwitch('ignore-gpu-blacklist');
	app.commandLine.appendSwitch('no-pings');
	app.commandLine.appendSwitch('no-proxy-server');

	console.log('Enabled Experiments');
}
if (userPrefs.safeFlags_gpuRasterizing) {
	// do they crash the game? not for me. do they actually help? yeah kind of. depending on your gpu etc.
	app.commandLine.appendSwitch('enable-gpu-rasterization');
	app.commandLine.appendSwitch('disable-zero-copy'); // this is really important, otherwise the game crashes.
	console.log('GPU rasterization active');
}

if (userPrefs.fpsUncap) {
	app.commandLine.appendSwitch('disable-frame-rate-limit');
	app.commandLine.appendSwitch('disable-gpu-vsync');
	console.log('Removed FPS Cap');
}

if (userPrefs['angle-backend'] !== 'default') {
	if (userPrefs['angle-backend'] === 'vulkan') {
		app.commandLine.appendSwitch('use-angle', 'vulkan');
		app.commandLine.appendSwitch('use-vulkan');
		app.commandLine.appendSwitch('--enable-features=Vulkan');

		console.log('VULKAN INITIALIZED');
	} else {
		app.commandLine.appendSwitch('use-angle', userPrefs['angle-backend']);

		console.log(`Using Angle: ${ userPrefs['angle-backend']}`);
	}
}
if (userPrefs.inProcessGPU) {
	app.commandLine.appendSwitch('in-process-gpu');
	console.log('In Process GPU is active');
}

// Workaround for Electron 8.x
if (userPrefs.resourceSwapper) {
	protocol.registerSchemesAsPrivileged([ {
		scheme: 'krunker-resource-swapper',
		privileges: {
			secure: true,
			corsEnabled: true,
			bypassCSP: true
		}
	} ]);
}

// Listen for app to get ready
app.on('ready', () => {
	app.setAppUserModelId(process.execPath);

	if (userPrefs.resourceSwapper) protocol.registerFileProtocol('krunker-resource-swapper', (request, callback) => callback(decodeURI(request.url.replace(/krunker-resource-swapper:/, ''))));


	mainWindow = new BrowserWindow({
		show: false,
		width: 1600,
		height: 900,
		center: true,
		webPreferences: {
			preload: pathJoin(__dirname, 'preload.js'),
			spellcheck: false
		}
	});

	// general ready to show, runs when window refreshes or loads url
	mainWindow.on('ready-to-show', () => {
		mainWindow.show();
		mainWindow.webContents.send('injectClientCSS', userPrefs, app.getVersion()); // tell preload to inject settingcss and splashcss + other
	});
	if (userPrefs.fullscreen) mainWindow.setFullScreen(true);

	mainWindow.loadURL('https://krunker.io');

	if (userPrefs.logDebugToConsole) {
		console.log('GPU INFO BEGIN');
		app.getGPUInfo('complete').then(completeObj => {
			console.dir(completeObj);
		});

		console.log('GPU FEATURES BEGIN');
		console.dir(app.getGPUFeatureStatus());
	}

	/** submenu for in-game shortcuts */
	const gameSubmenu: (MenuItemConstructorOptions | MenuItem) = {
		label: 'Game',
		submenu: [
			{ label: 'Reload this game', accelerator: 'F5', click: () => { mainWindow.reload(); } },
			{ label: 'Find new Lobby', accelerator: 'F6', click: () => { mainWindow.loadURL('https://krunker.io'); } },
			{ label: 'Copy game link to clipboard', accelerator: 'F7', click: () => { clipboard.writeText(mainWindow.webContents.getURL()); } },
			{
				label: 'Join game link from clipboard',
				accelerator: 'CommandOrControl+F7',
				click: () => {
					const copiedText = clipboard.readText();
					if (copiedText.includes('https://krunker.io/?game')) mainWindow.webContents.loadURL(copiedText);
				}
			},
			{ label: 'Relaunch Client', accelerator: 'F10', click: () => { app.relaunch(); app.exit(); } }
		]
	};

	/** submenu for social shortcuts */
	const genericMainSubmenu: (MenuItemConstructorOptions | MenuItem) = {
		label: 'Window',
		submenu: [
			{ label: 'Refresh', role: 'reload', accelerator: 'F5' }
		]
	};

	/** other submenus that all windows share */
	const csMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [
		{
			label: 'System',
			submenu: [
				{ role: 'reload' },
				{ role: 'forceReload' },
				{ type: 'separator' },
				{ role: 'toggleDevTools' },
				{ role: 'toggleDevTools', label: 'Toggle Developer Tools (F12)', accelerator: 'F12' },
				{ type: 'separator' },
				{ role: 'zoomIn' },
				{ role: 'zoomOut' },
				{ role: 'resetZoom' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		},
		{
			label: 'About Crankshaft',
			submenu: [
				{ label: 'Github repo', registerAccelerator: false, click: () => { shell.openExternal('https://github.com/KraXen72/crankshaft'); } },
				{ label: 'Client Discord', registerAccelerator: false, click: () => { shell.openExternal('https://discord.gg/ZeVuxG7gQJ'); } }
			]
		}
	];
	const csMenu = Menu.buildFromTemplate([gameSubmenu, ...csMenuTemplate]);
	const strippedMenuTemplate = [genericMainSubmenu, ...csMenuTemplate];

	mainWindow.setMenu(csMenu);
	mainWindow.setAutoHideMenuBar(true);
	mainWindow.setMenuBarVisibility(false);

	mainWindow.webContents.on('new-window', (event, url) => {
		console.log('url trying to open: ', url);
		const freeSpinHostnames = ['youtube.com', 'twitch.tv', 'twitter.com', 'reddit.com', 'discord.com', 'accounts.google.com'];

		// sanity check, if social window is destroyed but the reference still exists
		if (typeof socialWindowReference !== 'undefined' && socialWindowReference.isDestroyed()) socialWindowReference = void 0;

		if (url.includes('https://krunker.io/social.html') && typeof socialWindowReference !== 'undefined') {
			socialWindowReference.loadURL(url); // if a designated socialWindow exists already, just load the url there
		} else if (freeSpinHostnames.some(fsUrl => url.includes(fsUrl))) {
			const pick = dialog.showMessageBoxSync({
				title: 'Opening a new url',
				noLink: false,
				message: `You're trying to open ${url}`,
				buttons: ['Open in default browser', 'Open as a new window in client', 'Open in this window', "Don't open"]
			});
			switch (pick) {
				case 0: // open in default browser
					event.preventDefault();
					shell.openExternal(url);
					break;
				case 3: // don't open
					event.preventDefault();
					break;
				case 2: // load as main window
					event.preventDefault();
					mainWindow.loadURL(url);
					break;
				case 1: // open as a new window in client
				default: {
					event.preventDefault();
					const genericWin = customGenericWin(url, strippedMenuTemplate);
					event.newGuest = genericWin;
					break;
				}
			}

			// for comp just load it into the main url
		} else if (url.includes('comp.krunker.io') || url.includes('https://krunker.io/?game') || (url.includes('?game=') && url.includes('&matchId='))) {
			event.preventDefault();
			mainWindow.loadURL(url);
		} else { // for any other link, fall back to creating a custom window with strippedMenu. 
			event.preventDefault();
			const genericWin = customGenericWin(url, strippedMenuTemplate);
			event.newGuest = genericWin;

			// if the window is social, create and assign a new socialWindow
			if (url.includes('https://krunker.io/social.html')) {
				socialWindowReference = genericWin;
				genericWin.on('close', () => { socialWindowReference = void 0; }); // remove reference once window is closed

				genericWin.webContents.on('will-navigate', (e, url) => { // new social pages will just replace the url in this one window
					if (url.includes('https://krunker.io/social.html')) {
						genericWin.loadURL(url);
					} else {
						e.preventDefault();
						shell.openExternal(url);
					}
				});
			}
		}

		/*
		 * console.log("url: ", url)
		 * console.log("typeof socialWindowReference", typeof socialWindowReference)
		 */
	});

	// mainWindow.webContents.on("will-navigate", (event: Event, url: string) => { console.log(url) })

	// Resource Swapper, thanks idkr
	if (userPrefs.resourceSwapper) {
		const CrankshaftSwapInstance = new Swapper(mainWindow, 'normal', swapperPath);
		CrankshaftSwapInstance.init();
	}

	// nice memory leak lmao
	mainWindow.on('close', () => { app.exit(); });
});

app.on('window-all-closed', () => { app.exit(); });
