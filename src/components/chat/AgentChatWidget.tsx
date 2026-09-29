import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  MousePointer,
  RotateCcw,
  Pause,
  Play,
  Square,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { AgentTask, BrowserAction, ChatMessage, TaskStatus } from '../../types/browser';

interface Props {
  messages: ChatMessage[];
  activeTask: AgentTask | null;
  taskStatus: TaskStatus;
  isProcessing: boolean;
  onSendMessage: (text: string) => void;
  onStopTask: () => void;
  onPauseTask?: () => void;
  onResumeTask?: () => void;
  currentDomTokens: number;
}

export const AgentChatWidget: React.FC<Props> = ({
  messages,
  activeTask,
  taskStatus,
  isProcessing,
  onSendMessage,
  onStopTask,
  onPauseTask,
  onResumeTask,
  currentDomTokens,
}) => {
  const [inputText, setInputText] = useState('');
  const [showApproach, setShowApproach] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const sampleTasks = [
    {
      title: 'Cheapest Dumbbells Comparison',
      prompt: 'Search the web for the cheapest dumbbells available, scroll through the listings to compare prices across options, and recommend the best deal.',
    },
    {
      title: 'Hacker News Top Discussions',
      prompt: 'Browse Hacker News, scroll down the front page, click into the top debate, and summarize the consensus.',
    },
    {
      title: 'Wikipedia Deep Dive',
      prompt: 'Navigate to Wikipedia, search for Alan Turing, scroll through his contributions to computing, and find his enigma codebreaking work.',
    },
    {
      title: 'Compare Tech News Headlines',
      prompt: 'Search for recent breakthroughs in AI agents, browse 2-3 top article links, and give me a synthesized summary.',
    },
  ];

  return (
    <div className="w-full md:w-[440px] lg:w-[480px] h-full flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl relative">
      {/* 1. Header with Autonomous Agent Status */}
      <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-pink-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Bot className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Autonomous Agent
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Gemini 3.1 Flash Lite
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isProcessing
                    ? 'bg-emerald-400 animate-ping'
                    : taskStatus === 'processing'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-400 capitalize font-medium">
                {isProcessing
                  ? 'Executing autonomous action...'
                  : taskStatus === 'processing'
                  ? 'Autonomous loop running'
                  : 'Idle — ready for instructions'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Autonomous Badge & Controls */}
        <div className="flex items-center gap-1.5">
          {taskStatus === 'processing' && onPauseTask && (
            <button
              onClick={onPauseTask}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-medium border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors"
              title="Pause autonomous loop (e.g. to sign in or inspect page)"
            >
              <Pause className="w-3 h-3 text-amber-400" />
              <span>Pause</span>
            </button>
          )}

          {taskStatus === 'pause' && onResumeTask && (
            <button
              onClick={onResumeTask}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-medium border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-colors animate-pulse"
              title="Resume autonomous loop"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Resume</span>
            </button>
          )}

          {(taskStatus === 'processing' || taskStatus === 'pause') && (
            <button
              onClick={onStopTask}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-medium border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
              title="Cancel current task"
            >
              <Square className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
              <span>Cancel</span>
            </button>
          )}

          <div className="px-2 py-1 rounded-lg text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1 hidden sm:flex">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Autonomous</span>
          </div>
        </div>
      </div>

      {/* 2. Persistent Active Task & Approach Card (Outside Turn History) */}
      {activeTask && taskStatus === 'processing' && (
        <div className="bg-slate-850 border-b border-slate-800 p-3 bg-slate-900/60">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Current Goal
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  in progress
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-100 truncate">
                {activeTask.title}
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                {activeTask.summary}
              </p>
            </div>
          </div>

          {/* Collapsible Approach & Strategy */}
          {activeTask.approach && (
            <div className="mt-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowApproach(!showApproach)}
                className="w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-200"
              >
                <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-orange-400" />
                  Strategy & Approach
                </span>
                {showApproach ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showApproach && (
                <p className="mt-1.5 text-[11px] font-mono text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                  {activeTask.approach}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Human Security Check / Captcha Helper Banner */}
      {taskStatus === 'pause' && (
        <div className="bg-amber-950/50 border-b border-amber-600/40 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Agent Paused for Human Verification</span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Click directly on the browser viewport to solve the checkbox or captcha puzzle (using natural Bézier mouse curves). Once solved, click resume below:
          </p>
          {onResumeTask && (
            <button
              onClick={() => onResumeTask()}
              className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>I solved it — Resume Task</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Conversation & Action Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">
              Autonomous Browser Agent Ready
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-6">
              Give the agent any goal. It perceives the real Firefox page, formulates a strategy, and loops automatically until the task is complete.
            </p>

            {/* Quick Prompts */}
            <div className="w-full space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Quick Prompts
              </span>
              {sampleTasks.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(t.prompt)}
                  disabled={isProcessing}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-orange-500/40 text-xs text-slate-300 hover:text-white transition-all group"
                >
                  <div className="font-semibold text-orange-400 group-hover:text-orange-300 mb-0.5">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {t.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAgent ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isAgent
                      ? 'bg-gradient-to-tr from-orange-500 to-pink-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className={`space-y-1.5 max-w-[85%] ${isAgent ? '' : 'text-right'}`}>
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="font-semibold">{isAgent ? 'Agent' : 'You'}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    {msg.myself && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20 text-[9px] font-mono">
                        auto-step
                      </span>
                    )}
                    {msg.should_bother_user && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px]">
                        user alert
                      </span>
                    )}
                  </div>

                  {/* Text content */}
                  {msg.text && (
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isAgent
                          ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/80 shadow-sm'
                          : 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Physical Action Pill (if agent performed action) */}
                  {msg.action && (
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                      <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                        <MousePointer className="w-3.5 h-3.5" />
                        <span className="uppercase text-[11px]">{msg.action.type}</span>
                        {msg.action.summary && (
                          <span className="text-slate-400 font-normal truncate text-[11px]">
                            — {msg.action.summary}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 space-y-0.5 pl-5">
                        {msg.action.target && (
                          <div>
                            Target: <span className="text-emerald-400 font-semibold">{msg.action.target}</span>
                          </div>
                        )}
                        {msg.action.source && (
                          <div>
                            Source: <span className="text-amber-400 font-semibold">{msg.action.source}</span>
                          </div>
                        )}
                        {msg.action.key && (
                          <div>
                            Key: <span className="text-purple-400 font-semibold">[{msg.action.key}]</span>
                          </div>
                        )}
                        {msg.action.value && (
                          <div className="truncate max-w-xs">
                            Value: <span className="text-sky-400">"{msg.action.value.trim()}"</span>
                          </div>
                        )}
                        {msg.action.url && (
                          <div>
                            URL: <span className="text-indigo-400 truncate">{msg.action.url}</span>
                          </div>
                        )}
                        {msg.action.direction && (
                          <div>
                            Direction: <span className="text-amber-400">{msg.action.direction}</span> ({msg.action.amount || 400}px)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-orange-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 animate-pulse font-mono">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            <span>Agent inspecting Chromium viewport & executing next action...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Token & DOM Stats Bar */}
      <div className="px-4 py-1.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>DOM Payload: {(currentDomTokens).toLocaleString()} chars</span>
        <span className="text-emerald-400">Autonomous loop active</span>
      </div>

      {/* 5. Input Prompt Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isProcessing ? 'Type here to redirect, pause, or change task anytime...' : 'Give the agent a task (or say "forget this and...")'}
          className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-all flex items-center justify-center shrink-0"
          title="Send instruction to agent"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
