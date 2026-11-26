import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dictionary = JSON.parse(fs.readFileSync(path.join(root, "src/translation-loader/js/lang.cn.json"), "utf8"));
const menuDictionary = JSON.parse(fs.readFileSync(path.join(root, "src/translation-loader/js/lang.cn.menu.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "src/translation-loader/js/figmaCN.js"), "utf8");
const injector = fs.readFileSync(path.join(root, "src/translation-loader/lib/injectJsToWebContents.js"), "utf8");
const loaderEntry = fs.readFileSync(path.join(root, "src/translation-loader/index.js"), "utf8");

test("扁平语言词典没有被 JSON.parse 静默覆盖的重复键", () => {
  for (const name of ["lang.cn.json", "lang.cn.menu.json"]) {
    const source = fs.readFileSync(path.join(root, "src/translation-loader/js", name), "utf8");
    const keys = [...source.matchAll(/^\s*("(?:[^"\\]|\\.)*")\s*:/gm)].map(match => JSON.parse(match[1]));
    assert.equal(keys.length, Object.keys(JSON.parse(source)).length, name + " contains duplicate keys or unsupported layout");
    assert.equal(new Set(keys).size, keys.length, name + " contains duplicate keys");
  }
});

test("官方资源上下文中的导航、动画和列表术语保持准确", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {"Out":"退场","Current item":"当前项","Media item":"媒体项","Text item":"文本项","Escape":"Esc 键","Next frame":"下一个画框","Work":"工作"};
  for (const [source, target] of Object.entries(cases)) {
    assert.equal(context.lookupForTest(source), target, source);
  }
});

test("新增官方界面样式、形状和 FigJam 模板词条保持准确", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {
    "Double": "双线", "Groove": "凹槽", "Inset": "内凹", "Outset": "外凸", "Ridge": "凸脊",
    "Column": "列", "Row": "行", "Results for": "搜索结果：", "Summing junction": "求和节点",
    "Justify": "两端对齐", "Span": "跨度", "whitespace": "空白字符", "Extended": "扩展", "Overrides": "覆盖项",
    "Symbol links": "符号链接", "Point": "点", "Payload": "有效载荷", "Swap": "交换", "Phrase": "短语", "Map": "映射", "Child": "子级", "Stepper": "步骤指示器", "Get": "获取", "Go to": "转到", "to edit": "进行编辑",
    "Everything else is history.": "其余一切都已成为历史。",
    "for commands": "用于输入命令", "sending it again": "再次发送", "Custom Other Role ": "自定义其他角色 ", "delete my account": "删除我的账户", "(Override)": "（覆盖）", "diagrams": "图表", "gantt": "甘特图", "Ideas": "想法", "journey": "旅程", "org": "组织", "schedule": "日程", "sync": "同步", "user flow": "用户流程", "Make ⌘↵": "生成 ⌘↵",
    "Viewer-restricted": "仅限查看者", "Select a node to roundtrip": "选择要往返转换的节点", "Abandon and reattach multiplayer": "放弃并重新连接多人协作", "Lint first draft kit": "检查初稿套件", "Repair backing component set": "修复底层组件集", "Trackable debug mode": "可追踪调试模式",
    "Topic": "主题", "Bug bash": "Bug 集中修复", "Design crit": "设计评审", "Retro": "复盘", "User journey": "用户旅程",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
});

test("输入框占位提示翻译为中文而用户输入保持原样", () => {
  const context = vm.createContext({
    document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] },
    Node: { ELEMENT_NODE: 1 },
  });
  const code = runtime.replace("const map={};", `const map=${JSON.stringify(dictionary)};`)
    .replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){");
  vm.runInContext(code, context);
  const input = { nodeType: 1, tagName: "INPUT", parentElement: null,
    matches: selector => selector === 'input,textarea,[contenteditable="true"],[role="textbox"]',
    closest: () => null, getAttribute: () => null };
  assert.equal(context.lookupForTest("Search", input, "placeholder"), "搜索");
  assert.equal(context.lookupForTest("Search", input), undefined);
  assert.equal(context.lookupForTest("My custom query", input, "placeholder"), undefined);
});

test("查看全部颜色时完整翻译数字和颜色类型", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify(dictionary)+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const lookup = context.lookupForTest;
  assert.equal(lookup("See all 119 colors"), "查看全部 119 种颜色");
  assert.equal(lookup("查看全部 119 colors"), "查看全部 119 种颜色");
  assert.equal(lookup("See all 1 color"), "查看全部 1 种颜色");
  assert.equal(lookup("See all 1,234 library colors"), "查看全部 1,234 种组件库颜色");
  assert.equal(lookup("See all Design resources"), "查看全部 Design resources");
});

test("活动日志动态文案保留参数且不修改用户输入", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify(dictionary)+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = [
    ["Disabled AI content training for Design & Research", "已为 Design & Research 禁用 AI 内容训练"],
    ["Enabled AI content training for 示例组织", "已为 示例组织 启用 AI 内容训练"],
    ["Disabled AI features for Alpha", "已为 Alpha 禁用 AI 功能"],
    ["Enabled AI features for Beta", "已为 Beta 启用 AI 功能"],
    ["person@example.com purchased 1,000 AI credits/mo", "person@example.com 购买了每月 1,000 AI 点数"],
    ["person@example.com disabled pay as you go AI credits", "person@example.com 禁用了按量付费 AI 点数"],
    ["Rejected person@example.com’s request for additional AI credits", "已拒绝 person@example.com 申请更多 AI 点数的请求"],
  ];
  const input = { nodeType: 1, tagName: "INPUT", parentElement: null, matches: selector => selector === 'input,textarea,[contenteditable="true"],[role="textbox"]', closest: () => null, getAttribute: () => null };
  for (const [source, translated] of cases) {
    assert.equal(context.lookupForTest(source), translated);
    assert.equal(context.lookupForTest(source, input), undefined);
  }
  assert.equal(context.lookupForTest("person@example.com purchased unlimited AI credits/mo"), undefined);
  assert.equal(context.lookupForTest("Disabled AI features for"), undefined);
});

test("桌面应用与锁定团队动态文案完整匹配", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify(dictionary)+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateTextNodeForTest=translateTextNode;\nfunction start(){"), context);
  const cases = {
    "Pinned split tab group: Design, Prototype": "已固定分屏标签组：Design、Prototype",
    "Figma Desktop App version 126.8.18": "Figma 桌面应用版本 126.8.18",
    "Copyright © 2026 Figma, Inc.": "版权所有 © 2026 Figma, Inc.",
    "This version of Figma is not intended for use on Apple Silicon. Please download Figma again from the Figma Downloads page to ensure that the correct version is installed.": "此版本的 Figma 不适用于 Apple Silicon。请从 Figma 下载页面重新下载 Figma，以确保安装了正确的版本。",
    "This version of Figma is not intended for use on Windows on Arm. Please download Figma again from the Figma Downloads page to ensure that the correct version is installed.": "此版本的 Figma 不适用于 Windows on Arm。请从 Figma 下载页面重新下载 Figma，以确保安装了正确的版本。",
    "This is likely happening because your corporate network is using a proxy. This can be resolved by adding non-Figma origins used by your proxy to your AllowedOriginHosts setting. Click the button below to visit our Help Center for details.": "这可能是因为您的企业网络正在使用代理。您可以将代理使用的非 Figma 源添加到 AllowedOriginHosts 设置中来解决此问题。点击下方按钮访问帮助中心了解详情。",
    "Figma Make may load project configuration from this folder that can run commands. /Users/example/project": "Figma Make 可能会从此文件夹加载可运行命令的项目配置。\n\n/Users/example/project",
    "Make will open this repository after cloning. Project configuration and Git metadata in this repository can run commands. /Users/example/repo": "克隆后，Make 将打开此代码库。此代码库中的项目配置和 Git 元数据可能会运行命令。\n\n/Users/example/repo",
    "You have multiple installations of the Figma Desktop App. Try again after removing the other Desktop App installation at:": "您安装了多个 Figma 桌面应用。请移除其他桌面应用安装，然后重试，位置：",
    "You are already using the latest version of Figma. Missing a new feature? Try reloading your tabs and check again. If you experience any other issues, please contact support.": "您已在使用最新版本的 Figma。缺少新功能？请重新加载标签页并重试。如果遇到其他问题，请联系支持团队。",
    "Please enable Camera & Microphone for Figma in System Preferences → Security & Privacy → Privacy.": "请在“系统偏好设置 → 安全性与隐私 → 隐私”中为 Figma 启用相机和麦克风。",
    "Please enable Camera for Figma in System Preferences → Security & Privacy → Privacy.": "请在“系统偏好设置 → 安全性与隐私 → 隐私”中为 Figma 启用相机。",
    "Please enable Microphone for Figma in System Preferences → Security & Privacy → Privacy.": "请在“系统偏好设置 → 安全性与隐私 → 隐私”中为 Figma 启用麦克风。",
    "\"Design.fig\" already exists. Replacing it will overwrite its existing contents.": "“Design.fig”已存在。替换它将覆盖其现有内容。",
    "Figma app data will reset and the app will restart. You will need to log back into Figma after this is done.": "Figma 应用数据将被重置，应用也会重启。完成后，您需要重新登录 Figma。",
    "Figma was unable to reset app data and restart. Please contact support for assistance.": "Figma 无法重置应用数据并重启。请联系支持团队寻求帮助。",
    "Figma needs to be restarted to apply changes.": "Figma 需要重启才能应用更改。",
    "\"/tmp/design.fig\" could not be saved. Remaining files will not be saved.": "无法保存“/tmp/design.fig”。剩余文件将不会保存。",
    "Figma was not able to install the update:": "Figma 无法安装更新：",
    "Microphone access required to talk in Figma Audio. Please enable microphone for Figma in System Preferences → Security & Privacy → Privacy → Microphone.": "需要麦克风权限才能在 Figma Audio 中通话。请在“系统偏好设置 → 安全性与隐私 → 隐私 → 麦克风”中为 Figma 启用麦克风。",
    "Error navigating to 'https://example.com': ERR_FAILED": "导航至“https://example.com”时出错：ERR_FAILED",
    "This will update your seat in Professional—you’ll get full access to Dev Mode, FigJam, and Figma Slides.": "这将更新您在 Professional 中的席位—您将获得 Dev Mode、FigJam 和 Figma Slides 的完整访问权限。",
    "This will update your seat in Professional—you’ll get full access to Figma Design, Figma Sites, Dev Mode, FigJam, and Figma Slides.": "这将更新您在 Professional 中的席位—您将获得 Figma Design、Figma Sites、Dev Mode、FigJam 和 Figma Slides 的完整访问权限。",
    "Follow Alex": "跟随 Alex",
    "For higher AI credit limits in Professional, request an upgrade to a Full seat.": "如需在 Professional 中获得更高的 AI 额度上限，请申请升级为完整席位。",
    "For higher MCP tool call limits in Professional, request an upgrade to a Full seat.": "如需在 Professional 中获得更高的 MCP 工具调用上限，请申请升级为完整席位。",
    "Cui. is locked and cannot add more files.": "Cui. 已锁定，无法再添加更多文件。",
    "Viewed 1 day ago": "已于 1 天前 查看",
    "Edited 7 hours ago": "编辑于 7 小时前",
    "All fields marked with * are required": "标有 * 的字段均为必填项",
    "2 creators have riffed on this": "2 位创建者对其进行了改编",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
  const viewedParent = { nodeType: 1, textContent: "Viewed 1 day ago", parentElement: null };
  const viewedNode = { nodeType: 3, parentElement: viewedParent };
  assert.equal(context.lookupForTest("Viewed", viewedNode), "查看于");
  const editedParent = { nodeType: 1, textContent: "Edited 7 hours ago", parentElement: null };
  const editedNode = { nodeType: 3, parentElement: editedParent };
  assert.equal(context.lookupForTest("Edited", editedNode), "编辑于");
  const editedCnParent = { nodeType: 1, textContent: "编辑 7 小时前", parentElement: null };
  const editedCnNode = { nodeType: 3, parentElement: editedCnParent };
  assert.equal(context.lookupForTest("Edited", editedCnNode), "编辑于");
  const requiredNode = { nodeType: 3, nodeValue: "All fields marked with * are required", parentElement: { nodeType: 1, textContent: "All fields marked with * are required", parentElement: null } };
  context.translateTextNodeForTest(requiredNode);
  assert.equal(requiredNode.nodeValue, "标有 * 的字段均为必填项");
});

test("官方文案空白差异可匹配且不覆盖明确译文或用户输入", () => {
  const extra = {
    "Whitespace\nexample": "空白示例",
    "Conflicting\nexample": "第一种含义",
    "Conflicting  example": "第二种含义",
    "Explicit example": "明确译文",
    "Explicit\nexample": "其他译文",
  };
  const context = vm.createContext({
    document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] },
    Node: { ELEMENT_NODE: 1 },
  });
  vm.runInContext(runtime.replace("const map={};", `const map=${JSON.stringify({...dictionary, ...extra})};`)
    .replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const lookup = context.lookupForTest;
  assert.equal(lookup("PDF import is not supported\n"), "不支持导入 PDF\n");
  assert.equal(lookup("PSD import is not supported"), "不支持导入 PSD");
  assert.equal(lookup("  Whitespace   example\n"), "  空白示例\n");
  assert.equal(lookup("Conflicting example"), undefined);
  assert.equal(lookup("Explicit example"), "明确译文");
  assert.equal(lookup("Unknown whitespace example"), undefined);
  const input = { nodeType: 1, tagName: "INPUT", parentElement: null,
    matches: selector => selector === 'input,textarea,[contenteditable="true"],[role="textbox"]',
    closest: () => null, getAttribute: () => null };
  assert.equal(lookup("Whitespace example", input), undefined);
  assert.equal(lookup("Whitespace example", input, "placeholder"), "空白示例");
});

