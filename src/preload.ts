import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { ipcRenderer } from 'electron';
import { createElement, injectSettingsCSS, toggleSettingCSS } from './utils';
import { renderSettings } from './settingsui';

// /<reference path="global.d.ts" />

// get rid of client unsupported message
window.OffCliV = true;

// save some console methods from krunker
export const strippedConsole = {
	error: console.error.bind(console),
	log: console.log.bind(console),
	warn: console.warn.bind(console)
};

/** simple error message for usercripts. can be called from the userscript itself */
const errAlert = (err: Error, name: string) => {
	alert(`Userscript '${name}' had an error:\n\n${err.toString()}\n\nPlease fix the error, disable the userscript in the 'tracker.json' file or delete it.\nFeel free to check console for stack trace`);
};

/** sharedUserscriptData */
export const su = {
	userscriptsPath: '',
	userscriptTrackerPath: '',
	userscripts: <Userscript[]>[],
	userscriptTracker: <UserscriptTracker>{}
};
const $assets = pathResolve(__dirname, '..', 'assets');
let lastActiveTab = 0;

/** actual css for settings that are style-based (hide ads, etc)*/
export const styleSettingsCSS = {
	hideAds: readFileSync(pathJoin($assets, 'hideAds.css'), { encoding: 'utf-8' }),
	menuTimer: readFileSync(pathJoin($assets, 'menuTimer.css'), { encoding: 'utf-8' })
};

// Lets us exit the game lmao
document.addEventListener('keydown', event => {
	if (event.code === 'Escape') document.exitPointerLock();
});


// Settings Stuff
document.addEventListener('DOMContentLoaded', () => {
	// Side Menu Settings Thing
	const settingsSideMenu = document.querySelectorAll('.menuItem')[6];
	settingsSideMenu.addEventListener('click', () => { updateSettingsTabs(lastActiveTab, true, true); });

	// @ts-ignore cba to add it to the window interface
	try { window.windows[0].toggleType({ checked: true }); } catch (err) {}
});

ipcRenderer.on('main_sends_userscriptPath', (event, recieved_userscriptsPath: string) => {
	su.userscriptsPath = recieved_userscriptsPath;
	su.userscriptTrackerPath = pathResolve(su.userscriptsPath, 'tracker.json');

	// init the userscripts (read, map and set up tracker)

	// remove all non .js files, map to {name, fullpath}
	su.userscripts = readdirSync(su.userscriptsPath, { withFileTypes: true })
		.filter(entry => entry.name.endsWith('.js'))
		.map(entry => ({ name: entry.name, fullpath: pathResolve(su.userscriptsPath, entry.name).toString() }));

	const tracker: UserscriptTracker = {};
	su.userscripts.forEach(u => { tracker[u.name] = false }); // fill tracker with falses, so new userscripts get added disabled
	Object.assign(tracker, JSON.parse(readFileSync(su.userscriptTrackerPath, { encoding: 'utf-8' }))); // read and assign the tracker.json
	writeFileSync(su.userscriptTrackerPath, JSON.stringify(tracker, null, 2), { encoding: 'utf-8' }); // save with the new userscripts

	su.userscriptTracker = tracker;

	// run the code in the userscript
	su.userscripts.forEach(u => {
		if (tracker[u.name]) { // if enabled
			const rawContent = readFileSync(u.fullpath, { encoding: 'utf-8' });
			let content: { code: string, warnings: string[] };
			let hadToTransform = true;

			if (rawContent.startsWith('"use strict"')) {
				content = { code: rawContent, warnings: [] };
				hadToTransform = false;
			} else {
				try {
					// eslint-disable-next-line
					content = require('esbuild').transformSync(rawContent, { minify: true, banner: '"use strict"' });
				} catch (error) {
					errAlert(error, u.name);
					strippedConsole.error(error);
				}
			}

			if (content.warnings.length > 0) strippedConsole.warn(`'${u.name}' compiled with warnings: `, content.warnings);
			u.content = content.code;

			// eslint-disable-next-line no-new-wrappers
			const code = new String(content.code);
			try {
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				(new Function(code)());
			} catch (error) {
				errAlert(error, u.name);
				strippedConsole.error(error);
			}

			strippedConsole.log(`%c[cs]${hadToTransform ? '%c[esbuilt]' : '%c[strict]'} %cran %c'${u.name.toString()}' `,
				'color: lightblue; font-weight: bold;', hadToTransform ? 'color: orange' : 'color: #62dd4f',
				'color: white;', 'color: lightgreen;');
		}
	});
});

