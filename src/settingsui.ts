import * as fs from 'fs';
import { ipcRenderer } from 'electron';
import 'v8-compile-cache';
import { injectSettingsCss, createElement, toggleSettingCSS } from './utils';
import { styleSettingsCss, su } from "./preload";
///<reference path="global.d.ts" />

let userPrefs: userPrefs
let userPrefsPath: string

let userscriptTracker: userscriptTracker
let userscriptTrackerPath: string

ipcRenderer.on('preloadSettings', (event, recieved_userPrefsPath: string, recieved_userPrefs: userPrefs) => {
    //main sends us the path to settings and also settings themselves on initial load.
    userPrefsPath = recieved_userPrefsPath
    userPrefs = recieved_userPrefs
});

/** * joins the data: userPrefs and Desc: SettingsDesc into one array of objects */
function transformMarrySettings(data: userPrefs, desc: SettingsDesc, callback: callbacks): renderReadySetting[] {
    const renderReadySettings = Object.keys(desc)
    .map( key => ({key, ...desc[key]}) ) //embeds key into the original object: hideAds: {title: 'Hide Ads', ...} => {key: 'hideAds', title: 'Hide Ads', ...}
    .map( obj => ({callback, value: data[obj.key], ...obj}) ) //adds value (from the data object) and callback ('normal' by default)
    
    return renderReadySettings
}

// const userscriptDisclaimer = [
//     "Enable userscript support. place .js files in Documents/Crankshaft/scripts",
//     "Use userscripts at your own risk, the author(s) of this client are not responsible for any damage done with userscripts because the user is the author of the script.",
//     "Enabling any userscript you don't trust and know how it works is NOT RECOMMENDED",
//     "Any userscripts that modify the game's canvas (Renderer) are NOT ALLOWED
// ].join("\n")

//this is based on my generative settings from https://github.com/KraXen72/glide, precisely https://github.com/KraXen72/glide/blob/master/settings.js
//they are modified here to fit krunker
//note by KraXen72: i wrote this setting generation myself. didn't just steal it from idkr like every other client does, and then they have no idea how it works.

//note by KraXen: this might look scary, but it's just extra info needed to make a nice gui
// each setting has these things: title, type: {'bool' | 'sel' | 'heading' | 'text' | 'num'}, desc and safety(0-4)
// some have some extra stuff, like selects have opts for options.
// leaving desc as "" will cause it to not render the helper question mark
const settingsDesc: SettingsDesc = {
    fpsUncap: {title: "Un-cap FPS", type: "bool", desc: "", safety: 0},
    fullscreen: {title: "Start in Fullscreen", type: "bool", desc: "", safety: 0,},
    "angle-backend": {title: "ANGLE Backend", type: "sel", safety: 0, opts: ["default","gl","d3d11","d3d9","d3d11on12","vulkan"]},   
    inProcessGPU: {title: "In-Process GPU (video capture)", type: "bool", desc: "Enables video capture & embeds the GPU under the same process", safety: 1},
    hideAds: {title: "Hide Ads", type: "bool", safety: 0},
    menuTimer: {title: "Menu Timer", type: "bool", safety: 0},
    resourceSwapper: {title: "Resource swapper", type: "bool", desc: `Enable Krunker Resource Swapper. Reads Documents/Crankshaft/swapper`, safety: 0},
    userscripts: {title: "Userscript support", type: "bool", desc: `Enable userscript support. place .js files in Documents/Crankshaft/scripts`, safety: 1},
    clientSplash: {title: "Client Splash Screen", type: "bool", desc: `Show a custom bg and logo (splash screen) while krunker is loading`, safety:0}, 
    logDebugToConsole: {title: "Log debug & GPU info to electron console", type: "bool", safety: 0},
    // skyColor: {title: "Custom Sky Color", type: "bool", desc: "override the sky color", safety: 2},
    // skyColorValue: {title: "Custom Sky Color: value", type: "text", desc: "must be a hex code like #ff0000", placeholder: "#ff0000", safety: 2},
    safeFlags_removeUselessFeatures: {title: "Remove useless features", type:"bool", desc:"Adds a lot of chromium flags that disable useless features.", safety:1},
    safeFlags_gpuRasterizing: {title: "GPU rasterization", type: "bool", /*desc: "Enable GPU rasterization. does it actually help? ¯\\_(ツ)_/¯ try for yourself.",*/ safety: 2},
    disableAccelerated2D: {title: "Disable Accelerated 2D canvas", type: "bool", desc: "", safety: 3},
    safeFlags_helpfulFlags: {title: "(Potentially) useful flags", type: "bool", desc: `Enables javascript-harmony, future-v8-vm-features, webgl2-compute-context.`, safety: 3},
    experimentalFlags_increaseLimits: {title: "Increase limits flags", type:"bool", desc: `Sets renderer-process-limit, max-active-webgl-contexts and webrtc-max-cpu-consumption-percentage to 100, adds ignore-gpu-blacklist`,  safety: 4},
    experimentalFlags_lowLatency: {title: "Lower Latency flags", type:"bool", desc: `Adds following flags: enable-highres-timer, enable-quic (experimental low-latency protocol) and enable-accelerated-2d-canvas`, safety: 4},
    experimentalFlags_experimental: {title: "Experimental flags", type: "bool", desc: `Adds following flags: disable-low-end-device-mode, high-dpi-support, ignore-gpu-blacklist, no-pings and no-proxy-server`, safety: 4}
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
    fs.writeFileSync(userscriptTrackerPath, JSON.stringify(su.userscriptTracker, null, 2), {encoding: "utf-8"})
}

