import React, { useState, useEffect, useRef } from 'react';
import AudioWave from '../components/AudioWave.jsx';
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Pause,
  Play,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  StopCircle,
  SendHorizontal
} from 'lucide-react';

export default function ActiveInterview({ interviewId, onFinishInterview, onCancel }) {
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionList, setQuestionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Voice Interaction States: 'ready' | 'ai_speaking' | 'listening' | 'processing' | 'evaluating' | 'paused' | 'completed' | 'error'
  const [interviewState, setInterviewState] = useState('ready');
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true);
  const [micPermissionGranted, setMicPermissionGranted] = useState(null);

  // Transcript states
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(0);

  // Follow-up investigation alert
  const [activeFollowUpAlert, setActiveFollowUpAlert] = useState(null);
  const [lastEvaluation, setLastEvaluation] = useState(null);

  // Speech Recognition & Synthesis references
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechRecognitionSupported(false);
      setError('SpeechRecognition API is not supported in this browser. Please open InterviewIQ in Google Chrome on desktop for voice interviews.');
    }
  }, []);

  // Fetch interview details and current question
  useEffect(() => {
    async function fetchInterview() {
      try {
        setLoading(true);
        const res = await fetch(`/api/interviews/${interviewId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load interview');

        setInterview(data.interview);
        setQuestionList(data.questions || []);

        // Find the first unanswered question
        const unanswered = (data.questions || []).find(q => !q.answer);
        if (unanswered) {
          setCurrentQuestion(unanswered);
          // AI speaks the question aloud automatically
          speakQuestion(unanswered.question_text);
        } else if (data.questions && data.questions.length > 0) {
          // All answered -> finalize
          finishInterview();
        }
      } catch (err) {
        setError(err.message || 'Error loading interview session');
        setInterviewState('error');
      } finally {
        setLoading(false);
      }
    }

    if (interviewId) {
      fetchInterview();
    }

    return () => {
      // Clean up speech synthesis & recognition on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [interviewId]);

  // AI Voice Synthesis: Speak question aloud
  const speakQuestion = (text) => {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any pending speech
    setInterviewState('ai_speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => {
      setInterviewState('ready');
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setInterviewState('ready');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Repeat Question aloud
  const repeatQuestion = () => {
    if (currentQuestion) {
      speakQuestion(currentQuestion.question_text);
    }
  };

  // Start Voice Recognition (Candidate speaks answer)
  const startListening = () => {
    if (!isSpeechRecognitionSupported) {
      setError('Please use Google Chrome on desktop to enable speech recognition.');
      return;
    }

    // Stop AI speech if speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setInterviewState('listening');
      setMicPermissionGranted(true);
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setAudioDurationSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalized = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalized += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      setFinalTranscript(finalized);
      setLiveTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.warn('[SpeechRecognition Error]:', event.error);
      if (event.error === 'not-allowed') {
        setMicPermissionGranted(false);
        setError('Microphone access was denied. Please allow microphone permissions in your browser to speak.');
      }
      setInterviewState('ready');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };

    recognition.onend = () => {
      if (interviewState === 'listening') {
        setInterviewState('ready');
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
    }
  };

  // Stop Recording / Finish Speaking
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setInterviewState('ready');
  };

  // Clear / Re-record answer
  const reRecordAnswer = () => {
    stopListening();
    setFinalTranscript('');
    setLiveTranscript('');
    setAudioDurationSeconds(0);
    setInterviewState('ready');
  };

  // Pause / Resume Interview
  const togglePause = async () => {
    if (interviewState === 'paused') {
      await fetch(`/api/interviews/${interviewId}/resume`, { method: 'POST' });
      setInterviewState('ready');
      if (currentQuestion) {
        speakQuestion(currentQuestion.question_text);
      }
    } else {
      stopListening();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      await fetch(`/api/interviews/${interviewId}/pause`, { method: 'POST' });
      setInterviewState('paused');
    }
  };

  // Submit Spoken Answer to Backend for Evaluation & Adaptive Follow-up
  const submitAnswer = async () => {
    const fullSpokenAnswer = (finalTranscript + ' ' + liveTranscript).trim();

    if (!fullSpokenAnswer) {
      setError('Please speak your answer aloud before submitting.');
      return;
    }

    stopListening();
    setInterviewState('evaluating');
    setError('');

    try {
      const response = await fetch(`/api/interviews/${interviewId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          transcript: fullSpokenAnswer,
          audio_duration_seconds: audioDurationSeconds,
          speech_confidence: 0.95
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit spoken answer.');
      }

      setLastEvaluation(data.evaluation);

      // Check if interview completed
      if (data.isFinished || !data.nextQuestion) {
        await finishInterview();
        return;
      }

      // If an adaptive follow-up was generated:
      if (data.nextQuestion.is_follow_up) {
        setActiveFollowUpAlert({
          skill: data.nextQuestion.skill_targeted,
          reason: data.nextQuestion.follow_up_reason || 'Investigating technical claims and reasoning depth.'
        });
      } else {
        setActiveFollowUpAlert(null);
      }

      // Transition to next question
      setCurrentQuestion(data.nextQuestion);
      setQuestionList(prev => [...prev, data.nextQuestion]);
      reRecordAnswer();

      // AI speaks the next question aloud
      speakQuestion(data.nextQuestion.question_text);
    } catch (err) {
      setError(err.message || 'Error evaluating answer.');
      setInterviewState('ready');
    }
  };

  // Finalize interview and generate report
  const finishInterview = async () => {
    setInterviewState('evaluating');
    try {
      const res = await fetch(`/api/interviews/${interviewId}/complete`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onFinishInterview(interviewId);
      } else {
        throw new Error(data.error || 'Failed to generate final interview report.');
      }
    } catch (err) {
      setError(err.message || 'Failed to finalize interview.');
      setInterviewState('ready');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <span className="w-8 h-8 border-3 border-[#596B32] border-t-transparent rounded-full animate-spin"></span>
        <span className="mt-4 text-xs text-[#879568]">Preparing InterviewIQ Voice Session...</span>
      </div>
    );
  }

  const combinedTranscript = (finalTranscript + ' ' + liveTranscript).trim();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header Card */}
      <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#303820] text-[#F7F4EA]">
              {interview?.interview_type || 'Technical'}
            </span>
            <span className="text-xs text-[#879568]">
              {interview?.difficulty} • {interview?.experience_level}
            </span>
          </div>
          <h1 className="font-editorial text-xl font-bold text-[#303820] mt-1">
            {interview?.job_role}
          </h1>
        </div>

        {/* Controls: Pause / Repeat / End */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={repeatQuestion}
            disabled={interviewState === 'evaluating' || interviewState === 'ai_speaking'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#303820] bg-[#FCFAF3] hover:bg-[#E6E0D1]/50 border border-[#E6E0D1] transition-all cursor-pointer disabled:opacity-50"
            title="Repeat Question Aloud"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repeat</span>
          </button>

          <button
            type="button"
            onClick={togglePause}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#303820] bg-[#FCFAF3] hover:bg-[#E6E0D1]/50 border border-[#E6E0D1] transition-all cursor-pointer"
          >
            {interviewState === 'paused' ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-700" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-700" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={finishInterview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
            title="Conclude Interview & Generate Report"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>End</span>
          </button>
        </div>
      </div>

      {/* Adaptive Follow-Up Investigation Banner */}
      {currentQuestion?.is_follow_up && (
        <div className="mb-6 p-4 bg-amber-50/70 border border-amber-300 rounded-2xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 uppercase tracking-wider block">
              Evidence-Based Adaptive Follow-Up Triggered
            </span>
            <p className="text-amber-800 mt-1">
              {currentQuestion.follow_up_reason ||
                `The AI interviewer noticed your claim regarding ${currentQuestion.skill_targeted} and is probing your deep architectural understanding and trade-offs.`}
            </p>
          </div>
        </div>
      )}

      {/* Error / Browser Notice */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex items-center justify-between text-xs text-[#879568] mb-3">
          <span className="font-semibold uppercase tracking-wider text-[#596B32]">
            Question {currentQuestion?.question_order || 1} of {interview?.total_questions || 5}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#FCFAF3] border border-[#E6E0D1] text-[11px]">
            Target Competency: {currentQuestion?.skill_targeted || 'Core Engineering'}
          </span>
        </div>

        <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#303820] leading-snug">
          {currentQuestion?.question_text}
        </h2>
      </div>

      {/* Voice Waveform and Audio Equalizer */}
      <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs mb-6">
        <AudioWave
          state={interviewState}
          isUserSpeaking={interviewState === 'listening'}
          volumeLevel={0.7}
        />

        {/* Live Audio Duration Timer */}
        {audioDurationSeconds > 0 && (
          <div className="text-center text-xs font-mono text-[#879568] -mt-2 mb-2">
            Spoken Duration: {Math.floor(audioDurationSeconds / 60)}:{(audioDurationSeconds % 60).toString().padStart(2, '0')}
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#E6E0D1]">
          {interviewState !== 'listening' ? (
            <button
              type="button"
              onClick={startListening}
              disabled={interviewState === 'evaluating' || interviewState === 'ai_speaking'}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs text-[#F7F4EA] bg-[#596B32] hover:bg-[#303820] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>{combinedTranscript ? 'Resume Speaking' : 'Start Answering (Speak)'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopListening}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs text-[#F7F4EA] bg-amber-600 hover:bg-amber-700 transition-all shadow-sm cursor-pointer"
            >
              <MicOff className="w-4 h-4" />
              <span>Stop Recording</span>
            </button>
          )}

          {combinedTranscript && (
            <button
              type="button"
              onClick={reRecordAnswer}
              disabled={interviewState === 'listening' || interviewState === 'evaluating'}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-medium text-[#879568] hover:text-[#303820] bg-[#FCFAF3] hover:bg-[#E6E0D1]/50 border border-[#E6E0D1] transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-record</span>
            </button>
          )}

          <button
            type="button"
            onClick={submitAnswer}
            disabled={!combinedTranscript || interviewState === 'listening' || interviewState === 'evaluating'}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs text-[#F7F4EA] bg-[#303820] hover:bg-[#596B32] transition-all shadow-sm cursor-pointer disabled:opacity-40"
          >
            {interviewState === 'evaluating' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#F7F4EA] border-t-transparent rounded-full animate-spin"></span>
                <span>Evaluating Depth...</span>
              </>
            ) : (
              <>
                <SendHorizontal className="w-4 h-4" />
                <span>Submit Spoken Answer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Transcript Review Card (No typing allowed - strictly speech transcript) */}
      <div className="bg-[#FFFFFF] border border-[#E6E0D1] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D1]">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#596B32]" />
            <h3 className="font-semibold text-xs text-[#303820] uppercase tracking-wider">
              Spoken Transcript Review
            </h3>
          </div>
          <span className="text-[11px] text-[#879568] italic">
            Voice-only interview • Typing disabled by design
          </span>
        </div>

        <div className="mt-4 min-h-[100px] p-4 bg-[#FCFAF3] border border-[#E6E0D1] rounded-xl text-xs text-[#20211D] leading-relaxed">
          {combinedTranscript ? (
            <span>
              {finalTranscript}
              <span className="text-[#879568] italic">{liveTranscript}</span>
            </span>
          ) : (
            <span className="text-[#A09D90] italic">
              Your spoken words will appear here in real-time as you speak into the microphone. You can re-record as many times as you like before submitting.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
