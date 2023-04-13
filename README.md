# crankshaft

[![Github All Releases](https://img.shields.io/github/downloads/KraXen72/crankshaft/total.svg)](https://github.com/KraXen72/crankshaft/releases/latest) [![Latest release](https://img.shields.io/github/downloads/KraXen72/crankshaft/latest/total)](https://github.com/KraXen72/crankshaft/releases/latest) [![Chat](https://img.shields.io/discord/966300714060116008)](https://discord.gg/ZeVuxG7gQJ)  

> a sensible krunker client built on the ashes of [Gatoclient](https://github.com/Gatohost/gatoclient) and [Gatoclient lite](https://github.com/LukeTheDuke240/gatoclient-lite)

![splash](assets/blank_splash.png)
**Download:** [Windows (x64)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-setup-win-x64.exe) - [Mac (x64)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-mac-x64.dmg) - [Linux (x86_64 AppImage)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-linux-x86_64.AppImage) - [Linux (i386 AppImage)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-linux-i386.AppImage) - [Other](https://github.com/KraXen72/crankshaft/releases/latest)

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
- uses the lightweight discord-rpc library, not the entire discord.js

## hotkeys

Press `Alt` to show electron menu. Here you can find all hotkeys.  
standard hotkeys like zooming, copying/pasting and devtools also included.  
**Client's hotkeys:**

- `F5`: reload
- `F6`: find a new match,
- `F7`: copy game link,
- `Ctrl+F7`: join game from clipboard
- `F12`: devtools (alternative hotkey)

## building from source
1. you have to have [`git`](https://git-scm.com/downloads) and [`nodejs`](https://nodejs.org/en/download/) (with `npm`, by default) installed.
2. installation:
   - `git clone https://github.com/KraXen72/crankshaft`
   - `cd crankshaft`
   - `npm i --openssl_fips=''`
3. **building from source**: `npm run dist`
### contributing
1. follow previous steps 1 & 2
2. make your changes + running from source: `npm run dev`/`npm run start`
   - make sure to run the code through the configured eslint before contributing. (vs code will enable it if you have the extension)
3. after your changes, try it out with `npm run testbuild` - this will minify the code & run the app.
   - until automated tests are added, try to manually test it works even after the code is minified. if it does not, you're probably doing something wrong
- please report any bugs/feature requests in the Issues.
- feel free to submit pull requests, they will be merged as long as they support the client ideology.
