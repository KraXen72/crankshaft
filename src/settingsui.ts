/* eslint-disable max-len */
import { join } from 'path'
import { writeFileSync, readFileSync } from 'fs';
import { ipcRenderer, shell } from 'electron'; // add app if crashes
import { createElement, haveSameContents, toggleSettingCSS, hasOwn, repoID } from './utils';
import { styleSettingsCSS, getTimezoneByRegionKey, strippedConsole } from './preload';
import { su } from './userscripts';
import { MATCHMAKER_GAMEMODES, MATCHMAKER_REGIONS } from './matchmaker';
import { customSettingIsMalformed, customSettingSavedJSONIsNotMalformed } from './userscriptvalidators';

/// <reference path="global.d.ts" />
enum RefreshEnum {
	notNeeded = 0,
	refresh,
	reloadApp
}
interface IPaths { [path: string]: string }
type customUserscriptSettings = Record<string, UserPrefs>

/* eslint-disable init-declarations */
let userPrefs: UserPrefs;
let userPrefsPath: string;
let userscriptPrefsPath: string;
let userscriptPreferences: customUserscriptSettings = {};
let userPrefsCache: UserPrefs; // the userprefs on path
let refreshNeeded: RefreshEnum = RefreshEnum.notNeeded;
let refreshNotifElement: HTMLElement;
let paths: IPaths;
/* eslint-disable init-declarations */

document.addEventListener('DOMContentLoaded', () => { ipcRenderer.send('settingsUI_requests_userPrefs'); });

ipcRenderer.on('m_userPrefs_for_settingsUI', (event, recieved_paths: IPaths, recieved_userPrefs: UserPrefs) => {
	// main sends us the path to settings and also settings themselves on initial load.
	userPrefsPath = recieved_paths.settingsPath;
	userscriptPrefsPath = recieved_paths.userscriptPreferencesPath;
	paths = recieved_paths;
	userPrefs = recieved_userPrefs;
	userPrefsCache = { ...recieved_userPrefs }; // cache userprefs

	settingsDesc.resourceSwapper.button = { icon: 'folder', text: 'Swapper', callback: e => openPath(e, paths.swapperPath) };
	settingsDesc.customFilters.button = { icon: 'filter_list', text: 'Filters file', callback: e => openPath(e, paths.filtersPath) };
	settingsDesc.userscripts.button = { icon: 'folder', text: 'Scripts', callback: e => openPath(e, paths.userscriptsPath) };
});

/** joins the data: userPrefs and Desc: SettingsDesc into one array of objects */
function transformMarrySettings(data: UserPrefs, desc: SettingsDesc, callback: Callbacks): RenderReadySetting[] {
	const renderReadySettings = Object.keys(desc)
		.map(key => ({ key, ...desc[key] })) // embeds key into the original object: hideAds: {title: 'Hide Ads', ...} => {key: 'hideAds', title: 'Hide Ads', ...}
		.map(obj => ({ callback, value: data[obj.key], ...obj })); // adds value (from the data object) and callback ('normal' by default)

	return renderReadySettings;
}

function openPath(e: MouseEvent, path: string) {
	e.stopPropagation();
	shell.openPath(path);
}

/**
 * each setting is defined here as a SettingsDesc object. check typescript intelliSense to see if you have all required props.
 * some setting types, like 'sel' will have more required props, for example 'opts'.
 * note: for each key in userPrefs, there should exist an entry under the same key here.
 * 
 * optional props and their defaults:
 * desc (description): omitting it or leaving it "" will not render any description
 * cat (category): omitting will put the setting in the first (0th) category
 * instant: ommiting will not render an instant icon.
 * refreshOnly: ommiting will not render a refresh-only icon
 * 
 * note: instant and refreshOnly are exclusive. only use one at a time
 * note: settings will get rendered in the order you define them.
 * based on my generative settings from https://github.com/KraXen72/glide, precisely https://github.com/KraXen72/glide/blob/master/settings.js
 */