test("字体特性和外部系统术语保留准确含义", () => {
  const expected = {
    "Above-base forms": "基字上方字形",
    "Above-base mark positioning": "基字上方附标定位",
    "Below-base forms": "基字下方字形",
    "Half forms": "辅音半形",
    "Math script style alternates": "数学上下标替代字形",
    "Flattened ascent forms": "扁平重音符号字形",
    "Vovel jamo forms": "韩文中声字母字形",
    "Required variation alternates": "可变字体必需替代字形",
    "Google leaderboard ad": "Google 页首横幅广告",
    "YouTube ad (companion)": "YouTube 广告（随播横幅）",
    "Quarterly true-up": "季度补差结算",
    "Screen & System Audio Recording": "录屏与系统录音",
  };
  const context = vm.createContext({
    document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] },
    Node: { ELEMENT_NODE: 1 },
  });
  vm.runInContext(runtime.replace("const map={};", `const map=${JSON.stringify(dictionary)};`)
    .replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  for (const [source, translated] of Object.entries(expected)) {
    assert.equal(dictionary[source], translated, source);
    assert.equal(context.lookupForTest(source), translated, source);
  }
});

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
    "Add starting point": "添加起始点",
    "Edit objects": "编辑对象",
    "Inside stroke": "内部描边",
    "Auto spacing": "自动间距",
    "The updated layout is more consistent with CSS. The legacy version is available temporarily while you transition.": "新版布局与 CSS 的一致性更好。在迁移期间，旧版布局会暂时可用。",
    "Shaders have a max resolution of 2048px": "着色器的最大分辨率为 2048 像素",
    "Remove from recents": "从最近使用中移除",
    "Import from manifest…": "从清单导入…",
    "Search": "搜索",
    "English": "英语",
    "日本語": "日语",
    "Français": "法语",
    "Deutsch": "德语",
    "Español (España)": "西班牙语（西班牙）",
    "Español (Latinoamérica)": "西班牙语（拉丁美洲）",
    "한국어": "韩语",
    "Português (Brasil)": "葡萄牙语（巴西）",
    "Checking for changes": "正在检查更改",
    "Applying changes...": "正在应用更改…",
    "Applying changes…": "正在应用更改…",
    "Replacing...": "正在替换…",
    "Replacing…": "正在替换…",
    "Downloading images...": "正在下载图片…",
    "Downloading images…": "正在下载图片…",
    "Save partial file": "保存部分文件",
    "You’re out of credits for this beta feature in your free Starter plan until they reset on Sep 1, 2026. Upgrade your plan for more.": "您的免费入门版计划已用尽此 Beta 功能的额度，额度将在 2026 年 9 月 1 日重置。升级计划以获得更多额度。",
    "You're out of credits for this beta feature in your free Starter plan until they reset on Sep 1, 2026. Upgrade your plan for more.": "您的免费入门版计划已用尽此 Beta 功能的额度，额度将在 2026 年 9 月 1 日重置。升级计划以获得更多额度。",
    "By default, display empty slot": "默认显示空插槽",
    "By default, fill items on slot's counter axis": "默认沿插槽的交叉轴填充项目",
    "Only preferred instances can be added. Click the slot to view options.": "只能添加首选实例。点击插槽查看选项。",
    "Your Starter plan": "您的入门版计划",
    "Use AI credits in Figma Make to build apps, create sites, or bring other ideas to life.": "在 Figma Make 中使用 AI 额度来构建应用、创建网站或实现更多创意。",
    "Monthly credits used": "每月额度使用量",
    "daily credits used": "每日额度使用量",
    "files total across Design and Sites": "Design 和 Sites 中的文件总数",
    "Which plan and seats would you like?": "您想选择哪种方案和席位？",
    "Best for anyone who wants to sample Figma": "适合想要体验 Figma 的任何人",
    "Just like Professional, but limited to collaboration with verified Education users": "与专业版类似，但仅限与经过认证的教育版用户协作",
    "Monthly": "每月",
    "Annual (Save 20%)": "每年（节省 20%）",
    "3 files to try out": "可试用 3 个文件",
    "Basic design, prototyping, and collaboration": "基础设计、原型制作和协作",
    "3000 AI credits/month": "每月 3000 点 AI 额度",
    "Custom templates—just for your team": "专为您的团队打造的自定义模板",
    "Upgrade to the Professional plan, and build templates for your team’s rituals and workflows—without creating a new file each time.": "升级到专业版方案，为团队的惯例和工作流程创建模板，无需每次都新建文件。",
    "Upload fonts for your personal use with a paid plan.": "使用付费方案上传字体供个人使用。",
    "Make activity": "Make 活动",
    "Notify me when my Make completes": "Make 完成时通知我",
    "Redesigned aggregation card": "已重新设计聚合卡片",
    "No matching layers to select on page": "页面上没有匹配的图层可供选择",
    "Find shared folders": "查找共享的文件夹",
    "External folders--shared by someone outside your team--are now organized by plan, right here.": "外部文件夹（由团队外部人员共享）现在会按方案整理，并显示在这里。",
    "Play Motion animations": "播放 Motion 动画",
    "(Internal-only): Components inside of animations is currently unsupported.": "（仅限内部）：目前不支持动画中的组件。",
    "Create 3 animation variants": "创建 3 个动画变体",
    "Add a bounce": "添加弹跳效果",
    "Learn keyframes": "了解关键帧",
    "Added voice animation": "已添加语音动画",
    "Play shaders": "播放着色器",
    "Stop shaders": "停止着色器",
    "Moving gradient": "流动渐变",
    "Morph speed": "变形速度",
    "Material": "材质",
    "Color balance": "色彩平衡",
    "Color method": "着色方式",
    "Satin": "缎面",
    "Glossy": "亮面",
    "Iridescent": "虹彩",
    "View code": "查看代码",
    "Facing": "朝向",
    "Inspecting missing page...": "正在检查缺失页面…",
    "Inspecting missing page…": "正在检查缺失页面…",
    "Loading comments...": "正在加载评论…",
    "Loading comments…": "正在加载评论…",
    "Comments hidden": "评论已隐藏",
    "Comments visible": "评论已显示",
    "What else changes?": "还有哪些变化？",
    "MCP tool calls": "MCP 工具调用",
    "Stay on Professional": "继续使用专业版",
    "Downgrade to Starter": "降级至入门版",
    "3 files": "3 个文件",
    "3,000/mo for Full Seats": "完整席位每月 3,000 点",
    "500/mo, 150/day": "每月 500 点，每日 150 点",
    "200/day for Full seats": "完整席位每日 200 次",
    "6/mo": "每月 6 次",
    "Cancel your Professional plan?": "取消专业版套餐？",
    "If you’d like to change to a different pricing plan instead,": "如果您想改用其他定价方案，请",
    "If you'd like to change to a different pricing plan instead,": "如果您想改用其他定价方案，请",
    "will become a free Starter team at the end of the current subscription period": "将在当前订阅周期结束后成为免费的入门版团队",
    "Reactivate plan": "重新激活套餐",
    "Reactivate your subscription of Professional": "重新激活专业版订阅",
    "Update payment details": "更新付款信息",
    "Take a minute to update the payment method and address associated with your payment information. Please note that we'll charge any unpaid invoices once you update your payment method.": "请更新付款信息所关联的付款方式和地址。请注意，更新付款方式后，我们将收取所有未付账单的款项。",
    "Card number": "卡号",
    "Expiration date": "有效期",
    "Security code": "安全码",
    "Name on payment method": "持卡人姓名",
    "Billing address": "账单地址",
    "Apt, unit, suite, etc. (optional)": "公寓、单元、套房等（选填）",
    "United States": "美国",
    "City": "城市",
    "Zip code": "邮政编码",
    "Your monthly Professional subscription has been canceled.": "您的专业版月度订阅已取消。",
    "Your team is locked": "您的团队已锁定",
    "Your team is over Starter plan limits. To unlock, reactivate your Professional plan or move some work.": "您的团队已超出入门版套餐限制。要解锁，请重新激活专业版套餐或移动部分内容。",
    "Reactivate your Professional plan": "重新激活专业版套餐",
    "Locked": "已锁定",
    "See what's included": "查看套餐权益",
    "See what’s included": "查看套餐权益",
    "Your plan and usage": "套餐与用量",
    "Reactivate your Professional plan before": "请在",
    "to keep unlimited files, more AI credits, and": "之前重新激活专业版套餐，以继续享有无限文件、更多 AI 额度及",
    "so much more.": "其他更多权益。",
    "Comment resolved": "评论已解决",
    "Projects are now folders": "项目现已升级为文件夹",
    "Figma projects are now versatile, customizable folders. You can color-code them, create subfolders, and drag and drop to store work.": "Figma 项目现已成为灵活、可自定义的文件夹。你可以用颜色标记、创建子文件夹，并通过拖放来存放工作内容。",
    "All types": "全部类型",
    "All categories": "全部分类",
    "Edit annotation": "编辑备注",
    "Filter by": "筛选条件",
    "Hide annotations": "隐藏备注",
    "All folders": "全部文件夹",
    "Change folder color": "更改文件夹颜色",
    "Add a description for this folder": "为此文件夹添加描述",
    "Copy link to folder": "复制文件夹链接",
    "You can only transfer this folder to another organization with nested folders enabled.": "你只能将此文件夹转移到已启用嵌套文件夹的其他组织。",
    "You can transfer this folder and its content to an external team in a Professional, Organization, or Enterprise plan.": "你可以将此文件夹及其内容转移到使用专业版、组织版或企业版方案的外部团队。",
    "Once an admin accepts, the transfer cannot be undone.": "管理员接受后，转移将无法撤销。",
    "Members of your team may still have access if the receiving team chooses to keep individual collaborators.": "如果接收团队选择保留个人协作者，你团队的成员可能仍可访问。",
    "Once the receiving team shares their Figma team link with you, add it here.": "接收团队与你分享其 Figma 团队链接后，请在此处添加。",
    "Once the receiving team shares their": "接收团队与你分享其",
    "Figma team link": "Figma 团队链接",
    "with you, add it here.": "后，请在此处添加。",
    "You can transfer a copy of this folder to another team in a Professional, Organization, or Enterprise plan.": "你可以将此文件夹的副本转移到使用专业版、组织版或企业版方案的其他团队。",
    "Once an admin accepts, a copy of the folder will be transferred.": "管理员接受后，将转移此文件夹的副本。",
    "Only those on the receiving team or organization will have access to this copy, and any file branches, comments, and version history won’t be transferred.": "只有接收团队或组织中的成员才能访问此副本，文件的分支、评论和版本历史记录不会被转移。",
    "Only those on the receiving team or organization will have access to this copy, and any file branches, comments, and version history won't be transferred.": "只有接收团队或组织中的成员才能访问此副本，文件的分支、评论和版本历史记录不会被转移。",
    "Professional, Organization, or Enterprise plan.": "专业版、组织版或企业版方案。",
    "Enterprise plan.": "企业版方案。",
    "View and comment only": "仅查看和评论",
    "$20/mo": "$20/月",
    "$15/mo": "$15/月",
    "$5/mo": "$5/月",
    "Anyone with this link can join with a View seat, where they can view files, comment, and create folders in your team.": "任何获得此链接的人都可以以查看席位加入，从而查看文件、发表评论并在你的团队中创建文件夹。",
    "Anyone you or collaborators invited can access this file.": "您或协作者邀请的任何人都可以访问此文件。",
    "Resized height to 16:9": "高度已调整为 16:9",
    "Sorry, I can't build a prototype yet.": "抱歉，我还无法构建原型。",
    "For now, add interactions in your Prototyping tab or send this to Figma Make.": "目前，请在“原型”选项卡中添加交互，或将其发送到 Figma Make。",
    "Copy debug details": "复制调试详情",
    "Send this to support when filing a ticket — it helps us find your exact session.": "提交工单时将其发送给支持团队，这有助于我们找到你的确切会话。",
    "Support ID": "支持 ID",
    "Worked for 30s": "运行了 30 秒",
    "Worked for 40s": "运行了 40 秒",
    "Can’t upload some file types.": "无法上传某些文件类型。",
    "Motion was edited": "已在 Figma Motion 中编辑",
    "Open in Figma Motion": "在 Figma Motion 中打开",
    "Ask for changes": "请求修改",
    "Inspecting squares": "正在检查方形",
    "Planning next steps": "正在规划后续步骤",
    "Collaborators in this file": "此文件中的协作者",
    "Invite sent": "邀请已发送",
    "Add comma separated emails to invite": "输入要邀请的邮箱，多个邮箱请用逗号分隔",
    "People invited to file": "此文件的受邀人员",
    "What can people find or learn from this file? Get specific, so the community knows what to expect.": "人们可以从此文件中找到或了解什么？请具体说明，让社区成员清楚可以期待哪些内容。",
    "Includes": "包含",
    "Select a category": "选择分类",
    "You can right-click a frame and select ‘Set as thumbnail’": "您可以右键点击画框，然后选择“设为封面”",
    "Email or website where users can contact you": "用户可与您联系的邮箱或网站",
    "Apps": "应用",
    "Design inspirations": "设计灵感",
    "Icon Packs": "图标包",
    "Presentation templates": "演示文稿模板",
    "Print": "印刷品",
    "Calendar templates": "日历模板",
    "Data templates": "数据模板",
    "Classroom activities": "课堂活动",
    "Design tutorials": "设计教程",
    "Lesson plans": "课程计划",
    "Banners": "横幅",
    "Cards": "卡片",
    "Flyers": "传单",
    "Invitations": "邀请函",
    "Letterheads": "信笺",
    "Name tags": "姓名牌",
    "One pagers": "单页资料",
    "Posters": "海报",
    "Web & social ads": "网页与社交广告",
    "Device mockups": "设备样机",
    "Fonts & typography": "字体与排版",
    "Illustrations library": "插画库",
    "Stock photography": "图库摄影",
    "Zoom backgrounds": "Zoom 背景",
    "Align left baseline": "左对齐基线",
    "Align right baseline": "右对齐基线",
    "Align center baseline": "居中对齐基线",
    "Remove baseline alignment": "移除基线对齐",
    "and 5 others": "等 5 人",
    "Shared folders": "共享的文件夹",
    "Shared by": "共享者",
    "Shared at": "共享时间",
    "Active in file": "文件中活跃",
    "Keep it": "保留",
    "We've sent your request to the file's owner. You can create and edit other files in the meantime.": "我们已将你的请求发送给文件所有者。在此期间，你可以创建和编辑其他文件。",
    "Alpha (use transparency)": "透明度（使用透明度）",
    "Vector (use shape outlines)": "矢量（使用形状轮廓）",
    "Luminance (use brightness)": "亮度（使用亮度）",
    "Insert instance": "插入实例",
    "Includes 8 variants": "包含 8 个变体",
    "Reset properties": "重置属性",
    "Add interactions (AI)": "使用 AI 添加交互",
    "Click - to remove mixed content.": "点击 - 以移除混合内容。",
    "Click - to remove mixed content": "点击 - 移除混合内容",
    "Copying as PNG...": "正在复制为 PNG…",
    "Copying as PNG…": "正在复制为 PNG…",
    "Collections options": "集合选项",
    "Fit width": "适应宽度",
    "Fill screen": "填满屏幕",
    "Resize window to 100%": "将窗口缩放至 100%",
    "Reset aspect ratio": "重置宽高比",
    "Update page to latest layout": "将页面更新为最新布局",
    "Update selection to latest layout": "将所选内容更新为最新布局",
    "Pasting…": "正在粘贴…",
    "Recent chats": "最近对话",
    "Design next user screen": "设计下一个用户界面",
    "Create the next screen that follows this one in the user journey.": "创建用户旅程中紧接当前界面的下一个界面。",
    "Component removed from library": "组件已从组件库移除",
    "To swap instances, replace this with another component from your libraries.": "要替换实例，请用你的组件库中的其他组件替换此组件。",
    "You don't have access to this file": "你无权访问此文件",
    "Zoom device to fill screen": "缩放设备以填满屏幕",
    "Follow prototype": "跟随原型",
    "Resize device to 100%": "将设备缩放至 100%",
    "Show device frame": "显示设备外框",
    "All sources": "全部来源",
    "Expressive": "创意表达",
    "Editing": "编辑",
    "Social media & print": "社交媒体和印刷",
    "Software development": "软件开发",
    "Import from manifest...": "从清单导入…",
    "Weave tool": "编织工具",
    "Widget": "小部件",
    "Price": "价格",
    "All prices": "全部价格",
    "Figma AI credits": "Figma AI 额度",
    "Along with branching, you’ll get...": "除了分支，您还将获得…",
    "Build with agents": "使用智能体构建",
    "Featured": "精选",
    "Create connectors, just for you": "为你创建专属连接器",
    "Create a connector to any MCP server for your own use. Figma doesn’t review custom connectors, so be sure you trust your sources.": "创建一个连接到任意 MCP 服务器的连接器，供你自己使用。Figma 不会审核自定义连接器，因此请确保其来源可信。",
    "Create a connector to any MCP server for your own use. Figma doesn't review custom connectors, so be sure you trust your sources.": "创建一个连接到任意 MCP 服务器的连接器，供你自己使用。Figma 不会审核自定义连接器，因此请确保其来源可信。",
    "Connect an external team": "连接外部团队",
    "Connect an external team?": "连接外部团队？",
    "Wrap style": "换行样式",
    "Pretty": "美观",
    "Balance": "均衡",
    "When you connect an external team, this will become a": "连接外部团队后，该项目将成为",
    "connected project": "已连接项目",
    "connected project.": "已连接项目。",
    "connected folder": "已连接文件夹",
    "connected folder.": "已连接文件夹。",
    "Everyone in it will be able to edit": "项目中的所有人都可以编辑",
    "Everyone in it will be able to edit files and": "项目中的所有人都可以编辑文件并",
    "files and use libraries.": "文件并使用组件库。",
    "use libraries.": "使用组件库。",
    "Everyone in it will be able to edit files and use libraries.": "项目中的所有人都可以编辑文件并使用组件库。",
    "When you connect an external team, this will become a connected project. Everyone in it will be able to edit files and use libraries.": "连接外部团队后，该项目将成为已连接项目。项目中的所有人都可以编辑文件并使用组件库。",
    "When you connect an external team, this will become a connected folder. Everyone in it will be able to edit files and use libraries.": "连接外部团队后，该项目将成为已连接文件夹。项目中的所有人都可以编辑文件并使用组件库。",
    "Copied properties": "已复制属性",
    "Page link copied to clipboard": "页面链接已复制到剪贴板",
    "Create connector": "创建连接器",
    "Connect": "连接",
    "Want to see other built-in connectors?": "想查看其他内置连接器？",
    "Send a request": "提交请求",
    "Icon": "图标",
    "Tagline": "标语",
    "Write a short name": "输入简短名称",
    "Add a few words to briefly describe what your connector does": "用几句话简要说明连接器的用途",
    "Explain in more detail what the tools of this connector will allow people to do": "详细说明此连接器中的工具可帮助用户完成什么",
    "Step 1 of 2": "第 1 步，共 2 步",
    "Choose libraries to use": "选择要使用的组件库",
    "Auto (Dark)": "自动（Dark）",
    "Remove all interactions": "移除所有交互",
    "Learn what products are included in each seat.": "了解每种席位包含哪些产品。",
    "Learn": "了解",
    "what products are included in each seat.": "每种席位包含哪些产品。",
    "Enable closed captioning when using audio inside your files.": "在文件中使用音频时启用隐藏式字幕。",
    "Your uploaded fonts": "您上传的字体",
    "Uploaded by you": "您上传的字体",
    "Upload fonts for your personal use. These fonts will be available across the files you view or edit.": "上传字体供个人使用。这些字体将在您查看或编辑的所有文件中可用。",
    "Upload font": "上传字体",
    "You can see teammates’ history in your files, and they can see yours. (Recommended for collaboration and transparency.)": "您可以在文件中查看队友的历史记录，他们也可以查看您的历史记录。（推荐用于协作和透明。）",
    "Your file history will no longer be recorded or visible to others. You also won’t be able to see your teammates’ file history.": "您的文件历史记录将不再被记录或对其他人可见。您也无法查看队友的文件历史记录。",
    "Enable libraries for all files in your drafts": "为草稿中的所有文件启用组件库",
    "for all files in your drafts": "适用于草稿中的所有文件",
    "You can currently see teammates’ view history in your files, and they can see yours.": "您可以在文件中查看队友的查看历史记录，他们也可以查看您的历史记录。",
    "You can unsubscribe from Figma emails any time. For more information, review our": "您可以随时取消订阅 Figma 的邮件。有关更多信息，请查看我们的",
    "Toggle ready for dev status": "切换“开发就绪”状态",
    "Sample color": "取样颜色",
    "Rotate 90°": "旋转 90°",
    "Water caustic": "水体焦散",
    "Moire": "莫尔纹",
    "Glowing wave": "发光波浪",
    "Pattern grid": "图案网格",
    "Water": "水体",
    "Highlight": "高光",
    "Tessellation": "细分度",
    "Star density": "星体密度",
    "Travel": "位移",
    "Line count": "线条数量",
    "Line offset": "线条偏移",
    "Warp origin": "变形原点",
    "Tile size X": "横向平铺尺寸",
    "Tile size Y": "纵向平铺尺寸",
    "Layer blend": "图层混合",
    "Layer gain": "图层增益",
    "Layer scale": "图层缩放",
    "Layer flow": "图层流动",
    "Cycles": "循环次数",
    "Perlin": "Perlin 噪声",
    "Voronoise": "Voronoise 噪声",
    "Cloud color": "云朵颜色",
    "Sky color": "天空颜色",
    "Coverage": "覆盖率",
    "Variation": "变化量",
    "Wave color": "波浪颜色",
    "Glow intensity": "发光强度",
    "Ring count": "圆环数量",
    "Inverse falloff": "反向衰减",
    "Shape color": "形状颜色",
    "Stroke color": "描边颜色",
    "Stroke width": "描边宽度",
    "Clip to cell": "裁剪到单元格",
    "Box": "方形",
    "Cross": "十字形",
    "Ring": "圆环",
    "Brick": "砖块",
    "Shader fills": "着色器填充",
    "Rotate 90º": "旋转 90°",
    "Rotate 90˚": "旋转 90°",
    "Rotate 90 degrees": "旋转 90°",
    "Match (optional)": "匹配（可选）",
    "Rename to": "重命名为",
    "Renamed all layers": "已重命名所有图层",
    "Renamed component": "已重命名组件",
    "Number ↑": "编号 ↑",
    "Number ↓": "编号 ↓",
    "Use your fonts with Figma agents": "在 Figma 智能体中使用您的字体",
    "This file uses local fonts from your machine. Upload to make them available to the agent. You can view and manage uploaded fonts in Settings at any time.": "此文件使用您电脑上的本地字体。上传字体后，智能体即可使用。您可以随时在“设置”中查看和管理已上传的字体。",
    "Manage uploaded fonts": "管理已上传的字体",
    "Something went wrong...": "出现问题…",
    "Something went wrong…": "出现问题…",
    "Our team is looking into it now. If refreshing the page doesn't work, check our status page for updates.": "我们的团队正在调查。如果刷新页面后问题仍未解决，请查看我们的状态页面以了解最新情况。",
    "Our team is looking into it now. If refreshing the page doesn't work, check our": "我们的团队正在调查。如果刷新页面后问题仍未解决，请查看我们的",
    "status page": "状态页面",
    "for updates.": "了解最新情况。",
    "Reload page": "重新加载页面",
    "Reload Page": "重新加载页面",
    "No variables or properties available": "没有可用的变量或属性",
    "Toggle visibility": "切换可见性",
    "Reset specific changes": "重置特定更改",
    "Enter a description for your starting point": "输入起始点描述",
    "Add delay": "添加延迟",
    "Condition": "条件",
    "Equal to": "等于",
    "Not equal to": "不等于",
    "Greater than": "大于",
    "Greater than or equal to": "大于或等于",
    "Less than": "小于",
    "Less than or equal to": "小于或等于",
    "Add new": "新建",
    "Pick variable": "选择变量",
    "Boolean literal": "布尔字面量",
    "Boolean operator": "布尔运算符",
    "Flip curve": "翻转曲线",
    "After delay": "延迟后",
    "Reset video state": "重置视频状态",
    "Behavior": "行为",
    "Toggle": "切换",
    "Play only": "仅播放",
    "Pause only": "仅暂停",
    "Timestamp": "时间戳",
    "Reset interactions": "重置交互",
    "Edit flow description": "编辑流程描述",
    "Remove flow starting point": "移除流程起始点",
    "Copy flow link": "复制流程链接",
    "Include \"id\" attribute": "包含“id”属性",
    "Your computer may be offline or the Figma server may be experiencing problems.": "您的电脑可能处于离线状态，或 Figma 服务器可能出现问题。",
    "Figma will automatically try to reconnect.": "Figma 将自动尝试重新连接。",
    "For help, visit help.figma.com or contact support@figma.com.": "如需帮助，请访问 help.figma.com 或联系 support@figma.com。",
    "For help, visit": "如需帮助，请访问",
    "or contact": "或联系",
    "Simplify Stroke": "简化描边",
    "Play": "播放",
    "Current time": "当前时间",
    "Change time format": "更改时间格式",
    "Arc": "弧形",
    "Bezier": "贝塞尔曲线",
    "Bounce": "弹跳",
    "Ratio": "比例",
    "Motion Rotation": "运动旋转",
    "Motion Translation X": "运动位移 X",
    "Motion Translation Y": "运动位移 Y",
    "Separate dimensions": "分离维度",
    "Sweep": "圆弧范围",
    "Animations": "动画",
    "Shared with": "共享对象",
    "You directly": "直接与您共享",
    "Distance": "距离",
    "From left": "从左侧",
    "From right": "从右侧",
    "From top": "从顶部",
    "From bottom": "从底部",
    "From top left": "从左上方",
    "From top right": "从右上方",
    "From bottom left": "从左下方",
    "From bottom right": "从右下方",
    "To left": "向左",
    "To right": "向右",
    "To top": "向上",
    "To bottom": "向下",
    "To top left": "向左上方",
    "To top right": "向右上方",
    "To bottom left": "向左下方",
    "To bottom right": "向右下方",
    "Motion Scale X": "运动缩放 X",
    "Motion Scale Y": "运动缩放 Y",
    "Path Trim Start": "路径修剪起点",
    "Path Trim End": "路径修剪终点",
    "Path": "路径",
    "Add stroke fill": "添加描边填充",
    "Edit anchor point": "编辑锚点",
    "Collapse timeline": "收起时间轴",
    "Open help": "打开帮助",
    "Set up third-party agents for Figma MCP": "为 Figma MCP 配置第三方智能体",
    "Figma plugin auto install": "Figma 插件自动安装",
    "We’ll configure these agents for you, so they can use Figma MCP tools and skills. After installation, make a tool call to finish authentication.": "我们会为你配置这些智能体，使其可以使用 Figma MCP 工具和技能。安装后，请调用工具完成身份验证。",
    "New: Skills for the Figma agent": "新功能：Figma 智能体技能",
    "Use skills with the Figma agent to work even smarter. Browse Community-made ones, or share your own.": "通过 Figma 智能体使用技能，让工作更高效。浏览社区创作的技能，或分享你自己的技能。",
    "How to set up other agents": "如何设置其他智能体",
    "Get Figma integration": "获取 Figma 集成",
    "Add another agent": "添加另一个智能体",
    "Layer options": "图层选项",
    "Copy URL for selected layer": "复制所选图层的 URL",
    "Copy Layout, press shift to copy all code": "复制布局，按住 Shift 可复制全部代码",
    "Copy Style, press shift to copy all code": "复制样式，按住 Shift 可复制全部代码",
    "Copy SVG, press shift to copy all code": "复制 SVG，按住 Shift 可复制全部代码",
    "Export file type": "导出文件类型",
    "Download animations": "下载动画",
    "Download icons": "下载图标",
    "Download all icons": "下载全部图标",
    "Icon download settings...": "图标下载设置…",
    "Icon download settings…": "图标下载设置…",
    "Download all animations": "下载全部动画",
    "Animation download settings...": "动画下载设置…",
    "Animation download settings…": "动画下载设置…",
    "Icon settings": "图标设置",
    "Animation settings": "动画设置",
    "Keyframes": "关键帧",
    "Copy Keyframes, press shift to copy all code": "复制关键帧，按住 Shift 可复制全部代码",
    "Re-center": "重新居中",
    "Show in timeline view": "在时间轴视图中显示",
    "Frame with animation": "带动画的画框",
    "Open in timeline view": "在时间轴视图中打开",
    "Copied to clipboard. Now paste into your AI agent chat.": "已复制到剪贴板。现在粘贴到 AI 智能体对话中。",
    "Copy HStack, press shift to copy all code": "复制 HStack，按住 Shift 可复制全部代码",
    "Copy UIKit, press shift to copy all code": "复制 UIKit，按住 Shift 可复制全部代码",
    "Copy Modifier, press shift to copy all code": "复制 Modifier，按住 Shift 可复制全部代码",
    "Copy XML, press shift to copy all code": "复制 XML，按住 Shift 可复制全部代码",
    "Upload local fonts": "上传本地字体",
    "Individual strokes": "独立描边",
    "TrueType Collection files (.ttc) are not supported": "不支持 TrueType Collection（.ttc）文件",
    "Select items using this font": "选择使用此字体的项目",
    "By checking this box and uploading the font(s), I represent that I have all necessary rights to upload and authorize storage and use of the uploaded font(s) on the Figma platform.": "勾选此框并上传字体，即表示本人声明拥有上传该字体所需的一切必要权利，并授权 Figma 平台存储和使用所上传的字体。",
    "Successfully updated assets": "已成功更新资源",
    "Dictate": "听写",
    "Create component": "创建组件",
    "Create with agents": "使用智能体创建",
    "Open in Community": "在社区中打开",
    "Provide text and structure for assistive technologies in Figma Design, FigJam, Slides, and Buzz.": "为 Figma Design、FigJam、Slides 和 Buzz 中的辅助技术提供文本和结构。",
    "Uses your system settings": "使用系统设置",
    "Underline links in UI": "为界面中的链接添加下划线",
    "Distinguish links with an underline in panels and dialogs. Design content won’t change.": "在面板和对话框中使用下划线区分链接。设计内容不会改变。",
    "Simplify focus navigation in Actions menu": "简化“操作”菜单中的焦点导航",
    "Focus follows default tab stops.": "焦点按默认 Tab 键顺序移动。",
    "(Recommended for screen readers.)": "（建议屏幕阅读器用户启用。）",
    "Enhanced contrast mode": "增强对比度模式",
    "Contrast between text and controls and their backgrounds will be increased.": "提高文本、控件与其背景之间的对比度。",
    "Ignore Figma shortcuts in text fields": "在文本字段中忽略 Figma 快捷键",
    "Using special characters in text fields will not trigger Figma shortcuts.": "在文本字段中使用特殊字符不会触发 Figma 快捷键。",
    "Rotate layers with a keyboard shortcut": "使用键盘快捷键旋转图层",
    "⌘⌥↑ and ⌘⌥↓ will rotate layers instead of moving them forward and back.": "⌘⌥↑ 和 ⌘⌥↓ 将旋转图层，而不是将其前移或后移。",
    "Automatically follow a spotlight": "自动跟随演示",
    "When a collaborator spotlights themselves, you'll automatically follow them on your screen.": "当协作者开始演示时，您会在屏幕上自动跟随对方。",
    "Search for and insert components without losing your flow.": "无需中断工作流即可搜索并插入组件。",
    "Unlock scale aspect ratio": "解锁缩放宽高比",
    "Timeline zoom level": "时间轴缩放级别",
    "Variable font axes...": "可变字体轴…",
    "Variable font axes…": "可变字体轴…",
    "No truncation": "不截断文本",
    "Truncation enabled": "已启用文本截断",
    "Enabled": "已启用",
    "Style": "样式",
    "Position": "位置",
    "Review layout": "检查布局",
    "Nothing to update": "没有需要更新的内容",
    "Children set to fill will resize for padding and inside strokes": "设置为填充的子图层会根据内边距和内部描边调整大小",
    "Select an option": "选择一个选项",
    "Keyboard box selection activated": "键盘框选已启用",
    "Keyboard pick selection activated": "键盘点选已启用",
    "Recompute text layout in selection": "重新计算所选内容中的文本布局",
    "Update and publish selected component": "更新并发布所选组件",
    "Reset variable modes in selection": "重置所选内容中的变量模式",
    "Regenerate component props for selection": "为所选内容重新生成组件属性",
    "Clear all component props data from selection": "清除所选内容中的所有组件属性数据",
    "Prune invalid component prop refs for selection": "清理所选内容中无效的组件属性引用",
    "Select all text layers": "选择所有文本图层",
    "Left to right text direction": "从左到右的文本方向",
    "Right to left text direction": "从右到左的文本方向",
    "Update to support latest text layout": "更新以支持最新文本布局",
    "Update to support bidirectional text (RTL)": "更新以支持双向文本（RTL）",
    "Convert to text on path": "转换为路径文字"
  };
  for (const [source, target] of Object.entries(expected)) assert.equal(dictionary[source], target, source);
  for (const brand of ["Facebook", "Instagram", "LinkedIn", "TikTok", "X/Twitter", "YouTube"])
    assert.equal(dictionary[brand], undefined, `${brand} 品牌名应保持原文`);
});

