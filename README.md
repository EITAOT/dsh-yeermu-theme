# 曳尔沐 · 全息终端

一套给 DeepSeek Harness 桌面版用的**个人主题插件**：淡紫像素窗框、全息终端立绘卡、视频背景，外加一整套 XP 风格的设置页。

> **非商业同人二创**。《异环》的角色、世界观与相关素材版权归游戏及原权利方所有；本插件不含任何商业用途，仅供个人学习与交流。详见 [NOTICE.md](NOTICE.md)。

## 装上以后是什么样

| 模块 | 说明 |
|---|---|
| 整窗像素窗框 | 顶部 40px 标题带 + 三边 11px 淡紫边框，纯浮层实现，**不改变应用视口尺寸** |
| 标题栏 | 头像、像素菜单条、打字机状态条（待机/干活/等批准/出错四态轮换台词）、原生窗口控件的深色底衬 |
| 输入卡三块 | 左「日历 · 天气」、中「全息终端」（4 张立绘点击轮换 + 实时 tok/s、缓存命中、上下文进度）、右「系统监控」（CPU/内存/GPU 像素进度条） |
| 侧栏 | 白底像素字 + 淡紫框、`elyms` 像素字标、软盘图标的新会话按钮；折叠态另有适配 |
| 用户气泡 | 像素窗体：3px 墨色描边、阶梯倒角、右下小尾巴；描边跟深浅模式翻转 |
| 设置页 | Windows XP 皮肤：蓝渐变标题栏、列表框导航、灰底内容区、凸起按钮（含按下态） |
| 推理等级 | 宿主的下拉列表改成可拖动的分段滑块 |
| 视频背景 | 4 段循环背景 + 开屏动画（可点击跳过），Host 端 Range 流式路由 |
| 角色扮演 | 可选。开启后把角色卡写入当前工作区的 `AGENTS.local.md` |

## 安装

### 方式一：插件市场索引（推荐）

在「设置 → 插件」的索引源里添加本插件的索引 URL，然后从发现页安装。

### 方式二：直接装包

```powershell
# 用插件管理器指向包目录（本地目录安装走链接，不复制）
plugin_manager install_bundle <yeermu-theme 目录绝对路径>
```

装完**重启 DSH** 生效。停用/卸载时 token 覆盖与背景层会一并撤销。

## 素材与体量

5 段视频共约 80 MB，是包体的绝大部分。视频经 Host 的 `/yeermu-theme/background*.mp4` 路由以 `Range` 流式提供，可边下边播、可 seek。

## 已知限制

- **只在 Windows 桌面版实测**。macOS 的侧栏折叠走另一条代码路径（56px 图标轨道），未验证；非 Windows 上的窗口标题带也按 Windows 形态假定。
- 角色卡只对**本工作区**生效（写在插件目录的父级工作区根）；换工作区对话时那份 `AGENTS.local.md` 不在，需要另行放置。
- 主题偏好存 `localStorage`，出厂外观由包内 `assets/preset.json` 在构建时焊进 `client.js`，因此升级不会覆盖用户自己的调整。
- 设置页的 XP 皮肤依赖宿主类名 `AnXs9G_*`、模型选择器依赖 `_9r0rkG_*`、气泡依赖属性 `[data-message-bubble]`——DSH 大版本升级后这些可能需要跟着改。

## 许可证

代码、样式与像素图元采用 **[CC BY-NC 4.0](LICENSE)**（署名—非商业）授权：可自由使用、修改、再分发，但**不得商用**，且须保留署名与许可声明。详见 [LICENSE](LICENSE)。

《异环》角色与相关素材的版权归游戏权利方所有，**不在本许可范围内**，见 [NOTICE.md](NOTICE.md)。

## 开发

本仓库自带可重建的构建管线，详见 [BUILD.md](BUILD.md)：

```bash
python tools/build.py        # 模板 + base64 素材 + preset → client.js
node --check client.js       # 语法自检
python tools/check_tdz.py    # 声明顺序自检
python tools/check_build.py  # 产物自检
node   tools/check_prefs.mjs # 出厂预设自检
```

素材、宿主契约与踩过的坑见 `HANDOFF.md`。

## 致谢

视频背景的机制思路（Range 路由 + `body` 首子节点固定层）参考了 MIT 许可的
[dsh-video-skin](https://github.com/Something11235/dsh-video-skin)；本插件的实现与其余全部代码为自写。
