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
