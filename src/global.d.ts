
type UserPrefs = {
	[preference: string]: boolean | string;
};

interface UserscriptTracker {
	[script: string]: boolean;
}

interface InsertedCSS {
	[identifier: string]: string;
}

interface Userscript {
	name: string;
	fullpath: string;
	rawContent?: string;
	content?: string;
}

interface Window {
	errAlert: Function;
	OffCliV: boolean;
}

/*
 *	these setting type defs do look complicated but they just ensure a noob can easily create a new setting.
 *	basically, settings are SettingItemGeneric + a type: string. some types have extra fields, as you can see 
 */

type Callbacks = 'normal' | 'userscript' | Function;
type ValidTypes = 'bool' | 'heading' | 'text' | 'sel' | 'num';

interface SettingItemGeneric {
	title: string;
	desc?: string;
	safety: number;
	type: ValidTypes;

	// category
	cat?: number;

	// true means setting should show autorenew icon
	instant?: boolean;
}

// sel has to have an opts with a string array
interface SelectSettingDescItem extends SettingItemGeneric { type: 'sel', opts?: string[] }

// num has to have a min and max
interface NumSettingItem extends SettingItemGeneric { type: 'num', min?: number, max?: number }

type SettingsDescItem = (SettingItemGeneric | NumSettingItem | SelectSettingDescItem);

/** array of SettingDescItem objects */
interface SettingsDesc {
	[settingKey: string]: SettingsDescItem;
}

/** a render-ready setting. contains a SettingsDescItem + value, callback and key */
interface RenderReadySetting extends SettingItemGeneric {
	type: ValidTypes;

	// for sel
	opts?: string[];

	// for num
	min?: number;
	max?: number;

	// the data
	key: string;
	callback: 'normal' | 'userscript' | Function;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
}

interface CategoryName {
	n: string;
	c: string;
	note?: string;
}
