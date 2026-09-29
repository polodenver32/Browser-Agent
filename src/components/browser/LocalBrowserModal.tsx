import React, { useState } from 'react';
import {
  Laptop,
  Chrome,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Download,
  Terminal,
  FileCode,
} from 'lucide-react';

interface Props {
  isConnected: boolean;
  clientName?: string;
  onClose: () => void;
}

export const LocalBrowserModal: React.FC<Props> = ({ isConnected, clientName, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'copy-paste' | 'auto-install'>('copy-paste');

  const userscriptUrl = window.location.origin + '/agent-bridge.user.js';

  // Standalone CSP-safe Userscript content with dynamically injected current host
  const rawUserscriptContent = `// ==UserScript==
// @name         AI Studio Real Browser Agent Bridge
// @namespace    https://aistudio.google.com/
// @version      2.0
// @description  Connects your real desktop browser to the AI Agent running in Google AI Studio to bypass CAPTCHAs, bot shields, and Cloudflare.
// @author       AI Studio
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Target bridge server endpoint
    const BRIDGE_HOST = '${window.location.origin}';

    // Unique client ID per tab
    const clientId = 'tab-' + Math.random().toString(36).substring(2, 9);
    console.log('[AI Agent Bridge] Initialized on tab:', window.location.href, 'Client ID:', clientId);

    // Cross-origin request helper using GM_xmlhttpRequest (completely bypasses webpage CSP!)
    function gmFetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            const gmReq = (typeof GM_xmlhttpRequest !== 'undefined') ? GM_xmlhttpRequest : (typeof GM !== 'undefined' ? GM.xmlHttpRequest : null);
            if (gmReq) {
                gmReq({
                    method: options.method || 'GET',
                    url: url,
                    headers: options.headers || {},
                    data: options.body || '',
                    onload: (res) => {
                        try {
                            const json = JSON.parse(res.responseText);
                            resolve(json);
                        } catch (e) {
                            resolve(res.responseText);
                        }
                    },
                    onerror: reject,
                    ontimeout: reject
                });
            } else {
                fetch(url, options).then(r => r.json()).then(resolve).catch(reject);
            }
        });
    }

    function annotateElements() {
        let counter = 1;
        const interactive = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"], summary');
        interactive.forEach((el) => {
            if (!el.hasAttribute('data-agent-id')) {
                el.setAttribute('data-agent-id', 'el-' + (counter++));
            }
        });
    }

    function captureState() {
        annotateElements();
        return {
            clientId,
            url: window.location.href,
            title: document.title,
            html: document.documentElement.outerHTML.substring(0, 160000),
            browserName: (navigator.userAgent.includes('Chrome') ? 'Google Chrome' : 'Firefox') + ' (Your PC)'
        };
    }

    async function sendHeartbeat() {
        try {
            const state = captureState();
            await gmFetch(BRIDGE_HOST + '/api/bridge/poll?clientId=' + clientId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
        } catch (e) {}
    }

    let isPolling = false;
    async function pollNextAction() {
        if (isPolling) return;
        isPolling = true;

        try {
            const res = await gmFetch(BRIDGE_HOST + '/api/bridge/poll?clientId=' + clientId);
            if (res && res.action) {
                console.log('[AI Agent Bridge] Received action from AI agent:', res.action);
                await executeAction(res.actionId, res.action);
            }
        } catch (e) {
            await new Promise(r => setTimeout(r, 2000));
        } finally {
            isPolling = false;
            setTimeout(pollNextAction, 500);
        }
    }

    async function executeAction(actionId, action) {
        try {
            if (action.type === 'click') {
                let target = action.target || '';
                let el = null;
                if (action.resolvedUrl) el = document.querySelector('a[href="' + action.resolvedUrl + '"]');
                if (!el && target.includes('data-agent-id')) el = document.querySelector(target);
                if (!el && target.startsWith('el-')) el = document.querySelector('[data-agent-id="' + target + '"]');
                if (!el) el = document.querySelector(target);
                if (!el) {
                    const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"]'));
                    el = buttons.find(b => b.innerText && b.innerText.trim().toLowerCase().includes(target.toLowerCase()));
                }
                if (!el) {
                    await reportResult(actionId, false, 'Could not find element: ' + target);
                    return;
                }
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
                el.click();
                await reportResult(actionId, true, 'Clicked element ' + target);
            } else if (action.type === 'type') {
                let target = action.target || 'input';
                let el = target.includes('data-agent-id')
                    ? document.querySelector(target)
                    : document.querySelector('[data-agent-id="' + target + '"]') || document.querySelector(target) || document.querySelector('input[type="text"], input[type="search"], textarea');
                if (!el) {
                    await reportResult(actionId, false, 'Could not find input element: ' + target);
                    return;
                }
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
                el.value = action.value || '';
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                if (action.submit) {
                    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                    const form = el.closest('form');
                    if (form) form.submit();
                }
                await reportResult(actionId, true, 'Typed value into ' + target);
            } else if (action.type === 'scroll') {
                const amount = action.amount || 400;
                const delta = action.direction === 'up' ? -amount : amount;
                window.scrollBy({ top: delta, behavior: 'smooth' });
                await reportResult(actionId, true, 'Scrolled ' + action.direction);
            } else if (action.type === 'navigate' && action.url) {
                await reportResult(actionId, true, 'Navigating to ' + action.url);
                window.location.href = action.url;
            } else {
                await reportResult(actionId, true, 'Action complete');
            }
        } catch (err) {
            await reportResult(actionId, false, 'Execution error: ' + err.message);
        }
    }

    async function reportResult(actionId, success, message) {
        const state = captureState();
        await gmFetch(BRIDGE_HOST + '/api/bridge/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, actionId, success, message, state })
        });
    }

    sendHeartbeat();
    setInterval(sendHeartbeat, 4000);
    pollNextAction();
})();`;

  const copyScriptText = () => {
    navigator.clipboard.writeText(rawUserscriptContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Control Your Real Browser
                {isConnected ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    CONNECTED: {clientName || 'Active'}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                    AWAITING CONNECTION
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Bypasses all CAPTCHAs, bot shields, and Cloudflare protections by driving your personal browser.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Status banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
            }`}
          />
          <div className="text-xs leading-relaxed">
            {isConnected ? (
              <span>
                <strong>Your personal browser is active!</strong> The agent will execute all actions,
                searches, and clicks directly inside your open tab.
              </span>
            ) : (
              <span>
                Chrome blocks external websites from directly invoking Tampermonkey. Use the 20-second
                paste method below to add the script to Tampermonkey!
              </span>
            )}
          </div>
        </div>

        {/* Benefits banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-100 block">No CAPTCHAs</span>
              <span className="text-slate-400">Uses your residential IP address</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-100 block">Real Logins & Cookies</span>
              <span className="text-slate-400">Already logged into Google, etc.</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <Chrome className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-100 block">Any Browser</span>
              <span className="text-slate-400">Chrome, Brave, Firefox, Edge</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('copy-paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'copy-paste'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Step 2: Add to Tampermonkey (20 seconds)</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                <li>
                  Click the <strong>Tampermonkey icon</strong> in your browser extensions bar (top right of Chrome/Brave).
                </li>
                <li>
                  Click <strong>"Create a new script..."</strong> (or Dashboard → the <code className="text-emerald-400">+</code> plus sign).
                </li>
                <li>
                  Select all existing placeholder text and <strong>paste</strong> the script below, then press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">Ctrl+S</kbd> (or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">Cmd+S</kbd>) to save.
                </li>
              </ol>

              {/* Script Box */}
              <div className="relative pt-1">
                <textarea
                  readOnly
                  value={rawUserscriptContent}
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 font-mono text-[11px] text-emerald-300 resize-none outline-none select-all"
                />
                <button
                  onClick={copyScriptText}
                  className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Script Code'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
              <span>Once saved in Tampermonkey, refresh or open any webpage. It will connect automatically!</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
