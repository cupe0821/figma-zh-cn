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
const macInstaller = fs.readFileSync(path.join(root, "scripts/install-macos.command"), "utf8");

function representativeFigmaMain({ loader = false } = {}) {
  return [
    '"use strict";',
    loader ? 'require("fg01");' : "",
    'var RN=xe.create("i18n"),Wir={...EO,...CO,...FO,...UO,...OO},jir=["desktop.shell_app.","desktop.shell.app."],AN={};',
    'class MenuManager{rebuildMenus(){switch(this.template.type){case"default":{let t=x_(kje());en.Menu.setApplicationMenu(en.Menu.buildFromTemplate(t)),this.rebuildWindowsAppMenu([]),this.actionToMenuItem={};break}case"fullscreen":{Cw=[];let t=x_(kir(this.template)),r=en.Menu.buildFromTemplate(t);en.Menu.setApplicationMenu(r),this.rebuildWindowsAppMenu(this.template.pluginMenuData),this.actionToMenuItem=Dir(r),this.updateActionState();break}}}rebuildWindowsAppMenu(t,r){process.platform==="win32"&&(this.windowsAppMenu=en.Menu.buildFromTemplate(Sir({pluginMenuData:t,editorType:gje(this.template)?this.template.editorType:null,isMakeLocal:r})))}updateActionState(){}}',
  ].join("");
}

function pickleUInt32(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32LE(4, 0);
  buffer.writeUInt32LE(value, 4);
  return buffer;
}

function pickleString(value) {
  const data = Buffer.from(value, "utf8");
  const alignedLength = (data.length + 3) & ~3;
  const buffer = Buffer.alloc(8 + alignedLength);
  buffer.writeUInt32LE(4 + alignedLength, 0);
  buffer.writeUInt32LE(data.length, 4);
  data.copy(buffer, 8);
  return buffer;
}

function createTestArchive(main) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "figma-zh-cn-test-"));
  const resources = path.join(temp, "Resources");
  const appAsar = path.join(resources, "app.asar");
  fs.mkdirSync(resources, { recursive: true });

  // Build the tiny fixture directly in the same ASAR layout used by Figma.
  // @electron/asar.createPackage followed by appending Figma's custom 8-byte
  // size trailer can produce stale header offsets on Windows CI.
  const packageData = Buffer.from(JSON.stringify({ version: "test", main: "main.js" }), "utf8");
  const mainData = Buffer.from(main, "utf8");
  const header = {
    files: {
      "package.json": { size: packageData.length, offset: "0" },
      "main.js": { size: mainData.length, offset: String(packageData.length) }
    }
  };
  const headerBuffer = pickleString(JSON.stringify(header));
  const sizeBuffer = pickleUInt32(headerBuffer.length);
  const archive = Buffer.concat([sizeBuffer, headerBuffer, packageData, mainData, Buffer.alloc(8)]);
  archive.write((archive.length - 8).toString(36).padStart(8, "0"), archive.length - 8, 8, "ascii");
  fs.writeFileSync(appAsar, archive);

  assert.deepEqual(JSON.parse(asar.extractFile(appAsar, "package.json").toString("utf8")), {
    version: "test",
    main: "main.js"
  });
  asar.uncache(appAsar);
  return { temp, resources, appAsar };
}

function installFixture(temp, resources) {
  return spawnSync(process.execPath, [path.join(root, "scripts/figma-zh-cn.mjs"), "install", "--resources", resources], {
    encoding: "utf8",
    env: { ...process.env, HOME: path.join(temp, "home") }
  });
}

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
  assert.match(patcher, /global\.fgmm/);
  assert.match(patcher, /global\.fgml/);
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

test("macOS 安装器使用稳定的本地指定要求", () => {
  assert.match(macInstaller, /designated => identifier \"com\.figma\.Desktop\"/);
  assert.match(macInstaller, /codesign --force --deep --sign -/);
  assert.match(macInstaller, /codesign --force --sign - -r=/);
  assert.match(macInstaller, /首次从官方签名或旧中文包迁移/);
});

test("补丁后 ASAR 尾部大小标记与实际文件长度一致", async () => {
  const { temp, resources, appAsar } = await createTestArchive(representativeFigmaMain());
  try {
    const result = installFixture(temp, resources);
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const patched = fs.readFileSync(appAsar);
    const trailer = patched.subarray(-8).toString("ascii");
    assert.equal(parseInt(trailer, 36), patched.length - 8);
    const main = asar.extractFile(appAsar, "main.js").toString("utf8");
    assert.match(main, /require\("fg01"\);/);
    assert.equal((main.match(/global\.fgmm\(/g) || []).length, 3);
    assert.equal((main.match(/global\.fgml\(/g) || []).length, 1);

    const second = installFixture(temp, resources);
    assert.equal(second.status, 0, second.stderr || second.stdout);
    const reinstalled = asar.extractFile(appAsar, "main.js").toString("utf8");
    assert.equal((reinstalled.match(/global\.fgmm\(/g) || []).length, 3);
    assert.equal((reinstalled.match(/global\.fgml\(/g) || []).length, 1);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("已安装 cn.4 启动标记但缺少菜单钩子时可补齐", async () => {
  const { temp, resources, appAsar } = await createTestArchive(representativeFigmaMain({ loader: true }));
  try {
    const result = installFixture(temp, resources);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const main = asar.extractFile(appAsar, "main.js").toString("utf8");
    assert.equal((main.match(/require\("fg01"\);/g) || []).length, 1);
    assert.equal((main.match(/global\.fgmm\(/g) || []).length, 3);
    assert.equal((main.match(/global\.fgml\(/g) || []).length, 1);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
