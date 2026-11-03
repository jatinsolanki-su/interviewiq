import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Mic,
  Layers,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  X
} from 'lucide-react';
import topFoliageImg from '../assets/images/ref_foliage_top_left.png';
import mountainsImg from '../assets/images/clean_mountain_ridge.png';

// Sprout SVG icon matching the reference design
function SproutIcon({ className = 'w-4 h-4 text-[#485623]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.5c-.7 0-1.3-.6-1.3-1.3v-7.5c-2.5-2.8-3-6.2-3-6.2s3.5.6 5.5 3c2-2.4 5.5-3 5.5-3s-.5 3.4-3 6.2v7.5c0 .7-.6 1.3-1.3 1.3h-2.4z" />
    </svg>
  );
}

// Logo with 4 equalizer bars matching reference
function InterviewIQLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="flex items-end gap-[3px] h-5 mb-0.5">
        <span className="w-1 h-2.5 bg-[#8C9C68] rounded-full inline-block" />
        <span className="w-1 h-3.5 bg-[#8C9C68] rounded-full inline-block" />
        <span className="w-1 h-5 bg-[#8C9C68] rounded-full inline-block" />
        <span className="w-1 h-2 bg-[#8C9C68] rounded-full inline-block" />
      </div>
      <span className="font-editorial text-2xl font-bold tracking-tight text-[#1E2415]">
        Interview<span className="font-editorial font-bold text-[#1E2415]">IQ</span>
      </span>
    </div>
  );
}

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (isSignUp) {
      if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
        setFormError('Please fill in all required fields.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must contain at least 6 characters.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signup(fullName, email, password, confirmPassword);
      } catch (err) {
        setFormError(err.message || 'Failed to create account.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!email.trim() || !password) {
        setFormError('Please enter your email and password.');
        return;
      }

      setIsSubmitting(true);
      try {
        await login(email, password);
      } catch (err) {
        setFormError(err.message || 'Invalid email or password.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#F4EFE6] relative overflow-x-hidden lg:overflow-hidden selection:bg-[#596B32]/20 font-sans text-[#20211D] flex flex-col justify-between">
      {/* Top Left Botanical Foliage Branch from Reference */}
      <img
        src={topFoliageImg}
        alt=""
        aria-hidden="true"
        className="absolute top-0 left-0 w-28 sm:w-36 lg:w-40 pointer-events-none select-none z-10 opacity-95"
      />

      {/* Main Split-Screen Container */}
      <div className="flex-1 w-full max-w-[1380px] mx-auto px-6 sm:px-12 lg:px-16 flex flex-col lg:flex-row items-center justify-between relative z-20 py-8 lg:py-4">
        {/* =========================================================================
            LEFT COLUMN — BRANDING & PRODUCT SPECIFICATION
            ========================================================================= */}
        <div className="w-full lg:w-[52%] xl:w-[50%] flex flex-col justify-center pt-8 sm:pt-12 lg:pt-0 lg:pr-6">
          {/* Logo with Equalizer Bars */}
          <div className="flex items-center gap-2">
            <InterviewIQLogo />
          </div>

          {/* Main Heading */}
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[50px] font-bold text-[#1E2415] leading-[1.12] tracking-tight mt-6 sm:mt-7">
            Prepare Smarter.<br />
            Interview Deeper.
          </h1>

          {/* Supporting Description */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-[15px] text-[#555A4B] leading-relaxed max-w-[460px] font-normal">
            A voice-first, resume-aware platform that conducts realistic interviews, verifies your claims with intelligent follow-ups, and maps your true skill depth.
          </p>

          {/* Three Feature Rows */}
          <div className="mt-7 sm:mt-8 space-y-4 max-w-[460px]">
            {/* Feature 1: Voice-First Interviews */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E1E7D5] flex items-center justify-center text-[#485623] shrink-0">
                <Mic className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-sm text-[#1E2415] tracking-tight">
                  Voice-First Interviews
                </h3>
                <p className="text-xs text-[#5C6152] mt-0.5 font-normal">
                  Speak your answers, naturally.
                </p>
              </div>
            </div>

            {/* Feature 2: Evidence-Based Evaluation */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E1E7D5] flex items-center justify-center text-[#485623] shrink-0">
                <Layers className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-sm text-[#1E2415] tracking-tight">
                  Evidence-Based Evaluation
                </h3>
                <p className="text-xs text-[#5C6152] mt-0.5 font-normal">
                  We investigate your claims with smart follow-ups.
                </p>
              </div>
            </div>

            {/* Feature 3: Skill Gap Map */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E1E7D5] flex items-center justify-center text-[#485623] shrink-0">
                <div className="flex items-end gap-[3px] h-4 mb-0.5 text-[#485623]">
                  <span className="w-1 h-2 bg-current rounded-xs inline-block" />
                  <span className="w-1 h-3.5 bg-current rounded-xs inline-block" />
                  <span className="w-1 h-4.5 bg-current rounded-xs inline-block" />
                </div>
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-sm text-[#1E2415] tracking-tight">
                  Skill Gap Map
                </h3>
                <p className="text-xs text-[#5C6152] mt-0.5 font-normal">
                  See what you've demonstrated, what's partial, and what to improve.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN — AUTHENTICATION CARD
            ========================================================================= */}
        <div className="w-full lg:w-[46%] xl:w-[44%] flex items-center justify-center mt-10 lg:mt-0">
          <div className="w-full max-w-[430px] bg-[#FAF7F0] rounded-[28px] border border-[#E2DDCF] shadow-[0_20px_50px_rgba(40,46,28,0.06)] p-7 sm:p-9 relative transition-all">
            {/* Logo at the top of Card */}
            <div className="flex items-center justify-center">
              <InterviewIQLogo />
            </div>

            {/* Heading & Subtitle */}
            <div className="text-center mt-4">
              <h2 className="font-editorial text-3xl font-normal text-[#1E2415] tracking-tight">
                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-[#6F7364] mt-1.5 font-normal">
                {isSignUp
                  ? 'Start preparing for interviews with confidence.'
                  : 'Sign in to continue your InterviewIQ journey.'}
              </p>
            </div>

            {/* Segmented Tab Control: Sign In / Sign Up */}
            <div className="flex p-1 bg-[#EBE5D9] rounded-2xl gap-1 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setFormError('');
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  !isSignUp
                    ? 'bg-[#485623] text-white shadow-xs'
                    : 'text-[#303820] hover:text-[#1E2415]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setFormError('');
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isSignUp
                    ? 'bg-[#485623] text-white shadow-xs'
                    : 'text-[#303820] hover:text-[#1E2415]'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message Alert */}
            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 mt-5">
              {/* Full Name (Sign Up only) */}
              {isSignUp && (
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF7F0] border border-[#DDD6C8] rounded-xl text-xs text-[#20211D] placeholder-[#6F7364] focus:outline-none focus:ring-1 focus:ring-[#485623] focus:border-[#485623] transition-all"
                  />
                  <User className="w-4 h-4 text-[#6F7364] absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              )}

              {/* Email Address */}
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF7F0] border border-[#DDD6C8] rounded-xl text-xs text-[#20211D] placeholder-[#6F7364] focus:outline-none focus:ring-1 focus:ring-[#485623] focus:border-[#485623] transition-all"
                />
                <Mail className="w-4 h-4 text-[#6F7364] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-3 bg-[#FAF7F0] border border-[#DDD6C8] rounded-xl text-xs text-[#20211D] placeholder-[#6F7364] focus:outline-none focus:ring-1 focus:ring-[#485623] focus:border-[#485623] transition-all"
                />
                <Lock className="w-4 h-4 text-[#6F7364] absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#6F7364] hover:text-[#1E2415] p-0.5 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password (Sign Up only) */}
              {isSignUp && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-10 py-3 bg-[#FAF7F0] border border-[#DDD6C8] rounded-xl text-xs text-[#20211D] placeholder-[#6F7364] focus:outline-none focus:ring-1 focus:ring-[#485623] focus:border-[#485623] transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#6F7364] absolute left-3.5 top-3.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-[#6F7364] hover:text-[#1E2415] p-0.5 transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Remember Me & Forgot Password (Sign In only) */}
              {!isSignUp && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#C8C2B3] text-[#485623] focus:ring-[#485623] accent-[#485623] cursor-pointer"
                    />
                    <span className="text-[#4E5244] text-xs">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-xs font-normal text-[#485623] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3.5 px-4 bg-[#485623] hover:bg-[#3D491E] text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <span className="text-base leading-none">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Botanical Ornament (Two horizontal lines with sprout in center) */}
            <div className="flex items-center justify-center gap-4 mt-6 select-none">
              <div className="w-16 h-px bg-[#D6D0C2]" />
              <SproutIcon className="w-4 h-4 text-[#485623]" />
              <div className="w-16 h-px bg-[#D6D0C2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Panoramic Mountain Landscape Across the Bottom */}
      <div className="w-full relative pointer-events-none select-none z-10 overflow-hidden -mt-10 sm:-mt-12 lg:-mt-14">
        {/* Subtle top mist blend */}
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#F4EFE6] to-transparent z-10" />
        <img
          src={mountainsImg}
          alt=""
          aria-hidden="true"
          className="w-full h-32 sm:h-40 lg:h-48 object-cover object-left-bottom opacity-90"
        />
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-[#FFFFFF] rounded-2xl border border-[#E6E0D1] shadow-xl p-6 text-xs text-[#20211D]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D1]">
              <span className="font-editorial text-base font-bold text-[#303820]">
                Password Reset
              </span>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="p-1 rounded-lg text-[#879568] hover:text-[#303820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-[#6F7364] leading-relaxed">
              InterviewIQ runs locally with your PostgreSQL database. To reset your password, you can register with another account or update your password hash directly in PostgreSQL:
            </p>
            <div className="mt-2.5 p-2.5 bg-[#FCFAF3] rounded-lg border border-[#E6E0D1] font-mono text-[11px] text-[#303820] overflow-x-auto">
              SELECT email FROM users;
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="px-4 py-2 bg-[#485623] text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
