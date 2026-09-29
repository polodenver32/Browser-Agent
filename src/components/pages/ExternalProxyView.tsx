import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  url: string;
  onDomUpdate?: (html: string, title?: string) => void;
  actionQueue?: any;
}

export const ExternalProxyView: React.FC<Props> = ({ url, onDomUpdate }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form proxy URL
  const proxySrc = `/api/browser/proxy?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'MINI_BROWSER_DOM_UPDATE') {
        if (onDomUpdate && e.data.html) {
          onDomUpdate(e.data.html, e.data.title);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [url, onDomUpdate]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-slate-300">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
          <span className="text-xs font-mono">Loading live web page through secure proxy...</span>
        </div>
      )}

      {loadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 m-4 rounded-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={proxySrc}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setLoadError('Failed to load page. The destination server may be blocking proxy requests.');
        }}
        className="w-full h-full border-none bg-white"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        title="Firefox Proxy Sandbox"
      />
    </div>
  );
};
