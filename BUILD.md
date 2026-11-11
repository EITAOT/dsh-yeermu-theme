# 从源码重建

这个仓库**自带构建管线**，克隆下来就能重建出与 npm 上完全一致的 `client.js`。

## 需要什么

- **Python 3**（只用到标准库：`base64` / `json` / `os` / `shutil`）
- **Node.js**（仅用于 `node --check` 语法自检，可选）

## 构建

```bash
python tools/build.py
```

输出：

| 文件 | 说明 |
|---|---|
| `client.js` | 由 `tools/client.template.js` 注入全部 base64 素材后生成，发布包里的就是它 |
| `icon.png` | 由 `tools/src/head-128.png` 复制而来 |

## 自检（提交前建议全跑）

```bash
node --check client.js          # 语法
node --check index.js           # Host 半边语法
python tools/check_tdz.py       # 声明顺序（组件顶层 const 的 TDZ 问题）
python tools/check_build.py     # 产物断言：预设已烘焙、无残留占位符、各处 UI 规则齐全
node   tools/check_prefs.mjs    # 出厂预设的形状与取值
```

四个脚本都以自身位置为锚点，没有绝对路径，因此在任何目录执行都可以。

## 目录结构

```
client.template.js        ← 改这个；client.js 是生成物，不要手改
index.js                  ← Host 半边（视频/字体/指标/天气/人设/预设路由）
cordis.patch.yml          ← 组合包补丁（声明插件行）
locale/                   ← 展示元数据（meta.title / meta.description）
assets/                   ← 运行时素材：视频、persona.md、preset.json、pixel.ttf
tools/
  build.py                ← 构建脚本（相对路径）
  check_*.py|mjs          ← 自检
  src/                    ← 会被内联成 data: URI 的图形源文件
docs 与 HANDOFF.md        ← 开发交接文档（不进 npm 包）
```

## 素材与产物

- `assets/` 里的 5 段视频约 78 MB，是包体积的主要来源；Host 端用 Range 路由流式提供。
- 只有 `package.json` 的 `files` 白名单里的内容会被 `pnpm pack` 打进发布包；
  `tools/`、`HANDOFF.md`、本文件都**不会**进入 npm 包。

## 发布

流程见 [`PUBLISH.md`](../.build-yeermu/publish/PUBLISH.md)（在工作区草稿区，不在本仓库内），
要点：升版本 → `pnpm publish` → **用 `pnpm view <包> versions` 复核是否真上线**（新增版本可能先进入暂存区）→
更新插件市场索引。
