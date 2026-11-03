import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InterviewSetupModal from './pages/InterviewSetupModal.jsx';
import ActiveInterview from './pages/ActiveInterview.jsx';
import InterviewReport from './pages/InterviewReport.jsx';
import ResumeManager from './pages/ResumeManager.jsx';
import QuestionBank from './pages/QuestionBank.jsx';
import InterviewHistory from './pages/InterviewHistory.jsx';
import Analytics from './pages/Analytics.jsx';

function MainApp() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EA] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#303820] flex items-center justify-center text-[#F7F4EA] font-editorial text-lg font-bold mb-4 shadow-sm animate-pulse">
          IQ
        </div>
        <span className="w-6 h-6 border-2 border-[#596B32] border-t-transparent rounded-full animate-spin"></span>
        <span className="mt-3 text-xs text-[#879568]">Initializing InterviewIQ...</span>
      </div>
    );
  }

  // 1. FIRST PAGE REQUIREMENT:
  // If not authenticated, render AuthPage directly (no marketing landing page before auth)
  if (!user) {
    return <AuthPage />;
  }

  // Handle starting interview from modal
  const handleInterviewStarted = (interviewId: string) => {
  console.log('[Interview Started] ID:', interviewId);

  setCurrentInterviewId(interviewId);
  setActivePage('active-interview');

  console.log('[Interview Started] Navigation triggered');
};

  // Handle finish interview
  const handleFinishInterview = (interviewId: string) => {
    setActiveReportId(interviewId);
    setActivePage('report');
  };

  // Handle view report from history/dashboard
  const handleViewReport = (interviewId: string) => {
    setActiveReportId(interviewId);
    setActivePage('report');
  };

  console.log('[App State]', {
  activePage,
  currentInterviewId,
  showSetupModal
});

  return (
    <div className="min-h-screen bg-[#F7F4EA] text-[#20211D] flex flex-col selection:bg-[#596B32]/20">
      {/* Navbar (hidden during active voice interview to avoid distraction) */}
      {activePage !== 'active-interview' && (
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          onStartInterviewClick={() => setShowSetupModal(true)}
        />
      )}

      {/* Main Page Content */}
      <main className="flex-1 pb-16">
        {activePage === 'dashboard' && (
          <Dashboard
            onStartInterview={() => setShowSetupModal(true)}
            onViewReport={handleViewReport}
            onNavigate={(page: string) => setActivePage(page)}
          />
        )}

        {activePage === 'active-interview' && currentInterviewId && (
          <ActiveInterview
            interviewId={currentInterviewId}
            onFinishInterview={handleFinishInterview}
            onCancel={() => setActivePage('dashboard')}
          />
        )}

        {activePage === 'report' && activeReportId && (
          <InterviewReport
            interviewId={activeReportId}
            onBackToDashboard={() => setActivePage('dashboard')}
          />
        )}

        {activePage === 'resume' && <ResumeManager />}

        {activePage === 'question-bank' && <QuestionBank />}

        {activePage === 'history' && (
          <InterviewHistory
            onViewReport={handleViewReport}
            onStartNew={() => setShowSetupModal(true)}
          />
        )}

        {activePage === 'analytics' && (
          <Analytics onStartPractice={() => setShowSetupModal(true)} />
        )}
      </main>

      {/* Footer */}
      {activePage !== 'active-interview' && (
        <footer className="border-t border-[#E6E0D1] bg-[#FCFAF3] py-6 px-4 text-center text-xs text-[#879568]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-editorial font-bold text-[#303820]">InterviewIQ</span>
              <span>— Evidence-Based AI Technical Interviewing</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>PostgreSQL Local Storage</span>
              <span>•</span>
              <span>Google Gemini AI</span>
              <span>•</span>
              <span>Voice-Only Engine</span>
            </div>
          </div>
        </footer>
      )}

      {/* Interview Setup Modal */}
      <InterviewSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onInterviewStarted={handleInterviewStarted}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
