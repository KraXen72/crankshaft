import { readFileSync } from 'fs';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { ipcRenderer } from 'electron';
import { fetchGame } from './matchmaker';
import { hasOwn, createElement, hiddenClassesImages, injectSettingsCSS, toggleSettingCSS, repoID } from './utils';
import { renderSettings } from './settingsui';
import { compareVersions } from 'compare-versions';

// TODO if super border rewrite these to dynamic require's. For now i have not done it because i don't want to dynamically require in exported function
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

/// <reference path="global.d.ts" />

// get rid of client unsupported message 
window.OffCliV = true;

// save some console methods from krunker
export const strippedConsole = {
	error: console.error.bind(console),
	log: console.log.bind(console),
	warn: console.warn.bind(console),
	time: console.time.bind(console),
	timeEnd: console.timeEnd.bind(console)
};

const $assets = pathResolve(__dirname, '..', 'assets');

/** actual css for settings that are style-based (hide ads, etc)*/
export const styleSettingsCSS = {
	hideAds: readFileSync(pathJoin($assets, 'hideAds.css'), { encoding: 'utf-8' }),
	menuTimer: readFileSync(pathJoin($assets, 'menuTimer.css'), { encoding: 'utf-8' }),
	quickClassPicker: readFileSync(pathJoin($assets, 'quickClassPicker.css'), { encoding: 'utf-8' }) + hiddenClassesImages(16),
	hideReCaptcha: 'body > div:not([class]):not([id]) > div:not(:empty):not([class]):not([id]) { display: none; }'
};

ipcRenderer.on('main_did-finish-load', (event, _userPrefs) => patchSettings(_userPrefs));

ipcRenderer.on('checkForUpdates', async(event, currentVersion) => {
	const releases = await fetch(`https://api.github.com/repos/${repoID}/releases/latest`);
	const response = await releases.json();
	const latestVersion = response.tag_name;
	const comparison = compareVersions(currentVersion, latestVersion); // -1 === new version available

	const updateElement = createElement('div', {
		class: ['crankshaft-holder-update', 'refresh-popup'],
		id: '#loadInfoUpdateHolder'
	});

	if (comparison === -1) {
		updateElement.appendChild(createElement('a', { text: `New update! Download ${latestVersion}` }));

		const callback = () => { ipcRenderer.send('openExternal', `https://github.com/${repoID}/releases/latest`); };
		try { updateElement.removeEventListener('click', callback); } catch (e) { }
		updateElement.addEventListener('click', callback);
	} else {
		updateElement.appendChild(createElement('span', { text: 'No new updates' }));
	}

	strippedConsole.log(`Crankshaft client v${currentVersion} latest: v${latestVersion}`);

	document.body.appendChild(updateElement);

	let hideTimeout = setTimeout(() => updateElement.remove(), 5000);
	updateElement.onmouseenter = () => clearTimeout(hideTimeout);
	updateElement.onmouseleave = () => { hideTimeout = setTimeout(() => updateElement.remove(), 5000); };
	document.addEventListener('pointerlockchange', () => { clearTimeout(hideTimeout); updateElement.remove(); }, { once: true });
});

ipcRenderer.on('initDiscordRPC', () => {
	function updateRPC() {
		strippedConsole.log('> updated RPC');
		const classElem = document.getElementById('menuClassName');
		const skinElem = document.querySelector('#menuClassSubtext > span');
		const mapElem = document.getElementById('mapInfo');

		const gameActivity = hasOwn(window, 'getGameActivity') ? window.getGameActivity() as Partial<GameInfo> : {};
		let overWriteDetails: string | false = false;
		if (!hasOwn(gameActivity, 'class')) gameActivity.class = { name: classElem?.textContent ?? '' };
		if (!hasOwn(gameActivity, 'map') || !hasOwn(gameActivity, 'mode')) overWriteDetails = mapElem?.textContent ?? 'Loading game...';

		const data: RPCargs = {
			details: overWriteDetails || `${gameActivity.mode} on ${gameActivity.map}`,
			state: `${gameActivity.class.name} • ${skinElem === null ? '' : skinElem.textContent}`
		};
		if (!skinElem) { // as long as we have skinElem, we can fill in the other blanks
			ipcRenderer.send('preload_updates_DiscordRPC', { details: 'Loading krunker...', state: 'github.com/KraXen72/crankshaft' });
		} else {
			ipcRenderer.send('preload_updates_DiscordRPC', data);
		}
	}

	// updating rpc
	ipcRenderer.on('main_did-finish-load', updateRPC);
	window.addEventListener('load', () => {
		updateRPC();
		setTimeout(() => {
			// hook elements that update rpc
			try { document.getElementById('windowCloser').addEventListener('click', updateRPC); } catch (e) { strippedConsole.error("didn't hook wincloser", e); }
			try { document.getElementById('customizeButton').addEventListener('click', updateRPC); } catch (e) { strippedConsole.error("didn't hook customizeButton", e); }
		}, 4000);
	});
	document.addEventListener('pointerlockchange', updateRPC); // thank God this exists
});

