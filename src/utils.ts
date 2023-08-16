import { webFrame } from 'electron';
import { strippedConsole } from './preload';

/// <reference path="global.d.ts" />

const insertedCSS: InsertedCSS = {};

/** inject css as a style tag */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const injectSettingsCSS = (css: string, identifier = 'settings') => {
	webFrame.insertCSS(css);
};

export const hasOwn = (object: Object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
export const repoID = 'KraXen72/crankshaft';

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

/** @param classesCount how many classes krunker currently has (custom-only included) */
export function hiddenClassesImages(classesCount: number) {
	const prepend = 'menuClassPicker0'.slice(0, -1);

	const gaps = (4 * (classesCount - 1)); // for each gap (classesCount - 1) we substract 4px
	const theoreticalButtonSize = Math.round((810 - gaps) / classesCount); // 810 is krunker's hardcoded middle element width
	const buttonSize = Math.min(theoreticalButtonSize, 50); // safety measure in case the buttons would be < 50px

	let css = `#hiddenClasses [id^="menuClassPicker"] {
		width: ${buttonSize}px; height: ${buttonSize}px;
		background-size: ${buttonSize - 6}px ${buttonSize - 6}px; 
	}\n`;

	for (let i = 0; i < classesCount; i++) css += `#${prepend}${i} { background-image: url("https://assets.krunker.io/textures/classes/icon_${i}.png"); } \n`;

	return css;
}

export function secondsToTimestring(num: number) {
	const minutes = Math.floor(num / 60);
	const seconds = num % 60;

	if (minutes < 1) return `${num}s`;
	return `${minutes}m ${seconds}s`;
}

// https://www.30secondsofcode.org/js/s/arrays-have-same-contents/

// eslint-disable-next-line
export function haveSameContents(array1: any[], array2: any[]) {
	for (const value of new Set([...array1, ...array2])) if (array1.filter(e => e === value).length !== array2.filter(e => e === value).length) return false;
	return true;
}
