import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { resolve as pathResolve } from 'path';
import { ipcRenderer } from 'electron';
import { strippedConsole } from './preload';
import { userscriptToggleCSS } from './utils';
import { customSettingSavedJSONIsNotMalformed } from './userscriptvalidators';

/// <reference path="global.d.ts" />

/** sharedUserscriptData */
export const su = {
	userscriptsPath: '',
	userscriptTrackerPath: '',
	userscriptPrefsPath: '',
	userscripts: <IUserscriptInstance[]>[],
	userscriptTracker: <UserscriptTracker>{}
};

/** simple error message for usercripts. can be called from the userscript itself */
const errAlert = (err: Error, name: string) => {
	// eslint-disable-next-line no-alert
	alert(`Userscript '${name}' had an error:\n\n${err.toString()}\n\nPlease fix the error, disable the userscript in the 'tracker.json' file or delete it.\nFeel free to check console for stack trace`);
};

// this could be moved into the ipcRenderer eventlistener but i don't like the idea of a class existing only locally in that arrow function...
/** class for userscripts */
class Userscript implements IUserscriptInstance {

	name: string;

	fullpath: string;

	content: string;

	// parsed metadata, unload function and @run-at
	meta: UserscriptMeta | false;

	unload: Function | false;

	settings: { [key: string]: UserscriptRenderReadySetting };
	settingsPath: string;

	hasRan: boolean; // this is public so settings can just show a "reload page" message when needed

	#strictMode: boolean;

	runAt: ('document-start' | 'document-end') = 'document-end';

	constructor(props: IUserscript) {
		this.hasRan = false;
		this.#strictMode = false;

		this.name = props.name;
		this.fullpath = props.fullpath;

		this.meta = false;
		this.unload = false;

		this.settingsPath = props.settingsPath;

		this.content = readFileSync(this.fullpath, { encoding: 'utf-8' });
		if (this.content.startsWith('"use strict"')) this.#strictMode = true;
		if (this.content.includes('// ==UserScript==') && this.content.includes('// ==/UserScript==')) {
			// eslint-disable-next-line
			const metaParser = require('userscript-meta');

			let chunk: (string[] | string) = this.content.split('\n');
			chunk = (chunk.length === 1 ? [chunk] : chunk) as string[]; // ensure it's an array
			const startLine = chunk.findIndex(line => line.includes('// ==UserScript=='));
			const endLine = chunk.findIndex(line => line.includes('// ==/UserScript=='));

			if (startLine !== -1 && endLine !== -1) {
				chunk = chunk.slice(startLine, endLine + 1).join('\n');
				this.meta = metaParser.parse(chunk) as UserscriptMeta; // assume this.meta is not false when parsing

				/*
				 * if the metadata define some prop twice, the parser turns it into an array.
				 * we check if a value isArray and if yes, take the last item in that array as the new value
				 */

				for (const metaKey of Object.keys(this.meta) as Array<keyof UserscriptMeta>) {
					const meta = this.meta[metaKey];
					if (Array.isArray(meta)) this.meta[metaKey] = meta[meta.length - 1];
				}

				if ('run-at' in this.meta && this.meta['run-at'] === 'document.start') this.runAt = 'document-start';
			}
		}
	}

	/** runs the userscript */
	load() {
		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			const exported = new Function(this.content).apply({
				unload: false,
				settings: {},
				_console: strippedConsole,
				_css: userscriptToggleCSS
			});

			// userscript can return an object with unload and meta properties. use them if it did return
			if (typeof exported !== 'undefined') {
				// more stuff to be added here later
				if ('unload' in exported) this.unload = exported.unload;
				if ('settings' in exported) this.settings = exported.settings
			}

			// Apply custom settings if they exist
			if (Object.keys(this.settings).length > 0 && existsSync(this.settingsPath)) {
				try {
					var settingsJSON: {[key: string]: UserPrefValue} = JSON.parse(readFileSync(this.settingsPath, 'utf-8'));
					Object.keys(settingsJSON).forEach(settingKey => {
						if (customSettingSavedJSONIsNotMalformed(settingKey, this.settings, settingsJSON)) {
							this.settings[settingKey].changed(settingsJSON[settingKey])
						}
					})
				} catch (err) { // Preferences for script are probably corrupted.
				}
			}

			strippedConsole.log(`%c[cs]${this.#strictMode ? '%c[strict]' : '%c[non-strict]'} %cran %c'${this.name.toString()}' `,
				'color: lightblue; font-weight: bold;', this.#strictMode ? 'color: #62dd4f' : 'color: orange',
				'color: white;', 'color: lightgreen;');
		} catch (error) {
			errAlert(error, this.name);
			strippedConsole.error(error);
		}
	}

}

ipcRenderer.on('main_initializes_userscripts', (event, recieved_userscript_paths: { userscriptsPath: string, userscriptPrefsPath: string }) => {
	su.userscriptsPath = recieved_userscript_paths.userscriptsPath;
	su.userscriptTrackerPath = pathResolve(su.userscriptsPath, 'tracker.json');
	su.userscriptPrefsPath = recieved_userscript_paths.userscriptPrefsPath

	// init the userscripts (read, map and set up tracker)
	su.userscripts = readdirSync(su.userscriptsPath, { withFileTypes: true })
		.filter(entry => entry.name.endsWith('.js'))
		//                                               v this is so that each custom userscript option will have its own unique file name.  v
		.map(entry => new Userscript({ name: entry.name, settingsPath: pathResolve(su.userscriptPrefsPath, entry.name.replace(/.js$/, '.json')), fullpath: pathResolve(su.userscriptsPath, entry.name).toString() }));

	const tracker: UserscriptTracker = {};

	su.userscripts.forEach(u => { tracker[u.name] = false; }); // fill tracker with falses, so new userscripts get added disabled
	Object.assign(tracker, JSON.parse(readFileSync(su.userscriptTrackerPath, { encoding: 'utf-8' }))); // read and assign the tracker.json
	writeFileSync(su.userscriptTrackerPath, JSON.stringify(tracker, null, 2), { encoding: 'utf-8' }); // save with the new userscripts

	su.userscriptTracker = tracker;
	su.userscripts.forEach(u => {
		if (tracker[u.name]) {
			if (u.runAt === 'document-start') {
				u.load();
			} else {
				const callback = () => u.load();
				try { document.removeEventListener('DOMContentLoaded', callback); } catch (e) { }
				document.addEventListener('DOMContentLoaded', callback, { once: true });
			}
		}
	});
});
