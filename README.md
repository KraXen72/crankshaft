# crankshaft
![splash](https://cdn.discordapp.com/attachments/704792091955429426/963921255365480618/blank_splash.png)  
> a sensible krunker client built on the ashes of [Gatoclient](https://github.com/Gatohost/gatoclient) and [Gatoclient lite](https://github.com/LukeTheDuke240/gatoclient-lite)
  
[![Github All Releases](https://img.shields.io/github/downloads/KraXen72/crankshaft/total.svg)]()
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
> Any userscripts that modify the game's canvas (Renderer) are NOT ALLOWED and WILL NOT RUN (sky color script, etc)    
  
## contributing
- you have to have `git`, `nodejs` and `npm` installed.
- installation: `git clone https://github.com/KraXen72/crankshaft`, `cd crankshaft`, `npm i`
- running from source: `npm run start`, building: `npm run dist`
- pleae edit the `.ts` files found in `src`, not `.js` files! the typescript files get compiled into js so any changes you make to javascript files are redundant.
- please report any bugs/feature requests in the Issues.   
- feel free to submit pull requests, they will be merged as long as they support the client ideology.  
- we don't have a client discord server yet, but once there is one the link will be here => ____.p
  
## where to download?
- go releases tab, download `crankshaft-setup-win-x64.exe` if you're on windows.
- macos builds not available currently because i do not own a mac computer.   
- if you have a mac, you can build it yourself by doing `git clone https://github.com/KraXen72/crankshaft`, `cd crankshaft`, `npm i` and `npm run macdist`.  
- if you sucessfully build it or have the ability to write a mac building github action, message me on discord (in my github profile).
- you can build electron for linux in theory with `electron-builder --linux`, but i had no sucess with it. if you sucessfully build it or have the ability to write a linux building github action, message me on discord (in my github profile).