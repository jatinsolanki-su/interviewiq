import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Code
} from 'lucide-react';

export default function ResumeManager() {
  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/resumes/my');
      const data = await res.json();
      if (res.ok) {
        setResumes(data.resumes || []);
        setActiveResume(data.activeResume || null);
      }
    } catch (err) {
      setError('Failed to fetch resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload and analyze resume.');
      }

      setSuccess('Resume uploaded and analyzed successfully with Gemini!');
      fetchResumes();
    } catch (err) {
      setError(err.message || 'Error uploading resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Resume deleted.');
        fetchResumes();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete resume.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#596B32]"></span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#303820]">
            Resume Management & RAG Engine
          </h1>
        </div>
        <p className="text-xs text-[#879568] mt-1 max-w-2xl">
          Upload your PDF resume to extract projects, claimed technologies, and background metrics.
          InterviewIQ uses this context during Evidence-Based Adaptive Interviewing to probe your actual claims.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-[#FFFFFF] border-2 border-dashed border-[#E6E0D1] hover:border-[#596B32] transition-colors rounded-2xl p-8 text-center shadow-xs">
        <input
          type="file"
          id="resume-upload-input"
          accept="application/pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="resume-upload-input"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FCFAF3] border border-[#E6E0D1] flex items-center justify-center text-[#596B32] mb-3">
            {uploading ? (
              <span className="w-6 h-6 border-2 border-[#596B32] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
          <span className="font-editorial text-lg font-bold text-[#303820]">
            {uploading ? 'Analyzing Resume with Gemini & Chunking for RAG...' : 'Click to Upload Resume (PDF)'}
          </span>
          <span className="text-xs text-[#879568] mt-1">
            Standard PDF format up to 10MB. Stored locally on your machine.
          </span>
        </label>
      </div>

      {/* Active Resume Extracted Profile */}
      {activeResume ? (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E6E0D1] gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#303820] text-[#F7F4EA] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#303820]">
                    {activeResume.filename}
                  </h3>
                  <span className="text-[11px] text-[#879568]">
                    Uploaded on {new Date(activeResume.created_at).toLocaleDateString()} • {(activeResume.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active for Interviews
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(activeResume.id)}
                  className="p-2 text-[#879568] hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title="Delete Resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Extracted Skills */}
            <div className="mt-6">
              <h4 className="font-semibold text-xs text-[#303820] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#596B32]" />
                <span>Extracted Claimed Skills ({activeResume.skills?.length || 0})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {(activeResume.skills || []).map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-[#FCFAF3] border border-[#E6E0D1] rounded-lg text-xs font-medium text-[#303820]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Projects & Investigation Hooks */}
            {activeResume.projects && activeResume.projects.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-xs text-[#303820] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#596B32]" />
                  <span>Projects & Adaptive Investigation Hooks</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeResume.projects.map((proj, i) => (
                    <div key={i} className="p-4 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs space-y-2">
                      <span className="font-bold text-[#303820] text-sm block">{proj.name}</span>
                      <p className="text-[#879568] leading-relaxed">{proj.description}</p>
                      {proj.technologies && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proj.technologies.map((t, ti) => (
                            <span key={ti} className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E6E0D1] rounded text-[10px] text-[#596B32] font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {proj.investigation_hooks && proj.investigation_hooks.length > 0 && (
                        <div className="pt-2 border-t border-[#E6E0D1] text-[11px] text-amber-800">
                          <strong className="text-amber-900">Adaptive Hook: </strong>
                          {proj.investigation_hooks.join('; ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Missing Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900 block mb-2">Resume Strengths</span>
                <ul className="list-disc list-inside space-y-1 text-emerald-950">
                  {(activeResume.strengths || ['Clear technical background']).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-2">Areas Missing Specificity</span>
                <ul className="list-disc list-inside space-y-1 text-amber-950">
                  {(activeResume.missing_info || ['Add quantitative metrics where possible']).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#E6E0D1] text-xs text-[#879568]">
          No resume uploaded yet. Upload a PDF resume above to unlock resume-based adaptive interviewing.
        </div>
      )}
    </div>
  );
}
