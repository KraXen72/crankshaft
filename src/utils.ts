import { webFrame } from 'electron';
import { strippedConsole } from './preload';

/// <reference path="global.d.ts" />

const insertedCSS: InsertedCSS = {};

/** inject css as a style tag */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const injectSettingsCSS = (css: string, identifier = 'settings') => {
	webFrame.insertCSS(css);
};

// create element util function. source is my utils lib: https://github.com/KraXen72/roseboxlib/blob/master/esm/lib.js
/**
 * create a dom element given an object of properties
 * @param type element type, e.g. "div"
 * @param options options for the element. like class, id, etc
 * @returns element
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function createElement(type: string, options: Object = {}) {
	const element = document.createElement(type);

	Object.entries(options).forEach(([key, value]) => {
		if (key === 'class') {
			if (Array.isArray(value)) value.forEach((cls: string) => { element.classList.add(cls); });
			else element.classList.add(value);
			return;
		}

		if (key === 'dataset') {
			Object.entries(value).forEach(entry => {
				const [dataKey, dataValue] = entry;

				element.dataset[dataKey] = (dataValue as string);
			});
			return;
		}

		if (key === 'text') {
			element.textContent = value;
			return;
		}
		if (key === 'innerHTML') {
			element.innerHTML = value;
			return;
		}
		element.setAttribute(key, value);
	});

	return element;
}

/**
 * inject or uninject css to hide ads
 * @param value 'toggle'|Boolean
 */
export function toggleSettingCSS(css: string, identifier: string, value: ('toggle' | boolean) = 'toggle') {
	function inject() {
		insertedCSS[identifier] = webFrame.insertCSS(css);
	}

	function uninject() {
		try {
			webFrame.removeInsertedCSS(insertedCSS[identifier]);
			delete insertedCSS[identifier];
		} catch (error) {
			strippedConsole.error("couldn't uninject css: ", error);
		}
	}

	if (value === 'toggle') {
		// normal toggle
		if (!(identifier in insertedCSS)) inject();
		else uninject();
	} else if (!(identifier in insertedCSS) && value === true) {
		inject();
	} else if (identifier in insertedCSS && value === false) {
		uninject();
	}
}

export function userscriptToggleCSS(css: string, identifier: string, value: ('toggle' | boolean) = 'toggle') {
	const reservedKeywords = ['menuTimer', 'hideAds', 'hideReCaptcha'];
	if (!reservedKeywords.includes(identifier)) toggleSettingCSS(css, identifier, value);
	else strippedConsole.error(`identifier '${identifier}' is reserved by crankshaft. Try something else.`);
}

export function debounce(func: Function, timeout = 300) {
	// eslint-disable-next-line init-declarations
	let timer: NodeJS.Timeout;

	// @ts-ignore
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => { func.apply(this, args); }, timeout);
	};
}

export function hiddenClassesImages(classNumberFallback: number) {
	const wrapper = document.getElementById('hiddenClasses');
	const prepend = (wrapper ? (wrapper.firstChild as HTMLElement).id : 'menuClassPicker0').slice(0, -1);
	const count = wrapper ? wrapper.children.length : classNumberFallback;
	const wrapperFull = wrapper !== null && wrapper.children.length > 0;

	let css = '';

	/*
	 * 810 is krunker's set middle element size
	 * for each gap (count - 1) we substract 4px for gap
	 * Math.min is a safety measure in case the buttons would be < 50px
	 */
	const buttonSize = Math.min(Math.round((810 - (4 * (count - 1))) / count), 50);
	css += `#hiddenClasses [id^="menuClassPicker"] {
		width: ${buttonSize}px; height: ${buttonSize}px;
		background-size: ${buttonSize - 6}px ${buttonSize - 6}px; 
	}`;

	if (wrapperFull) {
		[...wrapper.children].forEach(child => {
			css += `${child.id} { background-image: url("https://assets.krunker.io/textures/classes/icon_${child.id.replace(prepend, '')}.png"); } \n`;
		});
	} else { // the fallback is almost always used...
		for (let i = 0; i < count; i++) css += `#${prepend}${i} { background-image: url("https://assets.krunker.io/textures/classes/icon_${i}.png"); } \n`;
	}

	return css;
}

export function secondsToTimestring(num: number) {
	const minutes = Math.floor(num / 60);
	const seconds = num % 60;

	if (minutes < 1) return `${num}s`;
	return `${minutes}m ${seconds}s`;
}