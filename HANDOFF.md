# 曳尔沐 · 全息终端 —— 交接文档

> 写给「下一个对话里的我」或任何人接手时看。最后更新：**2026-11-11**。
> 这是一份**私有自用**主题插件，不发布、不分发。**角色卡与角色设定属于用户本人的创作。**

---

## 0. 三十秒速览

| 项 | 值 |
|---|---|
| 包名 | **`dsh-yeermu-theme`**（1.0.0）。2026-11-12 由 `@local/yeermu-theme` 改名以准备发布；改名脚本在 `..\.build-yeermu\publish\prepare_release.py`（同步 4 处 + 重建 + 自检） |
| 发布 | 见 `..\.build-yeermu\publish\PUBLISH.md`：发 npm → 托管索引 JSON → 用户加索引源。许可证 CC-BY-NC-4.0，版权见插件根 `NOTICE.md` |
| 位置 | `C:\Users\Eitaot\Documents\deepseek-harness\default-workspace\yeermu-theme` |
| 安装方式 | profile `desktop` 里以 **junction/link** 装到 `node_modules\@local\yeermu-theme`，改文件后**重启 DSH** 生效 |
| 构建 | `tools\build.py`：`client.template.js` + 注入 base64（头像 `HEAD`、字标 `WORDMARK`、软盘 `FLOPPY`、Q 版立绘 `HERO_FACE`、4 张 `FACES`、3 个头部图标）+ 把 `assets/preset.json` 当 `__PRESET__` 焊进去 → `client.js` |
| 体量 | `client.template.js` 2,663 行 / 117 KB → `client.js` 257,414 B；`index.js` 730 行 / 28 KB |
| 素材 | `assets/`：4 段背景 + 1 段开机（约 80 MB）、`pixel.ttf`、**`persona.md`（角色卡，44 KB）**、**`preset.json`（出厂外观，246 B）** |
| 运行环境 | Windows / Electron 桌面版；**没有网页刷新通道，代码改动一律重启**（角色卡不用） |
| 构建与自检 | **随包** `tools\`：`build.py`、`check_tdz.py`、`check_build.py`、`check_prefs.mjs`（路径相对，克隆即可重建） |
| 文档外的工具 | `..\.build-yeermu\`（工作区草稿区）：`scan_mojibake.py`、`asar-grep.mjs` / `asar-extract.mjs` / `asar-ls.mjs`、`dump_ctx.py` / `dump_all.py`（从宿主包里导上下文到 UTF-8 文件，绕开 GBK 控制台）、若干 `preview_*.py` |

**改代码的唯一路径**：改 `client.template.js` → `build.py` → `node --check` → `check_tdz.py` → `check_build.py` → 重启。
**改出厂外观**：调好后点设置页「存为插件预设」（写 `assets/preset.json`）→ `build.py` → 重启。
**不要直接改 `client.js`**（生成物）；**不要不打招呼就改 `assets/persona.md`**（用户的私人创作，见 §4）。

---

## 1. 已完成的功能

| 模块 | 落点 / 实现 |
|---|---|
| 整窗淡紫边框（上 40px 标题带 + 三边 11px） | 覆盖层 `#yrm-frame` + 内阴影环，`position:fixed; pointer-events:none`；**不动 `#root` 布局** |
| 标题栏：头像 / 假菜单 / 状态条 / 窗口控件底衬 | `HEAD` 方图、`pointermove` 手动命中假标签、打字机状态条、`windowControlsOverlay` 实测宽度；假菜单的 `left` 跟宿主变量 `--dsh-windows-menu-start`（展开 48 / 折叠 84）走，不再写死 47px |
| 状态条四态台词 | 待机 20s / 工作 10s / 等待批准 / 出错；`PHASES` 配色，`reportSessionState()` 优先级 error > approval > working > idle。**一行台词可以是纯字符串，也可以是分段数组**（`['文本','tone']`）：`TONE_ALIEN` 红色发光、`TONE_GHOST` 绿色发光，用于「异象空间被接入」的三句（2026-11-11 扩台词：待机 17→27、干活 14→18；等批准 4、出错 3 未动） |
| 状态条外形 | 高 30px**全圆头**（`border-radius:15px`）、无内发光、1px 浮雕 + 外投影；曾加过 CRT 扫描线，**已按用户要求移除** |
| 视频背景 4 选 1 + 开屏动画/声音 | Host Range 路由 + 设置页选择；开屏可点击跳过，结尾像素方块消散 |
| 侧栏白底 + 像素字 + 淡紫框 | `[data-shell-leading]` / `.wtg9ga_root`（哈希类）；边框环额外叠了一层 `::after` 覆盖层（见坑 #14） |
| 侧栏品牌 | `sidebar.brand.name` 槽位（`priority:-20`）渲染 `WORDMARK`（"elyms" 像素字标，26px / `translateY(2px)`）+ 自绘 `HARNESS` 徽标 |
| 侧栏**折叠态** | Windows 下 `collapsedWidth=0`（不是 macOS 的 56px 轨道）：整列消失，只剩两个 `position:fixed` 的 28px 按钮（toggle `left:12`、新建 `left:48`）停在标题带里。折叠时藏 `.yrm-frame-avatar` 与 `.yrm-mark`/`.yrm-brand-row`、新建按钮压平为透明图标钮、toggle 压深到 `#241d47`（见 §3 折叠态一行） |
| 侧栏「新会话」 | 紫色圆角按钮；宿主 `+` 图标换成**像素软盘**（`.wtg9ga_newSessionContent > svg{display:none}` + `::before` 背景） |
| 侧栏工作区列表 | `.wtg9ga_root .wtg9ga_regionArea *` 全部换**微软雅黑**（含 `font-smoothing`/`text-rendering` 一起改，否则发虚） |
| 输入卡（三块一行） | 左「日历 · 天气」、中「全息终端」、右「系统监控」；`.yrm-dock` 为 flex 行、底部对齐 |
| ↳ 中卡外形 | **像素窗体**：1px 深描边 + 2px 浅灰框、直角、标题栏 `#3d80e8` + 白方块按钮、标题用 `YermuPixel` 14px |
| ↳ 中卡头像 | 4 张立绘点击轮换，电磁干扰撕裂 + 双圈波纹（`FACES`/`cycleFace`），索引存 `localStorage['yeermu-theme.face.v1']` |
| ↳ 名字状态 | 「曳尔沐 — 在线中 / 已断线 / 干活中」，LED 绿/红/蓝；`navigator.onLine` + `running`（忙碌优先） |
| ↳ 文案 | 名字下那行是「你看到的我，是哪一种颜色呢？开朗或慢热？~」 |
| ↳ 左面板 | 日期大字 + 中式月历网格（今天高亮、自动滚到可视区）+ 温度/天气/固定城市「海特洛」 |
| ↳ 右面板 | CPU/内存/GPU 三条**像素边进度条**（黑条四段、四角留空），2s 刷新、GPU 5s；数值 12px 加粗 |
| ↳ 等高 | 两侧高度 = 实测中卡高度（`--yrm-tile-h`），日历网格超出部分用 6px 细滚动条 |
| ↳ 收起 | `ResizeObserver` 量 composer 行宽，< 960px 隐藏两侧 |
| 聊天区顶部标题栏 | 与侧板同款：`#3d80e8` + **内浮雕**（顶亮/底暗 2px）、面包屑白色像素字、右侧图标转白 |
| 聊天头部三个图标 | 灰像素文件夹（`img.mOxcpG_appIcon` 用 `content:url()`）/ 白底黑边黑感叹号（`K0RNnq_moreButton`）/ 文件夹+文档（`RwosdG_button`），18px |
| 聊天头部「标准模式」胶囊 | `<span class="dscfja_label">` → 白底黑字胶囊；`svg` 设 `fill:currentColor` |
| 下拉菜单文字 | `[role="menu"] [role="menuitem"] *` 高优先级覆盖，颜色 `light-dark(#121a2b,#e7f3ff)` 跟主题翻转 |
| 设置页「曳尔沐」 | 三滑块 + 影片 + 固定台词 + 外框/开屏开关 + **角色扮演两档开关** + **打开角色卡 / 保存角色卡** + 工作区提示 |
| **出厂外观（随包发布）** | `assets/preset.json` → `build.py` 当 `__PRESET__` 嵌进 `client.js`；`loadLook()` 空存储/坏数据回落到 `presetLook()`，「恢复默认」也回它。**下载者装好即作者的样子，运行时零文件读写** |
| **推理等级改分段滑块** | 宿主 `ui-model-selection` 的弹层（`_9r0rkG_*`）本是竖排 4 行；`startEffortSlider()` 按「选项全是 Off/Low/High/Max 这类档位」认出来后打 `.yrm-effort-slider`，CSS 横排成 4 段滑块、隐藏勾、选中段浮起。**可拖动**：`attachEffortDrag()` 按下时挂 window 监听，拖动时滑块跟手，松手才提交（见 §5 坑 24） |
| **右侧工具卡改纯色** | 四张卡（工作区文件 / 新建终端 / 浏览器 / 更多工具）宿主用 `--dsw-alias-bg-layer-1` 半透明玻璃层，字被视频背景干扰。改成纯色：浅 `#fff`、深 `#15223a`，hover 与「更多工具」展开态分别是 `#f1eefb` / `#1d2c47`。钩子是宿主自带的 `[data-sidebar-right-guide-entry]` 属性，不依赖哈希类 |
| **新对话 hero 换头换字** | 大肥鱼换成角色的 Q 版立绘（`hero-face.png` 构建注入 `__HERO_FACE__`），标题「探索未至之境」换成「友谊地久天长」，并改成**白字 + 3px 黑描边**的像素字体 36px（= 3×12，12 的整数倍才清晰；`font-weight:400` 防合成加粗；行高 44px 以免行盒裁字；描边用八向 `text-shadow`，不用 `-webkit-text-stroke`——后者居中描边会吃掉白色字芯并糊掉像素边）。宿主 `HeroShell`（`WOwLGG_*`）：鱼是 `.WOwLGG_fish` 的 svg → `display:none`，立绘挂在 `.WOwLGG_fishHitbox` 背景上（52px）；标题是无类名 span → `font-size:0` 后用 `::after` 重绘。**游动动画移到 hitbox**（自建 `yrm-hero-swim` keyframes，hover 时轻摆；宿主那份 animate 的是已隐藏的 svg）。「预览版」徽标保留 |
| **设置页开关滑钮** | 宿主 `Switch` 的圆点是 `--dsw-alias-switch-thumb`（近白），在浅灰 XP 轨道上看不出边界；设置弹层内改成绿色 `#3f9c35` + 1px 投影。用 `[class*="_switch_"] [class*="_thumb_"]` 子串选择器，不锁哈希 |
| **用户气泡像素边框** | 钩子用宿主属性 `[data-message-bubble]`（气泡元素自带，稳定）。**双层伪元素**：`::before` 画墨色外轮廓、`::after` 画内嵌 3px 的填充——因为 `border` 跟不上阶梯轮廓（`clip-path` 会把边框一起裁掉）。轮廓 = 每角 8px（两级 4px）倒角 + **右侧**像素小尾巴（伸出 16px，伪元素盒子 `right:-23px`）；填充仍走 `--dsw-specific-bubble`（跟随主题），只有墨色跟深浅翻转（浅近黑 / 深近白，判据 `body[data-ds-dark-theme]`）。多边形由 `.build-yeermu/gen_bubble_polys.py`（`right` 参数）生成，**不要手改坐标** |
| 设置页 **Windows XP 皮肤** | `MutationObserver` 打 `yrm-panel-skin`；面板改 XP 灰 `#ece9d8`、去掉原来的紫环；`.AnXs9G_navTitle` + `.AnXs9G_header` 各刷同一条蓝渐变拼成连续标题栏（设置 / 打开配置文件 / 关闭），关闭按钮改成红底白叉；导航做成 XP 列表框（白底 + `#7f9db9` 边框，选中 `#316ac5` 白字）；内容区灰底、卡片白底方角、按钮改 XP 凸起样式。**并且在弹层内部把 `--dsw-alias-label-primary/-secondary/-tertiary` 等文字令牌钉成深墨色、输入/菜单面钉成浅色**——否则深色主题会把它的浅色文字丢到灰底上，完全看不清（2026-11-11 用户实测发现并修）。**输入框还要额外钉 `--dsw-alias-bg-layer-3` 与 `--dsw-alias-border-l4`**：宿主 `._input_181ew_115` 的底色就是 layer-3，只钉文字令牌会变成「深底深字」（第二次实测发现）。**字号步进器（`_7qxJPq_stepper`）和语言/偏好下拉用的又是另一个令牌 `--dsw-alias-bg-module-platform`，而且步进器是 `<div>` 不是 `<input>`**，兜底规则抓不到（第三次实测发现）——已钉，并加了 `[class*="_stepper"] / [class*="_selector"]` 兜底。之后按「设置各包里 `background:var(--dsw-*)` 的用法统计」把还剩的深色面一起钉了：`--dsw-alias-settings-card-fill`、`-interactive-bg-active`、`-interactive-bg-hover-solid`、`-bg-skeleton`、`-markdown-code-block`、`--dsw-static-neutral-bluish-55/850`。另有一套 `input/textarea` 兜底规则（作用域是整个弹层）管边框、圆角、placeholder。按钮有 `:active` 按下态（表面变深 + 内外高光翻转 + 1px 位移），导航项也有按下色。设置打开时整窗 `#yrm-frame` 隐藏（`html:has(.yrm-panel-skin)`） |
| 角色扮演 | 见 **§7**（本文件最重要的一节之一） |

