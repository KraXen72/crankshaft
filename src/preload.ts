import * as fs from 'fs';
import * as path from 'path';
import { ipcRenderer } from 'electron';
import 'v8-compile-cache';
import { injectSettingsCss, createElement, toggleSettingCSS } from './utils';
import { renderSettings } from './settingsui';
///<reference path="global.d.ts" />

// get rid of client unsupported message
window.OffCliV = true;
const strippedConsole = {
    error: console.error.bind(console) as Function, 
    log: console.log.bind(console) as Function, 
    warn: console.warn.bind(console) as Function
}

/** simple error message for usercripts. can be called from the userscript itself */
const errAlert = (err: Error, name: string) => {
    alert(`Userscript '${name}' had an error:\n\n${err.toString()}\n\nPlease fix the error, disable the userscript in the 'tracker.json' file or delete it.\nFeel free to check console for stack trace`)
}

/** sharedUserscriptData */
export const su = {
    userscriptsPath: "",
    userscriptTrackerPath: "",
    userscripts: <userscript[]>[],
    userscriptTracker: <userscriptTracker>{}
}
const $assets = path.resolve(__dirname, "..", "assets")

// Lets us exit the game lmao
document.addEventListener("keydown", (event) => {
    if (event.code == "Escape") {
        document.exitPointerLock();
    }
})

// Settings Stuff
document.addEventListener("DOMContentLoaded", (event) => {
    ipcRenderer.send('preloadNeedSettings');
    // Side Menu Settings Thing
    const settingsSideMenu = document.querySelectorAll('.menuItem')[6];
    //settingsSideMenu.setAttribute("onclick", "showWindow(1);SOUND.play(`select_0`,0.15);window.windows[0].changeTab(0)");
    settingsSideMenu.addEventListener("click", (event) => { UpdateSettingsTabs(0, true); });

    //@ts-ignore cba to add it to the window interface
    try { window.windows[0].toggleType({checked: true}) } catch (e) {  }
})

ipcRenderer.on('preloaduserscriptsPath', (event, recieved_userscriptsPath: string) => {
    su.userscriptsPath = recieved_userscriptsPath
    su.userscriptTrackerPath = path.resolve(su.userscriptsPath, "tracker.json")

    //init the userscripts (read, map and set up tracker)

    //remove all non .js files, map to {name, fullpath}
    su.userscripts = fs.readdirSync(su.userscriptsPath, {withFileTypes: true})
        .filter(entry => entry.name.endsWith(".js"))
        .map(entry => ({name: entry.name, fullpath: path.resolve(su.userscriptsPath, entry.name).toString()}))
    
    let tracker: userscriptTracker = {}
    su.userscripts.forEach(u => tracker[u.name] = false) //fill tracker with falses, so new userscripts get added disabled
    Object.assign(tracker, JSON.parse(fs.readFileSync(su.userscriptTrackerPath, {encoding: "utf-8"}))) //read and assign the tracker.json
    fs.writeFileSync(su.userscriptTrackerPath, JSON.stringify(tracker, null, 2), {encoding: "utf-8"}) //save with the new userscripts

    su.userscriptTracker = tracker
    
    //run the code in the userscript
    su.userscripts.forEach(u => {
        if (tracker[u.name]) { //if enabled
            const rawContent = fs.readFileSync(u.fullpath, { encoding: "utf-8" })
            let content: {code: string, warnings: string[]}
            let hadToTransform = true


            if (rawContent.startsWith('"use strict"')) {
                content = {code: rawContent, warnings: []}
                hadToTransform = false
            } else {
                try {
                    content = require('esbuild').transformSync(rawContent, { minify: true, banner: '"use strict"' })
                } catch (error) {
                    errAlert(error, u.name)
                    strippedConsole.error(error)
                }
            }
            
            if (content.warnings.length > 0) { strippedConsole.warn(`'${u.name}' compiled with warnings: `, content.warnings) }
            u.content = content.code

            let code = new String(content.code)
            try {
                //@ts-ignore
                (new Function(code)());
            } catch (error) {
                errAlert(error, u.name)
                strippedConsole.error(error)
            }

            strippedConsole.log(
                `%c[cs]${hadToTransform ? '%c[esbuilt]' : '%c[strict]'} %cran %c'${u.name.toString()}' `, 
                "color: lightblue; font-weight: bold;", hadToTransform ? "color: orange" : "color: #62dd4f", 
                "color: white;", "color: lightgreen;"
            )
        }
    })
})

