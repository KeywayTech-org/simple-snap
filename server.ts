import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// override: 机器上存在同名全局环境变量（其他项目的 LLM_*），项目 .env 必须优先
dotenv.config({ override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3456;

// Configure body parser with 50mb limit for high-res photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// AI 服务配置：解读走 OpenAI 兼容视觉模型，生图走 new-api 通道的 gpt-image-2
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.b.ai/v1';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen3.8-flash';
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || 'https://api.liangrekui.com';
const IMAGE_API_KEY = process.env.IMAGE_API_KEY || '';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gpt-image-2';
const IMAGE_QUALITY = process.env.IMAGE_QUALITY || 'medium';

// scenes-gathered-zine-v1-3 Skill 定义：解读模型的 system prompt
// 提炼自 skill 原文（真景为锚、插画成场、色彩成结构、撕纸成界、纸面会呼吸）
const SCENES_GATHERED_ZINE_SKILL_PROMPT = `
You are the art director executing the skill "scenes-gathered-zine-v1-3" (拾景纸刊): transform the supplied photo into a tactile minimal paper-collage zine poster that anchors truthful photography inside a spacious, source-derived abstract illustration field.

## Signature (must all be present)
真景为锚 (truthful photo anchor) · 插画成场 (illustration as a large field) · 色彩成结构 (one hue as compositional structure) · 撕纸成界 (hand-torn paper boundary) · 纸面会呼吸 (breathing negative space).

## Decision priority (resolve conflicts in this order)
1. Preserve the scene's identity and key spatial relationships.
2. Keep the photographic portion truthful (natural color, texture, perspective).
3. Simplify complex organic/repetitive detail into a few large legible masses.
4. Make the illustration a large designed field, never a small peripheral doodle or a full-scene tracing.
5. Build photo, illustration, and the added hue on the same source-derived compositional skeleton.
6. The added hue changes balance, movement, figure–ground, or meaning — never a detached decoration.
7. Preserve substantial quiet space inside and around the illustration.
8. Preserve a visible hand-torn fibrous photo edge at the primary photo-to-paper handoff.
9. Add exactly one restrained micro-text element without weakening the hierarchy.

## Read the photograph first (Scene Card)
Identify: 1–2 core subjects; 2–3 supporting elements; spatial invariants (horizon, positions, scale, facing, silhouette); dominant gesture (strongest line/direction); visual-weight map; native color atmosphere; 1–2 source-shape candidates that can continue across photo, illustration, and color; natural quiet areas; the semantic minimum that still identifies THIS scene.

## Compile the generation prompt as four compact paragraphs (decisive, visual, English)
1. Canvas & attention geometry: vertical poster ratio, paper surface, flat scanned look, photo/illustration field shares (photo anchor roughly 25–60%), focal area, quiet field, eye path, reserved text area.
2. Scene fidelity: core subjects, spatial invariants, what remains photographic.
3. Illustration field, chromatic structure, torn edge, micro-text: abstraction map (retain / merge / omit / transform / expose — remove roughly 60–80% of small detail); ONE primary illustration grammar (silhouette-led, contour-led, field-led, rhythm-led, or cut-paper-led); illustration field extent 45–70% with 55–75% of it quiet; dense foliage compressed to one main mass + at most a few branch gestures (omit 85–95% of individual leaves); the single added hue with exact saturated color name, source-derived shape, integration mode (source continuation / selective replacement / underprint / counterform / directional rhythm), material, function, and area 2–20%; visible hand-torn contour with a narrow fibrous band (1–4% of short edge) across roughly 35–70% of the photo perimeter; the exact micro-text (see below).
4. Reproduction mood & hard avoids: warm cream aged paper, grain, ink bleed, flat scan light; then prohibitions.

## Micro-text rules
Default to English-only unless the user's note supplies other wording or requests Chinese/bilingual. Supplied wording is reproduced verbatim. Authored text: a standalone word, a 2–4 word keyword sequence with one separator (· / &), or a very short phrase — never a sentence. English ≤5 words; Chinese ≤8 characters. Render as small vintage typewriter / letterpress impression in a quiet paper area, clearly subordinate.

## Hard avoids (state the relevant ones in paragraph 4)
No literal tracing, leaf-by-leaf rendering, dense filigree, timid peripheral illustration, generic abstract motifs, detached color blocks or swatches, multiple added hues, clean digital clipping, sticker outlines, uniform decorative frames, heavy shadows, 3D depth, cinematic lighting, glossy or neon color, cartoon treatment, polished digital typography, bold all-caps, logos, watermarks, dates/serial metadata, illegible text.

## Output
Respond ONLY with valid JSON (no markdown fences) conforming to:
{
  "title": "Short poetic English zine headline, e.g. 'Vol. 07 · Afterimage of the City'",
  "zineVolume": "e.g. 'VOL.01' or 'Vol. 13 · Summer Issue'",
  "summary": "1–2 句中文创作思路：说明源生构图决定与加入色的结构作用，不暴露提示词细节",
  "analysis": {
    "subject": "核心主体与空间关系（中文）",
    "lighting": "光影分析与编辑方向（中文）",
    "palette": ["3–5 个色名，含建议的单一加入色"],
    "mood": "情绪关键词（中文）"
  },
  "tags": ["Scenes Gathered", "Zine v1.3", 3–5 个风格标签],
  "prompt": "The complete four-paragraph English generation prompt per the rules above. It will be sent verbatim to gpt-image-2 together with the source photo as reference."
}
`;

// Helper to extract base64 data and mimeType from data URL
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  // Fallback if raw base64 or other format
  return { mimeType: 'image/jpeg', base64: dataUrl.replace(/^data:[^;]+;base64,/, '') };
}

// 解读阶段：视觉模型读图并产出结构化 zine 数据（OpenAI 兼容 chat completions）
async function analyzePhoto(
  imageDataUrl: string,
  instruction: string
): Promise<Record<string, any>> {
  if (!LLM_API_KEY) {
    throw new Error('LLM_API_KEY 未配置，无法进行照片解读');
  }
  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageDataUrl } },
            { type: 'text', text: instruction },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`解读模型请求失败 (${response.status}): ${errText.slice(0, 300)}`);
  }
  const data = await response.json();
  const rawText: string = data?.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('解读模型未返回有效 JSON');
  }
}

