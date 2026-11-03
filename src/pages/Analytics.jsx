import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Brain,
  BarChart2,
  Calendar
} from 'lucide-react';

export default function Analytics({ onStartPractice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
      })
      .catch(err => console.error('Analytics error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <span className="w-8 h-8 border-3 border-[#596B32] border-t-transparent rounded-full animate-spin inline-block"></span>
        <span className="block mt-3 text-xs text-[#879568]">Computing performance analytics...</span>
      </div>
    );
  }

  const {
    totalInterviews = 0,
    averageScore = 0,
    bestScore = 0,
    scoreProgression = [],
    skillPerformance = [],
    strongestSkills = [],
    weakAreas = [],
    evidenceBreakdown = {}
  } = data || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#596B32]"></span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#303820]">
            Performance & Evidence Analytics
          </h1>
        </div>
        <p className="text-xs text-[#879568] mt-1">
          Detailed metrics calculated strictly from your completed technical interview transcripts and evaluations.
        </p>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-[#879568] uppercase tracking-wider block">
            Total Interviews
          </span>
          <span className="font-editorial text-3xl font-bold text-[#303820] mt-1 block">
            {totalInterviews}
          </span>
          <span className="text-[10px] text-[#A09D90] mt-1 block">Completed sessions</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-[#879568] uppercase tracking-wider block">
            Average Score
          </span>
          <span className="font-editorial text-3xl font-bold text-[#596B32] mt-1 block">
            {averageScore || 0} <span className="text-xs font-sans text-[#879568]">/ 10</span>
          </span>
          <span className="text-[10px] text-[#A09D90] mt-1 block">Mean evaluated score</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-[#879568] uppercase tracking-wider block">
            Best Score
          </span>
          <span className="font-editorial text-3xl font-bold text-[#303820] mt-1 block">
            {bestScore || 0} <span className="text-xs font-sans text-[#879568]">/ 10</span>
          </span>
          <span className="text-[10px] text-[#A09D90] mt-1 block">Highest technical score</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-[#879568] uppercase tracking-wider block">
            Proven Skills
          </span>
          <span className="font-editorial text-3xl font-bold text-emerald-700 mt-1 block">
            {evidenceBreakdown?.demonstrated || 0}
          </span>
          <span className="text-[10px] text-[#A09D90] mt-1 block">Demonstrated with depth</span>
        </div>
      </div>

      {totalInterviews === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-12 text-center text-xs text-[#879568] space-y-3">
          <BarChart2 className="w-10 h-10 text-[#879568] mx-auto opacity-50" />
          <h3 className="font-editorial text-base font-bold text-[#303820]">
            No Analytics Data Available Yet
          </h3>
          <p className="max-w-md mx-auto">
            Complete at least one voice interview to view your score progression trends, competency breakdowns, and proven skill metrics.
          </p>
          <button
            type="button"
            onClick={onStartPractice}
            className="mt-2 px-4 py-2 bg-[#596B32] text-[#F7F4EA] rounded-xl text-xs font-medium cursor-pointer"
          >
            Start First Practice Session
          </button>
        </div>
      ) : (
        <>
          {/* Score Progression Trend Chart */}
          <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E6E0D1]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#596B32]" />
                <h3 className="font-editorial text-base font-bold text-[#303820]">
                  Score Progression Over Time
                </h3>
              </div>
              <span className="text-[11px] text-[#879568]">
                Technical, Communication & Reasoning Trajectory
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreProgression} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E0D1" />
                  <XAxis dataKey="date" stroke="#879568" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#879568" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FCFAF3', borderColor: '#E6E0D1', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="overall" name="Overall" stroke="#303820" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="technical" name="Technical" stroke="#596B32" strokeWidth={1.8} />
                  <Line type="monotone" dataKey="reasoning" name="Reasoning" stroke="#B45309" strokeWidth={1.8} />
                  <Line type="monotone" dataKey="communication" name="Communication" stroke="#879568" strokeWidth={1.8} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Performance Breakdown Chart */}
          {skillPerformance.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E6E0D1]">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#596B32]" />
                  <h3 className="font-editorial text-base font-bold text-[#303820]">
                    Evaluated Skill Scores
                  </h3>
                </div>
                <span className="text-[11px] text-[#879568]">
                  Average performance by competency
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillPerformance.slice(0, 8)} margin={{ top: 10, right: 30, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6E0D1" />
                    <XAxis dataKey="skill" stroke="#879568" fontSize={10} angle={-15} textAnchor="end" />
                    <YAxis domain={[0, 10]} stroke="#879568" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FCFAF3', borderColor: '#E6E0D1', borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="averageScore" name="Average Score (0-10)" fill="#596B32" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Strongest Skills vs Areas for Growth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E6E0D1]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="font-editorial text-base font-bold text-[#303820]">
                  Demonstrated Competencies (Strongest)
                </h4>
              </div>
              {strongestSkills.length === 0 ? (
                <p className="text-xs text-[#879568]">No skills currently scored above 7.5 threshold.</p>
              ) : (
                <div className="space-y-3">
                  {strongestSkills.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl">
                      <span className="font-semibold text-[#303820]">{s.skill}</span>
                      <span className="font-bold text-emerald-800">{s.averageScore} / 10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E6E0D1]">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-editorial text-base font-bold text-[#303820]">
                  Areas Recommended for Focus
                </h4>
              </div>
              {weakAreas.length === 0 ? (
                <p className="text-xs text-[#879568]">All tested skills met or exceeded baseline expectations.</p>
              ) : (
                <div className="space-y-3">
                  {weakAreas.map((w, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl">
                      <span className="font-semibold text-[#303820]">{w.skill}</span>
                      <span className="font-bold text-amber-800">{w.averageScore} / 10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
