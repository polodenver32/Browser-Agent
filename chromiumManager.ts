import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, BrowserContext, Page } from 'playwright';
import { execSync } from 'child_process';

// Activate battle-tested open-source stealth plugin
// Automatically handles navigator.webdriver, chrome runtime, permissions, WebGL, plugins, codecs
chromium.use(StealthPlugin());

export interface RealTabInfo {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
}

export interface FocusedElementInfo {
  tagName: string;
  type?: string;
  placeholder?: string;
  name?: string;
  value?: string;
  isInput: boolean;
}

export interface RealBrowserState {
  activeTabId: string;
  tabs: RealTabInfo[];
  url: string;
  title: string;
  screenshotBase64: string;
  cleanedHtml: string;
  accessibilityTree: string;
  elementCount: number;
  rawHtmlLength: number;
  cleanedHtmlLength: number;
  focusedElement?: FocusedElementInfo | null;
}

class ChromiumManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Map<string, Page> = new Map();
  private activePageId: string = 'tab-1';
  private isInitializing: boolean = false;
  private tabCounter: number = 1;
  // Link map: maps indexed refs like #L1, #L2 to real target URLs
  private linkMap: Map<string, string> = new Map();

  public async init(): Promise<void> {
    if (this.browser && this.context) return;
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise((r) => setTimeout(r, 200));
      }
      return;
    }

    this.isInitializing = true;
    try {
      console.log('[Chromium] Launching battle-tested Chromium instance with anti-detection profile...');
      const launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-gpu',
          '--window-size=1280,800',
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-infobars',
          '--no-default-browser-check',
          '--lang=en-US,en',
        ],
        ignoreDefaultArgs: ['--enable-automation'],
      };

      try {
        this.browser = (await chromium.launch(launchOptions)) as unknown as Browser;
      } catch (launchErr: any) {
        const errMsg = String(launchErr?.message || '');
        if (errMsg.includes("doesn't exist") || errMsg.includes('Executable') || errMsg.includes('chromium')) {
          console.warn('[Chromium] Missing browser executable detected! Auto-downloading Playwright Chromium now...');
          try {
            execSync('npx playwright install chromium', { stdio: 'inherit' });
            console.log('[Chromium] Playwright Chromium installed successfully. Retrying launch...');
            this.browser = (await chromium.launch(launchOptions)) as unknown as Browser;
          } catch (installErr) {
            console.error('[Chromium] Failed to auto-install Playwright Chromium:', installErr);
            throw launchErr;
          }
        } else {
          throw launchErr;
        }
      }

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        permissions: ['geolocation', 'notifications'],
      });

      // Comprehensive stealth script: bypasses Google "This browser or app may not be secure" / dangerous environment check
      await this.context.addInitScript(() => {
        // 1. Remove navigator.webdriver & automation flags
        try {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true,
          });
          const proto = Object.getPrototypeOf(navigator);
          if (proto && 'webdriver' in proto) {
            delete (proto as any).webdriver;
          }
        } catch (_) {}

        // 2. Mock complete window.chrome and chrome.runtime (checked by Google BotGuard)
        try {
          if (!(window as any).chrome) {
            (window as any).chrome = {};
          }
          const ch = (window as any).chrome;
          ch.app = {
            isInstalled: false,
            InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
            RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
          };
          ch.runtime = {
            OnInstalledReason: { INSTALL: 'install', UPDATE: 'update', CHROME_UPDATE: 'chrome_update', SHARED_MODULE_UPDATE: 'shared_module_update' },
            OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
            PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
            PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
            PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
            RequestUpdateCheckStatus: { THROTTLED: 'throttled', NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' },
            connect: function () {},
            sendMessage: function () {},
          };
          ch.loadTimes = function () {
            return {
              commitLoadTime: Date.now() / 1000 - 0.4,
              connectionInfo: 'h2',
              finishDocumentLoadTime: Date.now() / 1000 - 0.1,
              finishLoadTime: Date.now() / 1000,
              firstPaintAfterLoadTime: 0,
              firstPaintTime: Date.now() / 1000 - 0.2,
              navigationType: 'Other',
              npnNegotiatedProtocol: 'h2',
              requestTime: Date.now() / 1000 - 0.6,
              startLoadTime: Date.now() / 1000 - 0.5,
              wasAlternateProtocolAvailable: false,
              wasFetchedViaSpdy: true,
              wasNpnNegotiated: true,
            };
          };
          ch.csi = function () {
            return {
              startE: Date.now() - 400,
              onloadT: Date.now(),
              pageT: 400,
              tran: 15,
            };
          };
        } catch (_) {}

        // 3. UserAgentData Client Hints (Crucial for Google Accounts login on Chrome)
        try {
          Object.defineProperty(navigator, 'userAgentData', {
            get: () => ({
              brands: [
                { brand: 'Chromium', version: '130' },
                { brand: 'Google Chrome', version: '130' },
                { brand: 'Not?A_Brand', version: '99' },
              ],
              mobile: false,
              platform: 'Windows',
              getHighEntropyValues: async () => ({
                architecture: 'x86',
                bitness: '64',
                brands: [
                  { brand: 'Chromium', version: '130' },
                  { brand: 'Google Chrome', version: '130' },
                  { brand: 'Not?A_Brand', version: '99' },
                ],
                fullVersionList: [
                  { brand: 'Chromium', version: '130.0.6723.116' },
                  { brand: 'Google Chrome', version: '130.0.6723.116' },
                  { brand: 'Not?A_Brand', version: '99.0.0.0' },
                ],
                mobile: false,
                model: '',
                platform: 'Windows',
                platformVersion: '15.0.0',
              }),
            }),
            configurable: true,
          });
        } catch (_) {}

        // 4. Realistic Plugins and MimeTypes array
        try {
          if (navigator.plugins.length === 0) {
            const pluginData = [
              { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
              { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
              { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
              { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
              { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            ];
            const plugins = Object.create(PluginArray.prototype);
            pluginData.forEach((p, idx) => {
              const plugin = Object.create(Plugin.prototype);
              Object.defineProperties(plugin, {
                name: { value: p.name, enumerable: true },
                filename: { value: p.filename, enumerable: true },
                description: { value: p.description, enumerable: true },
                length: { value: 0, enumerable: true },
              });
              plugins[idx] = plugin;
              plugins[p.name] = plugin;
            });
            Object.defineProperty(plugins, 'length', { value: pluginData.length });
            Object.defineProperty(navigator, 'plugins', { get: () => plugins, configurable: true });
          }
        } catch (_) {}

        // 5. Languages & Hardware Specs
        try {
          Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
          Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });
          Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });
        } catch (_) {}

        // 6. Window Outer Dimensions & Screen Depth
        try {
          Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth || 1280, configurable: true });
          Object.defineProperty(window, 'outerHeight', { get: () => (window.innerHeight || 800) + 85, configurable: true });
          if (window.screen) {
            Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
            Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });
          }
        } catch (_) {}

        // 7. WebGL Vendor & Renderer spoofing (Blocks BotGuard virtual machine detection)
        try {
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
            if (parameter === 37445) return 'Google Inc. (NVIDIA)';
            if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)';
            return getParameter.apply(this, [parameter]);
          };
          if (window.WebGL2RenderingContext) {
            const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
            WebGL2RenderingContext.prototype.getParameter = function (parameter: number) {
              if (parameter === 37445) return 'Google Inc. (NVIDIA)';
              if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)';
              return getParameter2.apply(this, [parameter]);
            };
          }
        } catch (_) {}

        // 8. Notification Permissions query
        try {
          if (navigator.permissions && navigator.permissions.query) {
            const origQuery = navigator.permissions.query.bind(navigator.permissions);
            navigator.permissions.query = (parameters: any) => {
              if (parameters && parameters.name === 'notifications') {
                return Promise.resolve({
                  state: Notification.permission || 'default',
                  onchange: null,
                } as any);
              }
              return origQuery(parameters);
            };
          }
        } catch (_) {}
      });

      // Crucial: Automatically detect any popups or new tabs (e.g. MakeMyTrip "Book Now" window.open)
      this.context.on('page', async (newPage: Page) => {
        const newId = `tab-${++this.tabCounter}`;
        console.log(`[Chromium] New popup/tab opened automatically by website: ${newId}`);
        this.pages.set(newId, newPage);
        this.activePageId = newId;
        this.setupPageListeners(newPage, newId);
        await newPage.waitForLoadState('domcontentloaded').catch(() => {});
      });

      const initialPage = await this.context.newPage();
      this.pages.set('tab-1', initialPage);
      this.activePageId = 'tab-1';
      this.setupPageListeners(initialPage, 'tab-1');

      await initialPage.goto('https://news.ycombinator.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      console.log('[Chromium] Stealth Chromium initialized and active on tab-1.');
    } catch (err) {
      console.error('[Chromium] Failed to launch Chromium:', err);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  private setupPageListeners(page: Page, id: string): void {
    page.on('close', () => {
      console.log(`[Chromium] Tab closed: ${id}`);
      this.pages.delete(id);
      if (this.activePageId === id) {
        const remaining = Array.from(this.pages.keys());
        this.activePageId = remaining[remaining.length - 1] || 'tab-1';
      }
    });

    page.on('crash', () => {
      console.warn(`[Chromium] Tab crashed: ${id}`);
      this.pages.delete(id);
    });
  }

  // Synchronize internal page map with actual live context pages
  private async syncPages(): Promise<void> {
    if (!this.context) return;
    const contextPages = this.context.pages();

    // Remove any pages that are closed
    for (const [id, p] of Array.from(this.pages.entries())) {
      if (p.isClosed() || !contextPages.includes(p)) {
        this.pages.delete(id);
      }
    }

    // Add any context page that wasn't registered
    for (const cp of contextPages) {
      if (cp.isClosed()) continue;
      const alreadyHas = Array.from(this.pages.values()).includes(cp);
      if (!alreadyHas) {
        const newId = `tab-${++this.tabCounter}`;
        this.pages.set(newId, cp);
        this.setupPageListeners(cp, newId);
        this.activePageId = newId;
      }
    }

    if (!this.pages.has(this.activePageId) || this.pages.get(this.activePageId)?.isClosed()) {
      const firstActive = Array.from(this.pages.keys()).pop();
      if (firstActive) {
        this.activePageId = firstActive;
      }
    }
  }

  public async getActivePage(): Promise<Page> {
    await this.init();
    await this.syncPages();

    let page = this.pages.get(this.activePageId);
    if (!page || page.isClosed()) {
      const lastEntry = Array.from(this.pages.entries()).pop();
      if (lastEntry && !lastEntry[1].isClosed()) {
        this.activePageId = lastEntry[0];
        page = lastEntry[1];
      }
    }

    if (!page || page.isClosed()) {
      if (!this.context) throw new Error('Context not initialized');
      page = await this.context.newPage();
      const newId = `tab-${++this.tabCounter}`;
      this.pages.set(newId, page);
      this.activePageId = newId;
      this.setupPageListeners(page, newId);
      await page.goto('https://news.ycombinator.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    }

    return page;
  }

  public async getTabs(): Promise<RealTabInfo[]> {
    await this.syncPages();
    const tabList: RealTabInfo[] = [];
    for (const [id, page] of this.pages.entries()) {
      if (page.isClosed()) continue;
      let title = 'Chrome Tab';
      let url = 'about:blank';
      try {
        title = await page.title();
        url = page.url();
      } catch {}
      tabList.push({
        id,
        title: title || url || 'Chrome Tab',
        url: url || 'about:blank',
        isLoading: false,
      });
    }
    return tabList;
  }

  public getRealUrlForLink(linkId: string): string | undefined {
    return this.linkMap.get(linkId);
  }

  public async getState(): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    const tabs = await this.getTabs();
    const url = page.url();
    const title = await page.title().catch(() => 'Chromium');

    // Capture real viewport screenshot
    let screenshotBase64 = '';
    try {
      const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 75 });
      screenshotBase64 = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;
    } catch (e) {
      console.warn('Screenshot capture notice:', e);
    }

    // Annotate interactive elements directly in the real page DOM and construct compact accessibility tree
    let accessibilityTree = '';
    try {
      const axScript = `
        (() => {
          // 1. Remove previous IDs to guarantee 100% unique, sequential, collision-free numbering
          document.querySelectorAll('[data-agent-id]').forEach((e) => e.removeAttribute('data-agent-id'));
          document.querySelectorAll('[data-in-modal]').forEach((e) => e.removeAttribute('data-in-modal'));

          const getAccessibleName = (el) => {
            return (
              el.getAttribute('aria-label') ||
              el.getAttribute('placeholder') ||
              el.getAttribute('title') ||
              (el.innerText ? el.innerText.trim() : '') ||
              el.getAttribute('alt') ||
              ''
            );
          };

          const getRole = (el) => {
            if (el.getAttribute('role')) return el.getAttribute('role');
            const tag = el.tagName.toLowerCase();
            if (tag === 'a' && el.hasAttribute('href')) return 'link';
            if (tag === 'button') return 'button';
            if (tag === 'input') {
              const type = el.getAttribute('type') || 'text';
              if (type === 'search') return 'searchbox';
              if (type === 'checkbox') return 'checkbox';
              if (type === 'radio') return 'radio';
              if (type === 'submit' || type === 'button') return 'button';
              return 'textbox';
            }
            if (tag === 'select') return 'combobox';
            if (tag === 'textarea') return 'textbox';
            if (tag === 'summary') return 'button';
            return null;
          };

          // 2. Comprehensive selector for ANY interactive element on modern web SPAs (modals, calendars, comboboxes, options)
          const interactiveSelector = [
            'a[href]',
            'button',
            'input',
            'textarea',
            'select',
            '[role="button"]',
            '[role="link"]',
            '[role="tab"]',
            '[role="menuitem"]',
            '[role="menuitemcheckbox"]',
            '[role="menuitemradio"]',
            '[role="combobox"]',
            '[role="option"]',
            '[role="listbox"]',
            '[role="checkbox"]',
            '[role="radio"]',
            '[role="switch"]',
            '[role="gridcell"]',
            '[role="row"]',
            '[role="treeitem"]',
            '[role="searchbox"]',
            'summary',
            '[tabindex="0"]',
            '[contenteditable="true"]',
            '[aria-haspopup="true"]',
            '[aria-expanded]',
            '[onclick]'
          ].join(', ');

          const elements = document.querySelectorAll(interactiveSelector);
          let counter = 1;
          const axLines = [];

          elements.forEach((el) => {
            if (!(el instanceof HTMLElement)) return;

            // Check if element is genuinely visible or rendered in viewport/modal
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              // Check if it is inside an open modal or combobox popup
              const insideActiveModal = el.closest(
                'dialog[open], [role="dialog"], [role="listbox"], [role="menu"], [aria-modal="true"]'
              );
              if (!insideActiveModal) return;
            }

            const id = 'el-' + (counter++);
            el.setAttribute('data-agent-id', id);

            const role = getRole(el) || 'element';
            const name = getAccessibleName(el).replace(/\\s+/g, ' ').slice(0, 90);
            const value = el.value || '';

            const extras = [];
            if (el.getAttribute('aria-expanded')) extras.push('expanded: ' + el.getAttribute('aria-expanded'));
            if (el.getAttribute('aria-selected')) extras.push('selected: ' + el.getAttribute('aria-selected'));
            if (el.checked) extras.push('checked: true');
            if (document.activeElement === el) extras.push('focused: true');

            // Mark modal children so the agent clearly sees they belong to an active overlay
            const parentModal = el.closest(
              'dialog[open], [role="dialog"], [aria-modal="true"], [role="listbox"], [role="menu"]'
            );
            if (parentModal) {
              el.setAttribute('data-in-modal', 'true');
              extras.push('in_modal: true');
            }

            let line = '- [' + id + '] ' + role + ' "' + name + '"';
            if (value && value !== name) line += ' (value: "' + value + '")';
            if (extras.length > 0) line += ' [' + extras.join(', ') + ']';
            axLines.push(line);
          });

          return axLines.join('\\n');
        })()
      `;
      const axResult = await page.evaluate(axScript);
      accessibilityTree = (axResult as string) || '';
    } catch (err: any) {
      console.error('AX EVAL ERROR:', err?.message || err);
      accessibilityTree = '';
    }

    // Capture and clean DOM
    let rawHtml = '';
    try {
      rawHtml = await page.content();
    } catch (e) {
      rawHtml = '<html><body></body></html>';
    }

    const { cleanedHtml, originalLength, cleanedLength, elementCount } = this.cleanHtml(rawHtml);

    // Capture currently focused element on page
    let focusedElement: FocusedElementInfo | null = null;
    try {
      focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return null;
        const tag = el.tagName.toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || el.getAttribute('contenteditable') === 'true';
        return {
          tagName: tag,
          type: (el as HTMLInputElement).type || '',
          placeholder: (el as HTMLInputElement).placeholder || '',
          name: (el as HTMLInputElement).name || '',
          value: isInput ? ((el as HTMLInputElement).value || (el as HTMLElement).innerText || '') : '',
          isInput,
        };
      });
    } catch {}

    return {
      activeTabId: this.activePageId,
      tabs,
      url,
      title,
      screenshotBase64,
      cleanedHtml,
      accessibilityTree,
      elementCount,
      rawHtmlLength: originalLength,
      cleanedHtmlLength: cleanedLength,
      focusedElement,
    };
  }

  public async navigate(url: string): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    let formatted = url.trim();

    const resolvedFromMap = this.resolveUrlFromRef(formatted);
    if (resolvedFromMap) {
      formatted = resolvedFromMap;
    }

    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      if (formatted.includes('.') && !formatted.includes(' ')) {
        formatted = `https://${formatted}`;
      } else {
        formatted = `https://duckduckgo.com/?q=${encodeURIComponent(formatted)}`;
      }
    }

    try {
      await page.goto(formatted, { waitUntil: 'domcontentloaded', timeout: 25000 });
    } catch (err: any) {
      console.warn('Navigation notice:', err.message);
    }

    await page.waitForTimeout(600).catch(() => {});
    return this.getState();
  }

  public async openTab(url: string = 'https://news.ycombinator.com'): Promise<RealBrowserState> {
    await this.init();
    if (!this.context) throw new Error('Context not initialized');

    const newPage = await this.context.newPage();
    const newId = `tab-${++this.tabCounter}`;
    this.pages.set(newId, newPage);
    this.activePageId = newId;
    this.setupPageListeners(newPage, newId);

    let formatted = url.trim();
    const resolvedFromMap = this.resolveUrlFromRef(formatted);
    if (resolvedFromMap) {
      formatted = resolvedFromMap;
    }

    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }

    await newPage.goto(formatted, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    return this.getState();
  }

  public async switchTab(tabId: string): Promise<RealBrowserState> {
    await this.syncPages();
    if (this.pages.has(tabId)) {
      this.activePageId = tabId;
      const page = this.pages.get(tabId)!;
      await page.bringToFront().catch(() => {});
    }
    return this.getState();
  }

  public async closeTab(tabId: string): Promise<RealBrowserState> {
    await this.syncPages();
    if (this.pages.has(tabId) && this.pages.size > 1) {
      const page = this.pages.get(tabId)!;
      await page.close().catch(() => {});
      this.pages.delete(tabId);
      if (this.activePageId === tabId) {
        const remaining = Array.from(this.pages.keys());
        this.activePageId = remaining[remaining.length - 1] || 'tab-1';
      }
    }
    return this.getState();
  }

  private resolveUrlFromRef(ref: string): string | null {
    if (!ref) return null;
    const cleanRef = ref.replace(/^[#\[]/, '').replace(/[\]]$/, '').trim();
    if (this.linkMap.has(cleanRef)) return this.linkMap.get(cleanRef)!;
    if (this.linkMap.has(`#${cleanRef}`)) return this.linkMap.get(`#${cleanRef}`)!;
    if (this.linkMap.has(`L${cleanRef}`)) return this.linkMap.get(`L${cleanRef}`)!;
    return null;
  }

  public async click(target: string): Promise<{ success: boolean; message: string; state: RealBrowserState }> {
    await this.init();
    const page = await this.getActivePage();

    try {
      let selector = target.trim();

      // Check if reference points to a mapped link
      if (selector.startsWith('#L') || selector.startsWith('L') || (selector.startsWith('[') && selector.includes('L'))) {
        const cleanRef = selector.replace(/^[#\[]/, '').replace(/[\]]$/, '');
        const realUrl = this.linkMap.get(cleanRef) || this.linkMap.get(`#${cleanRef}`) || this.linkMap.get(`L${cleanRef}`);
        if (realUrl) {
          await page.goto(realUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
          const state = await this.getState();
          return { success: true, message: `Navigated to ${realUrl}`, state };
        }
      }

      if (selector.startsWith('el-')) {
        selector = `[data-agent-id="${selector}"]`;
      }

      let el = await page.$(selector);

      if (!el && !selector.startsWith('[') && !selector.startsWith('.') && !selector.startsWith('#')) {
        el = await page.$(`button:has-text("${selector}"), a:has-text("${selector}")`);
      }

      if (el) {
        await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});

        const initialPagesCount = this.context?.pages().length || 1;

        // Natural human-like click with realistic mouse physics
        const box = await el.boundingBox();
        if (box) {
          const clickX = box.x + box.width / 2 + (Math.random() * 4 - 2);
          const clickY = box.y + box.height / 2 + (Math.random() * 4 - 2);
          await page.mouse.move(clickX, clickY, { steps: 8 }).catch(() => {});
          await page.mouse.down().catch(() => {});
          await new Promise((r) => setTimeout(r, 45 + Math.random() * 30));
          await page.mouse.up().catch(() => {});
        } else {
          await el.click({ timeout: 3000 }).catch(async () => {
            // Fallback for elements under backdrop overlays or modals
            await el.click({ force: true, timeout: 2000 }).catch(async () => {
              await el.evaluate((e: any) => e.click()).catch(() => {});
            });
          });
        }

        // Brief delay for DOM or popup trigger
        await page.waitForTimeout(400).catch(() => {});

        // Check if a new tab / popup was opened by the website (e.g. window.open or target="_blank")
        const currentPages = this.context?.pages() || [];
        if (currentPages.length > initialPagesCount) {
          const newestPage = currentPages[currentPages.length - 1];
          let foundId = Array.from(this.pages.entries()).find(([_, p]) => p === newestPage)?.[0];
          if (!foundId) {
            foundId = `tab-${++this.tabCounter}`;
            this.pages.set(foundId, newestPage);
            this.setupPageListeners(newestPage, foundId);
          }
          this.activePageId = foundId;
          await newestPage.bringToFront().catch(() => {});
          await newestPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
          const state = await this.getState();
          return { success: true, message: `Clicked ${selector} and switched to new tab ${foundId}`, state };
        }

        const state = await this.getState();
        return { success: true, message: `Clicked element ${selector}`, state };
      }

      const state = await this.getState();
      return { success: false, message: `Element not found: ${selector}`, state };
    } catch (err: any) {
      const state = await this.getState();
      return { success: false, message: `Click error: ${err.message}`, state };
    }
  }

  // Realistic human mouse click for user canvas interactions (solves bot check clicks & focuses input fields)
  public async mouseClickCoordinates(targetX: number, targetY: number): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    try {
      // Direct fast and reliable mouse approach to coordinates
      await page.mouse.move(targetX, targetY, { steps: 5 }).catch(() => {});
      await page.mouse.down().catch(() => {});
      await new Promise((r) => setTimeout(r, 60));
      await page.mouse.up().catch(() => {});

      // Explicitly focus any input element or button located at (targetX, targetY)
      await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        if (el) {
          if (typeof el.focus === 'function') {
            try { el.focus(); } catch (_) {}
          }
          const input = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? el : el.querySelector('input, textarea');
          if (input && typeof (input as HTMLElement).focus === 'function') {
            try { (input as HTMLElement).focus(); } catch (_) {}
          }
        }
      }, { x: targetX, y: targetY }).catch(() => {});

      // Wait briefly for DOM or focus update
      await page.waitForTimeout(250).catch(() => {});
    } catch (e) {
      console.warn('Mouse click error:', e);
    }
    return this.getState();
  }

  // Direct keystroke typing into currently focused element in Chromium
  public async keyboardType(text: string): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    try {
      await page.keyboard.type(text, { delay: 15 });
      await page.waitForTimeout(200).catch(() => {});
    } catch (e) {
      console.warn('Keyboard type error:', e);
    }
    return this.getState();
  }

  // Direct special key press (Enter, Tab, Backspace, Escape, Arrow keys, etc.)
  public async keyboardPress(key: string): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    try {
      await page.keyboard.press(key);
      await page.waitForTimeout(250).catch(() => {});
    } catch (e) {
      console.warn('Keyboard press error:', e);
    }
    return this.getState();
  }

  // Clear currently focused input field completely
  public async clearFocusedInput(): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    try {
      await page.keyboard.press('Control+A').catch(() => {});
      await page.keyboard.press('Backspace').catch(() => {});
      await page.waitForTimeout(150).catch(() => {});
    } catch (e) {
      console.warn('Clear focused input error:', e);
    }
    return this.getState();
  }

  public async rightClick(target: string): Promise<{ success: boolean; message: string; state: RealBrowserState }> {
    await this.init();
    const page = await this.getActivePage();

    try {
      let selector = target.trim();
      if (selector.startsWith('el-')) {
        selector = `[data-agent-id="${selector}"]`;
      }

      const el = await page.$(selector);
      if (el) {
        await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        const box = await el.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
        } else {
          await el.click({ button: 'right', timeout: 3000 });
        }
        await page.waitForTimeout(400).catch(() => {});
        const state = await this.getState();
        return { success: true, message: `Right-clicked ${selector}`, state };
      }
      const state = await this.getState();
      return { success: false, message: `Element not found: ${selector}`, state };
    } catch (err: any) {
      const state = await this.getState();
      return { success: false, message: `Right-click error: ${err.message}`, state };
    }
  }

  public async hover(target: string): Promise<{ success: boolean; message: string; state: RealBrowserState }> {
    await this.init();
    const page = await this.getActivePage();

    try {
      let selector = target.trim();
      if (selector.startsWith('el-')) {
        selector = `[data-agent-id="${selector}"]`;
      }

      const el = await page.$(selector);
      if (el) {
        await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        const box = await el.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
        } else {
          await el.hover({ timeout: 3000 });
        }
        await page.waitForTimeout(400).catch(() => {});
        const state = await this.getState();
        return { success: true, message: `Hovered over ${selector}`, state };
      }
      const state = await this.getState();
      return { success: false, message: `Element not found: ${selector}`, state };
    } catch (err: any) {
      const state = await this.getState();
      return { success: false, message: `Hover error: ${err.message}`, state };
    }
  }

  public async pressKey(key: string): Promise<{ success: boolean; message: string; state: RealBrowserState }> {
    await this.init();
    const page = await this.getActivePage();

    try {
      await page.keyboard.press(key);
      await page.waitForTimeout(400).catch(() => {});
      const state = await this.getState();
      return { success: true, message: `Pressed key "${key}"`, state };
    } catch (err: any) {
      const state = await this.getState();
      return { success: false, message: `Press key error: ${err.message}`, state };
    }
  }

  public async dragAndDrop(source: string, target: string): Promise<{ success: boolean; message: string; state: RealBrowserState }> {
    await this.init();
    const page = await this.getActivePage();

    try {
      let srcSelector = source.trim();
      if (srcSelector.startsWith('el-')) srcSelector = `[data-agent-id="${srcSelector}"]`;
      let tgtSelector = target.trim();
      if (tgtSelector.startsWith('el-')) tgtSelector = `[data-agent-id="${tgtSelector}"]`;

      const srcEl = await page.$(srcSelector);
      const tgtEl = await page.$(tgtSelector);

      if (srcEl && tgtEl) {
        await srcEl.scrollIntoViewIfNeeded().catch(() => {});
        const srcBox = await srcEl.boundingBox();
        const tgtBox = await tgtEl.boundingBox();

        if (srcBox && tgtBox) {
          const fromX = srcBox.x + srcBox.width / 2;
          const fromY = srcBox.y + srcBox.height / 2;
          const toX = tgtBox.x + tgtBox.width / 2;
          const toY = tgtBox.y + tgtBox.height / 2;

          await page.mouse.move(fromX, fromY, { steps: 6 });
          await page.mouse.down();
          await new Promise((r) => setTimeout(r, 120));
          await page.mouse.move(toX, toY, { steps: 16 });
          await new Promise((r) => setTimeout(r, 100));
          await page.mouse.up();
          await page.waitForTimeout(400).catch(() => {});

          const state = await this.getState();
          return { success: true, message: `Dragged ${source} to ${target}`, state };
        }
      }

      // Fallback to Playwright locator dragTo
      try {
        await page.locator(srcSelector).dragTo(page.locator(tgtSelector), { timeout: 4000 });
        const fallbackState = await this.getState();
        return { success: true, message: `Dragged ${source} to ${target}`, state: fallbackState };
      } catch {}

      const notFoundState = await this.getState();
      return { success: false, message: `Drag target(s) not found`, state: notFoundState };
    } catch (err: any) {
      const state = await this.getState();
      return { success: false, message: `Drag error: ${err.message}`, state };
    }
  }

  public async type(target: string, value: string, submit: boolean = false): Promise<{ success: boolean; message: string; state: RealBrowserState }> {
    await this.init();
    const page = await this.getActivePage();

    try {
      let selector = target.trim();
      if (selector.startsWith('el-')) {
        selector = `[data-agent-id="${selector}"]`;
      }

      let el = await page.$(selector);
      if (!el) {
        el = await page.$('input[type="text"], input[type="search"], textarea, input:not([type="hidden"])');
      }

      if (el) {
        await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await el.click({ timeout: 2000 }).catch(() => {});

        // If the clicked element opened or focused an internal input (combobox pattern)
        let targetInput = el;
        const tagName = await el.evaluate((e) => e.tagName.toLowerCase()).catch(() => 'input');
        if (tagName !== 'input' && tagName !== 'textarea') {
          const innerInput = await el.$('input, textarea');
          if (innerInput) {
            targetInput = innerInput;
          }
        }

        // Clear existing value thoroughly
        try {
          await targetInput.fill('');
        } catch {
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Backspace');
        }

        // Realistic typing
        await targetInput.type(value, { delay: 15 });
        await page.waitForTimeout(400).catch(() => {});

        // Check if an autocomplete dropdown or option appeared (combobox like Google Flights / Travel sites)
        const hasSuggestionOption = await page.$(
          '[role="listbox"] [role="option"], ul[role="listbox"] li, div[role="option"], li[role="option"], .sbqs_c'
        );

        if (submit || hasSuggestionOption) {
          // Press Enter to lock in the autocomplete selection
          await page.keyboard.press('Enter').catch(() => {});
          await page.waitForTimeout(600).catch(() => {});
        } else {
          await page.waitForTimeout(200).catch(() => {});
        }

        const state = await this.getState();
        return { success: true, message: `Typed "${value}" into ${selector}`, state };
      }

      const state = await this.getState();
      return { success: false, message: `Input element not found: ${selector}`, state };
    } catch (err: any) {
      const state = await this.getState();
      return { success: false, message: `Type error: ${err.message}`, state };
    }
  }

  public async scroll(direction: 'up' | 'down', amount: number = 400): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    const delta = direction === 'up' ? -amount : amount;

    try {
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(300).catch(() => {});
    } catch (e) {
      console.warn('Scroll error:', e);
    }
    return this.getState();
  }

  public cleanHtml(html: string): { cleanedHtml: string; originalLength: number; cleanedLength: number; elementCount: number } {
    const originalLength = html.length;

    // 1. Strip script, style, svg, noscript, audio, video tags
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    clean = clean.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '[SVG]');
    clean = clean.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
    clean = clean.replace(/<!--[\s\S]*?-->/g, ''); // Comments

    // 2. Strip tracking & noisy attributes
    clean = clean.replace(/\s(class|style|onload|onclick|onerror|target|rel|jsaction|jscontroller|jsdata|data-ved|ping)="[^"]*"/gi, '');

    // 3. Map URLs to short numbered tokens #L1, #L2
    this.linkMap.clear();
    let linkCounter = 1;

    clean = clean.replace(/href="([^"]+)"/gi, (_match, url) => {
      if (url.startsWith('javascript:') || url.startsWith('mailto:') || url === '#') {
        return 'href="#"';
      }
      const token = `L${linkCounter++}`;
      this.linkMap.set(token, url);
      this.linkMap.set(`#${token}`, url);
      return `href="#${token}"`;
    });

    // 4. Compact whitespace
    clean = clean.replace(/\n\s*\n/g, '\n');
    clean = clean.replace(/[ \t]+/g, ' ');

    let elementCount = (clean.match(/data-agent-id="[^"]+"/g) || []).length;
    if (elementCount === 0) {
      elementCount = (clean.match(/<(a|button|input|select|textarea)\b/gi) || []).length;
    }

    return {
      cleanedHtml: clean.trim(),
      originalLength,
      cleanedLength: clean.length,
      elementCount,
    };
  }
}

export const chromiumManager = new ChromiumManager();