// 画幅比例 → gpt-image 支持的尺寸
function mapImageSize(aspectRatio: string): string {
  switch (aspectRatio) {
    case '9:16':
    case '3:4':
      return '1024x1536';
    case '16:9':
    case '4:3':
      return '1536x1024';
    default:
      return '1024x1024';
  }
}

// 生图阶段：优先 edits（带源照片参考图保人物特征），失败回退 generations（纯提示词）
async function generateFinalImage(
  prompt: string,
  aspectRatio: string = '1:1',
  referenceImageDataUrl?: string
): Promise<{ imageUrl: string; provider: string; modelName: string }> {
  if (!IMAGE_API_KEY) {
    throw new Error('IMAGE_API_KEY 未配置，无法生成图像');
  }
  const headers = { Authorization: `Bearer ${IMAGE_API_KEY}` };
  const size = mapImageSize(aspectRatio);

  // 路径 A：edits 接口，源照片作为参考图传入，保证成图保留主体特征
  if (referenceImageDataUrl) {
    try {
      console.log('Attempting gpt-image-2 edits with reference photo...');
      const { mimeType, base64 } = parseDataUrl(referenceImageDataUrl);
      const fd = new FormData();
      fd.append('model', IMAGE_MODEL);
      fd.append('image', new Blob([Buffer.from(base64, 'base64')], { type: mimeType }), 'source.png');
      fd.append('prompt', prompt);
      fd.append('n', '1');
      fd.append('size', size);
      fd.append('quality', IMAGE_QUALITY);

      const response = await fetch(`${IMAGE_BASE_URL}/v1/images/edits`, {
        method: 'POST',
        headers,
        body: fd,
        signal: AbortSignal.timeout(300_000),
      });
      if (response.ok) {
        const data = await response.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (b64) {
          return { imageUrl: `data:image/png;base64,${b64}`, provider: 'new-api', modelName: IMAGE_MODEL };
        }
        if (data?.data?.[0]?.url) {
          return { imageUrl: data.data[0].url, provider: 'new-api', modelName: IMAGE_MODEL };
        }
      } else {
        const errText = await response.text();
        console.warn(`gpt-image-2 edits failed (${response.status}), falling back to generations:`, errText.slice(0, 300));
      }
    } catch (editErr: any) {
      console.warn('gpt-image-2 edits error, falling back to generations:', editErr?.message);
    }
  }

  // 路径 B：generations 接口，纯提示词生成（丢失照片特征，仅兜底）
  console.log('Using gpt-image-2 generations (prompt only)...');
  const response = await fetch(`${IMAGE_BASE_URL}/v1/images/generations`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size,
      quality: IMAGE_QUALITY,
    }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`生图请求失败 (${response.status}): ${errText.slice(0, 300)}`);
  }
  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (b64) {
    return { imageUrl: `data:image/png;base64,${b64}`, provider: 'new-api', modelName: IMAGE_MODEL };
  }
  if (data?.data?.[0]?.url) {
    return { imageUrl: data.data[0].url, provider: 'new-api', modelName: IMAGE_MODEL };
  }
  throw new Error('未能从生图模型获取图像');
}

