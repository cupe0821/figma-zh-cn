import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSourceLock } from "./lib/source-lock.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const output = path.join(root, "manifests", "source-lock.json");
const lock = createSourceLock(root, pkg.version);
const dictionary = JSON.parse(fs.readFileSync(path.join(root, "src/translation-loader/js/lang.cn.json"), "utf8"));
const manifestFiles = fs.readdirSync(path.join(root, "manifests"))
  .filter((name) => name.endsWith(".json") && name !== "source-lock.json")
  .filter((name) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", name), "utf8"));
    return manifest.translationVersion === pkg.version;
  });

if (manifestFiles.length !== 1) {
  throw new Error(`版本 ${pkg.version} 应恰好对应一个版本清单，实际为 ${manifestFiles.length}`);
}
const manifestPath = path.join(root, "manifests", manifestFiles[0]);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.dictionaryEntries = Object.keys(dictionary).length;

fs.writeFileSync(output, `${JSON.stringify(lock, null, 2)}\n`);
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`已更新维护元数据：${Object.keys(lock.files).length} 个加载器源文件，${manifest.dictionaryEntries} 条词典。`);
