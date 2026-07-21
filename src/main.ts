import { join as pathJoin, resolve as pathResolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, cpSync } from 'fs';
import { BrowserWindow, Menu, type MenuItem, type MenuItemConstructorOptions, app, clipboard, ipcMain, protocol, shell, screen, type BrowserWindowConstructorOptions } from 'electron';
import { aboutSubmenu, macAppMenuArr, csMenuTemplate, constructDevtoolsSubmenu } from './menu.ts';
import { applyCommandLineSwitches } from './switches.ts';
import RequestHandler from './requesthandler.ts';

const userData = pathJoin(app.getPath('userData'), 'config');
const docsPath = pathJoin(app.getPath('documents'), 'Crankshaft'); // pre 1.9.0 settings path
const configPath = userData;
const windowScale = 0.8; // In windowed mode, the window will cover 80% of the height/width of the screen.

let crankshaftUrlStartup: string | null = null;

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('crankshaft', process.execPath, [pathResolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('crankshaft');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const url = commandLine.find(arg => arg.startsWith('crankshaft://'));
    if (url && mainWindow) {
        mainWindow.webContents.send('process-startup-url', url);
    }
  });
}

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
	cpSync(docsPath, userData, { recursive: true });
	rmSync(docsPath, { recursive: true });
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
const cssPath = pathJoin(configPath, 'css');
const exampleCssPath = pathJoin(cssPath, 'example.css');

app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.0 Electron/12.0.0-nightly.20201116 Safari/537.36';

