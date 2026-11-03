# Lumen 官网

Lumen 的纯静态官网。**不需要服务器，不需要域名**，双击 `index.html` 即可离线打开。

---

## 快速开始

直接双击 `index.html`，或右键 → 用浏览器打开。

想让别人也能访问？把这个文件夹整个丢进任意静态托管（GitHub Pages / 对象存储 / 任意 Nginx 目录）即可，链接全部是相对路径，搬到哪里都不用改。

线上地址：<https://lume-mc.github.io/Lumen/>

> 注：安装包与便携版 ZIP 超过 Git 单文件 100 MB 上限，不入库，
> 作为 GitHub Release 资产分发；页面在线时会自动改写为 Release 直链。

---

## 目录结构

```
lumen web/
├── index.html                    页面本体（单文件，含全部内容）
├── assets/
│   ├── css/style.css             样式表（含深/浅双主题）
│   ├── js/main.js                交互脚本（原生 JS，零依赖）
│   └── img/
│       ├── logo.png / logo.webp  Lumen 标志
│       ├── hero-bg.jpg / .webp   首屏背景
│       ├── icon-44/150/256.png   站点图标
│       └── shot-*.png / .webp    实机界面截图（见下）
└── downloads/                    真实下载文件（离线打包时放这里）
    ├── Lumen-0.2.3-win32-x64-setup.exe          99.1 MB  安装版
    ├── Lumen-0.2.3-win32-x64-setup.exe.sha256           校验文件
    ├── Lumen-0.2.3-win32-x64.zip      137.4 MB  便携版
    └── Lumen-0.2.3-win32-x64.zip.sha256         校验文件
```

`.exe` / `.zip` 已被 `.gitignore` 排除，不进 Git 历史；
仓库只保留 `.sha256` 边车。

### 界面截图（真实，非示意图）

`#preview` 区块用的是**实机运行截图**，不是 CSS 画的示意图：

| 文件 | 内容 |
| --- | --- |
| `shot-home` | 主界面（浅色） |
| `shot-home-dark` | 主界面（深色） |
| `shot-store` | 整合包市场 |
| `shot-settings` | 设置页 |

抓取方式：启动 `Lumen.exe --remote-debugging-port=9333`，用 Chrome DevTools
Protocol 的 `Page.captureScreenshot` 抓取运行中的 Electron 渲染进程。
深色主题通过 `Emulation.setEmulatedMedia` 把 `prefers-color-scheme` 置为 `dark`，
由应用自己跟随系统切换（`theme.json` 里 `settings.dark = "system"`），不是后期改色。

升级启动器后若界面有变，需重新抓图并替换这四个文件（PNG + WebP 各一份）。

---

## 下载功能说明

页面里写的下载链接全部是**相对路径**（`./downloads/xxx`），因此：

- 整个文件夹随便挪位置，链接依然有效
- 断网状态下照常下载
- 没有后端、没有数据库、没有上传接口

在线访问（GitHub Pages）时，`assets/js/main.js` 会把带 `data-rel` 的链接
改写为 GitHub Release 资产直链：

```
https://github.com/Lume-MC/Lumen/releases/download/v0.2.3/<文件名>
```

原因：安装包与便携版 ZIP 体积都超过 Git 单文件 100 MB 上限，不适合放进仓库，
因此只作为 Release 资产分发；仓库里仅保留 `.sha256` 校验边车。

`file://` 直接打开时不做任何改写，仍指向本地 `./downloads/`。

**校验文件**可用于确认下载完整性：

```powershell
certutil -hashfile .\downloads\Lumen-0.2.3-win32-x64-setup.exe SHA256
```

应得到：
```
0e95e85a5bb8be661409ad646823c29ad1b4f52892876eb02d520742a558772d
```

便携版：
```
dbd80877f56ffcd06cb1f5b808786746c261e3971c8d8dcab04a18aea6b502af
```

---

## 更新到新版本

