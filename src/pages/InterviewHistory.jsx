import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  Award,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';

export default function InterviewHistory({ onViewReport, onStartNew }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/interviews');
      const data = await res.json();
      if (res.ok) {
        setInterviews(data.interviews || []);
      } else {
        throw new Error(data.error || 'Failed to fetch interview history');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this interview record? This will also remove the generated report.')) return;

    try {
      const res = await fetch(`/api/interviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInterviews(prev => prev.filter(i => i.id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete interview.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#596B32]"></span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#303820]">
              Interview History
            </h1>
          </div>
          <p className="text-xs text-[#879568] mt-1">
            Review past voice technical sessions, scores, and evidence reports stored in PostgreSQL.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNew}
          className="px-4 py-2 bg-[#596B32] hover:bg-[#303820] text-[#F7F4EA] rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          Start New Interview
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <span className="w-6 h-6 border-2 border-[#596B32] border-t-transparent rounded-full animate-spin inline-block"></span>
          <span className="block mt-2 text-xs text-[#879568]">Retrieving your interview archives...</span>
        </div>
      ) : interviews.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl text-xs text-[#879568] space-y-3">
          <History className="w-10 h-10 text-[#879568] mx-auto opacity-50" />
          <h3 className="font-editorial text-base font-bold text-[#303820]">
            No Interviews Recorded Yet
          </h3>
          <p className="max-w-md mx-auto">
            You haven't conducted any interviews yet. Complete your first voice interview to unlock evidence tracking and performance trends.
          </p>
          <button
            type="button"
            onClick={onStartNew}
            className="mt-2 px-4 py-2 bg-[#596B32] text-[#F7F4EA] rounded-xl font-medium text-xs cursor-pointer"
          >
            Practice First Interview
          </button>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-[#E6E0D1]">
            {interviews.map((item) => {
              const isCompleted = item.status === 'completed';

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FCFAF3] transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#303820]">
                        {item.job_role}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#879568]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span>{item.interview_type}</span>
                      <span>•</span>
                      <span>{item.difficulty}</span>
                    </div>
                  </div>

                  {/* Score & Actions */}
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {item.overall_score !== null && item.overall_score !== undefined ? (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-[#879568] block leading-none">
                          Score
                        </span>
                        <span className="font-editorial text-xl font-bold text-[#303820]">
                          {item.overall_score} <span className="text-xs font-sans text-[#879568]">/ 10</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#879568] italic">Incomplete</span>
                    )}

                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => onViewReport(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#596B32] hover:bg-[#303820] text-[#F7F4EA] rounded-lg text-xs font-medium transition-all cursor-pointer"
                        >
                          <span>Report</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-[#879568] hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
