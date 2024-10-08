// ==UserScript==
// @name Example Custom CSS Changer
// @author AspectQuote
// @version 1
// @desc Uses custom settings to change custom CSS.
// ==/UserScript==

let currentCSS = -1;
const customCSSes = [
    {
        name: "No CSS",
        css: ``
    },
    {
        name: "Hide Bottom Right Info Bar",
        css: `#mapInfoHolder {
            display: none !important;
        }`
    },
    {
        name: "Hide Krunker Logo",
        css: `#gameNameHolder, #seasonLabel {
            display: none !important;
        }`
    }
]

removeCSS = () => {
    this._css('', 'customcssindex' + currentCSS, false);
}

swapCSS = (cssIndex) => {
    removeCSS();
    if (cssIndex !== currentCSS) {
        this._css(customCSSes[cssIndex].css, 'customcssindex'+cssIndex, true);
    }
    currentCSS = cssIndex;
}

// remove the css when userscript is unloaded
this.unload = () => {
    removeCSS();
}

this.settings = {
    'usingcss': {
        title: "CSS to inject",
        type: 'sel',
        desc: "The custom CSS you want to use.",
        value: customCSSes[0].name,
        opts: customCSSes.map(item => item.name),
        changed: (newName) => {
            swapCSS(customCSSes.findIndex(item => item.name === newName));
        }
    }
}

return this;