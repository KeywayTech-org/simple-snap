# 拾景纸刊 · Demo v1 PRD

> "把一张普通照片，变成一张安静的 3:5 竖版纸刊海报。"
> 第一版 Demo：展示核心链路，不做登录、存储、分享、付费。

| 项目 | 说明 |
| --- | --- |
| 版本 | v0.1 (Draft) |
| 状态 | 等待评审 |
| 范围 | Demo v1，链路验证 |
| 不在范围 | 账号、存储、分享、付费、安全扫描、多尺寸 |
| 实现阶段 | 阶段 A：前端 + Mock 后端（本次）。阶段 B：接真 LLM + GPT-image。 |
| 模式 | Persuade + Operate（详见 §9.1） |
| 技术栈 | Vite + React 18 + TS + Tailwind + framer-motion + reactbits |

---

## 1. 一句话

用户上传一张照片 → 大模型按 scenes-gathered-zine-v1-3 读图生成 4 段式 prompt → GPT-image 生成 3:5 竖版拾景纸刊海报 → 用户下载到本地，可重做（改色 / 改语言 / 改微文本）。

## 2. 用户故事

| ID | 角色 | 故事 | 验收 |
| --- | --- | --- | --- |
| US-1 | 首次访问用户 | 我打开页面，希望立刻看到上传入口 | 落地页就是上传区，无需任何说明页 |
| US-2 | 移动端用户 | 我想直接拍照上传 | 点击上传区弹出"拍照 / 从相册选"双选项（iOS Safari / Android Chrome 原生行为） |
| US-3 | 桌面端用户 | 我想从本地选一张 | 弹出系统文件选择器，仅显示图片 |
| US-4 | 上传中用户 | 我想知道"现在卡在哪" | 进度条三段：上传中 → AI 解读中 → 正在创作，每段独立 label |
| US-5 | 等待中的用户 | 我知道预估耗时 | 三段 label 后跟"约 X 秒"提示，文本固定（5s / 10s / 30s） |
| US-6 | 收到结果的用户 | 我看到作品 | 作品图全屏铺满 3:5 竖版（手机屏幕留黑边） |
| US-7 | 好奇的用户 | 我想知道"做了什么" | 作品图下方一个"创作思路"折叠区，点击展开一段 1-3 句中文 |
| US-8 | 想保存的用户 | 我想下载到本地 | 底部"保存到相册"按钮，触发浏览器原生下载，文件名 `savescene-{timestamp}.png` |
| US-9 | 不满意的用户 | 我想换风格再来一次 | 底部"换一张"按钮，弹底部抽屉可改：高纯度色 / 文字语言 / 微文本；点"再来"重新跑链路 |
| US-10 | 失败的用户 | 我要看到清晰提示 | 任意阶段失败：Toast `第 X 步超时/失败，请重试`，并保留源照片可重试 |
| US-11 | 敏感内容的用户 | 我的照片被拒生 | GPT-image 自身拒生时，结果页显示"这张照片暂不支持创作" + 重新上传按钮 |

## 3. 用户流程图

```
┌──────────────┐
│  落地即上传   │  US-1
└──────┬───────┘
       │ 选文件 / 拍照
       ▼
┌──────────────┐
│  阶段 1:上传   │  US-4 上传中…
└──────┬───────┘
       │ 后端返回 ok
       ▼
┌──────────────┐
│  阶段 2:AI 解读 │  US-4 AI 解读中…
└──────┬───────┘
       │ 后端返回 ok
       ▼
┌──────────────┐
│  阶段 3:创作   │  US-4 正在创作…
└──────┬───────┘
       │ ok / fail
       ├─────────────┐
       ▼             ▼
┌──────────────┐  ┌──────────────┐
│  结果页       │  │  Toast 失败   │  US-10
│ (图+思路+按钮) │  │  保留源照片   │
└──────┬───────┘  └──────────────┘
       │ 点"保存"
       ▼
  浏览器下载
  savesce-{ts}.png

  点"换一张"→ 底部抽屉（US-9）
   ├─ 高纯度色: 红/蓝/黄/绿/品红/AI 决定
   ├─ 文字语言: 英文/中文/双语/无
   ├─ 微文本: 文本框（≤ 5 词英文 / ≤ 8 汉字）
   └─ "再来" → 回到"阶段 1"
```

