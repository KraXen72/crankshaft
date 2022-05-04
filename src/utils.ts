import { webFrame } from 'electron';
import { strippedConsole } from './preload';

// /<reference path="global.d.ts" />

const insertedCSS: InsertedCSS = {};

/**
 * inject css as a style tag
 */
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
export function createElement(type: string, options: Object = {}) {
	const element = document.createElement(type);

	Object.entries(options).forEach(([key, value]) => {
		if (key === 'class') {
			if (Array.isArray(value)) value.forEach((c: string) => { element.classList.add(c); });
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