ipcRenderer.on('matchmakerRedirect', (_event, _userPrefs: UserPrefs) => fetchGame(_userPrefs));

ipcRenderer.on('injectClientCSS', (_event, _userPrefs: UserPrefs, version: string) => {
	// eslint-disable-next-line
	const { matchmaker, matchmaker_F6 } = _userPrefs;

	document.addEventListener('keydown', event => {
		if (event.code === 'Escape') document.exitPointerLock();
		if (event.code === 'F1' && matchmaker && !matchmaker_F6) ipcRenderer.send('matchmaker_requests_userPrefs');
	});

	const { hideAds, menuTimer, quickClassPicker, hideReCaptcha, clientSplash, userscripts } = _userPrefs;
	const splashId = 'Crankshaft-splash-css';
	const settId = 'Crankshaft-settings-css';

	const settCss = readFileSync(pathJoin($assets, 'settingCss.css'), { encoding: 'utf-8' });
	injectSettingsCSS(settCss, settId);

	if (clientSplash) {
		const splashCSS = readFileSync(pathJoin($assets, 'splashCss.css'), { encoding: 'utf-8' });
		injectSettingsCSS(splashCSS, splashId);

		const instructionHider = document.getElementById('instructionHider');
		if (instructionHider === null) throw "Krunker didn't create #instructionHider";

		const logoSVG = createElement('svg', {
			id: 'crankshaft-logo-holder',
			innerHTML: readFileSync(pathJoin($assets, 'full_logo.svg'), { encoding: 'utf-8' })
		});

		const clearSplash = (_observer: MutationObserver) => {
			try {
				logoSVG.remove();
				_observer.disconnect();
			} catch (e) {
				console.log('splash screen was already cleared.');
			}
		};

		instructionHider.appendChild(logoSVG);

		// i am not sure if you should be injecting more elements into a svg element, but it seems to work. feel free to pr a better version tho.
		logoSVG.appendChild(createElement('div', { class: 'crankshaft-holder-l', id: '#loadInfoLHolder', text: `v${version}` }));
		logoSVG.appendChild(createElement('div', { class: 'crankshaft-holder-r', id: '#loadInfoRHolder', text: 'by KraXen72 and contributors' }));

		const observerConfig = { attributes: true, childList: true, subtree: true };
		const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {
			for (const mutation of mutationList) if (mutation.type === 'childList') clearSplash(observer);
		};

		const observer = new MutationObserver(callback);
		observer.observe(document.getElementById('instructions'), observerConfig);
		document.addEventListener('pointerlockchange', () => { clearSplash(observer); }, { once: true });
	}

	if (hideAds === 'block' || hideAds === 'hide') {
		toggleSettingCSS(styleSettingsCSS.hideAds, 'hideAds', true);
		document.getElementById('hiddenClasses').classList.add('hiddenClasses-hideAds-bottomOffset');
	}
	if (menuTimer) toggleSettingCSS(styleSettingsCSS.menuTimer, 'menuTimer', true);
	if (quickClassPicker) toggleSettingCSS(styleSettingsCSS.quickClassPicker, 'quickClassPicker', true);
	if (hideReCaptcha) toggleSettingCSS(styleSettingsCSS.hideReCaptcha, 'hideReCaptcha', true);
	if (userscripts) ipcRenderer.send('initializeUserscripts');
});

// warning: timezone calculation may be slighty innacurate: no special logic for DST and approx. offsets for BRZ, BHN and AFR
export const regionMappings = [
	{ name: 'Frankfurt', id: 'de-fra', code: 'FRA', offset: 2 },
	{ name: 'Silicon Valley', id: 'us-ca-sv', code: 'SV', offset: -7 },
	{ name: 'Sydney', id: 'au-syd', code: 'SYD', offset: 10 },
	{ name: 'Tokyo', id: 'jb-hnd', code: 'TOK', offset: 9 },
	{ name: 'Miami', id: 'us-fl', code: 'MIA', offset: -4 },
	{ name: 'Singapore', id: 'sgp', code: 'SIN', offset: 8 },
	{ name: 'New York', id: 'us-nj', code: 'NY', offset: -4 },
	{ name: 'Mumbai', id: 'as-mb', code: 'MBI', offset: 5.5 },
	{ name: 'Dallas', id: 'us-tx', code: 'DAL', offset: -5 },
	{ name: 'Brazil', id: 'brz', code: 'BRZ', offset: -3 }, // approximate, BRT
	{ name: 'Middle East', id: 'me-bhn', code: 'BHN', offset: 3 }, // approximate, Saudi arabia
	{ name: 'South Africa', id: 'af-ct', code: 'AFR', offset: 2 }, // approximate, SAST
	// found in matchmaker, but not region picker
	{ name: 'China (hidden)', id: '', code: 'CHI', offset: 8 }, // approximate, Beijing
	{ name: 'London (hidden)', id: '', code: 'LON', offset: 1 },
	{ name: 'Seattle (hidden)', id: '', code: 'STL', offset: -7 },
	{ name: 'Mexico (hidden)', id: '', code: 'MX', offset: -6 }
];