## 4. 功能规格

### 4.1 上传

- 控件：`<input type="file" accept="image/*" capture="environment">`
- 客户端校验：≤ 10 MB；超出弹 Toast `图片过大，请压缩后再试`
- 文件类型：服务端二次校验 `image/jpeg | image/png | image/webp | image/heic`

### 4.2 三阶段进度

- 阶段 1 标题：`上传中…`（约 5 秒）
- 阶段 2 标题：`AI 解读中…`（约 10 秒）
- 阶段 3 标题：`正在创作…`（约 30 秒）
- 阶段间用 250ms 间隔切换 label，避免跳变
- 总耗时硬上限：60s。超 60s 任意阶段未完成 → Toast `创作超时，请重试`

### 4.3 选项

| 选项 | 取值 | 默认 | 备注 |
| --- | --- | --- | --- |
| 高纯度色 | 红 / 蓝 / 黄 / 绿 / 品红 / AI 决定 | AI 决定 | skill 内置 5 色名 |
| 文字语言 | 英文 / 中文 / 双语 / 无 | 英文 | skill 默认英文 |
| 微文本 | 文本框（自由输入） | 空 | 空则由 LLM 自行生成 |

### 4.4 创作思路

- 来源：LLM 在生成 prompt 同一调用中附带返回 1 段中文说明（1-3 句）。
- 展示：作品图下方 `<details>` 折叠区，标题 `创作思路`，展开后淡入 200ms。
- 不展示内容：4 段式 prompt 全文（用户不可见）。

### 4.5 下载

- 触发：`<a download="savescene-{timestamp}.png" href={dataURL}>` 编程式 click
- 文件名格式：`savescene-YYYYMMDD-HHmmss.png`
- 仅 PNG；客户端不上传任何 CDN

### 4.6 重做抽屉

- 触发：结果页"换一张"按钮
- 形态：底部抽屉，从下滑入 250ms
- 包含：3 个选项 + "再来"主按钮 + "取消"次按钮
- 选项保持用户上次选择（除非用户改）
- 第一次生成时无此按钮（首页直接上传，无选项）

### 4.7 失败处理

| 失败 | 表现 |
| --- | --- |
| 上传阶段 HTTP 失败 | Toast `上传失败，请检查网络` |
| 解读阶段超时 | Toast `AI 解读超时，请重试` |
| 创作阶段超时 | Toast `创作超时，请重试` |
| GPT-image 拒生 | 结果页文案 `这张照片暂不支持创作` + 重新上传按钮（不走 Toast） |
| 任何阶段总耗时 > 60s | Toast `操作超时，请重试` |

## 5. 系统架构

> 阶段 A（本次）：所有调用走 `src/api/poster.ts` 的 mock 实现。阶段 B 仅替换该文件为真实 fetch，UI 不动。

### 5.0 Mock 模式

- 阶段 A 不启动任何后端进程。
- 进度由前端 `setTimeout` 模拟：上传 1.2s → 解读 2.0s → 创作 3.5s（可在 `src/api/poster.ts` 顶部常量调整）。
- 返回数据从 `src/mocks/posters.ts` 中按 `hue` 取 5 张预置图（红/蓝/黄/绿/品红各一张）。
- rationale 字段从 `src/mocks/rationales.ts` 中按 `hue + 风格关键词` 组合取 1 段。
- 失败模拟：`hue=ai` 时 5% 概率返回"创作超时"（可在 mock 文件顶部关闭）。

### 5.1 模块

```
┌─────────────────────────────────────┐
│  H5 (移动 Web)                       │
│  - 上传 + 选项                       │
│  - 三阶段进度                         │
│  - 结果展示 + 下载                    │
└──────────────┬──────────────────────┘
               │ 1× HTTP (multipart/form-data)
               ▼
┌─────────────────────────────────────┐
│  Backend (单进程 Node/Python)         │
│  - POST /api/poster                  │
│    ① 接收源照片                      │
│    ② 调用 LLM: 读图 + 4段式 prompt    │
│    ③ 调用 GPT-image: 源照片 + prompt  │
│    ④ 返回 base64 PNG + 创作思路       │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
   LLM API         GPT-image API
 (multimodal)     (image generation)
```

### 5.2 后端单接口契约

