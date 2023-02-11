import { join as pathJoin, resolve as pathResolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions, app, clipboard, dialog, ipcMain, protocol, shell, screen, BrowserWindowConstructorOptions } from 'electron';
import { aboutSubmenu, macAppMenuArr, genericMainSubmenu, csMenuTemplate, constructDevtoolsSubmenu } from './menu';
import { applyCommandLineSwitches } from './switches';
import Swapper from './resourceswapper';

/// <reference path="global.d.ts" />

// Credits / mentions (if not mentioned on github)
/*
 *	Gato/creepycats - Gatoclient
 *	LukeTheDuke - Gatoclient-lite
 *	Mixaz and IDKR team - https://github.com/idkr-client/idkr
 *	Giant - JANREX client
 *	Tae - logo for the client <3
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
	hideReCaptcha: true,
	menuTimer: false,
	fullscreen: 'windowed', // windowed, maximized, fullscreen, borderless
	resourceSwapper: true,
	userscripts: false,
	clientSplash: true,
	discordRPC: false,
	extendedRPC: false,
	'angle-backend': 'default',
	logDebugToConsole: false,
	alwaysWaitForDevTools: false,
	safeFlags_removeUselessFeatures: true,
	safeFlags_helpfulFlags: true,
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

// convert legacy settings files to newer formats
let modifiedSettings = false;

// fullscreen was a true/false, now it's "windowed", "fullscreen" or "borderless"
if (typeof userPrefs.fullscreen === 'boolean') {
	modifiedSettings = true;
	if (userPrefs.fullscreen === true) userPrefs.fullscreen = 'fullscreen'; else userPrefs.fullscreen = 'windowed';
}

// write the new settings format to the settings.json file right after the conversion
if (modifiedSettings) writeFileSync(settingsPath, JSON.stringify(userPrefs, null, 2), { encoding: 'utf-8' });


// Window definitions
/* eslint-disable init-declarations */
let mainWindow: BrowserWindow;
let socialWindowReference: BrowserWindow;
/* eslint-disable init-declarations */

// console log to electron console because krunker turns browser console off
ipcMain.on('logMainConsole', (event, data) => { console.log(data); });

// send settings to preload
ipcMain.on('settingsUI_requests_userPrefs', () => {
	mainWindow.webContents.send('main_sends_userPrefs', settingsPath, userPrefs);
});

// send usercript path to preload
ipcMain.on('preload_requests_userscriptPath', () => {
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
		webPreferences: {
			spellcheck: false,
			enableRemoteModule: false,
			nodeIntegration: false
		} as Electron.WebPreferences
	});

	// add additional submenus to the generic win
	const injectablePosition = process.platform === 'darwin' ? 1 : 0; // the position where we should inject our submenus
	const { submenu } = providedMenuTemplate[injectablePosition];

	if (addAdditionalSubmenus && Array.isArray(submenu)) {
		providedMenuTemplate[injectablePosition].submenu = submenu.concat([
			{ label: 'Copy current url to clipboard', accelerator: 'F7', click: () => { clipboard.writeText(genericWin.webContents.getURL()); } },
			{ label: 'Debug: Display original url', accelerator: 'CommandOrControl+F1', click: () => { dialog.showMessageBoxSync(genericWin, { message: url }); } },
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
			},
			{ type: 'separator' },
			...constructDevtoolsSubmenu(genericWin, userPrefs.alwaysWaitForDevTools || null)
		]);
	}


	const thisMenu = Menu.buildFromTemplate(providedMenuTemplate);

	genericWin.setMenu(thisMenu);
	genericWin.setMenuBarVisibility(false);
	genericWin.loadURL(url);

	// if hideAds is enabled, hide them. then show the window
	genericWin.once('ready-to-show', () => {
		if (userPrefs.hideAds) genericWin.webContents.insertCSS(hideAdsCSS);
		genericWin.show();
	});
	if (userPrefs.hideAds) {
		// re-inject hide ads even when going back and forth in history
		genericWin.webContents.on('did-navigate', () => { genericWin.webContents.insertCSS(hideAdsCSS); });
	}
	genericWin.once('close', () => { genericWin.destroy(); });

	return genericWin;
}

