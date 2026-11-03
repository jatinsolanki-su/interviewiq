import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import SkillGapMap from '../components/SkillGapMap.jsx';
import {
  Mic,
  Award,
  FileText,
  Calendar,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

export default function Dashboard({ onStartInterview, onViewReport, onNavigate }) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Load analytics, history, and active resume concurrently
        const [anRes, histRes, resRes] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/interviews'),
          fetch('/api/resumes/my')
        ]);

        if (anRes.ok) {
          const anData = await anRes.json();
          setAnalytics(anData);
        }

        if (histRes.ok) {
          const histData = await histRes.json();
          setRecentInterviews((histData.interviews || []).slice(0, 4));
        }

        if (resRes.ok) {
          const resData = await resRes.json();
          setActiveResume(resData.activeResume || null);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalInterviews = analytics?.totalInterviews || 0;
  const averageScore = analytics?.averageScore || 0;
  const bestScore = analytics?.bestScore || 0;
  const demonstratedCount = analytics?.evidenceBreakdown?.demonstrated || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-[#596B32] uppercase tracking-wider">
            Local Engineering Sandbox
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#303820] mt-1">
            Welcome back, {user?.full_name || 'Candidate'}
          </h1>
          <p className="text-xs text-[#879568] mt-1 max-w-xl">
            Ready for your next technical interview? Practice aloud with our voice-first AI interviewer.
            We investigate your claims, evaluate your depth, and identify genuine skill gaps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStartInterview}
            className="flex items-center gap-2 px-5 py-3 bg-[#596B32] hover:bg-[#303820] text-[#F7F4EA] font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Start Voice Interview</span>
          </button>
        </div>
      </div>

      {/* Top 4 Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#879568] uppercase tracking-wider">
              Total Interviews
            </span>
            <Calendar className="w-4 h-4 text-[#879568]" />
          </div>
          <span className="font-editorial text-3xl font-bold text-[#303820] mt-2 block">
            {totalInterviews}
          </span>
          <span className="text-[10px] text-[#A09D90] mt-1 block">Completed sessions</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#879568] uppercase tracking-wider">
              Average Score
            </span>
            <Award className="w-4 h-4 text-[#596B32]" />
          </div>
          <span className="font-editorial text-3xl font-bold text-[#596B32] mt-2 block">
            {totalInterviews > 0 ? averageScore : '—'} <span className="text-xs font-sans text-[#879568]">/ 10</span>
          </span>
          <span className="text-[10px] text-[#A09D90] mt-1 block">PostgreSQL recorded</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#879568] uppercase tracking-wider">
              Best Score
            </span>
            <TrendingUp className="w-4 h-4 text-[#303820]" />
          </div>
          <span className="font-editorial text-3xl font-bold text-[#303820] mt-2 block">
            {totalInterviews > 0 ? bestScore : '—'} <span className="text-xs font-sans text-[#879568]">/ 10</span>
          </span>
          <span className="text-[10px] text-[#A09D90] mt-1 block">Highest benchmark</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#879568] uppercase tracking-wider">
              Resume Status
            </span>
            <FileText className="w-4 h-4 text-[#596B32]" />
          </div>
          <span className="font-editorial text-sm font-bold text-[#303820] mt-3 block truncate">
            {activeResume ? activeResume.filename : 'No Resume'}
          </span>
          <button
            type="button"
            onClick={() => onNavigate('resume')}
            className="text-[10px] font-medium text-[#596B32] hover:underline mt-1 block"
          >
            {activeResume ? 'Manage Resume →' : 'Upload Resume →'}
          </button>
        </div>
      </div>

      {/* Prominent USP: Evidence-Based Skill Gap Map */}
      <SkillGapMap
        evidences={analytics?.evidences || []}
        claimedSkills={activeResume?.skills || []}
      />

      {/* Grid: Recent Interviews & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Interviews */}
        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D1]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#596B32]" />
                <h3 className="font-editorial text-base font-bold text-[#303820]">
                  Recent Interview Sessions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('history')}
                className="text-xs font-medium text-[#596B32] hover:underline"
              >
                View All History →
              </button>
            </div>

            {recentInterviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#879568]">
                No interviews recorded yet. Click "Start Voice Interview" to launch your first session.
              </div>
            ) : (
              <div className="divide-y divide-[#E6E0D1] mt-2">
                {recentInterviews.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-[#303820] block">{item.job_role}</span>
                      <span className="text-[11px] text-[#879568]">
                        {new Date(item.created_at).toLocaleDateString()} • {item.interview_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.overall_score && (
                        <span className="font-bold text-[#303820]">
                          {item.overall_score} / 10
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => onViewReport(item.id)}
                          className="px-2.5 py-1 bg-[#FCFAF3] hover:bg-[#E6E0D1]/50 border border-[#E6E0D1] rounded-lg text-[11px] font-medium text-[#596B32] transition-colors cursor-pointer"
                        >
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Preparation & Quick Topics */}
        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D1]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#596B32]" />
                <h3 className="font-editorial text-base font-bold text-[#303820]">
                  Recommended Engineering Focus
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('question-bank')}
                className="text-xs font-medium text-[#596B32] hover:underline"
              >
                Question Bank →
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#596B32] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#303820] block">State Management & Asynchrony</span>
                  <p className="text-[#879568] text-[11px] mt-0.5">
                    Prepare to defend choices between Redux, Zustand, and Context API under high-frequency updates.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#596B32] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#303820] block">Database Indexing & Query Execution</span>
                  <p className="text-[#879568] text-[11px] mt-0.5">
                    Explain B-Tree vs sequential scans and when covering indexes accelerate high-read endpoints.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#596B32] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#303820] block">Event Loop & Concurrency Mechanics</span>
                  <p className="text-[#879568] text-[11px] mt-0.5">
                    Review microtask vs macrotask queuing and libuv thread pool offloading in Node.js.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
