import React, { useState } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Image as ImageIcon,
  MessageSquare,
  FileCode,
  Sparkles,
  FileInput,
  FileOutput,
} from 'lucide-react';
import { ModelInputInspector } from '../../types/browser';

interface Props {
  inspectorData: ModelInputInspector | null;
}

export const ModelInputWindow: React.FC<Props> = ({ inspectorData }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'raw_input' | 'raw_output' | 'accessibility' | 'history' | 'system' | 'screenshot'>('raw_input');
  const [copied, setCopied] = useState(false);

  if (!inspectorData) {
    return (
      <div className="bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-500 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-400">Model Input Monitor:</span>
          <span>Waiting for agent action to capture model input & exact chat history payload...</span>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getContentToCopy = () => {
    switch (activeTab) {
      case 'raw_input':
        return JSON.stringify(inspectorData.rawInputJson || {}, null, 2);
      case 'raw_output':
        return JSON.stringify(inspectorData.rawOutputJson || {}, null, 2);
      case 'prompt':
        return inspectorData.fullCurrentTurnPrompt;
      case 'accessibility':
        return inspectorData.accessibilityTree;
      case 'history':
        return JSON.stringify(inspectorData.chatHistory, null, 2);
      case 'system':
        return inspectorData.fullSystemInstruction;
      default:
        return inspectorData.fullCurrentTurnPrompt;
    }
  };

  return (
    <div
      className={`bg-slate-950 border-t border-slate-800 shadow-2xl transition-all duration-200 z-40 flex flex-col ${
        isOpen
          ? isExpanded
            ? 'h-[500px]'
            : 'h-[250px]'
          : 'h-8'
      }`}
    >
      {/* Window Top Titlebar */}
      <div className="h-8 bg-slate-900/90 border-b border-slate-800 px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-xs text-slate-200 tracking-tight flex items-center gap-1">
              Model Payload Inspector
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {inspectorData.model}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              {inspectorData.myself ? 'Autonomous continuation' : 'User directive'}
            </span>
            {inspectorData.hasScreenshot && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ImageIcon className="w-2.5 h-2.5" />
                Live Viewport Vision
              </span>
            )}
            <span className="text-slate-500">•</span>
            <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              History: {inspectorData.recentHistoryCount} turns
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-500 text-[10px]">
              Turn: {new Date(inspectorData.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Tab Controls and Actions */}
        <div className="flex items-center gap-1.5">
          {isOpen && (
            <>
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => setActiveTab('raw_input')}
                  className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                    activeTab === 'raw_input'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileInput className="w-2.5 h-2.5 text-emerald-300" />
                  Raw Input (JSON)
                </button>
                <button
                  onClick={() => setActiveTab('raw_output')}
                  className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                    activeTab === 'raw_output'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileOutput className="w-2.5 h-2.5 text-cyan-300" />
                  Raw Output (JSON)
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                    activeTab === 'history'
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-2.5 h-2.5" />
                  Chat History
                </button>
                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeTab === 'prompt'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Prompt & State
                </button>
                <button
                  onClick={() => setActiveTab('accessibility')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeTab === 'accessibility'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Accessibility Tree
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeTab === 'system'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  System Rules
                </button>
                {inspectorData.screenshotPreview && (
                  <button
                    onClick={() => setActiveTab('screenshot')}
                    className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                      activeTab === 'screenshot'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-2.5 h-2.5" />
                    Vision Screenshot
                  </button>
                )}
              </div>

              {activeTab !== 'screenshot' && (
                <button
                  onClick={() => handleCopy(getContentToCopy())}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Copy current tab content"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title={isExpanded ? 'Collapse height' : 'Expand height'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isOpen ? 'Minimize window' : 'Open window'}
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Body View */}
      {isOpen && (
        <div className="flex-1 overflow-auto bg-slate-950 p-2.5 font-mono text-xs">
          {activeTab === 'raw_input' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FileInput className="w-3.5 h-3.5 text-emerald-400" />
                  Exact Raw Gemini Model Input (JSON) — System, Contents & Schema:
                </span>
                <span className="text-slate-400">
                  Model: {inspectorData.rawInputJson?.model || inspectorData.model}
                </span>
              </div>
              <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed select-text text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                {JSON.stringify(inspectorData.rawInputJson || { note: 'No raw input payload captured yet' }, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'raw_output' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <FileOutput className="w-3.5 h-3.5 text-cyan-400" />
                  Exact Raw Gemini Model Output (JSON) — Response Text, Usage Tokens & Decision:
                </span>
                <span className="text-slate-400 font-mono">
                  {inspectorData.rawOutputJson?.usageMetadata
                    ? `${inspectorData.rawOutputJson.usageMetadata.totalTokenCount || 0} tokens`
                    : 'Tokens tracked'}
                </span>
              </div>
              <pre className="text-cyan-300 whitespace-pre-wrap leading-relaxed select-text text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                {JSON.stringify(inspectorData.rawOutputJson || { note: 'No raw output payload captured yet' }, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="text-purple-400 font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  Exact Chat History Payload Fed to Gemini (JSON):
                </span>
                <span className="text-slate-400">
                  {inspectorData.chatHistory?.length || 0} history turns
                </span>
              </div>
              <pre className="text-purple-300 whitespace-pre-wrap leading-relaxed select-text text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                {JSON.stringify(inspectorData.chatHistory, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="text-amber-400 font-semibold">User Directive & Prompt Assembly:</span>
                <span>Active Task: {inspectorData.activeTask?.title || 'None registered'}</span>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed select-text text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                {inspectorData.fullCurrentTurnPrompt}
              </pre>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="text-emerald-400 font-semibold">Numbered Interactive Accessibility Targets:</span>
                <span>Elements: {(inspectorData.accessibilityTree.match(/\[el-\d+\]/g) || []).length} interactive items</span>
              </div>
              <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed select-text text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                {inspectorData.accessibilityTree || 'No interactive accessibility elements found on current page.'}
              </pre>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="text-blue-400 font-semibold">System Rules & Task Lifecycle Instructions:</span>
                <span>Includes task termination, reassignment drop rules, and hardware API</span>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed select-text text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                {inspectorData.fullSystemInstruction}
              </pre>
            </div>
          )}

          {activeTab === 'screenshot' && inspectorData.screenshotPreview && (
            <div className="flex flex-col items-center justify-center p-2 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between w-full">
                <span className="text-purple-400 font-semibold">Live Chromium Viewport fed into Gemini Vision:</span>
                <span>High Resolution Base64 JPEG</span>
              </div>
              <img
                src={inspectorData.screenshotPreview}
                alt="Viewport Screenshot fed to Gemini"
                className="max-h-[380px] object-contain rounded border border-slate-700 shadow-md"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