// ==================== API ROUTES ====================

// Server status & config check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasLlm: !!LLM_API_KEY,
    llmModel: LLM_MODEL,
    hasImageApi: !!IMAGE_API_KEY,
    imageModel: IMAGE_MODEL,
    primaryImageEngine: `${IMAGE_MODEL} (edits with reference photo)`,
  });
});

// Step 1 + 2: Full Remix Endpoint (Upload -> scenes-gathered-zine-v1-3 analysis & prompt -> gpt-image-2 generation)
app.post('/api/remix', async (req, res) => {
  const startTime = Date.now();
  try {
    const { image, stylePreset, customNote, aspectRatio } = req.body;

    if (!image) {
      return res.status(400).json({ error: '请上传待处理的照片 (Missing image payload)' });
    }

    // 1. Invoke vision LLM to inspect the image and execute the scenes-gathered-zine-v1-3 skill
    const userStyleContext = `
用户指定的艺术风格预设: "${stylePreset || '经典独立杂志 (Classic Indie Zine)'}"
用户附加需求: "${customNote || '请保留原图人物/主体的神态与核心特征，强化 scenes-gathered-zine-v1-3 艺术杂志质感'}"
目标画幅比例: "${aspectRatio || '1:1'}"
`;

    console.log('Invoking scenes-gathered-zine-v1-3 skill on uploaded photo...');
    const zineData = await analyzePhoto(image, `${SCENES_GATHERED_ZINE_SKILL_PROMPT}\n${userStyleContext}\n请现在读取该图片，输出结构化 JSON：`);

    const generatedPrompt = zineData.prompt || 'A cinematic scenes-gathered-zine editorial photograph, 35mm film grain, analog aesthetic.';
    console.log('Generated Zine Prompt:', generatedPrompt);

    // 2. Generate final image using gpt-image-2 (or fallback to Gemini image model)
    console.log('Executing image generation with prompt...');
    const imageResult = await generateFinalImage(generatedPrompt, aspectRatio || '1:1', image);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return res.json({
      success: true,
      title: zineData.title || 'Scenes Gathered Zine · 视觉特辑',
      zineVolume: zineData.zineVolume || 'Vol. 13',
      summary: zineData.summary || '已融合原图视觉基底与 scenes-gathered-zine-v1-3 杂志风版式美学。',
      analysis: zineData.analysis || {
        subject: '拍摄主体',
        lighting: '自然光影',
        palette: ['Kodak Gold', 'Editorial Slate', 'Risograph Cyan'],
        mood: '胶片记忆',
      },
      tags: zineData.tags || ['Scenes Gathered Zine', '35mm Film', 'Editorial'],
      prompt: generatedPrompt,
      outputImageUrl: imageResult.imageUrl,
      provider: imageResult.provider,
      modelName: imageResult.modelName,
      durationSeconds: duration,
    });
  } catch (error: any) {
    console.error('Error in /api/remix:', error);
    return res.status(500).json({
      error: error?.message || '图像处理与生成失败，请稍后重试',
    });
  }
});

// Regenerate or refine using modified prompt
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio, referenceImage } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '缺少提示词 (Missing prompt)' });
    }

    console.log('Regenerating image with prompt:', prompt);
    const result = await generateFinalImage(prompt, aspectRatio || '1:1', referenceImage);
    return res.json({
      success: true,
      outputImageUrl: result.imageUrl,
      provider: result.provider,
      modelName: result.modelName,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-image:', error);
    return res.status(500).json({
      error: error?.message || '生成失败，请稍后重试',
    });
  }
});

// Prompt-only synthesis: Run scenes-gathered-zine-v1-3 vision skill without immediate render
app.post('/api/synthesize-prompt', async (req, res) => {
  try {
    const { image, stylePreset, customNote } = req.body;
    if (!image) {
      return res.status(400).json({ error: '请上传照片' });
    }

    const data = await analyzePhoto(
      image,
      `${SCENES_GATHERED_ZINE_SKILL_PROMPT}\n用户风格需求: "${stylePreset || '经典独立杂志'}"\n附加说明: "${customNote || '请提取并升华为 scenes-gathered-zine-v1-3 提示词'}"\n请输出 JSON:`
    );
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in /api/synthesize-prompt:', error);
    return res.status(500).json({ error: error?.message || '提示词分析失败' });
  }
});

// Vite middleware & Static asset serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
