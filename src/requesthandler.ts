import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join as pathJoin } from 'path';

// TODO: conditional import

import { ElectronRequestType, FiltersEngine, Request } from '@cliqz/adblocker';
import { WebRequest } from 'electron';

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

	private swapUrls: RegExp[] = [];

	private engine: FiltersEngine;

	private started = false;

	private swapDir: string;

	private defaultFilters: string;

	private customFilters: string;

	/**
	 * Set the target window.
	 *
	 * @param browserWindow - The target window.
	 */
	// FIXME: better way to enable/disable?
	public constructor(browserWindow: Electron.BrowserWindow, swapDir: string, swapperEnabled: boolean, blockerEnabled: boolean, defaultFilters: string, customFilters: string) {
		this.browserWindow = browserWindow;
		this.swapDir = swapDir;
		this.swapperEnabled = swapperEnabled;
		this.blockerEnabled = blockerEnabled;
		this.defaultFilters = defaultFilters;
		this.customFilters = customFilters;
	}

	/** Initialize the request handler for the target window.*/
	public start(): void {
		if (this.started) return;

		// If the target directory doesn't exist, create it.
		if (!existsSync(this.swapDir)) mkdirSync(this.swapDir, { recursive: true });

		this.recursiveSwap('');

		this.engine = FiltersEngine.parse(`${this.defaultFilters}\n${this.customFilters}`);

		this.browserWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
			if (this.swapperEnabled) {
				let swapResourse = false;
				this.swapUrls.every(pattern => {
					if (details.url.match(pattern).length > 0) swapResourse = true;
					return swapResourse;
				});
				if (swapResourse) {
					const path = new URL(details.url).pathname;
					const resultPath = path.startsWith('/assets/') ? pathJoin(this.swapDir, path.substring(7)) : pathJoin(this.swapDir, path);

					// Redirect to the local resource.
					return callback({ redirectURL: `krunker-resource-swapper:/${resultPath}` });
				}
			}
			if (this.blockerEnabled) {
				const req = Request.fromRawDetails({
					_originalRequestDetails: details,
					requestId: `${details.id}`,
					sourceUrl: details.referrer,
					tabId: details.webContentsId,
					type: (details.resourceType || 'other') as ElectronRequestType,
					url: details.url
				});
				const { redirect, match } = this.engine.match(req);
				if (redirect) return callback({ redirectURL: redirect.dataUrl });
				else if (match) return callback({ cancel: true });
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
					const tests: RegExp[] = [
						new RegExp(`\\w+://\\w+\\.${TARGET_GAME_DOMAIN}${name}`, 'u'),
						new RegExp(`\\w+://\\w+\\.${TARGET_GAME_DOMAIN}${name}?.*`, 'u'),
						new RegExp(`\\w+://\\w+\\.${TARGET_GAME_DOMAIN}/assets${name}`, 'gu'),
						new RegExp(`\\w+://\\w+\\.${TARGET_GAME_DOMAIN}/assets${name}?.*`, 'gu')
					];
					this.swapUrls.push(...(/^\/(?:models|textures|sound|scares|videos)(?:$|\/)/u.test(name)
						? tests
						: [
							...tests,
							new RegExp(`\\w+://comp+\\.${TARGET_GAME_DOMAIN}${name}?.*`, 'gu'),
							new RegExp(`\\w+://comp+\\.${TARGET_GAME_DOMAIN}/assets${name}?.*`, 'gu')
						]
					));
				}
			}
		} catch (err) {
			console.error(`Failed to resource-swap with prefix: ${prefix}`);
		}
	}

}
