import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join as pathJoin } from 'path';

import { Filter } from 'electron';
import { readFileSync } from 'original-fs';

// TODO: conditional import (?)
import { URLPattern } from 'urlpattern-polyfill';

const TARGET_GAME_DOMAIN = 'krunker.io';

/// <reference path="global.d.ts" />

/**
 * RequestHandler
 * @class RequestHandler
 */
export default class {

	private browserWindow: Electron.BrowserWindow;

	private swapperEnabled: boolean;

	private blockerEnabled: boolean;

	private customFiltersEnabled: boolean;

	private filter: Filter = { urls: [] };

	private swapUrls: string[] = [];

	private started = false;

	private swapDir: string;

	private defaultFilters: string[];

	private customFilters: string[] = [];

	/**
	 * Set the target window.
	 *
	 * @param browserWindow - The target window.
	 */
	// FIXME: better way to enable/disable?
	public constructor(browserWindow: Electron.BrowserWindow, swapDir: string, swapperEnabled: boolean, blockerEnabled: boolean, customFiltersEnabled: boolean, defaultFiltersStr: string, customFiltersPath: string) {
		this.browserWindow = browserWindow;
		this.swapDir = swapDir;
		this.swapperEnabled = swapperEnabled;
		this.blockerEnabled = blockerEnabled;
		this.customFiltersEnabled = customFiltersEnabled;

		this.defaultFilters = defaultFiltersStr.split(/\r?\n/u);
		this.customFilters = readFileSync(customFiltersPath, { encoding: 'utf-8' }).toString()
			.split(/\r?\n/u)
			.filter(filter => filter[0] !== '#');
	}

	/** Initialize the request handler for the target window.*/
	public start(): void {
		if (this.started) return;

		// If the target directory doesn't exist, create it.
		if (!existsSync(this.swapDir)) mkdirSync(this.swapDir, { recursive: true });

		if (this.swapperEnabled) {
			this.recursiveSwap('');
			this.filter.urls.push(...this.swapUrls);
		}

		if (this.blockerEnabled) this.filter.urls.push(...this.defaultFilters);

		if (this.customFiltersEnabled) this.filter.urls.push(...this.customFilters.filter(i => i !== ''));

		this.browserWindow.webContents.session.webRequest.onBeforeRequest(this.filter, (details, callback) => {
			if (this.swapperEnabled) {
				const swapResourse = this.swapUrls.some(pat => new URLPattern(pat).test(details.url));
				if (swapResourse) {
					const path = new URL(details.url).pathname;
					const resultPath = path.startsWith('/assets/') ? pathJoin(this.swapDir, path.substring(7)) : pathJoin(this.swapDir, path);

					// Redirect to the local resource.
					return callback({ redirectURL: `krunker-resource-swapper:/${resultPath}` });
				}
			}
			if (this.blockerEnabled || this.customFiltersEnabled) {
				const block = this.filter.urls.some(pat => new URLPattern(pat).test(details.url));
				if (block) return callback({ cancel: true });
			}
			return callback({});
		});


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
	 * Generate a list of url match patterns for all resources to swap (recursive)
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
					this.swapUrls.push(...(/^\/(?:models|textures|sound|scares|videos)(?:$|\/)/u.test(name)
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
