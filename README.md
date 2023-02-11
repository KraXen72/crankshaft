# crankshaft

> a sensible krunker client built on the ashes of [Gatoclient](https://github.com/Gatohost/gatoclient) and [Gatoclient lite](https://github.com/LukeTheDuke240/gatoclient-lite)

![splash](assets/blank_splash.png)

[![Github All Releases](https://img.shields.io/github/downloads/KraXen72/crankshaft/total.svg)](https://github.com/KraXen72/crankshaft/releases/latest) [![Latest release](https://img.shields.io/github/downloads/KraXen72/crankshaft/latest/total)](https://github.com/KraXen72/crankshaft/releases/latest) [![Chat](https://img.shields.io/discord/966300714060116008)](https://discord.gg/ZeVuxG7gQJ)

## client features

- very good performance with additional performance enhancing settings
- no unnecesarry built-in features that can't be turned off
- maintained & open source
- a lot of customisation options (settings)
- userscript support (can be disabled)
- discord rpc support (can be disabled)
- built-in hotkeys: [more about them here](https://github.com/KraXen72/crankshaft#hotkeys)

## quality of life

- no artificial "splash screens" that increase load time, splash shows over krunker actually loading
- _hides_ ads by default (can be turned off)
- doesen't automatically open free spin urls, prompts you before
- **secure:** `web security` is on, the `remote` module and `nodeIntegration` are disabled
- written in typescript
- no-compromise mac, linux and windows support
- dependencies only get imported when they are actually used

## userscripts

- any `.js` file in `Documents/Crankshaft/scripts` will be considered a userscript and executed if enabled in settings.
- There are a few official/example userscripts:
  - [keystrokes.js](https://gist.github.com/KraXen72/2ea1332440b0c66b83ca9b73afc38269): shows WASD, shift, space and 2 configurable keys on screen.
  - [autospectate.js](https://gist.github.com/KraXen72/270b2b8f28dda974f9e643b384e87a68): automatically joins game as spectator if turned on

Feel free to download them and put them into the `/scripts` directory.

### features

- no overcomplicated format required for userscripts. just make sure it is valid js code.
- all userscripts are disabled when they are first added.
- refresh the page to see userscript changes.

### notes

- when _userscript support_ is disabled in settings, no code related to this feature will run inside or outside the client. => doesen't have any performance impact on the client if disabled
- DO NOT DELETE `Documents/Crankshaft/scripts/tracker.json`, it is used to keep track of enabled and disabled userscripts

> Use userscripts at your own risk, the author(s) of this client are not responsible for any damage done with userscripts because the user is the author of the script.
> Enabling any userscript you don't trust and know how it works is NOT RECOMMENDED

If you want to write a userscript, please read the [Documentation](./USERSCRIPTS.md)

## discord rich presence

- enable discord rich presence to show off your gamemode, map, class and skin to your discord friends!
- doesen't affect performance in any way when disabled
- only updates the presence while you're not actively in-game.
- you can enable "Extended Discord RPC" to also add Discord and Github buttons/links under your rich presence in discord
- uses the lightweight discord-rpc librarly, not the entire discord.js

## hotkeys

Press `Alt` to show electron menu. Here you can find all hotkeys.  
standard hotkeys like zooming, copying/pasting and devtools also included.  
**Client's hotkeys:**

- `F5`: reload
- `F6`: find a new match,
- `F7`: copy game link,
- `Ctrl+F7`: join game from clipboard
- `F10`: relaunch
- `F12`: devtools (alternative hotkey)

## contributing

- you have to have `git`, `nodejs` and `npm` installed.
- installation: `git clone https://github.com/KraXen72/crankshaft`, `cd crankshaft`, `npm i`
  - if you get an error along the lines of `'openssl_fips' is not defined`, use `npm i --openssl_fips=''`
- running from source: `npm run dev`/`npm run start`(slower), building: `npm run dist`
- `npm run dev` is faster but test it also once with `npm run start` because `dev` script is experimental
- please report any bugs/feature requests in the Issues.
- make sure to run the code through the configured eslint before contributing. (vs code will enable it if you have the extension)
- feel free to submit pull requests, they will be merged as long as they support the client ideology.

## where to download?

- releases tab.
- it is generally recommended to use the installer version (for example `crankshaft-setup-win-x64.exe`) rather than portable, because portable version has bad performance
- almost always use the 64 bit version (ends in `-x64`), rather than a general or 32bit one, unless your computer is 32bit. (it most likely isn't)
- if you're having trouble with the installer, report the troubles in Issues and try running from source
