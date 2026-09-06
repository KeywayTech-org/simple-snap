// 统一日志系统：支持内存环形缓冲池（适用 Worker/Server）、控制台结构化输出、文件落盘与查询 API

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  traceId?: string;
  module: string;
  message: string;
  data?: any;
  durationMs?: number;
}

const MAX_LOGS = 500;
const memoryLogs: LogEntry[] = [];
let logIdCounter = 1;

export function createTraceId(): string {
  const timePart = Date.now().toString(36);
  const randPart = Math.random().toString(36).substring(2, 6);
  return `tr-${timePart}-${randPart}`;
}

// 尝试写入本地文件（Node.js 环境可用时，不阻塞且异常静默降级）
async function tryAppendFile(entry: LogEntry) {
  if (typeof process === 'undefined' || !process.versions?.node) return;
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const logDir = path.resolve(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'app.log');
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(logFile, line, 'utf-8');
  } catch {
    // 忽略文件系统不可写或目录缺失
  }
}

function log(level: LogLevel, module: string, message: string, data?: any, traceId?: string, durationMs?: number) {
  const entry: LogEntry = {
    id: `log_${Date.now()}_${logIdCounter++}`,
    timestamp: new Date().toISOString(),
    level,
    traceId,
    module,
    message,
    data: data !== undefined ? sanitizeLogData(data) : undefined,
    durationMs,
  };

  // 写入环形内存池
  memoryLogs.push(entry);
  if (memoryLogs.length > MAX_LOGS) {
    memoryLogs.shift();
  }

  // 控制台输出
  const prefix = `[${entry.timestamp.slice(11, 19)}] [${level}] [${module}]${traceId ? ` [${traceId}]` : ''}`;
  const durText = durationMs !== undefined ? ` (${durationMs}ms)` : '';
  if (level === 'ERROR') {
    console.error(`${prefix} ${message}${durText}`, data || '');
  } else if (level === 'WARN') {
    console.warn(`${prefix} ${message}${durText}`, data || '');
  } else {
    console.log(`${prefix} ${message}${durText}`, data || '');
  }

  // 异步文件落盘
  tryAppendFile(entry).catch(() => {});
}

// 脱敏敏感字段（API Key 等）
function sanitizeLogData(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    // 脱敏 sk-xxxx 密钥
    return obj.replace(/sk-[a-zA-Z0-9_-]{8,}/g, (m) => m.slice(0, 7) + '***' + m.slice(-4));
  }
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogData);
  }

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/key|token|auth|password|secret/i.test(k) && typeof v === 'string') {
      clean[k] = v.length > 8 ? v.slice(0, 6) + '***' + v.slice(-4) : '******';
    } else if (typeof v === 'string' && v.startsWith('data:image/')) {
      clean[k] = `[base64 image, length: ${v.length}]`;
    } else {
      clean[k] = sanitizeLogData(v);
    }
  }
  return clean;
}

export const logger = {
  debug: (module: string, message: string, data?: any, traceId?: string) =>
    log('DEBUG', module, message, data, traceId),
  info: (module: string, message: string, data?: any, traceId?: string, durationMs?: number) =>
    log('INFO', module, message, data, traceId, durationMs),
  warn: (module: string, message: string, data?: any, traceId?: string) =>
    log('WARN', module, message, data, traceId),
  error: (module: string, message: string, data?: any, traceId?: string, durationMs?: number) =>
    log('ERROR', module, message, data, traceId, durationMs),
};

export function getRecentLogs(options?: { traceId?: string; level?: LogLevel; limit?: number }): LogEntry[] {
  let list = [...memoryLogs];
  if (options?.traceId) {
    list = list.filter((l) => l.traceId === options.traceId);
  }
  if (options?.level) {
    list = list.filter((l) => l.level === options.level);
  }
  const limit = options?.limit || 100;
  return list.slice(-limit);
}

export function clearLogs(): void {
  memoryLogs.length = 0;
}
