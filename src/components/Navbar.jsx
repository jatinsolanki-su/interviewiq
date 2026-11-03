import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Mic,
  BookOpen,
  FileText,
  History,
  BarChart3,
  LogOut,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import ProductExplainerModal from './ProductExplainerModal.jsx';

export default function Navbar({ activePage, setActivePage, onStartInterviewClick }) {
  const { user, logout } = useAuth();
  const [showExplainer, setShowExplainer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'question-bank', label: 'Question Bank', icon: BookOpen },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E6E0D1] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#303820] group-hover:bg-[#596B32] transition-colors flex items-center justify-center text-[#F7F4EA] font-editorial text-base font-bold shadow-xs">
                IQ
              </div>
              <div>
                <span className="font-editorial text-xl font-bold tracking-tight text-[#303820]">
                  InterviewIQ
                </span>
                <span className="hidden md:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-[#596B32] bg-[#596B32]/10 rounded border border-[#596B32]/20">
                  Adaptive Voice AI
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#303820] text-[#F7F4EA] shadow-xs'
                      : 'text-[#879568] hover:text-[#303820] hover:bg-[#FCFAF3]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons: Explainer, Start Interview, User & Logout */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Explainer USP Trigger */}
            <button
              type="button"
              onClick={() => setShowExplainer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#596B32] hover:text-[#303820] bg-[#596B32]/10 hover:bg-[#596B32]/20 border border-[#596B32]/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>How It Works</span>
            </button>

            {/* Start Interview CTA */}
            <button
              type="button"
              onClick={onStartInterviewClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#F7F4EA] bg-[#596B32] hover:bg-[#303820] transition-all shadow-xs cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Interview</span>
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#E6E0D1]">
              <div className="text-right">
                <span className="block text-xs font-semibold text-[#303820] leading-none">
                  {user?.full_name?.split(' ')[0] || 'Candidate'}
                </span>
                <span className="text-[10px] text-[#879568] leading-none">
                  Local User
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-[#879568] hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onStartInterviewClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#F7F4EA] bg-[#596B32]"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#303820] hover:bg-[#FCFAF3]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-[#E6E0D1] space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left ${
                    isActive ? 'bg-[#303820] text-[#F7F4EA]' : 'text-[#303820] hover:bg-[#FCFAF3]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setShowExplainer(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#596B32]"
            >
              <Sparkles className="w-4 h-4" />
              <span>How Evidence Investigation Works</span>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </nav>

      {/* Explainer Modal */}
      <ProductExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
      />
    </>
  );
}
