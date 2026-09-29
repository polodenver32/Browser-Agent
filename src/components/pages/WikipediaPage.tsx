import React, { useState, useEffect } from 'react';
import { Search, BookOpen, ExternalLink, Bookmark, Share2, Globe, Clock, ChevronRight } from 'lucide-react';

interface Props {
  articleSlug?: string;
  onNavigate: (url: string) => void;
}

interface ArticleData {
  title: string;
  subtitle: string;
  lastUpdated: string;
  lead: string;
  sections: { id: string; heading: string; content: string[] }[];
  seeAlso: { title: string; slug: string }[];
}

const ARTICLES: Record<string, ArticleData> = {
  Artificial_intelligence: {
    title: 'Artificial Intelligence',
    subtitle: 'Intelligence demonstrated by machines, as opposed to natural intelligence',
    lastUpdated: 'September 24, 2026',
    lead: 'Artificial intelligence (AI), in its broadest sense, is intelligence exhibited by machines, particularly computer systems. It is a field of research in computer science that develops and studies methods and software that enable machines to perceive their environment and use learning and intelligence to take actions that maximize their chances of achieving defined goals.',
    sections: [
      {
        id: 'overview',
        heading: '1. Overview and Core Concepts',
        content: [
          'AI technology is widely used throughout industry, government, and science. Some high-profile applications include advanced web search engines (e.g., Google Search), recommendation systems (used by YouTube, Amazon, and Netflix), interacting via human speech (such as Google Assistant and Siri), autonomous vehicles (e.g., Waymo), and generative creativity (e.g., Gemini and ChatGPT).',
          'Traditional problems in AI research include reasoning, knowledge representation, planning, learning, natural language processing, perception, and the ability to move and manipulate objects.',
        ],
      },
      {
        id: 'history',
        heading: '2. History and Milestones',
        content: [
          'Alan Turing was the first to conduct substantial research into machine intelligence, proposing the famous Turing Test in 1950.',
          'The field of AI research was founded at a workshop at Dartmouth College in 1956, where attendees Allen Newell, Herbert Simon, John McCarthy, and Marvin Minsky became the leaders of AI research for decades.',
          'In recent decades, deep learning and large language models have driven tremendous breakthroughs across reasoning, multimodal understanding, and browser automation agents.',
        ],
      },
      {
        id: 'applications',
        heading: '3. Major Applications',
        content: [
          'Browser Agents: Autonomous software agents equipped with vision and DOM parsing that can interact with websites, submit forms, navigate pages, and execute complex workflows without manual supervision.',
          'Healthcare: Diagnostic imaging, drug discovery algorithms, and personalized patient medicine.',
          'Finance: Algorithmic trading, fraud detection, and credit risk modeling.',
        ],
      },
      {
        id: 'ethics',
        heading: '4. Safety, Ethics, and Governance',
        content: [
          'The rapid development of AI has stimulated discussions on algorithmic bias, job displacement, autonomous weapons, and alignment with human values. Researchers emphasize verifiable reasoning and transparent action logs to ensure reliable autonomous operations.',
        ],
      },
    ],
    seeAlso: [
      { title: 'Machine Learning', slug: 'Machine_learning' },
      { title: 'Quantum Computing', slug: 'Quantum_computing' },
      { title: 'Alan Turing', slug: 'Alan_Turing' },
    ],
  },
  Machine_learning: {
    title: 'Machine Learning',
    subtitle: 'Subfield of artificial intelligence studying statistical algorithms',
    lastUpdated: 'September 18, 2026',
    lead: 'Machine learning (ML) is an umbrella term for solving problems for which the development of algorithms by human programmers would be cost-prohibitive, and instead the problems are solved by helping machines discover their own algorithms without explicit step-by-step instructions.',
    sections: [
      {
        id: 'approaches',
        heading: '1. Learning Paradigms',
        content: [
          'Supervised Learning: The computer is presented with example inputs and their desired outputs, given by a "teacher", and the goal is to learn a general rule that maps inputs to outputs.',
          'Unsupervised Learning: No labels are given to the learning algorithm, leaving it on its own to find structure in its input.',
          'Reinforcement Learning: A computer program interacts with a dynamic environment in which it must perform a certain goal, learning through reward and punishment signals.',
        ],
      },
      {
        id: 'neural-networks',
        heading: '2. Artificial Neural Networks',
        content: [
          'Inspired by biological neural networks, deep neural nets with multiple hidden layers have achieved state-of-the-art results in computer vision, speech recognition, and complex decision-making.',
        ],
      },
    ],
    seeAlso: [
      { title: 'Artificial Intelligence', slug: 'Artificial_intelligence' },
      { title: 'Quantum Computing', slug: 'Quantum_computing' },
    ],
  },
  Quantum_computing: {
    title: 'Quantum Computing',
    subtitle: 'Computation based on quantum mechanical phenomena such as superposition and entanglement',
    lastUpdated: 'September 20, 2026',
    lead: 'Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers. By utilizing qubits that can exist in superpositions of 0 and 1, quantum algorithms can achieve exponential speedups for specialized problems.',
    sections: [
      {
        id: 'fundamentals',
        heading: '1. Fundamentals and Qubits',
        content: [
          'Unlike classical bits which are deterministically either 0 or 1, a qubit can exist in a linear combination of both states until measured.',
          'Quantum entanglement allows qubits to share information instantaneously regardless of physical separation, providing immense parallel computational space.',
        ],
      },
      {
        id: 'applications',
        heading: '2. Cryptography and Chemistry',
        content: [
          'Shor algorithm demonstrates that quantum computers can factor large prime numbers in polynomial time, posing challenges to classical RSA encryption and motivating post-quantum cryptography.',
          'Quantum simulations promise breakthroughs in discovering new catalysts, battery chemistry, and superconductor materials.',
        ],
      },
    ],
    seeAlso: [
      { title: 'Artificial Intelligence', slug: 'Artificial_intelligence' },
      { title: 'Machine Learning', slug: 'Machine_learning' },
    ],
  },
  Alan_Turing: {
    title: 'Alan Turing',
    subtitle: 'English mathematician, computer scientist, logician, and cryptanalyst',
    lastUpdated: 'August 12, 2026',
    lead: 'Alan Mathison Turing OBE FRS (23 June 1912 – 7 June 1954) was an English mathematician, computer scientist, logician, cryptanalyst, philosopher, and mathematical biologist. Turing was highly influential in the development of theoretical computer science, providing a formalisation of the concepts of algorithm and computation with the Turing machine.',
    sections: [
      {
        id: 'bletchley',
        heading: '1. Bletchley Park and Cryptanalysis',
        content: [
          'During the Second World War, Turing was a leading participant in war-time codebreaking at Bletchley Park. He broke the German Enigma cipher using the electromechanical Bombe machine, saving millions of lives.',
        ],
      },
      {
        id: 'turing-test',
        heading: '2. Computing Machinery and Intelligence',
        content: [
          'In his 1950 paper, Turing introduced the "Imitation Game", now known as the Turing Test, proposing a standard for whether a machine could be described as intelligent.',
        ],
      },
    ],
    seeAlso: [
      { title: 'Artificial Intelligence', slug: 'Artificial_intelligence' },
      { title: 'Machine Learning', slug: 'Machine_learning' },
    ],
  },
};