/**
 * creates a new Setting element
 */
class SettingElem {
    //s-update is the class for element to watch
    props: renderReadySetting;
    type: 'bool' | 'sel' | 'heading' | 'text' | 'num';
    HTML: string;
    updateMethod: "onchange" | 'oninput' | '';
    updateKey: "value" | "checked" | '';

    constructor (props: renderReadySetting) {
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
        if (this.props.safety > 0) {
            this.HTML += `<span class="setting-desc desc-icon" title="${safetyDesc[this.props.safety]}">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M12 12.5ZM3.425 20.5Q2.9 20.5 2.65 20.05Q2.4 19.6 2.65 19.15L11.2 4.35Q11.475 3.9 12 3.9Q12.525 3.9 12.8 4.35L21.35 19.15Q21.6 19.6 21.35 20.05Q21.1 20.5 20.575 20.5ZM12 10.2Q11.675 10.2 11.463 10.412Q11.25 10.625 11.25 10.95V14.45Q11.25 14.75 11.463 14.975Q11.675 15.2 12 15.2Q12.325 15.2 12.538 14.975Q12.75 14.75 12.75 14.45V10.95Q12.75 10.625 12.538 10.412Q12.325 10.2 12 10.2ZM12 17.8Q12.35 17.8 12.575 17.575Q12.8 17.35 12.8 17Q12.8 16.65 12.575 16.425Q12.35 16.2 12 16.2Q11.65 16.2 11.425 16.425Q11.2 16.65 11.2 17Q11.2 17.35 11.425 17.575Q11.65 17.8 12 17.8ZM4.45 19H19.55L12 6Z"/></svg>
            </span>`
        }
        switch (props.type) {
            case 'bool':
                this.HTML += `<span class="setting-title">${props.title}</span> 
                <label class="switch">
                    <input class="s-update" type="checkbox" ${props.value ? "checked":""}/>
                    <div class="slider round"></div>
                </label>`
                this.updateKey = `checked`
                this.updateMethod = 'onchange'
                break;
            case 'heading':
                this.HTML = `<h1 class="setting-title">${props.title}</h1>`
                break;
            case 'sel':
                this.HTML += `<span class="setting-title">${props.title}</span>
                    <select class="s-update inputGrey2">${
                        /* create option tags*/
                        props.opts.map( o => `<option value ="${o}">${o}</option>`).join("") 
                    }</select>`
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
                this.updateKey = `value`
                this.updateMethod = `oninput`
                break;
            case 'num':
                this.HTML += `<span class="setting-title">${props.title}</span><span>
                    <input type="number" class="rb-input marright s-update" name="${props.key}" autocomplete="off" value="${props.value}" min="${props.min}" max="${props.max}">
                </span>
                `
                this.updateKey = `value`
                this.updateMethod = `onchange`
                break;
            default:
                //@ts-ignore
                this.HTML = `<span class="setting-title">${props.title}</span><span>Unknown setting type</span>`
        }
        //add desc
        if (!!props.desc && props.desc !== "") {
            this.HTML += `<div class="setting-desc-new">${props.desc}</div>`
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
            if (this.props.key === "hideAds") { toggleSettingCSS(styleSettingsCss.hideAds, this.props.key, value) }
            if (this.props.key === "menuTimer") { toggleSettingCSS(styleSettingsCss.menuTimer, this.props.key, value) }
            // if (this.props.key === "userscripts" && value === true) {
            //     //show disclaimer before turning on userscripts
            //     const pick = userscriptDisclaimer(false)
            //     if (!pick) {
            //         userPrefs["userscripts"] = false
            //         saveSettings()
            //     }
            // }
        } else if (callback === "userscript") {
            //const thisUserscript = userscripts.filter(u => u.fullpath = this.props.desc)

            ipcRenderer.send("logMainConsole", `userscript: recieved an update for ${this.props.title}: ${value}`)
            su.userscriptTracker[this.props.title] = value
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
        if (typeof this.props.callback === "undefined") {this.props.callback = "normal"}
        //@ts-ignore
        w[this.updateMethod] = () => {
            this.update = {elem: w, callback: this.props.callback}
        }
        return w //return the element
    }
}

function createCategory(title: string, innerHTML: string, elemClass: string = "mainSettings") {
    return `
    <div class="setHed Crankshaft-setHed"><span class="material-icons plusOrMinus">keyboard_arrow_down</span> ${title}</div>
    <div class="setBodH Crankshaft-setBodH ${elemClass}">
        ${innerHTML}
    </div>`
}


export function renderSettings() {
    document.getElementById('settHolder').innerHTML = `<div class="Crankshaft-settings" id="settHolder">
        ${createCategory("Client Settings", `<div class="settName setting"><span class="setting-title crankshaft-gray">Most settings need a client restart to work. You can use F12.</span></div>` )}
    </div>`

    if (userPrefs.userscripts) {
        const userScriptSkeleton = createCategory("Userscripts", `<div class="settName setting"><span class="setting-title crankshaft-gray">NOTE: refresh page to see changes</span></div>`, "userscripts")
        //<div class="settingsBtn" id="userscript-disclaimer" style="width: auto;">DISCLAIMER</div>
        document.querySelector(".Crankshaft-settings").innerHTML += userScriptSkeleton
    }


    let settings: renderReadySetting[] = transformMarrySettings(userPrefs, settingsDesc, 'normal')
    for (let i = 0; i < settings.length; i++) {
        const set = new SettingElem(settings[i])
        document.querySelector(".Crankshaft-settings .setBodH.mainSettings").appendChild(set.elem)
    }

    if (userPrefs.userscripts) {
        let userscriptSettings: renderReadySetting[] = su.userscripts
        .map(userscript => { 
            const obj: renderReadySetting = {
                key: userscript.name.slice(0, -3), //remove .js
                title: userscript.name,
                value: su.userscriptTracker[userscript.name], 
                type: "bool", 
                desc: userscript.fullpath, 
                safety: 0, 
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