1. 把新的安装包放进 `downloads/`，命名保持 `Lumen-<版本>-win32-x64-setup.exe`
2. 重新生成校验文件：
   ```powershell
   $h = (Get-FileHash .\downloads\Lumen-0.2.3-win32-x64-setup.exe -Algorithm SHA256).Hash.ToLower()
   "$h  Lumen-0.2.3-win32-x64-setup.exe" | Set-Content .\downloads\Lumen-0.2.3-win32-x64-setup.exe.sha256 -Encoding ASCII
   ```
3. 在 `index.html` 里同步四处：
   - 首屏按钮的 `href` / `download` 属性
   - 「下载」区的 `href` / `download` 属性与体积数字
   - 「全部文件」列表行
   - 复制 SHA-256 按钮的 `data-copy` 值
4. 吸底下载条的 `href` / `download` 属性
5. 更新 `assets/js/main.js` 里的 `RELEASE_BASE`（版本号变更时）
6. 更新 `assets/js/main.js` 里 `initPortableSize` 的体积数字
7. 上传新资产并发布 Release：
   ```powershell
   gh release create v<版本> --repo Lume-MC/Lumen --title "Lumen v<版本>" --notes-file <说明文件>
   gh release upload v<版本> --repo Lume-MC/Lumen <安装包> <ZIP> <.sha256 边车> --clobber
   ```
   边车从 `downloads\` 取（`release\` 目录里没有 `.sha256` 文件）。

页面里出现的版本号 `v0.2.3`、体积 `99.1 MB` 也是硬编码的，一并改掉。
便携版体积在 `index.html`（`#portableSize`）和 `assets/js/main.js`（`initPortableSize`）
**两处**都有，也要一起改。

---

## 页面结构与现代化改版

### ⚠️ 居中陷阱：margin 简写会清掉 auto

本页面用这条规则居中 `.section--alt` 的直接子元素：

```css
.section--alt > * { max-width: var(--maxw); margin-left: auto; margin-right: auto; }
```

**如果子元素自己又写了 margin 简写**（`margin: 34px 0 0`、`margin: 0 0 44px` 这种），
简写会重置四边，把上面那两个 `auto` 冲掉 → 元素突然贴左。

已经踩过两次：
- `.steps-rail { margin: 0 0 44px }` → 偏 328px
- `.license { margin: 34px 0 0 }` → 偏 88px

> **规则：`.section--alt` 的直接子元素，margin 必须保留左右 `auto`。**
> 写 `0 auto X` / `X auto Y`，不写 `0 0 X` / `X 0 Y`。

改动后请用三档断点（390 / 820 / 1440）各量一次「元素中心 vs 视口中心」：
注意只有**元素宽度没占满视口**时才能测到偏移，满宽元素量不出来。

---

页面共 10 个区块，依次为：

| id | 区块 | 备注 |
| --- | --- | --- |
| — | `#top` Hero | 双栏：左侧文案 + 右侧真实产品截图窗口 |
| `#features` | 核心能力 | Bento 网格（6 张卡，宽 / 高卡混排） |
| `#preview` | 界面预览 | 4 张实机截图，深色那张用 `.shot--dark` |
| `#download` | 下载 | 3 个标签页：安装版 / 便携版 / 全部文件 |
| `#guide` | 使用说明 | 11 张卡片 + 8 步轨道 |
| `#compare` | 横向对比 | 4 列对比表 |
| `#faq` | 常见问题 | `<details>` 折叠 |
| `#credits` | 鸣谢 | 上游项目致谢 |
| — | 未成年人声明 | `国新出发〔2021〕14号` 依据 |
| — | CTA 横幅 | 底部下载引导 |

### Hero 双栏