调色板（暗色）：底 `rgba(6,10,18,.52)`、层1 `rgba(12,20,33,.94)`、层2 `rgba(18,29,47,.90)`、浮层 `rgba(21,34,58,.97)`、品牌 `#3E7BFF`。

---

## 2. 架构

### Host 半边 `index.js`（730 行 / 28 KB）

- **没有** `webserver/index-inject` 贡献（坑 #5，永久移除）；
- `ctx.inject(['webServer'])` 在同一个 `child.effect` 里注册 **11 条 exact 路由**，卸载时统一 dispose：
  - 5 条视频：`/background.mp4`、`-2`、`-3`、`-4`、`/boot.mp4`
  - `/pixel-font` → `assets/pixel.woff2|woff|ttf|otf`
  - `/metrics` → 采样器快照（`os.cpus()` 差值 + `totalmem/freemem` + `nvidia-smi`）
  - `/weather` → 代理 Open-Meteo（10 分钟缓存，坐标写死郑州、名字固定「海特洛」）
  - `/persona`（GET 读状态 / POST 写或删工作区的 `AGENTS.local.md`；**路径由 `resolvePersonaTarget(ctx)` 决定**，不再假设插件在工区里）
  - `/open-card`（POST → 用系统编辑器打开 `assets/persona.md`）
  - `/preset`（GET 读 / POST 写 / DELETE 删 `assets/preset.json`；**仅作者录制用**，发行版包里目录只读，POST 会 500）
