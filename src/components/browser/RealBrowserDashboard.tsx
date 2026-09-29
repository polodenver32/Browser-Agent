import React from 'react';
import {
  Laptop,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  CheckCircle2,
  Clock,
  Code2,
  ArrowUpRight,
  Terminal,
} from 'lucide-react';
import { RealBrowserStateResponse, BrowserAction } from '../../types/browser';

interface Props {
  realBrowserState: RealBrowserStateResponse | null;
  lastAction: BrowserAction | null;
  isProcessing: boolean;
  onOpenConnectModal: () => void;
}

export const RealBrowserDashboard: React.FC<Props> = ({
  realBrowserState,
  lastAction,
  isProcessing,
  onOpenConnectModal,
}) => {
  const isConnected = Boolean(realBrowserState?.isLocalBrowser);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-y-auto">
      {/* Top Banner Status Card */}
      <div className="max-w-4xl mx-auto w-full space-y-5">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center p-0.5 shadow-md ${
                isConnected
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-tr from-amber-500 to-orange-500'
              }`}
            >
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Laptop
                  className={`w-6 h-6 ${
                    isConnected ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  {isConnected
                    ? realBrowserState?.clientName || 'Your Personal Desktop Browser'
                    : 'Real Browser Bridge'}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isConnected ? 'LIVE & READY' : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConnected
                  ? 'Bypassing CAPTCHAs, bot shields, and Cloudflare using your home residential IP.'
                  : 'Connect your Chrome, Brave, or Firefox browser to let the AI agent browse naturally.'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenConnectModal}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 shrink-0 ${
              isConnected
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500'
            }`}
          >
            <span>{isConnected ? 'Connection Settings' : 'Connect Browser'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Active Browser Inspection Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active URL Card */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                Active Tab URL
              </span>
              {realBrowserState?.url && (
                <a
                  href={realBrowserState.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 hover:text-slate-300"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="font-mono text-xs text-slate-200 truncate" title={realBrowserState?.url || 'None'}>
              {realBrowserState?.url || 'No tab connected'}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-1">
              Title: {realBrowserState?.title || 'None'}
            </div>
          </div>

          {/* Real IP & Protection Bypass Card */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Anti-Bot Protection</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>CAPTCHA-Free Session</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isConnected ? 'Operating on Residential Home IP' : 'Awaiting local browser link'}
            </div>
          </div>

          {/* Page DOM Token Footprint */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Stripped DOM Payload</span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-200">
              {(realBrowserState?.cleanedHtmlLength || 0).toLocaleString()} chars
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {realBrowserState?.elementCount || 0} interactive elements indexed
            </div>
          </div>
        </div>

        {/* Live Action Telemetry & Execution Stream */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Live Browser Action Telemetry
              </h2>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                <span>Executing in your browser...</span>
              </div>
            )}
          </div>

          {lastAction ? (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold uppercase text-[11px] border border-orange-500/20">
                  {lastAction.type}
                </span>
                <span className="text-slate-300 font-normal">
                  {lastAction.summary || 'Direct browser dispatch'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
                {lastAction.target && (
                  <div>
                    Target: <span className="text-emerald-400 font-semibold">{lastAction.target}</span>
                  </div>
                )}
                {lastAction.value && (
                  <div>
                    Value: <span className="text-sky-400">"{lastAction.value}"</span>
                  </div>
                )}
                {lastAction.url && (
                  <div>
                    URL: <span className="text-indigo-400">{lastAction.url}</span>
                  </div>
                )}
                {lastAction.direction && (
                  <div>
                    Scroll: <span className="text-amber-400">{lastAction.direction}</span> ({lastAction.amount || 400}px)
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
              No actions executed yet. Type a command in the agent chat on the right to start!
            </div>
          )}
        </div>

        {/* DOM Live Snapshot Inspector Preview */}
        {realBrowserState?.cleanedHtml && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                Live Stripped DOM Observed by AI Model
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                Indexed links (#L1, #L2...) & element IDs (el-1...)
              </span>
            </div>
            <pre className="max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap select-all">
              {realBrowserState.cleanedHtml.substring(0, 3000)}
              {realBrowserState.cleanedHtml.length > 3000 ? '\n... [DOM Preview Truncated]' : ''}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
