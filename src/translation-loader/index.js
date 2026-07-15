"use strict";

const electron = require("electron");
const injectChinese = require("./lib/injectJsToWebContents.js");
const {
  injectMenu,
  injectMenuLangObject,
} = require("./lib/injectMenuCN.js");

console.log("[FigmaCN] Chinese translation loader started");

electron.app.addListener("web-contents-created", (_event, webContents) => {
  injectChinese(webContents);
});

// The patched Figma desktop bootstrap calls these two hooks while constructing
// the native application menu and its localized string table.
global.fgmm = injectMenu;
global.fgml = injectMenuLangObject;