- `serveVideo()` 自实现 `Range`/`ETag`/206/416/HEAD。
- 导出 `sampleSystem()`、`personaDocument()`、`personaState()`、`prefsState()` 便于离线自检（`tools\check_prefs.mjs` 跑的就是它）。

### Client 半边（`client.template.js` 2,663 行 → `client.js` 257,414 B）

`apply(ctx)`：token 层 → 背景/边框 → 开屏 → 设置面板观察器 → 人设键盘监听 → 注册 4 个槽位（`conversation.composer.dock`、`sidebar.brand.mark`、`sidebar.brand.name`、`settings.section`）。

---

## 3. 关键代码坐标（都在 `client.template.js`，除非注明）

| 想改什么 | 找什么 |
|---|---|
| 主题色 / 浮层 | `SURFACE_TOKENS` / `OPAQUE_TOKENS` / `EXTRA_TOKENS`（`--dsw-specific-menu` 等） |
| 滑块默认值 / 持久化 | `PRESET`（构建注入）、`presetLook()`、`LOOK_DEFAULTS`（只是坏预设的保险值）、`LOOK_KEY='yeermu-theme.look.v1'`、`normalizeLook()`（所有字段的 clamp 都在这）、`loadLook()` |
| **出厂预设** | `assets/preset.json` + `build.py` 的 `__PRESET__` 注入；`presetLook()`（强制关掉两个 persona 开关）/ `presetFace()`；作者录制入口 `savePreset()` + Host 的 `prefsState()` / `writePrefs()` / `PREF_FILE` |
| **推理等级滑块** | `startEffortSlider()` / `isEffortMenu()` / `tagEffortMenus()` / `attachEffortDrag()`、`EFFORT_MENU_CLASS` / `EFFORT_OPTION_CLASS` / `EFFORT_LABELS`；样式在 `FRAME_CSS` 的 `.yrm-effort-slider …` 那组（宿主类 `_9r0rkG_menu` / `_option` / `_selected` / `_check`；拖动高亮用 `.yrm-drag-target` + `.is-dragging`） |
| **右侧工具卡** | `FRAME_CSS` 的 `[data-sidebar-right-guide-entry]` 那组（宿主类 `p2k40q_*`，**未依赖**） |
| **新对话 hero** | `FRAME_CSS` 的 `.WOwLGG_fishHitbox` / `.WOwLGG_fish` / `.WOwLGG_titleGroup > span:first-child` 那组，以及自建 `@keyframes yrm-hero-swim`（hover 摆动）；立绘源文件 `..\.build-yeermu\hero-face.png`（由 `make_hero_face.py` 从用户给的图裁切缩放到 104px 高） |
| **用户气泡** | `FRAME_CSS` 的 `[data-message-bubble]` / `::before` / `::after` 与 `body[data-ds-dark-theme] …::before`；几何在 `..\.build-yeermu\gen_bubble_polys.py`（改倒角/尾巴尺寸后重跑，粘贴输出的两个 polygon）；宿主原规则 `._bubble_1sgyj_1`，填充令牌 `--dsw-specific-bubble`（在 `EXTRA_TOKENS`） |
| **侧栏折叠态** | `FRAME_CSS` 末尾那组 `html:has([data-sidebar-collapsed]) …` 与 `.wtg9ga_collapsed …`；假菜单落点是 `left:calc(var(--dsh-windows-menu-start,48px) - 1px)` |
| 台词 | `IDLE_LINES` / `WORK_LINES` / `APPROVAL_LINES` / `ERROR_LINES`、`PHASES`、`TYPE_MS`（42ms/字）；**分段与着色**：`TONE_ALIEN` / `TONE_GHOST`、`lineSegments()`、`paintSegments()`、`FRAME_CSS` 里的 `.yrm-tone-alien` / `.yrm-tone-ghost` |
| 状态优先级 | `reportSessionState()` |
| 背景视频 | `SCENE_SRC` / `SCENE_LABELS` / `SCENE_POSITION` |
| 窗口边框 / 标题带 / 状态条 | `FRAME_CSS` 里的 `#yrm-frame`、`.yrm-frame-top`、`.yrm-status`、`.yrm-winctl-back` |
| 侧栏皮肤 / 品牌 / 按钮 | `FRAME_CSS` 里 `[data-shell-leading], .wtg9ga_root{…}`、`.yrm-brand-row`、`.wtg9ga_newSession…` |
| 开屏 | `mountSplash()`、`pixelDissolve()`、`SPLASH_CSS` |
| 设置面板打标签 / XP 皮肤 | `startPanelSkin()` + `.yrm-panel-skin`；XP 样式在 `FRAME_CSS` 的 `.yrm-panel-skin` / `.AnXs9G_panel` / `.AnXs9G_navTitle` / `.AnXs9G_header` / `.AnXs9G_navList` / `.AnXs9G_navCell` / `.AnXs9G_options` 那组 |
| 输入卡 | `DockCard`、`speedText` / `cacheHitText` / `contextPercent`、`SideCalendar`、`SideMonitor` |
| 头像轮换 | `FACES` / `loadFaceIndex()` / `cycleFace()`；`.yrm-well.is-emi` 下三个 keyframes |
| 三列 / 收起 | `.yrm-dock`、`DockCard` 里的 `ResizeObserver`（960px）、`--yrm-tile-h` |
| **角色扮演** | `PERSONA_CODE`（`'316651'`）、`watchPersonaCode()`、`enablePersona()`、`syncPersona()`、`clearComposer()` |
| 设置页 UI | `SettingsSection`（含「打开角色卡文件」「保存角色卡」两个按钮与琥珀色工作区提示；按钮原名「重新生成指令文件」，2026-11-11 按用户要求改掉歧义） |
| **宿主侧人设** | `index.js`：`personaDocument(work)`、`personaState()`、`resolvePersonaTarget(ctx)`、`openInEditor()`、`PERSONA_SOURCE` / `PERSONA_FILE` / `PERSONA_MARK` |

