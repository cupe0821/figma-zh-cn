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
  const raw = asar.extractFile(appAsar, "package.json").toString("utf8");
  const pkg = JSON.parse(raw);
  const mainPath = pkg.main || "main.js";
  const main = asar.extractFile(appAsar, mainPath).toString("utf8");
  return { version: pkg.version || "unknown", mainPath, main };
}

function patchMain(source) {
  if (source.includes(marker) || source.includes("require('fg01');")) return { source, changed: false };
  const strict = /^(?:\uFEFF)?(["']use strict["'];?)/;
  if (!strict.test(source)) fail("Figma 主入口结构与已知版本不一致，已停止，未写入任何文件。");
  return { source: source.replace(strict, `$1${marker}`), changed: true };
}

function unpackPattern() {
  return "{**/*.node,assets/cursor-dropper-ui3*.png}";
}

async function rebuildAsar(original, mainPath, patchedMain) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "figma-zh-cn-"));
  const extracted = path.join(tempRoot, "app");
  const output = path.join(tempRoot, "app.asar");
  try {
    asar.extractAll(original, extracted);
    fs.writeFileSync(path.join(extracted, mainPath), patchedMain);
    await asar.createPackageWithOptions(extracted, output, { unpack: unpackPattern() });
    return { tempRoot, output };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function listBackups() {
  if (!fs.existsSync(backupRoot)) return [];
  return fs.readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupRoot, entry.name, "manifest.json"))
    .filter(fs.existsSync)
    .map((file) => ({ file, data: JSON.parse(fs.readFileSync(file, "utf8")) }))
    .sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));
}

function createBackup(resources, appAsar, appInfo) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(backupRoot, `${appInfo.version}-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  const backupAsar = path.join(dir, "app.asar");
  fs.copyFileSync(appAsar, backupAsar);
  const loader = path.join(resources, "node_modules", "fg01");
  if (fs.existsSync(loader)) fs.cpSync(loader, path.join(dir, "fg01"), { recursive: true });
  const manifest = {
    createdAt: new Date().toISOString(),
    figmaVersion: appInfo.version,
    resources,
    originalSha256: sha256(appAsar),
    backupAsar
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function copyLoader(resources) {
  const target = path.join(resources, "node_modules", "fg01");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(loaderSource, target, { recursive: true });
  return target;
}

async function install(resources) {
  const appAsar = path.join(resources, "app.asar");
  const before = readAppInfo(appAsar);
  const patch = patchMain(before.main);
  const backup = createBackup(resources, appAsar, before);
  let tempRoot;
  try {
    if (patch.changed) {
      const rebuilt = await rebuildAsar(appAsar, before.mainPath, patch.source);
      tempRoot = rebuilt.tempRoot;
      const staged = `${appAsar}.figma-zh-cn-new`;
      fs.copyFileSync(rebuilt.output, staged);
      fs.renameSync(staged, appAsar);
    }
    const loader = copyLoader(resources);
    const after = readAppInfo(appAsar);
    if (!after.main.includes(marker)) fail("安装后自检失败：启动标记不存在。");
    console.log(`已安装：Figma ${after.version}`);
    console.log(`中文加载器：${loader}`);
    console.log(`原始备份：${backup.backupAsar}`);
    console.log(`当前 app.asar SHA-256：${sha256(appAsar)}`);
  } catch (error) {
    fs.copyFileSync(backup.backupAsar, appAsar);
    console.error("安装失败，已自动恢复原始 app.asar。", error.message);
    process.exitCode = 1;
  } finally {
    if (tempRoot) fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function status(resources) {
  const appAsar = path.join(resources, "app.asar");
  const info = readAppInfo(appAsar);
  const loader = path.join(resources, "node_modules", "fg01");
  console.log(`Figma 版本：${info.version}`);
  console.log(`resources：${resources}`);
  console.log(`启动标记：${info.main.includes(marker) ? "已安装" : "未安装"}`);
  console.log(`中文加载器：${fs.existsSync(loader) ? "已安装" : "未安装"}`);
  console.log(`app.asar SHA-256：${sha256(appAsar)}`);
}

function uninstall(resources) {
  const appAsar = path.join(resources, "app.asar");
  const backup = listBackups().find((item) => path.resolve(item.data.resources) === path.resolve(resources));
  if (!backup || !fs.existsSync(backup.data.backupAsar)) {
    fail("找不到对应的原始备份，未执行卸载。请从 Figma 官方安装包覆盖安装以恢复原版。");
  }
  fs.copyFileSync(backup.data.backupAsar, appAsar);
  fs.rmSync(path.join(resources, "node_modules", "fg01"), { recursive: true, force: true });
  console.log(`已恢复：${backup.data.backupAsar}`);
  console.log("中文加载器已移除。macOS 用户请运行卸载脚本完成重新签名。");
}

const args = parseArgs(process.argv.slice(2));
const resources = locateResources(args.resources);

if (args.command === "install") await install(resources);
else if (args.command === "status") status(resources);
else if (args.command === "uninstall") uninstall(resources);
else fail(`未知命令：${args.command}`);
