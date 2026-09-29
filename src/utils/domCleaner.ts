import { StrippedHtmlInfo } from '../types/browser';

/**
 * Strips away styles, scripts, SVG contents, noscript, and inline handlers
 * to sharply reduce token count while maintaining semantic DOM hierarchy
 * and interactive element targeting IDs for the AI agent.
 */
export function cleanAndAnnotateHtml(rootElement: HTMLElement | null): {
  strippedInfo: StrippedHtmlInfo;
  elementMap: Map<string, HTMLElement>;
} {
  const elementMap = new Map<string, HTMLElement>();

  if (!rootElement) {
    return {
      strippedInfo: {
        rawLength: 0,
        cleanedLength: 0,
        reductionPercentage: 0,
        elementCount: 0,
        html: '<empty></empty>',
      },
      elementMap,
    };
  }

  // Clone root element so we don't destroy actual DOM
  const clone = rootElement.cloneNode(true) as HTMLElement;

  // Remove scripts, styles, noscript, svg internals, audio, video
  const toRemove = clone.querySelectorAll('script, style, noscript, link, iframe, meta, base');
  toRemove.forEach((el) => el.remove());

  // Replace heavy SVGs with simple indicator
  const svgs = clone.querySelectorAll('svg');
  svgs.forEach((svg) => {
    const placeholder = document.createElement('svg-icon');
    const label = svg.getAttribute('aria-label') || svg.getAttribute('alt') || '';
    if (label) placeholder.setAttribute('label', label);
    svg.replaceWith(placeholder);
  });

  // Assign agent IDs to interactive elements
  // We query interactive elements both on the actual DOM (for execution) and on the clone
  const interactiveSelectors = 'a, button, input, textarea, select, [role="button"], [role="link"], [data-action], summary';
  
  const realElements = rootElement.querySelectorAll<HTMLElement>(interactiveSelectors);
  const clonedElements = clone.querySelectorAll<HTMLElement>(interactiveSelectors);

  let counter = 1;
  clonedElements.forEach((el, index) => {
    const id = `el-${counter++}`;
    el.setAttribute('data-agent-id', id);

    // Map the ID to the real DOM element
    if (realElements[index]) {
      realElements[index].setAttribute('data-agent-id', id);
      elementMap.set(id, realElements[index]);
      elementMap.set(`[data-agent-id="${id}"]`, realElements[index]);
    }

    // Clean element attributes: retain only semantic ones
    const keepAttrs = ['data-agent-id', 'id', 'name', 'type', 'placeholder', 'value', 'href', 'title', 'aria-label', 'role'];
    const attrsToRemove: string[] = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      if (!keepAttrs.includes(attr.name.toLowerCase())) {
        attrsToRemove.push(attr.name);
      }
    }
    attrsToRemove.forEach((attr) => el.removeAttribute(attr));
  });

  // Also clean other generic non-interactive elements of noisy classes/inline styles
  const allCloned = clone.querySelectorAll('*');
  allCloned.forEach((node) => {
    node.removeAttribute('style');
    node.removeAttribute('class');
    // Remove inline event handlers
    Array.from(node.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        node.removeAttribute(attr.name);
      }
    });
  });

  const rawHtml = rootElement.outerHTML;
  let cleanedHtml = clone.innerHTML;

  // Clean excess whitespace
  cleanedHtml = cleanedHtml
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  const rawLength = rawHtml.length;
  const cleanedLength = cleanedHtml.length;
  const reduction = rawLength > 0 ? Math.round(((rawLength - cleanedLength) / rawLength) * 100) : 0;

  return {
    strippedInfo: {
      rawLength,
      cleanedLength,
      reductionPercentage: Math.max(0, reduction),
      elementCount: counter - 1,
      html: cleanedHtml,
    },
    elementMap,
  };
}

/**
 * Strips raw HTML string (when received from external proxy or curl)
 */
export function cleanRawHtmlString(rawHtml: string): StrippedHtmlInfo {
  const originalLength = rawHtml.length;
  let html = rawHtml.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  html = html.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  html = html.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '<svg-icon></svg-icon>');
  html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
  html = html.replace(/\s+style=(["'])[\s\S]*?\1/gi, '');
  html = html.replace(/\s+class=(["'])[\s\S]*?\1/gi, '');

  let count = 1;
  html = html.replace(/<(a|button|input|textarea|select|summary)\b([^>]*)>/gi, (match, tag, attrs) => {
    if (!attrs.includes('data-agent-id=')) {
      return `<${tag} data-agent-id="el-${count++}" ${attrs}>`;
    }
    return match;
  });

  html = html.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  if (html.length > 50000) {
    html = html.substring(0, 50000) + '\n... [HTML truncated]';
  }

  const cleanedLength = html.length;
  const reduction = originalLength > 0 ? Math.round(((originalLength - cleanedLength) / originalLength) * 100) : 0;

  return {
    rawLength: originalLength,
    cleanedLength,
    reductionPercentage: Math.max(0, reduction),
    elementCount: count - 1,
    html,
  };
}
