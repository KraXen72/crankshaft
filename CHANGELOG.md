## [1.4.0](https://github.com/KraXen72/crankshaft/compare/1.3.1...1.4.0) (2022-04-26)


### Features

* broken userscripts now report errors and don't break client ([198a40e](https://github.com/KraXen72/crankshaft/commit/198a40e24b73847acffe99f5ba741218e533068c))
* **footprint:** more generic swap protocol name ([90a2cc1](https://github.com/KraXen72/crankshaft/commit/90a2cc1441d5aa959dab2a18ec237bf03983523f))
* instant settings now have an autorefresh icon ([39ec1e9](https://github.com/KraXen72/crankshaft/commit/39ec1e98ea693f73a9353f569d4970ec4ba72857))
* links to official userscripts if no scripts ([bf32347](https://github.com/KraXen72/crankshaft/commit/bf3234747ade6b62672c0a0d8d8c689186d667cc))
* menu timer and hide ads now use injectCSS ([e02e76c](https://github.com/KraXen72/crankshaft/commit/e02e76cc3465ac626019c7a5af5a95c2f63ec635))
* menuTimer ([07e252d](https://github.com/KraXen72/crankshaft/commit/07e252d559b5f57f8f1e62f05522bd00cd033e8b))
* menuTimer now has rounded borders ([6429b19](https://github.com/KraXen72/crankshaft/commit/6429b19fc374e68d40edcaae5e17390d8528a854))
* more anonymous User Agent ([5039934](https://github.com/KraXen72/crankshaft/commit/50399341a1cf6db6a63d322eb9b900d3c2388252))
* Proper stack trace for userscript errors ([308e87d](https://github.com/KraXen72/crankshaft/commit/308e87d713a6020a8a386b85ee9e4dc9e3c4730d))
* remove v8-compile-cache ([61b230f](https://github.com/KraXen72/crankshaft/commit/61b230ffbf47b882657880269c018a9e5986886e))
* rewrite settings - move into another file (change app structure) ([0add1d7](https://github.com/KraXen72/crankshaft/commit/0add1d77b2c449d0ca7a2f25153fdd9c57af6cc6))
* rewrote socialWindow. faster and only 1 at a time ([c56326f](https://github.com/KraXen72/crankshaft/commit/c56326f5e0636957f9d86d3e35e4f3b110da5d14))
* setting categories refactor ([d1a4b5b](https://github.com/KraXen72/crankshaft/commit/d1a4b5b90c4f58f669f373cf8fb8a29a37d33b74))
* Settings Categories ([462f3cf](https://github.com/KraXen72/crankshaft/commit/462f3cfd109a7a6e135bcf5d73d8c45bd455e5be))
* use esbuild for dev builds ([b92e789](https://github.com/KraXen72/crankshaft/commit/b92e78935211254bf83fb2c42927725fab42dede))
* warning icon in settings instead of ? ([d6d7843](https://github.com/KraXen72/crankshaft/commit/d6d7843c9ae282271d35bcf617d5ae809586511d))


### Bug Fixes

* bannedcode (again) ([a727213](https://github.com/KraXen72/crankshaft/commit/a7272137bb6807660c35e58202f44967b7a77267))
* new splash displays background again ([21fb7f2](https://github.com/KraXen72/crankshaft/commit/21fb7f2281337a7748dfa1c8ceac7c7aa76d36c7))
* settings incorrectly remembered last tab ([f0d594f](https://github.com/KraXen72/crankshaft/commit/f0d594f405856a84d39d5919244121eb02e231e6))
* settings injecting twice ([1b680db](https://github.com/KraXen72/crankshaft/commit/1b680dbf6ce23ac038c33acc331a45537ef23065))
* settings now hook correctly with minimal footprint ([95a9f50](https://github.com/KraXen72/crankshaft/commit/95a9f50cd0e578636b26d8e123503923ce272a1f))
* settings object will now gracefully add new settings ([e75c1bc](https://github.com/KraXen72/crankshaft/commit/e75c1bc6c7ce62d7082d9e3b7f31346b0455f9af))
* small black bar while loading ([662e826](https://github.com/KraXen72/crankshaft/commit/662e826a3dd3c1abec2ee16d415faa3fc1b6de0c))
* specific hub links (profile, etc) no longer open main hub ([d1ac81d](https://github.com/KraXen72/crankshaft/commit/d1ac81dd692058d5dcec468b32b8e1fb76346ea3))
* splash screen no longer overlapping on 1 ui-scale ([800e35b](https://github.com/KraXen72/crankshaft/commit/800e35ba3b639dcd4aa0a8dc1583cafc35eb1e0c))
* toggling any setting would toggle fullscreen ([a032eda](https://github.com/KraXen72/crankshaft/commit/a032eda73db80cc9ac683638af3adcec140ac7a2))


### Performance Improvements

* only minify scripts if they are not in strict mode ([61676cb](https://github.com/KraXen72/crankshaft/commit/61676cbd86772301cb422ea35fea671629e5b3c0))
* resswapper now uses 'v8-compile-cache" ([8fafb66](https://github.com/KraXen72/crankshaft/commit/8fafb6636dcd7da6e598f3cee34f987f5b7076ab))
* rewote socialPreload in typescript, faster ([60ddd95](https://github.com/KraXen72/crankshaft/commit/60ddd95eb1187e66591e724b7220cf5a61f53ec4))
* show in console if script was strict or esbuilt ([414b566](https://github.com/KraXen72/crankshaft/commit/414b5661add6c9fc307779c18fd7fcd71730e0be))
* splash no longer uses any remote fonts ([503abbd](https://github.com/KraXen72/crankshaft/commit/503abbd29691d05fd6159483b3f434fd1e9f0e99))
* use strict in dev (esbuild) ([719e527](https://github.com/KraXen72/crankshaft/commit/719e527fdae28670ae827c417bfb6bcf73cf8547))

### [1.3.1](https://github.com/KraXen72/crankshaft/compare/1.3.0...1.3.1) (2022-04-21)


### Bug Fixes

* ranked smh ([aa6ad68](https://github.com/KraXen72/crankshaft/commit/aa6ad68977ee48a820c8d7d9e44528427ab1ded1))

## [1.3.0](https://github.com/KraXen72/crankshaft/compare/1.2.0...1.3.0) (2022-04-21)


### Features

* add F5 to realod the game ([1123fb3](https://github.com/KraXen72/crankshaft/commit/1123fb3f1bbdcd3c21de7b85fe1911062207f225))
* custom menu for generic windows, better window creating ([561a2d7](https://github.com/KraXen72/crankshaft/commit/561a2d7a6ece7333647b621826e256cf89ae911f))


### Bug Fixes

* (hopefully) open comp in main window ([28beb36](https://github.com/KraXen72/crankshaft/commit/28beb36fe38b233f130959bd4985f18eeed7c1c0))
* initial window is slightly bigger ([87a3a91](https://github.com/KraXen72/crankshaft/commit/87a3a91fc4fbee2802a3316e0b03b9bbfcf6fc40))


### Performance Improvements

* remove bannedCode checking ([e90db57](https://github.com/KraXen72/crankshaft/commit/e90db57ef4f90b267f6d17ea121b76759d7a4693)), closes [#3](https://github.com/KraXen72/crankshaft/issues/3)

## [1.2.0](https://github.com/KraXen72/crankshaft/compare/1.1.0...1.2.0) (2022-04-20)

## [1.1.0](https://github.com/KraXen72/crankshaft/compare/1.0.0...1.1.0) (2022-04-20)


### Features

* better setting ? and ! icons, with tooltips ([a9c36a3](https://github.com/KraXen72/crankshaft/commit/a9c36a3e148ead94f7ab2992c80d9c37ec4ca717))
* rewrite resswapper into typescript ([25d8459](https://github.com/KraXen72/crankshaft/commit/25d8459dd37a816374d0c344c27a8b084391bea9))
* settings description rewrite ([7525c1b](https://github.com/KraXen72/crankshaft/commit/7525c1ba52fc506d72be451dfc0885972ca22f25))


### Bug Fixes

* in process gpu now has a correct desc ([fcfbde8](https://github.com/KraXen72/crankshaft/commit/fcfbde8c5e38cd9b8c14e6ad121d62dada66e172))
* re-hook settings after switching to basic settings ([7e4499b](https://github.com/KraXen72/crankshaft/commit/7e4499b8073890445f2fbe5b6fb06427da830b38))

## 1.0.0 (2022-04-19)

