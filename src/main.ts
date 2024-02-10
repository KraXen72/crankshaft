import { join as pathJoin, resolve as pathResolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { moveFolderSync } from './utils_node';
import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions, app, clipboard, dialog, ipcMain, protocol, shell, screen, BrowserWindowConstructorOptions } from 'electron';
import { aboutSubmenu, macAppMenuArr, genericMainSubmenu, csMenuTemplate, constructDevtoolsSubmenu } from './menu';
import { applyCommandLineSwitches } from './switches';
import RequestHandler from './requesthandler';

/// <reference path="global.d.ts" />

const userData = pathJoin(app.getPath('userData'), 'config');
const docsPath = pathJoin(app.getPath('documents'), 'Crankshaft'); // pre 1.9.0 settings path
const configPath = userData;

/*
 * TODO make crankshaft server announcement about backup
 * TODO mention minor breaking change in changelog & mention backup
 */
function migrateSettings() {
	if (existsSync(pathJoin(docsPath, 'settings moved.txt')) || readdirSync(docsPath).length === 0) return;
	if (!existsSync(userData)) mkdirSync(userData);

	console.log(`Migrating old settings to new path ${userData}`);
	if (existsSync(userData) && readdirSync(userData).length !== 0) {
		const error = new Error(`Cannot migrate settings!\n
		From (old folder): ${docsPath}
		To (new folder): ${userData}

		There are files in both directories!
		Make sure your actual settings, swapper & scripts are in the new folder & delete stuff from the old one.
		
		Crankshaft v${app.getVersion()} no longer supports settings in Documents due to inconsistent permissions.
		
		Restart crankshaft afterwards.`);
		error.stack = null;
		throw error;
	}
	moveFolderSync(docsPath, userData);
	if (!existsSync(docsPath)) mkdirSync(docsPath);
	writeFileSync(pathJoin(docsPath, 'settings moved.txt'),
		`Starting from crankshaft v1.9.0, the configuration directory is no longer '${docsPath}'.\n
Settings, userscripts and swapper have been moved to '${userData}'.\n
You can verify that they are indeed there, and then safely delete this directory.`);
}

if (existsSync(docsPath)) migrateSettings();

const swapperPath = pathJoin(configPath, 'swapper');
const settingsPath = pathJoin(configPath, 'settings.json');
const userscriptPreferencesPath = pathJoin(configPath, '/userscriptsettings');
const filtersPath = pathJoin(configPath, 'filters.txt');
const userscriptsPath = pathJoin(configPath, 'scripts');
const userscriptTrackerPath = pathJoin(userscriptsPath, 'tracker.json');

app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Electron/10.4.7 Safari/537.36';

const settingsSkeleton = {
	fpsUncap: true,
	inProcessGPU: false,
	disableAccelerated2D: false,
	hideReCaptcha: true,
	menuTimer: false,
	quickClassPicker: false,
	fullscreen: 'windowed', // windowed, maximized, fullscreen, borderless
	resourceSwapper: true,
	userscripts: false,
	clientSplash: true,
	discordRPC: false,
	extendedRPC: true,
	'angle-backend': 'default',
	logDebugToConsole: false,
	alwaysWaitForDevTools: false,
	safeFlags_removeUselessFeatures: true,
	safeFlags_helpfulFlags: true,
	safeFlags_gpuRasterizing: false,
	experimentalFlags_increaseLimits: false,
	experimentalFlags_lowLatency: false,
	experimentalFlags_experimental: false,
	matchmaker: false,
	matchmaker_F6: false,
	matchmaker_regions: [] as string[],
	matchmaker_gamemodes: [] as string[],
	matchmaker_minPlayers: 1,
	matchmaker_maxPlayers: 6,
	matchmaker_minRemainingTime: 120,
	hideAds: 'hide',
	customFilters: false,
	regionTimezones: false
};

const userPrefs = settingsSkeleton;

if (!existsSync(configPath)) mkdirSync(configPath, { recursive: true });
if (!existsSync(settingsPath)) writeFileSync(settingsPath, JSON.stringify(settingsSkeleton, null, 2), { encoding: 'utf-8', flag: 'wx' });

if (!existsSync(userscriptPreferencesPath)) mkdirSync(userscriptPreferencesPath, { recursive: true });
if (!existsSync(swapperPath)) mkdirSync(swapperPath, { recursive: true });
if (!existsSync(userscriptsPath)) mkdirSync(userscriptsPath, { recursive: true });
if (!existsSync(userscriptTrackerPath)) writeFileSync(userscriptTrackerPath, '{}', { encoding: 'utf-8' });
if (!existsSync(filtersPath)) {
	writeFileSync(filtersPath,
		`# Welcome to the filters file! Filters follow the URL pattern format:
# https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
# Hashtags are used for comments, and each line is a new filter.
# Here's an example of a filter that blocks the cosmetic bundle popup audio:
# *://assets.krunker.io/sound/bundle_*.mp3*
`);
}

Object.assign(userPrefs, JSON.parse(readFileSync(settingsPath, { encoding: 'utf-8' })));


// convert legacy settings files to newer formats
let modifiedSettings = false;

