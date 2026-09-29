import React, { useState } from 'react';
import { Triangle, MessageSquare, Plus, ExternalLink, Filter, Flame, Clock } from 'lucide-react';

interface Props {
  onNavigate: (url: string) => void;
}

interface Story {
  id: number;
  title: string;
  url: string;
  domain: string;
  author: string;
  points: number;
  upvoted: boolean;
  timeAgo: string;
  commentsCount: number;
  comments: { user: string; text: string; time: string }[];
}

const INITIAL_STORIES: Story[] = [
  {
    id: 1,
    title: 'Autonomous Browser Agents: Perception, Planning, and DOM Manipulation',
    url: 'https://browser-agents.org/research',
    domain: 'browser-agents.org',
    author: 'dan_code',
    points: 342,
    upvoted: false,
    timeAgo: '2 hours ago',
    commentsCount: 68,
    comments: [
      { user: 'ai_engineer', text: 'Stripping out CSS styles and JavaScript before sending DOM to LLM reduces tokens by 90% and speeds up decision loops significantly.', time: '1 hour ago' },
      { user: 'firefox_fan', text: 'Having a dedicated tab manager and external command execution bridge makes real browser automation very dependable.', time: '45 mins ago' },
    ],
  },
  {
    id: 2,
    title: 'Gemini 3.8: Next-Generation Real-Time Reasoning and Multimodal Actions',
    url: 'https://deepmind.google/technologies/gemini',
    domain: 'deepmind.google',
    author: 'sarah_t',
    points: 289,
    upvoted: false,
    timeAgo: '4 hours ago',
    commentsCount: 42,
    comments: [
      { user: 'builder99', text: 'The structured JSON responseSchema support makes building reliable agents a breeze without parse errors.', time: '2 hours ago' },
    ],
  },
  {
    id: 3,
    title: 'Show TP: Lightweight Firefox Engine in WebAssembly',
    url: 'https://github.com/mozilla/gecko-wasm',
    domain: 'github.com',
    author: 'gecko_core',
    points: 215,
    upvoted: false,
    timeAgo: '5 hours ago',
    commentsCount: 31,
    comments: [],
  },
  {
    id: 4,
    title: 'Why Classical RSA Is Yielding to Lattice Cryptography in Post-Quantum Era',
    url: 'https://crypto-foundations.io/lattice',
    domain: 'crypto-foundations.io',
    author: 'elena_math',
    points: 178,
    upvoted: false,
    timeAgo: '7 hours ago',
    commentsCount: 19,
    comments: [],
  },
  {
    id: 5,
    title: 'Ask TP: How are you managing agent planning loops to prevent hallucination?',
    url: '#',
    domain: 'techpulse.io',
    author: 'agent_architect',
    points: 144,
    upvoted: false,
    timeAgo: '9 hours ago',
    commentsCount: 54,
    comments: [
      { user: 'lead_dev', text: 'Always keep the active task and strategic plan outside of the turn history so the agent maintains a rock-solid goal anchor.', time: '5 hours ago' },
    ],
  },
];

