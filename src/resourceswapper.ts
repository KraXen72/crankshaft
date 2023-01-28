import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join as pathJoin } from 'path';

const TARGET_GAME_DOMAIN = 'krunker.io';

/*
 * thanks for this to Commander/asger-finding, https://github.com/asger-finding/anotherkrunkerclient/blob/main/src/main/resource-swapper.ts
 * i did modify it to fit this client but Commander did most of the heavy lifting
 */

/**
 * Swapper
 * @class Swapper
 */
export default class {

	/** Target window. */
	private browserWindow: Electron.BrowserWindow;

	/** The list of URLs to swap. */
	private urls: string[] = [];

	/** Has start() been called on the class? */
	private started = false;

	/** which directory to swap */
	private swapDir: string;

	/**
	 * Set the target window.
	 *
	 * @param browserWindow - The target window.
	 */
	public constructor(browserWindow: Electron.BrowserWindow, swapDir: string) {
		this.browserWindow = browserWindow;
		this.swapDir = swapDir;
	}

	/** Initialize the resource swapper for the target window.*/
	public start(): void {
		if (this.started) return;

		// If the target directory doesn't exist, create it.
		if (!existsSync(this.swapDir)) mkdirSync(this.swapDir, { recursive: true });

		this.recursiveSwap('');

		if (this.urls.length) {
			this.browserWindow.webContents.session.webRequest.onBeforeRequest({ urls: this.urls }, (details, callback) => {
				const path = new URL(details.url).pathname;
				const resultPath = path.startsWith('/assets/') ? pathJoin(this.swapDir, path.substring(7)) : pathJoin(this.swapDir, path);

				// Redirect to the local resource.
				callback({ redirectURL: `krunker-resource-swapper:/${resultPath}` });
			});
		}

		// Fix CORS problem with browserfps.com.
		this.browserWindow.webContents.session.webRequest.onHeadersReceived(({ responseHeaders }, callback) => {
			for (const key in responseHeaders) {
				const lowercase = key.toLowerCase();

				// If the credentials mode is 'include', callback normally or the request will error with CORS.
				if (lowercase === 'access-control-allow-credentials' && responseHeaders[key][0] === 'true') return callback(responseHeaders);

				// Response headers may have varying letter casing, so we need to check in lowercase.
				if (lowercase === 'access-control-allow-origin') {
					delete responseHeaders[key];
					break;
				}
			}

			return callback({
				responseHeaders: {
					...responseHeaders,
					'access-control-allow-origin': ['*']
				}
			});
		});

		this.started = true;
	}

	/**
	 * Recursively swap all files in the target directory.
	 *
	 * @param prefix - The target directory to swap.
	 */
	private recursiveSwap(prefix: string): void {
		try {
			for (const dirent of readdirSync(pathJoin(this.swapDir, prefix), { withFileTypes: true })) {
				const name = `${prefix}/${dirent.name}`;

				// If the file is a directory, swap it recursively.
				if (dirent.isDirectory()) {
					this.recursiveSwap(name);
				} else {
					// browserfps.com has the server name as the subdomain instead of 'assets', so we must take that into account.
					const tests = [
						`*://*.${TARGET_GAME_DOMAIN}${name}`,
						`*://*.${TARGET_GAME_DOMAIN}${name}?*`,
						`*://*.${TARGET_GAME_DOMAIN}/assets${name}`,
						`*://*.${TARGET_GAME_DOMAIN}/assets${name}?*`
					];
					this.urls.push(...(/^\/(?:models|textures|sound|scares|videos)(?:$|\/)/u.test(name)
						? tests
						: [
							...tests,
							`*://comp.${TARGET_GAME_DOMAIN}${name}?*`,
							`*://comp.${TARGET_GAME_DOMAIN}/assets/${name}?*`
						]
					));
				}
			}
		} catch (err) {
			console.error(`Failed to resource-swap with prefix: ${prefix}`);
		}
	}

}
