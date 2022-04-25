//"use strict";
import * as fs from 'fs'
import * as path from 'path'
import { BrowserWindow } from "electron"
//converted to typescript by KraXen72. original is from idkr: https://github.com/idkr-client/idkr

/**
 * Swapping Handler
 *
 * @class Swapper
 */
class Swapper {
	/**
	 * Creates an instance of Swapper.
	 */
	win: BrowserWindow
	swapperMode: string
	swapDir: string
	urls: string[]
	constructor(win: BrowserWindow, swapperMode: string, swapDir: string){
		this.win = win;
		this.swapperMode = swapperMode;
		this.swapDir = swapDir;
		this.urls = [];
	}

	/**
	 * Advanced Swapper
	 */
	private recursiveSwapNormal = (win: BrowserWindow, prefix: string = "") => {
		try {
			fs.readdirSync(path.join(this.swapDir, prefix), { withFileTypes: true }).forEach(dirent => {
				if (dirent.isDirectory()) this.recursiveSwapNormal(win, `${prefix}/${dirent.name}`);
				else {
					let pathname = `${prefix}/${dirent.name}`;
					this.urls.push(
						...(/^\/(models|textures|sound)($|\/)/.test(pathname)
							? [
								`*://assets.krunker.io${pathname}`,
								`*://assets.krunker.io${pathname}?*`
							] : [
								`*://krunker.io${pathname}`,
								`*://krunker.io${pathname}?*`,
								`*://comp.krunker.io${pathname}`,
								`*://comp.krunker.io${pathname}?*`
							]
						)
					);
				}
			});
		}
		catch (err){
			console.error("Failed to swap resources in normal mode", err, prefix);
		}
	}

	/**
	 * Advanced Swapper
	 */
	private recursiveSwapHostname = (win: BrowserWindow, prefix: string = "", hostname: string = "") => {
		try {
			fs.readdirSync(path.join(this.swapDir, prefix), { withFileTypes: true }).forEach(dirent => {
				if (dirent.isDirectory()){
					this.recursiveSwapHostname(
						win,
						hostname ? `${prefix}/${dirent.name}` : prefix + dirent.name,
						hostname || dirent.name
					);
				}
				else if (hostname) this.urls.push(`*://${prefix}/${dirent.name}`, `*://${prefix}/${dirent.name}?*`);
			});
		}
		catch (err){
			console.error("Failed to swap resources in advanced mode", err, prefix, hostname);
		}
	}

	/**
	 * Initialize the Swapping process
	 *
	 * @memberof Swapper
	 */
	init(){
		switch (this.swapperMode){
			case "normal": {
				this.recursiveSwapNormal(this.win);
				this.urls.length && this.win.webContents.session.webRequest.onBeforeRequest({
					urls: this.urls
				}, (details, callback) => callback({
					redirectURL: "krunker-resource-swapper:/" + path.join(this.swapDir, new URL(details.url).pathname)
				}));
				break;
			}
			case "advanced": {
				this.recursiveSwapHostname(this.win);
				this.urls.length && this.win.webContents.session.webRequest.onBeforeRequest({ urls: this.urls }, (details, callback) => {
					let { hostname, pathname } = new URL(details.url);
					callback({ redirectURL: "krunker-resource-swapper:/" + path.join(this.swapDir, hostname, pathname) });
				});
				break;
			}
			default: return;
		}
	}
}

export { Swapper }
