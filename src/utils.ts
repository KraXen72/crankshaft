///<reference path="global.d.ts" />

/**
 * inject css as a style tag
 */
export const injectSettingsCss = (css: string, classId = "Crankshaft-settings-css") => {
    let s = document.createElement("style");
    //s.setAttribute("class", classId);
    s.setAttribute("id", classId);
    s.innerHTML = css;
    document.head.appendChild(s);
}

//create element util function. source is my utils lib: https://github.com/KraXen72/roseboxlib/blob/master/esm/lib.js
/**
 * create a dom element given an object of properties
 * @param type element type, e.g. "div"
 * @param options options for the element. like class, id, etc
 * @returns element
 */
export function createElement(type: string, options: Object = {}) {
    const element = document.createElement(type)
    
    Object.entries(options).forEach(([key, value]) => {
        if (key === "class") {
            if (Array.isArray(value)) {
                value.forEach((c: string) => {element.classList.add(c)})
            } else { element.classList.add(value) }
            return
        }

        if (key === "dataset") {
            Object.entries(value).forEach((entry) => {
                const dataKey = entry[0]
                const dataValue: any = entry[1]
                element.dataset[dataKey] = dataValue
            })
            return
        }

        if (key === "text") {
            element.textContent = value
            return
        }
        if (key === "innerHTML") {
            element.innerHTML = value
            return
        }
        element.setAttribute(key, value)
    })
    return element
}

/**
 * inject or uninject css to hide ads
 * @param value 'toggle'|Boolean
 */
export function toggleSettingCSS(css: string, styleTagId: string = "teeny-tiny-css-snippet",value: ('toggle' | Boolean) = 'toggle') {
    let styleTag = document.getElementById(`crankshaft-setting-${styleTagId}`)

    function create() {
        styleTag = createElement("style", {id: `crankshaft-setting-${styleTagId}`, innerHTML: css})
        document.head.appendChild(styleTag)
    }

    if (value === 'toggle') {
        //normal toggle
        if (styleTag == null) {
            create()
        } else {
            styleTag.remove()
        }
    } else {
        if (styleTag == null && value === true) {
            create()
        } else if (styleTag !== null && value === false) {
            try { styleTag.remove() } catch (e) {  }
        }
    }
}