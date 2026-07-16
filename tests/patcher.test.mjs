import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import * as asar from "@electron/asar";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const patcher = fs.readFileSync(path.join(root, "scripts/figma-zh-cn.mjs"), "utf8");

test("补丁器具备备份、失败回滚与结构保护", () => {
  assert.match(patcher, /createBackup/);
  assert.match(patcher, /安装失败，已自动恢复原始文件/);
  assert.match(patcher, /主入口结构与已知版本不一致/);
  assert.match(patcher, /originalSha256/);
  assert.match(patcher, /assertResourcesWritable/);
  assert.match(patcher, /restoreLoader/);
});

test("补丁器只注入独立中文模块", () => {
  assert.match(patcher, /require\(\\?"fg01\\?"\);/);
  assert.doesNotMatch(patcher, /Figma\+EX|广告|置顶/);
});

test("补丁器原位更新主入口并保留官方 ASAR 布局", () => {
  assert.match(patcher, /asar\.getRawHeader\(original\)/);
  assert.match(patcher, /assertSizeTrailer\(archive\)/);
  assert.match(patcher, /updateIntegrity\(mainEntry, patched\)/);
  assert.match(patcher, /shiftOffsets\(raw\.header, mainOffset, delta\)/);
  assert.match(patcher, /const rebuiltPayload = Buffer\.concat/);
  assert.match(patcher, /updateSizeTrailer\(rebuiltArchive\)/);
  assert.match(patcher, /process\.platform === "win32"/);
  assert.match(patcher, /fs\.rmSync\(appAsar, \{ force: true \}\)/);
  assert.match(patcher, /asar\.uncache\(appAsar\)/);
  assert.doesNotMatch(patcher, /asar\.extractAll\(/);
  assert.doesNotMatch(patcher, /asar\.createPackageWithOptions\(/);
});

test("补丁后 ASAR 尾部大小标记与实际文件长度一致", async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "figma-zh-cn-test-"));
  const source = path.join(temp, "source");
  const resources = path.join(temp, "Resources");
  const appAsar = path.join(resources, "app.asar");
  try {
    fs.mkdirSync(source, { recursive: true });
    fs.mkdirSync(resources, { recursive: true });
    fs.writeFileSync(path.join(source, "package.json"), JSON.stringify({ version: "test", main: "main.js" }));
    fs.writeFileSync(path.join(source, "main.js"), '"use strict";console.log("test");');
    await asar.createPackage(source, appAsar);

    const original = fs.readFileSync(appAsar);
    const withTrailer = Buffer.concat([original, Buffer.alloc(8)]);
    withTrailer.write((withTrailer.length - 8).toString(36).padStart(8, "0"), withTrailer.length - 8, 8, "ascii");
    fs.writeFileSync(appAsar, withTrailer);

    const result = spawnSync(process.execPath, [path.join(root, "scripts/figma-zh-cn.mjs"), "install", "--resources", resources], {
      encoding: "utf8",
      env: { ...process.env, HOME: path.join(temp, "home") }
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const patched = fs.readFileSync(appAsar);
    const trailer = patched.subarray(-8).toString("ascii");
    assert.equal(parseInt(trailer, 36), patched.length - 8);
    assert.match(asar.extractFile(appAsar, "main.js").toString("utf8"), /require\("fg01"\);/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