test("iPhone 设备预设颜色使用 Apple 中国大陆官方名称", () => {
  const expected = {
    "Lavender": "薰衣草紫色",
    "Sage": "鼠尾草绿色",
    "Mist Blue": "青雾蓝色",
    "White": "白色",
    "Black": "黑色",
    "Silver": "银色",
    "Deep Blue": "深蓝色",
    "Cosmic Orange": "星宇橙色",
    "Sky Blue": "天蓝色",
    "Light Gold": "浅金色",
    "Cloud White": "云白色",
    "Space Black": "深空黑色",
    "Pink": "粉色",
    "Teal": "深青色",
    "Ultramarine": "群青色",
    "Black Titanium": "黑色钛金属",
    "White Titanium": "白色钛金属",
    "Desert Titanium": "沙漠色钛金属",
    "Natural Titanium": "原色钛金属",
    "Blue Titanium": "蓝色钛金属",
    "Blue": "蓝色",
    "Green": "绿色",
    "Yellow": "黄色",
    "Midnight": "午夜色",
    "Red": "红色",
    "Starlight": "星光色",
    "Purple": "紫色",
    "Deep Purple": "暗紫色",
    "Gold": "金色",
    "Graphite": "石墨色",
    "Sierra Blue": "远峰蓝色",
    "Space Grey": "深空灰色",
    "Midnight Green": "暗夜绿色",
    "Rose Gold": "玫瑰金色"
  };
  for (const [source, target] of Object.entries(expected)) assert.equal(dictionary[source], target, source);
  assert.match(runtime, /isIPhoneDeviceColorContext/);
  assert.match(runtime, /iphoneDeviceColorTranslations=\{black:'黑色',white:'白色'\}/);
  assert.match(runtime, /!iphoneDeviceColor&&!themeOption&&!directTooltip&&!textFormattingMenu&&isFontWeightContext/);
  assert.match(runtime, /isThemeOptionContext/);
  assert.match(runtime, /themeOptionTranslations=\{dark:'黑色',light:'浅色'\}/);
  assert.match(runtime, /isAccountThemeContext/);
  assert.match(runtime, /ambiguousThemeName&&!themeOption/);
  assert.match(runtime, /isLibraryModeNameContext/);
  assert.match(runtime, /if\(libraryModeName\|\|ambiguousThemeName&&!themeOption\)return undefined/);
  assert.match(runtime, /\^Step\\s\+\(\\d\+\)\\s\+of/);
  assert.match(runtime, /\^Auto\\s\*\\\(\(\.\+\)\\\)\$/);
  assert.match(runtime, /Rename\\s\+\(\\d\+\)\\s\+layers/);
  assert.match(runtime, /Rename\\s\+\(\\d\+\)\\s\+pages/);
  assert.match(runtime, /Delete\\s\+\(\\d\+\)\\s\+pages/);
  assert.match(runtime, /Reset\\s\+\["“\]/);
  assert.ok(runtime.includes("normalized.match(/^On this page,\\s*([\\d,]+)\\s+layers have been updated to the latest auto layout"));
  assert.ok(runtime.includes("normalized.match(/^There are\\s+([\\d,]+)\\s+layers that might shift with the new layout"));
  assert.match(runtime, /You\['’\]re about to move the file/);
  assert.match(runtime, /restore it later from the \(\?:Trash\|回收站\) section/);
  assert.match(runtime, /function isTrashDialogContext/);
  assert.match(runtime, /trashDialogCandidate/);
  assert.match(runtime, /function translateAttributes/);
  assert.match(runtime, /function translateTextNode/);
  assert.match(runtime, /你即将把文件/);
  assert.match(runtime, /Anyone with edit access on the project/);
  assert.match(runtime, /项目中任何拥有编辑权限的人都可以稍后从/);
  assert.match(runtime, /Move file to trash\|将文件移到回收站/);
  assert.match(runtime, /Trash section/);
  assert.match(runtime, /normalized\.match\(\/\^Move file\\s\+\(\.\+\)\$/i);
  assert.match(runtime, /中恢复该文件/);
  assert.ok(runtime.includes("normalized.match(/^Go to Frame\\s+(.+)"));
});

test("专业名词与代码内容的保护规则仍存在", () => {
  assert.equal(dictionary.RGB, undefined);
  assert.equal(dictionary.CSS, undefined);
  assert.equal(dictionary["border-box"], undefined);
  assert.equal(dictionary.Bold, undefined);
  assert.equal(dictionary.Standard, "标准");
  assert.match(runtime, /isCodeSyntaxContext/);
  assert.match(runtime, /isFontWeightContext/);
  assert.match(runtime, /fontWeightNames=new Set\(\[[^\]]*'standard'/);
  assert.match(runtime, /isBlendModeNormalContext/);
  assert.match(runtime, /isShaderQualityPopup/);
  assert.match(runtime, /"Play shaders":"播放着色器"/);
  assert.match(runtime, /"Stop shaders":"停止着色器"/);
  assert.match(runtime, /"Moving gradient":"流动渐变"/);
  assert.match(runtime, /"Color method":"着色方式"/);
  assert.match(runtime, /\(\?:auto\|自动\)/);
  const autoModePattern = /(?:auto|自动)\s*[\(（][^)）]+[\)）]/i;
  for (const label of ["Auto (Dark)", "自动（Dark）", "自动 (Light)"]) assert.match(label, autoModePattern);
  for (const userName of ["if", "else", "Not", "App", "to"]) assert.equal(dictionary[userName], undefined, userName);
  assert.doesNotMatch(runtime, /interactionConditionalTranslations|isInteractionConditionContext/);
  assert.match(runtime, /isExportQualityContext/);
  assert.match(runtime, /isLayoutGuideCountAutoContext/);
  assert.match(runtime, /grid_settings--stripesNumSections--/);
  assert.equal(dictionary.Auto, '自动');
  assert.match(runtime, /isTypographyLineHeightAutoInput/);
  assert.match(runtime, /\^\(\?:Line height\|行高\)\$/);
  assert.match(runtime, /type_panel--/);
  assert.match(runtime, /isComponentPropertyValueContext\(element\)&&!layoutGuideCountAuto/);
  assert.match(runtime, /if\(layoutGuideCountAuto\)translated='自动'/);
  assert.match(runtime, /translateControlledAutoValue/);
  assert.match(runtime, /controlledAutoInputs=new WeakSet/);
  assert.match(runtime, /controlledAutoOverlayAttribute='data-figma-cn-controlled-auto'/);
  assert.match(runtime, /ensureControlledAutoOverlayStyle/);
  assert.match(runtime, /showOverlay=element\.value==='Auto'\|\|element\.value==='自动'/);
  assert.match(runtime, /host\.toggleAttribute\(controlledAutoOverlayAttribute,showOverlay\)/);
  assert.match(runtime, /for\(const type of \['focus','click','input','change','blur'\]\)element\.addEventListener\(type,refresh\)/);
  assert.match(runtime, /queueMicrotask/);
  assert.match(runtime, /requestAnimationFrame\(\(\)=>requestAnimationFrame\(sync\)\)/);
  assert.doesNotMatch(runtime, /element\.value='自动'/);
  assert.doesNotMatch(runtime, /addEventListener\('(?:mouse|pointer)move'/);
  assert.doesNotMatch(runtime, /addEventListener\('pointerover'/);
  assert.doesNotMatch(runtime, /document\.addEventListener\((?:'|")click/);
  assert.ok(runtime.includes("normalized.match(/^by\\s+([^,.!?]{1,80})$/i)"));
  assert.doesNotMatch(runtime, /\^by\\s\+\(\.\+\)\$/);
  assert.match(runtime, /function shouldTranslateAttribute/);
  assert.match(runtime, /function localizeLanguageOption/);
  assert.match(runtime, /languageOptionTranslations\.has\(normalized\.toLocaleLowerCase/);
  assert.match(runtime, /if\(languageOption\)return leading\+languageOption\+trailing/);
  assert.match(runtime, /function localizeAutoLayoutSettingsOption/);
  assert.match(runtime, /\['between','等距'\]/);
  assert.match(runtime, /\['legacy','旧版'\]/);
  assert.match(runtime, /\['updated','新版'\]/);
  assert.match(runtime, /Auto layout settings\|自动布局设置/);
  assert.match(runtime, /isAutoLayoutSettingsDialog/);
  assert.match(runtime, /document\.querySelectorAll/);
  assert.match(runtime, /if\(autoLayoutSettingsOption\)return leading\+autoLayoutSettingsOption\+trailing/);
  assert.equal(dictionary.Updated, "更新时间");
  assert.match(runtime, /function isEditableTextContext/);
  assert.match(runtime, /if\(isEditableTextContext\(element\)&&attributeName!=='placeholder'&&attributeName!=='data-figspec-placeholder'&&!isFigspecPlaceholderContext\(element\)\)return undefined/);
  assert.match(runtime, /name!=='data-tooltip'\|\|element\?\.getAttribute\?\.\('data-tooltip-type'\)!=='lookup'/);
  assert.doesNotMatch(runtime, /value\.trim\(\)==='Style'&&translated\.trim\(\)==='样式'/);
  assert.match(runtime, /compactTooltipSourceLabels=new Set\(\['Create component','Visual search'\]\)/);
  assert.match(runtime, /compactMotionTooltipAttribute='data-figma-cn-compact-motion-tooltip'/);
  assert.match(runtime, /normalized!==\'动画测试\'/);
  assert.match(runtime, /style\.setProperty\('width',getComputedStyle\(tooltip\)\.width,'important'\)/);
  assert.match(runtime, /function compactTranslatedTooltip/);
  assert.match(runtime, /tooltip\.style\.width='max-content'/);
  assert.match(runtime, /tooltip\.style\.minWidth='0'/);
  assert.match(runtime, /oldLeft\+\(oldWidth-newWidth\)\/2/);
  assert.match(runtime, /text\.length<=220&&\(text\.includes\('quality'\)\|\|text\.includes\('质量'\)\)/);
  assert.match(runtime, /!shaderQuality&&!exportQuality/);
  assert.match(runtime, /\^Show\\s\+\(\\d\+\)\\s\+more lines/);
  assert.match(runtime, /\^Updating assets\\s\+\(\\d\+\)\\s\*/);
  assert.match(runtime, /\^Loading\\s\+\(\\d\+\)\\s\+pages\\s\+for\\s\+plugin/);
  assert.match(runtime, /\^Resized height to\\s\+\(\.\+\)\$/);
  assert.match(runtime, /\^Worked\\s\+for\\s\+\(\\d\+\)s\$/);
  assert.match(runtime, /Invite sent/);
  assert.match(runtime, /and\\s\+\(\\d\+\)\\s\+others/);
  assert.match(runtime, /\[’'\]s Folder/);
  assert.match(runtime, /This prompt uses\\s\+\(\\d\+\)\\s\+AI credits while in beta/);
  assert.match(runtime, /\^Sweep\\s\+/);
  assert.match(runtime, /\^Connection error:/);
  assert.match(runtime, /\^Error code:/);
  assert.match(runtime, /Error navigating to/);
  assert.match(runtime, /ERR_\[A-Z0-9_\]/);
  assert.match(runtime, /Your team is about to lose edit access to/);
  assert.match(runtime, /files\?\\s\+used/);
  assert.match(runtime, /daily credits\?\\s\+used/);
  assert.match(runtime, /files\?\\s\+total\\s\+across\\s\+Design\\s\+and\\s\+Sites/);
  assert.match(runtime, /files\?\\s\+to\\s\+try\\s\+out/);
  assert.match(runtime, /AI\\s\+credits\\\/month/);
  assert.match(runtime, /Once your Professional plan ends on/);
  assert.match(runtime, /When you cancel your Professional plan/);
  assert.match(runtime, /will become a free Starter team at the end of the current subscription period/);
  assert.match(runtime, /days\? until plan downgrade/);
  assert.match(runtime, /Reactivate your Professional plan before/);
  assert.ok(runtime.includes("normalized.match(/^Move\\s+([\\d,]+)\\s+Figma Design or Sites files?$/i)"));
  assert.ok(runtime.includes("normalized.match(/^Consolidate to\\s+([\\d,]+)\\s+folders?$/i)"));
  assert.match(runtime, /localizeShortDate\(match\[1\]\)/);
  assert.match(runtime, /\^\(\[\\d,\]\+\)\\s\+files\?/);
});

test("组件属性值保留用户手动命名", () => {
  assert.equal(dictionary.Disabled, "已禁用");
  assert.equal(dictionary.Default, "默认");
  assert.match(runtime, /"Thinking":"思考中"/);
  assert.match(runtime, /"Loading":"正在加载"/);
  assert.match(runtime, /componentPropertyControlSelector/);
  assert.match(runtime, /componentUserNameSelector/);
  assert.match(runtime, /componentPropertyValueSignatures/);
  assert.match(runtime, /componentPropertyValuePairSignatures/);
  assert.match(runtime, /\['default','默认'\],\['scrolled'\]/);
  assert.doesNotMatch(runtime, /data-testid\*="component-properties"/);
  assert.doesNotMatch(runtime, /__reactFiber\$/);
  assert.match(runtime, /isComponentPropertyValueContext/);
  assert.match(runtime, /const isComponentDetailText=componentDetailActionTranslations\.has\(normalized\.toLocaleLowerCase\('en-US'\)\)\|\|\/\^includes\\s\+\\d\+\\s\+variants\?\$\/i\.test\(normalized\)/);
  assert.doesNotMatch(runtime, /componentPanelSystem|invalidVariantName|This layer has an invalid name/);
  for (const userName of ["Hex", "Hexagon", "Hexagonal"]) assert.equal(dictionary[userName], undefined, userName);
  assert.doesNotMatch(runtime, /"Hexagon":"六边形","Lines"/);
  assert.match(runtime, /shaderOnlyMap=.*"Hex":"六边形","Hexagon":"六边形","Hexagonal":"六边形"/);
});

test("切换组件变体时，选中值与展开选项都保留原名", () => {
  const labelId = ":variant-label:";
  const menuId = ":variant-list:";
  const variantLabel = { matches: selector => selector === 'label[class*="prop_assignment_row--componentPropNameViewOnly--"]' };
  const combo = { getAttribute: name => ({ role: "combobox", "aria-labelledby": labelId })[name] };
  const menu = { getAttribute: name => ({ role: "listbox", id: menuId })[name] };
  const context = vm.createContext({
    document: {
      readyState: "loading", addEventListener() {}, querySelectorAll: () => [],
      getElementById: id => id === labelId ? variantLabel : null,
      querySelector: selector => selector === '[aria-controls=":variant-list:"],[aria-owns=":variant-list:"]' ? combo : null,
    },
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
  });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateTextForTest=translateTextNode;\nfunction start(){"), context);
  const childOf = control => ({
    nodeType: 1,
    closest: selector => selector === '[role="combobox"],[role="listbox"]' ? control : null,
  });
  for (const parentElement of [childOf(combo), childOf(menu)]) {
    for (const value of ["Zero", "One", "Default", "Disabled", "Mixed"]) {
      const node = { nodeType: 3, nodeValue: value, parentElement };
      context.translateTextForTest(node);
      assert.equal(node.nodeValue, value);
      assert.equal(context.lookupForTest(value, parentElement, "aria-label"), undefined);
    }
  }
  const unrelatedMenu = { getAttribute: name => ({ role: "listbox", id: ":ordinary-list:" })[name] };
  assert.equal(context.lookupForTest("Zero", childOf(unrelatedMenu)), "零值");
  assert.equal(context.lookupForTest("Current variant", childOf(null)), "当前变体");
});

test("原生标签页菜单使用固定与取消固定", () => {
  assert.equal(menuDictionary.Pin, "固定");
  assert.equal(menuDictionary.Unpin, "取消固定");
});

test("原生故障排除菜单及堆快照对话框使用中文", () => {
  assert.equal(menuDictionary["Save Heap Snapshot…"], "保存堆快照…");
  assert.equal(menuDictionary["Save Heap Snapshot"], "保存堆快照");
  assert.equal(menuDictionary["When you click OK, you'll be prompted to choose where to save a snapshot of the app's memory; the app may be unresponsive during this process. Note that the snapshot file contains sensitive information and should be treated carefully."],
    "点击“确定”后，您可以选择应用内存快照的保存位置。保存期间，应用可能暂时无响应。快照文件包含敏感信息，请妥善处理。");
});

test("邀请奖励弹窗和卡片完整翻译并保留名额与额度", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify(dictionary)+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {
    "Refer friends, get credits": "邀请好友，领取 AI 额度",
    "Invite friends to Figma": "邀请好友加入 Figma",
    "Up to 3,000 extra AI credits": "最多可获 3,000 点额外 AI 额度",
    "Invite up to 3 collaborators to Figma. You’ll get 1,000 AI credits for each friend that creates a new account, and they each get 500 credits to build with, too!": "最多可邀请 3 位协作者加入 Figma。每有一位好友注册新账户，您就能获得 1,000 点 AI 额度，对方也能获得 500 点额度用于创作。",
    "Invite up to 1 collaborator to Figma. You'll get 2,000 AI credits for each friend that creates a new account, and they each get 750 credits to build with, too!": "最多可邀请 1 位协作者加入 Figma。每有一位好友注册新账户，您就能获得 2,000 点 AI 额度，对方也能获得 750 点额度用于创作。",
    "Invite collaborators to Figma. You’ll get 900 AI credits for each friend that creates a new account, and they each get 500 credits to build with, too!": "邀请协作者加入 Figma。每有一位好友注册新账户，您就能获得 900 点 AI 额度，对方也能获得 500 点额度用于创作。",
    "Copy referral link": "复制邀请链接",
    "Couldn’t copy link. Try again.": "无法复制链接，请重试。",
    "Not interested? ": "不感兴趣？ ",
    "Don’t show this again.": "不再显示。",
    "Must be located in an eligible jurisdiction. Limits apply. ": "仅限符合条件的地区，且有相关限制。 ",
    "View terms": "查看条款",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
});

test("排版与组件设置的重叠提示统一翻译", () => {
  assert.equal(dictionary.Mixed, "多个值");
  assert.equal(dictionary["Everyone in it will be able to edit files and"], "项目中的所有人都可以编辑文件并");
  assert.equal(dictionary["use libraries."], "使用组件库。");
  assert.equal(dictionary["Insert instance"], "插入实例");
  assert.equal(dictionary["Includes 8 variants"], "包含 8 个变体");
  assert.equal(dictionary["Reset properties"], "重置属性");
  assert.equal(dictionary["Comment resolved"], "评论已解决");
  assert.equal(dictionary["Bulleted list"], "无序列表");
  assert.equal(dictionary["Numbered list"], "有序列表");
  assert.match(runtime, /directTooltipTranslations=\{'Bold':'加粗','Italic':'斜体','Strikethrough':'删除线','Header 1':'标题 1','Link':'链接','Code':'代码','Code block':'代码块','Standard':'标准'\}/);
  assert.match(runtime, /textFormattingMenuTranslations=\{bold:'加粗',italic:'斜体'\}/);
  assert.match(runtime, /function localizeTextFormattingMenu/);
  assert.match(runtime, /hasUnderline&&hasStrikethrough&&hasCreateLink\?translated:undefined/);
  assert.match(runtime, /!directTooltip&&!textFormattingMenu&&isFontWeightContext/);
  assert.match(runtime, /\^\(\\d\+\)\\s\+selected\$.*已选择 \$\{match\[1\]\} 个/);
  assert.match(runtime, /function localizeDirectTooltip/);
  assert.match(runtime, /translated\+normalized\.slice\(label\.length\)/);
  assert.match(runtime, /isComponentPropertyValueContext\(element\).*&&!directTooltip/);
  assert.match(runtime, /isCodeSyntaxContext\(element\).*&&!directTooltip/);
  assert.match(runtime, /!directTooltip&&!textFormattingMenu&&isFontWeightContext/);
  assert.doesNotMatch(runtime, /typographyPanelSelector|isTypographyPanelListTooltipContext|isVerticalTrimStandardContext/);
  assert.match(runtime, /normalized\.toLocaleLowerCase\('en-US'\)!=='mixed'\)return undefined/);
  assert.doesNotMatch(runtime, /function isMixedSelectionContext|function isMixedValueSectionContext/);
  assert.match(runtime, /function translateReadonlyMixedValue/);
  assert.match(runtime, /function translateMixedTextNode/);
  assert.match(runtime, /function isConnectedTeamContext/);
  assert.match(runtime, /function isFolderTransferContext/);
  assert.match(runtime, /folderTransferFragments/);
  assert.match(runtime, /You can transfer a copy of this folder to another team in a/);
  assert.match(runtime, /\['connected folder','已连接文件夹'\]/);
  assert.match(runtime, /function translateFolderTransferPlanElement/);
  assert.match(runtime, /Professional, Organization, or Enterprise plan\(\\\.\)\?/);
  assert.match(runtime, /element\.textContent=`专业版、组织版或企业版方案\$\{match\[1\]\|\|''\}`/);
  assert.doesNotMatch(runtime, /\['Professional, Organization, or Enterprise plan\.',/);
  assert.doesNotMatch(runtime, /\['plan\.',/);
  assert.match(runtime, /function translateConnectedTeamFragments/);
  assert.match(runtime, /Includes\\s\+\(\\d\+\)\\s\+variants\?/);
  assert.match(runtime, /componentDetailActionTranslations=new Set\(\['insert instance','reset properties'\]\)/);
  assert.match(runtime, /项目中的所有人都可以编辑文件并/);
  assert.match(runtime, /node\.nodeValue\.trim\(\)!=='Mixed'/);
  assert.match(runtime, /function isComponentUserNameContext/);
  assert.match(runtime, /element\.matches\?\.\(componentUserNameSelector\)/);
  assert.match(runtime, /function isComponentNameInputContext/);
  assert.match(runtime, /const componentNameValue=isComponentNameInputContext\(element\)/);
  assert.match(runtime, /element\.value!==['"]Mixed['"]/);
  assert.match(runtime, /element\.value='多个值'/);
  assert.match(runtime, /element\.isContentEditable\|\|element\.matches\?\.\('\[contenteditable=\"true\"\]'\)/);
  assert.match(runtime, /isComponentPropertyValueContext\(element\)/);
  assert.match(runtime, /element\.setAttribute\('value','多个值'\)/);
  assert.match(runtime, /value==='Mixed'&&!this\.isContentEditable&&!isComponentUserNameContext\(this\)\?'多个值':value/);
});

test("翻译加载器包含防重复和动态界面处理", () => {
  assert.match(runtime, /MutationObserver/);
  assert.doesNotMatch(runtime, /observedRoots|shadowRoot|attachShadow/);
  assert.doesNotMatch(injector, /framesInSubtree|collectFrameSubtree/);
  assert.doesNotMatch(loaderEntry, /getAllWebContents|reloadIgnoringCache|patchFigmaLocale/);
  assert.doesNotMatch(injector, /setTimeout|setInterval|requestAnimationFrame|requestIdleCallback/);
  assert.doesNotMatch(runtime, /panelTitleClass|panelTitleReady|revealPanelTitle|figma-zh-cn-panel-title-style/);
  assert.match(runtime, /if\(!\/\[A-Za-z0-9\]\//);
  assert.match(runtime, /collectMutationRoots/);
  assert.match(runtime, /roots\.has\(parent\)/);
  assert.match(runtime, /observer\.observe\(document\.body/);
  assert.match(runtime, /observer\.takeRecords\(\)/);
  assert.ok(
    runtime.indexOf("observer.observe(document.body") < runtime.indexOf("translateNode(document.body)"),
    "首次扫描前必须先监听，避免漏掉 React 初始化期间新增的节点",
  );
  assert.match(injector, /delete window\.__FigmaCNBaseMap/);
  assert.match(runtime, /normalize/);
  assert.match(runtime, /value\.trim\(\)===['"]Pen['"].*translated\.trim\(\)===['"]钢笔['"]/s);
  assert.match(runtime, /white-space['"],['"]nowrap/);
  assert.ok(Object.keys(dictionary).length >= 4479);
});

test("社区资源横幅中被链接拆开的文本片段完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.translateContextFragmentsForTest=translateContextFragments;\nfunction start(){"), context);
  const banner = { textContent: "Discover community-made 组件库, 插件, 图标集, and more", parentElement: null };
  const translate = value => {
    const node = { nodeType: 3, nodeValue: value, parentElement: banner };
    context.translateContextFragmentsForTest(node);
    return node.nodeValue;
  };
  assert.equal(translate("Discover community-made "), "发现社区制作的");
  assert.equal(translate(", "), "、");
  assert.equal(translate(","), "、");
  assert.equal(translate(", and more"), "等内容");
  assert.equal(translate("组件库"), "组件库");
  const unrelated = { nodeType: 3, nodeValue: ", ", parentElement: { textContent: "Frame 1, Frame 2", parentElement: null } };
  assert.equal(context.translateContextFragmentsForTest(unrelated), false);
  assert.equal(unrelated.nodeValue, ", ");
  assert.equal(dictionary["Discover community-made {librariesLink}, {pluginsLink}, {iconSetsLink}, and more"], "发现社区制作的{librariesLink}、{pluginsLink}、{iconSetsLink}等内容");
});

test("变量分组、变量名与集合名保留用户手动命名", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const element = ({ variableName = false, allRow = false } = {}) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [],
    matches: () => false, getAttribute: () => null,
    closest(selector) {
      if (selector === '[id="variable-group-all"]') return allRow ? this : null;
      return variableName && selector.includes("[data-group-row-text]") ? this : null;
    },
  });
  assert.equal(dictionary.Colors, "颜色");
  for (const name of ["Colors", "Spacing", "Primary", "Background"]) {
    assert.equal(context.lookupForTest(name, element({ variableName: true })), undefined, name);
  }
  assert.notEqual(context.lookupForTest("All", element({ variableName: true, allRow: true })), undefined);
  assert.equal(context.lookupForTest("Colors", element()), "颜色");
  assert.match(runtime, /\[data-group-row-text\]/);
  assert.match(runtime, /\[class\*="variables_modal_table_group_name--"\]/);
  assert.match(runtime, /\[class\*="variable_name--name--"\]/);
  assert.match(runtime, /if\(isVariableUserNameContext\(element\)\|\|isVariablePathSegmentNode\(node\)\|\|isStyleUserNameContext\(element\)\|\|isPageUserNameContext\(element,attributeName\)\)return undefined;/);
});

test("变量下拉选项中按 / 拆开的路径段保留用户命名", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const row = { nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, closest: () => null };
  const slash = { nodeType: 1, childElementCount: 0, textContent: "/" };
  const segment = (value, previousSibling, nextSibling) => ({ nodeType: 3, nodeValue: value, parentElement: row, previousSibling, nextSibling });
  assert.equal(context.lookupForTest("color", segment("color", slash, slash)), undefined);
  assert.equal(context.lookupForTest("component", segment("component", null, slash)), undefined);
  assert.equal(context.lookupForTest("disabled", segment("disabled", slash, null)), undefined);
  assert.equal(context.lookupForTest("color", segment("color", null, null)), "颜色");
  const notSlash = { nodeType: 1, childElementCount: 0, textContent: "·" };
  assert.equal(context.lookupForTest("color", segment("color", notSlash, null)), "颜色");
  assert.match(runtime, /\[data-tooltip-show-left\]\[data-tooltip-offset-x="-23"\]/);
});

test("新版变量表格保留整行分组路径，界面标签仍使用中文", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateTextForTest=translateTextNode;\nfunction start(){"), context);
  const groupRowSelector = '[data-testid="variables-modal-table"] [class*="variables_spreadsheet--fullWidthRow--"][data-index]';
  const groupRow = { nodeType: 1, tagName: "TR", className: "variables_spreadsheet--fullWidthRow--zaf0N" };
  const groupSegment = { nodeType: 1, tagName: "DIV", closest: selector => selector.split(",").includes(groupRowSelector) ? groupRow : null };
  const translate = (value, parentElement) => {
    const node = { nodeType: 3, nodeValue: value, parentElement };
    context.translateTextForTest(node);
    return node.nodeValue;
  };
  // Separators are added by CSS, so none of the path segments has a "/" sibling.
  for (const name of ["component", "toggle switch", "active", "inactive", "background", "icon", "username", "Fill", "Mixed"]) {
    assert.equal(translate(name, groupSegment), name);
    assert.equal(context.lookupForTest(name, groupSegment, "aria-label"), undefined);
  }
  for (const [label, expected] of Object.entries({ Name: "名称", Value: "值", "Create variable": "创建变量", Background: "背景" })) {
    assert.equal(translate(label, { nodeType: 1, closest: () => null }), expected);
  }
});

test("样式面板保留用户命名，变量右键菜单复数项完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const element = (styleRow) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null,
    closest: selector => styleRow && selector === "[data-renaming]" ? {} : null,
  });
  for (const name of ["Default", "Selected", "Disabled", "Button", "Shadow", "Page background"]) {
    assert.equal(context.lookupForTest(name, element(true)), undefined, name);
  }
  assert.equal(context.lookupForTest("Disabled", element(false)), "已禁用");
  assert.equal(dictionary["Edit variables"], "编辑变量");
  assert.equal(dictionary["Duplicate variables"], "复制变量");
  assert.equal(context.lookupForTest("Edit variables"), "编辑变量");
  assert.equal(context.lookupForTest("Duplicate variables"), "复制变量");
});

test("锁定团队横幅被拆开的句子完整翻译，且不影响其他位置的 All", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.translateLockedTeamBannerForTest=translateLockedTeamBanner;\nfunction start(){"), context);
  const banner = { textContent: "All of this team’s work is currently view-only. You can edit again when the team is unlocked. Learn more", parentElement: null };
  const translate = (value, parentElement = banner) => {
    const node = { nodeType: 3, nodeValue: value, parentElement };
    context.translateLockedTeamBannerForTest(node);
    return node.nodeValue;
  };
  assert.equal(translate("All"), "此团队的所有内容");
  assert.equal(translate(" of this team’s work is currently view-only. You can edit again when the team is unlocked. "), "目前仅可查看。团队解锁后即可恢复编辑。");
  assert.equal(translate(" of this team's work is currently view-only. You can use Dev Mode again when the team is unlocked. "), "目前仅可查看。团队解锁后即可重新使用开发模式。");
  const translatedBanner = { textContent: "此团队的所有内容目前仅可查看。团队解锁后即可恢复编辑。", parentElement: null };
  assert.equal(translate("All", translatedBanner), "此团队的所有内容");
  assert.equal(translate("All", { textContent: "All files", parentElement: null }), "All");
  assert.equal(dictionary["All of this team’s work is currently view-only. You can edit again when the team is unlocked."], "此团队的所有内容目前仅可查看。团队解锁后即可恢复编辑。");
  assert.equal(dictionary["All of this team’s work is currently view-only. You can use Dev Mode again when the team is unlocked. {learnMoreLink}"], "此团队的所有内容目前仅可查看。团队解锁后即可重新使用开发模式。{learnMoreLink}");
});

test("文本动画（交错）面板选项与提示完整翻译，且不改变全局含义", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const element = ({ flyout = false, menuText = null } = {}) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false,
    closest(selector) {
      if (selector === "[data-animation-preset-detail-flyout]") return flyout ? {} : null;
      if (selector === '[role="listbox"],[role="menu"]') return menuText === null ? null : { textContent: menuText };
      return null;
    },
  });
  const inFlyout = element({ flyout: true });
  for (const [source, target] of Object.entries({ In: "入场", Out: "退场", Word: "单词", Line: "行", Paragraph: "段落", Random: "随机", Each: "逐个", Overlap: "重叠", Character: "字符", "Center out": "从中心向外" })) {
    assert.equal(context.lookupForTest(source, inFlyout), target, source);
  }
  assert.equal(context.lookupForTest("Word", element({ menuText: "Character Word Line Paragraph" })), "单词");
  assert.equal(context.lookupForTest("Line", element({ menuText: "Character Word Line 段落" })), "行");
  assert.equal(context.lookupForTest("Random", element({ menuText: "从左到右 从右到左 Center out Random" })), "随机");
  assert.equal(context.lookupForTest("In", element({ menuText: "In 退场" })), "入场");
  assert.equal(context.lookupForTest("In", element({ menuText: "In Out Everywhere Files" })), undefined);
  assert.equal(context.lookupForTest("Line", element()), "直线");
  assert.equal(context.lookupForTest("Word", element()), undefined);
  assert.equal(context.lookupForTest("Position: Animation visibility", element()), "位置：动画可见性");
  assert.equal(context.lookupForTest("Opacity: Remove animation", element()), "不透明度：移除动画");
  assert.equal(dictionary["Character (ignore spaces)"], "字符（忽略空格）");
  assert.equal(dictionary["Text stagger settings"], "文本交错设置");
});

test("动画预设属性面板的方向值 In 译为入场", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const chain = (...texts) => {
    let parentElement = null;
    for (const textContent of texts.reverse()) parentElement = { nodeType: 1, textContent, parentElement, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, closest: () => null };
    return parentElement;
  };
  assert.equal(context.lookupForTest("In", chain("In", "In", "方向 In")), "入场");
  assert.equal(context.lookupForTest("In", chain("In", "Direction In", "Panel Direction In Each Word")), "入场");
  assert.equal(context.lookupForTest("In", chain("In", "方向 入场")), "入场");
  assert.equal(context.lookupForTest("In", chain("In", "Search In Files")), undefined);
  assert.equal(context.lookupForTest("Out", chain("Out", "方向 Out")), "退场");
});

test("动画选择器中的官方预设名、分组标题与速度标签按动效含义翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const element = (inPicker) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false,
    closest: selector => inPicker && selector === '[data-testid="animation-style-picker"]' ? {} : null,
    querySelectorAll: () => [],
  });
  const picker = element(true);
  const cases = {
    "Text enter": "文本入场", "Text exit": "文本退场", Enter: "入场", Exit: "退场", Loop: "循环",
    Fast: "快速", Medium: "中速", Slow: "慢速",
    Slide: "滑动", Sweep: "横扫", Focus: "聚焦", Typewriter: "打字机", "Glitch Rise": "故障升起",
    "Domino Glide": "多米诺滑行", "Random Rain": "随机雨落", "Snap zoom": "快速缩放", "Grand finale": "盛大谢幕",
    Typequake: "文字震动", Scritto: "书写", "Pulse train": "脉冲串", Moonwalk: "太空步", Launch: "发射", Splat: "飞溅",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source, picker), target, source);
  assert.equal(context.lookupForTest("Slide", element(false)), "幻灯片");
  assert.equal(context.lookupForTest("Medium", element(false)), "中");
  assert.equal(context.lookupForTest("Sweep", element(false)), "圆弧范围");
});

test("动画选择器的分类筛选菜单标题完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const inMenu = (menuText) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => selector === '[role="listbox"],[role="menu"]' ? { textContent: menuText } : null,
  });
  const menu = inMenu("全部 Text enter Text exit 基础 Enter 循环 Exit");
  for (const [source, target] of Object.entries({ "Text enter": "文本入场", "Text exit": "文本退场", Enter: "入场", Exit: "退场", Loop: "循环" })) {
    assert.equal(context.lookupForTest(source, menu), target, source);
  }
  assert.equal(context.lookupForTest("Exit", inMenu("文本入场 文本退场 基础 入场 循环 Exit")), "退场");
  assert.equal(context.lookupForTest("Slide", menu), "幻灯片");
  assert.notEqual(context.lookupForTest("Enter", inMenu("Copy Paste Enter")), "入场");
});

test("工具栏新增的规格文档工具及其引导文案完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {
    "Spec": "规格文档",
    "View here, edit there": "在此查看，到画布编辑",
    "Layers can only be viewed in specs, but you can drag them onto the canvas to edit anytime.": "图层在规格文档中只能查看，但你可以随时将其拖到画布上进行编辑。",
    "New Spec": "新建规格文档",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
});

test("规格文档编辑器占位提示与 AI 附件菜单完整翻译，且不翻译正文输入", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const editable = { nodeType: 1, textContent: "", isContentEditable: true, parentElement: null, matches: selector => selector.includes("contenteditable"), closest: () => null, getAttribute: () => null, querySelectorAll: () => [] };
  const make = ({ ariaHidden = false, nearImport = false, inImport = false } = {}) => ({
    nodeType: 1, textContent: "", parentElement: { nodeType: 1, textContent: "", parentElement: editable, isContentEditable: true, matches: () => false, closest: () => null, getAttribute: () => null, querySelector: selector => nearImport && selector === "[data-figspec-markdown-import]" ? {} : null, querySelectorAll: () => [] },
    isContentEditable: true, classList: [], matches: () => false, hasAttribute: () => false, querySelectorAll: () => [],
    getAttribute: name => name === "aria-hidden" && ariaHidden ? "true" : null,
    closest: selector => inImport && selector === "[data-figspec-markdown-import]" ? {} : null,
  });
  assert.equal(context.lookupForTest("Start typing, or import", make({ ariaHidden: true, nearImport: true })), "开始输入，或导入");
  assert.equal(context.lookupForTest("Markdown file", make({ inImport: true })), "Markdown 文件");
  assert.equal(context.lookupForTest("Untitled", editable, "data-figspec-placeholder"), "无标题");
  assert.equal(context.lookupForTest("Heading 2", editable, "data-figspec-placeholder"), "二级标题");
  assert.equal(context.lookupForTest("Untitled", make()), undefined, "正文中用户输入的文字不翻译");
  assert.equal(context.lookupForTest("Heading 2", make({ ariaHidden: true })), undefined);
  assert.equal(context.lookupForTest("Attach Figma files"), "附加 Figma 文件");
  assert.equal(context.lookupForTest("Connectors"), "连接器");
  assert.match(runtime, /'alt','data-figspec-placeholder'\]/);
});

test("代码图层的操作按钮和粘贴提示完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("Pasting as a code layer isn’t available to you yet"), "你暂时还无法以代码图层形式粘贴");
  assert.equal(context.lookupForTest("You can paste up to 10 code layers at a time. Copy fewer pages and try again."), "一次最多可粘贴 10 个代码图层。请减少复制的页面后重试。");
  for (const ellipsis of ["...", "…"]) {
    assert.equal(context.lookupForTest("Clone repository" + ellipsis), "克隆代码仓库…");
    assert.equal(context.lookupForTest("Upload folder" + ellipsis), "上传文件夹…");
  }
  assert.equal(context.lookupForTest("Build selection"), "用代码实现所选内容");
});

