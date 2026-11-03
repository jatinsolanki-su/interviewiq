import React, { useState, useEffect } from 'react';
import { X, Mic, Sparkles, FileText, CheckCircle2, Sliders, Briefcase, Award } from 'lucide-react';

const COMMON_ROLES = [
  'Full Stack Software Engineer',
  'Frontend React Developer',
  'Backend Node.js / Distributed Systems',
  'Software Engineering Fresher (Campus Placement)',
  'Python & AI Systems Engineer',
  'DevOps & Cloud Infrastructure',
  'Data Structures & Algorithms Specialist'
];

const TOPIC_SUGGESTIONS = [
  'React & State Architecture',
  'JavaScript Event Loop & Microtasks',
  'Node.js & Libuv Thread Pool',
  'PostgreSQL & Index Optimization',
  'REST API & Authentication (JWT/Cookies)',
  'System Design & Rate Limiting',
  'DSA & Time/Space Complexity',
  'Concurrency & Race Conditions',
  'Behavioral (STAR Method)'
];

export default function InterviewSetupModal({ isOpen, onClose, onInterviewStarted }) {
  const [jobRole, setJobRole] = useState(COMMON_ROLES[0]);
  const [customRole, setCustomRole] = useState('');
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [experienceLevel, setExperienceLevel] = useState('Fresher / Entry-Level');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [selectedTopics, setSelectedTopics] = useState([TOPIC_SUGGESTIONS[0], TOPIC_SUGGESTIONS[1]]);
  const [activeResume, setActiveResume] = useState(null);
  const [useResume, setUseResume] = useState(true);
  const [loadingResume, setLoadingResume] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch active resume on modal open
  useEffect(() => {
    if (isOpen) {
      setLoadingResume(true);
      fetch('/api/resumes/my')
        .then(res => res.json())
        .then(data => {
          if (data.activeResume) {
            setActiveResume(data.activeResume);
            setUseResume(true);
          } else {
            setActiveResume(null);
            setUseResume(false);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingResume(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setError('');

    const finalRole = customRole.trim() || jobRole;
    if (!finalRole) {
      setError('Please choose or enter a job role.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_role: finalRole,
          interview_type: interviewType,
          difficulty,
          experience_level: experienceLevel,
          duration_minutes: durationMinutes,
          total_questions: totalQuestions,
          topics: selectedTopics,
          resume_id: useResume && activeResume ? activeResume.id : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start interview.');
      }

      console.log("1. API response:", data);
console.log("2. Interview ID:", data.interview?.id);

onInterviewStarted(data.interview.id);

console.log("3. Callback executed");

onClose();
    } catch (err) {
      setError(err.message || 'Error initializing interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border border-[#E6E0D1] shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E0D1] flex items-center justify-between bg-[#FCFAF3]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#596B32] flex items-center justify-center text-[#F7F4EA]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-[#303820]">
                Configure Voice Technical Interview
              </h2>
              <p className="text-xs text-[#879568]">
                Evidence-Based Adaptive Interviewing will tailor questions to your choices.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#879568] hover:text-[#303820] hover:bg-[#E6E0D1]/50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStart} className="p-6 overflow-y-auto space-y-5 text-xs text-[#20211D]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Resume Integration Banner */}
          <div className="p-4 bg-[#F7F4EA] border border-[#E6E0D1] rounded-xl flex items-start gap-3">
            <FileText className="w-5 h-5 text-[#596B32] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#303820]">
                  Resume-Based Adaptive Mode
                </span>
                {activeResume ? (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useResume}
                      onChange={(e) => setUseResume(e.target.checked)}
                      className="accent-[#596B32] rounded"
                    />
                    <span className="text-[11px] font-medium text-[#596B32]">
                      Link Active Resume
                    </span>
                  </label>
                ) : (
                  <span className="text-[11px] text-[#879568]">No Resume Uploaded</span>
                )}
              </div>
              <p className="text-[#879568] text-[11px] mt-1">
                {activeResume
                  ? `Active resume: "${activeResume.filename}". Gemini will extract projects and probe your claimed skills with follow-up depth questions.`
                  : 'You can practice without a resume or upload one in the Resume tab for project-specific questioning.'}
              </p>
            </div>
          </div>

          {/* Job Role */}
          <div>
            <label className="block font-semibold text-[#303820] uppercase tracking-wider mb-1.5">
              Target Job Role
            </label>
            <select
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] focus:ring-2 focus:ring-[#596B32] focus:outline-none"
            >
              {COMMON_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="Or enter a custom role (e.g., SRE / Kubernetes Architect)"
              className="mt-2 w-full px-3.5 py-2 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] placeholder-[#A09D90] focus:ring-2 focus:ring-[#596B32] focus:outline-none"
            />
          </div>

          {/* Grid: Type & Difficulty & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#303820] uppercase tracking-wider mb-1.5">
                Interview Type
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full px-3 py-2 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] focus:ring-2 focus:ring-[#596B32] focus:outline-none"
              >
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Mixed">Mixed (Tech + Behavioral)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#303820] uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] focus:ring-2 focus:ring-[#596B32] focus:outline-none"
              >
                <option value="Beginner">Beginner (Foundations)</option>
                <option value="Intermediate">Intermediate (Core & Trade-offs)</option>
                <option value="Advanced">Advanced (Scale & Architecture)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#303820] uppercase tracking-wider mb-1.5">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] focus:ring-2 focus:ring-[#596B32] focus:outline-none"
              >
                <option value="Fresher / Entry-Level">Fresher / Entry-Level</option>
                <option value="1-3 Years Experience">1-3 Years Experience</option>
                <option value="Senior / Lead">Senior / Lead (4+ Years)</option>
              </select>
            </div>
          </div>

          {/* Duration and Number of Questions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#303820] uppercase tracking-wider mb-1.5">
                Estimated Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 20, 30].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setDurationMinutes(min)}
                    className={`py-2 text-center rounded-xl font-medium transition-all ${
                      durationMinutes === min
                        ? 'bg-[#303820] text-[#F7F4EA]'
                        : 'bg-[#FCFAF3] text-[#879568] border border-[#E6E0D1]'
                    }`}
                  >
                    {min} mins
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#303820] uppercase tracking-wider mb-1.5">
                Question Target Count
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 8].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTotalQuestions(cnt)}
                    className={`py-2 text-center rounded-xl font-medium transition-all ${
                      totalQuestions === cnt
                        ? 'bg-[#303820] text-[#F7F4EA]'
                        : 'bg-[#FCFAF3] text-[#879568] border border-[#E6E0D1]'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topics selection */}
          <div>
            <label className="block font-semibold text-[#303820] uppercase tracking-wider mb-1.5">
              Focus Competencies (Select to prioritize)
            </label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_SUGGESTIONS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#596B32] text-[#F7F4EA]'
                        : 'bg-[#FCFAF3] text-[#879568] hover:text-[#303820] border border-[#E6E0D1]'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Launch Action */}
          <div className="pt-3 border-t border-[#E6E0D1] flex items-center justify-between">
            <span className="text-[11px] text-[#879568]">
              Target: Desktop Chrome with microphone enabled
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#596B32] hover:bg-[#303820] text-[#F7F4EA] font-medium text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#F7F4EA] border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating Opening Question...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Voice Interview</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
