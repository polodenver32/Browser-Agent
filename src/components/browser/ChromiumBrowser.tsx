import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Shield,
  Lock,
  Star,
  Copy,
  Plus,
  X,
  Sliders,
  Code2,
  Terminal,
  Sparkles,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  MousePointer,
  Check,
  Globe,
  Radio,
  RefreshCw,
  CheckCircle2,
  Keyboard,
  CornerDownLeft,
  Delete,
} from 'lucide-react';
import { BrowserTab, BrowserAction, StrippedHtmlInfo, RealBrowserStateResponse } from '../../types/browser';

interface Props {
  realBrowserState: RealBrowserStateResponse | null;
  isLoadingBrowser: boolean;
  onNavigate: (url: string) => void;
  onOpenTab: (url?: string) => void;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onRefresh: () => void;
  onScroll: (direction: 'up' | 'down') => void;
  onManualClickCanvas: (x: number, y: number) => void;
  onKeyboardType?: (text: string) => void;
  onKeyboardPress?: (key: string) => void;
  onClearInput?: () => void;
  lastAction: BrowserAction | null;
}

export const ChromiumBrowser: React.FC<Props> = ({
  realBrowserState,
  isLoadingBrowser,
  onNavigate,
  onOpenTab,
  onSwitchTab,
  onCloseTab,
  onRefresh,
  onScroll,
  onManualClickCanvas,
  onKeyboardType,
  onKeyboardPress,
  onClearInput,
  lastAction,
}) => {
  const [urlInputValue, setUrlInputValue] = useState(realBrowserState?.url || 'https://news.ycombinator.com');
  const [typeInputValue, setTypeInputValue] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showDevDrawer, setShowDevDrawer] = useState(false);
  const [devTab, setDevTab] = useState<'tokens' | 'dom' | 'action'>('tokens');
  const [clickIndicator, setClickIndicator] = useState<{ x: number; y: number } | null>(null);
  const [isViewportFocused, setIsViewportFocused] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Sync address bar input with real Chromium active url
  useEffect(() => {
    if (realBrowserState?.url) {
      setUrlInputValue(realBrowserState.url);
    }
  }, [realBrowserState?.url]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInputValue.trim()) return;
    onNavigate(urlInputValue.trim());
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(realBrowserState?.url || '');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1500);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    // Calculate click coordinates mapped to Chromium internal viewport (1280x800)
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    const x = Math.max(0, Math.min(1280, Math.round((e.clientX - rect.left) * scaleX)));
    const y = Math.max(0, Math.min(800, Math.round((e.clientY - rect.top) * scaleY)));

    // Visual ripple effect at clicked location
    setClickIndicator({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setClickIndicator(null), 700);

    onManualClickCanvas(x, y);

    // Focus the viewport container so keystrokes forward directly to the browser
    viewportRef.current?.focus();
    setIsViewportFocused(true);
  };

  // Capture user physical keyboard strokes and forward to focused element in Chromium
  const handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // If the event originated inside an actual HTML input/textarea (like the Quick Type bar or omnibox), let default behavior happen
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      onKeyboardPress?.('Tab');
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onKeyboardPress?.('Enter');
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      onKeyboardPress?.('Backspace');
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onKeyboardPress?.('Escape');
      return;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      onKeyboardPress?.(e.key);
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      onKeyboardType?.(' ');
      return;
    }

    // Standard printable character (letters, numbers, symbols)
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onKeyboardType?.(e.key);
    }
  };

  const handleQuickTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeInputValue) return;
    onKeyboardType?.(typeInputValue);
    setTypeInputValue('');
  };

  const tabs = realBrowserState?.tabs || [
    { id: 'tab-1', title: 'Chromium Tab', url: realBrowserState?.url || 'https://news.ycombinator.com' },
  ];
  const activeTabId = realBrowserState?.activeTabId || 'tab-1';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Chrome Tab Strip (Controlled directly by Playwright Chromium tabs) */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-2 pt-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSwitchTab(tab.id)}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-medium cursor-pointer transition-all max-w-[220px] min-w-[130px] ${
                isActive
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700/80 shadow-sm z-10'
                  : 'bg-slate-900/60 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Chrome Tab Icon */}
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-500 via-emerald-400 to-amber-400 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Real Tab Title from Chromium */}
              <span className="truncate flex-1 font-sans">{tab.title || tab.url}</span>

              {/* Close Tab Button */}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-slate-700 p-0.5 rounded transition-opacity text-slate-400 hover:text-white"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={() => onOpenTab('https://news.ycombinator.com')}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors ml-1"
          title="Open New Tab in Chromium Engine"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-2 pr-2 text-xs">
          <span className="flex items-center gap-1.5 text-blue-400 font-mono text-[11px] bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Chromium Engine v153</span>
          </span>
        </div>
      </div>

      {/* 2. Chrome Navigation Toolbar & Omnibox */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 py-1.5 flex items-center gap-2 text-slate-300">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(realBrowserState?.url || '')}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate(realBrowserState?.url || '')}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRefresh}
            className={`p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ${
              isLoadingBrowser ? 'animate-spin text-blue-400' : ''
            }`}
            title="Reload Chromium Viewport"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('https://news.ycombinator.com')}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Hacker News Home"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Bar (Omnibox) */}
        <form onSubmit={handleUrlSubmit} className="flex-1 max-w-2xl relative flex items-center">
          <div className="absolute left-2.5 flex items-center gap-1.5 text-slate-400">
            {urlInputValue.startsWith('https://') ? (
              <Lock className="w-3 h-3 text-emerald-400" />
            ) : (
              <Globe className="w-3 h-3 text-slate-400" />
            )}
          </div>

          <input
            type="text"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 focus:border-blue-500 rounded-full py-1 pl-8 pr-16 text-xs text-slate-200 font-mono transition-colors outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
            placeholder="Search with DuckDuckGo or enter URL..."
          />

          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1 text-slate-500 hover:text-slate-300 rounded"
              title="Copy URL"
            >
              {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </form>

        {/* Viewport Action Controls & Dev Drawer Toggle */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Scroll Controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => onScroll('up')}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              title="Scroll Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onScroll('down')}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              title="Scroll Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dev Inspection Drawer Toggle */}
          <button
            onClick={() => setShowDevDrawer(!showDevDrawer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showDevDrawer
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">DOM Inspector</span>
          </button>
        </div>
      </div>

      {/* 2.5 Dedicated Live Interactive Keyboard & Quick Type Bar */}
      <div className="bg-slate-900 border-b border-slate-800/90 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono shrink-0">
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline font-semibold">Active Input:</span>
            {realBrowserState?.focusedElement?.isInput ? (
              <span className="text-emerald-400 font-bold truncate max-w-[160px]">
                &lt;{realBrowserState.focusedElement.tagName}
                {realBrowserState.focusedElement.type ? ` type="${realBrowserState.focusedElement.type}"` : ''}
                {realBrowserState.focusedElement.placeholder ? ` placeholder="${realBrowserState.focusedElement.placeholder}"` : ''}
                &gt;
              </span>
            ) : (
              <span className="text-slate-400">Click field in browser to focus</span>
            )}
          </div>

          <form onSubmit={handleQuickTypeSubmit} className="flex-1 flex items-center gap-1.5">
            <input
              type="text"
              value={typeInputValue}
              onChange={(e) => setTypeInputValue(e.target.value)}
              placeholder={
                realBrowserState?.focusedElement?.isInput
                  ? `Type into focused ${realBrowserState.focusedElement.placeholder || realBrowserState.focusedElement.type || 'field'} and hit Enter...`
                  : 'Click any input or button in the browser below, then type here or with your keyboard...'
              }
              className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none font-mono"
            />
            <button
              type="submit"
              disabled={!typeInputValue}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg font-medium text-xs flex items-center gap-1 shrink-0 transition-colors shadow"
              title="Send text to focused field in Chromium"
            >
              <span>Type</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </form>
        </div>

        {/* Quick Keystroke Action Buttons for Login and Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onKeyboardPress?.('Tab')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono hover:text-white flex items-center gap-1 transition-colors"
            title="Press Tab to focus next input field (e.g. Username -> Password)"
          >
            <span>Tab ⇥</span>
          </button>
          <button
            onClick={() => onKeyboardPress?.('Enter')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono hover:text-white flex items-center gap-1 transition-colors"
            title="Press Enter to submit login or form"
          >
            <span>Enter ↵</span>
          </button>
          <button
            onClick={() => onKeyboardPress?.('Backspace')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono hover:text-white flex items-center gap-1 transition-colors"
            title="Press Backspace"
          >
            <Delete className="w-3 h-3" />
          </button>
          {onClearInput && (
            <button
              onClick={onClearInput}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono hover:text-rose-300 flex items-center gap-1 transition-colors"
              title="Clear active input field"
            >
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Browser Viewport Area (Real Interactive Chromium Canvas) */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
        {/* Real Screenshot Render from Playwright Chromium Viewport */}
        {realBrowserState?.screenshotBase64 ? (
          <div
            ref={viewportRef}
            tabIndex={0}
            onKeyDown={handleViewportKeyDown}
            onFocus={() => setIsViewportFocused(true)}
            onBlur={() => setIsViewportFocused(false)}
            className={`w-full h-full relative overflow-auto flex items-start justify-center p-2 bg-slate-950 outline-none transition-all ${
              isViewportFocused ? 'ring-1 ring-indigo-500/50' : ''
            }`}
            title="Click inside and type on your keyboard to interact directly with the mini browser"
          >
            <div className="relative border border-slate-800/80 rounded-lg shadow-2xl overflow-hidden bg-slate-900 group">
              <img
                src={realBrowserState.screenshotBase64}
                alt="Chromium Viewport Live"
                className="max-w-full h-auto cursor-crosshair block select-none"
                onClick={handleCanvasClick}
                title="Click anywhere to focus or click in Chromium"
              />

              {/* Click ripple feedback */}
              {clickIndicator && (
                <div
                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-indigo-400 bg-indigo-500/30 animate-ping pointer-events-none z-30"
                  style={{ left: clickIndicator.x, top: clickIndicator.y }}
                />
              )}

              {/* Keyboard active hint badge */}
              {isViewportFocused && (
                <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 rounded-lg px-2.5 py-1 text-[10px] font-mono text-indigo-300 flex items-center gap-1.5 shadow-lg pointer-events-none z-20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Keyboard Active — Type on canvas or use bar above</span>
                </div>
              )}

              {/* Cursor / Last Action Visual Hint Overlay */}
              {lastAction && (
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs shadow-xl pointer-events-none z-20">
                  <MousePointer className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                  <span className="font-semibold text-slate-200 capitalize">
                    {lastAction.type}: {lastAction.summary}
                  </span>
                  {lastAction.target && (
                    <span className="font-mono text-emerald-400 text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {lastAction.target}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse">
              <RefreshCw className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Launching Stealth Chromium Engine...</p>
              <p className="text-xs text-slate-500 mt-1">Starting Chrome with anti-detection evasions</p>
            </div>
          </div>
        )}

        {/* 4. Sliding Bottom Developer Drawer: DOM Token Compression & Agent Telemetry */}
        {showDevDrawer && (
          <div className="absolute inset-x-0 bottom-0 max-h-[55%] h-72 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/80 shadow-2xl flex flex-col z-20 transition-all">
            {/* Drawer Header Tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/80 text-xs">
              <div className="flex items-center gap-3 font-semibold">
                <button
                  onClick={() => setDevTab('tokens')}
                  className={`flex items-center gap-1.5 pb-0.5 transition-colors ${
                    devTab === 'tokens'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DOM Optimization</span>
                </button>
                <button
                  onClick={() => setDevTab('dom')}
                  className={`flex items-center gap-1.5 pb-0.5 transition-colors ${
                    devTab === 'dom'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Stripped Cleaned HTML ({realBrowserState?.cleanedHtmlLength?.toLocaleString() || 0} chars)</span>
                </button>
                <button
                  onClick={() => setDevTab('action')}
                  className={`flex items-center gap-1.5 pb-0.5 transition-colors ${
                    devTab === 'action'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Action Telemetry</span>
                </button>
              </div>

              <button
                onClick={() => setShowDevDrawer(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-auto p-4 text-xs">
              {devTab === 'tokens' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Raw Webpage Size</span>
                      <span className="text-base font-bold text-slate-200 font-mono">
                        {(realBrowserState?.rawHtmlLength || 0).toLocaleString()} bytes
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Stripped Clean Payload</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        {(realBrowserState?.cleanedHtmlLength || 0).toLocaleString()} bytes
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Interactive Elements Indexed</span>
                      <span className="text-base font-bold text-blue-400 font-mono">
                        {realBrowserState?.elementCount || 0} elements
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs">
                    <strong>Chromium Engine Anti-Detection Active:</strong> Navigator webdriver property is masked, canvas fingerprinting randomized, hardware WebGL GPU mocked as NVIDIA RTX 3070, and synthetic clicks execute via native OS-level CDP events.
                  </div>
                </div>
              )}

              {devTab === 'dom' && (
                <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                  {realBrowserState?.cleanedHtml || '<!-- No DOM Content Available -->'}
                </pre>
              )}

              {devTab === 'action' && (
                <div className="space-y-2">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Last Executed Hardware Action
                  </div>
                  {lastAction ? (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono space-y-1">
                      <div>
                        Type: <span className="text-blue-400 font-bold">{lastAction.type}</span>
                      </div>
                      <div>Summary: {lastAction.summary}</div>
                      {lastAction.target && <div>Target: <span className="text-emerald-400">{lastAction.target}</span></div>}
                      {lastAction.value && <div>Value: <span className="text-amber-400">"{lastAction.value}"</span></div>}
                      {lastAction.url && <div>URL: <span className="text-purple-400">{lastAction.url}</span></div>}
                    </div>
                  ) : (
                    <div className="text-slate-500">No actions executed yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