test("Stripe 付款地址框保留 United States，State 字段显示为州／地区", () => {
  const addressPath = "/v3/elements-inner-address-82ac715667da0d4bfc51f2cad5cb9ad1.html";
  const context = vm.createContext({
    document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] },
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
    location: new URL("https://js.stripe.com" + addressPath),
  });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateTextForTest=translateTextNode;\nfunction start(){"), context);
  const lookup = context.lookupForTest;
  const select = { nodeType: 1, tagName: "SELECT", value: "US" };
  const countryOption = { nodeType: 3, nodeValue: "United States", parentElement: { tagName: "OPTION", value: "US", parentElement: select } };
  const stateLabel = { nodeType: 3, nodeValue: "State", parentElement: { tagName: "LABEL" } };
  context.translateTextForTest(countryOption);
  context.translateTextForTest(stateLabel);
  assert.equal(countryOption.nodeValue, "United States");
  assert.equal(select.value, "US");
  assert.equal(stateLabel.nodeValue, "州／地区");
  assert.equal(lookup("Country or region", select, "aria-label"), "国家或地区");
  assert.equal(lookup("State", select, "aria-label"), "州／地区");
  assert.equal(lookup("Alabama"), undefined);
  context.location = new URL("https://js.stripe.com/v3/elements-inner-payment-9a1d.html");
  assert.equal(lookup("United States"), "美国");
  assert.equal(lookup("State"), "状态");
  context.location = new URL("https://www.figma.com" + addressPath);
  assert.equal(lookup("State", { nodeType: 3, parentElement: { textContent: "Update payment details Card number Billing address" } }), "州／地区");
  assert.equal(lookup("State"), "状态");
  assert.equal(lookup("United States"), "美国");
});

