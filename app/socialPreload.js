"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const electron_1 = require("electron");
require("v8-compile-cache");
electron_1.ipcRenderer.on('injectCSS', (event, css) => { (0, utils_1.injectSettingsCss)(css); });
