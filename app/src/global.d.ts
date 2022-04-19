
interface userPrefs {
    [preference: string]: Boolean | string
}

interface userscriptTracker {
    [script: string]: Boolean
}

interface userscript {
    name: string,
    fullpath: string,
    content: string
}

interface SettingsDescItem {
    title: string,
    type: 'bool' | 'sel' | 'heading' | 'text' | 'num',
    desc?: string,
    desclines?: number,
    safety: number,
    reload: number,
    //for 'num'
    min?: number,
    max?: number,
    //for 'sel'
    opts?: string[],
    value?: any,
    key?: any,
    callback?: "normal" | "userscript" | Function 
}

interface SettingsDesc {
    [settingKey: string]: SettingsDescItem
}