const settingsDesc: SettingsDesc = {
	fpsUncap: { title: 'Un-cap FPS', type: 'bool', desc: '', safety: 0, cat: 0 },
	'angle-backend': { title: 'ANGLE Backend', type: 'sel', safety: 0, opts: ['default', 'gl', 'd3d11', 'd3d9', 'd3d11on12', 'vulkan'], cat: 0 },
	fullscreen: { title: 'Start in Windowed/Fullscreen mode', type: 'sel', desc: "Use 'borderless' if you have client-capped fps and unstable fps in fullscreen", safety: 0, cat: 0, opts: ['windowed', 'maximized', 'fullscreen', 'borderless'] },
	inProcessGPU: { title: 'In-Process GPU (video capture)', type: 'bool', desc: 'Enables video capture & embeds the GPU under the same process', safety: 1, cat: 0 },
	resourceSwapper: { title: 'Resource swapper', type: 'bool', desc: 'Enable Krunker Resource Swapper. ', safety: 0, cat: 0 },
	discordRPC: { title: 'Discord Rich Presence', type: 'bool', desc: 'Enable Discord Rich Presence. Shows Gamemode, Map, Class and Skin', safety: 0, cat: 0 },
	extendedRPC: { title: 'Extended Discord RPC', type: 'bool', desc: 'Adds Github + Discord buttons to RPC. No effect if RPC is off.', safety: 0, cat: 0, instant: true },
	hideAds: { title: 'Hide/Block Ads', type: 'sel', desc: 'With \'hide\' you can still claim free KR. Using \'block\' also blocks trackers.', safety: 0, cat: 0, refreshOnly: true, opts: ['block', 'hide', 'off'] },
	customFilters: { title: 'Custom Filters', type: 'bool', desc: 'Enable custom network filters. ', safety: 0, cat: 0, refreshOnly: true },
	userscripts: { title: 'Userscript support', type: 'bool', desc: `Enable userscript support. read <a href="https://github.com/${repoID}/blob/master/USERSCRIPTS.md" target="_blank">USERSCRIPTS.md</a> for more info.`, safety: 1, cat: 0 },

	menuTimer: { title: 'Menu Timer', type: 'bool', safety: 0, cat: 1, instant: true },
	hideReCaptcha: { title: 'Hide reCaptcha', type: 'bool', safety: 0, cat: 1, instant: true },
	quickClassPicker: { title: 'Quick Class Picker', type: 'bool', safety: 0, cat: 1, instant: true },
	clientSplash: { title: 'Client Splash Screen', type: 'bool', safety: 0, cat: 1, refreshOnly: true },
	regionTimezones: { title: 'Region Picker Timezones', type: 'bool', desc: 'Adds local time to all region pickers', safety: 0, cat: 1, refreshOnly: true },

	matchmaker: { title: 'Custom Matchmaker', type: 'bool', desc: 'Configurable matchmaker. Default hotkey F1', safety: 0, cat: 2, refreshOnly: true },
	matchmaker_F6: { title: 'F6 hotkey', type: 'bool', desc: 'Replace default \'New Lobby\' F6 hotkey with Matchmaker ', safety: 0, cat: 2 },
	matchmaker_regions: { title: 'Whitelisted regions', type: 'multisel', desc: '', safety: 0, cat: 2, opts: MATCHMAKER_REGIONS, cols: 16, instant: true },
	matchmaker_gamemodes: { title: 'Whitelisted gamemodes', type: 'multisel', desc: '', safety: 0, cat: 2, opts: MATCHMAKER_GAMEMODES, cols: 4, instant: true },
	matchmaker_minRemainingTime: { title: 'Minimum remaining seconds', type: 'num', min: 0, max: 480, safety: 0, cat: 2, instant: true },
	matchmaker_minPlayers: { title: 'Minimum players in Lobby', type: 'num', min: 0, max: 7, safety: 0, cat: 2, instant: true },
	matchmaker_maxPlayers: { title: 'Maximum players in Lobby', type: 'num', min: 0, max: 7, safety: 0, cat: 2, instant: true, desc: 'if you set the criteria too strictly, matchmaker won\'t find anything' },

	logDebugToConsole: { title: 'Log debug & GPU info to electron console', type: 'bool', safety: 0, cat: 3 },
	alwaysWaitForDevTools: { title: 'Always wait for DevTools', desc: 'Crankshaft uses an alt. method to open Devtools in a new window if they take too long. This disables that. Might cause DevTools to not work', type: 'bool', safety: 3, cat: 3 },
	safeFlags_removeUselessFeatures: { title: 'Remove useless features', type: 'bool', desc: 'Adds a lot of flags that disable useless features.', safety: 1, cat: 3 },
	safeFlags_gpuRasterizing: { title: 'GPU rasterization', type: 'bool', desc: 'Enable GPU rasterization and disable Zero-copy rasterizer so rasterizing is stable', safety: 2, cat: 3 },
	safeFlags_helpfulFlags: { title: '(Potentially) useful flags', type: 'bool', desc: 'Enables javascript-harmony, future-v8-vm-features, webgl2-compute-context.', safety: 3, cat: 3 },
	disableAccelerated2D: { title: 'Disable Accelerated 2D canvas', type: 'bool', desc: '', safety: 3, cat: 3 },
	experimentalFlags_increaseLimits: { title: 'Increase limits flags', type: 'bool', desc: 'Sets renderer-process-limit, max-active-webgl-contexts and webrtc-max-cpu-consumption-percentage to 100, adds ignore-gpu-blacklist', safety: 4, cat: 3 },
	experimentalFlags_lowLatency: { title: 'Lower Latency flags', type: 'bool', desc: 'Adds following flags: enable-highres-timer, enable-quic (experimental low-latency protocol) and enable-accelerated-2d-canvas', safety: 4, cat: 3 },
	experimentalFlags_experimental: { title: 'Experimental flags', type: 'bool', desc: 'Adds following flags: disable-low-end-device-mode, high-dpi-support, ignore-gpu-blacklist, no-pings and no-proxy-server', safety: 4, cat: 3 }
};

/** index-based safety descriptions. goes in title attribute */
const safetyDesc = [
	'This setting is safe/standard',
	'Proceed with caution',
	'This setting is not recommended',
	'This setting is experimental',
	'This setting is experimental and unstable. Use at your own risk.'
];

