// ==UserScript==
// @name Example Custom Settings Script
// @author AspectQuote
// @version 1
// @desc Example custom settings script.
// ==/UserScript==

this.settings = {
    "customSetting1": {
        "title": "Custom Boolean Setting",
        "desc": "A boolean option, can be flipped 'on' (true) or 'off' (false).",
        "type": "bool",
        "value": true,
        changed: function (value) { this._console.log(value) } // This will throw an error, as declaring a function as a block changes the scope of the function, thus we cannot use console.log
    },
    "customSetting2": {
        "title": "Custom Color Setting",
        "desc": "Custom color option, defaults to red. (#ff0000)",
        "type": "color",
        "value": "#ff0000",
        changed: (value) => { this._console.log(value) }
    },
    "customSetting3": {
        "title": "Custom Selection Setting",
        "desc": "Custom selection option, includes 3 options to pick from.",
        "type": "sel",
        "opts": ["ExampleOption1", "ExampleOption2", "ExampleOption3"],
        "value": "ExampleOption1",
        changed: (value) => { this._console.log(value) }
    },
    "customSetting4": {
        "title": "Custom Number Setting (With optional properties)",
        "desc": "Number option with optional properties.",
        type: 'num',
        min: 0,
        max: 10,
        step: 0.1,
        "value": 5,
        changed: (value) => { this._console.log(value) }
    },
    "customSetting5": {
        "title": "Custom Number Setting (Without optional properties)",
        type: 'num',
        "value": 1000,
        changed: (value) => { this._console.log(value) }
    },
    "brokenCustomSettingExample": {
        "title": "Broken Setting",
        "desc": "This is meant to be broken.",
        type: 'num',
        min: 0,
        max: 10,
        step: 0.1,
        "value": "thisStringBreaksThisSetting",
        changed: (value) => { this._console.log(value) }
    },
    "brokenCustomSettingExample2": {}
}

return this