const settingsSkeleton = {
	fpsUncap: true,
	inProcessGPU: false,
	hideReCaptcha: true,
	menuTimer: false,
	quickClassPicker: false,
	fullscreen: 'windowed', // windowed, maximized, fullscreen, borderless
	resourceSwapper: true,
	cssSwapper: 'None',
	userscripts: false,
	clientSplash: true,
	immersiveSplash: false,
	discordRPC: false,
	extendedRPC: true,
	saveMatchResultJSONButton: false,
	logDebugToConsole: false,
	overrideURL: undefined as string | undefined,
	alwaysWaitForDevTools: false,
	safeFlags_disableBackgrounding: true,
	safeFlags_gpuRasterizing: false,
	experimentalFlags_increaseLimits: false,
	experimentalFlags_experimental: false,
	matchmaker: false,
	matchmakerKey: {
		shift: false,
		alt: false,
		ctrl: false,
		key: "F1"
	},
	matchmakerAcceptKey: {
		shift: false,
		alt: false,
		ctrl: false,
		key: "Enter"
	},
	matchmakerCancelKey: {
		shift: false,
		alt: false,
		ctrl: false,
		key: "Escape"
	},
	matchmaker_openServerWindow: true,
	matchmaker_regions: [] as string[],
	matchmaker_gamemodes: [] as string[],
	matchmaker_minPlayers: 1,
	matchmaker_maxPlayers: 6,
	matchmaker_minRemainingTime: 120,
	hideAds: 'block',
	customFilters: false,
	regionTimezones: false,
	immersiveSplashBackgroundColor: '#171717',
	loadingSplashTitleCardBackgroundColor: '#363636'
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
if (!existsSync(cssPath)) mkdirSync(cssPath);

if (!existsSync(exampleCssPath)) {
	writeFileSync(exampleCssPath,
		`/* This is an example of a css file that can be loaded by Crankshaft. */
/* Files in this directory automatically show up in the CSS Swapper setting's dropdown. */`);
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

ipcMain.on('logMainConsole', (_event, ...data) => { console.log(...data); });

// send usercript path to preload
ipcMain.on('initializeUserscripts', () => {
	mainWindow.webContents.send('main_initializes_userscripts', { userscriptsPath, userscriptPrefsPath: userscriptPreferencesPath }, import.meta.dirname);
});

// initial request of settings to populate the settingsUI
ipcMain.on('settingsUI_requests_userPrefs', () => {
	const paths = { settingsPath, swapperPath, cssPath, filtersPath, userscriptPreferencesPath, configPath, userscriptsPath };
	mainWindow.webContents.send('m_userPrefs_for_settingsUI', paths, userPrefs);
});

// preload requests the latest settings to feed into matchmaker. IPC is probably faster than an I/O read? not that it really matters.
ipcMain.on('matchmaker_requests_userPrefs', () => {
	mainWindow.webContents.send('matchmakerRedirect', userPrefs);
});

// settingsui is sending back updated settings (user changed the settings in ui) - writing new settings is already handled.
ipcMain.on('settingsUI_updates_userPrefs', (_event, data) => {
	Object.assign(userPrefs, data);
});

// allow perload opening links in default browser
ipcMain.on('openExternal', (_event, url: string) => { shell.openExternal(url); });

// allow exit client prompt to quit the entire electron process
ipcMain.on('closeClient', () => { app.exit(); });

const $assets = pathResolve(import.meta.dirname, '..', 'assets');

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

	const screenSize = screen.getPrimaryDisplay().size;

	crankshaftUrlStartup = process.argv.find(arg => arg.startsWith('crankshaft://')) || null;

	const mainWindowProps: BrowserWindowConstructorOptions = {
		show: false,
		width: screenSize.width * windowScale,
		height: screenSize.height * windowScale,
		center: true,
		webPreferences: {
			preload: pathJoin(import.meta.dirname, 'preload.ts'),
			spellcheck: false,
			nodeIntegration: false,
			// not ideal, but preload does a lot of interaction w/ the page
			// turning this on will also likely require transpiling the preload script to js
			contextIsolation: false,
			sandbox: false
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

		if (crankshaftUrlStartup) {
            mainWindow.webContents.send('process-startup-url', crankshaftUrlStartup);
			// resetting url
			crankshaftUrlStartup = null;
        }

		// tell preload to inject settingcss and splashcss + other
		mainWindow.webContents.send('injectClientCSS', userPrefs, app.getVersion(), cssPath);

		if (userPrefs.discordRPC) {
			import('@nyabsi/minimal-discord-rpc').then(DiscordRPC => {
				const rpc = new DiscordRPC.Client({ clientId: '988529967220523068' });
				const startTimestamp = new Date();

				function updateRPC({ details, state }: RPCargs) {
					const data: Parameters<typeof rpc.setActivity>[0] = {
						details,
						state,
						timestamps: { start: Math.floor(startTimestamp.getTime() / 1000) },
						assets: {
							large_image: 'logo',
							large_text: 'Playing Krunker'
						}
					};
					if (userPrefs.extendedRPC) {
						Object.assign(data, {
							buttons: [
								{ label: 'Github', url: 'https://github.com/KraXen72/crankshaft' },
								{ label: 'Discord Server', url: 'https://discord.gg/ZeVuxG7gQJ' }
							]
						});
					}
					rpc.setActivity(data).catch(console.error);
				}

				rpc.login().catch(console.error); // login to the RPC

				let initialized = false;
				rpc.on('ready', () => {
					if (initialized) return;
					initialized = true;
					mainWindow.webContents.send('initDiscordRPC'); // tell preload to init rpc
				});
				ipcMain.on('preload_updates_DiscordRPC', (_event, data: RPCargs) => { updateRPC(data); }); // whenever preload updates rpc, actually update it here
			});
		}
	});

	// only check for updates once
	mainWindow.once("ready-to-show", () => {
		mainWindow.webContents.send('checkForUpdates', app.getVersion());

		mainWindow.webContents.on('did-finish-load', () => mainWindow.webContents.send('main_did-finish-load', userPrefs));
	})

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
			{ label: 'Copy game link to clipboard', accelerator: 'F7', click: () => { clipboard.writeText(mainWindow.webContents.getURL()); } },
			{
				label: 'Join game link from clipboard',
				accelerator: 'CommandOrControl+F7',
				click: () => {
					const copiedText = clipboard.readText();
					if (copiedText.includes('krunker.io/?game')) mainWindow.webContents.loadURL(copiedText);
				}
			},
			{ type: 'separator' },
			...constructDevtoolsSubmenu(mainWindow, userPrefs.alwaysWaitForDevTools || null)
		]
	};

	if (process.platform !== 'darwin') csMenuTemplate.push({ label: 'About', submenu: aboutSubmenu });

	// the other submenus are defined in menu.ts
	const csMenu = Menu.buildFromTemplate([...macAppMenuArr, gameSubmenu, ...csMenuTemplate]);

	Menu.setApplicationMenu(csMenu);

	mainWindow.setMenu(csMenu);
	mainWindow.setAutoHideMenuBar(true);
	mainWindow.setMenuBarVisibility(false);

	mainWindow.webContents.setWindowOpenHandler(details => {
		const url = new URL(details.url)

		console.log('url trying to open:', url.toString());

		if (url.hostname.endsWith("krunker.io") && url.hostname !== "editor.krunker.io") {
			mainWindow.loadURL(url.toString());
			return { action: 'deny' };
		} else {
			shell.openExternal(url.toString())
			return { action: 'deny' };
		}
	})

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