/** index-based category names. n = name, c = class */
const categoryNames: CategoryName[] = [
	{ name: 'Client Settings', cat: 'mainSettings' },
	{ name: 'Visual Settings', cat: 'styleSettings' },
	{ name: 'Matchmaker', cat: 'matchmakerSettings' },
	{ name: 'Advanced Settings', cat: 'advSettings' }
];

const refreshToUnloadMessage = 'REFRESH PAGE TO UNLOAD USERSCRIPT';

function saveSettings() {
	writeFileSync(userPrefsPath, JSON.stringify(userPrefs, null, 2), { encoding: 'utf-8' });
	ipcRenderer.send('settingsUI_updates_userPrefs', userPrefs); // send them back to main
}
function loadUserScriptSettings(eventSuffix: string, settings: Record<string, UserscriptRenderReadySetting>): UserPrefs {
	try {
		const settingsJSON: {[key: string]: UserPrefValue} = JSON.parse(readFileSync(join(userscriptPrefsPath, `${eventSuffix}.json`), 'utf-8'));
		Object.keys(settingsJSON).forEach(settingKey => {
			if (customSettingSavedJSONIsNotMalformed(settingKey, settings, settingsJSON)) {
				userscriptPreferences[eventSuffix][settingKey] = settingsJSON[settingKey]
			}
		})
		return userscriptPreferences[eventSuffix]
	} catch (e) { // Settings file for script probably doesn't exist yet
		return {}
	}
}
function userscriptSettingsResetDefaults(eventSuffix: string, userscriptSettings: Record<string, UserscriptRenderReadySetting>, userscriptCategoryID: string, brokenSettings: string[]) {
	const optionsContainer = document.querySelector(`.${userscriptCategoryID}`)
	Object.keys(userscriptSettings).forEach(settingKey => {
		if (!brokenSettings.includes(settingKey)) {
			const setting = userscriptSettings[settingKey]
			const settingValue = userscriptSettings[settingKey].value
			setting.changed(settingValue)
			const settingValueContainer: HTMLElement = optionsContainer.querySelector(`#settingElem-${settingKey}`)
			const settingValueElement: HTMLInputElement = settingValueContainer.querySelector(`.s-update`)
			const secondarySettingValueElement: HTMLInputElement = settingValueContainer.querySelector(`.s-update-secondary`)
			userscriptPreferences[eventSuffix][settingKey] = settingValue
			switch (setting.type) {
				case "bool":
					settingValueElement.checked = settingValue as boolean
					break;
					default:
					settingValueElement.value = String(settingValue)
					if (secondarySettingValueElement) secondarySettingValueElement.value = String(settingValue)
					break;
			}
			saveUserScriptSettings(eventSuffix)
		}
	})

}
function saveUserScriptSettings(eventSuffix: string) {
	writeFileSync(join(userscriptPrefsPath, `${eventSuffix}.json`), JSON.stringify(userscriptPreferences[eventSuffix], null, 2), { encoding: 'utf-8' });
}

function recalculateRefreshNeeded() {
	refreshNeeded = RefreshEnum.notNeeded;
	for (let i = 0; i < Object.keys(userPrefs).length; i++) {
		const cache = (item: UserPrefs[keyof UserPrefs]) => (Array.isArray(item) ? [...item] : item);
		const key = Object.keys(userPrefs)[i];
		const descObj = settingsDesc[key];
		const setting = cache(userPrefs[key]);
		const cachedSetting = cache(userPrefsCache[key]);

		const settingsEqual = Array.isArray(setting) && Array.isArray(cachedSetting)
			? haveSameContents(setting, cachedSetting)
			: setting === cachedSetting;

		if (!settingsEqual) {
			if (descObj?.instant) {
				continue;
			} else if (descObj?.refreshOnly) {
				if (refreshNeeded < RefreshEnum.refresh) refreshNeeded = RefreshEnum.refresh;
			} else {
				refreshNeeded = RefreshEnum.reloadApp;
			}
		}
	}
}

function saveUserscriptTracker() {
	writeFileSync(su.userscriptTrackerPath, JSON.stringify(su.userscriptTracker, null, 2), { encoding: 'utf-8' });
}

/** creates a new Setting element */
class SettingElem {

	// s-update is the class for element to watch
	props: RenderReadySetting;

	type: ValidTypes;

	HTML: string;

	updateMethod: 'onchange' | 'oninput' | '';

	updateKey: 'value' | 'checked' | 'valueAsNumber' | '';

	#wrapper: HTMLElement | false;

	#disabled: boolean;

