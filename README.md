# 撕片 SimpleSnap

上传一张照片，快速换上热门风格。名字取自拾景纸刊的视觉签名「撕纸成界」：一撕，一换。

首个风格：**拾景纸刊 scenes-gathered-zine-v1-3**——真景为锚、插画成场、色彩成结构、撕纸成界，把照片变成留白呼吸的纸本拼贴海报。

## 运行

**前置要求：** Node.js

1. 安装依赖：`npm install`
2. 复制 `.env.example` 为 `.env`，填入两组 key：
   - `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` —— 视觉解读大模型（OpenAI 兼容 chat completions）
   - `IMAGE_API_KEY` / `IMAGE_BASE_URL` / `IMAGE_MODEL` / `IMAGE_QUALITY` —— 生图服务（OpenAI 兼容 images API）
3. 启动：`npm run dev`（默认 http://localhost:3456，可用 `PORT` 覆盖）

## 链路

```
源照片 ──► 视觉大模型解读（scenes-gathered-zine-v1-3 system prompt）
             └─► 四段式生图提示词（画幅几何 / 场景保真 / 插画场·结构色·撕纸边·微文本 / 质感与硬避免）
源照片 ──► gpt-image-2 edits（源照片作参考图，保主体特征）──► 成图
```

- 源照片在链路中只读不写；生图走 `images/edits` 接口把原图作为参考传入，保证成图保留主体
- 解读失败兜底：正则提取 JSON；edits 失败兜底：`images/generations` 纯提示词生成

## 技术栈

React 19 · Vite · Tailwind CSS 4 · motion · Express · 霞鹜文楷（自托管 webfont）

## 相关文档

- [PRD.md](PRD.md) —— 产品需求
- [CONTEXT.md](CONTEXT.md) —— 业务词典
- [docs/adr](docs/adr) —— 架构决策记录
