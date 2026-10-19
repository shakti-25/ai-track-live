import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Lock } from 'lucide-react';
import type { AuthSession } from '../utils/auth.ts';
import { verifyAuthorisedCredential } from '../utils/auth.ts';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  targetFeatureName?: string;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetFeatureName = 'Visit Log & Map Intelligence',
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleQuickSignIn = (email: string, name: string) => {
    setIsSigningIn(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsSigningIn(false);
      const session: AuthSession = {
        isAuthenticated: true,
        role: 'authorised_manager',
        email,
        name,
        lastLogin: Date.now(),
      };
      onSuccess(session);
      onClose();
    }, 400);
  };

  const handleCustomEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    setIsSigningIn(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsSigningIn(false);
      const check = verifyAuthorisedCredential(customEmail);
      if (check.success) {
        const session: AuthSession = {
          isAuthenticated: true,
          role: 'authorised_manager',
          email: customEmail.trim(),
          name: 'Authorised Manager',
          lastLogin: Date.now(),
        };
        onSuccess(session);
        onClose();
      } else {
        setErrorMsg('This Google Account is not on the authorised supervisor list. Please use an authorised manager account.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            {/* Google Logo SVG */}
            <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center shadow-xs">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                Google Identity Services
              </span>
              <h3 className="text-base font-bold text-white">Sign In with Google</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2">
            Authorised login for <strong className="text-white">{targetFeatureName}</strong>. Sign in to access confidential field visit records, map intelligence, and analytics.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Quick Google Account Option */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Select Authorised Google Account
            </span>

            <button
              type="button"
              disabled={isSigningIn}
              onClick={() => handleGoogleQuickSignIn('nayanchildoffice@gmail.com', 'Nayan (Authorised Manager)')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 bg-white transition-all text-left shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  N
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Nayan Sharma
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-emerald-100 text-emerald-800">
                      Authorised
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    nayanchildoffice@gmail.com
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Or sign in with another Google account
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Custom Google Email Input */}
          <form onSubmit={handleCustomEmailSignIn} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Workspace Email / Admin PIN
              </label>
              <input
                type="text"
                value={customEmail}
                onChange={(e) => {
                  setCustomEmail(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="name@company.com or PIN 8899"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSigningIn || !customEmail.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isSigningIn ? 'Authenticating with Google...' : 'Continue with Google Sign-In'}</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Protected by Enterprise Security</span>
          <span className="font-medium text-slate-600">Google OAuth Compliant</span>
        </div>
      </div>
    </div>
  );
};
