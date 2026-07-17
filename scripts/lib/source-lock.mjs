import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function walkFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(file));
    else files.push(file);
  }
  return files;
}

export function createSourceLock(root, version) {
  const loaderRoot = path.join(root, "src", "translation-loader");
  const files = {};
  for (const file of walkFiles(loaderRoot).sort()) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    files[relative] = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }
  return { version, files };
}