ipcRenderer.on('injectClientCSS', (event, { hideAds, menuTimer, clientSplash, userscripts }, version) => {
	const splashId = 'Crankshaft-splash-css';
	const settId = 'Crankshaft-settings-css';

	const settCss = readFileSync(pathJoin($assets, 'settingCss.css'), { encoding: 'utf-8' });
	injectSettingsCSS(settCss, settId);

	if (clientSplash) {
		const splashCSS = readFileSync(pathJoin($assets, 'splashCss.css'), { encoding: 'utf-8' });
		injectSettingsCSS(splashCSS, splashId);

		const initLoader = document.getElementById('initLoader');
		if (initLoader === null) throw "Krunker didn't create #initLoader";

		initLoader.appendChild(createElement('svg', {
			id: 'crankshaft-logo-holder',
			innerHTML: readFileSync(pathJoin($assets, 'Frame_1Logo-minText.svg'), { encoding: 'utf-8' })
		}));

		// make our won bottom corner holders incase krunker changes it's shit. we only rely on the loading text from krunker.
		try { document.querySelector('#loadInfoRHolder').remove(); } catch (e) { }
		try { document.querySelector('#loadInfoLHolder').remove(); } catch (e) { }
		initLoader.appendChild(createElement('div', { class: 'crankshaft-holder-l', id: '#loadInfoLHolder', text: `v${version}` }));
		initLoader.appendChild(createElement('div', { class: 'crankshaft-holder-r', id: '#loadInfoRHolder', text: 'Client by KraXen72' }));
	}

	// TODO rewrite, this is not well scalable
	if (hideAds) toggleSettingCSS(styleSettingsCSS.hideAds, 'hideAds', true);
	if (menuTimer) toggleSettingCSS(styleSettingsCSS.menuTimer, 'menuTimer', true);
	if (userscripts) ipcRenderer.send('preload_requests_userscriptPath');
});

/**
 * make sure our setting tab is always called as it should be and has the proper onclick
 */
function updateSettingsTabs(activeTab: number, hookSearch = true, coldStart = false) {
	// strippedConsole.log("update settings tabs")
	const activeClass = 'tabANew';
	const settHolder = document.getElementById('settHolder');

	// @ts-ignore
	if (window.windows[0].settingsType === 'basic') window.windows[0].toggleType({ checked: true });

	// document.querySelector(".advancedSwitch").style.display = "none"

	if (hookSearch) {
		/*
		 * only hook search ONCE to ensure the client settings still work while searching. 
		 * it will not yield the client settings tho, that's pain to implement
		 */
		// eslint-disable-next-line no-param-reassign
		hookSearch = false;
		const settSearchCallback = () => { updateSettingsTabs(0, hookSearch); };
		try { document.getElementById('settSearch').removeEventListener('input', settSearchCallback); } catch (e) {}
		document.getElementById('settSearch').addEventListener('input', settSearchCallback);
	}

	const advSliderElem = document.querySelector('.advancedSwitch input#typeBtn');
	const advSwitchCallback = () => {
		advSliderElem.setAttribute('disabled', 'disabled');
		setTimeout(() => {
			advSliderElem.removeAttribute('disabled');
			updateSettingsTabs(0, true);
		}, 700);
	};
	try { advSliderElem.removeEventListener('change', advSwitchCallback); } catch (e) { }
	advSliderElem.addEventListener('change', advSwitchCallback);

	// modifications we do the the dom:
	const tabs = [...document.getElementById('settingsTabLayout').children];
	const clientTab = tabs[tabs.length - 1];
	const selectedTab = document.querySelector(`#settingsTabLayout .${activeClass}`);

	if (selectedTab !== clientTab) settHolder.classList.remove('Crankshaft-settings');

	try { clientTab.removeEventListener('click', renderSettings); } catch (e) {}
	clientTab.addEventListener('click', renderSettings);

	if (selectedTab === clientTab && coldStart) renderSettings();

	for (let i = 0; i < tabs.length; i++) {
		const currentTabCallback = () => { updateSettingsTabs(i, hookSearch); };
		try { tabs[i].removeEventListener('click', currentTabCallback); } catch (e) { }
		tabs[i].addEventListener('click', currentTabCallback);

		if (i === activeTab) { // if the current selected tab is our settings, just add active class
			lastActiveTab = i;
			tabs[i].classList.add(activeClass);
		}
	}
}
