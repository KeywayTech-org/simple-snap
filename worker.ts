// Cloudflare Worker 入口：静态资产由 wrangler assets 托管，/api/* 由本 Worker 处理
// 与 server.ts（Express 本地版）共用 server/core.ts 的 AI 链路
import { AIConfig, analyzePhoto, generateFinalImage, remixPhoto } from './server/core';
import { resolveStyleSkill } from './server/skills';
import { logger, createTraceId, getRecentLogs, clearLogs, LogLevel } from './server/logger';

interface Env {
  LLM_BASE_URL?: string;
  LLM_API_KEY?: string;
  LLM_MODEL?: string;
  IMAGE_BASE_URL?: string;
  IMAGE_API_KEY?: string;
  IMAGE_MODEL?: string;
  IMAGE_QUALITY?: string;
}

function configFromEnv(env: Env): AIConfig {
  return {
    llmBaseUrl: env.LLM_BASE_URL || 'https://api.xkiro.com/v1',
    llmApiKey: env.LLM_API_KEY || '',
    llmModel: env.LLM_MODEL || 'minimax/minimax-m3:free',
    imageBaseUrl: env.IMAGE_BASE_URL || 'https://api.liangrekui.com',
    imageApiKey: env.IMAGE_API_KEY || '',
    imageModel: env.IMAGE_MODEL || 'gpt-image-2',
    imageQuality: env.IMAGE_QUALITY || 'medium',
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const config = configFromEnv(env);

    if (url.pathname === '/api/status' && request.method === 'GET') {
      return json({
        status: 'ok',
        runtime: 'cloudflare-worker',
        hasLlm: !!config.llmApiKey,
        llmModel: config.llmModel,
        hasImageApi: !!config.imageApiKey,
        imageModel: config.imageModel,
        primaryImageEngine: `${config.imageModel} (edits with reference photo)`,
      });
    }

    if (url.pathname === '/api/logs' && request.method === 'GET') {
      const traceId = url.searchParams.get('traceId') || undefined;
      const level = (url.searchParams.get('level') as LogLevel) || undefined;
      const limit = Number(url.searchParams.get('limit')) || 100;
      const logs = getRecentLogs({ traceId, level, limit });
      return json({ success: true, count: logs.length, logs });
    }

    if (url.pathname === '/api/logs' && request.method === 'DELETE') {
      clearLogs();
      return json({ success: true, message: '日志已清空' });
    }

    if (url.pathname === '/api/remix-stream' && request.method === 'POST') {
      const body = await request.json();
      const traceId = body.traceId || createTraceId();
      logger.info('WorkerApi', `收到流式海报生成请求 /api/remix-stream`, null, traceId);

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      const sendEvent = async (type: string, payload: any) => {
        const text = `data: ${JSON.stringify({ type, ...payload })}\n\n`;
        await writer.write(encoder.encode(text));
      };

      (async () => {
        try {
          const result = await remixPhoto(
            config,
            { ...body, traceId },
            (stageInfo) => {
              sendEvent('stage', stageInfo);
            }
          );
          await sendEvent('complete', { result });
        } catch (err: any) {
          logger.error('WorkerApi', `流式生图异常: ${err?.message}`, err?.stack, traceId);
          await sendEvent('error', {
            error: err?.message || '图像处理与生成失败，请稍后重试',
            traceId,
          });
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    if (url.pathname === '/api/remix' && request.method === 'POST') {
      const body = await request.json();
      const traceId = body.traceId || createTraceId();
      try {
        const result = await remixPhoto(config, { ...body, traceId });
        return json(result);
      } catch (error: any) {
        logger.error('WorkerApi', `标准生图异常: ${error?.message}`, error?.stack, traceId);
        return json({ error: error?.message || '图像处理与生成失败，请稍后重试', traceId }, 500);
      }
    }

    if (url.pathname === '/api/generate-image' && request.method === 'POST') {
      const traceId = createTraceId();
      try {
        const { prompt, aspectRatio, referenceImage } = await request.json();
        if (!prompt) {
          return json({ error: '缺少提示词 (Missing prompt)', traceId }, 400);
        }
        const result = await generateFinalImage(config, prompt, aspectRatio || '1:1', referenceImage, traceId);
        return json({
          success: true,
          traceId,
          outputImageUrl: result.imageUrl,
          provider: result.provider,
          modelName: result.modelName,
        });
      } catch (error: any) {
        logger.error('WorkerApi', `生成失败: ${error?.message}`, error?.stack, traceId);
        return json({ error: error?.message || '生成失败，请稍后重试', traceId }, 500);
      }
    }

    if (url.pathname === '/api/synthesize-prompt' && request.method === 'POST') {
      const traceId = createTraceId();
      try {
        const { image, stylePreset, customNote } = await request.json();
        if (!image) {
          return json({ error: '请上传照片', traceId }, 400);
        }
        const skill = resolveStyleSkill(stylePreset);
        const data = await analyzePhoto(
          config,
          image,
          `${skill.systemPrompt}\n用户风格需求: "${stylePreset || skill.id}"\n附加说明: "${customNote || `请提取并升华为 ${skill.name} 提示词`}"\n请输出 JSON:`,
          traceId
        );
        return json({ success: true, traceId, data });
      } catch (error: any) {
        logger.error('WorkerApi', `提示词分析失败: ${error?.message}`, error?.stack, traceId);
        return json({ error: error?.message || '提示词分析失败', traceId }, 500);
      }
    }

    return json({ error: 'Not Found' }, 404);
  },
};
