import * as fs from 'fs';
import * as path from 'path';
import { ipcRenderer } from 'electron';
import 'v8-compile-cache';
import { injectSettingsCss, createElement, toggleAdhideCSS } from './utils';
///<reference path="global.d.ts" />

// get rid of client unsupported message
//@ts-ignore
window.OffCliV = true;

let userPrefs: userPrefs
let userPrefsPath: string
let userscriptPath: string
let userscriptPathTracker: string
let userscripts: userscript[]
let userscriptTracker: userscriptTracker

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
    settingsSideMenu.setAttribute("onclick", "showWindow(1);SOUND.play(`select_0`,0.15);window.windows[0].changeTab(0)");
    settingsSideMenu.addEventListener("click", (event) => {
        UpdateSettingsTabs(0, true);
    });
    //@ts-ignore
    try { window.windows[0].toggleType({checked: true}) } catch (e) {  }
})

ipcRenderer.on('preloadSettings', (event, preferences, version, filedir) => {
    //preload sends us the path to settings and also settings themselves on initial load.
    let filePath = preferences;
    userPrefsPath = filePath
    userPrefs = JSON.parse(fs.readFileSync(filePath, {encoding: "utf-8"}));
});

ipcRenderer.on('preloadUserscriptPath', (event, recieved_userscriptPath: string) => {
    userscriptPath = recieved_userscriptPath

    userscriptPathTracker = path.resolve(userscriptPath, "tracker.json")
    userscripts = fs.readdirSync(userscriptPath, {withFileTypes: true})
        .filter(entry => entry.name.endsWith(".js"))
        .map(entry => {
            const name = entry.name
            const fullpath = path.resolve(userscriptPath, name).toString()
            const rawContent = fs.readFileSync(fullpath, {encoding: "utf-8"})
            let content = require('esbuild').transformSync(rawContent, { minify: true })
            if (content.warnings.length > 0) { 
                console.warn(`'${name}' has warnings: `, content.warnings) 
            }
            
            content = content.code

            return {name: name, fullpath, content}
        })
    let tracker: userscriptTracker = {}
    userscripts.forEach(u => tracker[u.name] = false)
    Object.assign(tracker, JSON.parse(fs.readFileSync(userscriptPathTracker, {encoding: "utf-8"})))
    fs.writeFileSync(userscriptPathTracker, JSON.stringify(tracker, null, 2), {encoding: "utf-8"})

    //run the code in the userscript
    //TODO figure out how to "use strict"
    userscripts.forEach(u => {
        if (tracker[u.name]) {
            let code = new String(u.content)
            //@ts-ignore
            Function(code)();
            console.log(
                `%c[cs] %cran %c'${u.name.toString()}'`, 
                "color: lightblue; font-weight: bold;", 
                "color: white;", "color: lightgreen;"
            )
        }
    })
    userscriptTracker = tracker
    //console.log(userscripts)
})

ipcRenderer.on('injectClientCss', (event, injectSplash, hideAds, userscripts, version) => {
    const splashId = "Crankshaft-splash-css"
    const settId = "Crankshaft-settings-css"
    
    if (document.getElementById(settId) === null) {
        const settCss = fs.readFileSync(path.resolve(__dirname, 'assets', 'settingCss.css'), {encoding: "utf-8"})
        injectSettingsCss(settCss, settId)
    }
    
    if (document.getElementById(splashId) === null && injectSplash === true) {
        let splashCSS = fs.readFileSync(path.resolve(__dirname, 'assets', 'splashCss.css'), {encoding: "utf-8"})
        //console.log(path.resolve(__dirname, "aieGears.png"))
        //splashCSS += ` #initLoader {background-image: url("crankshaft://${path.resolve(__dirname, "assets", "aieGears.png")}") !important;}`
        injectSettingsCss(splashCSS, splashId)
        const initLoader = document.getElementById("initLoader")
        if (initLoader === null) {throw "Krunker didn't create #initLoader"}
        
        initLoader.appendChild(createElement("svg", {
            id: "crankshaft-logo",
            innerHTML: fs.readFileSync(path.resolve(__dirname, "assets", "splashLogoFragment.html"))
        }))

        //make our won bottom corner holders incase krunker changes it's shit. we only rely on the loading text from krunker.
        try { document.querySelector("#loadInfoRHolder").remove() } catch (e) {  }
        try { document.querySelector("#loadInfoLHolder").remove() } catch (e) {  } 
        initLoader.appendChild(createElement("div", {class: "crankshaft-holder-l", id: "#loadInfoLHolder", text: `v${version}`}))
        initLoader.appendChild(createElement("div", {class: "crankshaft-holder-r", id: "#loadInfoRHolder", text: /*`KraXen72 & LukeTheDuke`*/ `Client by KraXen72`}))
    }

    if (hideAds) { toggleAdhideCSS(true) }
    if (userscripts) { ipcRenderer.send("preloadNeedsUserscriptPath") }
});




