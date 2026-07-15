import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dictionary = JSON.parse(fs.readFileSync(path.join(root, "src/translation-loader/js/lang.cn.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "src/translation-loader/js/figmaCN.js"), "utf8");

test("关键累积翻译不会被后续更新覆盖", () => {
  const expected = {
    "Edit image with prompt": "使用提示词编辑图像",
    "Generate content": "生成内容",
    "Add skill": "添加技能",
    "Manage skills": "管理技能",
    "Done!": "完成！",
    "First, select one image": "请先选择一张图像",
    "Change colors": "更改颜色",
    "Add object": "添加对象",
    "Checking for changes": "正在检查更改",
    "Pasting…": "正在粘贴…",
    "Recent chats": "最近对话",
    "Design next user screen": "设计下一个用户界面",
    "Create the next screen that follows this one in the user journey.": "创建用户旅程中紧接当前界面的下一个界面。"
  };
  for (const [source, target] of Object.entries(expected)) assert.equal(dictionary[source], target, source);
});

test("专业名词与代码内容的保护规则仍存在", () => {
  assert.equal(dictionary.RGB, undefined);
  assert.equal(dictionary.CSS, undefined);
  assert.equal(dictionary.Bold, undefined);
  assert.match(runtime, /isCodeSyntaxContext/);
  assert.match(runtime, /isFontWeightContext/);
  assert.match(runtime, /isBlendModeNormalContext/);
  assert.match(runtime, /isShaderQualityPopup/);
});

test("翻译加载器包含防重复和动态界面处理", () => {
  assert.match(runtime, /MutationObserver/);
  assert.match(runtime, /normalize/);
  assert.match(runtime, /value\.trim\(\)===['"]Pen['"].*translated\.trim\(\)===['"]钢笔['"]/s);
  assert.match(runtime, /white-space['"],['"]nowrap/);
  assert.equal(Object.keys(dictionary).length, 4340);
});
