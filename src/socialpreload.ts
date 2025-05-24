import { join as pathJoin } from 'path';
import { ipcRenderer } from 'electron';
import { createElement } from './utils';
import { readFileSync } from 'fs';


const strippedConsole = {
    log: console.log.bind(console)
}

ipcRenderer.send('logMainConsole', `[Social/Hub Window] Ran social preload.`);

// Create the element here so that it can be modified by both updaters without creating a new element
const styleElement = createElement('style', { id: 'crankshaftCustomCSS' });

// Stores the CSS path for when everything is loaded and ready
let socialCssPath = '';

// userPrefs and the social CSS path are sent here
ipcRenderer.once('social_tab_data', (event, data) => {
    const { socialCssSwapper } = data.userPrefs;
    socialCssPath = data.socialCssPath;

    ipcRenderer.send('logMainConsole', `[Social/Hub Window] Social Tab Received Userprefs.`);

    addEventListener('DOMContentLoaded', (event) => {
        document.body.appendChild(styleElement);
        updateSocialCSS(socialCssSwapper);
    });
})

ipcRenderer.on('new_social_css', (event, data) => {
    // hot-swap CSS functionality
    updateSocialCSS(data);
})

/**
 * Changes the active CSS
 * @param CSSPath Filename of the new desired CSS (or "None" if no CSS is desired)
 */
function updateSocialCSS(CSSPath: string) {
    ipcRenderer.send('logMainConsole', `[Social/Hub Window] Social Tab Updated CSS: ${CSSPath}`);
    if (CSSPath === 'None') {
        styleElement.textContent = '';
    } else {
        const cssInUse = readFileSync(pathJoin(socialCssPath, `${CSSPath}`), { encoding: 'utf-8' });
        styleElement.textContent = cssInUse;
    }
}

strippedConsole.log('Social Tab Preload Ran.');