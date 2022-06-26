# Writing userscripts for crankshaft
Writing userscripts for crankshaft is easy. You don't need to follow any template. You do need to know javascript.

## Notes
- You are encouraged to write your scripts in strict mode (start them with `"use strict"`), because it skips esbuild transforming your code.
- userscripts are executed *as soon as possible*. If you want to add elements, add a `DOMContentLoaded` eventlistener

There are a few example userscripts mentioned in the README you can go off of.

## More functionality
you can add define `meta` and `unload` on the js *this* object for the userscript. Don't forget to return the *this* object at the end of the userscript.

### Metadata
your userscript can provide metadata that will be displayed in the settings. export them like this:
  
```js
// awesome-userscript.js

// your code

// all of these are optional.
// if you don't define metadata, filename will be used as the name field.
// any field with the value of false or not a string will not be displayed. 
// any extra field not here will not be displayed.
this.meta = { 
    name: "My awesome userscript",
	author: "Unlucky1031",
	version: "1.0", // you can write whatever here. you are encouraged to use semver. it has to be a string.
	desc: "Adds a ton of awesomness to the game",
	src: "https://github.com/Unlucky1031/crankshaft-userscript"
} 

return this

```

### Unload function
if you want users to be able to turn on and off your userscript without reloading the page, please define an unload function. 
This function should **delete all elements you create**, **remove all eventlisteners** and basically **undo the changes you made to the game**.
  
```js
// mediocre-userscript.js

function clickCb() {
    window.alert("Hello!")
}

document.addEventListener("DOMContentLoaded", () => {
    let myElem = document.createElement("div")
    myElem.id = "mediocre-element"
    myElem.style.color = "pink"
    myElem.style.background = "violet"
    myElem.textContent = "Hello world!"
    myElem.addEventListener("click", clickCb) // added some on click action

    document.body.appendChild(myElem) // added the element to body
})

this.unload = () => {
    let myElem = document.getElementById("mediocre-element") // get the element by id / queryselector
    myElem.removeEventListener("click", clickCb) // remove any eventlisteners you added to be safe
    myElem.remove() // remove the element
}

return this

``` 

## Enabling and testing your userscript

save your userscript to `Documents/Crankshaft/scripts/` as a file ending in `.js`
1. in crankshaft settings, enable the setting *Userscript support* and re-launch the client
2. in crankshaft settings > Userscripts, enable your userscript and refresh the page / F6 (find new game)
  
every time you make a change to your userscript, just refresh the page / F6 and you should see the changes.  