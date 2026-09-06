import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, RefreshCw, Copy, Check, Trash2, Terminal, Server, Smartphone } from 'lucide-react';
import { clientLogger } from '../utils/clientLogger';
import { ClientLogItem } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTraceId?: string;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, currentTraceId }) => {
  const [tab, setTab] = useState<'client' | 'server'>('client');
  const [clientLogs, setClientLogs] = useState<ClientLogItem[]>([]);
  const [serverLogs, setServerLogs] = useState<any[]>([]);
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [copied, setCopied] = useState(false);

  // 同步客户端日志
  useEffect(() => {
    if (!isOpen) return;
    setClientLogs(clientLogger.getLogs());
    const unsub = clientLogger.subscribe(() => {
      setClientLogs(clientLogger.getLogs());
    });
    return unsub;
  }, [isOpen]);

  // 拉取服务端日志
  const fetchServerLogs = async () => {
    setIsLoadingServer(true);
    try {
      const url = currentTraceId
        ? `/api/logs?traceId=${encodeURIComponent(currentTraceId)}&limit=100`
        : '/api/logs?limit=100';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setServerLogs(data.logs || []);
      }
    } catch (e: any) {
      setServerLogs([{ level: 'ERROR', message: `拉取服务端日志失败: ${e?.message}`, timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoadingServer(false);
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'server') {
      fetchServerLogs();
    }
  }, [isOpen, tab]);

  // 复制全量排障日志
  const handleCopyAll = async () => {
    const report = {
      exportedAt: new Date().toISOString(),
      currentTraceId: currentTraceId || 'none',
      userAgent: navigator.userAgent,
      clientLogs: clientLogs,
      serverLogs: serverLogs,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(report, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = async () => {
    if (tab === 'client') {
      clientLogger.clear();
      setClientLogs([]);
    } else {
      try {
        await fetch('/api/logs', { method: 'DELETE' });
        setServerLogs([]);
      } catch {}
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs font-serif">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl max-h-[85vh] bg-[#fbf9f5] border border-stone-400 shadow-2xl flex flex-col overflow-hidden text-stone-900 relative"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-300 flex items-center justify-between bg-stone-100/70">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-stone-800" />
              <span className="font-bold text-sm tracking-wider">系统运行与排障日志</span>
              {currentTraceId && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-200 border border-stone-300 rounded-xs text-stone-700">
                  {currentTraceId}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Toolbar & Tabs */}
          <div className="px-4 py-2 border-b border-stone-200 flex items-center justify-between gap-3 text-xs bg-stone-50/50">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTab('client')}
                className={`px-3 py-1 flex items-center gap-1.5 border transition-all cursor-pointer ${
                  tab === 'client'
                    ? 'bg-stone-900 text-stone-100 border-stone-900 font-bold'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>客户端日志 ({clientLogs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('server')}
                className={`px-3 py-1 flex items-center gap-1.5 border transition-all cursor-pointer ${
                  tab === 'server'
                    ? 'bg-stone-900 text-stone-100 border-stone-900 font-bold'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>服务端日志 ({serverLogs.length})</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {tab === 'server' && (
                <button
                  type="button"
                  onClick={fetchServerLogs}
                  disabled={isLoadingServer}
                  className="px-2 py-1 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingServer ? 'animate-spin' : ''}`} />
                  <span>刷新</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyAll}
                className="px-2 py-1 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '已复制' : '复制全量诊断'}</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                title="清空当前日志"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Log List Content */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5 bg-[#f5f2eb]/60 select-text">
            {tab === 'client' ? (
              clientLogs.length === 0 ? (
                <div className="text-center py-12 text-stone-400 font-serif">暂无客户端操作日志</div>
              ) : (
                clientLogs.map((l) => (
                  <div
                    key={l.id}
                    className={`p-2 border rounded-xs leading-relaxed ${
                      l.level === 'error'
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                        : l.level === 'warn'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                        : 'bg-white/80 border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-stone-500 mb-0.5">
                      <span>[{l.time}]</span>
                      <span className="font-bold uppercase tracking-wider">[{l.level}]</span>
                      <span className="text-stone-700 font-sans font-semibold">[{l.category}]</span>
                    </div>
                    <div className="font-sans break-words">{l.message}</div>
                    {l.data && (
                      <pre className="mt-1 p-1.5 bg-stone-100 border border-stone-200 text-[10px] overflow-x-auto text-stone-700 rounded-none">
                        {typeof l.data === 'object' ? JSON.stringify(l.data, null, 2) : String(l.data)}
                      </pre>
                    )}
                  </div>
                ))
              )
            ) : serverLogs.length === 0 ? (
              <div className="text-center py-12 text-stone-400 font-serif">
                {isLoadingServer ? '正在调取服务端运行日志...' : '暂无服务端记录'}
              </div>
            ) : (
              serverLogs.map((l, idx) => (
                <div
                  key={l.id || idx}
                  className={`p-2 border rounded-xs leading-relaxed ${
                    l.level === 'ERROR'
                      ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                      : l.level === 'WARN'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-white/80 border-stone-200 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-stone-500 mb-0.5">
                    <span>{l.timestamp ? l.timestamp.slice(11, 19) : ''}</span>
                    <span className="font-bold">[{l.level}]</span>
                    <span className="font-semibold text-stone-700">[{l.module}]</span>
                    {l.traceId && <span className="text-stone-400">({l.traceId})</span>}
                    {l.durationMs !== undefined && (
                      <span className="text-emerald-700 font-semibold">{l.durationMs}ms</span>
                    )}
                  </div>
                  <div className="font-sans break-words">{l.message}</div>
                  {l.data && (
                    <pre className="mt-1 p-1.5 bg-stone-100 border border-stone-200 text-[10px] overflow-x-auto text-stone-700 rounded-none">
                      {typeof l.data === 'object' ? JSON.stringify(l.data, null, 2) : String(l.data)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Note */}
          <div className="px-4 py-2 border-t border-stone-200 bg-stone-100/50 flex items-center justify-between text-[11px] text-stone-500 font-serif">
            <span>如生成受阻，可点击右上角「复制全量诊断」发给开发复现排查。</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-0.5 bg-stone-900 text-white hover:bg-stone-800 cursor-pointer"
            >
              关闭
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