```
POST /api/poster
Content-Type: multipart/form-data

请求字段:
  photo:        File   (必填, ≤ 10MB, jpeg/png/webp/heic)
  hue:          string (可选, "red"|"blue"|"yellow"|"green"|"magenta"|"ai", 默认 "ai")
  text_lang:    string (可选, "en"|"zh"|"bi"|"none", 默认 "en")
  micro_text:   string (可选, ≤ 5 词英文 / ≤ 8 汉字, 默认空)

响应 200:
{
  "image":       "data:image/png;base64,...",
  "rationale":   "string, 1-3 句中文"
}

响应 4xx/5xx:
{
  "stage":       "upload"|"interpret"|"create",
  "error":       "string, 人类可读"
}
```

### 5.3 LLM 调用细节

- 模型：multimodal 聊天模型（支持 image input）
- system prompt：嵌入 scenes-gathered-zine-v1-3 的"Prompt Shape"4 段式模板 + 关键约束（撕纸边、单一色块、文字长度、Hard Avoids）
- 输入：源照片 + 用户选项
- 输出 JSON：
  ```json
  {
    "prompt":    "4 段式 prompt 全文...",
    "rationale": "中文 1-3 句..."
  }
  ```
  后端**不返回 prompt 字段给前端**，仅 rationale。

### 5.4 GPT-image 调用

- 接收：源照片（reference）+ 4 段式 prompt
- 输出：3:5 竖版 PNG，base64
- 拒生处理：捕获 API 错误并返回 `stage: "create", error: "rejected"`

## 6. 验收标准（Definition of Done）

- [ ] 移动端浏览器：拍照 / 选图 / 上传 / 进度 / 结果 / 下载 整链 ≤ 60s
- [ ] 三阶段 label 正确切换（人工核对 5 次）
- [ ] 选项默认行为符合 §4.3
- [ ] 抽屉选项可改，重做产出可见差异
- [ ] 失败场景全部命中 §4.7 表现
- [ ] 5 张样本图通过 scenes-gathered-zine-v1-3 Quality Gate 的人工抽样（核心项 5 条：场景可识别 / 撕纸边可见 / 单一色块 / 文字在限定长度内 / 无第二个 hue）

## 7. 风险与不在范围

**风险**

- LLM 输出 prompt 质量不稳 → 见 ADR-0001 升级路径
- GPT-image 拒生率不低 → Demo 阶段可接受；产品化前需评估
- 60s 内 GPT-image 偶发超时 → 见 ADR-0002 升级路径

**明确不在范围**（见 ADR-0003）

账号、存储、分享、付费、营销页、多尺寸。

## 8. 实现阶段

分两阶段实施，**阶段 A 是本次 PRD 的交付目标**。

### 8.1 阶段 A — 前端 + Mock（本 PRD 范围）

- 仅前端，无后端进程
- mock 数据从 `src/mocks/` 取，进度用 `setTimeout` 模拟
- 5 张预置作品图 + 5 段预置创作思路
- 总完成时间约 7s/次（便于反复试错 UI）
- 验收：PRD §6 全部项 + 视觉/动效内部评审通过

### 8.2 阶段 B — 接真接口（不在本 PRD 范围）

- 替换 `src/api/poster.ts` 为真实 fetch
- 接 LLM（multimodal，支持 image input）
- 接 GPT-image
- 真实拒生 / 超时处理
- 阶段 A UI 不变

触发条件：阶段 A 通过内部评审 + API 预算确定（详见 ADR-0004）。

## 9. 界面设计

### 9.1 产品模式（impeccable 视角）

本产品是 **Persuade + Operate 双模**：

- **首页 / 结果页** = Persuade：让用户"相信这张图值得保存"，需要视觉权威、安静、有重量感。
- **进度页 / 抽屉** = Operate：让用户知道"现在在做什么"，需要可扫读、状态清晰、无歧义。

视觉优先级：**结果页 ≫ 进度页 > 首页**。Demo 时间分配建议 6:2:2。

### 9.2 视觉语言

拾景纸刊的视觉权威**直接来自其内容**（撕纸边、单一色、奶油纸、限制色板）。UI 的职责是**退后**，让作品成为视觉中心。

**调色板**

