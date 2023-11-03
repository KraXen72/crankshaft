# crankshaft

[![GitHub All Releases](https://img.shields.io/github/downloads/KraXen72/crankshaft/total.svg)](https://github.com/KraXen72/crankshaft/releases/latest) [![Latest release](https://img.shields.io/github/downloads/KraXen72/crankshaft/latest/total)](https://github.com/KraXen72/crankshaft/releases/latest) [![Chat](https://img.shields.io/discord/966300714060116008)](https://discord.gg/ZeVuxG7gQJ) [![Recurring donation via Liberapay](https://img.shields.io/badge/donate-liberapay-%23f6c915?logo=liberapay)](https://liberapay.com/KraXen72) [![One-time donation via ko-fi.com](https://img.shields.io/badge/donate-ko--fi-%23ff5e5b?logo=kofi)](https://ko-fi.com/kraxen72)

> A fast, feature-rich krunker client written in TypeScript
  
**Download:** [Windows (x64)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-setup-win-x64.exe) - [Mac (x64)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-mac-x64.dmg) - [Linux (x86_64 AppImage)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-linux-x86_64.AppImage) - [Linux (i386 AppImage)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-linux-i386.AppImage) - [Other](https://github.com/KraXen72/crankshaft/releases/latest)  
![splash](assets/blank_splash.png)

## Client Features
- Very good performance with additional performance enhancing settings
- Highly customisable, many different settings
- _Hides_ ads by default (can be disabled)
- Resource swapper (css, sounds & all other assets)
- Userscript support
- Discord RPC (gamemode, map, class & skin)
- Customisable matchmaker (Gamemode, Region, Min/Max players, Time)
- Quick class switcher using `#hiddenClasses`
- Built-in hotkeys: [more about them here](#hotkeys)
- Maintained & open source

## Quality of Life
- All client specific **features can be turned off** to ensure **maximum performance**.
  - Once a feature is disabled, none of its code runs.
  - For example, when 'Discord RPC' is turned off, crankshaft doesn't even import the [discord-rpc](https://github.com/discordjs/RPC) library.
- **Written in TypeScript**
- **Secure:** `web security` is on, the `remote` module and `nodeIntegration` are disabled.
- Splash screen is not a separate window, shows only while krunker is actually loading.
- Doesn't automatically open free spin urls in browser. _(You can open them in a new window, in browser or not open them at all.)_
- Discord RPC: If enabled, only updates while you're not actually in game. Does not use `setInterval` like other clients _(This means better performance)_.
- No-compromise MacOS, Linux and Windows support.
- Only 4 dependencies!

## Userscripts

- Any `.js` file in `%APPDATA%/crankshaft/config/scripts` will be considered a userscript and executed if enabled in settings.
- There are a few official/example userscripts:
  - [keystrokes.js](https://gist.github.com/KraXen72/2ea1332440b0c66b83ca9b73afc38269): shows WASD, shift, space and 2 configurable keys on screen.
  - [autospectate.js](https://gist.github.com/KraXen72/270b2b8f28dda974f9e643b384e87a68): automatically joins game as spectator if turned on
- All userscripts are disabled when they are first added.
- `%APPDATA%/crankshaft/config/tracker.json` is used to keep track of enabled userscripts.
- Built-in custom krunker settings implementation.
  
If you want to write a userscript or learn more about them, read the [Documentation](./USERSCRIPTS.md).
> **Use userscripts at your own risk**, the author(s) of this client are **not responsible for any damage done** with userscripts because the user is the author of the script.
> **Do not write or use any userscripts which would give the user a competitive advantage.**
  
## Hotkeys

Press `Alt` to show electron menu. Here you can find all hotkeys.  
standard hotkeys like zooming, copying/pasting and devtools also included.  
**Client's hotkeys:**

- `F5`: Reload Krunker
- `F6`: Find a new match
- `F7`: Copy game link
- `CTRL+F7`: Join game from Clipboard
- `CTRL+SHIFT+I`: Devtools/Inspect Page
- `F12`: Devtools/Inspect Page (alternative hotkey)

## Matchmaker
A customisable matchmaker (with GUI settings!) that you can use alongside/instead of the regular `F6`.
![Custom crankshaft matchmaker](./assets/matchmaker_screenshot.png)

## Upcoming Breaking Change
- **From version `1.9.0`, crankshaft will no longer support `Documents/crankshaft` for configuration.**
- **Make a backup of `Documents/crankshaft` before updating.**
- **crankshaft 1.9.0 will auto-migrate the folder**, but there's a *very small chance* it could fail while moving/copying/deleting the files, and you'd lose your settings, swapper & scripts.
- This is due to inconsistent read/write permissions for users whose Documents directory lives inside of OneDrive or has been otherwise moved.
- Version 1.9.0 adds quick-open buttons for the new directories & files; in older versions they are harder to access.

## Building from Source
1. **You have to have [git](https://git-scm.com/downloads) and [nodejs](https://nodejs.org/en/download/) 12+ installed**.
   - if you're planning on contributing and not just building from source, use `pnpm` ([link](https://pnpm.io) or `npm i -g pnpm`) instead of `npm`.
   - for `pnpm`, you don't have to pass `--openssl_fips=''` when installing
2. **Installation**:
   - `git clone https://github.com/KraXen72/crankshaft`
   - `cd crankshaft`
   - `npm i --openssl_fips=''`
3. **Building from Source**: `npm run dist`
  
### Contributing
1. Follow previous steps 1 & 2
2. Make your changes + running from source: `pnpm start`/`pnpm dev` (rebuilds on changes, refresh krunker with `F6`)
   - make sure to run the code through the configured eslint before contributing. (vs code will enable it if you have the extension)
3. After your changes, try it out with `pnpm testbuild` - this will minify the code & run the app.
   - until automated tests are added, try to manually test it works even after the code is minified. if it does not, you're probably doing something wrong
- Please report any bugs/make feature requests in the Issues.
- Feel free to submit pull requests, they will be merged as long as they support the client ideology.

### Credits
- [Creepycats](https://github.com/creepycats) released [Gatoclient](https://github.com/Gatohost/gatoclient), which was based on top of [idkr](https://github.com/idkr-client/idkr).
- crankshaft was built on top of [Gatoclient lite](https://github.com/LukeTheDuke240/gatoclient-lite), an `app.asar` mod optimizing Gatoclient by [LukeTheDuke](https://github.com/LukeTheDuke240).
- Very little code remains, as crankshaft was rewritten in typescript & more features were added.
- Gatoclient was later rewritten, implementing some code from crankshaft too.
- **other acknowledgments**
  - [wa/paintingofblue](https://github.com/paintingofblue) - matchmaker implementation
  - [Commander/asger-finding](https://github.com/asger-finding) (AKC client) - resource swapper implementation
  - [Tae](https://github.com/whuuayu) - awesome logo for the client <3

## Support Development
[![Recurring donation via Liberapay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/KraXen72) [![One-time donation via ko-fi.com](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/kraxen72)
  
You can support ongoing development & maintainance by donating. All donations are highly appreciated! <3
