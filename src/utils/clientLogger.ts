import { ClientLogItem } from '../types';

const MAX_CLIENT_LOGS = 200;
const clientLogs: ClientLogItem[] = [];
const listeners: Array<() => void> = [];

let counter = 1;

export const clientLogger = {
  add(level: 'info' | 'warn' | 'error', category: string, message: string, data?: any) {
    const item: ClientLogItem = {
      id: `clog_${Date.now()}_${counter++}`,
      time: new Date().toLocaleTimeString(),
      level,
      category,
      message,
      data,
    };
    clientLogs.push(item);
    if (clientLogs.length > MAX_CLIENT_LOGS) {
      clientLogs.shift();
    }

    if (level === 'error') {
      console.error(`[${item.category}] ${message}`, data || '');
    } else if (level === 'warn') {
      console.warn(`[${item.category}] ${message}`, data || '');
    } else {
      console.log(`[${item.category}] ${message}`, data || '');
    }

    listeners.forEach((fn) => fn());
  },

  info(category: string, message: string, data?: any) {
    this.add('info', category, message, data);
  },

  warn(category: string, message: string, data?: any) {
    this.add('warn', category, message, data);
  },

  error(category: string, message: string, data?: any) {
    this.add('error', category, message, data);
  },

  getLogs(): ClientLogItem[] {
    return [...clientLogs];
  },

  clear() {
    clientLogs.length = 0;
    listeners.forEach((fn) => fn());
  },

  subscribe(fn: () => void) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },
};