```
--paper:    #F2EAD7  /* 奶油纸底 */
--ink:      #1A1814  /* 深墨字 */
--ink-soft: #6B6357  /* 副文字 */
--rule:     #C8BDA3  /* 分割线 / 弱边界 */
--accent:   #C8392E  /* 唯一品牌色，限用于 CTA 与状态高亮 */
```

5 个高纯度色（用户选项 + mock 数据色相）：

```
--hue-red:     #C8392E
--hue-blue:    #1B3F8C
--hue-yellow:  #E8B82D
--hue-green:   #2F7A4D
--hue-magenta: #B8267A
```

**字体**

- 标题：`Fraunces`（衬线，张力强，匹配纸刊感）
- 正文 / UI：`Inter`（无衬线，可读性优先）
- 微文本：手写感 `Caveat`（仅结果页用，不出现在 UI 文案里）

**两个铁律**

- 整站只有 1 个品牌强调色（accent）。状态色靠 ink + opacity，不引入第二套彩色。
- 整站只有 1 处大字号（结果页作品图），其它全部小字。

### 9.3 信息架构与组件映射

| 页面区块 | 组件 | 视觉权重 | reactbits 选型 |
| --- | --- | --- | --- |
| 全站背景 | WebGL 流体背景 | 极轻（呼吸感） | `Silk` 或 `Iridescence`（见 §10.1） |
| 首页上传区 | 居中卡片 | 居中焦点 | `SpotlightCard`（hover 时墨点跟随） |
| 进度条 | 三段步骤 | 中 | `Stepper`（framer-motion） |
| 结果页作品 | 全屏图 | **最大** | `Stack`（轻微 3D 倾斜 + 入场旋转） |
| 结果页创作思路 | 折叠抽屉 | 弱 | `BlurText`（展开时逐字淡入） |
| 重做抽屉 | 底部抽屉 | 中 | `AnimatedContent`（上滑入场） |
| 选项高亮 | 当前选中态 | 中 | `Magnet`（hover 时按钮轻微吸附） |
| 加载装饰 | 噪点叠加 | 极轻 | `Noise`（5% 透明度） |

### 9.4 关键页面布局

**首页（落地即上传）**

```
┌─────────────────────────────────┐
│  [WebGL 流体背景 - 极轻呼吸]      │
│                                 │
│       · 拾景 ·                  │ ← Fraunces 28pt, ink-soft
│                                 │
│      ┌──────────────┐           │
│      │              │           │ ← SpotlightCard
│      │  放一张照片  │           │    60vw / 70vh max
│      │  开始创作     │           │    paper 底
│      │              │           │
│      └──────────────┘           │
│                                 │
│   支持 jpg / png / heic · 10MB  │ ← Inter 12pt, ink-soft
└─────────────────────────────────┘
```

**进度页**

```
┌─────────────────────────────────┐
│  · 拾景 ·                       │
│                                 │
│   ┌───────────────────────────┐ │
│   │ [✓] 1. 上传中…    (已完成)   │ │ ← Stepper 垂直
│   │ [●] 2. AI 解读中…  (进行中)   │ │
│   │ [○] 3. 正在创作…    (等待)    │ │
│   └───────────────────────────┘ │
│                                 │
│      约 7 秒后完成                │ ← 12pt, ink-soft
│                                 │
│       [Noise 噪点 5%]            │
└─────────────────────────────────┘
```

**结果页**

```
┌─────────────────────────────────┐
│  · 拾景 ·             [× 重新上传]│
│                                 │
│   ┌─────────────────────┐       │
│   │                     │       │ ← Stack 3D 倾斜
│   │   3:5 竖版作品图      │       │    1.05 ratio
│   │                     │       │    入场：从下淡入 + 旋转 2°
│   │                     │       │
│   └─────────────────────┘       │
│                                 │
│   ▸ 创作思路           ▼        │ ← 折叠区
│   [展开后 BlurText 逐字]          │
│                                 │
│  [保存到相册]      [换一张]     │ ← 双 CTA
└─────────────────────────────────┘
```

**重做抽屉**

```
┌─────────────────────────────────┐
│ ── 拖动条 ──                     │
│                                 │
│  色相                            │
│  [红][蓝][黄][绿][品红][AI 决定] │ ← Magnet, 当前选中 accent
│                                 │
│  文字语言                         │
│  [英文][中文][双语][无]           │
│                                 │
│  微文本（可选）                   │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│       [   再来一次   ]           │ ← accent 主按钮
└─────────────────────────────────┘
```