---

## 4. 开发流程（严格按这个来）

> **角色卡是用户的私人创作。任何对 `assets/persona.md` 的修改（增删一个字都算）都必须先征得用户同意再动。** 不要"顺手优化"，更不要在回复里声称"已改"而没有真的执行文件操作（我犯过这个错，用户当场发现）。

```powershell
# 1. 改模板（不是 client.js）
#    tools\client.template.js

# 2. 生成 client.js（注入 base64 资源 + 把 assets/preset.json 当 __PRESET__ 焊进去）
python tools\build.py

# 3. 语法自检
node --check client.js

# 4. 声明顺序自检（必跑！坑 #13）
python tools\check_tdz.py

# 5. 产物自检（预设是否真的写进去了、旧按钮是否还残留）
python tools\check_build.py

# 6. Host 改动额外自检（只读，不会碰 preset.json）
node tools\check_prefs.mjs
node -e "import('file:///.../index.js').then(m=>console.log(Object.keys(m)))"

# 7. 重启 DSH（没有刷新通道；Ctrl+F5 无效）
```

> **Node 不在 PATH 上**（2026-11-11 实测）：用 harness 自带运行时
> `C:\Users\Eitaot\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`；
> Python 同理 `…\dependencies\python\python.exe`。控制台是 GBK，Python 直接 `print` 中文/特殊字符会
> `UnicodeEncodeError`：要么 `$env:PYTHONIOENCODING="utf-8"`，要么用 `dump_ctx.py` 写到文件再读。

