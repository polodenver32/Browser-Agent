// ==UserScript==
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
    const BRIDGE_HOST = 'https://ais-dev-exfiywpcnb6acobye7ziaf-439861698598.asia-southeast1.run.app';

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
                // Fallback to standard fetch
                fetch(url, options).then(r => r.json()).then(resolve).catch(reject);
            }
        });
    }

    function annotateElements() {
        let counter = 1;
        const interactive = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"], summary');
        interactive.forEach((el) => {
            if (!el.hasAttribute('data-agent-id')) {
                el.setAttribute('data-agent-id', `el-${counter++}`);
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

    // Register & Heartbeat
    async function sendHeartbeat() {
        try {
            const state = captureState();
            await gmFetch(`${BRIDGE_HOST}/api/bridge/poll?clientId=${clientId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
        } catch (e) {
            // bridge might be momentarily idle
        }
    }

    // Long polling for agent actions
    let isPolling = false;
    async function pollNextAction() {
        if (isPolling) return;
        isPolling = true;

        try {
            const res = await gmFetch(`${BRIDGE_HOST}/api/bridge/poll?clientId=${clientId}`);
            if (res && res.action) {
                console.log('[AI Agent Bridge] Received action from AI agent:', res.action);
                await executeAction(res.actionId, res.action);
            }
        } catch (e) {
            // Wait briefly before retrying poll
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

                if (action.resolvedUrl) {
                    el = document.querySelector(`a[href="${action.resolvedUrl}"]`);
                }
                if (!el && target.includes('data-agent-id')) {
                    el = document.querySelector(target);
                }
                if (!el && target.startsWith('el-')) {
                    el = document.querySelector(`[data-agent-id="${target}"]`);
                }
                if (!el) {
                    el = document.querySelector(target);
                }
                if (!el) {
                    const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"]'));
                    el = buttons.find(b => b.innerText && b.innerText.trim().toLowerCase().includes(target.toLowerCase()));
                }

                if (!el) {
                    await reportResult(actionId, false, `Could not find element: ${target}`);
                    return;
                }

                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
                el.click();
                await reportResult(actionId, true, `Clicked element ${target}`);
            }
            else if (action.type === 'type') {
                let target = action.target || 'input';
                let el = target.includes('data-agent-id')
                    ? document.querySelector(target)
                    : document.querySelector(`[data-agent-id="${target}"]`) || document.querySelector(target) || document.querySelector('input[type="text"], input[type="search"], textarea');

                if (!el) {
                    await reportResult(actionId, false, `Could not find input element: ${target}`);
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

                await reportResult(actionId, true, `Typed "${action.value}" into ${target}`);
            }
            else if (action.type === 'scroll') {
                const amount = action.amount || 400;
                const delta = action.direction === 'up' ? -amount : amount;
                window.scrollBy({ top: delta, behavior: 'smooth' });
                await reportResult(actionId, true, `Scrolled ${action.direction} by ${amount}px`);
            }
            else if (action.type === 'navigate' && action.url) {
                await reportResult(actionId, true, `Navigating to ${action.url}`);
                window.location.href = action.url;
            }
            else {
                await reportResult(actionId, true, `Action complete`);
            }
        } catch (err) {
            await reportResult(actionId, false, `Execution error: ${err.message}`);
        }
    }

    async function reportResult(actionId, success, message) {
        const state = captureState();
        await gmFetch(`${BRIDGE_HOST}/api/bridge/result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId,
                actionId,
                success,
                message,
                state
            })
        });
    }

    // Start heartbeat & polling loop
    sendHeartbeat();
    setInterval(sendHeartbeat, 4000);
    pollNextAction();

    // DOM Mutation Observer to keep state updated on SPAs
    let mutTimer = null;
    const observer = new MutationObserver(() => {
        clearTimeout(mutTimer);
        mutTimer = setTimeout(sendHeartbeat, 1000);
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

})();
