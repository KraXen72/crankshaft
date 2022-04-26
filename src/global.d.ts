
type userPrefs = {
    [preference: string]: Boolean | string
}

interface userscriptTracker {
    [script: string]: Boolean
}

interface insertedCSS {
    [identifier: string]: string
}

interface userscript {
    name: string,
    fullpath: string,
    rawContent?: string,
    content?: string
}

interface Window {
    errAlert: Function,
    OffCliV: Boolean
}

// these setting type defs do look complicated but they just ensure a noob can easily create a new setting.
// basically, settings are SettingItemGeneric + a type: string. some types have extra fields, as you can see
type callbacks = "normal" | "userscript" | Function
type validTypes = "bool" | "heading" | "text" | "sel" | "num"

interface SettingItemGeneric {
    title: string,
    desc?: string,
    safety: number
    type: validTypes,
    cat?: number //category
    instant?: Boolean //true means setting should show autorenew icon
}
interface SelectSettingDescItem extends SettingItemGeneric { type: 'sel', opts?: string[] } //sel has to have an opts with a string array
interface NumSettingItem extends SettingItemGeneric { type: 'num', min?: number, max?: number } //num has to have a min and max

type SettingsDescItem = ( SettingItemGeneric | NumSettingItem | SelectSettingDescItem )

/** array of SettingDescItem objects */
interface SettingsDesc {
    [settingKey: string]: SettingsDescItem
}

/** a render-ready setting. contains a SettingsDescItem + value, callback and key */
interface renderReadySetting extends SettingItemGeneric {
    type: validTypes,
    // for sel
    opts?: string[],
    //for num
    min?: number,
    max?: number,

    //the data
    key: string,
    callback: 'normal' | 'userscript' | Function,
    value: any
}

interface categoryName {
    n: string,
    c: string,
    note?: string
}