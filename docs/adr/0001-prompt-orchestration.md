# 0001 — 薄壳 LLM + 4 段式 Prompt 模板

- 状态: 接受
- 日期: 2025-09-03
- 范围: Demo v1

## 背景

scenes-gathered-zine-v1-3 是一个 markdown 流程型 skill，自带 4 段式 prompt 结构、Scene Card、Abstraction Map、Chromatic Structure Engine、Quality Gate。它不是 API，无法"被调用"——必须由"会执行它的 Agent" 加载。

## 决策

**Demo v1 走"薄壳 LLM + skill 4 段式作模板"路线**：

1. 后端把 scenes-gathered-zine-v1-3 的"Prompt Shape"章节（4 段式结构）作为 **prompt 模板字符串**嵌入 system prompt。
2. LLM 在 system prompt 引导下，自己读图、自己填充 4 段式内容。
3. 不真正"调用 skill"——skill 的方法论以**约束**形式存在，而不是以**代码**形式存在。

## 后果

- **正**:
  - 0 外部依赖（不需要长期运行的 Agent 进程），PRD 一天可写完。
  - skill 的所有硬约束（4 段结构、Scene Card、撕纸边、单一色块、文字长度限制）以模板形式强制生效。
  - 后端只需一个 HTTP 接口，调用 OpenAI 兼容 Chat Completion + GPT-image 即可。
- **负**:
  - 提示词质量依赖 LLM 自身对齐能力。GPT-image 输出的稳定性**未经验证**（需要 demo 实跑）。
  - 同一张照片、不同 LLM 出的 prompt 会有差异（这是不可消除的代价）。
  - skill 的"Quality Gate"（v1.3 末尾 30+ 条自检）无法在代码层强制，需要在 PRD 验收阶段用人工抽样。
- **可逆性**: 中等。后期可平滑升级到"代码层复刻 skill 4 段式结构"，不影响接口契约。

## 备选

- **P2 — 服务端跑 Agent CLI**: 维护成本高，Demo 阶段不取。
- **P3 — 完全复刻 skill 为代码**: 工期数周，超出 demo 范围。

## 升级路径

如果 Demo 实跑发现 prompt 质量不稳 → 升级到 P3（将 4 段式结构 + Scene Card 抽象为后端函数，LLM 只负责"看图 + 返回结构化 JSON"）。
