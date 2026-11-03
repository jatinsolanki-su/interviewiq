import React, { useState, useEffect } from 'react';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  Lightbulb,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'JavaScript',
  'React',
  'Node.js',
  'Java',
  'Python',
  'DSA',
  'OOP',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'SQL',
  'System Design',
  'HR',
  'Behavioral'
];

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [expandedHints, setExpandedHints] = useState({});
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.append('category', activeCategory);
      if (activeDifficulty !== 'All') params.append('difficulty', activeDifficulty);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Error fetching question bank:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [activeCategory, activeDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  const toggleBookmark = async (questionId) => {
    try {
      const res = await fetch(`/api/questions/${questionId}/bookmark`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, is_bookmarked: data.is_bookmarked } : q));
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const toggleAnswer = (id) => {
    setExpandedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHint = (id) => {
    setExpandedHints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const displayedQuestions = bookmarkedOnly
    ? questions.filter(q => q.is_bookmarked)
    : questions;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#596B32]"></span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#303820]">
              Curated Technical Question Bank
            </h1>
          </div>
          <p className="text-xs text-[#879568] mt-1">
            Browse original questions across 14 engineering domains with model answers and hints.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            bookmarkedOnly
              ? 'bg-[#303820] text-[#F7F4EA]'
              : 'bg-[#FFFFFF] text-[#879568] hover:text-[#303820] border border-[#E6E0D1]'
          }`}
        >
          <Bookmark className="w-4 h-4 text-[#596B32]" />
          <span>{bookmarkedOnly ? 'Showing Bookmarks' : 'Filter Bookmarked'}</span>
        </button>
      </div>

      {/* Search and Difficulty Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keywords, concepts (e.g. Event Loop, LRU Cache, ACID)..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] focus:ring-2 focus:ring-[#596B32] focus:outline-none"
          />
          <Search className="w-4 h-4 text-[#879568] absolute left-3 top-3" />
        </form>

        <select
          value={activeDifficulty}
          onChange={(e) => setActiveDifficulty(e.target.value)}
          className="px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] focus:ring-2 focus:ring-[#596B32] focus:outline-none cursor-pointer"
        >
          <option value="All">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Category Pills (14 categories) */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#596B32] text-[#F7F4EA]'
                : 'bg-[#FFFFFF] text-[#879568] hover:text-[#303820] border border-[#E6E0D1]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="py-16 text-center">
          <span className="w-6 h-6 border-2 border-[#596B32] border-t-transparent rounded-full animate-spin inline-block"></span>
          <span className="block mt-2 text-xs text-[#879568]">Loading questions...</span>
        </div>
      ) : displayedQuestions.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl text-xs text-[#879568]">
          No questions matched your search criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {displayedQuestions.map((q) => {
            const isAnswerOpen = Boolean(expandedAnswers[q.id]);
            const isHintOpen = Boolean(expandedHints[q.id]);

            return (
              <div
                key={q.id}
                className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs transition-all hover:border-[#879568]/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#303820] text-[#F7F4EA]">
                        {q.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FCFAF3] border border-[#E6E0D1] text-[#879568]">
                        {q.difficulty}
                      </span>
                    </div>
                    <h3 className="font-editorial text-base font-bold text-[#303820]">
                      {q.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBookmark(q.id)}
                    className="p-1.5 rounded-lg text-[#879568] hover:text-[#596B32] transition-colors cursor-pointer"
                    title={q.is_bookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                  >
                    {q.is_bookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-[#596B32]" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <p className="mt-3 text-xs text-[#20211D] leading-relaxed">
                  {q.question}
                </p>

                {/* Key Concepts */}
                {Array.isArray(q.key_concepts) && q.key_concepts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {q.key_concepts.map((kc, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#FCFAF3] border border-[#E6E0D1] rounded text-[10px] text-[#596B32] font-mono"
                      >
                        {kc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action toggles */}
                <div className="mt-4 pt-3 border-t border-[#E6E0D1] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAnswer(q.id)}
                      className="flex items-center gap-1 font-medium text-[#596B32] hover:text-[#303820] cursor-pointer"
                    >
                      <span>{isAnswerOpen ? 'Hide Model Answer' : 'View Model Answer'}</span>
                      {isAnswerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {Array.isArray(q.hints) && q.hints.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleHint(q.id)}
                        className="flex items-center gap-1 font-medium text-[#879568] hover:text-[#303820] ml-3 cursor-pointer"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{isHintOpen ? 'Hide Hint' : 'Hint'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Hints dropdown */}
                {isHintOpen && Array.isArray(q.hints) && (
                  <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <span className="font-bold block">Interview Hints:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {q.hints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Model Answer dropdown */}
                {isAnswerOpen && (
                  <div className="mt-3 p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed">
                    <span className="font-bold text-emerald-900 block mb-1">
                      Comprehensive Model Answer:
                    </span>
                    {q.sample_answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
