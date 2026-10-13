import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const injectChinese = require("../src/translation-loader/lib/injectJsToWebContents.js");

function createFrame() {
  return {
    calls: [],
    executeJavaScript(code) {
      this.calls.push(code);
      return Promise.resolve();
    },
    isDestroyed() {
      return false;
    },
  };
}

test("翻译脚本按导航精确注入主 frame 和目标子 frame", async () => {
  const listeners = new Map();
  const mainFrame = createFrame();
  const childFrame = createFrame();
  const webContents = {
    mainFrame,
    on(name, listener) {
      listeners.set(name, listener);
    },
  };
  const resolved = [];

  injectChinese(webContents, {
    resolveFrame(processId, routingId) {
      resolved.push([processId, routingId]);
      return childFrame;
    },
  });

  listeners.get("dom-ready")();
  listeners.get("did-frame-finish-load")({}, true, 10, 20);
  listeners.get("did-frame-finish-load")({}, false, 30, 40);
  await Promise.resolve();

  assert.equal(mainFrame.calls.length, 1, "主 frame 每次导航只注入一次");
  assert.equal(childFrame.calls.length, 1, "只注入触发加载事件的子 frame");
  assert.deepEqual(resolved, [[30, 40]], "主 frame 不重复走子 frame 解析路径");
  assert.equal(mainFrame.calls[0], injectChinese.injectedCode);
  assert.equal(childFrame.calls[0], injectChinese.injectedCode);
  assert.match(injectChinese.injectedCode, /if\(!window\.__FigmaZhCN\)/);
});

test("已销毁的 frame 不执行翻译脚本", () => {
  const listeners = new Map();
  const webContents = {
    mainFrame: { isDestroyed: () => true, executeJavaScript: () => assert.fail() },
    on(name, listener) {
      listeners.set(name, listener);
    },
  };

  injectChinese(webContents, { resolveFrame: () => null });
  listeners.get("dom-ready")();
  listeners.get("did-frame-finish-load")({}, false, 1, 2);
});

test("插件沙箱 frame 及其内部 iframe 不注入翻译脚本", async () => {
  const listeners = new Map();
  const mainFrame = Object.assign(createFrame(), { url: "https://www.figma.com/design/abc/File" });
  const sandbox = Object.assign(createFrame(), { url: "https://www.figma.com/plugin-sandbox", parent: mainFrame });
  const inner = Object.assign(createFrame(), { url: "about:blank", name: "Inner Plugin Iframe", parent: sandbox });
  const nestedInPlugin = Object.assign(createFrame(), { url: "https://plugin.example.com/ui", parent: inner });
  const figmaChild = Object.assign(createFrame(), { url: "https://www.figma.com/embed/xyz", parent: mainFrame });
  const frames = { 1: sandbox, 2: inner, 3: nestedInPlugin, 4: figmaChild };
  const webContents = { mainFrame, on(name, listener) { listeners.set(name, listener); } };
  injectChinese(webContents, { resolveFrame: (_processId, routingId) => frames[routingId] });

  for (const id of [1, 2, 3, 4]) listeners.get("did-frame-finish-load")({}, false, 9, id);
  await Promise.resolve();

  assert.equal(sandbox.calls.length, 0);
  assert.equal(inner.calls.length, 0);
  assert.equal(nestedInPlugin.calls.length, 0);
  assert.equal(figmaChild.calls.length, 1, "Figma 自身的子 frame 仍然注入");
  assert.equal(injectChinese.isPluginFrame(mainFrame), false);
  assert.match(injectChinese.injectedCode, /plugin-sandbox.*Inner Plugin Iframe/);
});