```html
<section class="hero">
  <div class="hero__inner">          <!-- grid: 1.06fr / 1fr -->
    <div class="hero__copy">…</div>  <!-- 徽标 / 标题 / 描述 / CTA / 数据 -->
    <div class="hero__visual">       <!-- 产品截图 + 浮动标签 -->
      <div class="hero__frame">…</div>
      <div class="hero__chip hero__chip--a">…</div>
    </div>
  </div>
</section>
```

- `.hero__frame` 用 `perspective()` + `rotateY(-6deg)` 做轻量 3D 倾斜，
  hover 时回正；**不要**加图片阴影占位，会跟 `filter: drop-shadow` 叠加。
- `.hero__chip` 用 `floatChip` 动画上下浮动，`<=620px` 时 `display:none`（避免溢出）。
- Hero 截图用的是 **深色版** `shot-home-dark.png`（在深色背景上不违和）。

### Bento 特性网格

```html
<div class="bento">
  <article class="card card--wide">…</article>  <!-- 跨 2 列 -->
  <article class="card card--tall">…</article>  <!-- 跨 2 行 -->
  <article class="card">…</article>
</div>
```

断点：
- `>1040px`：3 列
- `620–1040px`：2 列，`.card--wide` 仍跨 2 列，`.card--tall` 取消跨行
- `<=620px`：1 列，全部 `span: auto`

### 信任条 `.trust`

4 列无缝拼接（`gap: 1px` + 背景色当分隔线），`<=1040px` 变 2 列，`<=620px` 变 1 列。

### 预览区

```html
<div class="preview">              <!-- grid: 1fr / 300px -->
  <div class="shots">…</div>
  <div class="preview__side">      <!-- position: sticky -->
    <div class="preview__item">…</div>
  </div>
</div>
```

- 每张截图上方有 `.shot__bar`（应用窗口条：三个彩色圆点 + 窗口标题），
  与 Hero 的 `.hero__frame-bar` 是同一套视觉语言。
- `.preview__side` 在 `<=1040px` 时变 `position: static` 且两列。

### 下载页签

`.dl-tab` 里内联 SVG 图标 + 「推荐」徽标（`.dl-tab em`），
带 `role="tablist"` / `role="tab"` / `aria-selected`。

### 鸣谢卡

每张卡顶部有 `.credit__mark` 字母徽标（42×42 圆角方块，金紫渐变底）。

### 声明区

`.notice__cols` 两栏并排「关于责任」与「给监护人的建议」，`<=620px` 变一栏。

### 对比表

`.cmp__hl` 整列淡金底 + 左右内阴影描边，thead 用 `position: sticky`。

### 页脚

顶部渐变细线（`.footer::before`），链接 hover 出现从左展开的金色下划线。

### CTA 横幅 `.cta`

底部渐变卡片，`margin: 0 auto 108px` 居中；`<=860px` 内边距收窄，
`<=620px` 按钮占满宽度。

### 导航

- `.brand__ver` 版本徽标
- `.nav__progress` 顶部滚动进度条，由 `main.js` 的 `initNav()` 驱动：
  `width = scrollY / (scrollHeight - clientHeight) * 100%`
- `.nav__btn` 是导航里的「立即下载」按钮（金色实心）

---

## 使用说明区块

`index.html` 里的 `#guide` 区块是面向最终用户的《使用说明》，分 11 张卡片：

| 编号 | 主题 | 对应 id |
| --- | --- | --- |
| 01 | 安装与放行安全提示 | `#g-install` |
| 02 | 首次启动向导（4 步） | `#g-setup` |
| 03 | 添加账号 | `#g-account` |
| 04 | 安装游戏（实例） | `#g-install-game` |
| 05 | 网络设置 | `#g-network` |
| 06 | 内存与 Java 设置 | `#g-java` |
| 07 | 装模组与整合包 | `#g-store` |
| 08 | 外观与主题 | `#g-theme` |
| 09 | 进阶：命令面板与手柄 | `#g-advanced` |
| 10 | 隐藏功能：离线运行完整版 | `#g-hidden` |
| 11 | 必读注意事项 | `#g-pitfall` |

