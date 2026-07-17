#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import * as asar from "@electron/asar";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const loaderSource = path.join(projectRoot, "src", "translation-loader");
const marker = 'require("fg01");';
const nativeMenuHook = "global.fgmm";
const nativeStringsHook = "global.fgml";
const stateRoot = path.join(os.homedir(), ".figma-zh-cn");
const backupRoot = path.join(stateRoot, "backups");

function fail(message) {
  console.error(`错误：${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function parseArgs(argv) {
  const [command = "status", ...rest] = argv;
  const result = { command, resources: null, yes: false };
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === "--resources") result.resources = rest[++i];
    else if (rest[i] === "--yes") result.yes = true;
    else fail(`未知参数：${rest[i]}`);
  }
  return result;
}

function findWindowsResources() {
  const base = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Figma");
  if (!base || !fs.existsSync(base)) return null;
  const candidates = fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("app-"))
    .map((entry) => path.join(base, entry.name, "resources"))
    .filter((dir) => fs.existsSync(path.join(dir, "app.asar")))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0] || null;
}

function locateResources(explicit) {
  const candidates = explicit
    ? [path.resolve(explicit)]
    : process.platform === "darwin"
      ? ["/Applications/Figma.app/Contents/Resources", path.join(os.homedir(), "Applications/Figma.app/Contents/Resources")]
      : process.platform === "win32"
        ? [findWindowsResources()].filter(Boolean)
        : [];
  const found = candidates.find((candidate) => fs.existsSync(path.join(candidate, "app.asar")));
  if (!found) fail("未找到 Figma resources 目录。可使用 --resources 指定路径。");
  return found;
}

function readAppInfo(appAsar) {
  // @electron/asar caches archive headers by path. Installation replaces the
  // archive at the same path, so invalidate the cache before every validation.
  asar.uncache(appAsar);
  const raw = asar.extractFile(appAsar, "package.json").toString("utf8");
  const pkg = JSON.parse(raw);
  const mainPath = pkg.main || "main.js";
  const main = asar.extractFile(appAsar, mainPath).toString("utf8");
  return { version: pkg.version || "unknown", mainPath, main };
}

function hasLoaderMarker(source) {
  return source.includes(marker) || source.includes("require('fg01');");
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function replaceExactlyOnce(source, pattern, replacement, description) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matches = source.match(new RegExp(pattern.source, flags)) || [];
  if (matches.length !== 1) {
    fail(`Figma 主入口结构与已知版本不一致：${description}应匹配 1 处，实际 ${matches.length} 处。已停止，未写入任何文件。`);
  }
  return source.replace(pattern, replacement);
}

function assertTranslationHooks(source) {
  const menuCalls = countMatches(source, /(?:global\.)?fgmm\(/g);
  const stringCalls = countMatches(source, /(?:global\.)?fgml\(/g);
  if (menuCalls !== 3 || stringCalls !== 1) {
    fail(`原生翻译调用校验失败：菜单应为 3 处、桌面字符串应为 1 处，实际为 ${menuCalls} 处和 ${stringCalls} 处。`);
  }
}

function patchMain(source) {
  let patched = source;
  if (!hasLoaderMarker(patched)) {
    const strict = /^(?:\uFEFF)?(["']use strict["'];?)/;
    if (!strict.test(patched)) fail("Figma 主入口结构与已知版本不一致，已停止，未写入任何文件。");
    patched = patched.replace(strict, `$1${marker}`);
  }

  const existingMenuCalls = countMatches(patched, /(?:global\.)?fgmm\(/g);
  if (existingMenuCalls === 0) {
    patched = replaceExactlyOnce(
      patched,
      /(rebuildMenus\(\)\{switch\(this\.template\.type\)\{case"default":\{[\s\S]{0,300}?\.Menu\.buildFromTemplate\()([\w$]+)(\)\),this\.rebuildWindowsAppMenu\(\[\]\))/,
      `$1${nativeMenuHook}($2)$3`,
      "默认菜单翻译调用",
    );
    patched = replaceExactlyOnce(
      patched,
      /(case"fullscreen":\{[\s\S]{0,300}?\.Menu\.buildFromTemplate\()([\w$]+)(\);[\w$]+\.Menu\.setApplicationMenu\()/,
      `$1${nativeMenuHook}($2)$3`,
      "全屏菜单翻译调用",
    );
    patched = replaceExactlyOnce(
      patched,
      /(rebuildWindowsAppMenu\([^)]*\)\{process\.platform==="win32"&&\(this\.windowsAppMenu=[\w$]+\.Menu\.buildFromTemplate\()([\s\S]{1,500}?)(\)\)\}updateActionState\()/,
      `$1${nativeMenuHook}($2)$3`,
      "Windows 菜单翻译调用",
    );
  } else if (existingMenuCalls !== 3) {
    fail(`Figma 主入口含有不完整的菜单翻译调用：应为 3 处，实际 ${existingMenuCalls} 处。已停止，未写入任何文件。`);
  }

  const existingStringCalls = countMatches(patched, /(?:global\.)?fgml\(/g);
  if (existingStringCalls === 0) {
    patched = replaceExactlyOnce(
      patched,
      /(var [\w$]+=[\w$]+\.create\("i18n"\),[\w$]+=)(\{\.\.\.[\w$]+(?:,\.\.\.[\w$]+){4}\})(,[\w$]+=\["desktop\.shell_app\.","desktop\.shell\.app\."\])/,
      `$1${nativeStringsHook}($2)$3`,
      "桌面字符串翻译调用",
    );
  } else if (existingStringCalls !== 1) {
    fail(`Figma 主入口含有不完整的桌面字符串翻译调用：应为 1 处，实际 ${existingStringCalls} 处。已停止，未写入任何文件。`);
  }

  assertTranslationHooks(patched);
  return { source: patched, changed: patched !== source };
}

function alignPicklePayload(size) {
  return size + ((4 - (size % 4)) % 4);
}

function pickleString(value) {
  const data = Buffer.from(value, "utf8");
  const payloadSize = 4 + alignPicklePayload(data.length);
  const buffer = Buffer.alloc(4 + payloadSize);
  buffer.writeUInt32LE(payloadSize, 0);
  buffer.writeUInt32LE(data.length, 4);
  data.copy(buffer, 8);
  return buffer;
}

function pickleUInt32(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32LE(4, 0);
  buffer.writeUInt32LE(value, 4);
  return buffer;
}

function expectedSizeTrailer(size) {
  const encoded = (size - 8).toString(36);
  if (size < 8 || encoded.length > 8) fail(`ASAR 文件大小无法编码：${size}`);
  return encoded.padStart(8, "0");
}

function assertSizeTrailer(archive) {
  const actual = archive.subarray(-8).toString("ascii");
  const expected = expectedSizeTrailer(archive.length);
  if (actual !== expected) fail(`ASAR 尾部大小标记无效：应为 ${expected}，实际为 ${actual}`);
}

function updateSizeTrailer(archive) {
  archive.write(expectedSizeTrailer(archive.length), archive.length - 8, 8, "ascii");
}

function headerEntry(header, filename) {
  let entry = header;
  for (const part of filename.split(/[\\/]/).filter(Boolean)) {
    entry = entry.files?.[part];
    if (!entry) fail(`ASAR 头中找不到入口：${filename}`);
  }
  return entry;
}

function updateIntegrity(entry, content) {
  const blockSize = entry.integrity?.blockSize || 4 * 1024 * 1024;
  const hash = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
  const blocks = [];
  for (let offset = 0; offset < content.length; offset += blockSize) {
    blocks.push(hash(content.subarray(offset, Math.min(offset + blockSize, content.length))));
  }
  entry.integrity = { algorithm: "SHA256", hash: hash(content), blockSize, blocks };
}

function shiftOffsets(entry, after, delta) {
  if (entry.files) {
    for (const child of Object.values(entry.files)) shiftOffsets(child, after, delta);
  } else if (typeof entry.offset === "string" && BigInt(entry.offset) > after) {
    entry.offset = (BigInt(entry.offset) + BigInt(delta)).toString();
  }
}

function rebuildAsar(original, mainPath, patchedMain) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "figma-zh-cn-"));
  const output = path.join(tempRoot, "app.asar");
  try {
    const raw = asar.getRawHeader(original);
    const mainEntry = headerEntry(raw.header, mainPath);
    if (typeof mainEntry.offset !== "string" || mainEntry.size < 0 || mainEntry.unpacked) {
      fail(`Figma 主入口不是可原位更新的打包文件：${mainPath}`);
    }

    const patched = Buffer.from(patchedMain, "utf8");
    const oldSize = mainEntry.size;
    const delta = patched.length - oldSize;
    const mainOffset = BigInt(mainEntry.offset);
    mainEntry.size = patched.length;
    updateIntegrity(mainEntry, patched);
    if (delta !== 0) shiftOffsets(raw.header, mainOffset, delta);

    const archive = fs.readFileSync(original);
    assertSizeTrailer(archive);
    const payload = archive.subarray(8 + raw.headerSize);
    const start = Number(mainOffset);
    if (!Number.isSafeInteger(start) || start + oldSize > payload.length) {
      fail(`Figma 主入口偏移无效：${mainPath}`);
    }
    const rebuiltPayload = Buffer.concat([
      payload.subarray(0, start),
      patched,
      payload.subarray(start + oldSize)
    ]);
    const headerBuffer = pickleString(JSON.stringify(raw.header));
    const sizeBuffer = pickleUInt32(headerBuffer.length);
    const rebuiltArchive = Buffer.concat([sizeBuffer, headerBuffer, rebuiltPayload]);
    updateSizeTrailer(rebuiltArchive);
    fs.writeFileSync(output, rebuiltArchive);
    asar.uncache(output);

    const verified = readAppInfo(output);
    if (verified.main !== patchedMain) fail("重建后主入口内容校验失败。");
    return { tempRoot, output };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function listBackups(root = backupRoot) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, "manifest.json"))
    .filter(fs.existsSync)
    .flatMap((file) => {
      try {
        return [{ file, data: JSON.parse(fs.readFileSync(file, "utf8")) }];
      } catch {
        return [];
      }
    })
    .sort((a, b) => (b.data.createdAt || "").localeCompare(a.data.createdAt || ""));
}

function isVerifiedOriginalBackup(item, resources, figmaVersion) {
  if (!item?.data?.backupAsar || !fs.existsSync(item.data.backupAsar)) return false;
  if (path.resolve(item.data.resources || "") !== path.resolve(resources)) return false;
  if (figmaVersion && item.data.figmaVersion !== figmaVersion) return false;
  try {
    if (item.data.originalSha256 && sha256(item.data.backupAsar) !== item.data.originalSha256) return false;
    return !hasLoaderMarker(readAppInfo(item.data.backupAsar).main);
  } catch {
    return false;
  }
}

function findOriginalBackup(resources, figmaVersion, root = backupRoot) {
  return listBackups(root).find((item) => isVerifiedOriginalBackup(item, resources, figmaVersion));
}

function createOriginalBackup(resources, appAsar, appInfo, root = backupRoot) {
  if (hasLoaderMarker(appInfo.main)) {
    throw new Error("当前 app.asar 已包含中文加载器，不能将它保存为原始备份。");
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(root, `${appInfo.version}-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  const backupAsar = path.join(dir, "app.asar");
  fs.copyFileSync(appAsar, backupAsar);
  const manifest = {
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    figmaVersion: appInfo.version,
    resources,
    originalSha256: sha256(appAsar),
    originalUnpatched: true,
    backupAsar
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function ensureOriginalBackup(resources, appAsar, appInfo, root = backupRoot) {
  if (hasLoaderMarker(appInfo.main)) {
    throw new Error("当前 app.asar 已被注入，无法从中创建原始备份。");
  }
  const currentSha256 = sha256(appAsar);
  const existing = listBackups(root).find(
    (item) => item.data.originalSha256 === currentSha256
      && isVerifiedOriginalBackup(item, resources, appInfo.version),
  );
  return existing?.data || createOriginalBackup(resources, appAsar, appInfo, root);
}

function assertResourcesWritable(resources) {
  const probe = path.join(resources, `.figma-zh-cn-write-test-${process.pid}`);
  try {
    fs.writeFileSync(probe, "");
    fs.rmSync(probe, { force: true });
  } catch (error) {
    try {
      fs.rmSync(probe, { force: true });
    } catch {}
    const hint = process.platform === "darwin"
      ? "请在“系统设置 → 隐私与安全性 → App 管理”中允许当前终端修改应用，然后重试。"
      : "请确认当前用户可以修改 Figma 安装目录后重试。";
    throw new Error(`无法写入 Figma Resources（${error.code || error.message}）。${hint}`);
  }
}

function restoreLoader(resources, savedLoader) {
  const target = path.join(resources, "node_modules", "fg01");
  fs.rmSync(target, { recursive: true, force: true });
  if (savedLoader && fs.existsSync(savedLoader)) fs.cpSync(savedLoader, target, { recursive: true });
}

function copyLoader(resources) {
  const target = path.join(resources, "node_modules", "fg01");
  const suffix = `${process.pid}-${Date.now()}`;
  const staged = `${target}.figma-zh-cn-new-${suffix}`;
  const previous = `${target}.figma-zh-cn-old-${suffix}`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.rmSync(staged, { recursive: true, force: true });
  fs.rmSync(previous, { recursive: true, force: true });
  fs.cpSync(loaderSource, staged, { recursive: true });
  try {
    if (fs.existsSync(target)) fs.renameSync(target, previous);
    fs.renameSync(staged, target);
    fs.rmSync(previous, { recursive: true, force: true });
    return target;
  } catch (error) {
    fs.rmSync(target, { recursive: true, force: true });
    if (fs.existsSync(previous)) fs.renameSync(previous, target);
    throw error;
  } finally {
    fs.rmSync(staged, { recursive: true, force: true });
  }
}

async function install(resources, { backups = backupRoot } = {}) {
  const appAsar = path.join(resources, "app.asar");
  let backup;
  let tempRoot;
  let rollbackRoot;
  let rollbackAsar;
  let savedLoader;
  let appAsarReplaced = false;
  let loaderTouched = false;
  try {
    assertResourcesWritable(resources);
    const before = readAppInfo(appAsar);
    const patch = patchMain(before.main);
    backup = hasLoaderMarker(before.main)
      ? findOriginalBackup(resources, before.version, backups)?.data
      : ensureOriginalBackup(resources, appAsar, before, backups);

    rollbackRoot = fs.mkdtempSync(path.join(os.tmpdir(), "figma-zh-cn-rollback-"));
    if (patch.changed) {
      rollbackAsar = path.join(rollbackRoot, "app.asar");
      fs.copyFileSync(appAsar, rollbackAsar);
    }
    const currentLoader = path.join(resources, "node_modules", "fg01");
    if (fs.existsSync(currentLoader)) {
      savedLoader = path.join(rollbackRoot, "fg01");
      fs.cpSync(currentLoader, savedLoader, { recursive: true });
    }

    if (patch.changed) {
      const rebuilt = await rebuildAsar(appAsar, before.mainPath, patch.source);
      tempRoot = rebuilt.tempRoot;
      const staged = `${appAsar}.figma-zh-cn-new`;
      fs.copyFileSync(rebuilt.output, staged);
      if (process.platform === "win32") {
        fs.rmSync(appAsar, { force: true });
        appAsarReplaced = true;
      }
      fs.renameSync(staged, appAsar);
      appAsarReplaced = true;
      asar.uncache(appAsar);
    }
    const loader = copyLoader(resources);
    loaderTouched = true;
    const after = readAppInfo(appAsar);
    if (!hasLoaderMarker(after.main)) fail("安装后自检失败：启动标记不存在。");
    assertTranslationHooks(after.main);
    console.log(`已安装：Figma ${after.version}`);
    console.log(`中文加载器：${loader}`);
    console.log(backup
      ? `原始备份：${backup.backupAsar}`
      : "原始备份：未找到；本次只更新已安装的中文加载器，未覆盖现有 app.asar。");
    console.log(`当前 app.asar SHA-256：${sha256(appAsar)}`);
  } catch (error) {
    let rollbackError;
    if (appAsarReplaced || loaderTouched) {
      try {
        if (appAsarReplaced && rollbackAsar) {
          fs.copyFileSync(rollbackAsar, appAsar);
          asar.uncache(appAsar);
        }
        if (loaderTouched) restoreLoader(resources, savedLoader);
      } catch (rollback) {
        rollbackError = rollback;
      }
    }
    if (rollbackError) {
      console.error(`安装失败，自动恢复也失败：${rollbackError.message}`);
      if (backup?.backupAsar) console.error(`原始备份：${backup.backupAsar}`);
    } else if (appAsarReplaced || loaderTouched) {
      console.error("安装失败，已自动恢复原始文件。", error.message);
    } else {
      console.error("安装失败，未修改 Figma。", error.message);
    }
    process.exitCode = 1;
  } finally {
    if (tempRoot) fs.rmSync(tempRoot, { recursive: true, force: true });
    if (rollbackRoot) fs.rmSync(rollbackRoot, { recursive: true, force: true });
  }
}

function status(resources) {
  const appAsar = path.join(resources, "app.asar");
  const info = readAppInfo(appAsar);
  const loader = path.join(resources, "node_modules", "fg01");
  console.log(`Figma 版本：${info.version}`);
  console.log(`resources：${resources}`);
  console.log(`启动标记：${hasLoaderMarker(info.main) ? "已安装" : "未安装"}`);
  console.log(`中文加载器：${fs.existsSync(loader) ? "已安装" : "未安装"}`);
  console.log(`app.asar SHA-256：${sha256(appAsar)}`);
}

function uninstall(resources, { backups = backupRoot } = {}) {
  const appAsar = path.join(resources, "app.asar");
  const current = readAppInfo(appAsar);
  const backup = findOriginalBackup(resources, current.version, backups);
  if (!backup) {
    fail("找不到对应的原始备份，未执行卸载。请从 Figma 官方安装包覆盖安装以恢复原版。");
  }
  fs.copyFileSync(backup.data.backupAsar, appAsar);
  const restored = readAppInfo(appAsar);
  if (hasLoaderMarker(restored.main)) fail("原始备份验证失败，已停止移除中文加载器。");
  fs.rmSync(path.join(resources, "node_modules", "fg01"), { recursive: true, force: true });
  console.log(`已恢复：${backup.data.backupAsar}`);
  console.log("中文加载器已移除。macOS 用户请运行卸载脚本完成重新签名。");
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const resources = locateResources(args.resources);

  if (args.command === "install") await install(resources);
  else if (args.command === "status") status(resources);
  else if (args.command === "uninstall") uninstall(resources);
  else fail(`未知命令：${args.command}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

export {
  createOriginalBackup,
  ensureOriginalBackup,
  findOriginalBackup,
  hasLoaderMarker,
  install,
  isVerifiedOriginalBackup,
  listBackups,
  main,
  patchMain,
  readAppInfo,
  uninstall,
};
