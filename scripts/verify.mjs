import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(fs.readFileSync(path.join(root, "manifests/source-lock.json"), "utf8"));
const dictionary = JSON.parse(fs.readFileSync(path.join(root, "src/translation-loader/js/lang.cn.json"), "utf8"));
const failures = [];

for (const [relative, expected] of Object.entries(lock.files)) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    failures.push(`缺少锁定文件：${relative}`);
    continue;
  }
  const actual = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (actual !== expected) failures.push(`文件未经 source-lock 确认：${relative}`);
}

if (Object.keys(dictionary).length !== 4337) {
  failures.push(`词典条目应为 4337，实际为 ${Object.keys(dictionary).length}`);
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

console.log(`验证通过：${Object.keys(dictionary).length} 条词典，${Object.keys(lock.files).length} 个源文件哈希一致，未包含 Figma 二进制。`);
