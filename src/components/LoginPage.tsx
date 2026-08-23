import React, { useState, useEffect } from 'react';
import { TrendingUp, Shield, Globe, Zap, Copy, Check, ExternalLink, AlertTriangle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithUid, authError, authErrorCode, clearAuthError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCustomUidInput, setShowCustomUidInput] = useState(false);
  const [customUid, setCustomUid] = useState('e0xW3T8S83Y8ATyma1keIe0fNX03');
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedWildcard, setCopiedWildcard] = useState(false);
  const [currentHostname, setCurrentHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHostname(window.location.hostname);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  const handleUidSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUid.trim()) {
      signInWithUid(customUid.trim(), 'Shreyanshu Jain', 'gulshreyanshu72@gmail.com');
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

  const isUnauthorizedDomain =
    authErrorCode === 'auth/unauthorized-domain' ||
    authError?.toLowerCase().includes('authorized domain') ||
    authError?.toLowerCase().includes('not authorized');

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trading-journal-f8d1a';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  return (
    <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center px-4 py-8">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 shadow-xl shadow-emerald-500/20 mb-3">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Trading Journal</h1>
          <p className="text-xs text-[#6F7680] mt-1">Professional Analytics & Journal Terminal</p>
        </div>

        {/* Card */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-[#F5F5F5] mb-1">Welcome Back</h2>
          <p className="text-xs text-[#A0A6AE] mb-6">
            Sign in to access and sync your trading journal.
          </p>

          {/* Unauthorized Domain Resolution Banner */}
          {isUnauthorizedDomain ? (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-3">
              <div className="flex items-start gap-2.5 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Authorize this domain in Firebase to enable Google Login</span>
              </div>

              <p className="text-[#A0A6AE] leading-relaxed">
                Firebase Authentication blocks popups from unlisted domains for security. To fix this permanently in 2 clicks:
              </p>

              <div className="space-y-2 bg-[#0D0F12]/70 p-3 rounded-lg border border-[#292D33]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#6F7680]">Current Preview Domain:</span>
                  <button
                    onClick={() => copyToClipboard(currentHostname, false)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#22272E] hover:bg-[#292D33] text-emerald-400 rounded text-[11px] font-medium transition cursor-pointer"
                  >
                    {copiedHost ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHost ? 'Copied!' : 'Copy Domain'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-[#F5F5F5] bg-[#15181D] px-2.5 py-1.5 rounded border border-[#292D33] break-all select-all">
                  {currentHostname || 'ais-dev-*.run.app'}
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-[#6F7680]">
                  <span>Or add apex wildcard:</span>
                  <button
                    onClick={() => copyToClipboard('run.app', true)}
                    className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
                  >
                    {copiedWildcard ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>run.app</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium rounded-lg text-xs transition border border-amber-500/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Firebase Settings</span>
                </a>
                <button
                  onClick={clearAuthError}
                  className="px-3 py-2 border border-[#292D33] text-[#A0A6AE] hover:text-[#F5F5F5] rounded-lg text-xs transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : authError ? (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {authError}
            </div>
          ) : null}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm transition-all duration-150 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Connecting with Google...' : 'Continue with Google'}
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#292D33]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#15181D] px-3 text-[#6F7680]">instant bypass</span>
            </div>
          </div>

          {/* Instant UID Sign In */}
          <button
            onClick={() => signInWithUid('e0xW3T8S83Y8ATyma1keIe0fNX03', 'Shreyanshu Jain', 'gulshreyanshu72@gmail.com')}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Enter Terminal as UID: <span className="font-mono font-bold">e0xW3T8S8...</span></span>
          </button>

          <div className="mt-3 text-center">
            {!showCustomUidInput ? (
              <button
                type="button"
                onClick={() => setShowCustomUidInput(true)}
                className="text-[11px] text-[#6F7680] hover:text-[#A0A6AE] underline cursor-pointer"
              >
                Use custom Firebase UID / account
              </button>
            ) : (
              <form onSubmit={handleUidSignIn} className="space-y-2 mt-2 bg-[#0D0F12] p-3 rounded-xl border border-[#292D33]">
                <div className="text-left text-[11px] text-[#A0A6AE] font-medium">Enter Firebase UID:</div>
                <input
                  type="text"
                  value={customUid}
                  onChange={(e) => setCustomUid(e.target.value)}
                  placeholder="e.g. e0xW3T8S83Y8ATyma1keIe0fNX03"
                  className="w-full px-3 py-2 text-xs bg-[#15181D] border border-[#292D33] rounded-lg text-[#F5F5F5] font-mono focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer"
                  >
                    Open Journal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomUidInput(false)}
                    className="py-1.5 px-3 rounded-lg border border-[#292D33] text-[#6F7680] hover:text-[#F5F5F5] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Privacy note */}
          <p className="text-[11px] text-[#6F7680] text-center mt-5">
            Your trading data is private and securely encrypted.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: Shield, label: 'Private & Secure' },
            { icon: Globe, label: 'Multi-Device' },
            { icon: Zap, label: 'Real-Time Sync' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-[#15181D]/60 border border-[#292D33] rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <span className="text-[11px] text-[#6F7680]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