	constructor(props: RenderReadySetting) {
		/** @type {Object} save the props from constructor to this class (instance) */
		this.props = props;

		/** @type {String} type of this settingElem, can be {'bool' | 'sel' | 'heading' | 'text' | 'num'} */
		this.type = props.type;

		/** @type {String} innerHTML for settingElement */
		this.HTML = '';

		/** @type {String} is the eventlistener to use. for checkbox its be onclick, for select its be onchange etc. */
		this.updateMethod = '';

		/** @type {String} is the key to get checked when writing an update, for checkboxes it's checked, for selects its value etc.*/
		this.updateKey = '';

		this.#wrapper = false;

		this.#disabled = false;

		// general stuff that every setting has
		if (this.props.safety > 0) this.HTML += skeleton.safetyIcon(safetyDesc[this.props.safety]);
		else if (this.props.instant || this.props.refreshOnly) this.HTML += skeleton.refreshIcon(this.props.instant ? 'instant' : 'refresh-icon');

		if (this.props.key === 'matchmaker_regions' && userPrefs.regionTimezones) {
			this.props.cols = 8;
			this.props.optDescriptions = MATCHMAKER_REGIONS.map(regionCode => getTimezoneByRegionKey('code', regionCode));
		}

		if ('userscriptReference' in props) {
			const userscript = props.userscriptReference;
			if (userscript.hasRan && !props.instant && props.type === 'bool' && props.value === false) {
				this.#disabled = true;
				this.props.desc = refreshToUnloadMessage;
			}
		}
		switch (props.type) {
			case 'bool':
				this.HTML += `<span class="setting-title">${props.title}</span> 
					<label class="switch">
							<input class="s-update" type="checkbox" ${props.value ? 'checked' : ''} ${this.#disabled ? 'disabled' : ''}/>
							<div class="slider round"></div>
					</label>`;
				this.updateKey = 'checked';
				this.updateMethod = 'onchange';
				break;
			case 'text':
				this.HTML += `<span class="setting-title">${props.title}</span>
					<span class="setting-input-wrapper">
							<input type="text" class="rb-input s-update inputGrey2" name="${props.key}" autocomplete="off" value="${props.value}"/>
					</span>`;
				this.updateKey = 'value';
				this.updateMethod = 'oninput';
				break;
			case 'num':
				this.HTML += `<span class="setting-title">${props.title}</span>
				<span class="setting-input-wrapper">
					<div class="slidecontainer">
						<input type="range" class="sliderM s-update-secondary" name="${props.key}"
							value="${props.value}" min="${props.min}" max="${props.max}" step="${props?.step ?? 1}"
						/>
					</div>
					<input type="number" class="rb-input s-update sliderVal" name="${props.key}" 
						autocomplete="off" value="${props.value}" min="${props.min}" max="${props.max}" step="${props?.step ?? 1}"
					/>
				</span>`;
				this.updateKey = 'valueAsNumber';
				this.updateMethod = 'onchange';
				break;
			case 'heading':
				this.HTML = `<h1 class="setting-title">${props.title}</h1>`;
				break;
			case 'sel':
				this.HTML += `<span class="setting-title">${props.title}</span>
          			<select class="s-update inputGrey2">
						${props.opts.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
					</select>`;
				this.updateKey = 'value';
				this.updateMethod = 'onchange';
				break;
			case 'multisel': {
				const hasValidDescriptions = hasOwn(this.props, 'optDescriptions') && this.props.opts.length === this.props.optDescriptions.length;
				if (hasOwn(this.props, 'optDescriptions') && !hasValidDescriptions) throw new Error(`Setting '${this.props.key}' declared 'optDescriptions', but a different amount than 'opts'!`);
				this.HTML += `<span class="setting-title">${props.title}</span>
					<div class="crankshaft-multisel-parent s-update" ${props?.cols ? `style="grid-template-columns:repeat(${props.cols}, 1fr)"` : ''}>
						${props.opts.map((opt, i) => `<label class="hostOpt">
							<span class="optName">${opt}</span>
							${hasValidDescriptions ? `<span class="optDescription">${this.props.optDescriptions[i]}</span>` : ''}
							<input type="checkbox" name="${opt}" ${(props.value as string[]).includes(opt) ? 'checked' : ''} />
							<div class="optCheck"></div>
						</label>`).join('')}
					</div>`;
				this.updateKey = 'value'; // this is bypassed anyway, because type === 'multisel'. '' throws
				this.updateMethod = 'onchange';
				break;
			}
			case 'color':
				this.HTML += `<span class="setting-title">${props.title}</span> 
					<label class="setting-input-wrapper">
							<input class="s-update" type="color" value="${props.value ? props.value : ''}" ${this.#disabled ? 'disabled' : ''}/>
					</label>`;
				this.updateKey = 'value';
				this.updateMethod = 'onchange'; // oninput works too, but will fire each frame the selector is dragged, causing performance drops. onchange will fire when the selector is closed, ultimately achieving the same effect.
				break;
			default:
				// @ts-ignore
				this.HTML = `<span class="setting-title">${props.title}</span><span>Unknown setting type</span>`;
		}

		// add desc
		if (Boolean(props.desc) && props.desc !== '') this.HTML += `<div class="setting-desc-new">${props.desc}</div>`;
	}