**改出厂外观（要构建 + 重启）**：在设置页把滑块/影片/头像调满意 → 点「存为插件预设」（写 `assets/preset.json`）
→ `build.py` → 重启。新装用户和「恢复默认」都会落到这套值。也可以直接手改 `assets/preset.json` 再构建。
**注意**：`persona` / `personaWork` 在 `presetLook()` 里被强制关掉，写进预设也不会生效（坑 #23）。

**改角色卡（不需要构建、不需要重启）**：改 `assets/persona.md` → 让 Host 重新生成 `AGENTS.local.md`
（设置页点「保存角色卡」，或 `node -e "import('.../index.js').then(m=>fs.writeFileSync(AGENTS, m.personaDocument(false)))"`）。

**工具**：
- `check_tdz.py`：查组件函数体第一层「`const` 在声明前被读」（TDZ），只算 depth-1、已剥注释，输出 0 才算过；
- `check_build.py`：验 `client.js` 里预设真的烘焙进去了、`__PRESET__` 无残留、旧导出/导入 UI 已清除、折叠态规则还在；
- `check_prefs.mjs`：只读校验 `assets/preset.json`（形状、范围、无 BOM、两个 persona 开关必须为 false），**从不写它**；
- `asar-grep.mjs <app.asar> <needle>` / `asar-extract.mjs` / `asar-ls.mjs`：**不重启就能翻宿主包**，确认哈希类名、组件结构；
- `preview_*.py`：按真实 CSS 参数用 PIL 渲染预览图（状态条、三块面板、侧栏头部、人设/图标、折叠标题带 `preview_collapsed.py`），改动前先给用户看图，省一轮重启。
- `dump_ctx.py <file> <needle> <out> [before] [after]` / `dump_all.py`：把宿主包里的上下文窗口写到 UTF-8 文件，绕开 GBK 控制台；`asar-extract.mjs` 提到的最新版 bundle 就靠它读。
- ⚠️ `rebuild_persona.py` 是**一次性脚本**，会把 `D:\QQ\qq下载\曳尔沐角色卡.txt` 覆盖进插件；用户后来自己精简过卡片，**除非用户重新给源文件，不要再跑它**。

**验证手段**（没有浏览器控制权时）：`cordis_inspect_query` 查 `Slots.listSubTree`；让用户看截图；必要时临时加「屏上诊断」（用完即删，参考 §7 的 `debug-echo` 曾用过两次）。

---

## 5. 硬约束与踩过的坑（**接手必读**）

