import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { chromiumManager } from './chromiumManager.ts';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// 1. Get Live Browser State from Stealth Chromium Engine
app.get('/api/firefox/state', async (_req: Request, res: Response) => {
  try {
    const state = await chromiumManager.getState();
    console.log('ENDPOINT GET STATE AX LEN:', state.accessibilityTree?.length, typeof state.accessibilityTree);
    return res.json({ success: true, ...state, isChromium: true });
  } catch (err: any) {
    console.error('Failed to get chromium browser state:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Direct Browser Operations (Dispatched to Chromium via native CDP events)
app.post('/api/firefox/action', async (req: Request, res: Response) => {
  try {
    const { action, ...params } = req.body;

    if (action === 'navigate') {
      const state = await chromiumManager.navigate(params.url);
      return res.json({ success: true, state });
    }

    if (action === 'open_tab') {
      const state = await chromiumManager.openTab(params.url);
      return res.json({ success: true, state });
    }

    if (action === 'switch_tab') {
      const state = await chromiumManager.switchTab(params.tab_id);
      return res.json({ success: true, state });
    }

    if (action === 'close_tab') {
      const state = await chromiumManager.closeTab(params.tab_id);
      return res.json({ success: true, state });
    }

    if (action === 'click') {
      const result = await chromiumManager.click(params.target);
      return res.json(result);
    }

    if (action === 'right_click') {
      const result = await chromiumManager.rightClick(params.target);
      return res.json(result);
    }

    if (action === 'hover') {
      const result = await chromiumManager.hover(params.target);
      return res.json(result);
    }

    if (action === 'press_key') {
      const result = await chromiumManager.pressKey(params.key);
      return res.json(result);
    }

    if (action === 'drag_and_drop') {
      const result = await chromiumManager.dragAndDrop(params.source, params.target);
      return res.json(result);
    }

    if (action === 'mouse_click') {
      const state = await chromiumManager.mouseClickCoordinates(params.x, params.y);
      return res.json({ success: true, state });
    }

    if (action === 'keyboard_type') {
      const state = await chromiumManager.keyboardType(params.text || '');
      return res.json({ success: true, state });
    }

    if (action === 'keyboard_press') {
      const state = await chromiumManager.keyboardPress(params.key || 'Enter');
      return res.json({ success: true, state });
    }

    if (action === 'clear_input') {
      const state = await chromiumManager.clearFocusedInput();
      return res.json({ success: true, state });
    }

    if (action === 'type') {
      const result = await chromiumManager.type(params.target, params.value, params.submit);
      return res.json(result);
    }

    if (action === 'scroll') {
      const state = await chromiumManager.scroll(params.direction, params.amount);
      return res.json({ success: true, state });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    console.error('Failed to execute chromium browser action:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Autonomous Agent Step
app.post('/api/agent/step', async (req: Request, res: Response) => {
  try {
    const {
      user_prompt = '',
      web_page = '',
      myself = false,
      timestamp = new Date().toISOString(),
      history = [],
      active_task = null,
      agent_memory = null,
      execute_action = true,
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment variables' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Always fetch fresh state from the real Chromium engine
    const currentLiveState = await chromiumManager.getState();
    const livePage = currentLiveState.cleanedHtml;
    const currentUrl = currentLiveState.url;
    const currentTitle = currentLiveState.title;
    const activeTabId = currentLiveState.activeTabId;
    const tabsList = currentLiveState.tabs;

    const systemInstruction = `
You are an autonomous AI Agent with full physical control over a REAL Chromium Desktop Browser Engine.
You perceive the browser state through the active tab's live visual viewport screenshot (multimodal vision) and its compact accessibility tree ('[el-1]', '[el-2]'). You execute real hardware actions (clicks, typing, navigation, tab switching).

### ABSOLUTE AGENT INDEPENDENCE & PROACTIVE BROWSING (CRITICAL):
You are an autonomous AI Agent with full physical control over a REAL Chromium Desktop Browser Engine.
You have the internet at your fingertips. You DO NOT need human permission, assistance, or clarification to pick websites, search queries, or navigate.

1. **NO HELPLESS QUESTIONS — DECIDE AND ACT INDEPENDENTLY**:
   - NEVER ask questions like:
     * "Please specify which e-commerce website you would like me to use..."
     * "Which website should I go to?"
     * "Should I proceed with Amazon or eBay?"
     * "What URL would you like me to visit?"
   - If the user's prompt does not name a specific website (e.g. "create an account on an e-commerce site", "find me the cheapest dumbbells", "check recent tech news", "compare airline prices"):
     * **TAKE THE INITIATIVE IMMEDIATELY**.
     * Pick the premier destination yourself (e.g., Amazon, Walmart, Target, eBay, Google Shopping, DuckDuckGo, Wikipedia, etc.).
     * Immediately set action type to "navigate", begin the process, set task_status to "processing", and set should_call_myself to true.
   - **RULE ON ASKING QUESTIONS**: If you ever genuinely need human clarification (e.g., personal credentials, private budget), you MUST set "task_status": "pause" and "should_call_myself": false so the user can answer! If you ask a question while calling yourself ("should_call_myself": true), the user CANNOT answer and you will lock yourself in a loop talking to yourself!

2. **ACTIVE BROWSING & EXPLORATION (NOT LAZY FIRST-RESULT PICKING)**:
   - When asked to find, research, or compare something (e.g. "find me the cheapest dumbbell available", "find the top rated monitor", "compare prices"):
     * **NEVER just grab the very first item at the top of the search results!**
     * Real humans browse, scroll down, inspect multiple listings, click product links, check prices, and look at shipping/specifications.
     * **SCROLL TO EXPLORE**: Use action.type: "scroll" (direction: "down", amount: 500) to see below-the-fold options, pagination, and different brands.
     * **CROSS-EXAMINE**: Check 3–5 candidate items or sort by price (e.g. clicking "Sort: Price: Low to High").
     * Compare the options carefully before coming to a conclusion.
     * Once you have explored thoroughly, synthesize your findings and present the best choice with evidence (title, exact price, why it's the cheapest/best).

3. **TASK LIFECYCLE REASONING & INTENT UNDERSTANDING**:
   You must dynamically reason about whether to CONTINUE, PAUSE, TERMINATE, or SWITCH the task based on the user prompt and the page context:

   a. **REASSIGNMENT & TOPIC SWITCH (DROP THE OLD TASK)**:
      - If the user provides a prompt while an old task exists and:
        * It mentions a new topic, website, or action (e.g. user was buying on Amazon, now says "book a flight from mumbai to delhi"), OR
        * It uses phrasing like "forget this", "nevermind", "instead", "drop that", "cancel and do...", "switch to...", "actually, ...":
      - **YOU MUST INSTANTLY DROP AND TERMINATE THE OLD TASK**.
      - NEVER mention the old task. Immediately overwrite task with the new goal, write a fresh approach, set task_status to "processing", should_call_myself to true, and take the first real step (e.g. action type "navigate" to the new site).

   b. **AUTHENTICATION / USER-ONLY GATES (SMART PAUSE)**:
      - If you reach a sign-in wall (login credentials, 2FA, OTP, CAPTCHA, credit card PIN) that only the human can solve:
      - Set task_status to "pause", should_call_myself to false, and should_bother_user to true.
      - Ask the user to sign in or perform the verification on the browser viewport and notify you when ready.
      - BUT IF the user next message is a completely different command or says to forget it, IMMEDIATELY DROP IT and switch as per Rule a!

   c. **USER RESUMPTION / CONFIRMATION (SMART RESUME)**:
      - If user says "done", "logged in", "continue", "resume", "go ahead", or clicked proceed:
      - Set task_status to "processing", should_call_myself to true, inspect the newly logged-in page, and continue the objective.

   d. **TASK TERMINATION (USER TERMINATION OR COMPLETION)**:
      - If user says "stop", "cancel", "terminate", "abort", "quit", "leave it", or if you have finished every requirement of the goal:
      - Set task_status to "stop", should_call_myself to false, and deliver the closing summary in agent_text.

4. **INTERNAL AGENT WORKING MEMORY (COGNITIVE SCRATCHPAD)**:
   You have an explicit, stateful working memory ('agent_memory') that persists across turns:
   - Unlike ephemeral chat history which gets truncated, your working memory stays with you throughout your mission and is passed back to you on every turn.
   - You have full ownership and discretion over this memory:
     * working_notes: List of notes, findings, or reminders you want to keep track of across steps.
     * facts: List of key-value discoveries (e.g. [{ key: "Cheapest Dumbbell", value: "$19.99 (Walmart CAP Barbell)" }, { key: "Delivery", value: "Free 2-day shipping" }]).
     * candidates: List of items/options you have inspected and compared (e.g. [{ name: "Amazon Basics 20lb", price: "$29.99", source: "Amazon", details: "Cast iron pair" }, { name: "CAP 20lb Cast Iron", price: "$19.99", source: "Walmart", details: "Best price so far" }]).
   - **Memory Lifecycle**:
     * When starting a new task, initialize or overwrite memory with relevant tracking fields.
     * On every turn, keep what is still useful, update prices or facts with new findings, add newly found candidates, and drop obsolete data.
     * When comparing products, services, or flight options, ALWAYS store candidate items in candidates so you can make evidence-based comparisons.

### INPUT PARAMETERS:
1. user_prompt: Text instruction from user (can be empty when calling yourself).
2. Live Viewport Screenshot: High-res image showing the exact layout, colors, modals, and visible content.
3. Compact Accessibility Tree: Numbered interactive elements with target IDs (e.g. [el-1], [el-2]), roles, values, and states.
4. myself: Boolean. If true, YOU called yourself autonomously on the previous turn. If false, the user prompted.
5. timestamp: Current time for temporal awareness.
6. active_task: Persistent task map { title, summary, approach, status } kept outside turn history to prevent hallucination.
7. agent_memory: Persistent working memory { working_notes, facts, candidates } that you control across turns.

### HOW TO INTERACT WITH ELEMENTS:
- To CLICK a button, link, or tab: set action.type to "click", target to the element id like "el-17" (or [data-agent-id='el-17']).
- To RIGHT-CLICK (context menu): set action.type to "right_click", target to "el-17".
- To HOVER (flyout menus, dropdowns, tooltips): set action.type to "hover", target to "el-17".
- To TYPE into an input or combobox: set action.type to "type", target to "el-17", value to the clean string. Set submit: true if pressing Enter is needed.
- To PRESS KEY (Enter, Escape, Tab, ArrowDown, ArrowUp, Backspace): set action.type to "press_key", key to the key name (e.g. "Enter", "Escape", "ArrowDown").
- To DRAG & DROP: set action.type to "drag_and_drop", source to "el-5", target to "el-20".
- To NAVIGATE or SEARCH: set action.type to "navigate" and url to the full URL or a search query (it will automatically search DuckDuckGo).
- To OPEN TAB: set action.type to "open_tab" and provide the target url.
- To SWITCH TAB: set action.type to "switch_tab" and tab_id to the target tab id (e.g. "tab-2").
- To CLOSE TAB: set action.type to "close_tab" and tab_id.
- To SCROLL: set action.type to "scroll" and direction to "down" or "up" with amount (e.g. 500). Essential for browsing, examining lists, and viewing full pages!
- If a task is complete or user question is answered: set action.type to "finish" and task_status to "stop".

### UNIVERSAL WEB AGENT INTERACTION PRINCIPLES:
1. **Handling Modals, Overlays & Popovers**:
   - When an action triggers a modal, cookie consent, or popover (e.g. date pickers, promo overlays, filter dialogs), look for elements inside the active dialog.
   - Dismiss or interact with cookie banners and popovers immediately so you can view the main page content.
2. **Handling Comboboxes & Autocomplete Dropdowns**:
   - In typeahead inputs (city pickers, search suggestions, tags), typing text reveals a dropdown list of options ([role="option"], [role="listbox"]).
   - Autocomplete fields require selecting the desired item from the suggestions (either by clicking the suggested option's data-agent-id or pressing Enter). If you blur/click away without selection, web apps revert the field.
3. **Multi-Tab & New Window Synchronization**:
   - Check the [REAL CHROMIUM BROWSER STATE] -> [Open Tabs] list on every turn. If an action opened a new tab (such as a product detail page, checkout, or article), switch your focus using action.type: "switch_tab" with the corresponding tab_id.
4. **State Verification & Loop Avoidance**:
   - Always compare the current DOM with your previous step. If your last action did not change the page or a field reverted, DO NOT repeat the identical action. Investigate the cause: is there an open overlay, an unselected suggestion, or a submit button needed?

### AUTONOMOUS AGENT CONTINUATION (CRITICAL):
- If the user's objective requires MULTIPLE steps (searching, scrolling down, clicking links, inspecting pages, comparing info):
  * Set "should_call_myself": true
  * Set "task_status": "processing"
  * Set "should_bother_user": false
  * The system will execute your action on the real Chromium browser, refresh the DOM and viewport screenshot, and immediately call you again as [myself]: true so you continue without user intervention.
- If you ask the user a question or need them to do something:
  * Set "should_call_myself": false
  * Set "task_status": "pause"
  * Set "should_bother_user": true
- ONLY set "should_call_myself": false and "task_status": "stop" when the entire goal has been fully achieved and you are delivering the final result in "agent_text".

### STRICT RULES AGAINST HALLUCINATION:
1. Only perform ONE action at a time.
2. In action.value, keep the query concise and on ONE line (under 100 characters).
3. Only click or type into elements that genuinely exist in the provided Accessibility Tree.
4. Return strict valid JSON matching the schema.
`;

    const contents: any[] = [];
    const exactChatHistoryPayload: any[] = [];

    // History turns
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        if (turn.role === 'user') {
          const userEntry = {
            role: 'user',
            parts: [{ text: `User: ${turn.text || '[No prompt]'}` }],
          };
          contents.push(userEntry);
          exactChatHistoryPayload.push(userEntry);
        } else if (turn.role === 'agent') {
          const agentEntry = {
            role: 'model',
            parts: [
              {
                text: JSON.stringify({
                  agent_text: turn.agent_text || '',
                  action: turn.action,
                  task_status: turn.task_status,
                  should_call_myself: turn.should_call_myself,
                }),
              },
            ],
          };
          contents.push(agentEntry);
          exactChatHistoryPayload.push(agentEntry);
        }
      }
    }

    const currentTurnPrompt = `
=== CURRENT INVOCATION ===
[myself]: ${myself ? 'true (Autonomous continuation)' : 'false (User initiated)'}
[timestamp]: ${timestamp}
[user_prompt]: ${user_prompt || '(None - autonomous step)'}

[REAL CHROMIUM BROWSER STATE]:
- Active Tab: ${activeTabId}
- Current Title: "${currentTitle}"
- Current URL: ${currentUrl}
- Open Tabs:
${tabsList.map((t) => `  * [${t.id}] "${t.title}" (${t.url})${t.id === activeTabId ? ' <CURRENT ACTIVE TAB>' : ''}`).join('\n')}

[ACTIVE TASK STATE]:
${active_task ? JSON.stringify(active_task, null, 2) : 'No task registered. Create a clear task and strategic approach.'}

[AGENT WORKING MEMORY / SCRATCHPAD (Persistent across turns)]:
${agent_memory ? JSON.stringify(agent_memory, null, 2) : '(Empty - you can initialize this on this turn)'}

[COMPACT ACCESSIBILITY TREE (Current Page Interactive Elements & State)]:
${currentLiveState?.accessibilityTree || '(No accessibility elements found)'}

Decide your next single action, updated task map, updated agent_memory (if any notes, facts, or candidates to store/update/drop), agent_text, should_call_myself, task_status, and should_bother_user.
Return valid JSON.
`;

    const userParts: any[] = [];

    // Attach fresh screenshot as vision input if available
    let hasScreenshot = false;
    if (currentLiveState?.screenshotBase64 && currentLiveState.screenshotBase64.startsWith('data:image/')) {
      const match = currentLiveState.screenshotBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        userParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
        hasScreenshot = true;
      }
    }

    userParts.push({ text: currentTurnPrompt });

    contents.push({
      role: 'user',
      parts: userParts,
    });

    // Build complete raw input JSON for developer inspector
    const rawInputJson = {
      model: 'gemini-3.1-flash-lite',
      systemInstruction,
      contents: contents.map((c) => ({
        role: c.role,
        parts: c.parts.map((p: any) => {
          if (p.inlineData) {
            return {
              inlineData: {
                mimeType: p.inlineData.mimeType,
                dataLengthBytes: p.inlineData.data ? p.inlineData.data.length : 0,
                preview: '[BASE64_IMAGE_DATA_VIEWPORT_SCREENSHOT]',
              },
            };
          }
          return p;
        }),
      })),
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            agent_text: { type: 'STRING' },
            action: { type: 'OBJECT', required: ['type', 'summary'] },
            should_call_myself: { type: 'BOOLEAN' },
            task: { type: 'OBJECT', required: ['title', 'summary', 'approach', 'status'] },
            task_status: { type: 'STRING', enum: ['processing', 'pause', 'stop'] },
            agent_memory: { type: 'OBJECT' },
            should_bother_user: { type: 'BOOLEAN' },
            timestamp: { type: 'STRING' },
          },
        },
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            agent_text: { type: Type.STRING },
            action: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                target: { type: Type.STRING },
                source: { type: Type.STRING },
                key: { type: Type.STRING },
                value: { type: Type.STRING },
                url: { type: Type.STRING },
                direction: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                tab_id: { type: Type.STRING },
                submit: { type: Type.BOOLEAN },
                summary: { type: Type.STRING },
              },
              required: ['type', 'summary'],
            },
            should_call_myself: { type: Type.BOOLEAN },
            task: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                approach: { type: Type.STRING },
                status: { type: Type.STRING },
              },
              required: ['title', 'summary', 'approach', 'status'],
            },
            task_status: {
              type: Type.STRING,
              enum: ['processing', 'pause', 'stop'],
              description: 'Must be one of: processing, pause, stop',
            },
            agent_memory: {
              type: Type.OBJECT,
              properties: {
                working_notes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Active scratchpad notes, insights, or sub-goal reminders',
                },
                facts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                    required: ['key', 'value'],
                  },
                  description: 'Discovered key facts (e.g. key="Cheapest Dumbbell", value="$19.99 on Walmart")',
                },
                candidates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      price: { type: Type.STRING },
                      source: { type: Type.STRING },
                      details: { type: Type.STRING },
                    },
                    required: ['name'],
                  },
                  description: 'Items or candidate options compared so far',
                },
              },
            },
            should_bother_user: { type: Type.BOOLEAN },
            timestamp: { type: Type.STRING },
          },
          required: [
            'agent_text',
            'action',
            'should_call_myself',
            'task',
            'task_status',
            'should_bother_user',
            'timestamp',
          ],
        },
      },
    });

    let decision: any;
    try {
      decision = JSON.parse(response.text || '{}');

      // CRITICAL SAFEGUARD:
      // If the agent asks the user a question or explicitly requests user input/decision in agent_text,
      // it CANNOT call itself, otherwise the recursive loop locks out the user from answering!
      const textLower = (decision.agent_text || '').toLowerCase();
      const isAskingUser =
        textLower.includes('please specify') ||
        textLower.includes('which website') ||
        textLower.includes('please provide') ||
        textLower.includes('what url') ||
        textLower.includes('would you like me to') ||
        textLower.includes('let me know which') ||
        textLower.includes('can you tell me') ||
        (textLower.includes('?') && (textLower.includes('you') || textLower.includes('your') || textLower.includes('preference')));

      if (isAskingUser) {
        decision.should_call_myself = false;
        decision.task_status = 'pause';
        decision.should_bother_user = true;
      }

      if (decision.task_status) {
        const s = decision.task_status.toLowerCase();
        if (s.includes('process') || s.includes('in-progress') || s.includes('working') || s.includes('run')) {
          decision.task_status = 'processing';
        } else if (s.includes('pause') || s.includes('wait')) {
          decision.task_status = 'pause';
        } else if (s.includes('stop') || s.includes('done') || s.includes('finish') || s.includes('complete')) {
          decision.task_status = 'stop';
        } else {
          decision.task_status = decision.should_call_myself ? 'processing' : 'stop';
        }
      } else {
        decision.task_status = decision.should_call_myself ? 'processing' : 'stop';
      }

      // If task_status is pause or stop, should_call_myself must be false
      if (decision.task_status === 'pause' || decision.task_status === 'stop') {
        decision.should_call_myself = false;
      }

      if (decision.task) {
        decision.task.status = decision.task_status;
      }

      // Ensure agent_memory retains valid structure or preserves previous memory
      if (!decision.agent_memory) {
        decision.agent_memory = agent_memory || { working_notes: [], facts: [], candidates: [] };
      }
    } catch {
      decision = {
        agent_text: response.text || '',
        action: { type: 'wait', summary: 'Waiting for browser update' },
        should_call_myself: false,
        task: active_task || {
          title: 'Browser Automation',
          summary: 'Executing web interaction',
          approach: 'Inspect DOM and navigate',
          status: 'pause',
        },
        task_status: 'pause',
        agent_memory: agent_memory || { working_notes: [], facts: [], candidates: [] },
        should_bother_user: true,
        timestamp: new Date().toISOString(),
      };
    }

    // Automatically execute the action against real Chromium engine
    let executionResult: any = null;
    let updatedBrowserState = null;

    if (execute_action && decision.action) {
      const act = decision.action;
      try {
        if (act.type === 'click' && act.target) {
          executionResult = await chromiumManager.click(act.target);
        } else if (act.type === 'right_click' && act.target) {
          executionResult = await chromiumManager.rightClick(act.target);
        } else if (act.type === 'hover' && act.target) {
          executionResult = await chromiumManager.hover(act.target);
        } else if (act.type === 'press_key' && act.key) {
          executionResult = await chromiumManager.pressKey(act.key);
        } else if (act.type === 'drag_and_drop' && act.source && act.target) {
          executionResult = await chromiumManager.dragAndDrop(act.source, act.target);
        } else if (act.type === 'type' && act.target) {
          const cleanValue = (act.value || '').replace(/\s+/g, ' ').trim();
          decision.action.value = cleanValue;
          executionResult = await chromiumManager.type(act.target, cleanValue, act.submit);
        } else if (act.type === 'scroll') {
          updatedBrowserState = await chromiumManager.scroll(act.direction || 'down', act.amount || 400);
        } else if (act.type === 'navigate' && act.url) {
          updatedBrowserState = await chromiumManager.navigate(act.url);
        } else if (act.type === 'open_tab' && act.url) {
          updatedBrowserState = await chromiumManager.openTab(act.url);
        } else if (act.type === 'switch_tab' && act.tab_id) {
          updatedBrowserState = await chromiumManager.switchTab(act.tab_id);
        } else if (act.type === 'close_tab' && act.tab_id) {
          updatedBrowserState = await chromiumManager.closeTab(act.tab_id);
        } else if (act.type === 'wait') {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (execErr: any) {
        console.warn('Chromium action execution error:', execErr);
      }
    }

    if (!updatedBrowserState) {
      updatedBrowserState = await chromiumManager.getState().catch(() => null);
    }

    const rawOutputJson = {
      rawText: response.text || '',
      parsedDecision: decision,
      usageMetadata: response.usageMetadata || null,
      candidates: response.candidates || null,
    };

    return res.json({
      ...decision,
      executionResult,
      browserState: updatedBrowserState,
      isChromium: true,
      modelInputInspector: {
        timestamp: new Date().toISOString(),
        model: 'gemini-3.1-flash-lite',
        hasScreenshot,
        screenshotPreview: currentLiveState?.screenshotBase64 || null,
        userPrompt: user_prompt || '(None - autonomous step)',
        myself,
        activeTask: active_task,
        agentMemory: agent_memory || null,
        accessibilityTree: currentLiveState?.accessibilityTree || '',
        fullSystemInstruction: systemInstruction,
        fullCurrentTurnPrompt: currentTurnPrompt,
        chatHistory: exactChatHistoryPayload,
        recentHistoryCount: exactChatHistoryPayload.length,
        rawInputJson,
        rawOutputJson,
      },
    });
  } catch (err: any) {
    console.error('Agent step error:', err);
    return res.status(500).json({
      error: err.message,
      agent_text: `I encountered an issue connecting to the model: ${err.message}`,
      action: { type: 'wait', summary: 'Error recovery' },
      should_call_myself: false,
      task_status: 'pause',
      should_bother_user: true,
      timestamp: new Date().toISOString(),
    });
  }
});

async function startServer() {
  // Pre-initialize real Chromium browser instance
  chromiumManager.init().catch((err) => {
    console.warn('Chromium initial launch warning (will retry on first request):', err.message);
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('.', 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('.', 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & Chromium Engine listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