> **所有界面文案都取自 Lumen v0.2.3 实机运行界面**（CDP 连运行中的 Electron 抓
> `document.body.innerText`），不是根据 Minecraft 启动器通用经验推测的。
> 升级启动器后若界面文案有变，需重新抓取并同步。

### 卡片内部内容块：统一用 `.glist`

「使用说明」11 张卡片里的列表型内容**一律**用 `.glist`，保证外观 / 尺寸 / 形状完全一致：

```html
<ul class="glist">
  <li><b>标题</b><span>描述文字</span></li>
</ul>
```

| 变体 | 用途 | 差异 |
| --- | --- | --- |
| `.glist` | 默认 | `padding: 13px 16px`，圆角 `--r-sm`，背景 `--bg-2`，1px 边框，字号 13.6px |
| `.glist--steps` | 有序步骤（01 安装、02 向导） | 左侧留 48px，放金色编号圆点 |
| `.glist--grid` | 双列短标签（07 商店） | 两列网格，**内边距与字号与基准一致** |
| `.glist--warn` | 注意事项（11 必读） | 红色描边 + 淡红底，标题变红 |

配套规则（`assets/css/style.css`）：
- `.guide` 用 `display:flex; flex-direction:column`，`.guide-grid` 用 `align-items:stretch`
  → **同一排卡片高度自动对齐**
- `.guide > .tip { margin-top: auto; }` → 末尾提示块贴底，底边齐平
- `.glist > li > b` 才是块级标题；描述里的 `<b>` 保持行内（`.glist > li span b { display:inline }`）

> 改样式时**不要**再引入 `.ticks` / `.auth-list` / `.setting-rows` / `.store-grid` /
> `.wizard__step` / `.guide__steps` —— 这些旧类名已删除（`.ticks` 仅「功能特性」区仍在用）。

---

## 站点上的数据都是实测的

首页的四个数字与对比表里的每一项，都来自实际测量，不是估计值：

| 数字 | 来源 |
| --- | --- |
| 7 项主题配色可调 | `AppearanceItems.vue` 里 7 个 `SettingAppearanceColor`（顶端栏 / 侧边栏 / 主要色 / 卡片 / 背景 / 警告 / 错误） |
| 2308 项单元测试用例 | `pnpm vitest run` → `2308 total | 2250 passed | 35 failed | 21 skipped`（2026-11-03 实跑；失败项为 `locales/en.yaml` 缺失等既有失败） |
| 37 个独立 npm 包 | `pnpm-workspace.yaml` + `packages/*` 实际带 `package.json` 的目录数 |
| 7 种模组加载器 | `ModloaderSelector.vue` 的 `loaders` 常量：Vanilla / Forge / Fabric / Quilt / NeoForged / OptiFine / LabyMod |
| PCL 锁 10 个主题 | `DIFF-vs-XMCL.md` 明确写「锁死 10 个主题」 |
| 简体中文 | `xmcl-keystone-ui/locales/` **只有 `zh-CN.yaml`**，`i18n.ts` 注释写明「ships with a single language」 |

> 顺带一提：**Lumen 只内置简体中文**，不像上游 XMCL 那样有多语言。
> 如果以后要加多语言，`locales/` 目录下加 `en.yaml` 并在 `src/i18n.ts` 的
> `messages` 里注册即可。

---

## 定制

| 想改什么 | 改哪里 |
| --- | --- |
| 配色、圆角、阴影 | `assets/css/style.css` 顶部的 `:root` 变量 |
| 浅色主题 | `assets/css/style.css` 的 `[data-theme="light"]` 变量 |
| 文案 | `index.html`，全中文，结构清晰 |
| 作者 / 版权 | `index.html` 的 `<footer>` 与 `.license` |
| Telegram 链接 | `index.html` 的页脚与鸣谢区 |
| 关闭粒子背景 | 删除 `index.html` 里的 `<canvas id="particles">`，或把 `main.js` 里 `initParticles()` 前的调用注释掉 |

