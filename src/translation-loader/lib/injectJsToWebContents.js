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
  `\ndelete window.__FigmaCNBaseMap;\n}`;

function defaultResolveFrame(webContents, processId, routingId) {
  try {
    const frame = require("electron").webFrameMain.fromId(processId, routingId);
    if (frame) return frame;
  } catch {}
  return (webContents.mainFrame?.frames || []).find(
    (frame) => frame.processId === processId && frame.routingId === routingId,
  ) || null;
}

module.exports = function injectChinese(
  webContents,
  { resolveFrame } = {},
) {
  function injectFrame(frame, label) {
    if (!frame || frame.isDestroyed?.()) return;
    Promise.resolve(frame.executeJavaScript(injectedCode)).catch((error) => {
      console.error(`[FigmaCN] Failed to inject ${label}`, error);
    });
  }

  // The main document is injected once for each navigation. Child-frame load
  // events are resolved to the exact frame that fired the event, so a newly
  // loaded iframe never causes every existing frame to parse the full payload.
  webContents.on("dom-ready", () => {
    injectFrame(webContents.mainFrame || webContents, "the main frame");
  });
  webContents.on(
    "did-frame-finish-load",
    (_event, isMainFrame, frameProcessId, frameRoutingId) => {
      if (isMainFrame) return;
      injectFrame(
        resolveFrame
          ? resolveFrame(frameProcessId, frameRoutingId)
          : defaultResolveFrame(webContents, frameProcessId, frameRoutingId),
        `frame ${frameProcessId}:${frameRoutingId}`,
      );
    },
  );
};

module.exports.injectedCode = injectedCode;
