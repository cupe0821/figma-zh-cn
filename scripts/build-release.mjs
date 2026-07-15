import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
if (!target) throw new Error("用法：node scripts/build-release.mjs <target>");

const output = path.join(root, "dist", `figma-zh-cn-${target}`);
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, "runtime"), { recursive: true });

for (const name of ["README.md", "LICENSE", "THIRD_PARTY_NOTICE.md", "package.json", "package-lock.json", "src", "scripts", "manifests", "node_modules"]) {
  const source = path.join(root, name);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(output, name), { recursive: true });
}

const nodeName = process.platform === "win32" ? "node.exe" : "node";
fs.copyFileSync(process.execPath, path.join(output, "runtime", nodeName));
if (process.platform !== "win32") {
  fs.chmodSync(path.join(output, "runtime", nodeName), 0o755);
  for (const script of ["install-macos.command", "uninstall-macos.command"]) {
    fs.chmodSync(path.join(output, "scripts", script), 0o755);
  }
}
console.log(output);
