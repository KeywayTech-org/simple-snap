// 与运行时无关的 AI 链路核心：Express（server.ts）与 Cloudflare Worker（worker.ts）共用
import { resolveStyleSkill } from './skills';

export interface AIConfig {
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  imageBaseUrl: string;
  imageApiKey: string;
  imageModel: string;
  imageQuality: string;
}

// Helper to extract base64 data and mimeType from data URL
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  // Fallback if raw base64 or other format
  return { mimeType: 'image/jpeg', base64: dataUrl.replace(/^data:[^;]+;base64,/, '') };
}

// base64 → 二进制（避免依赖 Node Buffer，Worker/Node 两端通用）
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// 解读阶段：视觉模型读图并产出结构化 zine 数据（OpenAI 兼容 chat completions）
export async function analyzePhoto(
  config: AIConfig,
  imageDataUrl: string,
  instruction: string
): Promise<Record<string, any>> {
  if (!config.llmApiKey) {
    throw new Error('LLM_API_KEY 未配置，无法进行照片解读');
  }
  const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llmApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel,
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
  // 剥离可能存在的 markdown 格式代码块
  const cleanedText = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
  try {
    return JSON.parse(cleanedText);
  } catch {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('解读模型未返回有效 JSON');
  }
}

// 画幅比例 → gpt-image 支持的尺寸
export function mapImageSize(aspectRatio: string): string {
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
export async function generateFinalImage(
  config: AIConfig,
  prompt: string,
  aspectRatio: string = '1:1',
  referenceImageDataUrl?: string
): Promise<{ imageUrl: string; provider: string; modelName: string }> {
  if (!config.imageApiKey) {
    throw new Error('IMAGE_API_KEY 未配置，无法生成图像');
  }
  const headers = { Authorization: `Bearer ${config.imageApiKey}` };
  const size = mapImageSize(aspectRatio);

  // 路径 A：edits 接口，源照片作为参考图传入，保证成图保留主体特征
  if (referenceImageDataUrl) {
    try {
      console.log('Attempting gpt-image-2 edits with reference photo...');
      const { mimeType, base64 } = parseDataUrl(referenceImageDataUrl);
      const fd = new FormData();
      fd.append('model', config.imageModel);
      fd.append('image', new Blob([base64ToBytes(base64)], { type: mimeType }), 'source.png');
      fd.append('prompt', prompt);
      fd.append('n', '1');
      fd.append('size', size);
      fd.append('quality', config.imageQuality);

      const response = await fetch(`${config.imageBaseUrl}/v1/images/edits`, {
        method: 'POST',
        headers,
        body: fd,
        signal: AbortSignal.timeout(300_000),
      });
      if (response.ok) {
        const data = await response.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (b64) {
          return { imageUrl: `data:image/png;base64,${b64}`, provider: 'new-api', modelName: config.imageModel };
        }
        if (data?.data?.[0]?.url) {
          return { imageUrl: data.data[0].url, provider: 'new-api', modelName: config.imageModel };
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
  const response = await fetch(`${config.imageBaseUrl}/v1/images/generations`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.imageModel,
      prompt,
      n: 1,
      size,
      quality: config.imageQuality,
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
    return { imageUrl: `data:image/png;base64,${b64}`, provider: 'new-api', modelName: config.imageModel };
  }
  if (data?.data?.[0]?.url) {
    return { imageUrl: data.data[0].url, provider: 'new-api', modelName: config.imageModel };
  }
  throw new Error('未能从生图模型获取图像');
}

export interface RemixPayload {
  image: string;
  stylePreset?: string;
  customNote?: string;
  aspectRatio?: string;
}

// Step 1 + 2: Full Remix（照片解读 → 风格 skill 编排提示词 → 生图），返回给前端的完整载荷
export async function remixPhoto(
  config: AIConfig,
  { image, stylePreset, customNote, aspectRatio }: RemixPayload
): Promise<Record<string, any>> {
  const startTime = Date.now();

  const skill = resolveStyleSkill(stylePreset);
  const userStyleContext = `
用户指定的艺术风格预设: "${stylePreset || skill.id}"
用户附加需求: "${customNote || `请保留原图人物/主体的神态与核心特征，强化 ${skill.name} 艺术杂志质感`}"
目标画幅比例: "${aspectRatio || '1:1'}"
`;

  console.log(`Invoking ${skill.id} skill on uploaded photo...`);
  const zineData = await analyzePhoto(config, image, `${skill.systemPrompt}\n${userStyleContext}\n请现在读取该图片，输出结构化 JSON：`);

  const generatedPrompt = zineData.prompt || 'A cinematic editorial paper poster, 35mm film grain, analog aesthetic.';
  console.log('Generated Zine Prompt:', generatedPrompt);

  console.log('Executing image generation with prompt...');
  const imageResult = await generateFinalImage(config, generatedPrompt, aspectRatio || '1:1', image);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  return {
    success: true,
    title: zineData.title || 'Scenes Gathered Zine · 视觉特辑',
    zineVolume: zineData.zineVolume || 'Vol. 13',
    summary: zineData.summary || `已融合原图视觉基底与所选风格 (${skill.name}) 的版式美学。`,
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
  };
}
