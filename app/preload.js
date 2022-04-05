const fs = require('fs');
const { ipcRenderer, TouchBarSegmentedControl } = require('electron');
const path = require('path');
require('v8-compile-cache');
// Preload things

// get rid of client unsupported message
window.OffCliV = true;
let userPrefs
let userPrefsPath

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
})

ipcRenderer.on('preloadSettings', (event, preferences, version, filedir) => {
    //preload sends us the path to settings and also settings themselves on initial load.
    let filePath = preferences;
    userPrefsPath = filePath
    userPrefs = JSON.parse(fs.readFileSync(filePath));

    // Sky color script: Thank you Janrex
    // NOTE: this is probably broken rn
    if (userPrefs.skyColor) {
        Reflect.defineProperty(Object.prototype, "skyCol", {
            value: userPrefs['skyColorValue'],
        });
    }
});

ipcRenderer.on('injectClientCss', (event, injectSplash, version) => {
    const splashId = "GatoclientLite-splash-css"
    const settId = "GatoclientLite-settings-css"
    
    if (document.getElementById(settId) === null) {
        const settCss = fs.readFileSync(path.join(__dirname, 'settingCss.css'))
        injectSettingsCss(settCss, settId)
    }
    
    if (document.getElementById(splashId) === null && injectSplash === true) {
        let splashCSS = fs.readFileSync(path.join(__dirname, 'splashCSS.css'))
        //console.log(path.resolve(__dirname, "aieGears.png"))
        //splashCSS += ` #initLoader {background-image: url("crankshaft://${path.resolve(__dirname, "assets", "aieGears.png")}") !important;}`
        injectSettingsCss(splashCSS, splashId)
        const initLoader = document.getElementById("initLoader")
 
        initLoader.appendChild(createElement("svg", {
            id: "crankshaft-logo",
            innerHTML: fs.readFileSync(path.resolve(__dirname, "assets", "splashLogoFragment.html"))
        }))

        initLoader.appendChild(createElement("div", {id: "crankshaft-holder-l", text: `v${version}`}))
        initLoader.appendChild(createElement("div", {id: "crankshaft-holder-r", text: `KraXen72 & LukeTheDuke`}))
    }
});

/**
 * inject css as a style tag
 */
const injectSettingsCss = (css, classId = "GatoclientLite-settings-css") => {
    let s = document.createElement("style");
    //s.setAttribute("class", classId);
    s.setAttribute("id", classId);
    s.innerHTML = css;
    document.head.appendChild(s);
}

//create element util function. source is my utils lib: https://github.com/KraXen72/roseboxlib/blob/master/esm/lib.js
/**
 * create a dom element given an object of properties
 * @param {String} type element type, e.g. "div"
 * @param {Object} options options for the element. like class, id, etc
 * @returns element
 */
function createElement(type, options = {}) {
    const element = document.createElement(type)
    Object.entries(options).forEach(([key, value]) => {
        if (key === "class") {
            element.classList.add(value)
            return
        }

        if (key === "dataset") {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue
            })
            return
        }

        if (key === "text") {
            element.textContent = value
            return
        }
        if (key === "innerHTML") {
            element.innerHTML = value
            return
        }

        element.setAttribute(key, value)
    })
    return element
}


/**
 * make sure our setting tab is always called as it should be and has the proper onclick
 */
function UpdateSettingsTabs(activeTab, hookSearch = true) {
    // Settings Menu
    //ipcRenderer.send("logMainConsole", windows[0].searchList)

    //we yeet basic settings. its advanced now. deal with it.
    if (window.windows[0].settingsType === "basic") { window.windows[0].toggleType({checked: true}) }
    document.querySelector(".advancedSwitch").style.display = "none"

    if (hookSearch) { 
        // only hook search ONCE to ensure the client settings still work while searching. 
        // it will not yield the client settings tho, that's pain to implement
        const settSearchCallback = () => { UpdateSettingsTabs(0, false) }
        try { document.getElementById("settSearch").removeEventListener("input", settSearchCallback) } catch (e) {}
        document.getElementById("settSearch").addEventListener("input", settSearchCallback)
    }

    //modifications we do the the dom:

    const tabs = document.getElementById('settingsTabLayout').children
    const clientTab = tabs[tabs.length - 1]
    
    clientTab.textContent = "Crankshaft settings"

    try { clientTab.removeEventListener("click", renderSettings) } catch (e) {}
    clientTab.addEventListener("click", renderSettings)

    //re-hook all tabs so the name stays the same and onclick
    const settingTabArray = document.getElementById('settingsTabLayout').children;
    for (let i = 0; i < settingTabArray.length; i++) {
        if (settingTabArray[i] !== activeTab) {

            const currentTabCallback = (event) => {UpdateSettingsTabs(i, true)}
            try { settingTabArray[i].removeEventListener("click", currentTabCallback) } catch (e) {  }
            settingTabArray[i].addEventListener("click", currentTabCallback)
        }
        if (i == activeTab) { // if the current selected tab is our settings, just add active class
            settingTabArray[i].setAttribute('class', 'settingTab tabANew');
        }
    }
}

