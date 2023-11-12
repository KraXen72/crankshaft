export const customSettingIsMalformed = function(customUserScriptSetting: UserscriptRenderReadySetting): boolean | string {
    let settingIsMalformed: string | boolean = false
    const setting = customUserScriptSetting
    switch (setting.type) {
        case 'num':
            if (typeof setting.value !== "number") {
                settingIsMalformed = `'${setting.value}' (${typeof setting.value}) is NOT a valid value for setting type '${setting.type}.'`
            } else if ('min' in setting && typeof setting.min !== "number") {
                settingIsMalformed = `'${setting.min}' is NOT a valid value for 'num' minimum value: .min MUST be a number.`
            } else if ('max' in setting && typeof setting.max !== "number") {
                settingIsMalformed = `'${setting.min}' is NOT a valid value for 'num' maximum value: .max MUST be a number.`
            } else if ('min' in setting && 'max' in setting && setting.min > setting.max) {
                settingIsMalformed = `Setting .min value cannot be greater than setting .max value.`
            } else if ('step' in setting && setting.step < 0) {
                settingIsMalformed = `Setting .step value cannot be less than zero.`
            } else if ('step' in setting && 'min' in setting && 'max' in setting && setting.step > setting.max - setting.min) {
                settingIsMalformed = `Setting .step value cannot be greater than the difference between the .min and .max.`
            }
            break;
        case 'bool':
            if (typeof setting.value !== "boolean") {
                settingIsMalformed = `'${setting.value}' (${typeof setting.value}) is NOT a valid value for setting type '${setting.type}.'`
            }
            break;
        case 'sel':
            if (!('opts' in setting)) {
                settingIsMalformed = `Setting type 'sel' requires property .opts as an array with each option for this setting. (Example: {opts: ['option1', 'option2'...]})`
            } else if (!Array.isArray(setting.opts)) {
                settingIsMalformed = `Setting type 'sel' requires the .opts property to be an ARRAY! (Example: {opts: ['option1', 'option2'...]})`
            } else if (setting.opts.find(option => !['number', 'string'].includes(typeof option))) {
                settingIsMalformed = `All options (.opts) in setting type 'sel' need to be either NUMBERs or STRINGs.`
            } else if (setting.opts.find(option => typeof option !== typeof setting.opts[0])) {
                settingIsMalformed = `All options (.opts) in setting type 'sel' need to be the same type! (You cannot have both STRING and NUMBER options.)`
            } else if (setting.opts.length < 2) {
                settingIsMalformed = `Setting type 'sel' must have at least 2 options to choose from!`
            } else if (!setting.opts.includes(setting.value as string)) {
                settingIsMalformed = `Setting type 'sel' must have its value set to one of the options defined in .opts! (${setting.opts.join(',')})`
            }
            break;
        case 'color':
            if (typeof setting.value !== "string") {
                settingIsMalformed = `'${setting.value}' (${typeof setting.value}) is NOT a valid value for setting type '${setting.type}.'`
            } else {
                if (!setting.value.match(/^#([0-9a-fA-F]{3}){2}$/g)) {
                    settingIsMalformed = `'${setting.value}' is not a valid color. Use #ffffff`
                }
            }
            break;
        default:
            settingIsMalformed = `'${setting.type}' is NOT a valid setting type.`
            break;
    }
    if (('title' in setting) && setting.title.length < 1) {
        settingIsMalformed = `'${setting?.title}' is NOT a valid setting title.`
    }
    if (!('changed' in setting)) {
        settingIsMalformed = `Custom setting requires .changed() function property.`
    } else if (typeof setting.changed !== 'function') {
        settingIsMalformed = `Custom setting .changed property MUST be a function. (Example: {changed: (value) => {}})`
    }

    return settingIsMalformed
}

export const customSettingSavedJSONIsNotMalformed = function (settingKey: string, settings: Record<string, UserscriptRenderReadySetting>, settingsJSON: Record<string, UserPrefValue>): boolean {
    // Comparison chain basically validates the settings JSON
    return (settingKey in settings && // Make sure setting key is a changeable/registered key
    typeof settings[settingKey].changed === "function" &&  // Make sure setting key has a changed function
    settingsJSON[settingKey] !== settings[settingKey].value && // Make sure you aren't applying changes unnecissarily
    typeof settingsJSON[settingKey] === typeof settings[settingKey].value) // Ensure the saved and scripted values are of the same type
}