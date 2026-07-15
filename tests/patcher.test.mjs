import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const patcher = fs.readFileSync(path.join(root, "scripts/figma-zh-cn.mjs"), "utf8");

test("补丁器具备备份、失败回滚与结构保护", () => {
  assert.match(patcher, /createBackup/);
  assert.match(patcher, /安装失败，已自动恢复原始 app\.asar/);
  assert.match(patcher, /主入口结构与已知版本不一致/);
  assert.match(patcher, /originalSha256/);
});

test("补丁器只注入独立中文模块", () => {
  assert.match(patcher, /require\(\\?"fg01\\?"\);/);
  assert.doesNotMatch(patcher, /Figma\+EX|广告|置顶/);
});