//safety: 0: ok setting/recommended, 1: ok but not recommended, 2: not recommended but go ahead, 3: experimental, 4: experimental and unstable
//     normal text color            gray text color             yellow text color                orange text color       red text color

//this is based on my generative settings from https://github.com/KraXen72/glide, precisely https://github.com/KraXen72/glide/blob/master/settings.js
//they are modified here to fit krunker

//note by KraXen: this might look scary, but it's just extra info needed to make a nice gui
// each setting has these things: title, type: {'bool' | 'sel' | 'heading' | 'text' | 'num'}, desc and safety(0-4)
// some have some extra stuff, like selects have opts for options.
// leaving desc as "" will cause it to not render the helper question mark
const settingsDesc = {
    fpsUncap: {title: "Un-cap FPS", type: "bool", desc: "", safety: 0},   
    fullscreen: {title: "Fullscreen", type: "bool", desc: "", safety: 0}, 
    resourceSwapper: {title: "Resource swapper", type: "bool", desc: "enable Krunker Resource Swapper. Reads Documents/GatoclientLite/swapper", safety: 0},
    clientSplash: {title: "Client Splash Screen", type: "bool", desc: "show a custom bg and logo (splash screen) while krunker is loading", safety: 0},
    "angle-backend": {title: "ANGLE Backend", type: "sel", desc: "what ANGLE backend to use", opts: ["default","gl","d3d11","d3d9","d3d11on12","vulkan"], safety: 0},
    logDebugToConsole: {title: "Log debug & GPU info to console", type: "bool", desc: "log some GPU and debug info to the electron console. you won't see this unless app is ran from source", safety: 0},
    safeFlags_removeUselessFeatures: {title: "Remove useless features", type:"bool", desc:"adds a lot of chromium flags that disable useless features. Will probably improve performance", safety:1},
    inProcessGPU: {title: "In-Process GPU", type: "bool", desc: "embed the gpu under the same process", safety: 1}, 
    disableAccelerated2D: {title: "disable Accelerated 2D canvas", type: "bool", desc: "", safety: 1},
    safeFlags_gpuRasterizing: {title: "GPU rasterization", type: "bool", desc: "Enable GPU rasterization. does it actually help? ¯\\_(ツ)_/¯ try for yourself.", safety: 2},
    skyColor: {title: "Custom Sky Color", type: "bool", desc: "override the sky color", safety: 2}, 
    skyColorValue: {title: "Custom Sky Color: value", type: "text", desc: "must be a hex code like #ff0000", placeholder: "#ff0000", safety: 2},
    safeFlags_helpfulFlags: {title: "(Potentially) useful flags", type: "bool", desc: "enables javascript-harmony, future-v8-vm-features, webgl2-compute-context. does it actually help? ¯\\_(ツ)_/¯ try for yourself.", safety: 3},
    experimentalFlags_increaseLimits: {title: "Increase limits flags", type:"bool", desc:"Various flags to increase limits", safety: 4},
    experimentalFlags_lowLatency: {title: "Lower Latency flags", type:"bool", desc:"Various flags to lower latency", safety: 4},
    experimentalFlags_experimental: {title: "Experimental flags", type: "bool", desc: "Various performance enhancing flags. can be unstable", safety: 4},
}

function saveSettings() {
    fs.writeFileSync(userPrefsPath, JSON.stringify(userPrefs, null, 2), {encoding: "utf-8"})
}

//note by KraXen72: i wrote this setting generation myself. didn't just steal it from idkr like every other client does, and then they have no idea how it works.

/**
 * creates a new Setting element
 */
