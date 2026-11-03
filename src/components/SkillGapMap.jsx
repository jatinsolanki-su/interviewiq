import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle, Search, ShieldCheck } from 'lucide-react';

export default function SkillGapMap({
  skillGapSummary = {},
  evidences = [],
  claimedSkills = [],
  compact = false
}) {
  const [filter, setFilter] = useState('all');

  // Extract skills from summary or raw evidences
  const claimed = skillGapSummary?.claimed_skills || claimedSkills || [];
  const demonstrated = skillGapSummary?.demonstrated_skills ||
    evidences.filter(e => e.status === 'Demonstrated').map(e => e.skill_name);
  const partially = skillGapSummary?.partially_demonstrated_skills ||
    evidences.filter(e => e.status === 'Partially demonstrated').map(e => e.skill_name);
  const requiring = skillGapSummary?.skills_requiring_assessment ||
    claimed.filter(s => !demonstrated.includes(s) && !partially.includes(s));
  const notDemonstrated = evidences.filter(e => e.status === 'Not demonstrated').map(e => e.skill_name);

  // Filtered list
  let activeList = [];
  if (filter === 'all') {
    activeList = [
      ...demonstrated.map(s => ({ name: s, status: 'Demonstrated', type: 'proven' })),
      ...partially.map(s => ({ name: s, status: 'Partially demonstrated', type: 'partial' })),
      ...requiring.map(s => ({ name: s, status: 'Requires Assessment', type: 'untested' })),
      ...notDemonstrated.map(s => ({ name: s, status: 'Not demonstrated', type: 'failed' }))
    ];
  } else if (filter === 'demonstrated') {
    activeList = demonstrated.map(s => ({ name: s, status: 'Demonstrated', type: 'proven' }));
  } else if (filter === 'partially') {
    activeList = partially.map(s => ({ name: s, status: 'Partially demonstrated', type: 'partial' }));
  } else if (filter === 'requiring') {
    activeList = requiring.map(s => ({ name: s, status: 'Requires Assessment', type: 'untested' }));
  }

  // Deduplicate
  const seen = new Set();
  activeList = activeList.filter(item => {
    if (seen.has(item.name.toLowerCase())) return false;
    seen.add(item.name.toLowerCase());
    return true;
  });

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E6E0D1] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#596B32]"></span>
            <h3 className="font-editorial text-xl font-bold text-[#303820]">
              Evidence-Based Skill Gap Map
            </h3>
          </div>
          <p className="text-xs text-[#879568] mt-1">
            Investigating the divergence between claims on your resume and proven verbal depth.
          </p>
        </div>

        {/* Status Counts Bar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            {demonstrated.length} Demonstrated
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            {partially.length} Partial
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 font-medium">
            {requiring.length} Untested
          </span>
        </div>
      </div>

      {/* Divergence Analysis Quote */}
      {skillGapSummary?.divergence_analysis && (
        <div className="my-4 p-3.5 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] leading-relaxed">
          <span className="font-semibold text-[#596B32] uppercase tracking-wider block mb-1">
            Evidence Investigation Summary:
          </span>
          {skillGapSummary.divergence_analysis}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 my-4">
        {[
          { id: 'all', label: `All Skills (${activeList.length})` },
          { id: 'demonstrated', label: `Demonstrated (${demonstrated.length})` },
          { id: 'partially', label: `Partially Demonstrated (${partially.length})` },
          { id: 'requiring', label: `Requires Assessment (${requiring.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-[#303820] text-[#F7F4EA]'
                : 'bg-[#FCFAF3] text-[#879568] hover:text-[#303820] border border-[#E6E0D1]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {activeList.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#879568] bg-[#FCFAF3] rounded-xl border border-dashed border-[#E6E0D1]">
          No skills recorded in this category yet. Start or complete an interview to build your evidence profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeList.map((item, idx) => {
            const isDemonstrated = item.status === 'Demonstrated';
            const isPartial = item.status === 'Partially demonstrated';
            const isRequiring = item.status === 'Requires Assessment';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDemonstrated
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isPartial
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-[#FCFAF3] border-[#E6E0D1]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-xs text-[#303820]">
                    {item.name}
                  </span>
                  {isDemonstrated && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {isPartial && (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  {isRequiring && (
                    <HelpCircle className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-medium ${
                      isDemonstrated
                        ? 'text-emerald-700'
                        : isPartial
                        ? 'text-amber-700'
                        : 'text-[#879568]'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[#A09D90]">
                    {isDemonstrated ? 'Verified' : isPartial ? 'Under Investigated' : 'Claimed'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer explanation */}
      <div className="mt-4 pt-3 border-t border-[#E6E0D1] flex items-center justify-between text-[11px] text-[#879568]">
        <span>Source: Candidate Resume + Spoken Conversational Evidence</span>
        <span className="font-medium text-[#596B32]">Zero Hallucinated Metrics</span>
      </div>
    </div>
  );
}