	/**
	 * update the settings when you change something in the gui
	 * not sure if you can currently synthetically update the settings, but at that point just change userPrefs and re-render?
	 */
	update(elem: HTMLElement, callback: 'normal' | 'userscript' | Function, event?: InputEvent) {
		if (this.updateKey === '') throw 'Invalid update key';
		const target = elem.querySelector('.s-update') as HTMLInputElement;

		// parse & sanitize the value from our input element
		let dirtyValue: UserPrefs[keyof UserPrefs] = target[this.updateKey];

		if (this.props.type === 'multisel') {
			dirtyValue = [...target.children]
				.filter(child => child.querySelector('input:checked'))
				.map(child => child.querySelector('.optName').textContent);
		}

		if (this.props.type === 'num') {
			dirtyValue = event ? (event.target as HTMLInputElement).valueAsNumber : target.valueAsNumber;
			const slider = elem.querySelector('.s-update-secondary') as HTMLInputElement;
			const setVal = (val: string) => { target.value = val; slider.value = val; };
			const updateUI = () => setVal(dirtyValue.toString());
			if (Number.isNaN(dirtyValue)) {
				setVal(userPrefs[this.props.key].toString());
				return; // revert UI and don't apply this change;
			}
			if (hasOwn(this.props, 'min') && dirtyValue < this.props.min) { dirtyValue = this.props.min; updateUI(); }
			if (hasOwn(this.props, 'max') && dirtyValue > this.props.max) { dirtyValue = this.props.max; updateUI(); }
			updateUI(); // synchronize slider and number inputs visually
		}

		const value = dirtyValue; // so we don't accidentally mutate it later

		if (callback === 'normal') {
			ipcRenderer.send('logMainConsole', `recieved an update for ${this.props.key}: ${value}`);
			userPrefs[this.props.key] = value;
			saveSettings();
			if (this.props.key === 'hideAds') {
				const adsHidden = value === 'hide' || value === 'block';
				toggleSettingCSS(styleSettingsCSS.hideAds, this.props.key, adsHidden);
				document.getElementById('hiddenClasses').classList.toggle('hiddenClasses-hideAds-bottomOffset', adsHidden);
			}

			// you can add custom instant refresh callbacks for settings here
			if (typeof value === 'boolean') {
				if (this.props.key === 'menuTimer') toggleSettingCSS(styleSettingsCSS.menuTimer, this.props.key, value);
				if (this.props.key === 'quickClassPicker') toggleSettingCSS(styleSettingsCSS.quickClassPicker, this.props.key, value);
				if (this.props.key === 'hideReCaptcha') toggleSettingCSS(styleSettingsCSS.hideReCaptcha, this.props.key, value);
			}
		} else if (callback === 'userscript') {
			if (typeof value !== 'boolean') throw `Callback cannot be "userscript" for non-boolean values, like: ${value.toString()}`;

			let refreshSettings = false;
			if ('userscriptReference' in this.props) {
				const userscript = this.props.userscriptReference;
				// I would normally check if the script has settings before forcing a settings refresh... but userscripts don't define their settings until they run, so it wouldn't hot-reload settings.
				// I hate that I have to take the lazy route but I don't see a way of extracting settings without loading the script.
				/* if ('settings' in userscript && Object.keys(userscript.settings).length > 0) */ refreshSettings = true
				// either the userscsript has not ran yet, or it's instant
				if (value && (!userscript.hasRan || this.props.instant)) {
					userscript.load();
					userscript.hasRan = true;
				} else if (!value) {
					if (this.props.instant && typeof userscript.unload === 'function') {
						userscript.unload();
					} else {
						elem.querySelector('.setting-desc-new').textContent = refreshToUnloadMessage;
						target.setAttribute('disabled', '');
						this.#disabled = true;
					}
				}
				ipcRenderer.send('logMainConsole', `userscript: recieved an update for ${userscript.name}: ${value}`);
				su.userscriptTracker[userscript.name] = value;
			} else {
				ipcRenderer.send('logMainConsole', `userscript: recieved an update for ${this.props.title}: ${value}`);
				su.userscriptTracker[this.props.title] = value;
			}
			saveUserscriptTracker();

			// krunkers transition takes .4s, this is more reliable than to wait for transitionend
			if (refreshSettings) setTimeout(renderSettings, 400);
		} else {
			// eslint-disable-next-line callback-return
			callback(value);
		}
		recalculateRefreshNeeded();
		try { refreshNotifElement.remove(); } catch (e) { }
		if (refreshNeeded > 0) {
			refreshNotifElement = createElement('div', {
				class: ['crankshaft-holder-update', 'refresh-popup'],
				innerHTML: skeleton.refreshElem(refreshNeeded)
			});
			document.body.appendChild(refreshNotifElement);
		}
	}