test("教育版结账页的方案标题与被链接拆开的续订同意条款完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translatePurchaseConsentForTest=translatePurchaseConsent;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("Cui。 - Education plan"), "Cui。 - 教育版");
  const consent = { textContent: 'By clicking "Complete Purchase," I agree to Figma\'s 服务条款, 续订与取消条款, including that my Figma subscription will automatically renew every month and my payment method will be automatically charged unless and until I cancel or modify my plan in my Admin settings, and I acknowledge Figma\'s 隐私政策.', parentElement: null };
  const translate = (value, parentElement = consent) => {
    const node = { nodeType: 3, nodeValue: value, parentElement };
    context.translatePurchaseConsentForTest(node);
    return node.nodeValue;
  };
  const pieces = [
    translate('By clicking "Complete Purchase," I agree to Figma\'s '), "服务条款", translate(", "), "续订与取消条款",
    translate(", including that my Figma subscription will automatically renew every month and my payment method will be automatically charged unless and until I cancel or modify my plan in my Admin settings, and I acknowledge Figma's "),
    "隐私政策", translate("."),
  ];
  const expected = dictionary['By clicking "Complete Purchase," I agree to Figma\'s {termsOfServicesLink}, {renewalAndCancellationLink}, including that my Figma subscription will automatically renew every month and my payment method will be automatically charged unless and until I cancel or modify my plan in my Admin settings, and I acknowledge Figma\'s {privacyLink}.']
    .replace("{termsOfServicesLink}", "服务条款").replace("{renewalAndCancellationLink}", "续订与取消条款").replace("{privacyLink}", "隐私政策");
  assert.equal(pieces.join(""), expected);
  assert.match(translate(", including that my Figma subscription will automatically renew every 12 months and my payment method will be automatically charged unless and until I cancel or modify my plan in my Admin settings, and I acknowledge Figma's "), /每 12 个月自动续订/);
  assert.equal(translate(", ", { textContent: "Frame 1, Frame 2", parentElement: null }), ", ");
  assert.equal(translate(".", { textContent: "Saved.", parentElement: null }), ".");
});

