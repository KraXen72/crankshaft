# crankshaft
  
[![GitHub All Releases](https://img.shields.io/github/downloads/KraXen72/crankshaft/total.svg)](https://github.com/KraXen72/crankshaft/releases/latest) [![Latest release](https://img.shields.io/github/downloads/KraXen72/crankshaft/latest/total)](https://github.com/KraXen72/crankshaft/releases/latest) [![Chat](https://img.shields.io/discord/966300714060116008)](https://discord.gg/ZeVuxG7gQJ) [![Recurring donation via Liberapay](https://img.shields.io/badge/donate-liberapay-%23f6c915?logo=liberapay)](https://liberapay.com/KraXen72) [![One-time donation via ko-fi.com](https://img.shields.io/badge/donate-ko--fi-%23ff5e5b?logo=kofi)](https://ko-fi.com/kraxen72)

> a fast, feature-rich krunker client written in typescript
  
**Download:** [Windows (x64)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-setup-win-x64.exe) - [Mac (x64)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-mac-x64.dmg) - [Linux (x86_64 AppImage)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-linux-x86_64.AppImage) - [Linux (i386 AppImage)](https://github.com/KraXen72/crankshaft/releases/latest/download/crankshaft-portable-linux-i386.AppImage) - [Other](https://github.com/KraXen72/crankshaft/releases/latest)  
  
## upcoming breaking change
- **from version `1.9.0`, crankshaft will no longer support `Documents/Crankshaft` for configuration.**
- **make a backup of `Documents/Crankshaft` before updating.**
- **crankshaft 1.9.0 will auto-migrate the folder** to the new location in `%APPDATA%`, but there's a *very small chance* it could fail while moving/copying/deleting the files, and you'd lose your settings, swapper & scripts.
- this is due to inconsistent read/write permissions for users whose Documents directory lives inside of OneDrive or has been otherwise moved.
- crankshaft 1.9.0 will add quick-open buttons for the new directories & files for easy access.
  
![splash](assets/blank_splash.png)  
  
## client features
- very good performance with additional performance enhancing settings
- highly customisable, many different settings
- _hides_ ads by default (can be disabled)
- resource swapper (css, sounds & all other assets)
- userscript support
- discord RPC (gamemode, map, class & skin)
- customisable matchmaker (Gamemode, Region, Min/Max players, Time)
- quick class switcher using `#hiddenClasses`
- built-in hotkeys: [more about them here](#hotkeys)
- maintained & open source
  
## quality of life
- all client specific **features can be turned off** to ensure **maximum performance**
  - once a feature is disabled, none of it code runs
  - for example, while 'Discord RPC' is off, crankshaft does not even import the [discord-rpc](https://github.com/discordjs/RPC) library.
- **written in typescript**
- **secure:** `web security` is on, the `remote` module and `nodeIntegration` are disabled
- splash screen is not a separate window, shows only while krunker is actually loading.
- doesn't automatically open free spin urls in browser
  - you can open them in a new window, in browser or not open them at all
- Discord RPC: if enabled, only updates while you're not actually in game. Does not use `setInterval` like other clients.
- no-compromise mac, linux and windows support
- only 4 dependencies

## userscripts

- any `.js` file in `%APPDATA%/crankshaft/config/scripts` will be considered a userscript and executed if enabled in settings.
- There are a few official/example userscripts:
  - [keystrokes.js](https://gist.github.com/KraXen72/2ea1332440b0c66b83ca9b73afc38269): shows WASD, shift, space and 2 configurable keys on screen.
  - [autospectate.js](https://gist.github.com/KraXen72/270b2b8f28dda974f9e643b384e87a68): automatically joins game as spectator if turned on
- all userscripts are disabled when they are first added.
- `%APPDATA%/crankshaft/config/tracker.json` is used to keep track of enabled userscripts.
  
If you want to write a userscript or learn more about them, read the [Documentation](./USERSCRIPTS.md)  
> **Use userscripts at your own risk**, the author(s) of this client are **not responsible for any damage done** with userscripts because the user is the author of the script.
> **Do not write or use any userscripts which would give the user a competitive advantage.**
  
## hotkeys

Press `Alt` to show electron menu. Here you can find all hotkeys.  
standard hotkeys like zooming, copying/pasting and devtools also included.  
**Client's hotkeys:**

- `F5`: reload
- `F6`: find a new match,
- `F7`: copy game link,
- `Ctrl+F7`: join game from clipboard
- `F12`: devtools (alternative hotkey)

## matchmaker
a customisable matchmaker (with GUI settings!) that you can use alongside/instead of the regular `F6` 
![matchmaker](./assets/matchmaker_screenshot.png)

## building from source
1. **you have to have [git](https://git-scm.com/downloads), [nodejs](https://nodejs.org/en/download/), and [pnpm](https://pnpm.io/installation) installed**.
2. **installation**:
   - `git clone https://github.com/KraXen72/crankshaft`
   - `cd crankshaft`
   - `pnpm i`
3. **building from source**: `pnpm dist`
  
### contributing
1. follow previous steps 1 & 2
2. make your changes + running from source: `pnpm start`/`pnpm dev` (rebuilds on changes, refresh krunker with `F6`)
   - make sure to run the code through the configured eslint before contributing. (vs code will enable it if you have the extension)
3. after your changes, try it out with `pnpm testbuild` - this will minify the code & run the app.
   - until automated tests are added, try to manually test it works even after the code is minified. if it does not, you're probably doing something wrong
- please report any bugs/feature requests in the Issues.
- feel free to submit pull requests, they will be merged as long as they support the client ideology.
  
#### wanted/potential features
- here are some features i wanted to add, but don't have the time to
- if you're looking to contribute, feel free to open pr's for these
- [ ] **Add a new setting type: Keybind**
  - after clicking it, it would wait until a keypress that isn't esc & register it
  - there would be a reset button to `[none]` next to the setting input
  - allow userscripts to create this setting type
- [ ] **Matchmaker: Map autocomplete**
  - create a simple typeahead/autocomplete for the matchmaker, where you can input maps (official ones)
    - you can get more info about maps from [this krunker api link](https://matchmaker.krunker.io/game-list?hostname=krunker.io) or the [client code](https://github.com/KraXen72/crankshaft/blob/master/src/matchmaker.ts)
    - [Wes Bos' Javascript30 free course (episode 6)](https://javascript30.com) is a tutorial on how to implement a typeahead in vanilla js
      - (you'd use typescript but it's very similar)
  - allow toggling the list of maps between whitelist/blacklist
  - take this white/blacklist into account when using the matchmaker
- [ ] **Add tests**
  - could be useful, testing a few thigs like: if the game loads, if settings load, if you can set a setting, etc.
- [ ] **Add autoupdate** (whatever official way electron recommends)
  - i tried to add this once and failed.
  - honestly good luck since this client uses an ancient electron version due to all the newer ones having a bug that causes aim freeze in krunker

### credits
- [Creepycats](https://github.com/creepycats) released [Gatoclient](https://github.com/Gatohost/gatoclient), which was based on top of [idkr](https://github.com/idkr-client/idkr).
- Crankshaft was built on top of [Gatoclient lite](https://github.com/LukeTheDuke240/gatoclient-lite), an `app.asar` mod optimizing Gatoclient by [LukeTheDuke](https://github.com/LukeTheDuke240).
- Very little code remains, as Crankshaft was rewritten in typescript & more features were added.
- Gatoclient was later rewritten, implementing some code from Crankshaft too.
- **other acknowledgments**
  - [wa/paintingofblue](https://github.com/paintingofblue) - matchmaker implementation
  - [Commander/asger-finding](https://github.com/asger-finding) (AKC client) - resource swapper implementation
  - [Tae](https://github.com/whuuayu) - awesome logo for the client <3

## support development
[![Recurring donation via Liberapay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/KraXen72) [![One-time donation via ko-fi.com](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/kraxen72)
  
You can support ongoing development & maintainance by donating. All donations are highly appreciated! <3
