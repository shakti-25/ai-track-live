import React from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LockedFeatureGateProps {
  featureName: string;
  featureDescription: string;
  onOpenAuthModal: () => void;
  onBackToForm: () => void;
}

export const LockedFeatureGate: React.FC<LockedFeatureGateProps> = ({
  featureName,
  featureDescription,
  onOpenAuthModal,
  onBackToForm,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden my-6">
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <div className="h-16 w-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Lock className="h-8 w-8" />
        </div>

        <span className="text-xs font-bold tracking-widest uppercase bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
          Restricted Corporate Area
        </span>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          {featureName} Access Restricted
        </h2>

        <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto">
          {featureDescription}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onBackToForm}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Field Visit Entry</span>
          </button>

          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer border border-slate-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            <span>Sign In with Google to Unlock</span>
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              Field Sales Representatives
            </span>
            <p className="text-[11px] text-slate-500">
              Submit your daily sales visit schedules freely without logging in. Your GPS coordinates are recorded automatically with each submission.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-xs font-bold text-blue-900 block mb-1">
              Authorised Managers & Supervisors
            </span>
            <p className="text-[11px] text-blue-700">
              Authorized personnel (e.g. <span className="font-mono font-semibold">nayanchildoffice@gmail.com</span> or PIN <span className="font-mono font-semibold">8899</span>) can sign in to view complete visit coordinates, GPS maps, and performance KPIs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
