import { readFileSync } from 'fs';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { ipcRenderer } from 'electron';
import { fetchGame } from './matchmaker';
import { createElement, hiddenClassesImages, injectSettingsCSS, toggleSettingCSS } from './utils';
import { renderSettings } from './settingsui';
import { compareVersions } from 'compare-versions';

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

export const classPickerBottom = '80px';
const $assets = pathResolve(__dirname, '..', 'assets');
const repoID = 'KraXen72/crankshaft';
let lastActiveTab = 0;

/** actual css for settings that are style-based (hide ads, etc)*/
export const styleSettingsCSS = {
	hideAds: readFileSync(pathJoin($assets, 'hideAds.css'), { encoding: 'utf-8' }),
	menuTimer: readFileSync(pathJoin($assets, 'menuTimer.css'), { encoding: 'utf-8' }),
	quickClassPicker: readFileSync(pathJoin($assets, 'quickClassPicker.css'), { encoding: 'utf-8' }) + hiddenClassesImages(16),
	hideReCaptcha: 'body > div:not([class]):not([id]) > div:not(:empty):not([class]):not([id]) { display: none; }'
};

document.addEventListener('DOMContentLoaded', () => {
	// Side Menu Settings Thing
	const settingsSideMenu = document.querySelector('.menuItem[onclick*="showWindow(1)"]');
	settingsSideMenu.addEventListener('click', () => { updateSettingsTabs(lastActiveTab, true, true); });

	// @ts-ignore cba to add it to the window interface
	try { window.windows[0].toggleType({ checked: true }); } catch (err) { strippedConsole.warn("couldn't toggle Advanced slider"); }
});

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
	// let areHiddenClassesHooked = false
	function updateRPC() {
		/** eslint correct Object.hasOwnProperty helper */
		const has = (object: Object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

		strippedConsole.log('> updated RPC');
		const classElem = document.getElementById('menuClassName');
		const skinElem = document.querySelector('#menuClassSubtext > span');
		const mapElem = document.getElementById('mapInfo');

		const gameActivity = has(window, 'getGameActivity') ? window.getGameActivity() as Partial<GameInfo> : {};
		let overWriteDetails: string | false = false;
		if (!has(gameActivity, 'class')) gameActivity.class = { name: classElem === null ? '' : classElem.textContent };
		if (!has(gameActivity, 'map') || !has(gameActivity, ('mode'))) overWriteDetails = (mapElem !== null) ? mapElem.textContent : 'Loading game...';

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

ipcRenderer.on('matchmakerRedirect', (event, _userPrefs: UserPrefs) => fetchGame(_userPrefs));

ipcRenderer.on('injectClientCSS', (_event, _userPrefs: UserPrefs, version) => {
	// eslint-disable-next-line
	const { matchmaker, matchmaker_F6 } = _userPrefs;

	document.addEventListener('keydown', event => {
		if (event.code === 'Escape') document.exitPointerLock();
		if (event.code === 'F1' && matchmaker && !matchmaker_F6) fetchGame(_userPrefs);
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

		instructionHider.appendChild(logoSVG);

		// i am not sure if you should be injecting more elements into a svg element, but it seems to work. feel free to pr a better version tho.
		logoSVG.appendChild(createElement('div', { class: 'crankshaft-holder-l', id: '#loadInfoLHolder', text: `v${version}` }));
		logoSVG.appendChild(createElement('div', { class: 'crankshaft-holder-r', id: '#loadInfoRHolder', text: 'Client by KraXen72' }));

		const observerConfig = { attributes: true, childList: true, subtree: true };

		const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {
			for (const mutation of mutationList) {
				if (mutation.type === 'childList') {
					logoSVG.remove();
					observer.disconnect();
				}
			}
		};

		const observer = new MutationObserver(callback);
		observer.observe(document.getElementById('instructions'), observerConfig);
	}

	if (hideAds) {
		toggleSettingCSS(styleSettingsCSS.hideAds, 'hideAds', true);
		document.getElementById('hiddenClasses').style.bottom = classPickerBottom;
	}
	if (menuTimer) toggleSettingCSS(styleSettingsCSS.menuTimer, 'menuTimer', true);
	if (quickClassPicker) toggleSettingCSS(styleSettingsCSS.quickClassPicker, 'quickClassPicker', true);
	if (hideReCaptcha) toggleSettingCSS(styleSettingsCSS.hideReCaptcha, 'hideReCaptcha', true);
	if (userscripts) ipcRenderer.send('preload_requests_userscriptPath');
});

/**
 * make sure our setting tab is always called as it should be and has the proper onclick
 * @param activeTab the tab that should get active class
 * @param hookSearch if true, it will also add an eventlistener to search and reset settings
 * @param coldStart if client tab is selected upon launch of settings themselved, also call renderSettings()
 */
function updateSettingsTabs(activeTab: number, hookSearch = true, coldStart = false) {
	strippedConsole.log('update settings tabs');
	const activeClass = 'tabANew';
	const settHolder = document.getElementById('settHolder');

	// @ts-ignore
	if (window?.windows[0]?.settingsType === 'basic') window.windows[0].toggleType({ checked: true });

	// FIXME currently, if user clicks too fast, while krunker is still loading, settings might not be hooked - investigate & fix

	// only hook search ONCE to ensure the client settings still work while searching - it will not yield the client settings
	if (hookSearch) {
		// eslint-disable-next-line no-param-reassign
		hookSearch = false;

		const settSearchCallback = () => { updateSettingsTabs(0, hookSearch); };

		try {
			try { document.getElementById('settSearch').removeEventListener('input', settSearchCallback); } catch (e) { }
			document.getElementById('settSearch').addEventListener('input', settSearchCallback);

			try { document.querySelector('.settingsBtn[onclick*="reset"]').removeEventListener('click', settSearchCallback); } catch (e) { }
			document.querySelector('.settingsBtn[onclick*="reset"]').addEventListener('click', settSearchCallback);
		} catch (e) {
			strippedConsole.error('failed to hook search!', e);
		}
	}

	try {
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
	} catch (e) {
		strippedConsole.error('failed to hook advSlider!', e);
	}

	const settingsLoader = document.querySelector('#genericPop.loadingPop');
	if (document.getElementById('settingsTabLayout') === null && settingsLoader && (settingsLoader as HTMLElement).style.display === 'block') {
		// TODO change this from a hard-coded timeout to a MutationObserver
		setTimeout(() => updateSettingsTabs(activeTab, hookSearch, coldStart), 4250);
	} else {
		const tabs = [...document.getElementById('settingsTabLayout').children];
		const clientTab = tabs[tabs.length - 1];
		const selectedTab = document.querySelector(`#settingsTabLayout .${activeClass}`);

		if (selectedTab !== clientTab) settHolder.classList.remove('Crankshaft-settings');

		try { clientTab.removeEventListener('click', renderSettings); } catch (e) { }
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
}