test("付款页保留三个条款链接并翻译月度和年度自动续订说明", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.translateTextForTest=translateTextNode;\nfunction start(){"), context);
  for (const [period, translatedPeriod] of [["month", "每月"], ["12 months", "每 12 个月"]]) {
    const renewal = ", including that my Figma subscription will automatically renew every " + period + " and my payment method will be automatically charged unless and until I cancel or modify my plan in my Admin settings.";
    const pieces = ["I agree to Figma's ", "Terms of Service", ", ", "Privacy Policy", ", and ", "续订与取消条款", renewal];
    const row = { get textContent() { return nodes.map(node => node.nodeValue).join(""); } };
    const nodes = pieces.map(value => ({ nodeType: 3, nodeValue: value, parentElement: row }));
    for (const index of [0, 2, 4, 6]) context.translateTextForTest(nodes[index]);
    for (const index of [1, 3, 5]) assert.equal(nodes[index].nodeValue, pieces[index]);
    for (const index of [1, 3, 5]) context.translateTextForTest(nodes[index]);
    const template = "I agree to Figma's {termsOfServicesLink}, {privacyLink}, and {renewalAndCancellationLink}" + renewal;
    assert.equal(row.textContent, dictionary[template].replace("{termsOfServicesLink}", "服务条款")
      .replace("{privacyLink}", "隐私政策").replace("{renewalAndCancellationLink}", "续订与取消条款"));
    assert.ok(row.textContent.includes(translatedPeriod + "自动续订"));
  }
});