export const TechPulsePage: React.FC<Props> = ({ onNavigate }) => {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [filter, setFilter] = useState<'top' | 'new' | 'ask'>('top');
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleUpvote = (id: number) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const upvoted = !s.upvoted;
          return {
            ...s,
            upvoted,
            points: upvoted ? s.points + 1 : s.points - 1,
          };
        }
        return s;
      })
    );
  };

  const handleNewStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newStory: Story = {
      id: Date.now(),
      title: newTitle.trim(),
      url: newUrl.trim() || 'https://techpulse.io',
      domain: newUrl.trim() ? new URL(newUrl.startsWith('http') ? newUrl : `https://${newUrl}`).hostname : 'techpulse.io',
      author: 'you',
      points: 1,
      upvoted: true,
      timeAgo: 'just now',
      commentsCount: 0,
      comments: [],
    };

    setStories([newStory, ...stories]);
    setNewTitle('');
    setNewUrl('');
    setShowSubmitModal(false);
  };

  const selectedStory = stories.find((s) => s.id === selectedStoryId);

  return (
    <div className="min-h-full bg-slate-900 text-slate-200">
      {/* Top Header */}
      <header className="bg-orange-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-white text-orange-600 font-bold text-sm flex items-center justify-center font-mono">
            T
          </div>
          <span className="font-bold text-sm tracking-wide">Tech Pulse</span>
          <nav className="flex items-center gap-1 ml-4 text-xs font-medium">
            <button
              data-agent-id="filter-top"
              onClick={() => { setFilter('top'); setSelectedStoryId(null); }}
              className={`px-2.5 py-1 rounded transition-colors ${filter === 'top' ? 'bg-orange-700 text-white font-semibold' : 'text-orange-100 hover:bg-orange-700/50'}`}
            >
              Top
            </button>
            <button
              data-agent-id="filter-new"
              onClick={() => { setFilter('new'); setSelectedStoryId(null); }}
              className={`px-2.5 py-1 rounded transition-colors ${filter === 'new' ? 'bg-orange-700 text-white font-semibold' : 'text-orange-100 hover:bg-orange-700/50'}`}
            >
              New
            </button>
            <button
              data-agent-id="filter-ask"
              onClick={() => { setFilter('ask'); setSelectedStoryId(null); }}
              className={`px-2.5 py-1 rounded transition-colors ${filter === 'ask' ? 'bg-orange-700 text-white font-semibold' : 'text-orange-100 hover:bg-orange-700/50'}`}
            >
              Ask
            </button>
          </nav>
        </div>

        <button
          id="btn-submit-story"
          data-agent-id="btn-submit-story"
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-white text-orange-700 hover:bg-orange-50 text-xs font-semibold rounded shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Submit</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {selectedStory ? (
          /* Comment Thread View */
          <div className="space-y-6">
            <button
              data-agent-id="btn-back-to-stories"
              onClick={() => setSelectedStoryId(null)}
              className="text-xs text-orange-400 hover:underline flex items-center gap-1"
            >
              ← Back to story list
            </button>

            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
              <h1 className="text-xl font-bold text-slate-100">{selectedStory.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>{selectedStory.points} points by {selectedStory.author}</span>
                <span>•</span>
                <span>{selectedStory.timeAgo}</span>
                <span>•</span>
                <span className="text-orange-400">{selectedStory.commentsCount} comments</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Discussion Comments</h3>
              {selectedStory.comments.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-800/40 rounded-lg">No comments yet on this thread.</p>
              ) : (
                selectedStory.comments.map((c, i) => (
                  <div key={i} className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                      <span className="text-orange-400 font-semibold">{c.user}</span>
                      <span>{c.time}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Story Feed */
          <div className="space-y-2.5">
            {stories.map((story, index) => (
              <div
                key={story.id}
                className="flex items-start gap-3 p-3 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-colors"
              >
                <span className="text-slate-400 font-mono text-xs w-5 text-right pt-0.5">
                  {index + 1}.
                </span>

                {/* Upvote Button */}
                <button
                  id={`upvote-btn-${story.id}`}
                  data-agent-id={`upvote-btn-${story.id}`}
                  onClick={() => handleUpvote(story.id)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-colors ${
                    story.upvoted
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-slate-700/60 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="Upvote story"
                >
                  <Triangle className={`w-3.5 h-3.5 fill-current ${story.upvoted ? 'text-orange-400' : ''}`} />
                  <span className="text-[10px] font-bold mt-0.5">{story.points}</span>
                </button>

                {/* Story Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <button
                      data-agent-id={`story-title-${story.id}`}
                      onClick={() => setSelectedStoryId(story.id)}
                      className="text-sm font-semibold text-slate-100 hover:text-orange-400 text-left transition-colors"
                    >
                      {story.title}
                    </button>
                    <span className="text-xs text-slate-400 font-mono">
                      ({story.domain})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>by <strong className="text-slate-300 font-normal">{story.author}</strong></span>
                    <span>{story.timeAgo}</span>
                    <button
                      id={`comments-btn-${story.id}`}
                      data-agent-id={`comments-btn-${story.id}`}
                      onClick={() => setSelectedStoryId(story.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-orange-400 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{story.commentsCount} comments</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Story Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-4">Submit New Story</h2>
            <form onSubmit={handleNewStorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Story Title</label>
                <input
                  id="submit-story-title"
                  data-agent-id="submit-story-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Breakthrough in Autonomous Web Automation"
                  required
                  className="w-full px-3 py-2 bg-slate-900 text-sm text-slate-100 rounded-lg border border-slate-700 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">URL (optional)</label>
                <input
                  id="submit-story-url"
                  data-agent-id="submit-story-url"
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-900 text-sm text-slate-100 rounded-lg border border-slate-700 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  data-agent-id="btn-cancel-submit"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-submit"
                  data-agent-id="btn-confirm-submit"
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Submit Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