// initially, fullscreen was a true/false, now it's "windowed", "fullscreen" or "borderless"
if (typeof userPrefs.fullscreen === 'boolean') {
	modifiedSettings = true;
	if (userPrefs.fullscreen === true) userPrefs.fullscreen = 'fullscreen'; else userPrefs.fullscreen = 'windowed';
}

// initially, hideAds was a true/false, now it's "block", "hide" or "off"
if (typeof userPrefs.hideAds === 'boolean') {
	modifiedSettings = true;
	if (userPrefs.hideAds === true) userPrefs.hideAds = 'hide'; else userPrefs.hideAds = 'off';
}

// write the new settings format to the settings.json file right after the conversion
if (modifiedSettings) writeFileSync(settingsPath, JSON.stringify(userPrefs, null, 2), { encoding: 'utf-8' });

let mainWindow: BrowserWindow;
let socialWindowReference: BrowserWindow;

ipcMain.on('logMainConsole', (event, data) => { console.log(data); });

// send usercript path to preload
ipcMain.on('initializeUserscripts', () => {
	mainWindow.webContents.send('main_initializes_userscripts', { userscriptsPath, userscriptPrefsPath: userscriptPreferencesPath }, __dirname);
});

// initial request of settings to populate the settingsUI
ipcMain.on('settingsUI_requests_userPrefs', () => {
	const paths = { settingsPath, swapperPath, filtersPath, userscriptPreferencesPath, configPath, userscriptsPath };
	mainWindow.webContents.send('m_userPrefs_for_settingsUI', paths, userPrefs);
});

// preload requests the latest settings to feed into matchmaker. IPC is probably faster than an I/O read? not that it really matters.
ipcMain.on('matchmaker_requests_userPrefs', () => {
	mainWindow.webContents.send('matchmakerRedirect', userPrefs);
});

// settingsui is sending back updated settings (user changed the settings in ui) - writing new settings is already handled.
ipcMain.on('settingsUI_updates_userPrefs', (event, data) => {
	Object.assign(userPrefs, data);
});

// allow perload opening links in default browser
ipcMain.on('openExternal', (event, url: string) => { shell.openExternal(url); });

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
		} satisfies Electron.WebPreferences
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
		if (userPrefs.hideAds === 'hide' || userPrefs.hideAds === 'block') genericWin.webContents.insertCSS(hideAdsCSS);
		genericWin.show();
	});
	if (userPrefs.hideAds === 'hide' || userPrefs.hideAds === 'block') {
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
		},
		backgroundColor: '#000000'
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
		if (userPrefs.fullscreen === 'maximized' && !mainWindow.isMaximized()) mainWindow.maximize();
		if (!mainWindow.isVisible()) mainWindow.show();

		if (mainWindow.webContents.getURL().endsWith('dummy.html')) { mainWindow.loadURL('https://krunker.io'); return; }

		mainWindow.webContents.send('injectClientCSS', userPrefs, app.getVersion()); // tell preload to inject settingcss and splashcss + other

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
					instance: true
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

	// only runs on client start
	mainWindow.once('ready-to-show', () => {
		mainWindow.webContents.send('checkForUpdates', app.getVersion());
		mainWindow.webContents.on('did-finish-load', () => mainWindow.webContents.send('main_did-finish-load', userPrefs));
	});

	mainWindow.loadFile(pathJoin($assets, 'dummy.html'));

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
			{
				label: 'Find new Lobby',
				accelerator: 'F6',
				click: () => {
					if (userPrefs.matchmaker && userPrefs.matchmaker_F6) mainWindow.webContents.send('matchmakerRedirect', userPrefs);
					else mainWindow.loadURL('https://krunker.io');
				}
			},
			{ label: 'Copy game link to clipboard', accelerator: 'F7', click: () => { clipboard.writeText(mainWindow.webContents.getURL()); } },
			{
				label: 'Join game link from clipboard',
				accelerator: 'CommandOrControl+F7',
				click: () => {
					const copiedText = clipboard.readText();
					if (copiedText.includes('https://krunker.io/?game')) mainWindow.webContents.loadURL(copiedText);
				}
			},
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
		const freeSpinHostnames = ['youtube.com', 'twitch.tv', 'twitter.com', 'reddit.com', 'discord.com', 'accounts.google.com', 'instagram.com', 'github.com'];

		// sanity check, if social window is destroyed but the reference still exists
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
			console.log(`genericWindow created for ${url}`, socialWindowReference);
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

	// console.log(readFileSync(pathJoin($assets, 'blockFilters.txt'), { encoding: 'utf-8' }));

	if (userPrefs.resourceSwapper || userPrefs.hideAds === 'block') {
		const CrankshaftFilterHandlerInstance = new RequestHandler(mainWindow,
			swapperPath,
			userPrefs.resourceSwapper,
			userPrefs.hideAds === 'block',
			userPrefs.customFilters,
			readFileSync(pathJoin($assets, 'blockFilters.txt')).toString(),
			filtersPath);
		CrankshaftFilterHandlerInstance.start();
	}
});

// for the 2nd attempt at fixing the memory leak, i am just going to rely on standard electron lifecycle logic - when all windows close, the app should exit itself
// eslint-disable-next-line consistent-return
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') return app.quit(); // don't quit on mac systems unless user explicitly quits
});
