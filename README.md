# crankshaft 
  > a sensible krunker client built on the ashes of [Gatoclient](https://github.com/Gatohost/gatoclient) and [Gatoclient lite](https://github.com/LukeTheDuke240/gatoclient-lite)
  
![splash](https://cdn.discordapp.com/attachments/704792091955429426/963921255365480618/blank_splash.png)     
  
[![Github All Releases](https://img.shields.io/github/downloads/KraXen72/crankshaft/total.svg)](https://github.com/KraXen72/crankshaft/releases/latest) [![Latest release](https://img.shields.io/github/downloads/KraXen72/crankshaft/latest/total)](https://github.com/KraXen72/crankshaft/releases/latest)  [![Chat](https://img.shields.io/discord/966300714060116008)](https://discord.gg/ZeVuxG7gQJ)
## features
- very good performance with additional performance enhancing settings
- no unnecesarry built-in features that can't be turned off
- maintained & open source
- a lot of customisation options (settings)
- userscript support (can be disabled)
  
## quality of life
- no artificial "splash screens" that increase load time, splash shows over krunker actually loading
- doesen't automatically open free spin urls, prompts you before
- doesen't disable web security
- Hides ads by default (can be turned off)
- written in typescript
- only 2 dependencies: (`v8-compile-cache` and `esbuild`)
- built-in hotkeys: `F5` to reload, `F6` to find a new match and `F12` to relaunch client (standard hotkeys like zooming and devtools also included)
  
## userscripts
- any `.js` file in `Documents/Crankshaft/scripts` will be considered a userscript and executed if enabled in settings.   
- There is one official & example userscript, the [keystrokes.js](https://gist.github.com/KraXen72/2ea1332440b0c66b83ca9b73afc38269) userscript. (shows wasd, shift and space keystrokes on screen). Feel free to download it and put into the `/scripts` directory
### features:  
- no overcomplicated format required for userscripts. just make sure it is valid js code.
- all userscripts are disabled when they are first added.
- refresh the page to see userscript changes.
  
### notes:
- when *userscript support* is disabled in settings, no code related to this feature will run inside or outside the client. => doesen't have any performance impact on the client if disabled
- userscripts are executed *as soon as possible*, if you want to add elements, add a `DOMContentLoaded` eventlistener
- DO NOT DELETE `Documents/Crankshaft/scripts/tracker.json`, it is used to keep track of enabled and disabled userscripts
  
> Use userscripts at your own risk, the author(s) of this client are not responsible for any damage done with userscripts because the user is the author of the script.   
> Enabling any userscript you don't trust and know how it works is NOT RECOMMENDED
> Any userscripts that modify the game's canvas (Renderer) are NOT ALLOWED 
  
## contributing
- you have to have `git`, `nodejs` and `npm` installed.
- installation: `git clone https://github.com/KraXen72/crankshaft`, `cd crankshaft`, `npm i`
- running from source: `npm run start`, building: `npm run dist`
- pleae edit the `.ts` files found in `src`, not `.js` files! the typescript files get compiled into js so any changes you make to javascript files are redundant.
- please report any bugs/feature requests in the Issues.   
- feel free to submit pull requests, they will be merged as long as they support the client ideology. 
  
## where to download?
- releases tab.
- it is generally recommended to use the installer version (for example `crankshaft-setup-win-x64.exe`) rather than portable, because portable version has bad performance
- almost always use the 64 bit version (ends in `-x64`), rather than a general or 32bit one, unless your computer is 32bit. (it most likely isn't)
- if you're having trouble with the installer, report the troubles in Issues and try running from source
  
