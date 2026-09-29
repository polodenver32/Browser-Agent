export type ActionType =
  | 'click'
  | 'right_click'
  | 'hover'
  | 'type'
  | 'press_key'
  | 'drag_and_drop'
  | 'scroll'
  | 'open_tab'
  | 'navigate'
  | 'switch_tab'
  | 'close_tab'
  | 'wait'
  | 'finish';

export interface BrowserAction {
  type: ActionType;
  target?: string;
  source?: string;
  key?: string;
  value?: string;
  url?: string;
  direction?: 'up' | 'down';
  amount?: number;
  tab_id?: string;
  submit?: boolean;
  summary: string;
}

export type TaskStatus = 'processing' | 'pause' | 'stop';

export interface AgentMemoryCandidate {
  name: string;
  price?: string;
  source?: string;
  details?: string;
}

export interface AgentMemoryFact {
  key: string;
  value: string;
}

export interface AgentMemory {
  working_notes?: string[];
  facts?: AgentMemoryFact[];
  candidates?: AgentMemoryCandidate[];
}

export interface AgentTask {
  title: string;
  summary: string;
  approach: string;
  status: TaskStatus;
}

export interface AgentTurnResponse {
  agent_text: string;
  action: BrowserAction;
  should_call_myself: boolean;
  task: AgentTask;
  task_status: TaskStatus;
  agent_memory?: AgentMemory;
  should_bother_user: boolean;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  action?: BrowserAction;
  task?: AgentTask;
  agent_memory?: AgentMemory;
  myself?: boolean;
  timestamp: string;
  should_bother_user?: boolean;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  isLoading?: boolean;
}

export interface StrippedHtmlInfo {
  rawLength: number;
  cleanedLength: number;
  reductionPercentage: number;
  elementCount: number;
  html: string;
}

export interface FocusedElementInfo {
  tagName: string;
  type?: string;
  placeholder?: string;
  name?: string;
  value?: string;
  isInput: boolean;
}

export interface RealBrowserStateResponse {
  activeTabId: string;
  tabs: BrowserTab[];
  url: string;
  title: string;
  screenshotBase64: string;
  cleanedHtml: string;
  accessibilityTree?: string;
  elementCount: number;
  rawHtmlLength: number;
  cleanedHtmlLength: number;
  focusedElement?: FocusedElementInfo | null;
  isLocalBrowser?: boolean;
  clientName?: string;
}

export interface ModelInputInspector {
  timestamp: string;
  model: string;
  hasScreenshot: boolean;
  screenshotPreview?: string | null;
  userPrompt: string;
  myself: boolean;
  activeTask: AgentTask | null;
  agentMemory?: AgentMemory | null;
  accessibilityTree: string;
  fullSystemInstruction: string;
  fullCurrentTurnPrompt: string;
  chatHistory: any[];
  recentHistoryCount: number;
  rawInputJson?: any;
  rawOutputJson?: any;
}