	/** this initializes the element and its eventlisteners.*/
	get elem() {
		if (this.#wrapper !== false) return this.#wrapper; // return the element if already initialized

		// i only create the element after .elem is called so i don't pollute the dom with virutal elements when making settings
		const classes = ['setting', 'settName', `safety-${this.props.safety}`, this.type];
		if (this.props.button) classes.push('has-button');

		const wrapper = createElement('div', {
			class: classes,
			id: `settingElem-${this.props.key}`,
			innerHTML: this.HTML
		});

		if (this.props.button) {
			const { icon, text, callback } = this.props.button;
			wrapper.appendChild(skeleton.settingButton(icon, text, callback, this.props.button.customTitle ?? void 0));
		}
		if (this.type === 'sel') wrapper.querySelector('select').value = String(this.props.value);
		if (typeof this.props.callback === 'undefined') this.props.callback = 'normal'; // default callback

		// @ts-ignore
		wrapper[this.updateMethod] = (event: InputEvent) => {
			this.update(wrapper, this.props.callback, event);
		};

		this.#wrapper = wrapper;
		return wrapper; // return the element
	}

}

/** a settings generation helper. has some skeleton elements and methods that make them. purpose: prevents code duplication */
const skeleton = {
	/** make a setting cateogry */
	category: (title: string, innerHTML: string, elemClass = 'mainSettings') => `
	<div class="setHed Crankshaft-setHed"><span class="material-icons plusOrMinus">keyboard_arrow_down</span> ${title}</div>
	<div class="setBodH Crankshaft-setBodH ${elemClass}">
			${innerHTML}
	</div>`,

	/** 
	 * make a setting with some text (notice) 
	 * @param desc description of the notice 
	 * @param opts desc => description, iconHTML => icon's html, generate through skeleton's *icon methods
	 */
	notice: (notice: string, opts?: { desc?: string, iconHTML?: string }) => `
	<div class="settName setting">
		${(opts?.iconHTML ?? false) ? opts.iconHTML : ''}
		<span class="setting-title crankshaft-gray">${notice}</span>
		${(opts?.desc ?? false) ? `<div class="setting-desc-new">${opts.desc}</div>` : ''}
	</div>`,

	/** wrapped safety warning icon (color gets applied through css) */
	safetyIcon: (safety: string) => `
	<span class="desc-icon" title="${safety}">
		<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M12 12.5ZM3.425 20.5Q2.9 20.5 2.65 20.05Q2.4 19.6 2.65 19.15L11.2 4.35Q11.475 3.9 12 3.9Q12.525 3.9 12.8 4.35L21.35 19.15Q21.6 19.6 21.35 20.05Q21.1 20.5 20.575 20.5ZM12 10.2Q11.675 10.2 11.463 10.412Q11.25 10.625 11.25 10.95V14.45Q11.25 14.75 11.463 14.975Q11.675 15.2 12 15.2Q12.325 15.2 12.538 14.975Q12.75 14.75 12.75 14.45V10.95Q12.75 10.625 12.538 10.412Q12.325 10.2 12 10.2ZM12 17.8Q12.35 17.8 12.575 17.575Q12.8 17.35 12.8 17Q12.8 16.65 12.575 16.425Q12.35 16.2 12 16.2Q11.65 16.2 11.425 16.425Q11.2 16.65 11.2 17Q11.2 17.35 11.425 17.575Q11.65 17.8 12 17.8ZM4.45 19H19.55L12 6Z"/></svg>
	</span>`,

	/** wrapped refresh icon (color gets applied through css) */
	refreshIcon: (mode: 'instant' | 'refresh-icon') => `
	<span class="desc-icon ${mode}" title="${mode === 'instant' ? 'Applies instantly! (No refresh of page required)' : 'Refresh page to see changes'}">
		<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M12 6v1.79c0 .45.54.67.85.35l2.79-2.79c.2-.2.2-.51 0-.71l-2.79-2.79c-.31-.31-.85-.09-.85.36V4c-4.42 0-8 3.58-8 8 0 1.04.2 2.04.57 2.95.27.67 1.13.85 1.64.34.27-.27.38-.68.23-1.04C6.15 13.56 6 12.79 6 12c0-3.31 2.69-6 6-6zm5.79 2.71c-.27.27-.38.69-.23 1.04.28.7.44 1.46.44 2.25 0 3.31-2.69 6-6 6v-1.79c0-.45-.54-.67-.85-.35l-2.79 2.79c-.2.2-.2.51 0 .71l2.79 2.79c.31.31.85.09.85-.35V20c4.42 0 8-3.58 8-8 0-1.04-.2-2.04-.57-2.95-.27-.67-1.13-.85-1.64-.34z"/></svg>
	</span>`,

	/** make a settings category header element */
	catHedElem: (title: string) => createElement('div', {
		class: 'setHed Crankshaft-setHed'.split(' '),
		innerHTML: `<span class="material-icons plusOrMinus">keyboard_arrow_down</span> ${title}`
	}),

	/** make a settings category body element */
	catBodElem: (elemClass: string, content: string) => createElement('div', {
		class: `setBodH Crankshaft-setBodH ${elemClass}`.split(' '),
		innerHTML: content
	}),

	refreshElem: (level: RefreshEnum) => {
		switch (level) {
			case RefreshEnum.reloadApp:
				return '<span class="restart-msg">Restart client fully to see changes</span>';
			case RefreshEnum.refresh:
				return `<span class="reload-msg">${skeleton.refreshIcon('refresh-icon')}Reload page with <code>F5</code> or <code>F6</code> to see changes</span>`;
			case RefreshEnum.notNeeded:
			default:
				return '';
		}
	},

	settingButton: (icon: string, text: string, callback: (e?: MouseEvent) => void, customTitle?: string) => {
		const button = createElement('div', {
			innerHTML: `<span class="material-icons">${icon}</span> ${text}`,
			class: ['settingsBtn'],
			title: customTitle ?? text
		});
		button.addEventListener('click', callback);
		return button;
	}
};

export function renderSettings() {
	// do the settingElem class instances still exist after we close settings?
	const settHolder = document.getElementById('settHolder');
	settHolder.textContent = '';

	settHolder.classList.add('Crankshaft-settings');

	settHolder.appendChild(skeleton.catHedElem(categoryNames[0].name));
	settHolder.appendChild(skeleton.catBodElem(categoryNames[0].cat, skeleton.notice('These settings need a client restart to work.')));

	const csSettings = new DocumentFragment();
	const settings: RenderReadySetting[] = transformMarrySettings(userPrefs, settingsDesc, 'normal');

	for (const setObj of settings) {
		const setElem = new SettingElem(setObj);
		const settElemMade = setElem.elem;

		if ('cat' in setObj) { // if category is specified
			const cat = categoryNames[setObj.cat];

			// create the given category if it doesen't exist
			if (csSettings.querySelector(`.${cat.cat}`) === null) {
				csSettings.appendChild(skeleton.catHedElem(cat.name));
				csSettings.appendChild(skeleton.catBodElem(cat.cat, ('note' in cat) ? skeleton.notice(cat.note) : ''));
			}

			// add to that category
			csSettings.querySelector(`.${cat.cat}`).appendChild(settElemMade);
		} else {
			// add to default category
			csSettings.querySelector('.setBodH.mainSettings').appendChild(settElemMade);
		}
	}

	if (userPrefs.userscripts) {
		csSettings.appendChild(skeleton.catHedElem('Userscripts'));
		if (su.userscripts.length > 0) {
			csSettings.appendChild(skeleton.catBodElem('userscripts', skeleton.notice('NOTE: refresh page to see changes', { iconHTML: skeleton.refreshIcon('refresh-icon') })));
		} else {
			csSettings.appendChild(skeleton.catBodElem('userscripts', skeleton.notice('No userscripts...',
				{ desc: `Go to the Crankshaft <a href="https://github.com/${repoID}#userscripts">README.md</a> to download some made by the client dev.` })));
		}

		// This array is used to store userscript settings HTML
		const customUserScriptSettingsElems: DocumentFragment[] = []
		const userscriptSettings: RenderReadySetting[] = su.userscripts
			.map(userscript => {
				const obj: RenderReadySetting = {
					key: userscript.name.replace(/.js$/, ''), // remove .js
					title: userscript.name,
					value: su.userscriptTracker[userscript.name],
					type: 'bool',
					desc: userscript.fullpath,
					safety: 0,
					userscriptReference: userscript,
					callback: 'userscript'
				};
				if (userscript.meta) { // render custom metadata if provided
					const thisMeta = userscript.meta;
					// Define low-scope variables because I can't be arsed to copy + paste the same ternary operator
					const scriptAuthor = ('author' in thisMeta && thisMeta.author) ? `${thisMeta.author}` : false
					const scriptName = ('name' in thisMeta && thisMeta.name) ? thisMeta.name : userscript.name
					const scriptHasSettings = ('settings' in userscript && Object.keys(userscript.settings).length > 0 && su.userscriptTracker[userscript.name])
					Object.assign(obj, {
						title: scriptName,
						desc: `${'desc' in thisMeta && thisMeta.desc ? thisMeta.desc.slice(0, 60) : ''}
						${scriptAuthor ? `&#8226; ${scriptAuthor}` : ''}
						${'version' in thisMeta && thisMeta.version ? `&#8226; v${thisMeta.version}` : ''}
						${'src' in thisMeta && thisMeta.src ? ` &#8226; <a target="_blank" href="${thisMeta.src}">source</a>` : ''}
						${scriptHasSettings ? `&#8226; Uses ${Object.keys(userscript.settings).length} Custom Settings` : ``}`
					});
					// Read and render script-defined settings
					if (scriptHasSettings) {
						// Create tracker for broken settings so that they aren't saved or modified.
						const brokenSettings: string[] = []
						// Create separate fragment so that script settings go at the bottom of the client page.
						const fragForUserscript = new DocumentFragment()
						// Create container for script, basically follows what y'all do above.
						const userscriptCategoryID: string = `${scriptName}by${scriptAuthor}`.replaceAll(' ', '').toLowerCase().replaceAll(/[^a-z0-9]/g, '')
						fragForUserscript.appendChild(skeleton.catHedElem(` ${scriptName} <span class='settings-Userscript-Author'>by ${scriptAuthor}</span>`));
						fragForUserscript.appendChild(skeleton.catBodElem(userscriptCategoryID, ``));
						// Create immutable variable for the userscript's settings for predictable behaviour
						const userScriptDefinedOptions: Record<string, UserscriptRenderReadySetting> = {... userscript.settings}
						// The object key that will store all the settings for a specific userscript
						const userscriptPrefsKey: string = userscript?.name?.replace(/.js$/, '') ?? userscriptCategoryID
						try {
							// We are re-applying saved settings here. We do also this on startup in userscripts.ts. This is so that if a script is hot-reloaded, its preferences are immediately re-applied.
							userscriptPreferences[userscriptPrefsKey] = {}
							loadUserScriptSettings(userscriptPrefsKey, userScriptDefinedOptions)
							// Loop through each custom setting and do stuff
							Object.keys(userScriptDefinedOptions).forEach(settingKey => {
								const setting: UserscriptRenderReadySetting = {...userScriptDefinedOptions[settingKey]}
								// This is a failsafe just in case a user adds a setting to a script without restarting the client. Not 100% sure if this is needed.
								if (userscriptPreferences[userscriptPrefsKey][settingKey] === undefined) userscriptPreferences[userscriptPrefsKey][settingKey] = setting.value
								// Check if the script creator made their settings dumb
								let settingIsMalformed: boolean | string = customSettingIsMalformed(setting);
								if (settingIsMalformed === false) {
									// Below, we're basically designating a default RenderReadySetting just in case the script creator omitted properties.
									const customSettingObject: RenderReadySetting = {
										key: settingKey ?? "UNDEFINED CUSTOM SETTINGS OPTION",
										title: "Unset Custom Setting Title: {title}",
										value: false,
										type: 'bool',
										safety: 0,
										callback: function(){}
									};
									// Apply defaults and squash objects.
									Object.assign(customSettingObject, setting, {
										value: userscriptPreferences[userscriptPrefsKey][settingKey],
										// We specifically apply the callback at the top level so that a userscript creator can't just define their own callback() and access the client directly through a userscript.
										callback: function (this: { settingKey: string, prefsKey: string, changed: Function }, value: UserPrefs[keyof UserPrefs]) {
											userscriptPreferences[this.prefsKey][this.settingKey] = value
											saveUserScriptSettings(this.prefsKey)
											this.changed(value)
										}.bind({ settingKey, prefsKey: userscriptPrefsKey, changed: setting.changed }) }
									)
									// Adding the entire constructed custom element to the DOM fragment
									const customOptionElem = new SettingElem(customSettingObject)
									fragForUserscript.querySelector(`.${userscriptCategoryID}`).appendChild(customOptionElem.elem)
								} else { 
									// If the custom setting is dumb, make sure it's never changed and the script creator gets a nice, big, very red warning about it.
									brokenSettings.push(settingKey)
									const brokenOptionWrapper = createElement('div', { class: ['setting', 'settName', 'safety-0', 'brokenCustomUserscriptSettingWrapper'], innerHTML: ``})
									const brokenOptionElem = createElement('div', { class: ['crankshaft-button-holder', 'setting', 'settName'], innerHTML: `<div class="setting-title brokenCustomUserscriptSettingTitle">Malformed Setting: ${settingKey}</div>
									<div class='setting-desc-new brokenCustomUserscriptSettingDesc'>Userscript Setting Validation error: ${settingIsMalformed}</div>` });
									brokenOptionWrapper.appendChild(brokenOptionElem)
									fragForUserscript.querySelector(`.${userscriptCategoryID}`).appendChild(brokenOptionWrapper)
								}
							})
						} catch (err) {
							strippedConsole.error(`Error creating custom settings for userscript: ${userscript.name}`, err)
						}
						// Add the 'reset defaults' button
						const defaultsItem = createElement('div', { class: ['crankshaft-button-holder', 'setting', 'settName'], innerHTML: `<span class="buttons-title">Reset ${scriptName} Settings</span>` });
						defaultsItem.appendChild(skeleton.settingButton('refresh', 'Reset Defaults', e => { userscriptSettingsResetDefaults(userscript.name.replace(/.js$/, '') ?? userscriptCategoryID, userScriptDefinedOptions, userscriptCategoryID, brokenSettings)}));
						fragForUserscript.querySelector(`.${userscriptCategoryID}`).appendChild(defaultsItem)
						// Add fragment to array of userscript options.
						customUserScriptSettingsElems.push(fragForUserscript)
					}
				}
				if (userscript.unload) {
					obj.instant = true;
				} else {
					obj.instant = false;
				}

				return obj;
			});
		
		// Apply custom userscript options to the settings fragment
		customUserScriptSettingsElems.forEach(fragment => { csSettings.appendChild(fragment) })
		document.querySelector('.Crankshaft-settings').textContent = '';
		document.querySelector('.Crankshaft-settings').append(csSettings); // append the DocumentFragment

		for (const i of userscriptSettings) {
			const userSet = new SettingElem(i);
			document.querySelector('.Crankshaft-settings .setBodH.userscripts').appendChild(userSet.elem);
		}
	} else {
		document.querySelector('.Crankshaft-settings').textContent = '';
		document.querySelector('.Crankshaft-settings').append(csSettings); // append the DocumentFragment
	}

	function toggleCategory(me: Element) {
		const sibling = me.nextElementSibling;
		sibling.classList.toggle('setting-category-collapsed');

		const iconElem = me.querySelector('.material-icons');
		if (iconElem.innerHTML.toString() === 'keyboard_arrow_down') iconElem.innerHTML = 'keyboard_arrow_right';
		else iconElem.innerHTML = 'keyboard_arrow_down';
	}

	const settHeaders = [...document.querySelectorAll('.Crankshaft-setHed')];
	settHeaders.forEach(header => {
		const collapseCallback = () => { toggleCategory(header); };
		try { header.removeEventListener('click', collapseCallback); } catch (e) { }
		header.addEventListener('click', collapseCallback);
	});

	const buttonsHolder = createElement('div', { class: ['crankshaft-button-holder', 'setting', 'settName'], innerHTML: '<span class="buttons-title">Quick open:</span>' });
	buttonsHolder.appendChild(skeleton.settingButton('file_open', 'Settings file', e => openPath(e, userPrefsPath)));
	buttonsHolder.appendChild(skeleton.settingButton('folder', 'Crankshaft folder', e => openPath(e, paths.configPath)));
	document.querySelector('.setBodH.Crankshaft-setBodH').prepend(buttonsHolder);
}