### 9.5 暗色模式

Demo 阶段仅做亮色（拾景纸刊本身就是纸的隐喻，暗色破坏产品语义）。

### 9.6 可访问性底线

- 全部交互元素键盘可达（Tab 顺序：上传区 → 选项 → CTA）
- focus 态用 2px accent 描边（不靠颜色单一区分）
- 文案对比度 ≥ 4.5:1（ink on paper 14.8:1，远超）
- 动效全部支持 `prefers-reduced-motion: reduce`，自动降级为瞬时

## 10. 动效设计计划

### 10.1 选型原则

拾景纸刊的视觉权威**依赖安静**。动效的职责是**承接注意力，不是抢注意力**。因此：

- 不用粒子爆炸 / 不用霓虹 / 不用 glitch。
- 全部动效遵守一个原则：**进慢出快**（ease-out, 250-500ms），离开更快（150ms）。
- 全部动效可被 `prefers-reduced-motion` 一键关掉。

### 10.2 全站背景动效（WebGL）

**reactbits: `Silk`**（首选）或 `Iridescence`（备选）

- 角色：整站底层"呼吸"层，让空白页不死板。
- 强度：极低（Speed=0.3, Scale=0.5, Noise=0.05）。
- 性能：Canvas 在低端机降级为静态 paper 渐变。
- 切换：路由不变时持续呼吸；路由变化时**不重绘**（避免闪烁）。

**为何不选更炫的 `Hyperspeed` / `Balatro` / `LiquidChrome`**：这些组件色彩饱和度高，会与作品图抢视觉焦点，违反"作品图是唯一大字号"的铁律。

### 10.3 页面级时间线

| 路由 | 入场 | 出场 |
| --- | --- | --- |
| `/` → 上传 | SpotlightCard 缩放 0.95→1.0，opacity 0→1，400ms ease-out | fade out 150ms |
| 上传 → `/processing` | 上传区向上推 24px + fade out；Stepper 从右侧滑入 350ms | — |
| `/processing` → `/result` | Stepper 收缩 fade out；作品 Stack 从下方淡入 + 旋转 0°→2°，600ms ease-out | — |
| 抽屉入场 | AnimatedContent 从底部 100% 滑入，250ms ease-out | 反向 200ms |
| 创作思路展开 | BlurText 逐字 blur 8px→0 + opacity 0→1，每字 35ms | 反向 100ms |

### 10.4 组件级微交互

| 元素 | 状态 | 动效 |
| --- | --- | --- |
| 上传卡片 | hover | SpotlightCard 墨点向光标处移动（80ms 跟随） |
| 上传卡片 | 拖入文件 | 边框由 ink-soft 变 accent，180ms |
| 上传按钮 | 点击 | scale 1→0.96→1，120ms（按下回弹） |
| Stepper 当前步 | 激活 | 圆点 scale 1→1.15，脉冲 1.4s 循环（极轻） |
| Stepper 完成步 | 切换 | ✓ 字符 fade-in 200ms |
| 选项按钮（色相/语言） | hover | Magnet 吸附 ±4px |
| 选项按钮 | 选中 | 底色 ink，文字 paper，180ms 切换 |
| 微文本输入框 | focus | 边框 ink-soft → ink，150ms |
| 主 CTA（再来 / 保存） | hover | 背景由 accent-soft → accent，200ms |
| 主 CTA | 点击 | scale 0.97 100ms |
| 作品图（Stack） | 持续 | 鼠标悬停时倾斜 1°→3°（基于光标位置），离开回正 |
| 创作思路 ▶ | 点击 | 旋转 0°→90°，200ms ease-out |
| Toast 出现 | 失败 | 自顶滑入 24px + fade in，250ms；3.5s 后自滑出 |
| 抽屉背景遮罩 | 抽屉开 | opacity 0→0.5，250ms |

### 10.5 动效总预算

- 单次路由切换总动效时长 ≤ 800ms
- 任意时刻全屏同时进行的循环动效 ≤ 2 个（背景呼吸 + Stepper 脉冲）
- `prefers-reduced-motion: reduce` 时：所有动效退化为 0ms，仅保留 opacity 切换

