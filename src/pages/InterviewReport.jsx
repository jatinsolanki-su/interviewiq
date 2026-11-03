import React, { useState, useEffect } from 'react';
import SkillGapMap from '../components/SkillGapMap.jsx';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Download,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function InterviewReport({ interviewId, onBackToDashboard }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${interviewId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch report');
        setReportData(data);
        // Expand first question by default
        if (data.questions && data.questions.length > 0) {
          setExpandedQuestions({ [data.questions[0].id]: true });
        }
      } catch (err) {
        setError(err.message || 'Error loading report');
      } finally {
        setLoading(false);
      }
    }

    if (interviewId) {
      fetchReport();
    }
  }, [interviewId]);

  const toggleQuestion = (id) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <span className="w-8 h-8 border-3 border-[#596B32] border-t-transparent rounded-full animate-spin"></span>
        <span className="mt-4 text-xs text-[#879568]">Compiling Evidence-Based Performance Report...</span>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-red-700">Unable to load report</h2>
        <p className="text-xs text-[#879568] mt-2">{error || 'Report not found'}</p>
        <button
          onClick={onBackToDashboard}
          className="mt-6 px-4 py-2 bg-[#303820] text-[#F7F4EA] rounded-xl text-xs font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { report, questions = [], evidence = [] } = reportData;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs font-medium text-[#596B32] hover:text-[#303820] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#303820] hover:bg-[#596B32] text-[#F7F4EA] rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export / Print PDF Report</span>
        </button>
      </div>

      {/* Main Report Header */}
      <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6E0D1]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#596B32]/10 text-[#596B32] border border-[#596B32]/30">
                Official Evaluation
              </span>
              <span className="text-xs text-[#879568]">
                {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#303820] mt-2">
              {report.job_role} Performance Report
            </h1>
            <p className="text-xs text-[#879568] mt-1">
              Interview Type: {report.interview_type} • Difficulty: {report.difficulty} • Duration: {report.duration_minutes} mins
            </p>
          </div>

          {/* Overall Score Badge */}
          <div className="flex sm:flex-col items-center justify-center p-4 bg-[#FCFAF3] border border-[#E6E0D1] rounded-2xl text-center min-w-[130px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#879568]">
              Overall Score
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-editorial text-4xl font-bold text-[#303820]">
                {report.overall_score}
              </span>
              <span className="text-xs text-[#879568]">/10</span>
            </div>
          </div>
        </div>

        {/* 3 Pillar Score Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#E6E0D1]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#303820]">Technical Correctness</span>
              <span className="font-bold text-[#596B32]">{report.technical_score} / 10</span>
            </div>
            <div className="w-full h-2 bg-[#E6E0D1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#596B32] rounded-full transition-all"
                style={{ width: `${Math.min(100, (report.technical_score / 10) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#E6E0D1]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#303820]">Reasoning & Depth</span>
              <span className="font-bold text-[#303820]">{report.reasoning_score} / 10</span>
            </div>
            <div className="w-full h-2 bg-[#E6E0D1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#303820] rounded-full transition-all"
                style={{ width: `${Math.min(100, (report.reasoning_score / 10) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#E6E0D1]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#303820]">Communication Clarity</span>
              <span className="font-bold text-[#879568]">{report.communication_score} / 10</span>
            </div>
            <div className="w-full h-2 bg-[#E6E0D1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#879568] rounded-full transition-all"
                style={{ width: `${Math.min(100, (report.communication_score / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-6 p-4 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] leading-relaxed">
          <span className="font-semibold text-[#303820] uppercase tracking-wider block mb-1.5">
            Executive Performance Summary
          </span>
          <p>{report.summary}</p>
        </div>
      </div>

      {/* Prominent USP: Evidence-Based Skill Gap Map */}
      <SkillGapMap
        skillGapSummary={report.skill_gap_summary}
        evidences={evidence}
      />

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E6E0D1]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-editorial text-base font-bold text-[#303820]">
              Demonstrated Strengths
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-[#20211D]">
            {(report.key_strengths || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses & Missing Concepts */}
        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E6E0D1]">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-editorial text-base font-bold text-[#303820]">
              Identified Knowledge Gaps
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-[#20211D]">
            {(report.key_weaknesses || []).map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
            {(report.missing_core_concepts || []).map((m, i) => (
              <li key={'m-' + i} className="flex items-start gap-2 text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                <span className="italic">Missing concept: {m}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Personalized Learning Plan */}
      <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E6E0D1]">
          <BookOpen className="w-4 h-4 text-[#596B32]" />
          <h3 className="font-editorial text-base font-bold text-[#303820]">
            Personalized Engineering Learning Plan
          </h3>
        </div>

        <div className="space-y-3">
          {(report.personalized_learning_plan || []).map((plan, i) => (
            <div
              key={i}
              className="p-4 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <span className="font-bold text-[#303820] text-sm block">
                  {plan.topic}
                </span>
                <p className="text-[#879568]">
                  <strong className="text-[#303820]">Why: </strong>
                  {plan.why}
                </p>
                <p className="text-[#20211D]">
                  <strong className="text-[#596B32]">Action: </strong>
                  {plan.suggested_action}
                </p>
              </div>

              <span
                className={`self-start px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  plan.priority === 'High'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {plan.priority} Priority
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Question-by-Question Deep Dive */}
      <div className="space-y-4">
        <h3 className="font-editorial text-xl font-bold text-[#303820]">
          Question-Wise Spoken Answer Evaluations
        </h3>

        {questions.map((q, idx) => {
          const isExpanded = Boolean(expandedQuestions[q.id]);
          return (
            <div
              key={q.id}
              className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl overflow-hidden shadow-xs"
            >
              <button
                type="button"
                onClick={() => toggleQuestion(q.id)}
                className="w-full p-5 text-left flex items-start justify-between gap-4 bg-[#FCFAF3] hover:bg-[#E6E0D1]/20 transition-all cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#596B32] uppercase tracking-wider">
                      Question {q.question_order}
                    </span>
                    {q.is_follow_up && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Adaptive Follow-Up
                      </span>
                    )}
                    <span className="text-[11px] text-[#879568]">
                      • {q.skill_targeted}
                    </span>
                  </div>
                  <h4 className="font-editorial text-sm font-bold text-[#303820]">
                    {q.question_text}
                  </h4>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {q.score !== null && q.score !== undefined && (
                    <span className="font-bold text-xs text-[#303820] bg-[#FFFFFF] px-2.5 py-1 rounded-lg border border-[#E6E0D1]">
                      {q.score} / 10
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#879568]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#879568]" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-6 space-y-4 text-xs border-t border-[#E6E0D1]">
                  {/* Spoken Answer */}
                  <div>
                    <span className="font-semibold text-[#879568] uppercase tracking-wider block mb-1">
                      Your Spoken Transcript ({q.audio_duration_seconds || 0}s duration):
                    </span>
                    <div className="p-3.5 bg-[#F7F4EA] border border-[#E6E0D1] rounded-xl text-[#20211D] leading-relaxed italic">
                      "{q.transcript || 'No spoken transcript recorded.'}"
                    </div>
                  </div>

                  {/* Ideal Model Answer */}
                  {q.ideal_answer && (
                    <div>
                      <span className="font-semibold text-[#596B32] uppercase tracking-wider block mb-1">
                        High-Caliber Model Answer:
                      </span>
                      <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-emerald-950 leading-relaxed">
                        {q.ideal_answer}
                      </div>
                    </div>
                  )}

                  {/* Feedback points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl">
                      <span className="font-bold text-emerald-800 block mb-1">What Went Well:</span>
                      <ul className="list-disc list-inside space-y-1 text-[#20211D]">
                        {(q.strengths || ['Direct answer to question']).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl">
                      <span className="font-bold text-amber-800 block mb-1">Suggestions to Deepen:</span>
                      <ul className="list-disc list-inside space-y-1 text-[#20211D]">
                        {(q.improvement_suggestions || ['Expand on operational trade-offs']).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
