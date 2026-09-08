import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Shield,
  Globe,
  Zap,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  KeyRound,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    authError,
    authErrorCode,
    clearAuthError,
  } = useAuth();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Forgot password
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Domain authorization helpers
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedWildcard, setCopiedWildcard] = useState(false);
  const [currentHostname, setCurrentHostname] = useState('');
  const [dismissedNotice, setDismissedNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHostname(window.location.hostname);
    }
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setSubmitting(true);

    if (mode === 'signin') {
      await signInWithEmail(email, password);
    } else {
      await signUpWithEmail(email, password, fullName);
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setDismissedNotice(false);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const success = await resetPassword(resetEmail || email);
    setResetLoading(false);
    if (success) {
      setResetSent(true);
    }
  };

  const copyToClipboard = (text: string, isWildcard: boolean) => {
    navigator.clipboard.writeText(text);
    if (isWildcard) {
      setCopiedWildcard(true);
      setTimeout(() => setCopiedWildcard(false), 2000);
    } else {
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2000);
    }
  };

  const isAuthErrorUnauthorized =
    authErrorCode === 'auth/unauthorized-domain' ||
    authError?.toLowerCase().includes('authorized domain') ||
    authError?.toLowerCase().includes('not authorized');

  const isUnauthorizedDomain = !dismissedNotice && isAuthErrorUnauthorized;

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trading-journal-f8d1a';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  return (
    <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center px-4 py-10">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Header in circle */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="relative group">
            {/* Ambient glow */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/40 via-amber-500/30 to-blue-500/40 rounded-full blur-xl opacity-80 group-hover:opacity-100 transition duration-500" />
            
            {/* Circular Logo Container */}
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-emerald-500/60 shadow-2xl bg-[#0D0F12] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo_circular.png"
                alt="The Trading Journal"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover block"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
          </div>
          <h1 className="text-lg font-extrabold tracking-wider text-[#F5F5F5] uppercase mt-3">
            The Trading Journal
          </h1>
          <p className="text-xs font-semibold tracking-widest text-emerald-400 mt-0.5 uppercase">
            Track • Analyze • Grow
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-2xl p-6 sm:p-7 shadow-2xl">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#1B1F24] p-1 rounded-xl border border-[#292D33] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                clearAuthError();
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                clearAuthError();
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-[#A0A6AE] hover:text-[#F5F5F5]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#F5F5F5]">
              {mode === 'signin' ? 'Welcome Back, Trader' : 'Start Your Trading Journal'}
            </h2>
            <p className="text-xs text-[#A0A6AE] mt-0.5">
              {mode === 'signin'
                ? 'Sign in to access your trades, analytics, and accounts.'
                : 'Create your trader profile to track setups and edge.'}
            </p>
          </div>

          {/* Error Message */}
          {authError && !isAuthErrorUnauthorized && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{authError}</div>
            </div>
          )}

          {/* Unauthorized Domain Alert (When Google OAuth requires whitelist) */}
          {isUnauthorizedDomain && (
            <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2.5">
              <div className="flex items-start gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Google OAuth Domain Notice</span>
              </div>
              <p className="text-[#A0A6AE] text-[11px] leading-relaxed">
                Firebase restricts Google sign-in popups to authorized domains. You can <strong>sign in directly with your Email & Password below</strong>, or whitelist this preview domain:
              </p>
              <div className="bg-[#0D0F12] p-2.5 rounded-lg border border-[#292D33] space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-[#6F7680]">
                  <span>Domain:</span>
                  <button
                    onClick={() => copyToClipboard(currentHostname, false)}
                    className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
                  >
                    {copiedHost ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHost ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-[#F5F5F5] break-all select-all font-sans text-xs bg-[#15181D] px-2 py-1 rounded">
                  {currentHostname || 'ais-dev-*.run.app'}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium rounded-lg text-[11px] transition border border-amber-500/30"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Firebase Authorized Domains</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setDismissedNotice(true);
                    clearAuthError();
                  }}
                  className="px-2.5 py-1.5 border border-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5] rounded-lg text-[11px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-medium text-[#A0A6AE] block mb-1.5">Full Name / Trader Handle</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6F7680] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Shreyanshu Jain"
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-emerald-500 transition placeholder:text-[#505761]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-[#A0A6AE] block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6F7680] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-emerald-500 transition placeholder:text-[#505761]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-[#A0A6AE]">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email.trim());
                      setResetSent(false);
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6F7680] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:border-emerald-500 transition placeholder:text-[#505761]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F7680] hover:text-[#A0A6AE] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-[10px] text-[#6F7680] mt-1">Must be at least 6 characters.</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all duration-150 shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Journal' : 'Create Account & Start'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#292D33]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#15181D] px-3 text-[11px] text-[#6F7680]">or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold text-xs transition-all duration-150 shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Feature highlights footer */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            { icon: Shield, label: 'Encrypted Trades' },
            { icon: Globe, label: 'Cloud Synchronized' },
            { icon: Zap, label: 'Real-Time P&L' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-[#15181D]/60 border border-[#292D33] rounded-xl p-2.5 text-center">
              <Icon className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
              <span className="text-[10px] text-[#6F7680] block truncate">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#15181D] border border-[#292D33] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-[#F5F5F5] mb-1">Reset Password</h3>
            <p className="text-xs text-[#A0A6AE] mb-4">
              Enter your email address to receive password reset instructions.
            </p>

            {resetSent ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Email Sent</span>
                </div>
                <p className="text-xs text-[#A0A6AE]">
                  Check your inbox for <strong className="text-[#F5F5F5]">{resetEmail || email}</strong> and follow the link to create a new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setResetSent(false);
                  }}
                  className="w-full py-2 bg-emerald-500 text-black font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#A0A6AE] block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition cursor-pointer disabled:opacity-60"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="py-2 px-3 border border-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5] rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

