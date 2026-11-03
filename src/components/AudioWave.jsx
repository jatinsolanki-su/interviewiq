import React from 'react';
import { Mic, Volume2, Loader2, PauseCircle } from 'lucide-react';

export default function AudioWave({ state, isUserSpeaking, volumeLevel = 0.5 }) {
  // state: 'ready' | 'ai_speaking' | 'listening' | 'processing' | 'evaluating' | 'paused' | 'completed'

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      {/* Visual pulse rings */}
      <div className="relative flex items-center justify-center">
        {/* Outer animated ripple */}
        {(state === 'listening' || state === 'ai_speaking') && (
          <div
            className={`absolute w-32 h-32 rounded-full border transition-all duration-700 animate-ping opacity-25 ${
              state === 'listening' ? 'border-[#596B32] bg-[#596B32]/10' : 'border-[#303820] bg-[#303820]/10'
            }`}
          />
        )}

        {/* Medium circle */}
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 border ${
            state === 'listening'
              ? 'bg-[#596B32] border-[#303820] shadow-lg scale-105'
              : state === 'ai_speaking'
              ? 'bg-[#303820] border-[#596B32] shadow-md'
              : state === 'processing' || state === 'evaluating'
              ? 'bg-[#879568] border-[#303820] animate-pulse'
              : state === 'paused'
              ? 'bg-[#E6E0D1] border-[#879568]'
              : 'bg-[#FCFAF3] border-[#E6E0D1]'
          }`}
        >
          {state === 'listening' && (
            <Mic className="w-10 h-10 text-[#F7F4EA] animate-pulse" />
          )}
          {state === 'ai_speaking' && (
            <Volume2 className="w-10 h-10 text-[#F7F4EA] animate-bounce" />
          )}
          {(state === 'processing' || state === 'evaluating') && (
            <Loader2 className="w-10 h-10 text-[#F7F4EA] animate-spin" />
          )}
          {state === 'paused' && (
            <PauseCircle className="w-10 h-10 text-[#303820]" />
          )}
          {state === 'ready' && (
            <Mic className="w-10 h-10 text-[#596B32]" />
          )}
        </div>
      </div>

      {/* Dynamic sound equalizer bars */}
      <div className="flex items-center gap-1.5 h-8 mt-4">
        {[40, 75, 55, 95, 60, 85, 45, 90, 65, 80, 50].map((h, i) => {
          let heightPercent = 20;
          let barBg = 'bg-[#E6E0D1]';

          if (state === 'listening') {
            heightPercent = Math.min(100, Math.max(25, (h * (volumeLevel || 0.7))));
            barBg = 'bg-[#596B32]';
          } else if (state === 'ai_speaking') {
            heightPercent = (i % 2 === 0 ? 70 : 40);
            barBg = 'bg-[#303820]';
          } else if (state === 'processing' || state === 'evaluating') {
            heightPercent = 35;
            barBg = 'bg-[#879568]';
          }

          return (
            <div
              key={i}
              style={{ height: `${heightPercent}%` }}
              className={`w-1 rounded-full transition-all duration-150 ${barBg}`}
            />
          );
        })}
      </div>

      {/* State label */}
      <div className="mt-3 text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            state === 'listening'
              ? 'bg-[#596B32]/10 text-[#596B32] border border-[#596B32]/30'
              : state === 'ai_speaking'
              ? 'bg-[#303820]/10 text-[#303820] border border-[#303820]/30'
              : state === 'processing' || state === 'evaluating'
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : state === 'paused'
              ? 'bg-gray-100 text-gray-700 border border-gray-300'
              : 'bg-[#FCFAF3] text-[#879568] border border-[#E6E0D1]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'listening'
                ? 'bg-[#596B32] animate-ping'
                : state === 'ai_speaking'
                ? 'bg-[#303820]'
                : state === 'processing' || state === 'evaluating'
                ? 'bg-amber-500 animate-spin'
                : 'bg-gray-400'
            }`}
          />
          {state === 'listening' && 'Listening to your answer... Speak naturally'}
          {state === 'ai_speaking' && 'AI Interviewer is speaking...'}
          {state === 'evaluating' && 'Investigating technical claims & evaluating depth...'}
          {state === 'processing' && 'Processing audio stream...'}
          {state === 'paused' && 'Interview is paused'}
          {state === 'ready' && 'Ready. Click Start Answering to speak'}
        </span>
      </div>
    </div>
  );
}