export const WikipediaPage: React.FC<Props> = ({ articleSlug = 'Artificial_intelligence', onNavigate }) => {
  const [currentSlug, setCurrentSlug] = useState(articleSlug);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (articleSlug && articleSlug !== currentSlug) {
      setCurrentSlug(articleSlug);
    }
  }, [articleSlug]);

  const article = ARTICLES[currentSlug] || ARTICLES['Artificial_intelligence'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if matches known article
    const normalized = searchQuery.trim().toLowerCase().replace(/\s+/g, '_');
    const matched = Object.keys(ARTICLES).find((k) => k.toLowerCase() === normalized || k.toLowerCase().includes(normalized));
    if (matched) {
      setCurrentSlug(matched);
      onNavigate(`wikipedia://article/${matched}`);
    } else {
      // Default to general AI
      setCurrentSlug('Artificial_intelligence');
      onNavigate(`wikipedia://article/Artificial_intelligence`);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-200">
      {/* Wikipedia Top Navigation Bar */}
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            data-agent-id="wiki-home-btn"
            onClick={() => {
              setCurrentSlug('Artificial_intelligence');
              onNavigate('wikipedia://article/Artificial_intelligence');
            }}
            className="flex items-center gap-2 text-slate-100 hover:text-white group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-serif text-lg font-bold group-hover:border-slate-500">
              W
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wide">WIKIPEDIA</span>
              <span className="block text-[10px] text-slate-400 -mt-1">The Free Encyclopedia</span>
            </div>
          </button>
        </div>

        {/* Wikipedia Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="wiki-search-input"
            data-agent-id="wiki-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Wikipedia articles (e.g. Quantum computing, Machine learning)..."
            className="w-full pl-9 pr-20 py-1.5 bg-slate-800 text-xs text-slate-100 placeholder-slate-400 rounded-lg border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
          />
          <button
            id="wiki-search-btn"
            data-agent-id="wiki-search-btn"
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-md transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1.5">
          <button
            data-agent-id="wiki-bookmark-btn"
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-lg text-xs flex items-center gap-1 border transition-colors ${
              bookmarked ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Table of Contents Sidebar */}
        <aside className="md:w-64 shrink-0">
          <div className="sticky top-16 bg-slate-800/60 rounded-xl p-4 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Contents
            </h3>
            <nav className="space-y-1 text-xs">
              <button
                data-agent-id="toc-lead"
                onClick={() => scrollToSection('article-lead')}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700/60 text-slate-300 hover:text-white"
              >
                Lead Introduction
              </button>
              {article.sections.map((sec) => (
                <button
                  key={sec.id}
                  data-agent-id={`toc-${sec.id}`}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                    activeSection === sec.id
                      ? 'bg-orange-500/20 text-orange-400 font-medium'
                      : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
                  }`}
                >
                  {sec.heading}
                </button>
              ))}
              <button
                data-agent-id="toc-see-also"
                onClick={() => scrollToSection('see-also')}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700/60 text-slate-300 hover:text-white"
              >
                See Also & Related
              </button>
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Updated: {article.lastUpdated}</span>
            </div>
          </div>
        </aside>

        {/* Article Body */}
        <main className="flex-1 min-w-0">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h1 id="article-title" className="text-3xl font-serif font-bold text-slate-100 tracking-tight">
              {article.title}
            </h1>
            <p className="text-sm text-slate-400 mt-1 italic">{article.subtitle}</p>
          </div>

          {/* Lead Paragraph */}
          <section id="article-lead" className="mb-8">
            <p className="text-sm leading-relaxed text-slate-300 font-serif text-justify">
              {article.lead}
            </p>
          </section>

          {/* Article Sections */}
          <div className="space-y-8">
            {article.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-16">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <h2 className="text-lg font-serif font-bold text-slate-100">
                    {section.heading}
                  </h2>
                  <button
                    data-agent-id={`btn-read-more-${section.id}`}
                    onClick={() => setActiveSection(section.id)}
                    className="text-xs text-orange-400 hover:text-orange-300"
                  >
                    [focus]
                  </button>
                </div>
                <div className="space-y-3">
                  {section.content.map((p, idx) => (
                    <p key={idx} className="text-sm leading-relaxed text-slate-300 font-serif">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* See Also / Related Articles */}
          <section id="see-also" className="mt-12 pt-6 border-t border-slate-800">
            <h3 className="text-base font-serif font-bold text-slate-100 mb-4">
              See also
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.seeAlso.map((item) => (
                <button
                  key={item.slug}
                  data-agent-id={`wiki-link-${item.slug.toLowerCase()}`}
                  onClick={() => {
                    setCurrentSlug(item.slug);
                    onNavigate(`wikipedia://article/${item.slug}`);
                  }}
                  className="flex items-center justify-between p-3 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition-colors group"
                >
                  <span className="text-xs font-semibold text-orange-400 group-hover:text-orange-300">
                    {item.title}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