1. **绝对不要改 `#root` 尺寸/位置**：曾用 `margin:40px` 给边框让位，导致宿主账号/充值原生视图坐标错位、「‹ 返回」点不动，只能杀进程。边框必须纯浮层。
2. **不要复用宿主槽位 id**：曾用 `id:'activity'/'usage'` 顶统计胶囊，整体启动失败（`web boot: 1 entry did not activate`）。
3. **单槽 `priority` 越小越优先**，盖住宿主默认内容要用**负值**（现用 `-20`）。
4. **`pointer-events:none` 元素不触发 `:hover`**；要真悬停就得接收指针事件，也就失去穿透，二者不可兼得（假标签靠 `pointermove` 手动命中）。
5. **不要往 `webserver/index-inject` 塞行**：共享逐行解释器，一行抛错会连累后面所有插件（「小鲸鱼挂件消失」事件的根因）。
6. **窗口控件、应用菜单是原生层**，网页盖不住；只能垫色。菜单按 Alt 才出现。
7. **不要用 PowerShell 写 `package.json` 等清单**：会写 BOM + 二次转码。用编辑器级无 BOM UTF-8；批量改文本用 Python（读/写都指定 `encoding='utf-8'`）。
8. **像素字体只在 12px 整数倍清晰**；小字密集处用微软雅黑（且要同时改 `-webkit-font-smoothing` 与 `text-rendering`）。
9. **`object-position` 方向**：Y% 越小 = 取画面越靠上 = 内容看起来越靠下。
10. **Cookie 爆掉（431 认证失败）与插件无关**：杀进程 → 重命名 `%APPDATA%\@deepseek-ai\dsh-desktop\Network\Cookies` → 重启，周期约一两个月。
11. **开屏声音**：Electron 默认允许带声自动播放；真浏览器会拒，代码有静音回退。
12. **输入卡整块 `pointer-events:none`**，只有 `.yrm-well` 是 `auto`。别把整卡改成可点。
13. **组件顶层 `const` 顺序会炸整块 dock**：曾把 `presence` 写在 `const online` 之前 → TDZ `ReferenceError` → **三个模块一起消失**，而 `node --check` 查不出来。必跑 `check_tdz.py`。
14. **inset box-shadow 画在子元素下面**：侧栏白底子元素的圆角会「啃掉」边框环，形成一块突兀白斑；修法是给 `.wtg9ga_root` / `[data-shell-leading]` 加 `::after{inset:0; box-shadow:inherit}` 覆盖层（`pointer-events:none`）。
15. **宿主样式后注入，类选择器会压过同权重的属性选择器**：菜单文字写死白色的 `_itemLabel_*` 就属此类，必须用 `[role="menu"] [role="menuitem"] *` 这种「元素+role+后代」提高权重。
16. **卡片源文件用不换行空格（`\u00A0`）缩进 + 中文弯引号**：脚本改卡时不要按整行精确匹配，用「包含某段文字」定位行号；写文件一律 UTF-8 无 BOM。
17. **`AGENTS.local.md` 是生成物**：只改 `assets/persona.md` 不重新生成，AI 读到的还是旧内容。关闭人设会**删除**该文件；文件已存在且首行没有 `<!-- yeermu-theme:persona` 标记时，Host 返回 409 不覆盖（保护用户自己的 AGENTS）。
18. **折叠态不是「56px 图标轨道」**：`computeColumns()` 的 `collapsedWidth = drawer || darwin || windowsTitlebar ? 0 : 56`，Windows 桌面版折到 **0 宽**，侧栏内容整个 `display:none`，只剩两个 `position:fixed` 的 28px 按钮停在标题带（toggle `left:12`、新建 `left:48`）。**任何标题带的装饰物都要先确认这两格是空的**，否则会把唯一的「展开」入口盖住。判据用 `html:has([data-sidebar-collapsed])`（该属性在 `frame` 上，不在 `html` 上，所以只能 `:has`）。
19. **假菜单条跟着 `--dsh-windows-menu-start` 走**：真菜单是 preload 在 shadow root 里 mount 的，`left: var(--dsh-windows-menu-start,48px)`；宿主折叠时把它改成 `84px`（让开新建按钮）。假菜单写死 `47px` 就会在折叠态同时盖住新建按钮和真菜单，改用那个变量即可两种状态都对。悬停命中读的是 `getBoundingClientRect()`，平移不会破坏它。
20. **别用 `Get-Content` 判断文件编码**：无 BOM 的 UTF-8 在 GBK 控制台会被按 ANSI 读成乱码（`曳尔沐` → `鏇冲皵娌?`）。2026-11-11 就这样误判过 `package.json`「有乱码」，其实文件一直是好的。判断编码一律用 Python 读 bytes，或 `Get-Content -Encoding utf8`；扫全库用 `.build-yeermu\scan_mojibake.py`。反过来，Linux 下 heredoc 里 `python -c "…"` 经 PowerShell 传参会把引号吃掉，写脚本文件再跑。
21. **真乱码长这样**（2026-11-11 修过 `index.js` 两条注释）：`—`（U+2014）转坏一层成 `鈥?`，转坏两层成 `閳?`——因为 `鈥` 是 U+9225，正好落在「GBK 读到就变成 `閳`」的区间。回填成 `—` 后注意补回被吞掉的空格。
22. **发行版里没有可写的插件目录**：用户从插件市场装下来的是构建产物，包在只读位置、升级时整体覆盖。所以**任何"默认外观/配置"都必须在构建时焊进 `client.js`**（`build.py` 的 `__PRESET__`），不要在运行时读包内文件、更不要写——`/preset` 那条 POST 只在开发目录可用，发行版会 500。同理，`localStorage` 才是用户运行时唯一的可写存储。
23. **预设里可以带两个 persona 开关**（2026-11-11 按作者决定改成不强制关）：卡是本插件功能的一部分，非商业二创，发布时另行标注素材/文案版权归游戏方。但**开关一旦随包为 `true`，每个新装用户首次启动就会在工作区写 `AGENTS.local.md`**——所以落点必须对：`resolvePersonaTarget(ctx)` 取 `ctx.get('sandboxPolicy').resolve({}).workspaceRoot`（宿主 `dsh-sandbox-policy` 的实现：会话 cwd 优先，否则部署根），**并从插件自身位置推不出来**（发行版在 `node_modules/@local/…` 下）。函数还会拒绝含 `node_modules` 的路径、服务缺失时保留上一次的好值。
24. **绝不要对宿主的菜单用 `setPointerCapture`**（2026-11-11 差点踩死）：捕获会把 `pointerup` 重定向到捕获元素，Chromium 随后把那个 `click` 也派给捕获元素——宿主监听在选项上的 `onClick` 直接收不到，**普通单击会整体失效**。要拖拽就在 `pointerdown` 时临时往 `window` 挂 `pointermove`/`pointerup`（捕获阶段），抬起即摘除。另外：拖拽的"按下 A、松开 B"浏览器只会把 `click` 派发到共同祖先，所以必须在 `pointerup` 里对指针下那一段手动 `.click()`；**同一段按下又松开时不要手动点**，否则会重复提交一次模型选择。
25. **像素轮廓的台阶必须明显宽于描边**（2026-11-11 气泡改版踩过）：描边 3px 时若台阶也是 3px，外扩 3px 会让相邻台阶合并成同一个顶点（顶点重复），Chromium 在那种退化角点上的抗锯齿会在轮廓上漏出一个 1px 小白点。现在倒角台阶 4px、尾巴台阶 8px。判断依据：`.build-yeermu/gen_bubble_polys.py` 输出里若出现连续重复坐标，就是退化。
26. **headless 浏览器在本沙箱里跑不起来**（2026-11-11 实测）：`msedge --headless=new --screenshot` 报 `mojo platform_channel: 拒绝访问`（命名管道被沙箱挡住），所以"渲染 CSS 单独截图"这条路走不通；预览请继续用 `.build-yeermu/preview_*.py`，最终效果只能靠重启后让用户看。

