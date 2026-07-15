"use strict";

const fs = require("fs");
const path = require("path");

const mainDictionary = require("../js/lang.cn.json");
const menuDictionary = require("../js/lang.cn.menu.json");

const baseDictionary = Object.assign({}, mainDictionary, menuDictionary);
const overlayPath = path.join(__dirname, "../js/figmaCN.js");
let overlayCode = fs.readFileSync(overlayPath, "utf8");

// Merge the maintained dictionaries into the overlay's exact and dynamic
// translation rules without loading any former EX enhancement bundle.
overlayCode = overlayCode
  .replace(
    "const map={",
    "const map=Object.assign({},window.__FigmaCNBaseMap||{},{",
  )
  .replace("};\nObject.assign(map,{", "});\nObject.assign(map,{");

if (!overlayCode.includes("window.__FigmaZhCN")) {
  throw new Error("Figma Chinese overlay is incomplete");
}

const injectedCode =
  `if(!window.__FigmaZhCN){window.__FigmaCNBaseMap=${JSON.stringify(baseDictionary)};\n` +
  overlayCode +
  `\n}`;

module.exports = function injectChinese(webContents) {
  function injectAllFrames() {
    const frames = webContents.mainFrame?.frames || [];
    if (!frames.length) {
      Promise.resolve(webContents.executeJavaScript(injectedCode)).catch((error) => {
        console.error("[FigmaCN] Failed to inject Chinese translations", error);
      });
      return;
    }
    for (const frame of frames) {
      Promise.resolve(frame.executeJavaScript(injectedCode)).catch((error) => {
        console.error("[FigmaCN] Failed to inject a frame", error);
      });
    }
  }
  webContents.on("dom-ready", injectAllFrames);
  webContents.on("did-frame-finish-load", injectAllFrames);
};
