// 与运行时无关的 AI 链路核心：Express（server.ts）与 Cloudflare Worker（worker.ts）共用
import { resolveStyleSkill } from './skills';
import { logger, createTraceId } from './logger';

export interface AIConfig {
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  imageBaseUrl: string;
  imageApiKey: string;
  imageModel: string;
  imageQuality: string;
}

export type RemixStage = 'analyzing' | 'synthesizing' | 'generating' | 'transferring' | 'completed';

export interface RemixStageInfo {
  stage: RemixStage;
  step: number;
  totalSteps: number;
  title: string;
  detail: string;
  progress: number;
  traceId: string;
  timestamp: number;
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
  instruction: string,
  traceId?: string
): Promise<Record<string, any>> {
  const tid = traceId || createTraceId();
  if (!config.llmApiKey) {
    logger.error('AnalyzePhoto', 'LLM_API_KEY 未配置，无法进行照片解读', null, tid);
    throw new Error('LLM_API_KEY 未配置，无法进行照片解读');
  }

  const t0 = Date.now();
  logger.info('AnalyzePhoto', `向解读模型发送视觉分析请求 [${config.llmModel}]`, { url: config.llmBaseUrl }, tid);

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

  const durationMs = Date.now() - t0;
  if (!response.ok) {
    const errText = await response.text();
    logger.error('AnalyzePhoto', `解读模型请求失败 (${response.status})`, { errText: errText.slice(0, 300) }, tid, durationMs);
    throw new Error(`解读模型请求失败 (${response.status}): ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const rawText: string = data?.choices?.[0]?.message?.content || '';
  logger.info('AnalyzePhoto', `解读模型响应完成，内容长度: ${rawText.length}`, null, tid, durationMs);

  // 剥离可能存在的 markdown 格式代码块
  const cleanedText = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
  try {
    const parsed = JSON.parse(cleanedText);
    logger.debug('AnalyzePhoto', 'JSON 解析成功', { title: parsed.title, volume: parsed.zineVolume }, tid);
    return parsed;
  } catch {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      logger.debug('AnalyzePhoto', '正则提取 JSON 解析成功', { title: parsed.title }, tid);
      return parsed;
    }
    logger.error('AnalyzePhoto', '解读模型未返回有效 JSON', { rawHead: rawText.slice(0, 200) }, tid);
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
  referenceImageDataUrl?: string,
  traceId?: string
): Promise<{ imageUrl: string; provider: string; modelName: string }> {
  const tid = traceId || createTraceId();
  if (!config.imageApiKey) {
    logger.error('GenerateImage', 'IMAGE_API_KEY 未配置，无法生成图像', null, tid);
    throw new Error('IMAGE_API_KEY 未配置，无法生成图像');
  }
  const headers = { Authorization: `Bearer ${config.imageApiKey}` };
  const size = mapImageSize(aspectRatio);

  // 路径 A：edits 接口，源照片作为参考图传入，保证成图保留主体特征
  if (referenceImageDataUrl) {
    const t0 = Date.now();
    try {
      logger.info('GenerateImage', `尝试 gpt-image-2 edits 接口（附带源图特征参考）`, { size, quality: config.imageQuality }, tid);
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

      const dur = Date.now() - t0;
      if (response.ok) {
        const data = await response.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (b64) {
          logger.info('GenerateImage', `edits 生成成功 (Base64 数据，长度: ${b64.length})`, null, tid, dur);
          return { imageUrl: `data:image/png;base64,${b64}`, provider: 'new-api', modelName: config.imageModel };
        }
        if (data?.data?.[0]?.url) {
          logger.info('GenerateImage', `edits 生成成功 (URL 地址: ${data.data[0].url})`, null, tid, dur);
          return { imageUrl: data.data[0].url, provider: 'new-api', modelName: config.imageModel };
        }
      } else {
        const errText = await response.text();
        logger.warn('GenerateImage', `gpt-image-2 edits 响应非 200 (${response.status})，降级至 generations 提示词生成`, { err: errText.slice(0, 200) }, tid);
      }
    } catch (editErr: any) {
      logger.warn('GenerateImage', `gpt-image-2 edits 异常，降级至 generations: ${editErr?.message}`, null, tid);
    }
  }

  // 路径 B：generations 接口，纯提示词生成（丢失照片特征，仅兜底）
  const t1 = Date.now();
  logger.info('GenerateImage', `使用 gpt-image-2 generations 接口（纯提示词）`, { size }, tid);
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

  const dur1 = Date.now() - t1;
  if (!response.ok) {
    const errText = await response.text();
    logger.error('GenerateImage', `生图请求失败 (${response.status})`, { err: errText.slice(0, 300) }, tid, dur1);
    throw new Error(`生图请求失败 (${response.status}): ${errText.slice(0, 300)}`);
  }
  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (b64) {
    logger.info('GenerateImage', `generations 生成成功 (Base64 数据，长度: ${b64.length})`, null, tid, dur1);
    return { imageUrl: `data:image/png;base64,${b64}`, provider: 'new-api', modelName: config.imageModel };
  }
  if (data?.data?.[0]?.url) {
    logger.info('GenerateImage', `generations 生成成功 (URL 地址: ${data.data[0].url})`, null, tid, dur1);
    return { imageUrl: data.data[0].url, provider: 'new-api', modelName: config.imageModel };
  }
  logger.error('GenerateImage', '未能从生图模型获取图像', null, tid, dur1);
  throw new Error('未能从生图模型获取图像');
}

export interface RemixPayload {
  image: string;
  stylePreset?: string;
  customNote?: string;
  aspectRatio?: string;
  traceId?: string;
}

// Step 1 + 2: Full Remix（照片解读 → 风格 skill 编排提示词 → 生图），返回给前端的完整载荷
export async function remixPhoto(
  config: AIConfig,
  { image, stylePreset, customNote, aspectRatio, traceId }: RemixPayload,
  onStage?: (stageInfo: RemixStageInfo) => void
): Promise<Record<string, any>> {
  const tid = traceId || createTraceId();
  const startTime = Date.now();
  const skill = resolveStyleSkill(stylePreset);

  const reportStage = (
    stage: RemixStage,
    step: number,
    title: string,
    detail: string,
    progress: number
  ) => {
    const info: RemixStageInfo = {
      stage,
      step,
      totalSteps: 4,
      title,
      detail,
      progress,
      traceId: tid,
      timestamp: Date.now(),
    };
    logger.info('RemixStage', `[${step}/4] ${title} (${progress}%) - ${detail}`, null, tid);
    if (onStage) {
      try {
        onStage(info);
      } catch (err) {
        logger.warn('RemixStage', `onStage 回调执行异常: ${err}`, null, tid);
      }
    }
  };

  logger.info('RemixPhoto', `启动全流程海报重塑，目标风格: ${skill.name} (${skill.id})`, { aspectRatio }, tid);

  // 阶段 1：图片解析中（0% - 25%）
  reportStage('analyzing', 1, '图片解析中', '多模态大模型正在提取原图光影与构图基底...', 15);

  const userStyleContext = `
用户指定的艺术风格预设: "${stylePreset || skill.id}"
用户附加需求: "${customNote || `请保留原图人物/主体的神态与核心特征，强化 ${skill.name} 艺术杂志质感`}"
目标画幅比例: "${aspectRatio || '1:1'}"
`;

  const zineData = await analyzePhoto(
    config,
    image,
    `${skill.systemPrompt}\n${userStyleContext}\n请现在读取该图片，输出结构化 JSON：`,
    tid
  );

  // 阶段 2：灵感生成中（25% - 55%）
  reportStage('synthesizing', 2, '灵感生成中', `结合「${skill.name}」规范编排纸本肌理与四段式提示词...`, 45);

  const generatedPrompt = zineData.prompt || 'A cinematic editorial paper poster, 35mm film grain, analog aesthetic.';
  logger.debug('RemixPhoto', '已生成艺术提示词', { promptPreview: generatedPrompt.slice(0, 150) }, tid);

  // 阶段 3：图片重构中（55% - 88%）
  reportStage('generating', 3, '图片重构中', '调用 gpt-image-2 神经画笔进行纸本撕边与纹理重构...', 70);

  const imageResult = await generateFinalImage(config, generatedPrompt, aspectRatio || '1:1', image, tid);

  // 阶段 4：图片传输中（88% - 100%）
  reportStage('transferring', 4, '图片传输中', '图像产物校验通过，正在编码传输画框呈画...', 95);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info('RemixPhoto', `海报生成全链路圆满完成，耗时: ${duration}s`, { title: zineData.title }, tid);

  // 最终完成状态
  reportStage('completed', 4, '海报呈画完成', '留白成章，墨韵已凝。', 100);

  return {
    success: true,
    traceId: tid,
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