// apply settings and flags
applyCommandLineSwitches(userPrefs);

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

	if (userPrefs.resourceSwapper) protocol.registerFileProtocol('krunker-resource-swapper', (request, callback) => callback(decodeURI(request.url.replace(/krunker-resource-swapper:/u, ''))));

	const mainWindowProps: BrowserWindowConstructorOptions = {
		show: false,
		width: 1600,
		height: 900,
		center: true,
		webPreferences: {
			preload: pathJoin(__dirname, 'preload.js'),
			enableRemoteModule: false,
			spellcheck: false,
			nodeIntegration: false
		}
	};

	// userPrefs.fullscreen = maximized gets handled later
	switch (userPrefs.fullscreen) {
		case 'fullscreen':
			mainWindowProps.fullscreen = true;
			break;
		case 'borderless': {
			const dimensions = screen.getPrimaryDisplay().bounds;
			const borderlessProps: BrowserWindowConstructorOptions = {
				frame: false,
				kiosk: true,
				fullscreenable: false,
				fullscreen: false,
				width: dimensions.width,
				height: dimensions.height
			};

			Object.assign(mainWindowProps, borderlessProps);
			break;
		}
		case 'windowed':
		default:
			mainWindowProps.fullscreen = false;
			break;
	}

	mainWindow = new BrowserWindow(mainWindowProps);
	if (userPrefs.fullscreen === 'borderless') mainWindow.moveTop();


	// general ready to show, runs when window refreshes or loads url
	mainWindow.on('ready-to-show', () => {
		mainWindow.show();
		if (userPrefs.fullscreen === 'maximized') mainWindow.maximize();
		mainWindow.webContents.send('injectClientCSS', userPrefs, app.getVersion()); // tell preload to inject settingcss and splashcss + other
		mainWindow.webContents.on('did-finish-load', () => { mainWindow.webContents.send('main_did-finish-load'); });

		if (userPrefs.discordRPC) {
			// eslint-disable-next-line
			const DiscordRPC = require('discord-rpc');
			const rpc = new DiscordRPC.Client({ transport: 'ipc' });
			const startTimestamp = new Date();
			const clientId = '988529967220523068';

			// eslint-disable-next-line no-inner-declarations
			function updateRPC({ details, state }: RPCargs) {
				const data = {
					details,
					state,
					startTimestamp,
					largeImageKey: 'logo',
					largeImageText: 'Playing Krunker',
					instance: false
				};
				if (userPrefs.extendedRPC) {
					Object.assign(data, {
						buttons: [
							{ label: 'Github', url: 'https://github.com/KraXen72/crankshaft' },
							{ label: 'Discord Server', url: 'https://discord.gg/ZeVuxG7gQJ' }
						]
					});
				}
				rpc.setActivity(data);
			}

			rpc.login({ clientId }).catch(console.error); // login to the RPC
			mainWindow.webContents.send('initDiscordRPC'); // tell preload to init rpc
			ipcMain.on('preload_updates_DiscordRPC', (event, data: RPCargs) => { updateRPC(data); }); // whenever preload updates rpc, actually update it here
		}
	});

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
			{ label: 'Relaunch Client', accelerator: 'F10', click: () => { app.relaunch(); app.exit(); } },
			{ type: 'separator' },
			...constructDevtoolsSubmenu(mainWindow, userPrefs.alwaysWaitForDevTools || null)
		]
	};

	if (process.platform !== 'darwin') csMenuTemplate.push({ label: 'About', submenu: aboutSubmenu });

	// the other submenus are defined in menu.ts
	const csMenu = Menu.buildFromTemplate([...macAppMenuArr, gameSubmenu, ...csMenuTemplate]);
	const strippedMenuTemplate = [...macAppMenuArr, genericMainSubmenu, ...csMenuTemplate]; // don't forget to inject devtools in this

	Menu.setApplicationMenu(csMenu);

	mainWindow.setMenu(csMenu);
	mainWindow.setAutoHideMenuBar(true);
	mainWindow.setMenuBarVisibility(false);

	mainWindow.webContents.on('new-window', (event, url) => {
		console.log('url trying to open:', url, 'socialWindowReference:', typeof socialWindowReference);
		const freeSpinHostnames = ['youtube.com', 'twitch.tv', 'twitter.com', 'reddit.com', 'discord.com', 'accounts.google.com', 'instagram.com'];

		// sanity check, if social window is destroyed but the reference still exists
		// eslint-disable-next-line no-void
		if (typeof socialWindowReference !== 'undefined' && socialWindowReference.isDestroyed()) socialWindowReference = void 0;

		if (url.includes('https://krunker.io/social.html') && typeof socialWindowReference !== 'undefined') {
			event.preventDefault();
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
				case 2: // load as main window
					event.preventDefault();
					mainWindow.loadURL(url);
					break;
				case 3: // don't open
					event.preventDefault();
					break;
				case 1: // open as a new window in client
				default: {
					event.preventDefault();
					const genericWin = customGenericWin(url, strippedMenuTemplate);
					event.newGuest = genericWin;
					break;
				}
			}

			// for comp or hosted game just load it into the mainWindow
		} else if (url.includes('comp.krunker.io')
			|| url.startsWith('https://krunker.io/?game')
			|| url.startsWith('https://krunker.io/?play')
			|| (url.includes('?game=') && url.includes('&matchId='))
		) {
			event.preventDefault();
			mainWindow.loadURL(url);
		} else { // for any other link, fall back to creating a custom window with strippedMenu. 
			event.preventDefault();
			const genericWin = customGenericWin(url, strippedMenuTemplate);
			event.newGuest = genericWin;

			// if the window is social, create and assign a new socialWindow
			if (url.includes('https://krunker.io/social.html')) {
				socialWindowReference = genericWin;
				// eslint-disable-next-line no-void
				genericWin.on('close', () => { socialWindowReference = void 0; }); // remove reference once window is closed

				genericWin.webContents.on('will-navigate', (evt, willnavUrl) => { // new social pages will just replace the url in this one window
					if (willnavUrl.includes('https://krunker.io/social.html')) {
						genericWin.loadURL(willnavUrl);
					} else {
						evt.preventDefault();
						shell.openExternal(willnavUrl);
					}
				});
			}
		}
	});

	// mainWindow.webContents.on("will-navigate", (event: Event, url: string) => { console.log(url) })

	// Resource Swapper, thanks idkr
	if (userPrefs.resourceSwapper) {
		const CrankshaftSwapInstance = new Swapper(mainWindow, swapperPath);
		CrankshaftSwapInstance.start();
	}
});

/*
 * for the 2nd attempt at fixing the memory leak, i am just going to rely on standard electron lifecycle logic
 * when all windows close, the app should exit itself
 */
// eslint-disable-next-line consistent-return
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') return app.quit(); // don't quit on mac systems unless user explicitly quits
});
