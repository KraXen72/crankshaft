# crankshaft
> a sensible client built on the ashes of [Gatoclient](https://github.com/Gatohost/gatoclient) and [Gatoclient lite](https://github.com/LukeTheDuke240/gatoclient-lite)
- very good performance with additional performance enhancing settings
- no feature bloat
- maintained & open source
- no artificial "splash screens" that increase load time, splash shows over krunker actually loading
- a lot of customisation options (settings)
  
## quality of life
- doesen't automatically open free spin urls, prompts you before
- doesen't disable web security
- Hides ads by default (can be turned off)
- only 4 dependencies: (`electron`, `electron-builder`, `v8-compile-cache` and `esbuild`)
  
## notes
- i rewrote the settings and added a bunch of comments so you and later me are not confused :)
- todo is for features/stuff i had in mind, if you feel like doing it, have at it, otherwise i'll do it ig
- there is a breaking change: users' settings from gatoclient lite will not work as we have added more settings.
- rewrote splash
  
[crankshaft splash screen|550](https://cdn.discordapp.com/attachments/854825676196413501/957590402888765500/20220327_124127.jpg)  
## TODO 
- [x] major cleanup (done)
- [x] rewrite settings
- [x] rewrite splash: we need our own splash + i thought we could add credits there
	- [x] don't load pic from discord [svg optimizer](https://svgoptimizer.com)  [svg editor](https://www.svgeditoronline.com)  
	- [x] inject css sooner
	- [x] add logo and title text
	- [x] ~~idkr font~~
	- [x] tae's fixed logo but recenter
- [x] setting todo
	- [x] searching unhooks the client settings
	- [x] => fix eventlisteners by `const callback`, `try catch remove eventlistener(callback)`, `add eventlistener(callback)`  
	- [x] ~~client settings shoud probably be searchable also~~
- [x] remove old splash screen
- [x] search and replace - ``GatoclientLite`` and `Gato`
- [x] name the client lmfao
- [x] add credits somewhere in the client
- [x] custom window open handler
	- [x] supress free spins
	- [x] custom social preload
	- [x] yeet social window implementation
	- [x] note to self: rewrite with 'new-window' and e.preventDefault(), run . setMenuBarVisibility on the newly created window
- [ ] simple userscripts: js files get put into folder. client recognizes them, if you enable them they get injected. no complicated template usercripts must follow. no setting hooks.
	- [x] minify content before evaluating. scripts either have to "use strict" or run them through a minifier to solve this.
	- [x] eval the code in them
	- [x] a json to keep track of disabled/enabled userscripts
	- [ ] render settings for userscripts
	- [ ] save settings to tracker.json
	- [ ] note to refresh page to apply userscript
	- [ ] keystrokes userscript (both capital and lowercase letters)
	- [ ] sky color userscript
- [ ] test performance with the various flags: determine which ones are good
- [x] collapsible settings legend and note
- [x] settings categories? idk
- [x] remove ads setting (just injects css, later can block requests maybe)
- [x] put on github
- [x] svg icon into ico and put in `./build`
- [x] only hide the advslider if it's already advanced
- [x] the holders in bottom right and left in splash should have themeable ids
  
## optional
- [ ] ~~plugin system? plugins could be basically more powerful userscripts ig. but now sure yet~~
- [ ] welcome screen
- [ ] autoupdate
- [ ] about screen with credits
- [ ] client changelog? could be just a link to github
- [ ] typescript rewrite (maybe not even needed) i can take a look at setting this up because it's not super intuitive how to set up typescript for electron. would be good int he long term tho.
  