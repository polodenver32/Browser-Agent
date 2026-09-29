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
  lastAction: BrowserAction | null;
  onRunCommand: (command: string, args: any) => Promise<any>;
  onOpenLocalConnect?: () => void;
}

export const FirefoxBrowser: React.FC<Props> = ({
  realBrowserState,
  isLoadingBrowser,
  onNavigate,
  onOpenTab,
  onSwitchTab,
  onCloseTab,
  onRefresh,
  onScroll,
  onManualClickCanvas,
  lastAction,
  onRunCommand,
  onOpenLocalConnect,
}) => {
  const [urlInputValue, setUrlInputValue] = useState(realBrowserState?.url || 'https://news.ycombinator.com');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showDevDrawer, setShowDevDrawer] = useState(false);
  const [devTab, setDevTab] = useState<'tokens' | 'dom' | 'commands'>('tokens');

  // External command testing
  const [commandInput, setCommandInput] = useState('fetch_page');
  const [commandUrl, setCommandUrl] = useState('https://wikipedia.org');
  const [commandOutput, setCommandOutput] = useState<any>(null);
  const [commandLoading, setCommandLoading] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Sync address bar input with real Firefox active url
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
    const rect = e.currentTarget.getBoundingClientRect();
    // Calculate click coordinates mapped to Firefox viewport (1280x800)
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    onManualClickCanvas(x, y);
  };

  const handleExecuteExternalCommand = async () => {
    setCommandLoading(true);
    try {
      const res = await onRunCommand(commandInput, { url: commandUrl });
      setCommandOutput(res);
    } catch (err: any) {
      setCommandOutput({ error: err.message });
    } finally {
      setCommandLoading(false);
    }
  };

  const tabs = realBrowserState?.tabs || [
    { id: 'tab-1', title: 'Firefox Tab', url: realBrowserState?.url || 'https://news.ycombinator.com' },
  ];
  const activeTabId = realBrowserState?.activeTabId || 'tab-1';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Authentic Firefox Tab Strip (Controlled directly by Playwright real Firefox tabs) */}
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
              {/* Firefox Tab Icon */}
              <span className="shrink-0 text-orange-400 text-xs font-mono">🦊</span>

              {/* Real Tab Title from Firefox */}
              <span className="truncate flex-1 font-sans">{tab.title || tab.url}</span>

              {/* Close Tab Button */}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-0.5 rounded-md hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={() => onOpenTab('https://news.ycombinator.com')}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
          title="Open real Firefox tab (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Engine Badge / Local Browser Connection Indicator */}
        <div className="ml-auto flex items-center gap-2 pr-2">
          {realBrowserState?.isLocalBrowser ? (
            <button
              onClick={onOpenLocalConnect}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono hover:bg-emerald-500/25 transition-colors cursor-pointer"
              title="Click to view local browser bridge settings"
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="font-semibold uppercase">YOUR PERSONAL BROWSER (NO CAPTCHA)</span>
            </button>
          ) : (
            <button
              onClick={onOpenLocalConnect}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 text-[10px] font-mono transition-colors cursor-pointer"
              title="Click to connect your real desktop browser to bypass CAPTCHAs"
            >
              <span className="text-orange-400">⚡</span>
              <span>Connect Your Real Browser</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Firefox Navigation Bar & Awesome Address Bar */}
      <div className="bg-slate-800 px-3 py-1.5 flex items-center gap-2 border-b border-slate-700/80">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reload Firefox tab"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingBrowser ? 'animate-spin text-orange-400' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('https://www.google.com')}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300"
            title="Google Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-0.5" />
          <button
            onClick={() => onScroll('up')}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 text-xs font-mono"
            title="Scroll Up"
          >
            ▲
          </button>
          <button
            onClick={() => onScroll('down')}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 text-xs font-mono"
            title="Scroll Down"
          >
            ▼
          </button>
        </div>

        {/* Awesome Address Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 relative flex items-center">
          <div className="absolute left-2.5 flex items-center gap-1.5 pointer-events-none text-slate-400">
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <input
            id="firefox-awesome-bar"
            type="text"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            placeholder="Search with Google or enter web address..."
            className="w-full pl-14 pr-20 py-1.5 bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 text-xs font-mono text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1 rounded text-slate-400 hover:text-slate-200"
              title="Copy page URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="submit"
              className="px-2 py-0.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-[11px] font-semibold"
            >
              Go
            </button>
          </div>
        </form>

        {/* Developer Drawer Toggle */}
        <button
          onClick={() => setShowDevDrawer(!showDevDrawer)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
            showDevDrawer
              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-sm'
              : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700'
          }`}
          title="Toggle DOM / Agent Token Inspector"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DOM & Tokens</span>
          {showDevDrawer ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* 3. Firefox Bookmarks Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800/80 px-3 py-1 flex items-center gap-1 text-[11px] overflow-x-auto no-scrollbar">
        <span className="text-slate-500 text-[10px] uppercase font-semibold mr-1 shrink-0">Bookmarks:</span>
        <button
          onClick={() => onNavigate('https://news.ycombinator.com')}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white shrink-0"
        >
          <span>📰</span>
          <span>Hacker News</span>
        </button>
        <button
          onClick={() => onNavigate('https://en.wikipedia.org/wiki/Artificial_intelligence')}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white shrink-0"
        >
          <span>📖</span>
          <span>Wikipedia AI</span>
        </button>
        <button
          onClick={() => onNavigate('https://www.google.com')}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white shrink-0"
        >
          <span>🔍</span>
          <span>Google</span>
        </button>
        <button
          onClick={() => onNavigate('https://httpbin.org/forms/post')}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white shrink-0"
        >
          <span>🧪</span>
          <span>HTML Forms Test</span>
        </button>
        <button
          onClick={() => onNavigate('https://github.com')}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white shrink-0"
        >
          <span>🐙</span>
          <span>GitHub</span>
        </button>

        <span className="ml-auto text-[10px] text-slate-500 font-mono hidden md:inline">
          Click anywhere on canvas to manually interact with real browser
        </span>
      </div>

      {/* 4. Real Firefox Live Viewport (Rendered from real Firefox browser screenshots) */}
      <div ref={imageContainerRef} className="flex-1 relative overflow-auto bg-slate-950 flex items-start justify-center p-2">
        {realBrowserState?.screenshotBase64 ? (
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white">
            <img
              src={realBrowserState.screenshotBase64}
              alt="Real Firefox Browser Viewport"
              onClick={handleCanvasClick}
              className="max-w-full h-auto cursor-crosshair block"
              style={{ minWidth: '800px', width: '100%' }}
            />

            {/* Visual Action Indicator for Agent click/type */}
            {lastAction && (
              <div className="absolute top-3 right-3 bg-slate-900/90 border border-orange-500/50 px-3 py-1.5 rounded-lg backdrop-blur text-xs font-mono text-orange-300 shadow-xl flex items-center gap-2">
                <MousePointer className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                <span>
                  Action: <strong className="text-white uppercase">{lastAction.type}</strong>
                  {lastAction.target ? ` on ${lastAction.target}` : ''}
                  {lastAction.value ? ` ("${lastAction.value}")` : ''}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-400" />
            <h3 className="text-sm font-bold text-slate-200">Connecting to Real Firefox Engine...</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Headless Firefox 155 is booting up inside the Linux sandbox and loading the initial tab.
            </p>
          </div>
        )}

        {/* Loading overlay when navigating */}
        {isLoadingBrowser && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
            <div className="bg-slate-900/90 border border-orange-500/30 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono text-orange-300">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
              <span>Firefox executing navigation & rendering DOM...</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Collapsible Developer & Stripped HTML Token Drawer */}
      {showDevDrawer && (
        <div className="h-64 bg-slate-900 border-t border-slate-700/80 flex flex-col z-30 shadow-2xl animate-in slide-in-from-bottom duration-150">
          <div className="bg-slate-850 px-4 py-2 flex items-center justify-between border-b border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                Real Firefox DOM & Token Inspector
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setDevTab('tokens')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    devTab === 'tokens' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stripped DOM Fed to Agent
                </button>
                <button
                  onClick={() => setDevTab('dom')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    devTab === 'dom' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interactive Targets ({realBrowserState?.elementCount || 0})
                </button>
                <button
                  onClick={() => setDevTab('commands')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    devTab === 'commands' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  External Command Execution API
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowDevDrawer(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs bg-slate-950 text-slate-300">
            {devTab === 'tokens' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span>Raw Firefox HTML: <strong className="text-slate-200">{(realBrowserState?.rawHtmlLength || 0).toLocaleString()} chars</strong></span>
                  <span>Stripped (Styles/Scripts stripped): <strong className="text-emerald-400">{(realBrowserState?.cleanedHtmlLength || 0).toLocaleString()} chars</strong></span>
                  <span>Token Reduction: <strong className="text-orange-400">
                    {realBrowserState?.rawHtmlLength
                      ? `~${Math.round(((realBrowserState.rawHtmlLength - realBrowserState.cleanedHtmlLength) / realBrowserState.rawHtmlLength) * 100)}%`
                      : '0%'}
                  </strong></span>
                  <button
                    onClick={() => navigator.clipboard.writeText(realBrowserState?.cleanedHtml || '')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                  >
                    Copy HTML
                  </button>
                </div>
                <pre className="p-3 bg-slate-900/60 rounded-lg text-[11px] text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed border border-slate-800/80">
                  {realBrowserState?.cleanedHtml || 'Reading active tab DOM from real Firefox...'}
                </pre>
              </div>
            )}

            {devTab === 'dom' && (
              <div className="space-y-2">
                <p className="text-slate-400 text-[11px]">
                  All active interactive elements indexed for agent action target identification:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Array.from({ length: Math.min(realBrowserState?.elementCount || 0, 30) }).map((_, i) => (
                    <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-orange-400 font-bold">el-{i + 1}</span>
                      <span className="text-slate-400 font-mono text-[10px]">data-agent-id="el-{i + 1}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {devTab === 'commands' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 rounded border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="fetch_page">fetch_page (Real Firefox Navigation & Scrape)</option>
                    <option value="strip_html">strip_html (Token Optimizer)</option>
                  </select>
                  <input
                    type="text"
                    value={commandUrl}
                    onChange={(e) => setCommandUrl(e.target.value)}
                    placeholder="URL parameter..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 rounded border border-slate-700 text-slate-200 text-xs"
                  />
                  <button
                    onClick={handleExecuteExternalCommand}
                    disabled={commandLoading}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded text-xs font-bold"
                  >
                    {commandLoading ? 'Running...' : 'Execute Command'}
                  </button>
                </div>

                {commandOutput && (
                  <pre className="p-3 bg-slate-900 rounded text-[11px] text-emerald-300 overflow-x-auto border border-slate-800">
                    {JSON.stringify(commandOutput, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
