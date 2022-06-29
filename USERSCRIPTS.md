# Writing userscripts for crankshaft
Writing userscripts for crankshaft is easy. You don't need to follow any template. You do need to know javascript.  
There are a few example userscripts mentioned in the README you can go off of.  

- [Writing userscripts for crankshaft](#writing-userscripts-for-crankshaft)
  - [Utility functions](#utility-functions)
    - [Load function](#load-function)
    - [Unload function](#unload-function)
  - [Tips / Notes](#tips--notes)
  - [Metadata](#metadata)
    - [Example](#example)
    - [Template to copy](#template-to-copy)
  - [Enabling and testing your userscript](#enabling-and-testing-your-userscript)

## Utility functions
you can define some properties on the javascript `this` object for stuff like load function, unload function, etc.
> These function are not required, but highly recommended.
  
### Load function
if you want to inject elements into the site, define a `this.load` function. This will be ran after document is loaded.

### Unload function
if you want users to be able to turn on and off your userscript without reloading the page, define a `this.unload` function. 
This function should **delete all elements you create**, **remove all eventlisteners** and basically **undo the changes you made to the game**.  
  
```js
// example using both an unload and load function

function clickCb() {
    window.alert("Hello!")
}

this.load = () => {
    let myElem = document.createElement("div")
    myElem.id = "mediocre-element"
    myElem.style.color = "pink"
    myElem.style.background = "violet"
    myElem.textContent = "Hello world!"
    myElem.addEventListener("click", clickCb) // added some on click action

    document.body.appendChild(myElem) // added the element to body
}

this.unload = () => {
    let myElem = document.getElementById("mediocre-element") // get the element by id / queryselector
    myElem.removeEventListener("click", clickCb) // remove any eventlisteners you added to be safe
    myElem.remove() // remove the element
}

return this

``` 

## Tips / Notes
- if you want to easily remove an eventlistener, define it's callback function outside, like in the example (not using an arrow function)
- Instead of a DOMContentLoaded eventlistener, define a `this.load`. This will make it so it both runs when DOM is loaded, and also when a user turns on the userscript.
- You are encouraged to write your scripts in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) (start them with `"use strict"`), because it skips esbuild transforming your code.

## Metadata
Crankshaft recognizes standard userscript metadata comment, but only a set of keys. Copy this template to the top of your userscript for crankshaft to recognize it.  
You can define `@name`, `@author`, `@ersion`, `@desc` and `@src`. You don't have to define all of them.  
Defining metadata is optional. If no metadata is provided, only information displayed will be the filename.  
  
### Example
```js
// ==UserScript==
// @name My Awesome Userscript
// @author Unlucky1031
// @version 1.0
// @desc Adds a ton of awesomness to the game
// @src https://github.com/Unlucky1031/crankshaft-userscript
// ==/UserScript==

console.log("Everything is awesome! Everything is cool when you're part of a team!")
```
  
### Template to copy
```js
// ==UserScript==
// @name 
// @author 
// @version 
// @desc 
// @src 
// ==/UserScript==
```

## Enabling and testing your userscript

save your userscript to `Documents/Crankshaft/scripts/` as a file ending in `.js`
1. in crankshaft settings, enable the setting *Userscript support* and re-launch the client
2. in crankshaft settings > Userscripts, enable your userscript and refresh the page / F6 (find new game)
  
every time you make a change to your userscript, just refresh the page / F6 and you should see the changes.  