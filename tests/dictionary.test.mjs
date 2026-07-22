import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dictionary = JSON.parse(fs.readFileSync(path.join(root, "src/translation-loader/js/lang.cn.json"), "utf8"));
const menuDictionary = JSON.parse(fs.readFileSync(path.join(root, "src/translation-loader/js/lang.cn.menu.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "src/translation-loader/js/figmaCN.js"), "utf8");
const injector = fs.readFileSync(path.join(root, "src/translation-loader/lib/injectJsToWebContents.js"), "utf8");
const loaderEntry = fs.readFileSync(path.join(root, "src/translation-loader/index.js"), "utf8");

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
    "Loading comments...": "正在加载评论…",
    "Loading comments…": "正在加载评论…",
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
    "Position": "位置"
  };
  for (const [source, target] of Object.entries(expected)) assert.equal(dictionary[source], target, source);
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
  assert.match(runtime, /"Cosmic Orange":"星宇橙色"/);
  assert.match(runtime, /isIPhoneDeviceColorContext/);
  assert.match(runtime, /iphoneDeviceColorTranslations=\{black:'黑色',white:'白色'\}/);
  assert.match(runtime, /!iphoneDeviceColor&&!themeOption&&!directTooltip&&isFontWeightContext/);
  assert.match(runtime, /isThemeOptionContext/);
  assert.match(runtime, /themeOptionTranslations=\{dark:'黑色',light:'浅色'\}/);
  assert.match(runtime, /isAccountThemeContext/);
  assert.match(runtime, /ambiguousThemeName&&!themeOption/);
  assert.match(runtime, /isLibraryModeNameContext/);
  assert.match(runtime, /if\(libraryModeName\|\|ambiguousThemeName&&!themeOption\)return undefined/);
  assert.match(runtime, /\^Step\\s\+\(\\d\+\)\\s\+of/);
  assert.match(runtime, /\^Auto\\s\*\\\(\(\.\+\)\\\)\$/);
  assert.match(runtime, /Rename\\s\+\(\\d\+\)\\s\+layers/);
  assert.match(runtime, /Reset\\s\+\["“\]/);
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
  assert.match(runtime, /name!=='data-tooltip'\|\|element\?\.getAttribute\?\.\('data-tooltip-type'\)!=='lookup'/);
  assert.doesNotMatch(runtime, /value\.trim\(\)==='Style'&&translated\.trim\(\)==='样式'/);
  assert.match(runtime, /value\.trim\(\)==='Create component'&&translated\.trim\(\)==='创建组件'/);
  assert.match(runtime, /tooltip\.style\.width='max-content'/);
  assert.match(runtime, /oldLeft\+\(oldWidth-newWidth\)\/2/);
  assert.match(runtime, /text\.length<=220&&\(text\.includes\('quality'\)\|\|text\.includes\('质量'\)\)/);
  assert.match(runtime, /!shaderQuality&&!exportQuality/);
  assert.match(runtime, /\^See all\\s\+\(\\d\+\)\\s\+colors/);
  assert.match(runtime, /\^Show\\s\+\(\\d\+\)\\s\+more lines/);
  assert.match(runtime, /\^Updating assets\\s\+\(\\d\+\)\\s\*/);
  assert.match(runtime, /\^Sweep\\s\+/);
  assert.match(runtime, /\^Connection error:/);
  assert.match(runtime, /\^Error code:/);
  assert.match(runtime, /Error navigating to/);
  assert.match(runtime, /ERR_\[A-Z0-9_\]/);
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
  assert.match(runtime, /if\(isComponentPropertyValueContext\(element\)&&!layoutGuideCountAuto&&!directTooltip\)return undefined/);
  assert.doesNotMatch(runtime, /componentPanelSystem|invalidVariantName|This layer has an invalid name/);
  for (const userName of ["Hex", "Hexagon", "Hexagonal"]) assert.equal(dictionary[userName], undefined, userName);
  assert.doesNotMatch(runtime, /"Hexagon":"六边形","Lines"/);
  assert.match(runtime, /shaderOnlyMap=.*"Hex":"六边形","Hexagon":"六边形","Hexagonal":"六边形"/);
});

test("原生标签页菜单使用固定与取消固定", () => {
  assert.equal(menuDictionary.Pin, "固定");
  assert.equal(menuDictionary.Unpin, "取消固定");
});

test("排版与组件设置的重叠提示统一翻译", () => {
  assert.equal(dictionary["Bulleted list"], "无序列表");
  assert.equal(dictionary["Numbered list"], "有序列表");
  assert.match(runtime, /directTooltipTranslations=\{'Bold':'加粗','Italic':'斜体','Strikethrough':'删除线','Header 1':'标题 1','Link':'链接','Code':'代码','Code block':'代码块','Standard':'标准'\}/);
  assert.match(runtime, /function localizeDirectTooltip/);
  assert.match(runtime, /translated\+normalized\.slice\(label\.length\)/);
  assert.match(runtime, /isComponentPropertyValueContext\(element\).*&&!directTooltip/);
  assert.match(runtime, /isCodeSyntaxContext\(element\).*&&!directTooltip/);
  assert.match(runtime, /!directTooltip&&isFontWeightContext/);
  assert.doesNotMatch(runtime, /typographyPanelSelector|isTypographyPanelListTooltipContext|isVerticalTrimStandardContext/);
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