---

## 6. 已知问题 / 待办

- **出厂外观已随包发布（2026-11-11）**：`assets/preset.json` → `build.py` 焊进 `client.js`（`__PRESET__`）。新装用户与「恢复默认」都落到这套值（`surface 50 / video 100 / veil 0 / scene 4 / 开屏开 / 声音开 / face 0`）。用户自己拖滑块仍只写 `localStorage`，不会回写预设。
- **发布前的待办（用户说"不急着发，细节慢慢调"）**：① 素材/文案版权声明写进 README 与设置页（版权归游戏方，非商业二创）；② 体积 80 MB 要压；③ 只在 Windows 验过，macOS 的侧栏轨道与标题带没验；④ 预设里 persona 开关默认开还是关尚未定（现为 `false`，改一行 `assets/preset.json` 即可）。
- **旧的一对"导出/导入"已下线（2026-11-11）**：那套是"按用户按机器存盘"，与"发布默认外观"是两件事，用户确认不需要。`yeermu-theme\prefs.json` **已于同日删除**（无任何代码读它）；`/prefs` 路由改名为 `/preset`，只作作者录制入口。
- **人设的 token 成本**：卡片 44 KB / 186 行，注入后每轮约 **11–13k tokens**；曾做过 2.8k 字符的「精简版」，细聊容易出戏，**已弃用、已换回完整版**。用户想实测成本后再决定。
- **人设只覆盖本工作区**：`AGENTS.local.md` 写在 `default-workspace` 根（= 插件目录的父级）；换工作区对话不生效。设置页有琥珀色提示（路径由 `/persona` 的 `path` 字段动态显示）。
- **卡片内容可能随时被用户手动编辑**（他已经删过一部分），文档里的字数只是参考，不要反向"修复"。
- **体积 80 MB**（`background-3` 23 MB、`boot` 22.8 MB 可压）——尚未处理。
- **侧栏折叠态**已适配（2026-11-11，纯 CSS，见 §3），但只在 Windows 桌面版验证过：折叠走的是 `collapsedWidth=0` + 两个 `position:fixed` 按钮这条路，**macOS 的 56px 图标轨道没验**（那边 `[data-shell-leading]` 才挂载）。
- **哈希类名清单**（升级 DSH 需重新翻包）：`.wtg9ga_*`（侧栏）、`.an3WzG_*`（聊天头部）、`.dscfja_*`（模式胶囊）、`.mOxcpG_*` / `K0RNnq_*` / `RwosdG_*`（头部图标按钮）、`._itemLabel_*`（菜单行）、`._9r0rkG_*`（模型选择器：`_menu` / `_option` / `_selected` / `_check` / `_groups`）、`._bubble_1sgyj_1`（消息气泡，**未依赖**，正式钩子是 `[data-message-bubble]`）、`.WOwLGG_*`（新对话 hero：`_headline` / `_fishHitbox` / `_fish` / `_titleGroup` / `_previewBadge`）、`.AnXs9G_*`（设置弹层：`_panel` / `_navTitle` / `_header` / `_navList` / `_navCell` / `_active` / `_options` / `_close`）；设置页卡片用 `[class*="card"]` 子串匹配，未锁死哈希。
- **深色判据**：主题呈现器把 `body[data-ds-dark-theme]` 写在 **body** 上（`ui-theme` README 明说），同时给 `html` 设 `color-scheme`。气泡描边就是按 `body[data-ds-dark-theme]` 翻转的。
- **设置面板打标签**依赖文案特征词（「账号与余额」「Agent 预设」「内置插件」），宿主改文案就失效。
- **窗口控件底衬**依赖 `windowControlsOverlay`，拿不到时回退 138px。
- **推理等级滑块靠"内容识别"**（2026-11-11）：宿主菜单没有稳定 id，只按"菜单里每个选项都是 Off/Low/High/Max 这类档位、且 3–6 个"判定。**宿主改文案/改语言包就可能失配**（那时只是退回竖排列表，不会坏）。`EFFORT_LABELS` 里已备中英两套；如果哪天失效，先看 `_9r0rkG_` 前缀是否变了，再看选项文字。选中的判定同时兼容 `_9r0rkG_selected` 与 `aria-checked="true"`。