---

## 特性

- **零依赖**：原生 HTML/CSS/JS，无框架、无 CDN、无字体请求、无外部图片
- **完全离线**：断网可用，所有资源都在本地
- **深浅双主题**：右上角切换，选择记在 localStorage
- **响应式**：手机 / 平板 / 桌面自适应，含移动端汉堡菜单
- **无障碍**：语义化标签、`aria` 属性、键盘焦点可见、尊重 `prefers-reduced-motion`
- **健壮**：JS 失效时内容依然完整显示（`<noscript>` 兜底 + 3.5 秒保险丝）

---

## 未成年人使用限制声明

官网底部有一个《未成年人使用限制声明》区块（`index.html` 里的 `.notice`）。

**写法原则：只写能证明的事，不写做不到的事。**

### 历史对照（仅存档，不是当前文案）

> 下面这张表记录的是**已被删除的旧写法**及其问题，供追溯用。
> 页面与代码里都已经不再出现这些句子。

| 原写法 | 问题 | 现在的写法 |
| --- | --- | --- |
| 「因某家长举报……不得已」 | 暴露第三方私人行为，情绪化 | 删掉，直接引法规依据 |
| 「禁止未成年人使用本启动器」 | 应用**实际做不到**——勾选项没有持久化，没有任何年龄核验或时长拦截 | 如实写明「不具备识别使用者年龄或实施时长限制的技术能力」 |
| 「一切后果均由该未成年人的监护人承担」 | 笼统免责，法律上站不住（未成年人仍以自己财产承担相应责任） | 改为「对自身的账号与使用行为负责」+ 监护人依法履行监护职责 |
| 「手机谁给的？密码谁给的？」 | 质问句，且隐含「给了设备＝同意」的争议立场 | 删掉，换成给监护人的三条可执行建议 |

**依据**：《关于进一步严格管理 切实防止未成年人沉迷网络游戏的通知》
（国新出发〔2021〕14号）——第五条定义未成年人为未满 18 周岁公民，
第一条规定未成年人仅可在周五、周六、周日及法定节假日 20:00—21:00 各 1 小时
使用网络游戏。

引用的勾选框文案是应用内原文（`xmcl-keystone-ui/locales/zh-CN.yaml` 的
`minorNotice.accept`，注意是顶层 key，不在 `setup:` 下）：

> 我已年满 18 周岁（或为未成年人的监护人），并已阅读并理解上述声明。

> **注意**：如果以后给启动器接入了实名验证或年龄识别能力，
> 这段声明需要重新改写（尤其是第 3 条措施和「关于责任」一节），
> 否则会出现「声明说做不到、实际做到了」的反差。

### 应用端同步

官网声明与**应用内声明**（`xmcl-keystone-ui/locales/zh-CN.yaml` 的 `minorNotice.*`）
已于 2026-10-25 同步为同一套口径：

| key | 内容 |
| --- | --- |
| `minorNotice.title` | 未成年人使用限制声明 |
| `minorNotice.basis` | 法规依据（国新出发〔2021〕14号） |
| `minorNotice.body` | 3 段：项目性质 / 技术能力边界 / 责任 |
| `minorNotice.emphasis` | 3 条监护建议 |
| `minorNotice.hint` | 给监护人的建议： |
| `minorNotice.accept` | 勾选框原文（**逐字未改**） |

应用端视觉同步改为正式告示样式（金色描边 + 左侧竖条），去掉了原来的
大红框 + 发光标题 —— 因为应用并没有拦截能力，用恐吓式视觉声称「禁止」属于
无法兑现的主张。

---

## 免责声明

本产品并非 Minecraft 官方产品，未经 Mojang Studios 或 Microsoft 官方认可。
Minecraft 是 Mojang Studios 的商标。本项目与 Mojang Studios、Microsoft 无任何关联。
