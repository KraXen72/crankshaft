import { shell, MenuItemConstructorOptions, MenuItem, app, BrowserWindow } from 'electron';
import { OpenDevToolsOptions } from 'electron/main';

/// <reference path="global.d.ts" />

// Menu
/** submenu to replace the About screen */
export const aboutSubmenu: MenuItemConstructorOptions[] = [
	{ label: 'Consider supporting development by donating <3', enabled: false },
	{ label: 'Donate: liberapay (recurring)', registerAccelerator: false, click: () => shell.openExternal('https://liberapay.com/KraXen72') },
	{ label: 'Donate: ko-fi (one time)', registerAccelerator: false, click: () => shell.openExternal('https://ko-fi.com/kraxen72') },
	{ type: 'separator' },
	{ label: 'Github repo', registerAccelerator: false, click: () => shell.openExternal('https://github.com/KraXen72/crankshaft') },
	{ label: 'Client Discord', registerAccelerator: false, click: () => shell.openExternal('https://discord.gg/ZeVuxG7gQJ') }
];

/** the menu with the app name on mac (array, to be spread) */
export const macAppMenuArr: (MenuItemConstructorOptions | MenuItem)[] = process.platform === 'darwin'
	? [ {
		label: app.name,
		submenu: [
			...aboutSubmenu,
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'services' },
			{ role: 'quit', registerAccelerator: false }
		]
	} ]
	: [];

/** submenu for social shortcuts */
export const genericMainSubmenu: (MenuItemConstructorOptions | MenuItem) = {
	label: 'Window',
	submenu: [
		{ label: 'Refresh', role: 'reload', accelerator: 'F5' }
	]
};

/** make 2 menuItems that determine wether to use fallback or not, and then act accordingly */
export function constructDevtoolsSubmenu(providedWindow: BrowserWindow, skipFallback: null | boolean = null, options?: OpenDevToolsOptions) {
	const maxLag = 500; // default timeout by asger-finding / Commander

	/** Fallback if openDevTools fails */
	function fallbackDevtools() {
		providedWindow.webContents.closeDevTools();

		const devtoolsWindow = new BrowserWindow();
		devtoolsWindow.setMenuBarVisibility(false);

		providedWindow.webContents.setDevToolsWebContents(devtoolsWindow.webContents);
		providedWindow.webContents.openDevTools({ mode: 'detach' });
		providedWindow.once('closed', () => devtoolsWindow.destroy());
	}

	/** test first time if should open fallback or not. then decide */
	function openDevToolsWithFallback() {
		/* eslint-disable no-param-reassign */
		if (skipFallback === true) {
			providedWindow.webContents.openDevTools(options);
		} else if (skipFallback === false) {
			fallbackDevtools();
		} else if (skipFallback === null) {
			providedWindow.webContents.openDevTools(options); // start opening devtools
			const popupDevtoolTimeout = setTimeout(() => { skipFallback = false; fallbackDevtools(); }, maxLag); // wait maxLag. if times out, always run fallback
			providedWindow.webContents.once('devtools-opened', () => { skipFallback = true; clearTimeout(popupDevtoolTimeout); }); // if opens devtools first, never run fallback
		}
		/* eslint-disable no-param-reassign */
	}

	// return 2 menuItems that can be spread and injected where needed
	return [
		{ label: 'Toggle Developer Tools', accelerator: 'CommandOrControl+Shift+I', click: () => { openDevToolsWithFallback(); } },
		{ label: 'Toggle Developer Tools (F12)', accelerator: 'F12', click: () => { openDevToolsWithFallback(); } }
	];
}

/** other submenus that all windows share. since mac relies on menu for system stuff like copying, i have to add it here */
export const csMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [
	{
		label: 'Edit',
		submenu: [
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ role: 'delete' },
			{ type: 'separator' },
			{ role: 'selectAll' }
		]
	},
	{
		label: 'Page',
		submenu: [
			{ role: 'reload' },
			{ role: 'forceReload' },
			{ type: 'separator' },
			{ type: 'separator' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ role: 'resetZoom' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
		]
	}
];
