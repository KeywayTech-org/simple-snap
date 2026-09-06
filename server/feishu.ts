// 飞书群自定义机器人通知模块（支持自定义 Webhook 与加签安全验证）
import crypto from 'crypto';
import { logger } from './logger';

export interface FeishuConfig {
  webhookUrl?: string;
  secret?: string;
}

export function getFeishuConfig(): FeishuConfig {
  return {
    webhookUrl: process.env.FEISHU_WEBHOOK_URL || '',
    secret: process.env.FEISHU_SECRET || '',
  };
}

// 飞书签名计算
function generateSignature(timestamp: number, secret: string): string {
  const stringToSign = `${timestamp}\n${secret}`;
  return crypto.createHmac('sha256', stringToSign).update('').digest('base64');
}

// 底层发送卡片或消息
export async function sendFeishuCard(
  card: Record<string, any>,
  config?: FeishuConfig
): Promise<boolean> {
  const cfg = config || getFeishuConfig();
  if (!cfg.webhookUrl) {
    logger.debug('Feishu', '未配置 FEISHU_WEBHOOK_URL，跳过飞书通知');
    return false;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payload: Record<string, any> = {
    msg_type: 'interactive',
    card,
  };

  if (cfg.secret) {
    payload.timestamp = String(timestamp);
    payload.sign = generateSignature(timestamp, cfg.secret);
  }

  try {
    const res = await fetch(cfg.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json().catch(() => ({}));
    if (res.ok && (data.code === 0 || data.StatusCode === 0)) {
      logger.info('Feishu', '飞书通知推送成功');
      return true;
    } else {
      logger.warn('Feishu', `飞书推送失败: [${res.status}] ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err: any) {
    logger.error('Feishu', `飞书推送网络异常: ${err?.message}`);
    return false;
  }
}

// 部署 / 服务启动就绪通知
export async function notifyDeploySuccess(info: {
  serviceUrl: string;
  llmModel: string;
  imageModel: string;
  port?: number | string;
  environment?: string;
}): Promise<boolean> {
  const card = {
    header: {
      title: {
        tag: 'plain_text',
        content: '🚀 撕片 SimpleSnap 部署/启动就绪',
      },
      template: 'green',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: [
            `**服务状态**：🟢 运行中 (200 OK)`,
            `**环境模式**：${info.environment || process.env.NODE_ENV || 'production'}`,
            `**在线地址**：[${info.serviceUrl}](${info.serviceUrl})`,
            `**视觉模型**：\`${info.llmModel}\``,
            `**生图引擎**：\`${info.imageModel}\``,
            `**上线时间**：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
          ].join('\n'),
        },
      },
      {
        tag: 'hr',
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '打开在线应用',
            },
            type: 'primary',
            url: info.serviceUrl,
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '检查状态',
            },
            type: 'default',
            url: `${info.serviceUrl}/api/status`,
          },
        ],
      },
    ],
  };

  return sendFeishuCard(card);
}

// 核心业务异常告警通知
export async function notifyErrorAlert(info: {
  traceId?: string;
  module: string;
  error: string;
  detail?: string;
}): Promise<boolean> {
  const card = {
    header: {
      title: {
        tag: 'plain_text',
        content: '⚠️ 撕片 SimpleSnap 运行异常告警',
      },
      template: 'red',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: [
            `**异常模块**：\`${info.module}\``,
            `**错误原因**：${info.error}`,
            info.traceId ? `**追踪编号**：\`${info.traceId}\`` : '',
            info.detail ? `**详情摘要**：${info.detail.slice(0, 200)}` : '',
            `**告警时间**：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      },
    ],
  };

  return sendFeishuCard(card);
}
