import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve as pathResolve } from 'path';
import { ipcRenderer } from 'electron';
import { strippedConsole } from './preload';
import { userscriptToggleCSS } from './utils';

/** sharedUserscriptData */
export const su = {
	userscriptsPath: '',
	userscriptTrackerPath: '',
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

	// stuff we are initialized with
	name: string;

	fullpath: string;

	content?: string;

	// parsed metadata, unload function and @run-at
	meta: UserscriptMeta | false;

	unload: Function | false;

	hasRan: boolean; // this is public so settings can just show a "reload page" message when needed

	#strictMode: boolean;

	#initialized: boolean;

	runAt: ('document-start' | 'document-end') = 'document-end';

	constructor(props: IUserscript) {
		this.hasRan = false;
		this.#initialized = false;
		this.#strictMode = false;

		this.name = props.name;
		this.fullpath = props.fullpath;

		this.meta = false;
		this.unload = false;

		this.content = readFileSync(this.fullpath, { encoding: 'utf-8' });
		if (this.content.includes('// ==UserScript==') && this.content.includes('// ==/UserScript==')) {
			// eslint-disable-next-line
			const metaParser = require('userscript-meta');

			let chunk: (string[] | string) = this.content.split('\n');
			chunk = (chunk.length === 1 ? [chunk] : chunk) as string[]; // ensure it's an array
			const startLine = chunk.findIndex(line => line.includes('// ==UserScript=='));
			const endLine = chunk.findIndex(line => line.includes('// ==/UserScript=='));

			if (startLine === -1 && endLine !== -1) {
				chunk = chunk.slice(startLine, endLine + 1).join('\n');
				this.meta = metaParser.parse(chunk) as UserscriptMeta; // assume this.meta is not false when parsing

				/*
				 * if the metadata define some prop twice, the parser turns it into an array.
				 * we check if a value isArray and if yes, take the last item in that array as the new value
				 */

				let metaKey: keyof UserscriptMeta;

				// @ts-ignore
				for (metaKey of Object.keys(this.meta)) {
					const m = this.meta[metaKey];
					if (Array.isArray(m)) this.meta[metaKey] = m[m.length - 1];
				}

				if ('run-at' in this.meta && this.meta['run-at'] === 'document.start') this.runAt = 'document-start';
			}
		}
	}

	/** determine if script is in strictmode or no */
	#init() {
		if (this.content.startsWith('"use strict"')) this.#strictMode = true;
		this.#initialized = true;

		return this.content;
	}

	/** return ready-to-run content */
	get #content() {
		if (this.#initialized) return this.content; return this.#init();
	}

	/** runs the userscript */
	load() {
		// eslint-disable-next-line no-new-wrappers
		const code = String(this.#content);

		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			const exported = new Function(code).apply({
				unload: false,
				_console: strippedConsole,
				_css: userscriptToggleCSS
			});

			// userscript can return an object with unload and meta properties. use them if it did return
			if (typeof exported !== 'undefined') {
				// more stuff to be added here later
				if ('unload' in exported) this.unload = exported.unload;
			}

			strippedConsole.log(`%c[cs]${this.#strictMode ? '%c[non-strict]' : '%c[strict]'} %cran %c'${this.name.toString()}' `,
				'color: lightblue; font-weight: bold;', this.#strictMode ? 'color: orange' : 'color: #62dd4f',
				'color: white;', 'color: lightgreen;');
		} catch (error) {
			errAlert(error, this.name);
			strippedConsole.error(error);
		}
	}

}

ipcRenderer.on('main_sends_userscriptPath', (event, recieved_userscriptsPath: string) => {
	su.userscriptsPath = recieved_userscriptsPath;
	su.userscriptTrackerPath = pathResolve(su.userscriptsPath, 'tracker.json');

	// init the userscripts (read, map and set up tracker)

	// remove get all .js files, map to {name, fullpath}
	su.userscripts = readdirSync(su.userscriptsPath, { withFileTypes: true })
		.filter(entry => entry.name.endsWith('.js'))
		.map(entry => new Userscript({ name: entry.name, fullpath: pathResolve(su.userscriptsPath, entry.name).toString() }));

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
				const callback = () => { u.load(); };
				try { document.removeEventListener('DOMContentLoaded', callback); } catch (e) { }
				document.addEventListener('DOMContentLoaded', callback, { once: true });
			}
		}
	});
});
