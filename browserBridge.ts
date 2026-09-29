import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { firefoxManager } from './firefoxManager';

export interface LocalBrowserClient {
  id: string;
  ws?: WebSocket;
  type: 'ws' | 'http';
  connectedAt: number;
  lastPing: number;
  browserType?: string;
  url?: string;
  title?: string;
}

interface QueuedAction {
  actionId: string;
  action: any;
  createdAt: number;
}

class BrowserBridgeManager {
  private wss: WebSocketServer | null = null;
  private activeClients: Map<string, LocalBrowserClient> = new Map();
  private primaryClientId: string | null = null;
  private pendingActionResolvers: Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timeout: NodeJS.Timeout }> = new Map();
  private latestRemoteState: any = null;

  // HTTP Long-Polling Queue
  private actionQueue: Map<string, QueuedAction[]> = new Map();
  private waitingPollResponses: Map<string, (actionData: any) => void> = new Map();

  public init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/api/bridge/ws' });

    this.wss.on('connection', (ws, req) => {
      const clientId = `client-ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[Bridge WS] Local browser connected: ${clientId} from ${req.socket.remoteAddress}`);

      const clientInfo: LocalBrowserClient = {
        id: clientId,
        ws,
        type: 'ws',
        connectedAt: Date.now(),
        lastPing: Date.now(),
      };

      this.activeClients.set(clientId, clientInfo);
      this.primaryClientId = clientId;

      ws.send(JSON.stringify({
        type: 'HANDSHAKE_ACK',
        clientId,
        message: 'Connected to AI Studio Browser Agent Bridge',
      }));

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleClientMessage(clientId, msg);
        } catch (e) {
          console.warn('[Bridge WS] Invalid JSON from client:', e);
        }
      });

      ws.on('close', () => {
        console.log(`[Bridge WS] Local browser disconnected: ${clientId}`);
        this.activeClients.delete(clientId);
        if (this.primaryClientId === clientId) {
          const next = this.activeClients.keys().next().value;
          this.primaryClientId = next || null;
        }
      });

      ws.on('error', (err) => {
        console.error(`[Bridge WS] WebSocket error on ${clientId}:`, err.message);
      });
    });

    console.log('[Bridge] Browser Bridge initialized (WebSocket + HTTP Polling supported)');
  }

  // Handle HTTP Heartbeat / State Update from Userscript
  public handleHttpStateUpdate(clientId: string, data: any) {
    if (!this.activeClients.has(clientId)) {
      this.activeClients.set(clientId, {
        id: clientId,
        type: 'http',
        connectedAt: Date.now(),
        lastPing: Date.now(),
      });
    }

    const client = this.activeClients.get(clientId)!;
    client.lastPing = Date.now();
    client.url = data.url;
    client.title = data.title;
    this.primaryClientId = clientId;

    let cleanedHtml = data.html || '';
    let cleanedHtmlLength = cleanedHtml.length;
    let elementCount = 0;

    if (cleanedHtml) {
      const cleaned = firefoxManager.cleanHtml(cleanedHtml);
      cleanedHtml = cleaned.cleanedHtml;
      cleanedHtmlLength = cleaned.cleanedLength;
      elementCount = cleaned.elementCount;
    }

    this.latestRemoteState = {
      activeTabId: clientId,
      tabs: [{ id: clientId, title: data.title || 'Personal Browser Tab', url: data.url || '', isLoading: false }],
      url: data.url || '',
      title: data.title || 'Personal Browser Tab',
      screenshotBase64: '',
      cleanedHtml,
      elementCount,
      rawHtmlLength: data.html ? data.html.length : 0,
      cleanedHtmlLength,
      isLocalBrowser: true,
      clientName: data.browserName || 'Your Personal Desktop Browser',
    };
  }

  // Handle Long Polling for next action
  public registerPollListener(clientId: string, callback: (actionData: any) => void) {
    const queue = this.actionQueue.get(clientId);
    if (queue && queue.length > 0) {
      const nextAction = queue.shift()!;
      callback(nextAction);
      return;
    }

    // Save callback for when an action arrives
    this.waitingPollResponses.set(clientId, callback);
    // Timeout poll after 25s
    setTimeout(() => {
      if (this.waitingPollResponses.get(clientId) === callback) {
        this.waitingPollResponses.delete(clientId);
        callback({ action: null });
      }
    }, 25000);
  }

  // Handle Action Result from Userscript
  public handleHttpActionResult(clientId: string, actionId: string, success: boolean, message: string, state?: any) {
    if (state) {
      this.handleHttpStateUpdate(clientId, state);
    }

    if (this.pendingActionResolvers.has(actionId)) {
      const { resolve, timeout } = this.pendingActionResolvers.get(actionId)!;
      clearTimeout(timeout);
      this.pendingActionResolvers.delete(actionId);
      resolve({ success, message, state: this.latestRemoteState });
    }
  }

  private handleClientMessage(clientId: string, msg: any) {
    const client = this.activeClients.get(clientId);
    if (!client) return;

    client.lastPing = Date.now();

    if (msg.type === 'STATE_UPDATE') {
      this.handleHttpStateUpdate(clientId, msg);
    } else if (msg.type === 'ACTION_RESULT') {
      this.handleHttpActionResult(clientId, msg.actionId, msg.success, msg.message, msg.state);
    }
  }

  public isLocalBrowserConnected(): boolean {
    const now = Date.now();
    // Prune stale clients (inactive > 20s)
    for (const [id, client] of this.activeClients.entries()) {
      if (now - client.lastPing > 20000) {
        this.activeClients.delete(id);
        if (this.primaryClientId === id) {
          this.primaryClientId = this.activeClients.keys().next().value || null;
        }
      }
    }
    return this.primaryClientId !== null && this.activeClients.has(this.primaryClientId);
  }

  public getConnectedClientsCount(): number {
    return this.activeClients.size;
  }

  public getLatestRemoteState() {
    return this.latestRemoteState;
  }

  public async executeActionOnLocalBrowser(action: any): Promise<{ success: boolean; message: string; state?: any }> {
    if (!this.isLocalBrowserConnected()) {
      return { success: false, message: 'No local browser connected via extension/userscript' };
    }

    const client = this.activeClients.get(this.primaryClientId!)!;
    const actionId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Resolve any mapped #L numbers into real URLs
    if (action.target && action.target.startsWith('#L')) {
      const realUrl = firefoxManager.getRealUrlForLink(action.target.substring(1));
      if (realUrl) {
        action.resolvedUrl = realUrl;
      }
    }
    if (action.url && action.url.startsWith('#L')) {
      const realUrl = firefoxManager.getRealUrlForLink(action.url.substring(1));
      if (realUrl) {
        action.url = realUrl;
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingActionResolvers.has(actionId)) {
          this.pendingActionResolvers.delete(actionId);
          resolve({ success: false, message: 'Action execution timed out waiting for personal browser response.' });
        }
      }, 20000);

      this.pendingActionResolvers.set(actionId, { resolve, reject, timeout });

      if (client.type === 'ws' && client.ws && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'EXECUTE_ACTION',
          actionId,
          action,
        }));
      } else {
        // HTTP long-polling dispatch
        const waitingCallback = this.waitingPollResponses.get(client.id);
        if (waitingCallback) {
          this.waitingPollResponses.delete(client.id);
          waitingCallback({ actionId, action });
        } else {
          const q = this.actionQueue.get(client.id) || [];
          q.push({ actionId, action, createdAt: Date.now() });
          this.actionQueue.set(client.id, q);
        }
      }
    });
  }
}

export const browserBridge = new BrowserBridgeManager();
