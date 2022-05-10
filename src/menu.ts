import { shell, MenuItemConstructorOptions, MenuItem, app } from 'electron';

/// <reference path="global.d.ts" />

// Menu
/** submenu to replace the About screen */
export const aboutSubmenu = [
	{ label: 'Github repo', registerAccelerator: false, click: () => { shell.openExternal('https://github.com/KraXen72/crankshaft'); } },
	{ label: 'Client Discord', registerAccelerator: false, click: () => { shell.openExternal('https://discord.gg/ZeVuxG7gQJ'); } }
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
			{ role: 'toggleDevTools' },
			{ role: 'toggleDevTools', label: 'Toggle Developer Tools (F12)', accelerator: 'F12' },
			{ type: 'separator' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ role: 'resetZoom' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
		]
	}
];