---

## 7. 角色扮演子系统（这一大轮的核心）

### 数据流

```
assets/persona.md（用户创作，纯人设正文）
   │ personaDocument(workRoleplay)
   ▼  首行标记 <!-- yeermu-theme:persona work=on|off --> + H1 标题 + 正文 + 输出边界
<工作区根>/AGENTS.local.md
   │ dsh-agent-instructions 每轮读取并作为 system-reminder 注入
   ▼
模型的行为约束
```

- **`assets/persona.md` 只放人设正文**：不带 H1、不带「输出边界」（否则会和生成逻辑重复一遍，曾出现过双标题/双边界）。
- **`personaDocument()` 负责**：标记行、标题、正文、边界段；**「任务优先是硬约束」放在生成侧**，两档（work on/off）都带。
- **两档边界**：
  - `work=off`（默认）：只有面向用户的自然语言用角色口吻；代码/命令/diff/日志/提交信息保持专业。
  - `work=on`：全程角色口吻，但代码、命令、文件内容仍必须原样准确。

### 开关与触发

- 设置页「角色扮演」（默认关）+「工作时也扮演」（默认关，未开总开关时置灰）。
- **输入框输入 `316651` 并回车**：捕获阶段拦截 Enter（不会发出去）、清空输入、置 `persona=true`、状态条打一句「语音线路接通——是我是我，好久不见啊？」。
- 关闭开关 = 删除 `AGENTS.local.md`（只删本插件写的）。
- 设置页另有「打开角色卡文件」（记事本打开 `assets/persona.md`）与「保存角色卡」（原名「重新生成指令文件」，同一功能）。
- ⚠️ **「保存角色卡」在开关关闭时是空操作**（2026-11-11 踩过）：它发的 POST 带着 `enabled: look.persona`，关着的时候 Host 只会走"删除"分支，于是点了像没反应——用户当时以为"文件没落到工作区根"。现在按钮会在关闭时明确提示（"保存不会写入文件"），不再假装写文件。**文件落点已实测正确**：`default-workspace\AGENTS.local.md`，`GET /yeermu-theme/persona` 返回 `enabled/path/foreign` 可直接核对。

### 卡片结构（当前版本）

1. 一、核心身份与背景设定 —— 含 **「空号 316651」** 设定：拨这个号码就等于打通到她的线路，收到时应**开心热情**回应，别当成验证码，也别和剧情里的「316651 个节点」搞混（这两个数字同号，卡里已注明）。
2. 二、核心人物关系网 —— Exe（宿敌/防火墙与病毒，含第三种结局）、鉴定师（第一个真朋友/云端存储）、「Y」。
3. **你认识的这些人（外貌与性格）** —— **14 条**，每条 `名字｜外貌特征｜相处语气`：
   曳尔沐（自己）、零（鉴定师，男女两版）、Exe、卡厄斯、灵可、小贞、妮夏、白藏、翳、安魂曲、法帝娅、薄荷、真红、伊洛伊。
   开头有「认人靠特征、对不上别硬套名单、小心你自己和零都是银白发」三条使用规则；末尾一句「队里的日常梗可以随便玩」。
4. 三、语言风格 —— 基调/标点/语气词/招牌笑声；核心交互原则里加了三组规则：
   **不抬杠**（不反驳不违心附和，只讲自己的想法）、**E.T.D 日常可自由发挥**（别念参考区原句）、**第四面墙**（知道自己是跑在 DeepSeek 上的 AI，可聊 AI 圈与梁文峰，允许玩梗自嘲，但**任务优先**）。
5. 设定参考区（主线剧情、角色档案、日常语音）—— 明确标注「语感与设定参考，别整段照抄」。
6. 输出边界（生成）。

### 这套设计踩过的坑

- 人物外貌最初**没写**，模型会拿「性别 / 名单排除法」乱认（真红 → 妮夏、鉴定师 → 自己），所以补了第 3 节；补完后用二创图、黑白漫画验证过，识别稳定。
- 早先想让「认不出就说不认识」，用户否掉了：真红是同事，说不认识更出戏；正确做法是**写清特征**。
- 角色卡里**不要写具体越界内容示例**（如"不过审的话"的样例），否则模型会照着演；用户已要求删掉这类描述，保留倾向即可。

---

## 8. 新会话开场提示词（可直接粘贴）

```
继续做我的 DSH 自用主题插件 dsh-yeermu-theme。
先读交接文档，再动手：
  C:\Users\Eitaot\Documents\deepseek-harness\default-workspace\yeermu-theme\HANDOFF.md

改代码：编辑 tools\client.template.js → python tools\build.py →
node --check yeermu-theme\client.js → python tools\check_tdz.py → 重启 DSH。

硬性要求：
1. 角色卡 assets/persona.md 是我本人的创作，任何修改先问我，不要"顺手优化"，也不要声称改过却没真的写文件。
2. 遵守 HANDOFF §5 的坑：不改 #root 尺寸、不复用槽位 id、不用 webserver/index-inject、不用 PowerShell 写 JSON。
3. 改样式前先用 .build-yeermu\preview_*.py 出预览图给我看，省得反复重启。
4. 涉及宿主内部结构（哈希类名、DOM）时先用 asar-grep.mjs 翻包确认，不要猜。
5. 动手前说明你改哪个文件、哪一段。
```
