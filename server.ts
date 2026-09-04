import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { AIConfig, analyzePhoto, generateFinalImage, remixPhoto } from './server/core';
import { resolveStyleSkill } from './server/skills';

// override: 机器上存在同名全局环境变量（其他项目的 LLM_*），项目 .env 必须优先
dotenv.config({ override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3456;

// Configure body parser with 50mb limit for high-res photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// AI 服务配置：解读走 OpenAI 兼容视觉模型，生图走 new-api 通道的 gpt-image-2
const AI: AIConfig = {
  llmBaseUrl: process.env.LLM_BASE_URL || 'https://api.b.ai/v1',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'qwen3.8-flash',
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

// Step 1 + 2: Full Remix Endpoint (Upload -> style skill analysis & prompt -> gpt-image-2 generation)
app.post('/api/remix', async (req, res) => {
  try {
    return res.json(await remixPhoto(AI, req.body));
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
    const result = await generateFinalImage(AI, prompt, aspectRatio || '1:1', referenceImage);
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

// Prompt-only synthesis: Run the selected style vision skill without immediate render
app.post('/api/synthesize-prompt', async (req, res) => {
  try {
    const { image, stylePreset, customNote } = req.body;
    if (!image) {
      return res.status(400).json({ error: '请上传照片' });
    }

    const skill = resolveStyleSkill(stylePreset);
    const data = await analyzePhoto(
      AI,
      image,
      `${skill.systemPrompt}\n用户风格需求: "${stylePreset || skill.id}"\n附加说明: "${customNote || `请提取并升华为 ${skill.name} 提示词`}"\n请输出 JSON:`
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
