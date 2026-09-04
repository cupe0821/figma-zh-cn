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
    "Add starting point": "添加起始点",
    "Edit objects": "编辑对象",
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
  assert.match(runtime, /function isEditableTextContext/);
  assert.match(runtime, /if\(isEditableTextContext\(element\)\)return undefined/);
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
  assert.match(runtime, /\^See all\\s\+\(\\d\+\)\\s\+colors/);
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
  assert.match(runtime, /function isPaymentDetailsContext/);
  assert.match(runtime, /isPaymentDetailsContext\(element\)\)translated='州'/);
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

test("原生标签页菜单使用固定与取消固定", () => {
  assert.equal(menuDictionary.Pin, "固定");
  assert.equal(menuDictionary.Unpin, "取消固定");
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
