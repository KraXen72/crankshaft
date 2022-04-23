import { injectSettingsCss } from './utils';
import { ipcRenderer } from 'electron';
import 'v8-compile-cache'
ipcRenderer.on('injectCSS', (event, css) => { injectSettingsCss(css) });