// find option elements of the region setting, + select closing tag
const regionOptionsRegex = new RegExp('s*<option value=.*(de-fra).*(us-ca-sv).*</option>', 'gu');

/** get a timezone in format '[HH:mm]' for a region by it's 3-letter code (e.g. FRA) or id (e.g. de-fra) */
export function getTimezoneByRegionKey(key: 'code' | 'id', value: string) {
	if (key === 'id' && value === '') throw new Error('getTimezoneByRegionKey: forbidden to get regions by id with empty id, would match multiple hidden regions');
	const date = dayjs().utc();
	const possibleRegions = regionMappings.filter(reg => reg[key] === value);
	if (possibleRegions.length === 0) throw new Error(`getTimezoneByRegionKey: couldn't get region object for '${key}' === '${value}'`);
	const region = possibleRegions[0];
	const localDate = region.offset > 0 ? date.add(region.offset, 'hour') : date.subtract(Math.abs(region.offset), 'hour');
	return `[${localDate.format('HH:mm')}]`;
}

function patchSettings(_userPrefs: UserPrefs) {
	// hooking & binding credit: https://github.com/asger-finding/anotherkrunkerclient/blob/main/src/preload/game-settings.ts
	let interval: number | NodeJS.Timer = null;
	strippedConsole.log('waiting to hook settings...');

	function hookSettings() {
		const settingsWindow = window.windows[0];
		let selectedTab = settingsWindow.tabIndex;

		function isClientTab() {
			const allTabsCount = settingsWindow.tabs[settingsWindow.settingType].length - 1;
			return selectedTab === allTabsCount;
		}

		function safeRenderSettings() {
			const settHolder = document.getElementById('settHolder');
			if (!isClientTab() && settHolder !== null) settHolder.classList.remove('Crankshaft-settings');
			if (isClientTab()) renderSettings();
		}

		const showWindowHook = window.showWindow.bind(window);
		const getSettingsHook = settingsWindow.getSettings.bind(settingsWindow);
		const changeTabHook = settingsWindow.changeTab.bind(settingsWindow);

		window.showWindow = (...args: unknown[]) => {
			const result = showWindowHook(...args);

			if (args[0] === 1) {
				if (settingsWindow.settingType === 'basic') settingsWindow.toggleType({ checked: true });
				const advSliderElem: HTMLInputElement = document.querySelector('.advancedSwitch input#typeBtn');
				advSliderElem.disabled = true;
				advSliderElem.nextElementSibling.setAttribute('title', 'Crankshaft auto-enables advanced settings mode');

				if (isClientTab()) renderSettings();
			}

			return result;
		};

		// whenever we change tabs, if it's client tab, run renderSettings, otherwise remove our class
		settingsWindow.changeTab = (...args: unknown[]) => {
			const result = changeTabHook(...args);
			selectedTab = settingsWindow.tabIndex;

			safeRenderSettings();

			return result;
		};

		settingsWindow.getSettings = (...args: unknown[]) => {
			const result: string = getSettingsHook(...args);
			if (!_userPrefs.regionTimezones) return result;

			if (result.includes('window.setSetting("defaultRegion"') && result.match(regionOptionsRegex).length > 0) {
				const optionsHTML = result.match(regionOptionsRegex)[0];
				const optionElements = [...createElement('div', { innerHTML: optionsHTML }).children] as HTMLOptionElement[];

				for (let i = 0; i < optionElements.length; i++) {
					const opt = optionElements[i];
					opt.textContent += ` ${getTimezoneByRegionKey('id', opt.value)}`;
				}

				const tempHolder = document.createElement('div');
				optionElements.forEach(opt => tempHolder.appendChild(opt));

				const patchedHTML = tempHolder.innerHTML;
				return result.replace(optionsHTML, patchedHTML);
			}

			return result;
		};

		safeRenderSettings();
	}

	function waitForWindow0() {
		if (
			hasOwn(window, 'showWindow')
			&& typeof window.showWindow === 'function'
			&& hasOwn(window, 'windows')
			&& Array.isArray(window.windows)
			&& window.windows.length >= 0
			&& typeof window.windows[0] !== 'undefined'
			&& typeof window.windows[0].changeTab === 'function'
		) {
			clearInterval(interval);
			strippedConsole.log('hooking settings');
			hookSettings();
		}
	}

	interval = setInterval(waitForWindow0, 250);
}

