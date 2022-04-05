const { ipcRenderer } = require('electron');
require('v8-compile-cache');

// CSS
ipcRenderer.on('injectCSS', (event, css) => {
    let s = document.createElement("style");
    s.setAttribute("class", "CrankshaftCSS");
    s.setAttribute("id", "CrankshaftCSS");
    s.innerHTML = css;
    document.body.appendChild(s);
});