test("结账页翻译席位推荐和链接两侧的计费说明", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.translateTextForTest=translateTextNode;\nfunction start(){"), context);
  const translate = pieces => pieces.map(value => {
    const node = { nodeType: 3, nodeValue: value };
    context.translateTextForTest(node);
    return node.nodeValue;
  }).join("");
  assert.equal(translate(["Seat types have been suggested based on previous Figma use. ", "Learn more about seats"]),
    "系统已根据您此前使用 Figma 的情况推荐席位类型。 了解有关席位的更多信息");
  assert.equal(translate([
    "Seats you add or upgrade mid-subscription period will default to monthly at the ",
    "monthly price",
    ", but can be changed to annual at any time. These seats will be added to your next invoice and prorated to align with your billing period. ",
    "Learn more",
  ]), "订阅期间新增或升级的席位，默认按 月度价格计费，但可随时改为按年计费。费用将按当前计费周期的剩余时间折算，并计入下一张账单。 了解更多");
});

test("付款表单翻译保存信息和手机号码，并保留 Link 的条款链接", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateTextForTest=translateTextNode;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("Save my information for faster checkout"), "保存我的信息，以便更快结账");
  assert.equal(context.lookupForTest("Mobile number"), "手机号码");
  for (const apostrophe of ["’", "'"]) {
    const prefix = "By selecting to save your info, you agree to create an account subject to Link" + apostrophe + "s ";
    const values = ["• ", prefix, "Terms", " and ", "Privacy Policy", "."];
    const notice = { get textContent() { return nodes.map(node => node.nodeValue).join(""); } };
    const nodes = values.map(value => ({ nodeType: 3, nodeValue: value, parentElement: notice }));
    for (const index of [1, 3, 5]) context.translateTextForTest(nodes[index]);
    assert.equal(nodes[2].nodeValue, "Terms");
    assert.equal(nodes[4].nodeValue, "Privacy Policy");
    for (const index of [2, 4]) context.translateTextForTest(nodes[index]);
    assert.equal(notice.textContent, "• 选择保存信息即表示您同意创建 Link 账户，并接受 Link 的条款和隐私政策。");
  }
  const period = { nodeType: 3, nodeValue: ".", parentElement: { textContent: "Saved." } };
  context.translateTextForTest(period);
  assert.equal(period.nodeValue, ".");
});

test("字体上传进度、上传结果与教育版席位额度说明完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {
    "Uploading 23 of 47 font files…": "正在上传字体文件（23/47）…",
    "Uploading 23 of 47 font files...": "正在上传字体文件（23/47）…",
    "Uploading 3/12 font files…": "正在上传字体文件（3/12）…",
    "Font upload complete with 22 errors": "字体上传完成，出现 22 个错误",
    "Font upload complete with 1 error": "字体上传完成，出现 1 个错误",
    "Your seat in the Cui。 Education plan comes with 3,000 credits a month. Your seat credits reset Nov 1.": "您在 Cui。 教育版中的席位每月包含 3,000 点额度。您的席位额度将于 11月1日 重置。",
    "Your seat in the Acme Education plan comes with 500 credits a month. Your seat credits reset at 9:00 AM.": "您在 Acme 教育版中的席位每月包含 500 点额度。您的席位额度将于 上午 9:00 重置。",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
  assert.equal(context.lookupForTest("Uploading Marketing assets"), "正在上传 Marketing assets", "文件夹上传模板保持原样");
});

test("删除对话确认框完整翻译，对话标题保持原样", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("Delete chat?"), "删除对话？");
  assert.equal(context.lookupForTest("Delete chat"), "删除对话");
  assert.equal(context.lookupForTest('Are you sure you want to delete "Design next user screen"? This can’t be undone.'), "确定要删除“Design next user screen”吗？此操作无法撤销。");
});

test("文件浏览器多选右键菜单的数量文案完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {
    "Duplicate 3 files": "复制 3 个文件",
    "Move 3 files": "移动 3 个文件",
    "Trash 3 files": "将 3 个文件移到回收站",
    "Remove 3 items from recent": "从最近使用中移除 3 项",
    "Move 2 folders": "移动 2 个文件夹",
    "Trash 2 folders": "将 2 个文件夹移到回收站",
    "Move 5 items": "移动 5 个项目",
    "Trash 5 items": "将 5 项移到回收站",
    "Restore 4 files": "恢复 4 个文件",
    "Restore 4 files to…": "将 4 个文件恢复到…",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
  assert.equal(context.lookupForTest("Move to trash"), "移到回收站");
  assert.equal(context.lookupForTest("Duplicate"), "创建副本");
});

test("移到回收站确认框的文件夹权限说明完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const dialog = { nodeType: 1, textContent: "将文件移到回收站 你即将把文件 配置器 移到回收站。 Anyone with edit access on the folder can restore it later from the 回收站 section.", parentElement: null, classList: [], matches: () => false, closest: () => null, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [] };
  const span = { ...dialog, textContent: "Anyone with edit access on the folder can restore it later from the", parentElement: dialog };
  const pieces = [
    context.lookupForTest("Anyone with edit access on the folder can restore it later from the ", { ...span }),
    "回收站",
    context.lookupForTest(" section.", { ...dialog, textContent: " section.", parentElement: dialog }),
  ];
  assert.equal(pieces[0].trim(), "文件夹中任何拥有编辑权限的人都可以稍后从");
  assert.equal(pieces[2].trim(), "中恢复该文件。");
  assert.equal(context.lookupForTest("Anyone with edit access on the project can restore it later from the", span), "项目中任何拥有编辑权限的人都可以稍后从");
});

test("草稿移入文件夹的席位提示与文件移动通知完整翻译，团队名与文件夹名保持原样", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {
    "Moving a draft to a folder will move you to a Full seat in Cui。.": "将草稿移至文件夹后，您将在 Cui。 中使用完整席位。",
    "Moving a draft to a project will move you to a Dev seat in Acme.": "将草稿移至项目后，您将在 Acme 中使用开发席位。",
    "File moved": "文件已移动",
    "3 files moved": "3 个文件已移动",
    "File moved to trash": "文件已移动到回收站",
    "3 files moved to trash": "3 个文件已移动到回收站",
    "Show in 奥迪": "在 奥迪 中显示",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
});

test("移动文件对话框的当前位置与编辑权限提示完整翻译，文件夹名保持原样", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateMoveEditAccessForTest=translateMoveEditAccess;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("Current location: "), "当前位置： ");
  const paragraph = { textContent: "To move this file, you need to be granted edit access to 颜慧健 的文件夹. 了解更多", parentElement: null };
  const translate = (value, parentElement = paragraph) => {
    const node = { nodeType: 3, nodeValue: value, parentElement };
    context.translateMoveEditAccessForTest(node);
    return node.nodeValue;
  };
  const sentence = translate("To move this file, you need to be granted edit access to ") + "颜慧健 的文件夹" + translate(".");
  assert.equal(sentence, "要移动此文件，您需要获得 颜慧健 的文件夹 的编辑权限。");
  const translatedParagraph = { textContent: "要移动此文件，您需要获得 颜慧健 的文件夹. 了解更多", parentElement: null };
  assert.equal(translate(".", translatedParagraph), " 的编辑权限。");
  assert.equal(translate(".", { textContent: "Saved.", parentElement: null }), ".");
});

test("分享面板的文件夹成员行与所有者角色翻译准确", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("People from 奥迪"), "来自 奥迪 的人员");
  assert.equal(context.lookupForTest("Owner"), "所有者");
  assert.equal(context.lookupForTest("owner"), "所有者");
  assert.equal(context.lookupForTest("Created by"), "创建者");
  assert.equal(context.lookupForTest("People invited to file"), "此文件的受邀人员");
});

test("社区分类标签与排序按钮选中后的文字完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const element = (inTags) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => inTags && selector === '[class*="category_links_container--"]' ? {} : null,
  });
  const tags = element(true);
  const cases = { Travel: "旅行", Event: "活动", Simple: "简约", "User profile": "用户资料", "Real estate": "房地产", Navbar: "导航栏", Chatbot: "聊天机器人", "Personal website": "个人网站", Marketplace: "交易市场", "E-learning": "在线学习", Login: "登录", Dashboards: "仪表板", Wedding: "婚礼", Blog: "博客" };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source, tags), target, source);
  assert.equal(context.lookupForTest("Travel", element(false)), "位移");
  assert.equal(context.lookupForTest("Event", element(false)), "事件");
  assert.equal(context.lookupForTest("Sort: Popular"), "排序：流行");
  assert.equal(context.lookupForTest("Sort: Recent"), "排序：最近");
  assert.equal(context.lookupForTest("Sort: Something new"), "排序：Something new");
});

test("模板分类标签行按内容识别，选中标签时仍能翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const base = { nodeType: 1, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [], closest: () => null };
  const row = { ...base, childElementCount: 28, parentElement: null, textContent: "婚礼 CMS 侧边栏 User profile 摄影 CRM 关于我们 Real estate 注册 Navbar Chatbot 事件 Personal website 商业 室内设计 SaaS 简单 落地页 餐厅 作品集 电子商务 时尚 博客 位移 菜单 Marketplace E-learning Login Dashboards" };
  const chip = (text) => ({ ...base, childElementCount: 0, textContent: text, parentElement: { ...base, childElementCount: 1, textContent: text, parentElement: row } });
  for (const [source, target] of Object.entries({ Travel: "旅行", Event: "活动", Simple: "简约", "User profile": "用户资料", Navbar: "导航栏", Dashboards: "仪表板", Login: "登录" })) {
    assert.equal(context.lookupForTest(source, chip(source)), target, source);
  }
  const toolbar = { ...base, childElementCount: 8, parentElement: null, textContent: "Move Frame Rectangle Pen Text Comment Travel Event" };
  const toolChip = { ...base, childElementCount: 0, textContent: "Travel", parentElement: toolbar };
  assert.equal(context.lookupForTest("Travel", toolChip), "位移");
});

test("文件夹权限面板的标题与继承权限说明完整翻译，文件夹名保持原样", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateSplitForTest=translateMoveEditAccess;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("Permissions from folder 奥迪"), "来自文件夹 奥迪 的权限");
  assert.equal(context.lookupForTest("Permissions from team Cui。"), "来自团队 Cui。 的权限");
  const translate = (value, textContent) => {
    const node = { nodeType: 3, nodeValue: value, parentElement: { textContent, parentElement: null } };
    context.translateSplitForTest(node);
    return node.nodeValue;
  };
  const body = "People can access this file because they have access to 奥迪. 了解更多关于文件夹权限的信息。";
  assert.equal(translate("People can access this file because they have access to ", body) + "奥迪" + translate(".", body), "人员可以访问此文件，因为他们拥有 奥迪 的访问权限。");
  assert.equal(translate("Permissions from folder ", "Permissions from folder 奥迪") + "奥迪", "文件夹权限：奥迪");
  const moveBody = "To move this file, you need to be granted edit access to 颜慧健 的文件夹. 了解更多";
  assert.equal(translate(".", moveBody), " 的编辑权限。");
  assert.equal(translate(".", "Saved."), ".");
});

