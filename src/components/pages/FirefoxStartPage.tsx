import React, { useState } from 'react';
import { Search, ShieldCheck, ExternalLink, Globe, Newspaper, ShoppingCart, Plane, CheckSquare, Sparkles } from 'lucide-react';

interface Props {
  onNavigate: (url: string) => void;
}

export const FirefoxStartPage: React.FC<Props> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    // Check if entered URL
    if (searchTerm.includes('.') && !searchTerm.includes(' ')) {
      const url = searchTerm.startsWith('http') ? searchTerm : `https://${searchTerm}`;
      onNavigate(url);
    } else {
      // Default to Wikipedia search
      onNavigate(`wikipedia://search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const shortcuts = [
    {
      title: 'Wikipedia',
      desc: 'Free Encyclopedia & Tech History',
      url: 'wikipedia://article/Artificial_intelligence',
      icon: Globe,
      color: 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    {
      title: 'Tech Pulse',
      desc: 'Developer News & Discussions',
      url: 'news://techpulse',
      icon: Newspaper,
      color: 'bg-orange-600/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    },
    {
      title: 'AeroCart Store',
      desc: 'Tech Gear, Laptops & Cart',
      url: 'shop://aerocart',
      icon: ShoppingCart,
      color: 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
    },
    {
      title: 'SkyQuest Flights',
      desc: 'Flight Search & Booking',
      url: 'travel://skyquest',
      icon: Plane,
      color: 'bg-sky-600/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
    },
    {
      title: 'DOM Sandbox',
      desc: 'Interactive Forms & Elements',
      url: 'sandbox://forms',
      icon: CheckSquare,
      color: 'bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    },
  ];

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 selection:bg-orange-500/30">
      {/* Firefox Branding Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-600 p-0.5 shadow-xl shadow-orange-500/20 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
            <svg className="w-11 h-11 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Firefox
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Agent Sandbox
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Autonomous Browser Workspace with Real DOM Perception</p>
      </div>

      {/* Firefox Central Search Bar */}
      <div className="w-full max-w-2xl mb-10">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-400 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="firefox-home-search"
            data-agent-id="home-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search with Google, Wikipedia or enter web address..."
            className="w-full pl-12 pr-28 py-3.5 bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-2xl border border-slate-700/80 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 shadow-lg outline-none transition-all"
          />
          <button
            id="firefox-home-submit"
            data-agent-id="home-search-submit"
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Search</span>
          </button>
        </form>

        <div className="flex items-center justify-between mt-3 px-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enhanced Tracking Protection: Strict</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>AI Agent DOM Bridge Ready</span>
          </div>
        </div>
      </div>

      {/* Top Shortcuts / Simulated Web Destinations */}
      <div className="w-full max-w-3xl">
        <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-3 px-1">
          Top Shortcuts & Web Apps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shortcuts.map((sc) => {
            const Icon = sc.icon;
            return (
              <button
                key={sc.url}
                data-agent-id={`shortcut-${sc.title.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onNavigate(sc.url)}
                className="group flex items-start gap-3 p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl text-left transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={`p-2.5 rounded-lg ${sc.color} shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200 group-hover:text-orange-300 transition-colors truncate">
                      {sc.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{sc.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick External Web Test Notice */}
      <div className="mt-8 p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 max-w-xl text-center">
        💡 <strong className="text-slate-300">Live Web Navigation:</strong> You can also type any public URL in the address bar (e.g. <span className="font-mono text-orange-400">https://news.ycombinator.com</span>). The backend proxy fetches the page and injects the agent DOM bridge.
      </div>
    </div>
  );
};
