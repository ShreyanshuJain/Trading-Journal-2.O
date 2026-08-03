import React from 'react';
import { TrendingUp, Shield, Globe, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, authError } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 shadow-xl shadow-emerald-500/20 mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Trading Journal</h1>
          <p className="text-sm text-[#6F7680] mt-1">Professional Terminal</p>
        </div>

        {/* Card */}
        <div className="bg-[#15181D] border border-[#292D33] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-[#F5F5F5] mb-1">Welcome Back</h2>
          <p className="text-sm text-[#A0A6AE] mb-8">
            Sign in to access your trading journal.
          </p>

          {/* Error */}
          {authError && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {authError}
            </div>
          )}

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
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Privacy note */}
          <p className="text-xs text-[#6F7680] text-center mt-4">
            Your trading data is private and securely linked to your account.
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
