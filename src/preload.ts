import { readFileSync } from 'fs';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { ipcRenderer } from 'electron';
import { createElement, injectSettingsCSS, toggleSettingCSS } from './utils';
import { renderSettings } from './settingsui';

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
let lastActiveTab = 0;

/** actual css for settings that are style-based (hide ads, etc)*/
export const styleSettingsCSS = {
	hideAds: readFileSync(pathJoin($assets, 'hideAds.css'), { encoding: 'utf-8' }),
	menuTimer: readFileSync(pathJoin($assets, 'menuTimer.css'), { encoding: 'utf-8' }),
	hideReCaptcha: 'body > div:not([class]):not([id]) > div:not(:empty):not([class]):not([id]) { display: none; }'
};

// Lets us exit the game lmao
document.addEventListener('keydown', event => {
	if (event.code === 'Escape') document.exitPointerLock();
});

// Settings Stuff
document.addEventListener('DOMContentLoaded', () => {
	// Side Menu Settings Thing
	const settingsSideMenu = document.querySelector('.menuItem[onclick*="showWindow(1)"]');
	settingsSideMenu.addEventListener('click', () => { updateSettingsTabs(lastActiveTab, true, true); });

	// @ts-ignore cba to add it to the window interface
	try { window.windows[0].toggleType({ checked: true }); } catch (err) { strippedConsole.warn("couldn't toggle Advanced slider"); }
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

		let gameActivity = window.getGameActivity() as Partial<GameInfo>;
		if (typeof gameActivity === 'undefined') gameActivity = {};
		if (!has(gameActivity, 'class')) gameActivity.class = { name: classElem === null ? '' : classElem.textContent };
		if (!has(gameActivity, 'map') || !has(gameActivity, ('mode'))) {
			if (mapElem !== null) {
				const parts = mapElem.textContent.split('_', 2); // ffa_undergrowth 
				if (!has(gameActivity, 'mode')) gameActivity.mode = parts[0].toUpperCase(); // get gamemode (FFA for example)
				if (!has(gameActivity, 'map')) gameActivity.map = parts[1]; // get the remainder (map name)
			} else {
				gameActivity.map = '';
				gameActivity.mode = '';
			}
		}

		const data: RPCargs = {
			details: `${gameActivity.mode} on ${gameActivity.map}`,
			state: `${gameActivity.class.name} • ${skinElem === null ? '' : skinElem.textContent}`
		};
		if (!gameActivity.mode || !gameActivity.map || !classElem || !skinElem) { // send dummy state - krunker is probably still loading
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

ipcRenderer.on('injectClientCSS', (event, { hideAds, menuTimer, hideReCaptcha, clientSplash, userscripts }, version) => {
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
		try { document.querySelector('#loadInfoRHolder').remove(); } catch (e) { strippedConsole.warn("didn't remove right info holder, doesen't exist"); }
		try { document.querySelector('#loadInfoLHolder').remove(); } catch (e) { strippedConsole.warn("didn't remove left info holder, doesen't exist"); }
		initLoader.appendChild(createElement('div', { class: 'crankshaft-holder-l', id: '#loadInfoLHolder', text: `v${version}` }));
		initLoader.appendChild(createElement('div', { class: 'crankshaft-holder-r', id: '#loadInfoRHolder', text: 'Client by KraXen72' }));
	}

	// TODO rewrite, this is not well scalable
	if (hideAds) toggleSettingCSS(styleSettingsCSS.hideAds, 'hideAds', true);
	if (menuTimer) toggleSettingCSS(styleSettingsCSS.menuTimer, 'menuTimer', true);
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
	// strippedConsole.log("update settings tabs")
	const activeClass = 'tabANew';
	const settHolder = document.getElementById('settHolder');

	// @ts-ignore
	if (window.windows[0].settingsType === 'basic') window.windows[0].toggleType({ checked: true });

	// document.querySelector(".advancedSwitch").style.display = "none"

	/**
	 * only hook search ONCE to ensure the client settings still work while searching. 
	 * it will not yield the client settings tho, that's pain to implement 
	 */
	if (hookSearch) {
		// eslint-disable-next-line no-param-reassign
		hookSearch = false;

		const settSearchCallback = () => { updateSettingsTabs(0, hookSearch); };

		try { document.getElementById('settSearch').removeEventListener('input', settSearchCallback); } catch (e) { }
		document.getElementById('settSearch').addEventListener('input', settSearchCallback);

		try { document.querySelector('.settingsBtn[onclick*="reset"]').removeEventListener('click', settSearchCallback); } catch (e) { }
		document.querySelector('.settingsBtn[onclick*="reset"]').addEventListener('click', settSearchCallback);
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