/** actual css for settings that are style-based (hide ads, etc)*/
export const styleSettingsCss = {
    hideAds: `#aMerger,#aHolder,#adCon,#braveWarning,.endAHolder { display: none !important }`,
    menuTimer: fs.readFileSync(path.join($assets, 'menuTimer.css'), {encoding: "utf-8"})
}

ipcRenderer.on('injectClientCss', (event, injectSplash, {hideAds, menuTimer}, userscripts, version) => {
    const splashId = "Crankshaft-splash-css"
    const settId = "Crankshaft-settings-css"
    
    if (document.getElementById(settId) === null) {
        const settCss = fs.readFileSync(path.join($assets, 'settingCss.css'), {encoding: "utf-8"})
        injectSettingsCss(settCss, settId)
    }
    
    if (document.getElementById(splashId) === null && injectSplash === true) {
        let splashCSS = fs.readFileSync(path.join($assets, 'splashCss.css'), {encoding: "utf-8"})
        injectSettingsCss(splashCSS, splashId)
        const initLoader = document.getElementById("initLoader")
        if (initLoader === null) {throw "Krunker didn't create #initLoader"}
        
        initLoader.appendChild(createElement("svg", {
            id: "crankshaft-logo",
            innerHTML: fs.readFileSync(path.join($assets, "splashLogoFragment.html"))
        }))

        //make our won bottom corner holders incase krunker changes it's shit. we only rely on the loading text from krunker.
        try { document.querySelector("#loadInfoRHolder").remove() } catch (e) {  }
        try { document.querySelector("#loadInfoLHolder").remove() } catch (e) {  } 
        initLoader.appendChild(createElement("div", {class: "crankshaft-holder-l", id: "#loadInfoLHolder", text: `v${version}`}))
        initLoader.appendChild(createElement("div", {class: "crankshaft-holder-r", id: "#loadInfoRHolder", text: /*`KraXen72 & LukeTheDuke`*/ `Client by KraXen72`}))
    }

    //TODO rewrite, this is not well scalable
    if (hideAds) { toggleSettingCSS(styleSettingsCss.hideAds, "hideAds", true) }
    if (menuTimer) { toggleSettingCSS(styleSettingsCss.menuTimer, "menuTimer", true) }
    if (userscripts) { ipcRenderer.send("preloadNeedsuserscriptsPath") }
});


/**
 * make sure our setting tab is always called as it should be and has the proper onclick
 */
function UpdateSettingsTabs(activeTab: number, hookSearch = true) {
    const activeClass ="tabANew"

    //we yeet basic settings. its advanced now. deal with it.
    //@ts-ignore
    if (window.windows[0].settingsType === "basic") { window.windows[0].toggleType({checked: true}) }
    //document.querySelector(".advancedSwitch").style.display = "none"

    if (hookSearch) { 
        // only hook search ONCE to ensure the client settings still work while searching. 
        // it will not yield the client settings tho, that's pain to implement
        hookSearch = false
        const settSearchCallback = () => { UpdateSettingsTabs(0, hookSearch) }
        try { document.getElementById("settSearch").removeEventListener("input", settSearchCallback) } catch (e) {}
        document.getElementById("settSearch").addEventListener("input", settSearchCallback)
    }

    const advSliderElem = document.querySelector(".advancedSwitch input#typeBtn")
    const advSwitchCallback = () => { 
        advSliderElem.setAttribute("disabled", "disabled")
        setTimeout(() => {
            advSliderElem.removeAttribute("disabled")
            UpdateSettingsTabs(0, true) 
        }, 700) 
    }
    try { advSliderElem.removeEventListener("change", advSwitchCallback) } catch (e) { }
    advSliderElem.addEventListener("change", advSwitchCallback)

    //modifications we do the the dom:

    const tabs = [...document.getElementById('settingsTabLayout').children]
    const clientTab = tabs[tabs.length - 1]
    const selectedTab = document.querySelector(`#settingsTabLayout .${activeClass}`)
    
    //clientTab.textContent = "Crankshaft"

    try { clientTab.removeEventListener("click", renderSettings) } catch (e) {}
    clientTab.addEventListener("click", renderSettings)

    if (selectedTab === clientTab) {
        renderSettings()
    }

    for (let i = 0; i < tabs.length; i++) {
        const currentTabCallback = () => { UpdateSettingsTabs(i, hookSearch) }
        try { tabs[i].removeEventListener("click", currentTabCallback) } catch (e) {  }
        tabs[i].addEventListener("click", currentTabCallback)

        if (i == activeTab) { // if the current selected tab is our settings, just add active class
            tabs[i].classList.add(activeClass)
        }
    }
}