# Writing userscripts for crankshaft

Writing userscripts for crankshaft is easy. You don't need to follow any template, but it is recommended you make use of stuff below.  
There are a few example userscripts mentioned in the README you can go off of.  

- [Writing userscripts for crankshaft](#writing-userscripts-for-crankshaft)
  - [Metadata](#metadata)
    - [Example](#example)
    - [Template to copy](#template-to-copy)
    - [optional @run-at rule](#optional-run-at-rule)
  - [Utility functions](#utility-functions)
    - [Unload function (version 1.6.0+)](#unload-function-version-160)
    - [Console access (version 1.6.0+)](#console-access-version-160)
    - [Insert CSS (version 1.6.1+)](#insert-css-version-161)
  - [Tips / Notes](#tips--notes)
  - [Enabling and testing your userscript](#enabling-and-testing-your-userscript)

## Metadata

Crankshaft recognizes standard userscript metadata comment, but only a subset of keys.  
You can define `@name`, `@author`, `@ersion`, `@desc`, `@src`, `@license` as strings.  
There is also an optional `@run-at` rule, more about that [here](#optional-run-at-rule)  
Defining metadata is optional. If no metadata is provided, only information displayed will be the filename.

You can define only some of them if you want, for example `@name` and `@desc`  
  
### Example

```js
// ==UserScript==
// @name My Awesome Userscript
// @author Unlucky1031
// @version 1.0
// @desc Adds a ton of awesomness to the game
// @license MIT; https://mit-license.org
// @src https://github.com/Unlucky1031/crankshaft-userscript
// @run-at document-end
// ==/UserScript==

this._console.log("Everything is awesome! Everything is cool when you're part of a team!")
```
  
### Template to copy

Copy this template to the top of your userscript for crankshaft to recognize it.  

```js
// ==UserScript==
// @name 
// @author 
// @version 
// @desc 
// @src
// @run-at document-end 
// ==/UserScript==
```

### optional @run-at rule

You can define an optional `@run-at` rule.

- `document-end` **(default)**  
  The script executes when DOMContentLoaded is fired. At this time, the basic HTML of the page is ready and other resources like images might still be on the way. This will be picked if no `@run-at` rule is defined.
- `document-start`
  The script executes as soon as possible. `body` most likely won't have any content in it yet.

## Utility functions

Userscripts are executed with a custom javascript `this` object. It exposes some utilities and you can define some lifecycle functions.
  
### Unload function (version 1.6.0+)

if you want users to be able to turn on and off your userscript without reloading the page, define a `this.unload` function.
The `this.unload` function is not required, but highly recommended, because users can freely toggle your userscript on and off without reloading the page.  
That's why it's also important you try to undo all the stuff you do in the userscript.  
This function should **delete all elements you create**, **remove all eventlisteners** and basically **undo the changes you made to the game**.  
  
```js
// example which exports an unload function

function clickCb() {
  window.alert("Hello!")
}

let myElem = document.createElement("div")
myElem.id = "mediocre-element"
myElem.style.color = "pink"
myElem.style.background = "violet"
myElem.textContent = "Hello world!"
myElem.addEventListener("click", clickCb) // added some on click action

document.body.appendChild(myElem) // added the element to body

this.unload = () => {
  let toRemoveElem = document.getElementById("mediocre-element") // get the element by id / queryselector rather than use the myElem reference
  toRemoveElem.removeEventListener("click", clickCb) // remove any eventlisteners you added to be safe
  toRemoveElem.remove() // remove the element
}

return this

```

### Console access (version 1.6.0+)

Krunker disables console methods like `log`, `warn`, `error` and others. If you want to use console, you can access it with `this._console`. It only provides the three basic methods mentioned above: `log`, `warn` and `error`.  
You do not need to return `this._console`, it will have no effect.
  
```js
this._console.log("everything is awesome!")
```

### Insert CSS (version 1.6.1+)

Electron offers a function to inject (and uninject) css into a page.  
It has multiple advantages: the page **can't remove the css** and **has no idea who or how it is inserted**. You can utilise this in your userscripts with the `this._css` function. It takes 3 arguments:

- **css (string)**: the css you want to inject
- **identifier (string)**: the identifier for this css block, so you can later remove it in the `this.unload` function
- **value ('toggle' or boolean, optional)**: `true` to inject, `false` to uninject, `toggle` or nothing to toggle
  
```js
// ==UserScript==
// @name Remove reCaptcha bar on linux
// @author Commander (modified by KraXen for this example)
// @run-at document-start
// ==/UserScript==

// add some css to hide the recaptcha bar on linux
const cssBody = `body > div:not([class]):not([id]) > div:not(:empty):not([class]):not([id]) { display: none; }`
this._css(cssBody, 'recaptcha', true)

// remove the css when userscript is unloaded
this.unload = () => {
  this._css(cssBody, 'recaptcha', false)
  // you could even use this._css('', 'recaptcha', false)
  // as long as you use the correct identifier, the css doesen't matter for removing
}

// we have to return this since we define an unload function
return this
```

## Tips / Notes

- if you want to easily remove an eventlistener, define it's callback function outside, like in the example (not using an arrow function)
- You are encouraged to write your scripts in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) (start them with `"use strict"`), because it skips esbuild transforming your code.
- If your script would rely on `@run-at document-idle`, just wrap it in a `setTimeout` for a few seconds.
- As a user, if you want to 100% unload a userscript, it is better to refresh the page/F6, otherwise you just have to rely on the provided `unload` function by the userscript author.
- It is highly recommended to always define an `unload` function if all your script does is add some css. It's really easy to do.

## Enabling and testing your userscript

save your userscript to `Documents/Crankshaft/scripts/` as a file ending in `.js`

1. in crankshaft settings, enable the setting *Userscript support* and re-launch the client
2. in crankshaft settings > Userscripts, enable your userscript and refresh the page / F6 (find new game)
  
every time you make a change to your userscript, just refresh the page / F6 and you should see the changes.
