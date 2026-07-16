# Figma 简体中文

这是一个面向 Figma 桌面版的非官方简体中文翻译与本地维护项目。当前基线为 **Figma 126.6.14 / 中文包 126.6.14-cn.2**，包含 4461 条累计词典、着色器与 AI 界面动态翻译、原生菜单翻译和防闪烁运行时。

> 本仓库不包含 Figma 安装包或应用二进制。请始终从 [Figma 官方渠道](https://www.figma.com/downloads/) 下载桌面应用。本项目只在你的电脑上为官方安装版本加入独立中文加载器。

## 支持状态

| 平台 | 发布包 | 当前状态 |
| --- | --- | --- |
| macOS Intel | `macos-x64` | 已在 126.6.14 实机验证 |
| macOS Apple Silicon | `macos-arm64` | 同源构建，待对应设备验收 |
| Windows x64 | `windows-x64` | 同源构建，待对应设备验收 |
| Windows ARM64 | `windows-arm64` | 同源构建，待对应设备验收 |

每个平台的 Release 包都自带对应架构的 Node 运行时，不要求另外安装开发环境。没有经过实机验收的平台会明确标注为预览版，不会冒充已验证版本。

## 安装

### macOS

1. 从 Figma 官网安装并至少启动一次官方桌面版。
2. 从 GitHub Releases 下载与你芯片一致的压缩包并解压。
3. 退出 Figma，双击 `scripts/install-macos.command`。
4. 安装器会备份原始 `app.asar`、写入中文加载器、重新签名并启动 Figma。

如果系统阻止首次执行，可在终端进入解压目录后运行：

```bash
bash scripts/install-macos.command
```

### Windows

1. 从 Figma 官网安装官方桌面版并退出 Figma。
2. 下载与你系统架构一致的 Release 包并解压。
3. 右键 `scripts/install-windows.ps1`，选择“使用 PowerShell 运行”。

必要时可在 PowerShell 中执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1
```

## 卸载与回滚

安装前的原始文件保存在用户目录的 `.figma-zh-cn/backups`。运行对应平台的 `uninstall-*` 脚本即可恢复最近一次匹配当前安装位置的原始版本。

如果备份不存在，卸载器会停止而不会猜测性修改文件；此时请用 Figma 官方安装包覆盖安装。

## Figma 更新后怎么做

Figma 自动更新通常会替换 `app.asar`，中文加载器可能随之失效。正确流程是：

1. 让 Figma 完成官方更新，确认原版能正常启动。
2. 查看本项目 Releases 是否已有对应版本。
3. 有对应版本时，退出 Figma 后重新运行安装脚本。
4. 没有对应版本时，在 Issue 中提交新版号，或直接告诉维护者“Figma 已更新到 x.x.x”。

维护者更新时会：下载官方最新版进行本地兼容验证、迁移累计词典、运行回归测试、更新版本清单，再由 GitHub Actions 生成四个平台的维护包。不会把修改后的 Figma 应用上传到 GitHub。

## 防止翻译回归

项目使用三层保护：

- `manifests/source-lock.json` 锁定当前 8 个加载器源文件的 SHA-256；
- 自动测试锁定关键翻译、专业名词例外、代码/CSS 保护与动态界面处理；
- Release 构建前检查仓库不含 `.app`、`.asar`、`.exe` 等 Figma 二进制。

更新词典后必须明确刷新 source lock，并通过：

```bash
npm ci
npm run validate
```

## 本地开发

```bash
npm ci
npm run validate
npm run status
```

本地安装与恢复：

```bash
npm run install:local
npm run uninstall:local
```

可通过 `--resources /path/to/Resources` 对测试副本执行操作。补丁器只接受具有已知 `"use strict"` 启动锚点的入口；结构变化会立即停止。

## 发布新版本

1. 更新 `src/translation-loader` 和 `manifests/<figma-version>.json`。
2. 更新 `package.json` 版本和 `manifests/source-lock.json`。
3. 本地及 GitHub Actions 校验通过。
4. 创建标签，例如 `v126.6.14-cn.1`。
5. `release.yml` 在对应平台 runner 上打包本地维护工具、发布 SHA-256，并在 Release 页面生成从上一版本到当前版本的更新说明。

## 许可与免责声明

本项目自行编写的代码以 MIT 许可证发布。Figma 商标、产品和第三方内容不在该许可范围内，详情见 [THIRD_PARTY_NOTICE.md](THIRD_PARTY_NOTICE.md)。
