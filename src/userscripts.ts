import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve as pathResolve } from 'path';
import { ipcRenderer } from 'electron';
import { strippedConsole } from './preload';

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

	name: string;

	fullpath: string;

	rawContent?: string;

	meta: UserscriptMeta | false;

	unload: Function | false;

	#initialized: boolean;

	hasRan: boolean

	#hadToTransform: boolean;

	#parsedContent?: string;

	constructor(props: IUserscript) {
		this.#initialized = false;
		this.hasRan = false;
		this.name = props.name;
		this.fullpath = props.fullpath;

		this.meta = false;
		this.unload = false;

		this.rawContent = readFileSync(this.fullpath, { encoding: 'utf-8' });

		if (this.rawContent.includes('// ==UserScript==') && this.rawContent.includes('// ==/UserScript==')) {
			// eslint-disable-next-line
			const metaParser = require('userscript-meta');

			let chunk: (string[] | string) = this.rawContent.split('\n');
			const startLine = chunk.findIndex(l => l.includes('// ==UserScript=='));
			const endLine = chunk.findIndex(l => l.includes('// ==/UserScript=='));
			strippedConsole.log(chunk, startLine, endLine);
			chunk = chunk.slice(startLine, endLine + 1).join('\n');

			this.meta = metaParser.parse(chunk);

			/*
			 * if the metadata define some prop twice, the parser turns it into an array.
			 * we check if a value isArray and if yes, take the first item in that array as the new value
			 */
			for (let i = 0; i < Object.keys(this.meta).length; i++) {
				const metaKey = Object.keys(this.meta)[i];

				// @ts-ignore
				if (Array.isArray(this.meta[metaKey])) this.meta[metaKey] = this.meta[metaKey][0];
			}
		}
	}

	/** transform rawContent if needed, add it to this.content and return it */
	#init() {
		let content: { code: string, warnings: string[] } = { code: '', warnings: [] }; // dummy content
		this.#hadToTransform = true;

		if (this.rawContent.startsWith('"use strict"')) {
			content = { code: this.rawContent, warnings: [] };
			this.#hadToTransform = false;
		} else {
			try {
				// eslint-disable-next-line
                content = require('esbuild').transformSync(this.rawContent, { minify: true, banner: '"use strict"' });
			} catch (error) { // dummy content will get returned if it fails
				errAlert(error, this.name);
				strippedConsole.error(error);
			}
		}

		if (content.warnings.length > 0) strippedConsole.warn(`'${this.name}' compiled with warnings: `, content.warnings);
		this.#parsedContent = content.code; // save to #parsedContent

		return this.#parsedContent;
	}

	/** return ready-to-run content */
	get #content() {
		if (this.#initialized) return this.#parsedContent; return this.#init();
	}

	/** runs the userscript */
	load() {
		// eslint-disable-next-line no-new-wrappers
		const code = new String(this.#content);

		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			const exported = new Function(code).apply({ unload: false });

			// userscript can return an object with unload and meta properties. use them if it did return
			if (typeof exported !== 'undefined') {
				// more stuff to be added here later
				if ('unload' in exported) this.unload = exported.unload;
			}
			
			strippedConsole.log(`%c[cs]${this.#hadToTransform ? '%c[esbuilt]' : '%c[strict]'} %cran %c'${this.name.toString()}' `,
				'color: lightblue; font-weight: bold;', this.#hadToTransform ? 'color: orange' : 'color: #62dd4f',
				'color: white;', 'color: lightgreen;');
		} catch (error) {
			errAlert(error, this.name);
			strippedConsole.error(error);
		}

		strippedConsole.log(this);
	}



	/*
	 * TODO metadtada won't show when script is not enabled, because it doesen't run and return anything...
	 * TODO run script on turn on
	 * TODO unload script when turned off
	 */

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
	su.userscripts.forEach(u => { if (tracker[u.name]) u.load(); });
});
