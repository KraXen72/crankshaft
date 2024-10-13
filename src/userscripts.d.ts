type userScriptSettingBase<ValueType> = {
    title: string,
    desc: string,
    changed: (value: ValueType) => void
}

type userscriptBooleanOption = userScriptSettingBase<boolean> & {
    type: "bool",
    value: boolean
}

type userscriptNumberOption = userScriptSettingBase<number> & {
    type: "num",
    value: number,
    min?: number,
    max?: number,
    step?: number
}

type userscriptStringSelectionOption = userScriptSettingBase<string> & {
    type: "sel",
    value: string,
    opts: string[]
}

type userscriptNumberSelectionOption = userScriptSettingBase<number> & {
    type: "sel",
    value: number,
    opts: number[]
}

type userScriptCustomOption = userscriptBooleanOption | userscriptNumberOption | userscriptNumberSelectionOption | userscriptStringSelectionOption;

type userScriptCustomSettings = {
    [key: string]: userScriptCustomOption
}

export type userScriptReturnObject = {
    unload: () => void,
    settings: userScriptCustomSettings
}