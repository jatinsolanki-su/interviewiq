import React from 'react';
import { X, Sparkles, Layers, ArrowRight, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ProductExplainerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border border-[#E6E0D1] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E6E0D1] flex items-center justify-between bg-[#FCFAF3]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#303820] flex items-center justify-center text-[#F7F4EA]">
              <Sparkles className="w-4 h-4 text-[#879568]" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#303820]">
                Evidence-Based Adaptive Interviewing
              </h2>
              <p className="text-xs text-[#596B32] font-serif italic">
                "We don't just test what you know. We investigate how deeply you understand it."
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#20211D]">
          {/* Section 1: The Three Pillars */}
          <div>
            <h3 className="font-semibold text-sm text-[#303820] mb-2 uppercase tracking-wider">
              1. The Three Sources of Evidence
            </h3>
            <p className="text-[#879568] mb-3">
              Unlike generic chatbots that draw random questions from a static script, InterviewIQ continuously correlates three real sources:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl">
                <span className="font-bold text-[#596B32] block mb-1">Source 1: Resume</span>
                <span>Extracts project claims, frameworks, tools, and technical competencies you claimed.</span>
              </div>
              <div className="p-3 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl">
                <span className="font-bold text-[#596B32] block mb-1">Source 2: Spoken Answer</span>
                <span>Listens to your spoken keywords, architectural arguments, trade-offs, and tone.</span>
              </div>
              <div className="p-3 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl">
                <span className="font-bold text-[#596B32] block mb-1">Source 3: Role Standards</span>
                <span>Benchmarked against production engineering standards for your target position.</span>
              </div>
            </div>
          </div>

          {/* Section 2: Concrete Workflow Example */}
          <div className="p-4 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl space-y-3">
            <h4 className="font-semibold text-xs text-[#303820] uppercase tracking-wider">
              Real-World Investigation Workflow:
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded bg-[#303820] text-[#F7F4EA] font-mono text-[10px] shrink-0">STEP 1</span>
                <div>
                  <span className="font-medium text-[#303820]">Resume Claim: </span>
                  <span className="text-[#879568]">"Built modern dashboard with React & Redux"</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded bg-[#596B32] text-[#F7F4EA] font-mono text-[10px] shrink-0">STEP 2</span>
                <div>
                  <span className="font-medium text-[#303820]">Initial Question: </span>
                  <span className="italic">"How did you manage state in your React application?"</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-600 text-[#F7F4EA] font-mono text-[10px] shrink-0">STEP 3</span>
                <div>
                  <span className="font-medium text-[#303820]">Candidate Speaks: </span>
                  <span className="italic">"I used Redux."</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded bg-[#303820] text-[#F7F4EA] font-mono text-[10px] shrink-0">STEP 4</span>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="font-bold text-emerald-900 block mb-1">
                    Adaptive Investigation Triggered:
                  </span>
                  <p className="text-emerald-800">
                    The interviewer does not leap to another topic! It immediately probes the claim:
                  </p>
                  <ul className="list-disc list-inside mt-1 text-emerald-900 space-y-0.5">
                    <li>"Why did you choose Redux over React Context API?"</li>
                    <li>"How did you handle asynchronous actions and race conditions?"</li>
                    <li>"What performance bottlenecks would occur if you used Context API instead?"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Evidence Classification */}
          <div>
            <h3 className="font-semibold text-sm text-[#303820] mb-2 uppercase tracking-wider">
              2. Scientific Classification of Demonstrated Knowledge
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                <span className="font-bold text-emerald-800">Demonstrated:</span>
                <p className="text-emerald-900 mt-0.5">
                  Verified with sound reasoning, architectural justification, and trade-off defense.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                <span className="font-bold text-amber-800">Partially Demonstrated:</span>
                <p className="text-amber-900 mt-0.5">
                  Mentions superficial keywords, but struggles when probed on edge cases or internal mechanics.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                <span className="font-bold text-stone-700">Requires Assessment:</span>
                <p className="text-stone-600 mt-0.5">
                  Claimed on resume, but has not yet been assessed in current interview questions.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-red-200 bg-red-50/50">
                <span className="font-bold text-red-800">Not Demonstrated:</span>
                <p className="text-red-900 mt-0.5">
                  Directly contradicted principles or unable to explain basic mechanics upon inquiry.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E6E0D1] bg-[#FCFAF3] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#596B32] hover:bg-[#303820] text-[#F7F4EA] font-medium text-xs rounded-xl transition-all cursor-pointer"
          >
            Got it, Let's Practice
          </button>
        </div>
      </div>
    </div>
  );
}