/**
 * make sure our setting tab is always called as it should be and has the proper onclick
 */
function UpdateSettingsTabs(activeTab: number, hookSearch = true) {
    // Settings Menu
    //ipcRenderer.send("logMainConsole", windows[0].searchList)

    //we yeet basic settings. its advanced now. deal with it.
    //@ts-ignore
    if (window.windows[0].settingsType === "basic") { window.windows[0].toggleType({checked: true}) }
    //document.querySelector(".advancedSwitch").style.display = "none"

    if (hookSearch) { 
        // only hook search ONCE to ensure the client settings still work while searching. 
        // it will not yield the client settings tho, that's pain to implement
        const settSearchCallback = () => { UpdateSettingsTabs(0, false) }
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

    const tabs = document.getElementById('settingsTabLayout').children
    const clientTab = tabs[tabs.length - 1]
    
    clientTab.textContent = "Crankshaft"

    try { clientTab.removeEventListener("click", renderSettings) } catch (e) {}
    clientTab.addEventListener("click", renderSettings)

    //re-hook all tabs so the name stays the same and onclick
    const settingTabArray = document.getElementById('settingsTabLayout').children;
    for (let i = 0; i < settingTabArray.length; i++) {
        //TODO this might not want to run for every tab?
        const currentTabCallback = () => {UpdateSettingsTabs(i, true)}
        try { settingTabArray[i].removeEventListener("click", currentTabCallback) } catch (e) {  }
        settingTabArray[i].addEventListener("click", currentTabCallback)

        if (i == activeTab) { // if the current selected tab is our settings, just add active class
            settingTabArray[i].setAttribute('class', 'settingTab tabANew');
        }
    }
}

// const userscriptDisclaimer = [
//     "Enable userscript support. place .js files in Documents/Crankshaft/scripts",
//     "Use userscripts at your own risk, the author(s) of this client are not responsible for any damage done with userscripts because the user is the author of the script.",
//     "Enabling any userscript you don't trust and know how it works is NOT RECOMMENDED",
//     "Any userscripts that modify the game's canvas (Renderer) are NOT ALLOWED
// ].join("\n")

//safety: 0: ok setting/recommended, 1: ok but not recommended, 2: not recommended but go ahead, 3: experimental, 4: experimental and unstable
//     normal text color            gray text color             yellow text color                orange text color       red text color


//this is based on my generative settings from https://github.com/KraXen72/glide, precisely https://github.com/KraXen72/glide/blob/master/settings.js
//they are modified here to fit krunker

//note by KraXen: this might look scary, but it's just extra info needed to make a nice gui
// each setting has these things: title, type: {'bool' | 'sel' | 'heading' | 'text' | 'num'}, desc and safety(0-4)
// some have some extra stuff, like selects have opts for options.
// leaving desc as "" will cause it to not render the helper question mark
const settingsDesc: SettingsDesc = {
    fpsUncap: {title: "Un-cap FPS", type: "bool", desc: "", safety: 0, reload: 2},
    fullscreen: {title: "Start in Fullscreen", type: "bool", desc: "", safety: 0, reload: 2},
    "angle-backend": {title: "ANGLE Backend", type: "sel", opts: ["default","gl","d3d11","d3d9","d3d11on12","vulkan"], safety: 0, reload: 2},   
    inProcessGPU: {title: "In-Process GPU (video capture)", type: "bool", desc: "Enables video capture & embeds the GPU under the same process", safety: 1, reload: 2},
    hideAds: {title: "Hide Ads", type: "bool", desc: `Adds display: none !important; to most ads. Krunker should still get money.`, safety: 0, reload: 0},
    resourceSwapper: {title: "Resource swapper", type: "bool", desc: `Enable Krunker Resource Swapper. Reads Documents/Crankshaft/swapper`, safety: 0, reload: 2},
    userscripts: {title: "Userscript support", type: "bool", desc: `Enable userscript support. place .js files in Documents/Crankshaft/scripts`, safety: 1, reload: 2},
    clientSplash: {title: "Client Splash Screen", type: "bool", desc: `Show a custom bg and logo (splash screen) while krunker is loading`, safety:0, reload: 1}, 
    logDebugToConsole: {title: "Log debug & GPU info to electron console", type: "bool", safety: 0, reload: 2},
    // skyColor: {title: "Custom Sky Color", type: "bool", desc: "override the sky color", safety: 2, reload: 1},
    // skyColorValue: {title: "Custom Sky Color: value", type: "text", desc: "must be a hex code like #ff0000", placeholder: "#ff0000", safety: 2, reload: 1},
    safeFlags_removeUselessFeatures: {title: "Remove useless features", type:"bool", desc:"Adds a lot of chromium flags that disable useless features.", safety:1, reload: 2},
    safeFlags_gpuRasterizing: {title: "GPU rasterization", type: "bool", /*desc: "Enable GPU rasterization. does it actually help? ¯\\_(ツ)_/¯ try for yourself.",*/ safety: 2, reload: 2},
    disableAccelerated2D: {title: "Disable Accelerated 2D canvas", type: "bool", desc: "", safety: 3, reload: 2},
    safeFlags_helpfulFlags: {title: "(Potentially) useful flags", type: "bool", desc: `Enables javascript-harmony, future-v8-vm-features, webgl2-compute-context.`, safety: 3, reload: 2},
    experimentalFlags_increaseLimits: {title: "Increase limits flags", type:"bool", desc: `Sets renderer-process-limit, max-active-webgl-contexts and webrtc-max-cpu-consumption-percentage to 100, adds ignore-gpu-blacklist`,  safety: 4, reload: 2},
    experimentalFlags_lowLatency: {title: "Lower Latency flags", type:"bool", desc: `Adds following flags: enable-highres-timer, enable-quic (experimental low-latency protocol) and enable-accelerated-2d-canvas`, safety: 4, reload: 2},
    experimentalFlags_experimental: {title: "Experimental flags", type: "bool", desc: `Adds following flags: disable-low-end-device-mode, high-dpi-support, ignore-gpu-blacklist, no-pings and no-proxy-server`, safety: 4, reload: 2},
}

const reloadDesc = {
    0: "No restart required",
    1: "Page reload required",
    2: "Client restart required"
}
const safetyDesc = [
    "This setting is safe/standard",
    "Proceed with caution",
    "This setting is not recommended",
    "This setting is experimental",
    "This setting is experimental and unstable. Use at your own risk."
]

function saveSettings() {
    fs.writeFileSync(userPrefsPath, JSON.stringify(userPrefs, null, 2), {encoding: "utf-8"})
    ipcRenderer.send("preloadSendsNewSettings", userPrefs) //send them back to main
}

function saveUserscriptTracker() {
    fs.writeFileSync(userscriptPathTracker, JSON.stringify(userscriptTracker, null, 2), {encoding: "utf-8"})
}

//note by KraXen72: i wrote this setting generation myself. didn't just steal it from idkr like every other client does, and then they have no idea how it works.

/**
 * creates a new Setting element
 */
class SettingElem {
    //s-update is the class for element to watch
    props: SettingsDescItem;
    type: 'bool' | 'sel' | 'heading' | 'text' | 'num';
    HTML: string;
    updateMethod: "onchange" | 'oninput' | '';
    updateKey: "value" | "checked" | '';

    constructor (props: SettingsDescItem) {
        /** @type {Object} save the props from constructor to this class (instance) */
        this.props = props
        /** @type {String} type of this settingElem, can be {'bool' | 'sel' | 'heading' | 'text' | 'num'} */
        this.type = props.type
        /** @type {String} innerHTML for settingElement */
        this.HTML = ''
        /**@type {String} is the eventlistener to use. for checkbox its be onclick, for select its be onchange etc. */
        this.updateMethod = ''
        /**@type {String} is the key to get checked when writing an update, for checkboxes it's checked, for selects its value etc.*/
        this.updateKey = ''
        ///** @type {Number | String} (only for 'sel' type) if Number, parseInt before assigning to Container */

        //general stuff that every setting has
        if (!!props.desc && props.desc !== "") {
            this.HTML += `<span class="setting-desc desc-icon" title="${safetyDesc[this.props.safety]}">?</span>`
        } else if (this.props.safety > 2) {
            //show a ! icon even if the desc is empty as long as safety is higher than 2
            this.HTML += `<span class="setting-desc desc-icon" title="${safetyDesc[this.props.safety]}">!</span>`
        }
        switch (props.type) {
            case 'bool':
                this.HTML += `<span class="setting-title">${props.title}</span> 
                <label class="switch">
                    <input class="s-update" type="checkbox" ${props.value ? "checked":""}/>
                    <div class="slider round"></div>
                </label>`
                // if (typeof props.reload !== "undefined") {
                //     this.HTML += `<span title="${reloadDesc[props.reload]}" class="requires-restart restart-level-${props.reload}">*</span>`
                // }
                if (!!props.desc && props.desc !== "") {
                    this.HTML += `<div class="setting-desc-new">${props.desc}</div>`
                }
                this.updateKey = `checked`
                this.updateMethod = 'onchange'
                break;
            case 'heading':
                this.HTML = `<h1 class="setting-title">${props.title}</h1>`
                break;
            case 'sel':
                this.HTML += `<span class="setting-title">${props.title}</span>
                    <select class="s-update inputGrey2">${
                        props.opts.map( o => `<option value ="${o}">${o}</option>`).join("") /* create option tags*/
                    }</select>`
                // if (typeof props.reload !== "undefined") {
                //     this.HTML += `<span title="${reloadDesc[props.reload]}" class="requires-restart restart-level-${props.reload}">*</span>`
                // }
                if (!!props.desc && props.desc !== "") {
                    this.HTML += `<div class="setting-desc-new">${props.desc}</div>`
                }
                this.updateKey = `value`
                this.updateMethod = 'onchange'
                break;
            case 'text':
                this.HTML += `<span class="setting-title">${props.title}
                </span>
                <span class="setting-input-wrapper">
                    <input type="text" class="rb-input s-update inputGrey2" name="${props.key}" autocomplete="off" value="${props.value}">
                </span>
                `
                if (!!props.desc && props.desc !== "") {
                    this.HTML += `<div class="setting-desc-new">${props.desc}</div>`
                }
                //${typeof props.reload !== "undefined" ? `<span title="${reloadDesc[props.reload]}" class="requires-restart restart-level-${props.reload}">*</span>` : ``}
                this.updateKey = `value`
                this.updateMethod = `oninput`
                break;
            case 'num':
                this.HTML += `<span class="setting-title">${props.title}</span><span>
                    <input type="number" class="rb-input marright s-update" name="${props.key}" autocomplete="off" value="${props.value}" min="${props.min}" max="${props.max}">
                </span>
                `
                // if (typeof props.reload !== "undefined") {
                //     //@ts-ignore
                //     this.HTML += `<span title="${reloadDesc[props.reload]}" class="requires-restart restart-level-${props.reload}">*</span>`
                // }
                if (!!props.desc && props.desc !== "") {
                    this.HTML += `<div class="setting-desc-new">${props.desc}</div>`
                }
                this.updateKey = `value`
                this.updateMethod = `onchange`
                break;
            default:
                this.HTML = `<span class="setting-title">${props.title}</span><span>Unknown setting type</span>`
        }
    }
    /**
     * update the settings when you change something in the gui
     * @param {{elem: Element, callback: 'normal'|Function}} elemAndCb
     */
    set update({elem, callback}: { elem: Element; callback: 'normal' | "userscript" | Function; }) {
        if (this.updateKey === "") { throw "Invalid update key"; }
        let target = elem.getElementsByClassName('s-update')[0]
        //@ts-ignore
        let value = target[this.updateKey]

        if (callback === "normal") {
            ipcRenderer.send("logMainConsole", `recieved an update for ${this.props.key}: ${value}`)
            userPrefs[this.props.key] = value
            saveSettings()

            // you can add custom instant refresh callbacks for settings here
            if (this.props.key === "hideAds") { toggleAdhideCSS(value) }
            // if (this.props.key === "userscripts" && value === true) {
            //     //show disclaimer before turning on userscripts
            //     const pick = userscriptDisclaimer(false)
            //     if (!pick) {
            //         userPrefs["userscripts"] = false
            //         saveSettings()
            //     }
            // }
        } else if (callback === "userscript") {
            const thisUserscript = userscripts.filter(u => u.fullpath = this.props.desc)

            ipcRenderer.send("logMainConsole", `userscript: recieved an update for ${this.props.title}: ${value}`)
            userscriptTracker[this.props.title] = value
            saveUserscriptTracker()
        } else {
            callback()
        }  
    }
    /**
     * this initializes the element and its eventlisteners. 
     * @returns {Element}
    */
    get elem(): Element { 
        // i only create the element after .elem is called so i don't pollute the dom with virutal elements when making settings
        let w = document.createElement('div') //w stands for wrapper
        w.classList.add("setting")
        w.classList.add("settName") //add setname for krunker compat
        w.classList.add("safety-"+this.props.safety)
        w.id = `settingElem-${this.props.key}`
        w.classList.add(this.type) //add bool or title etc
        w.innerHTML = this.HTML

        if (this.type === 'sel') { w.querySelector('select').value = this.props.value } //select value applying is fucky so like fix it i guess
        //ipcRenderer.send("logMainConsole", `cb is ${this.props.callback}, update is: ${this.updateMethod}`)

        //add an eventlistener
        // if (typeof this.props.callback === 'undefined') {
        //     w[this.updateMethod] = () => {
        //         this.update = {elem: w, callback: "normal"}
        //     }
        // } else {
            
        // }
        if (typeof this.props.callback === "undefined") {this.props.callback = "normal"}
        //@ts-ignore
        w[this.updateMethod] = () => {
            this.update = {elem: w, callback: this.props.callback}
        }
        return w //return the element
    }
}

function renderSettings() {
    //DONE add a legend explaining settings' safety
    //DONE re-implement collapsing
    document.getElementById('settHolder').innerHTML = `<div class="Crankshaft-settings" id="settHolder">
        <div class="setHed Crankshaft-setHed"><span class="material-icons plusOrMinus">keyboard_arrow_down</span> Client Settings</div>
        <div class="setBodH Crankshaft-setBodH mainSettings"></div>
    </div>`

    if (userPrefs.userscripts) {
        const userScriptSkeleton = `
        <div class="setHed Crankshaft-setHed"><span class="material-icons plusOrMinus">keyboard_arrow_down</span> Userscripts</div>
        <div class="setBodH Crankshaft-setBodH userscripts">
            <div class="settName setting"><span class="setting-title crankshaft-gray">NOTE: refresh page to see changes</span></div>
        </div>`
        //<div class="settingsBtn" id="userscript-disclaimer" style="width: auto;">DISCLAIMER</div>
        document.querySelector(".Crankshaft-settings").innerHTML += userScriptSkeleton
    }
    //<span class="setting safety-1">NOTE: All settings requrie restart of the client</span><br>

    //the next 2 ts ignores are bc the settings get modified with 2 maps after they are declared
    //@ts-ignore
    let settings: SettingsDescItem[] = Object.keys(settingsDesc)
    .map(key => { //first we turn the object into an array of objects so it's iterable
        let obj = {key}
        Object.assign(obj, settingsDesc[key])
        return obj
    })
    .map(obj => { //we then plug in real data from saved userPrefs so settings load with the preferences.
        Object.assign(obj, {value: userPrefs[obj.key], callback: "normal"})
        return obj
    })

    for (let i = 0; i < settings.length; i++) {
        const set = new SettingElem(settings[i])
        document.querySelector(".Crankshaft-settings .setBodH.mainSettings").appendChild(set.elem)
    }

    if (userPrefs.userscripts) {
        //@ts-ignore
        let userscriptSettings: SettingsDescItem[] = userscripts
        .map(userscript => { 
            const obj = {
                title: userscript.name,
                value: userscriptTracker[userscript.name], 
                type: "bool", 
                desc: userscript.fullpath, 
                safety: 0, 
                reload: 2,
                callback: "userscript"
            }
            return obj
        })

        // document.getElementById("userscript-disclaimer").onclick = () => {
        //     userscriptDisclaimer(true)
        // }

        for (let i = 0; i < userscriptSettings.length; i++) {
            const userSet = new SettingElem(userscriptSettings[i])
            document.querySelector(".Crankshaft-settings .setBodH.userscripts").appendChild(userSet.elem)
        }
    }

    function toggleCategory(me: Element) {
        const sibling = me.nextElementSibling

        sibling.classList.toggle("setting-category-collapsed")

        const iconElem = me.querySelector(".material-icons")
        //ipcRenderer.send("logMainConsole", iconElem.innerHTML)
        if (iconElem.innerHTML.toString() === "keyboard_arrow_down") {
            iconElem.innerHTML = "keyboard_arrow_right"
        } else {
            iconElem.innerHTML = "keyboard_arrow_down"
        }
    }

    const settHeaders = [...document.querySelectorAll(".Crankshaft-setHed")]
    settHeaders.forEach(header => {
        const collapseCallback = () => {toggleCategory(header)}
        //try { header.removeEventListener("click", collapseCallback) } catch (e) { }
        header.addEventListener("click", collapseCallback)
    })
}