## 11. 技术栈与依赖

### 11.1 选型

| 层 | 选型 | 理由 |
| --- | --- | --- |
| 构建 | Vite 5 | 启动快，HMR 适合 demo 反复调 |
| 框架 | React 18 + TypeScript | reactbits 全部组件基于 React |
| 样式 | Tailwind CSS 3 + CSS 变量 | 调色板用 CSS 变量驱动，避免硬编码 |
| 动效 | framer-motion + reactbits | 覆盖 95% 动效需求；不引 GSAP（多 30KB） |
| WebGL | ogl（reactbits 内部依赖） | reactbits 已带 |
| 路由 | react-router v6 | 仅 2 路由，简单 |
| 状态 | React Context + useState | 无 Redux/Zustand 必要 |
| 后端 | 阶段 A：无（mock）。阶段 B：Node + Express 单文件 | 见 ADR-0004 |
| 部署 | 阶段 A：Vercel 静态。阶段 B：Vercel Serverless | 免运维 |

### 11.2 依赖清单

**生产依赖**

```
react
react-dom
react-router-dom
framer-motion
ogl                         // reactbits Iridescence 用
@react-three/fiber          // reactbits Silk 用
three                       // reactbits Silk 用
```

**reactbits 组件（按需安装）**

```
reactbits/Silk            → 背景
reactbits/SpotlightCard   → 上传区
reactbits/Stepper         → 三段进度
reactbits/Stack           → 结果作品
reactbits/BlurText        → 创作思路展开
reactbits/AnimatedContent → 抽屉
reactbits/Magnet          → 选项按钮
reactbits/Noise           → 噪点叠加
```

**dev 依赖**

```
vite
typescript
@vitejs/plugin-react
tailwindcss
postcss
autoprefixer
```

### 11.3 目录结构

```
src/
├── api/
│   └── poster.ts          ← mock 实现（阶段 A）；阶段 B 替换为真实 fetch
├── mocks/
│   ├── posters.ts         ← 5 张预置图（base64 或 CDN）
│   └── rationales.ts      ← 5 段预置创作思路
├── components/
│   ├── Background.tsx     ← Silk/Iridescence 包装
│   ├── UploadCard.tsx     ← SpotlightCard 包装
│   ├── StepProgress.tsx   ← Stepper 包装
│   ├── PosterView.tsx     ← Stack 包装
│   ├── RationalePanel.tsx ← BlurText 包装
│   ├── RedoDrawer.tsx     ← AnimatedContent 包装
│   ├── HuePicker.tsx      ← Magnet 包装
│   ├── LangPicker.tsx
│   ├── TextInput.tsx
│   ├── NoiseLayer.tsx
│   └── Toast.tsx
├── pages/
│   ├── HomePage.tsx       ← /
│   ├── ProcessingPage.tsx ← /processing
│   └── ResultPage.tsx     ← /result
├── lib/
│   ├── colors.ts          ← 调色板常量
│   ├── motion.ts          ← framer-motion variants 集中地
│   └── download.ts        ← 浏览器下载工具
├── types/
│   └── poster.ts          ← 响应类型
├── App.tsx
├── main.tsx
└── index.css
```

### 11.4 mock 数据约定

`src/mocks/posters.ts` 5 张图要求：

- 3:5 竖版 PNG（建议 900×1500 或 1200×2000）
- 主体明确，便于 demo 时讲解（人物 / 风景 / 静物各 1，剩余 2 自选）
- 文件大小 ≤ 500KB（base64 后 ≤ 700KB），保证 demo 流畅

`src/mocks/rationales.ts` 5 段文案要求：

- 1-3 句中文
- 描述"做了什么"，不描述"用户上传了什么"
- 风格符合拾景纸刊的克制语气，避免"惊艳""绝美"等广告词

## 12. 附录：相关文件

- `CONTEXT.md` — 业务词汇表
- `docs/adr/0001-prompt-orchestration.md` — 薄壳 LLM + 4 段式 prompt 模板
- `docs/adr/0002-three-stage-progress.md` — 三阶段进度
- `docs/adr/0003-demo-scope.md` — Demo 范围与不做项
- `docs/adr/0004-mock-first.md` — 阶段 A 前端 + Mock，阶段 B 接真接口
