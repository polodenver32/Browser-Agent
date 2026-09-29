import { firefox, Browser, BrowserContext, Page } from 'playwright';

export interface RealTabInfo {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
}

export interface RealBrowserState {
  activeTabId: string;
  tabs: RealTabInfo[];
  url: string;
  title: string;
  screenshotBase64: string;
  cleanedHtml: string;
  elementCount: number;
  rawHtmlLength: number;
  cleanedHtmlLength: number;
}

class FirefoxManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Map<string, Page> = new Map();
  private activePageId: string = 'tab-1';
  private isInitializing: boolean = false;
  // Internal map that maps short indexed IDs like [LINK_1] or [ACTION_12] to real URLs
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
      console.log('Launching real Firefox browser instance...');
      this.browser = await firefox.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
      });

      const initialPage = await this.context.newPage();
      await initialPage.goto('https://news.ycombinator.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      this.pages.set('tab-1', initialPage);
      this.activePageId = 'tab-1';
      console.log('Real Firefox launched and initialized with default tab.');
    } catch (err) {
      console.error('Failed to launch real Firefox:', err);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  public async getActivePage(): Promise<Page> {
    await this.init();
    let page = this.pages.get(this.activePageId);
    if (!page) {
      const firstEntry = this.pages.entries().next().value;
      if (firstEntry) {
        this.activePageId = firstEntry[0];
        page = firstEntry[1];
      }
    }
    if (!page) {
      if (!this.context) throw new Error('Context not initialized');
      page = await this.context.newPage();
      await page.goto('https://news.ycombinator.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      this.pages.set('tab-1', page);
      this.activePageId = 'tab-1';
    }
    return page;
  }

  public async getTabs(): Promise<RealTabInfo[]> {
    const tabList: RealTabInfo[] = [];
    for (const [id, page] of this.pages.entries()) {
      let title = 'Firefox Tab';
      let url = 'about:blank';
      try {
        title = await page.title();
        url = page.url();
      } catch {}
      tabList.push({
        id,
        title: title || url || 'Firefox Tab',
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
    const title = await page.title().catch(() => 'Firefox');

    // Capture real viewport screenshot
    let screenshotBase64 = '';
    try {
      const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 75 });
      screenshotBase64 = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;
    } catch (e) {
      console.warn('Screenshot capture warning:', e);
    }

    // Annotate interactive elements directly in the real page DOM so selectors match 1:1
    try {
      await page.evaluate(() => {
        let counter = 1;
        const interactive = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"], summary');
        interactive.forEach((el) => {
          if (!el.hasAttribute('data-agent-id')) {
            el.setAttribute('data-agent-id', `el-${counter++}`);
          }
        });
      }).catch(() => {});
    } catch {}

    // Capture and clean DOM
    let rawHtml = '';
    try {
      rawHtml = await page.content();
    } catch (e) {
      rawHtml = '<html><body></body></html>';
    }

    const { cleanedHtml, originalLength, cleanedLength, elementCount } = this.cleanHtml(rawHtml);

    return {
      activeTabId: this.activePageId,
      tabs,
      url,
      title,
      screenshotBase64,
      cleanedHtml,
      elementCount,
      rawHtmlLength: originalLength,
      cleanedHtmlLength: cleanedLength,
    };
  }

  public async navigate(url: string): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    let formatted = url.trim();

    // Check if target was a link ID like #L14 or [LINK_14] or L14
    const resolvedFromMap = this.resolveUrlFromRef(formatted);
    if (resolvedFromMap) {
      formatted = resolvedFromMap;
    }

    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      if (formatted.includes('.') && !formatted.includes(' ')) {
        formatted = `https://${formatted}`;
      } else {
        formatted = `https://www.google.com/search?q=${encodeURIComponent(formatted)}`;
      }
    }

    try {
      await page.goto(formatted, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch (err: any) {
      console.warn('Navigation notice:', err.message);
    }

    // Wait a brief moment for dynamic scripts to settle
    await page.waitForTimeout(500).catch(() => {});
    return this.getState();
  }

  public async openTab(url: string = 'https://news.ycombinator.com'): Promise<RealBrowserState> {
    await this.init();
    if (!this.context) throw new Error('Context not initialized');

    const newPage = await this.context.newPage();
    const newId = `tab-${Date.now()}`;
    let formatted = url.trim();
    const resolvedFromMap = this.resolveUrlFromRef(formatted);
    if (resolvedFromMap) {
      formatted = resolvedFromMap;
    }

    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }

    await newPage.goto(formatted, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    this.pages.set(newId, newPage);
    this.activePageId = newId;
    return this.getState();
  }

  public async switchTab(tabId: string): Promise<RealBrowserState> {
    if (this.pages.has(tabId)) {
      this.activePageId = tabId;
      const page = this.pages.get(tabId)!;
      await page.bringToFront().catch(() => {});
    }
    return this.getState();
  }

  public async closeTab(tabId: string): Promise<RealBrowserState> {
    if (this.pages.has(tabId) && this.pages.size > 1) {
      const page = this.pages.get(tabId)!;
      await page.close().catch(() => {});
      this.pages.delete(tabId);
      if (this.activePageId === tabId) {
        this.activePageId = this.pages.keys().next().value || 'tab-1';
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

      // Check if target is a numbered link reference (e.g. #L4 or L4 or [L4])
      const mappedUrl = this.resolveUrlFromRef(selector);
      if (mappedUrl) {
        // If it's a URL, find the link by href or navigate to it directly
        const hrefEl = await page.$(`a[href="${mappedUrl}"]`);
        if (hrefEl) {
          await hrefEl.scrollIntoViewIfNeeded().catch(() => {});
          await hrefEl.click({ timeout: 5000 });
          await page.waitForTimeout(800).catch(() => {});
          const state = await this.getState();
          return { success: true, message: `Clicked link reference ${target} (${mappedUrl})`, state };
        }
      }

      // Check if target is in the format el-X or data-agent-id="el-X"
      const elMatch = selector.match(/el-\d+/);
      if (elMatch) {
        selector = `[data-agent-id="${elMatch[0]}"]`;
      }

      let el = await page.$(selector);

      // Try text match if not found
      if (!el) {
        el = await page.$(`text="${target}"`);
      }

      // Fallback to button/link containing text
      if (!el) {
        el = await page.$(`button:has-text("${target}"), a:has-text("${target}")`);
      }

      // Try input submit
      if (!el) {
        el = await page.$(`input[value="${target}"]`);
      }

      if (!el) {
        const state = await this.getState();
        return { success: false, message: `Could not locate element: ${target}`, state };
      }

      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.click({ timeout: 5000 });
      await page.waitForTimeout(800).catch(() => {});

      const state = await this.getState();
      return { success: true, message: `Clicked ${target} successfully`, state };
    } catch (err: any) {
      console.warn('Click error:', err);
      const state = await this.getState();
      return { success: false, message: `Click error: ${err.message}`, state };
    }
  }

  public async type(target: string, value: string, submit: boolean = false): Promise<{ success: boolean; message: string; state: RealBrowserState }> {
    await this.init();
    const page = await this.getActivePage();

    try {
      let selector = target.trim();
      const elMatch = selector.match(/el-\d+/);
      if (elMatch) {
        selector = `[data-agent-id="${elMatch[0]}"]`;
      }

      let input = await page.$(selector);
      if (!input) {
        // Fallback to active/focused or first visible input
        input = await page.$('input[type="text"], input[type="search"], textarea, input:not([type="hidden"])');
      }

      if (!input) {
        const state = await this.getState();
        return { success: false, message: `Input element not found: ${target}`, state };
      }

      // Sanitize value to prevent accidental multi-newline hallucination
      let sanitizedValue = value.replace(/\n+/g, ' ').trim();

      await input.scrollIntoViewIfNeeded().catch(() => {});
      await input.click().catch(() => {});
      await input.fill(sanitizedValue);

      if (submit) {
        await input.press('Enter').catch(() => {});
        await page.waitForTimeout(1000).catch(() => {});
      }

      const state = await this.getState();
      return { success: true, message: `Typed "${sanitizedValue}" into ${target}`, state };
    } catch (err: any) {
      console.warn('Type error:', err);
      const state = await this.getState();
      return { success: false, message: `Type error: ${err.message}`, state };
    }
  }

  public async scroll(direction: 'up' | 'down' = 'down', amount: number = 400): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    const deltaY = direction === 'up' ? -amount : amount;

    await page.evaluate((dy) => {
      window.scrollBy({ top: dy, behavior: 'smooth' });
    }, deltaY);

    await page.waitForTimeout(400).catch(() => {});
    return this.getState();
  }

  public async mouseClickCoordinates(x: number, y: number): Promise<RealBrowserState> {
    await this.init();
    const page = await this.getActivePage();
    await page.mouse.click(x, y);
    await page.waitForTimeout(500).catch(() => {});
    return this.getState();
  }

  /**
   * Cleans raw HTML for the AI model:
   * 1. Replaces all bulky/messy URLs in href and src with short numbered references (e.g. href="#L1", href="#L2").
   * 2. Saves mapping in internal linkMap so any reference can be decoded back.
   * 3. Removes scripts, styles, inline CSS, SVG paths, noscript, audio, video.
   * 4. Annotates elements with short data-agent-id="el-N" for easy click/type targeting.
   * 5. Reduces token footprint dramatically to completely prevent repetitive hallucination loops.
   */
  public cleanHtml(rawHtml: string): { cleanedHtml: string; originalLength: number; cleanedLength: number; elementCount: number } {
    const originalLength = rawHtml.length;
    let html = rawHtml.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    html = html.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
    html = html.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '<svg-icon></svg-icon>');
    html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
    html = html.replace(/<meta\b[^>]*>/gi, '');
    html = html.replace(/\s+style=(["'])[\s\S]*?\1/gi, '');
    html = html.replace(/\s+on\w+=(["'])[\s\S]*?\1/gi, '');
    html = html.replace(/\s+class=(["'])[\s\S]*?\1/gi, '');
    html = html.replace(/src=["']data:image\/[^;]+;base64,[^"']+["']/gi, 'src="[img]"');

    // 1. Map all href URLs to short numbers: #L1, #L2, etc.
    let linkCounter = 1;
    this.linkMap.clear();

    html = html.replace(/\bhref=(["'])(.*?)\1/gi, (_match, _quote, rawUrl) => {
      const trimmed = rawUrl.trim();
      if (!trimmed || trimmed === '#' || trimmed.startsWith('javascript:')) {
        return `href="#"`;
      }
      const linkId = `L${linkCounter++}`;
      this.linkMap.set(linkId, trimmed);
      return `href="#${linkId}"`;
    });

    // 2. Map long image / media src URLs to short references
    let srcCounter = 1;
    html = html.replace(/\bsrc=(["'])(.*?)\1/gi, (_match, _quote, rawUrl) => {
      const trimmed = rawUrl.trim();
      if (trimmed.startsWith('data:') || trimmed.length > 50) {
        const srcId = `S${srcCounter++}`;
        return `src="#${srcId}"`;
      }
      return _match;
    });

    // 3. Annotate interactive elements with clear data-agent-id
    let elementIndex = 1;
    html = html.replace(/<(a|button|input|textarea|select|summary)\b([^>]*)>/gi, (match, tag, attrs) => {
      if (!attrs.includes('data-agent-id=')) {
        const id = `el-${elementIndex++}`;
        return `<${tag} data-agent-id="${id}" ${attrs}>`;
      }
      return match;
    });

    // 4. Collapse repetitive spaces and multiple blank lines
    html = html.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

    // 5. Cap maximum characters to avoid token bloating
    if (html.length > 40000) {
      html = html.substring(0, 40000) + '\n... [HTML truncated for compactness]';
    }

    return {
      cleanedHtml: html,
      originalLength,
      cleanedLength: html.length,
      elementCount: elementIndex - 1,
    };
  }
}

export const firefoxManager = new FirefoxManager();
