# crankshaft
> a sensible client built on the ashes of [Gatoclient](https://github.com/Gatohost/gatoclient) and [Gatoclient lite](https://github.com/LukeTheDuke240/gatoclient-lite)  
- very good performance with additional performance enhancing settings
- no feature bloat
- maintained & open source
- no artificial "splash screens" that increase load time, splash shows over krunker actually loading
- a lot of customisation options (settings)
  
## notes
- i rewrote the settings and added a bunch of comments so you and later me are not confused :)
- todo is for features/stuff i had in mind, if you feel like doing it, have at it, otherwise i'll do it ig
- there is a breaking change: users' settings from gatoclient lite will not work as we have added more settings.
- rewrote splash
## TODO - luke feel free to edit this when you implement something
- [x] major cleanup (done)
- [x] rewrite settings
- [x] rewrite splash: we need our own splash + i thought we could add credits there
	- [x] don't load pic from discord [svg optimizer](https://svgoptimizer.com)  [svg editor](https://www.svgeditoronline.com)  
	- [x] inject css sooner
	- [x] add logo and title text
	- [x] tae's fixed logo but recenter
- [x] setting todo
	- [x] searching unhooks the client settings
	- [x] => fix eventlisteners by `const callback`, `try catch remove eventlistener(callback)`, `add eventlistener(callback)`  
- [x] remove old splash screen
- [ ] search and replace - ``GatoclientLite`` and `Gato`
- [ ] remove ads setting (just injects css, later can block requests maybe)
- [ ] rewrite social window so it's not hidden and shown, rather it should be properly destroyed and made as to not consume resources while main window is running
- [x] name the client lmfao
- [x] add credits somewhere in the client
- [ ] option to supress opening free spin links so i don't have to wait 10 secons for my main broser to boot up load a youtube page just to close it later
- [ ] simple userscripts: js files get put into folder. client recognizes them, if you enable them they get injected. no complicated template usercripts must follow. no setting hooks.
	- [ ] keystrokes userscript (both capital and lowercase letters)
	- [ ] sky color userscript
- [ ] test performance with the various flags: determine which ones are good
- [ ] settings that don't require restart shouldn't require restart
- [x] put on github
  
## optional
- [ ] welcome screen
- [ ] autoupdate
- [ ] about screen with credits
- [ ] client changelog? could be just a link to github
- [ ] typescript rewrite (maybe not even needed) i can take a look at setting this up because it's not super intuitive how to set up typescript for electron. would be good int he long term tho.
  