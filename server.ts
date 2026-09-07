import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { AIConfig, analyzePhoto, generateFinalImage, remixPhoto } from './server/core';
import { resolveStyleSkill } from './server/skills';
import { logger, createTraceId, getRecentLogs, clearLogs, LogLevel } from './server/logger';
import { notifyDeploySuccess, notifyErrorAlert } from './server/feishu';

// override: 机器上存在同名全局环境变量（其他项目的 LLM_*），项目 .env 必须优先
dotenv.config({ override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3456;

// Configure body parser with 50mb limit for high-res photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// AI 服务配置：解读走 OpenAI 兼容视觉模型，生图走 new-api 通道的 gpt-image-2
const AI: AIConfig = {
  llmBaseUrl: process.env.LLM_BASE_URL || 'https://api.xkiro.com/v1',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'minimax/minimax-m3:free',
  imageBaseUrl: process.env.IMAGE_BASE_URL || 'https://api.liangrekui.com',
  imageApiKey: process.env.IMAGE_API_KEY || '',
  imageModel: process.env.IMAGE_MODEL || 'gpt-image-2',
  imageQuality: process.env.IMAGE_QUALITY || 'medium',
};

// ==================== API ROUTES ====================

// Server status & config check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasLlm: !!AI.llmApiKey,
    llmModel: AI.llmModel,
    hasImageApi: !!AI.imageApiKey,
    imageModel: AI.imageModel,
    primaryImageEngine: `${AI.imageModel} (edits with reference photo)`,
  });
});

// 日志查询接口（支持按 traceId / level / limit 过滤）
app.get('/api/logs', (req, res) => {
  const traceId = (req.query.traceId as string) || undefined;
  const level = (req.query.level as LogLevel) || undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const logs = getRecentLogs({ traceId, level, limit });
  res.json({ success: true, count: logs.length, logs });
});

// 清空日志接口
app.delete('/api/logs', (req, res) => {
  clearLogs();
  res.json({ success: true, message: '日志已清空' });
});

// Step 1 + 2: 流式海报制作接口（SSE：分步推送真实阶段）
app.post('/api/remix-stream', async (req, res) => {
  const traceId = req.body?.traceId || createTraceId();
  logger.info('HttpApi', `收到流式海报生成请求 /api/remix-stream`, { preset: req.body?.stylePreset }, traceId);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let clientDisconnected = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
      logger.warn('HttpApi', '客户端在流传输完成前断开了连接', null, traceId);
    }
  });

  const sendEvent = (type: string, payload: any) => {
    if (!clientDisconnected && !res.writableEnded && !res.destroyed) {
      try {
        res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
      } catch (err: any) {
        logger.warn('HttpApi', `SSE写入失败: ${err?.message}`, null, traceId);
      }
    }
  };

  // 定时发送 SSE 注释保活帧，防止反向代理和 CDN 掐断空闲通道
  const keepAliveTimer = setInterval(() => {
    if (!clientDisconnected && !res.writableEnded && !res.destroyed) {
      try {
        res.write(': keepalive\n\n');
      } catch {
        // 忽略保活写入异常
      }
    }
  }, 5000);

  try {
    const result = await remixPhoto(
      AI,
      { ...req.body, traceId },
      (stageInfo) => {
        sendEvent('stage', stageInfo);
      }
    );
    sendEvent('complete', { result });
    res.end();
  } catch (error: any) {
    logger.error('HttpApi', `流式生图异常: ${error?.message}`, error?.stack, traceId);
    notifyErrorAlert({
      traceId,
      module: 'RemixStream',
      error: error?.message || '图像处理与生成失败',
    }).catch(() => {});
    sendEvent('error', {
      error: error?.message || '图像处理与生成失败，请稍后重试',
      traceId,
    });
    res.end();
  } finally {
    clearInterval(keepAliveTimer);
  }
});

// 普通接口（兼容无 SSE 的直接 JSON 返回）
app.post('/api/remix', async (req, res) => {
  const traceId = req.body?.traceId || createTraceId();
  logger.info('HttpApi', `收到标准海报生成请求 /api/remix`, null, traceId);
  try {
    const result = await remixPhoto(AI, { ...req.body, traceId });
    return res.json(result);
  } catch (error: any) {
    logger.error('HttpApi', `标准生图异常: ${error?.message}`, error?.stack, traceId);
    return res.status(500).json({
      error: error?.message || '图像处理与生成失败，请稍后重试',
      traceId,
    });
  }
});

// Regenerate or refine using modified prompt
app.post('/api/generate-image', async (req, res) => {
  const traceId = req.body?.traceId || createTraceId();
  try {
    const { prompt, aspectRatio, referenceImage } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '缺少提示词 (Missing prompt)', traceId });
    }

    logger.info('HttpApi', '使用自定义提示词再生图', { promptPreview: prompt.slice(0, 100) }, traceId);
    const result = await generateFinalImage(AI, prompt, aspectRatio || '1:1', referenceImage, traceId);
    return res.json({
      success: true,
      traceId,
      outputImageUrl: result.imageUrl,
      provider: result.provider,
      modelName: result.modelName,
    });
  } catch (error: any) {
    logger.error('HttpApi', `再生图失败: ${error?.message}`, error?.stack, traceId);
    return res.status(500).json({
      error: error?.message || '生成失败，请稍后重试',
      traceId,
    });
  }
});

// Prompt-only synthesis: Run the selected style vision skill without immediate render
app.post('/api/synthesize-prompt', async (req, res) => {
  const traceId = req.body?.traceId || createTraceId();
  try {
    const { image, stylePreset, customNote } = req.body;
    if (!image) {
      return res.status(400).json({ error: '请上传照片', traceId });
    }

    const skill = resolveStyleSkill(stylePreset);
    logger.info('HttpApi', `单独提示词推演 [${skill.name}]`, null, traceId);
    const data = await analyzePhoto(
      AI,
      image,
      `${skill.systemPrompt}\n用户风格需求: "${stylePreset || skill.id}"\n附加说明: "${customNote || `请提取并升华为 ${skill.name} 提示词`}"\n请输出 JSON:`,
      traceId
    );
    return res.json({ success: true, traceId, data });
  } catch (error: any) {
    logger.error('HttpApi', `提示词分析失败: ${error?.message}`, error?.stack, traceId);
    return res.status(500).json({ error: error?.message || '提示词分析失败', traceId });
  }
});

// 全局异常处理中间件（拦截客户端网络断开 request aborted 或体积超限等异常）
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    logger.warn('HttpApi', '上传内容超出限制 (413 Payload Too Large)');
    if (!res.headersSent) {
      return res.status(413).json({ error: '上传的图片体积过大，请在前端压缩后上传' });
    }
    return;
  }
  if (err?.code === 'ECONNRESET' || err?.type === 'request.aborted' || err?.message?.includes('request aborted')) {
    logger.warn('HttpApi', '客户端连接提前中断 (request aborted)');
    return;
  }
  logger.error('HttpApi', `服务请求异常: ${err?.message}`, err?.stack);
  if (!res.headersSent) {
    res.status(err?.status || 500).json({ error: err?.message || '服务器内部异常' });
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

  app.listen(PORT, '0.0.0.0', async () => {
    logger.info('System', `Server running on http://0.0.0.0:${PORT}`);
    const hostUrl =
      process.env.APP_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      `https://simple-snap.onrender.com`;

    notifyDeploySuccess({
      serviceUrl: hostUrl,
      llmModel: AI.llmModel,
      imageModel: AI.imageModel,
      port: PORT,
      environment: process.env.NODE_ENV || 'production',
    }).catch(() => {});
  });
}

startServer();
