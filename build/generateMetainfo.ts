import { promises as fs, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import xmlFormat from "xml-formatter";
import { join } from "node:path";
import { markdownToHtml} from "satteri";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom"

// if crankshaft ever gets more than 100 releases then this'll have to change
// as of writing, we're at 29
const releases = await fetch("https://api.github.com/repos/KraXen72/crankshaft/releases?per_page=100", {
    headers: {
        Accept: "application/vnd.github+json",
        "X-Github-Api-Version": "2022-11-28"
    }
// biome-ignore lint/suspicious/noExplicitAny: not including the full typing here
}).then(res => res.json()).then(releases => releases.filter((r: any) => r.prerelease === false));

const parser = new DOMParser().parseFromString(readFileSync(join(import.meta.dirname, "./baseMeta.xml"), "utf-8"), "text/xml");
const releaseList = parser.getElementsByTagName("releases")[0];

for (const releaseInfo of releases) {    
    const releaseElem = parser.createElement("release");
    releaseElem.setAttribute("version", releaseInfo.tag_name);
    releaseElem.setAttribute("date", releaseInfo.published_at.split("T")[0]);
    releaseElem.setAttribute("type", "stable");
    
    const releaseUrl = parser.createElement("url");
    releaseUrl.textContent = releaseInfo.html_url;
    
    releaseElem.appendChild(releaseUrl);
    
    const allowedTags = new Set([
        "p",
        "ul",
        "ol",
        "li",
        "em",
        "code",
    ]);
    
    const inlineTags = new Set([
        "a",
        "abbr",
        "cite",
        "del",
        "dfn",
        "i",
        "ins",
        "kbd",
        "mark",
        "q",
        "s",
        "samp",
        "small",
        "span",
        "strong",
        "sub",
        "sup",
        "time",
        "u",
        "var",
        "b",
    ]);

    let { html } = markdownToHtml(releaseInfo.body, {
        hastPlugins: [{
            name: "metainfo-description",
            element: {
                filter: [],
                visit(node, ctx) {
                    if (allowedTags.has(node.tagName)) return;
                    
                    if (inlineTags.has(node.tagName)) {
                        
                        ctx.replaceNode(node, {
                            type: "element",
                            tagName: "replaceme",
                            properties: {},
                            children: node.children
                        });
                        return;
                    }
                    
                    ctx.replaceNode(node, {
                        type: "element",
                        tagName: ctx.parent(node).children.length === 1 ? "replaceme" : "p",
                        properties: {},
                        children: node.children
                    });
                }
            },
        }]
    })
    // horror
    html = html.replaceAll("<replaceme>", "").replaceAll("</replaceme>", "").replaceAll("<p></p>", "").replaceAll("<p>\n<p>", "<p>").replaceAll("</p>\n</p>", "</p>");
    
    const descElem = parser.createElement("description")
    
    const newdoc = new DOMParser({}).parseFromString(`<root>${html}</root>`, "text/xml");
    for (const node of Array.from(newdoc.childNodes[0].childNodes)) {
        descElem.appendChild(node)
    }
    releaseElem.appendChild(descElem)
    releaseList.appendChild(releaseElem)
}


//@ts-ignore https://github.com/chrisbottin/xml-formatter/issues/68 ...?
const output = xmlFormat(new XMLSerializer().serializeToString(parser), {
    lineSeparator: "\n",
    collapseContent: true,
    indentation: "  "
});

await mkdir("./dist", { recursive: true });
await fs.writeFile("./dist/io.github.KraXen72.crankshaft.metainfo.xml", output, "utf-8");

console.log("Updated meta information written to ./dist/io.github.KraXen72.crankshaft.metainfo.xml");