class SettingElem {
    //s-update is the class for element to watch
    constructor (props) {
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
        /** @type {Number | String} (only for 'sel' type) if Number, parseInt before assigning to Container */
        switch (props.type) {
            case 'bool':
                this.HTML = `<span class="setting-title" title="${props.desc}">${props.title}</span> 
                <label class="switch">
                    <input class="s-update" type="checkbox" ${props.value ? "checked":""}/>
                    <div class="slider round"></div>
                </label>`
                if (!!props.desc && props.desc !== "") {
                    this.HTML += `<span class="setting-desc" title="${props.desc}">?</span>`
                }
                this.updateKey = `checked`
                this.updateMethod = 'onchange'
                break;
            case 'heading':
                this.HTML = `<h1 class="setting-title">${props.title}</h1>`
                break;
            case 'sel':
                this.HTML = `<span class="setting-title" title="${props.desc}">${props.title}</span>
                    <select class="s-update inputGrey2">${
                        props.opts.map( o => `<option value ="${o}">${o}</option>`).join("") /* create option tags*/
                    }</select>`
                if (!!props.desc && props.desc !== "") {
                    this.HTML += `<span class="setting-desc" title="${props.desc}">?</span>`
                }
                this.updateKey = `value`
                this.updateMethod = 'onchange'
                break;
            case 'text':
                this.HTML = `<span class="setting-title">${props.title} ${!!props.desc && props.desc !== "" ? `<span class="setting-desc inline" title="${props.desc}">?</span>` : ''}</span><span class="setting-input-wrapper">
                    <input type="text" class="rb-input s-update inputGrey2" name="${props.key}" autocomplete="off" value="${props.value}">
                </span>
                `
                this.updateKey = `value`
                this.updateMethod = `oninput`
                break;
            case 'num':
                    this.HTML = `<span class="setting-title">${props.title}</span><span>
                        <input type="number" class="rb-input marright s-update" name="${props.key}" autocomplete="off" value="${props.value}" min="${props.min}" max="${props.max}">
                    </span>
                    `
                    if (!!props.desc && props.desc !== "") {
                        this.HTML += `<span class="setting-desc" title="${props.desc}">?</span>`
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
    set update({elem, callback}) {
        let target = elem.getElementsByClassName('s-update')[0]
        let value = target[this.updateKey]
        
        //console.log(`dry run: would update '${this.props.key}' to '${value}'`)
        if (callback === 'normal') {
            ipcRenderer.send("logMainConsole", `recieved an update for ${this.props.key}: ${value}`)
            userPrefs[this.props.key] = value
            saveSettings()
        } else if (callback === 'misc') {
            //misc settings
            //Container.m[this.props.key] = value
        } else { //this adds support for custom callbacks (custom settings)
            callback()
        }
    }

    /**
     * this initializes the element and its eventlisteners. 
     * @returns {Element}
    */
    get elem() { 
        // i only create the element after .elem is called so i don't pollute the dom with virutal elements when making settings
        let w = document.createElement('div') //w stands for wrapper
        w.classList.add("setting")
        w.classList.add("settName") //add setname for krunker compat
        w.classList.add("safety-"+this.props.safety)
        w.id = `settingElem-${this.props.key}`
        w.classList.add(this.type) //add bool or title etc
        w.innerHTML = this.HTML

        if (this.type === 'sel') { w.querySelector('select').value = this.props.value } //select value applying is fucky so like fix it i guess

        //add an eventlistener
        w[this.updateMethod] = () => {
            this.update = {elem: w, callback: "normal"}
        }
        return w //return the element
    }
}

function renderSettings() {
    //add a legend explaining settings' safety
    document.getElementById('settHolder').innerHTML = `<div id="GatoclientLite-settings">
        <div class="settName safetyLegend">Safety legend: &nbsp;
        <span class="setting safety-1">safe but extra</span>,&nbsp;
        <span class="setting safety-2">not recommended but safe</span>,&nbsp;
        <span class="setting safety-3">experimental</span>,&nbsp;
        <span class="setting safety-4">experimental and unstable</span>
        <span class="setting safety-1">NOTE: All settings requrie restart of the client</span><br>
        </div>

        <div class="setBodH GatoclientLite-setBodH"></div>
        
    </div>`

    let settings = Object.keys(settingsDesc)
    .map(key => { //first we turn the object into an array of objects so it's iterable
        let obj = {key}
        Object.assign(obj, settingsDesc[key])
        return obj
    })
    .map(obj => { //we then plug in real data from saved userPrefs so settings load with the preferences.
        Object.assign(obj, {value: userPrefs[obj.key]})
        return obj
    })

    for (let i = 0; i < settings.length; i++) {
        let set = new SettingElem(settings[i])
        document.querySelector("#GatoclientLite-settings .setBodH").appendChild(set.elem)
    }
}