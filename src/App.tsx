/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, RotateCcw, HelpCircle, Radio, Chrome } from 'lucide-react';
import { BrowserAction, AgentTask, TaskStatus, ChatMessage, RealBrowserStateResponse, ModelInputInspector, AgentMemory } from './types/browser';
import { AgentChatWidget } from './components/chat/AgentChatWidget';
import { ChromiumBrowser } from './components/browser/ChromiumBrowser';
import { ModelInputWindow } from './components/browser/ModelInputWindow';

export default function App() {
  // Real Chromium Browser State
  const [realBrowserState, setRealBrowserState] = useState<RealBrowserStateResponse | null>(null);
  const [isLoadingBrowser, setIsLoadingBrowser] = useState<boolean>(false);

  // Agent State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);
  const [agentMemory, setAgentMemory] = useState<AgentMemory | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('stop');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<BrowserAction | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [modelInputInspector, setModelInputInspector] = useState<ModelInputInspector | null>(null);

  // Stop token to cancel running autonomous loops if user desires
  const cancelRequestedRef = useRef<boolean>(false);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const autoStepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep a fresh reference to messages to avoid stale closures in recursive calls
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const realBrowserStateRef = useRef(realBrowserState);
  realBrowserStateRef.current = realBrowserState;

  const activeTaskRef = useRef(activeTask);
  activeTaskRef.current = activeTask;

  const agentMemoryRef = useRef(agentMemory);
  agentMemoryRef.current = agentMemory;

  const taskStatusRef = useRef(taskStatus);
  taskStatusRef.current = taskStatus;

  // Fetch real Chromium browser state from server
  const fetchBrowserState = async () => {
    try {
      const res = await fetch('/api/firefox/state');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRealBrowserState(data);
        }
      }
    } catch (e) {
      console.warn('State fetch error:', e);
    }
  };

  useEffect(() => {
    fetchBrowserState();
    // Poll state periodically when idle so user sees updates
    const interval = setInterval(() => {
      if (!isProcessing) {
        fetchBrowserState();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Execute direct manual browser operations (clicks, navigation, tabs)
  const handleBrowserAction = async (action: string, params: Record<string, any> = {}) => {
    setIsLoadingBrowser(true);
    try {
      const res = await fetch('/api/firefox/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      });
      const data = await res.json();
      if (data.state) {
        setRealBrowserState(data.state);
      } else {
        await fetchBrowserState();
      }
    } catch (e) {
      console.error('Browser action failed:', e);
    } finally {
      setIsLoadingBrowser(false);
    }
  };

  const handleNavigate = (url: string) => handleBrowserAction('navigate', { url });
  const handleOpenTab = (url?: string) => handleBrowserAction('open_tab', { url: url || 'https://news.ycombinator.com' });
  const handleSwitchTab = (tabId: string) => handleBrowserAction('switch_tab', { tab_id: tabId });
  const handleCloseTab = (tabId: string) => handleBrowserAction('close_tab', { tab_id: tabId });
  const handleScroll = (direction: 'up' | 'down') => handleBrowserAction('scroll', { direction, amount: 400 });
  const handleManualClickCanvas = (x: number, y: number) => handleBrowserAction('mouse_click', { x, y });
  const handleKeyboardType = (text: string) => handleBrowserAction('keyboard_type', { text });
  const handleKeyboardPress = (key: string) => handleBrowserAction('keyboard_press', { key });
  const handleClearInput = () => handleBrowserAction('clear_input');

  // Agent Step Execution - Fully autonomous self-calling loop driving real Chromium
  const runAgentTurn = async (userPrompt: string = '', myself: boolean = false) => {
    // Clear any pending continuation timers
    if (autoStepTimeoutRef.current) {
      clearTimeout(autoStepTimeoutRef.current);
      autoStepTimeoutRef.current = null;
    }

    // USER PRIORITY INTERRUPT:
    // If the user sends a message while the agent is running/processing, immediately abort the in-flight request
    if (!myself && userPrompt) {
      if (activeAbortControllerRef.current) {
        try {
          activeAbortControllerRef.current.abort();
        } catch (_) {}
        activeAbortControllerRef.current = null;
      }
      cancelRequestedRef.current = false;

      // Detect user intent to stop, cancel, or change tasks
      const lower = userPrompt.toLowerCase();
      if (
        activeTaskRef.current && (
          lower.includes('stop') ||
          lower.includes('cancel') ||
          lower.includes('forget') ||
          lower.includes('instead') ||
          lower.includes('terminate') ||
          lower.includes('abort') ||
          lower.includes('new task')
        )
      ) {
        setActiveTask(null);
        activeTaskRef.current = null;
      }
    } else {
      if (isProcessing) return;
      if (cancelRequestedRef.current) {
        cancelRequestedRef.current = false;
        return;
      }
    }

    setIsProcessing(true);
    const timestamp = new Date().toISOString();

    // Create and attach new user message to state and messagesRef
    let currentHistoryList = [...messagesRef.current];
    if (userPrompt && !myself) {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userPrompt,
        timestamp,
      };
      currentHistoryList.push(userMsg);
      setMessages(currentHistoryList);
    }

    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    try {
      // Build turn history from the actual fresh current history
      const historyPayload = currentHistoryList.slice(-6).map((m) => ({
        role: m.sender,
        text: m.text,
        agent_text: m.text,
        action: m.action,
        task_status: m.task?.status,
        should_call_myself: m.myself,
        timestamp: m.timestamp,
      }));

      // Call API step: multimodal visual screenshot + accessibility tree + hardware actions
      const res = await fetch('/api/agent/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          user_prompt: userPrompt,
          myself,
          timestamp,
          history: historyPayload,
          active_task: activeTaskRef.current,
          agent_memory: agentMemoryRef.current,
          execute_action: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`Agent API returned status ${res.status}`);
      }

      const data = await res.json();

      if (data.modelInputInspector) {
        setModelInputInspector(data.modelInputInspector);
      }
      if (data.task) setActiveTask(data.task);
      if (data.agent_memory) {
        setAgentMemory(data.agent_memory);
        agentMemoryRef.current = data.agent_memory;
      }
      if (data.task_status) setTaskStatus(data.task_status);
      if (data.action) setLastAction(data.action);

      // Update real Chromium browser state if returned
      if (data.browserState) {
        setRealBrowserState(data.browserState);
      } else {
        fetchBrowserState();
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.agent_text || '',
        action: data.action,
        task: data.task,
        agent_memory: data.agent_memory,
        myself,
        timestamp: data.timestamp || timestamp,
        should_bother_user: data.should_bother_user,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsProcessing(false);

      // Autonomous Continuation (stops if cancelled, finished, or paused)
      const shouldContinue =
        !cancelRequestedRef.current &&
        data.action?.type !== 'finish' &&
        data.task_status !== 'pause' &&
        data.task_status !== 'stop' &&
        (data.should_call_myself || data.task_status === 'processing');

      if (shouldContinue) {
        autoStepTimeoutRef.current = setTimeout(() => {
          runAgentTurn('', true);
        }, 1200);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[Agent] In-flight step aborted by new user prompt.');
        return;
      }
      console.error('Agent turn failed:', err);
      setIsProcessing(false);
      setTaskStatus('stop');

      const errorMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'agent',
        text: `Error executing step: ${err.message}.`,
        timestamp: new Date().toISOString(),
        should_bother_user: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      if (activeAbortControllerRef.current === abortController) {
        activeAbortControllerRef.current = null;
      }
    }
  };

  const handleClearMemory = () => {
    setAgentMemory(null);
    agentMemoryRef.current = null;
  };

  const handleStopTask = () => {
    cancelRequestedRef.current = true;
    if (activeAbortControllerRef.current) {
      try {
        activeAbortControllerRef.current.abort();
      } catch (_) {}
      activeAbortControllerRef.current = null;
    }
    if (autoStepTimeoutRef.current) {
      clearTimeout(autoStepTimeoutRef.current);
      autoStepTimeoutRef.current = null;
    }
    setIsProcessing(false);
    setTaskStatus('stop');
    setActiveTask(null);
    activeTaskRef.current = null;
  };

  const handlePauseTask = () => {
    cancelRequestedRef.current = true;
    if (activeAbortControllerRef.current) {
      try {
        activeAbortControllerRef.current.abort();
      } catch (_) {}
      activeAbortControllerRef.current = null;
    }
    if (autoStepTimeoutRef.current) {
      clearTimeout(autoStepTimeoutRef.current);
      autoStepTimeoutRef.current = null;
    }
    setIsProcessing(false);
    setTaskStatus('pause');
    if (activeTask) {
      setActiveTask({ ...activeTask, status: 'pause' });
    }
  };

  const handleResumeTask = () => {
    cancelRequestedRef.current = false;
    setTaskStatus('processing');
    if (activeTask) {
      setActiveTask({ ...activeTask, status: 'processing' });
    }
    runAgentTurn('Resume current task from current page state', false);
  };

  const handleResetWorkspace = () => {
    cancelRequestedRef.current = true;
    if (activeAbortControllerRef.current) {
      try {
        activeAbortControllerRef.current.abort();
      } catch (_) {}
      activeAbortControllerRef.current = null;
    }
    if (autoStepTimeoutRef.current) {
      clearTimeout(autoStepTimeoutRef.current);
      autoStepTimeoutRef.current = null;
    }
    setMessages([]);
    setActiveTask(null);
    activeTaskRef.current = null;
    setTaskStatus('stop');
    setLastAction(null);
    handleNavigate('https://news.ycombinator.com');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Application Global Navbar */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 via-emerald-500 to-amber-500 flex items-center justify-center p-0.5 shadow-sm">
              <Chrome className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              Chromium Autonomous Browser Agent
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Chromium Engine Active</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
              (Native Hardware Clicks • Anti-Bot Evasions • Multi-Tab)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            onClick={handleResetWorkspace}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors"
            title="Reset Workspace"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Chromium Mini Browser Viewport + Autonomous Chat Widget */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Main Left Space: Interactive Chromium Browser Viewport */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          <ChromiumBrowser
            realBrowserState={realBrowserState}
            isLoadingBrowser={isLoadingBrowser}
            onNavigate={handleNavigate}
            onOpenTab={handleOpenTab}
            onSwitchTab={handleSwitchTab}
            onCloseTab={handleCloseTab}
            onRefresh={fetchBrowserState}
            onScroll={handleScroll}
            onManualClickCanvas={handleManualClickCanvas}
            onKeyboardType={handleKeyboardType}
            onKeyboardPress={handleKeyboardPress}
            onClearInput={handleClearInput}
            lastAction={lastAction}
          />
        </div>

        {/* Right Space: Autonomous Chat & Task Control Widget */}
        <AgentChatWidget
          messages={messages}
          activeTask={activeTask}
          taskStatus={taskStatus}
          isProcessing={isProcessing}
          onSendMessage={(prompt) => runAgentTurn(prompt, false)}
          onStopTask={handleStopTask}
          onPauseTask={handlePauseTask}
          onResumeTask={handleResumeTask}
          currentDomTokens={realBrowserState?.cleanedHtmlLength || 0}
        />
      </div>

      {/* Bottom Model Input Inspector Window */}
      <ModelInputWindow inspectorData={modelInputInspector} />

      {/* System Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Chromium Agent System Guide</h2>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-1">
                  1. Native Hardware Events & Real Tabs
                </h4>
                <p>
                  The engine runs real Playwright Chromium. When the agent types or clicks, it issues genuine hardware-level events (<code className="text-emerald-400">isTrusted: true</code>). It can open real new tabs, close them, and switch between them natively without DOM sandbox limits.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px] mb-1">
                  2. Anti-Detection Stealth Measures
                </h4>
                <p>
                  Chromium is launched with <code className="text-blue-400">navigator.webdriver = false</code>, mocked Chrome runtime objects, realistic device scale, audio/canvas fingerprint randomization, and simulated NVIDIA GPU context to avoid bot triggers.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-1">
                  3. Autonomous Self-Looping Execution
                </h4>
                <p>
                  When you give the agent a goal (e.g. "Find top articles on Hacker News and click the first one"), it plans the action, executes it on Chromium, inspects the updated DOM, and calls itself until the entire mission is finished.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
