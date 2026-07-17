import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createSourceLock } from "./lib/source-lock.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(fs.readFileSync(path.join(root, "manifests/source-lock.json"), "utf8"));
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const dictionary = JSON.parse(fs.readFileSync(path.join(root, "src/translation-loader/js/lang.cn.json"), "utf8"));
const failures = [];
const actualLock = createSourceLock(root, pkg.version);

if (lock.version !== pkg.version) failures.push(`source-lock 版本应为 ${pkg.version}，实际为 ${lock.version}`);
for (const relative of new Set([...Object.keys(lock.files), ...Object.keys(actualLock.files)])) {
  if (!lock.files[relative]) failures.push(`加载器源文件未加入 source-lock：${relative}`);
  else if (!actualLock.files[relative]) failures.push(`source-lock 包含已删除文件：${relative}`);
  else if (actualLock.files[relative] !== lock.files[relative]) failures.push(`文件未经 source-lock 确认：${relative}`);
}

const versionManifests = fs.readdirSync(path.join(root, "manifests"))
  .filter((name) => name.endsWith(".json") && name !== "source-lock.json")
  .map((name) => ({
    name,
    data: JSON.parse(fs.readFileSync(path.join(root, "manifests", name), "utf8")),
  }))
  .filter((item) => item.data.translationVersion === pkg.version);
if (versionManifests.length !== 1) {
  failures.push(`版本 ${pkg.version} 应恰好对应一个版本清单，实际为 ${versionManifests.length}`);
} else if (versionManifests[0].data.dictionaryEntries !== Object.keys(dictionary).length) {
  failures.push(`${versionManifests[0].name} 的词典数量与实际不一致`);
}

const forbidden = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", "release", "runtime"].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(app|asar|exe|dll|dmg|msi)$/i.test(entry.name) || fs.statSync(file).size > 20 * 1024 * 1024) forbidden.push(path.relative(root, file));
  }
}
walk(root);
if (forbidden.length) failures.push(`仓库包含疑似 Figma/二进制文件：${forbidden.join(", ")}`);

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`验证通过：${Object.keys(dictionary).length} 条词典，${Object.keys(lock.files).length} 个加载器源文件哈希一致，版本清单同步，未包含 Figma 二进制。`);
