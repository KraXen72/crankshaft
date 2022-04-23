"use strict";
const fs = require("fs");
const path = require("path");
require("v8-compile-cache");
//converted to typescript by KraXen72. original is what i can only assume is from idkr, because of the jsdoc. found it in gatoclient lite.
/**
 * Swapping Handler
 *
 * @class Swapper
 */
class Swapper {
    constructor(win, swapperMode, swapDir) {
        /**
         * Advanced Swapper
         */
        this.recursiveSwapNormal = (win, prefix = "") => {
            try {
                fs.readdirSync(path.join(this.swapDir, prefix), { withFileTypes: true }).forEach(dirent => {
                    if (dirent.isDirectory())
                        this.recursiveSwapNormal(win, `${prefix}/${dirent.name}`);
                    else {
                        let pathname = `${prefix}/${dirent.name}`;
                        this.urls.push(...(/^\/(models|textures|sound)($|\/)/.test(pathname)
                            ? [
                                `*://assets.krunker.io${pathname}`,
                                `*://assets.krunker.io${pathname}?*`
                            ] : [
                            `*://krunker.io${pathname}`,
                            `*://krunker.io${pathname}?*`,
                            `*://comp.krunker.io${pathname}`,
                            `*://comp.krunker.io${pathname}?*`
                        ]));
                    }
                });
            }
            catch (err) {
                console.error("Failed to swap resources in normal mode", err, prefix);
            }
        };
        /**
         * Advanced Swapper
         */
        this.recursiveSwapHostname = (win, prefix = "", hostname = "") => {
            try {
                fs.readdirSync(path.join(this.swapDir, prefix), { withFileTypes: true }).forEach(dirent => {
                    if (dirent.isDirectory()) {
                        this.recursiveSwapHostname(win, hostname ? `${prefix}/${dirent.name}` : prefix + dirent.name, hostname || dirent.name);
                    }
                    else if (hostname)
                        this.urls.push(`*://${prefix}/${dirent.name}`, `*://${prefix}/${dirent.name}?*`);
                });
            }
            catch (err) {
                console.error("Failed to swap resources in advanced mode", err, prefix, hostname);
            }
        };
        this.win = win;
        this.swapperMode = swapperMode;
        this.swapDir = swapDir;
        this.urls = [];
    }
    /**
     * Initialize the Swapping process
     *
     * @memberof Swapper
     */
    init() {
        switch (this.swapperMode) {
            case "normal": {
                this.recursiveSwapNormal(this.win);
                this.urls.length && this.win.webContents.session.webRequest.onBeforeRequest({
                    urls: this.urls
                }, (details, callback) => callback({
                    redirectURL: "crankshaft-swap:/" + path.join(this.swapDir, new URL(details.url).pathname)
                }));
                break;
            }
            case "advanced": {
                this.recursiveSwapHostname(this.win);
                this.urls.length && this.win.webContents.session.webRequest.onBeforeRequest({ urls: this.urls }, (details, callback) => {
                    let { hostname, pathname } = new URL(details.url);
                    callback({ redirectURL: "crankshaft-swap:/" + path.join(this.swapDir, hostname, pathname) });
                });
                break;
            }
            default: return;
        }
    }
}
module.exports = Swapper;