test("访问请求横幅中被加粗姓名拆开的句子完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateRoleRequestForTest=translateRoleRequestBanner;\nfunction start(){"), context);
  const translate = (value, textContent) => {
    const node = { nodeType: 3, nodeValue: value, parentElement: { textContent, parentElement: null } };
    context.translateRoleRequestForTest(node);
    return node.nodeValue;
  };
  const banner = "Chenming Wang 和 1 other person are asking to view";
  assert.equal("Chenming Wang" + " 和 " + translate("1 other person", banner) + translate(" are asking to view", banner), "Chenming Wang 和 另外 1 人 请求查看");
  assert.equal(translate("3 others", "Ann and 3 others are asking to edit"), "另外 3 人");
  assert.equal(translate(" are asking to edit", "Ann and 3 others are asking to edit"), " 请求编辑");
  assert.equal(translate("3 others", "Shared with you and 3 others"), "3 others");
});

test("页面列表中的页面名与分隔标题保留用户命名", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const element = (pageName) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => pageName && selector.includes("renameableNodeText--") && selector.includes("pageDividerTitle") ? {} : null,
  });
  for (const name of ["motion", "Motion", "Cover", "Components", "Icons", "Archive"]) {
    assert.equal(context.lookupForTest(name, element(true)), undefined, name);
  }
  assert.equal(context.lookupForTest("Ready for dev", element(true), "data-tooltip") !== undefined, true, "提示文字仍可翻译");
  assert.equal(context.lookupForTest("Motion", element(false)), "动画");
});

test("图层面板中的图层名（含默认名称）保留原文", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const element = (layerRow) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => layerRow && selector.includes('[class*="object_row--rowText--"]') ? {} : null,
  });
  for (const name of ["motion", "Frame 2", "Frame 16109", "Rectangle 3", "Group 1", "Text", "Button"]) {
    assert.equal(context.lookupForTest(name, element(true)), undefined, name);
  }
  assert.equal(context.lookupForTest("Frame 2", element(false)), undefined, "默认图层名在任何位置都保留原文");
  assert.equal(context.lookupForTest("Rectangle 3", element(false)), undefined);
  assert.equal(context.lookupForTest("Motion", element(false)), "动画");
});

test("新版图层面板行（layers-panel-row）中的图层名保留原文", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const row = { nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => selector.includes('[data-testid$="-layers-panel-row"]') ? {} : null };
  for (const name of ["motion", "Frame 2", "Group 1", "Button", "Cover"]) assert.equal(context.lookupForTest(name, row), undefined, name);
  assert.match(runtime, /\[data-testid\$="-layers-panel-row"\]/);
  assert.doesNotMatch(runtime, /generatedLayerMap/);
});

test("字体样式下拉框选中后的字重名称保持原文", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const base = { nodeType: 1, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [], closest: () => null };
  const trigger = (label, value) => {
    const button = { ...base, textContent: `${label}${value}`, parentElement: { ...base, textContent: `Audi Type ${label}${value} 16`, parentElement: null } };
    return { ...base, textContent: value, parentElement: button };
  };
  for (const weight of ["Normal", "Bold", "Medium", "Regular", "Light"]) {
    assert.equal(context.lookupForTest(weight, trigger("Font style", weight)), undefined, weight);
    assert.equal(context.lookupForTest(weight, trigger("字体样式", weight)), undefined, weight);
  }
  assert.equal(context.lookupForTest("Normal", { ...base, textContent: "Normal", parentElement: null }), "正常", "其他位置的 Normal 照常翻译");
});

test("字体样式下拉框通过关联标签识别，优先于混合模式等规则", () => {
  const labelEl = { textContent: "字体样式" };
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [], getElementById: id => id === "lbl-1" ? labelEl : null }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const base = { nodeType: 1, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [] };
  const make = (button) => ({ ...base, textContent: "Normal", parentElement: { ...base, textContent: "Normal", parentElement: null }, closest: sel => sel === 'button,[role="combobox"]' ? button : (sel.includes("blend mode") ? {} : null) });
  const viaLabels = { ...base, labels: [{ textContent: "Font style" }] };
  const viaAria = { ...base, labels: [], getAttribute: name => name === "aria-labelledby" ? "lbl-1" : null };
  assert.equal(context.lookupForTest("Normal", make(viaLabels)), undefined, "button.labels 关联");
  assert.equal(context.lookupForTest("Bold", make(viaAria)), undefined, "aria-labelledby 关联");
  const blendButton = { ...base, labels: [{ textContent: "Blend mode" }] };
  assert.equal(context.lookupForTest("Normal", make(blendButton)), "正常", "混合模式中的 Normal 仍翻译");
});

test("创建团队页的方案说明与被链接拆开的同意条款完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateSplitForTest=translateMoveEditAccess;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("This team won't be a part of your existing plans."), "此团队不会包含在您现有的方案中。");
  const consent = 'By clicking "Create team", you agree to the Figma 服务条款 and acknowledge the 隐私政策.';
  const translate = (value) => {
    const node = { nodeType: 3, nodeValue: value, parentElement: { textContent: consent, parentElement: null } };
    context.translateSplitForTest(node);
    return node.nodeValue;
  };
  const sentence = translate('By clicking "Create team", you agree to the ') + "Figma 服务条款" + translate(" and acknowledge the ") + "隐私政策" + translate(".");
  assert.equal(sentence, "点击“创建团队”即表示您同意Figma 服务条款并确认隐私政策。");
});

test("账户切换菜单与方案徽标翻译准确一致", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {
    "Switch plan": "切换方案", "New plan": "新建方案", "Edu": "教育版", "Pro": "专业版", "Professional": "专业版",
    "Switch account": "切换账号", "Current account": "当前账号", "Log out": "退出登录",
    "Plan: Cui。": "方案：Cui。",
    "Change plan. Cui。 currently on Free plan": "更改方案。Cui。 当前使用免费版",
    "Change plan. Cui。 is currently on the Professional plan": "更改方案。Cui。 当前使用专业版",
    "Change plan. Cui。 is currently locked": "更改方案。Cui。 当前已锁定",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
});

test("文件筛选中的全部方案不被组织名模板误匹配", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("All plans"), "全部方案");
  assert.equal(context.lookupForTest("All Acme"), "全部 Acme", "组织名模板保持原样");
});

test("iPhone 18 Pro 与 iPhone Duo 新机型颜色完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  for (const [source, target] of Object.entries({ Burgundy: "酒红色", Glacier: "冰川蓝色", Silver: "银色", "Night Sky": "夜空色", "Star White": "星辰白色" })) {
    assert.equal(context.lookupForTest(source), target, source);
  }
  const base = { nodeType: 1, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [], closest: () => null };
  const menu = { ...base, textContent: "Black Burgundy Glacier Silver", parentElement: null };
  assert.equal(context.lookupForTest("Black", { ...base, textContent: "Black", parentElement: menu }), "黑色");
  assert.match(runtime, /\['burgundy','酒红色'\],\['glacier','冰川蓝色'\]/);
});

test("打开 Motion 时间轴按钮不被文件夹名模板误匹配，Motion 保持英文", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  assert.equal(context.lookupForTest("Open Motion timeline"), "打开 Motion 时间轴");
  assert.equal(context.lookupForTest("Open timeline"), "打开时间轴");
  assert.equal(context.lookupForTest("Open Marketing"), "打开 Marketing", "文件夹名模板保持原样");
});

test("动画自定义标签页的分类筛选菜单（无文本分类）完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const inMenu = (menuText) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => selector === '[role="listbox"],[role="menu"]' ? { textContent: menuText } : null,
  });
  const menu = inMenu("全部 基础 Enter 循环 Exit");
  assert.equal(context.lookupForTest("Enter", menu), "入场");
  assert.equal(context.lookupForTest("Exit", menu), "退场");
  assert.equal(context.lookupForTest("Exit", inMenu("全部 基础 入场 循环 Exit")), "退场");
  assert.equal(context.lookupForTest("Basic", menu), "基础");
  assert.notEqual(context.lookupForTest("Enter", inMenu("Copy Paste Enter")), "入场");
  assert.notEqual(context.lookupForTest("Exit", inMenu("File Edit Exit")), "退场");
});

test("动画分类菜单逐项插入时 Enter 仍能翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const inMenu = (menuText) => ({
    nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => selector === '[role="listbox"],[role="menu"]' ? { textContent: menuText } : null,
  });
  assert.equal(context.lookupForTest("Enter", inMenu("全部 基础 Enter")), "入场", "后续选项尚未插入时");
  assert.equal(context.lookupForTest("Enter", inMenu("全部 Basic Enter")), "入场");
  assert.notEqual(context.lookupForTest("Enter", inMenu("Copy Paste Enter")), "入场");
});

test("动画选择器中 Spin 与基础动画 Rotation 译名不重复", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const picker = { nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => selector === '[data-testid="animation-style-picker"]' ? {} : null };
  assert.equal(context.lookupForTest("Spin", picker), "自转");
  assert.equal(context.lookupForTest("Rotation", picker), "旋转");
  assert.notEqual(context.lookupForTest("Spin", picker), context.lookupForTest("Rotation", picker));
});

test("动画选择器中 Pop、Recede、Slam 按动效含义翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const picker = { nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => selector === '[data-testid="animation-style-picker"]' ? {} : null };
  assert.equal(context.lookupForTest("Pop", picker), "跳动");
  assert.equal(context.lookupForTest("Recede", picker), "远去");
  assert.equal(context.lookupForTest("Slam", picker), "猛落");
});

test("着色器面板新增预设名称完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  for (const [source, target] of Object.entries({ "CRT screen": "CRT 屏幕", "Moving blobs": "流动色块", "Shape-based particles": "基于形状的粒子", "Color adjust": "色彩调整", "Pixel stretch": "像素拉伸", "Gooey merge": "黏液融合", "Duotone filter": "双色调滤镜", "Light rays": "光束", "Glowing particles": "发光粒子" })) {
    assert.equal(context.lookupForTest(source), target, source);
  }
});

test("着色器参数面板（发光粒子、双色调、切片移位、变形、CRT 屏幕）完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = { "Particle size": "粒子大小", "Glow color": "发光颜色", "Size variation": "大小变化", "Scatter radius": "散布半径", "Midpoint": "中点", "Mix": "混合", "Random offset": "随机偏移", "Warp type": "变形类型", "Mask size": "蒙版大小", "Curvature": "曲率", "Clip to curve": "按曲面裁剪", "Scanlines": "扫描线", "Scanline size": "扫描线大小", "Dispersion type": "色散类型", "Flicker": "闪烁", "Static size": "噪点大小", "Roll speed": "滚动速度", "Aperture grille": "栅状荫罩" };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
  const shader = { nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => selector.includes("custom-paint-prop-editor") ? {} : null };
  assert.equal(context.lookupForTest("Static", shader), "雪花噪点");
  assert.equal(context.lookupForTest("Static"), "静态", "着色器以外仍为静态");
});

test("着色器形状下拉菜单中的六边形在弹出菜单里也能翻译，Hex 颜色值不受影响", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const inMenu = (menuText) => ({ nodeType: 1, textContent: "", parentElement: null, classList: [], matches: () => false, getAttribute: () => null, hasAttribute: () => false, querySelectorAll: () => [],
    closest: selector => selector === '[role="listbox"],[role="menu"]' ? { textContent: menuText } : null });
  assert.equal(context.lookupForTest("Hexagon", inMenu("矩形 椭圆 Hexagon 三角形")), "六边形");
  assert.equal(context.lookupForTest("Hexagon", inMenu("Rectangle Ellipse Hexagon")), "六边形");
  assert.equal(context.lookupForTest("Hexagon"), undefined, "组件属性等用户命名不翻译");
  assert.equal(context.lookupForTest("Hexagon", inMenu("Square Hexagon Star")), undefined, "其他菜单不翻译");
});

test("3D 变换与透视新功能文案完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;\nfunction start(){"), context);
  const cases = {
    "Origin point": "原点", "X rotation": "X 轴旋转", "Y rotation": "Y 轴旋转", "Z rotation": "Z 轴旋转", "Depth": "深度",
    "Transform effects": "变换效果", "Perspective": "透视", "3D transform": "3D 变换", "3D space": "3D 空间",
    "Keep nested layers 3D": "让嵌套图层保持 3D", "Fix perspective": "修复透视", "Backface": "背面可见",
    "Fixed perspective on 1 layer": "已修复 1 个图层的透视", "Fixed perspective on 12 layers": "已修复 12 个图层的透视",
  };
  for (const [source, target] of Object.entries(cases)) assert.equal(context.lookupForTest(source), target, source);
});

test("团队锁定卡片中被链接拆开的解锁说明与新增文案完整翻译", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.lookupForTest=lookup;globalThis.translateSplitForTest=translateMoveEditAccess;\nfunction start(){"), context);
  const card = "Your team is over Starter plan limits. To unlock, 重新验证您的教育资格, 升级到专业版套餐, or move some work.";
  const translate = (value) => {
    const node = { nodeType: 3, nodeValue: value, parentElement: { textContent: card, parentElement: null } };
    context.translateSplitForTest(node);
    return node.nodeValue;
  };
  const sentence = translate("Your team is over Starter plan limits. To unlock, ") + "重新验证您的教育资格" + translate(", ") + "升级到专业版套餐" + translate(", or move some work.");
  assert.equal(sentence, "您的团队已超出入门版套餐限制。要解锁，请重新验证您的教育资格、升级到专业版套餐，或移动部分内容。");
  assert.equal(context.lookupForTest("Verify your education status"), "验证您的教育资格");
  assert.equal(context.lookupForTest("Move 3 Figma Specs files"), "移动 3 个 Figma Specs 文件");
  assert.equal(context.lookupForTest("Move 1 Figma Specs file"), "移动 1 个 Figma Specs 文件");
});

test("共享受限提示中被邮箱链接拆开的句子完整翻译，邮箱保持原样", () => {
  const context = vm.createContext({ document: { readyState: "loading", addEventListener() {}, querySelectorAll: () => [] }, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 } });
  vm.runInContext(runtime.replace("const map={};", "const map="+JSON.stringify({...dictionary, ...menuDictionary})+";").replace("function start(){", "globalThis.translateSplitForTest=translateMoveEditAccess;\nfunction start(){"), context);
  const translate = (value, textContent) => {
    const node = { nodeType: 3, nodeValue: value, parentElement: { textContent, parentElement: null } };
    context.translateSplitForTest(node);
    return node.nodeValue;
  };
  const email = "support+restricted@figma.com";
  const file = `Figma has restricted you from sharing this file. Please email ${email} for help.`;
  assert.equal(translate("Figma has restricted you from sharing this file. Please email ", file) + email + translate(" for help.", file), `Figma 已限制您共享此文件。如需帮助，请发送邮件至 ${email}。`);
  const team = `Figma has restricted you from sending invites for this team. Please email ${email} for help.`;
  assert.equal(translate("Figma has restricted you from sending invites for this team. Please email ", team), "Figma 已限制您为此团队发送邀请。如需帮助，请发送邮件至 ");
  assert.equal(translate(" for help.", "Contact us for help."), " for help.");
});
