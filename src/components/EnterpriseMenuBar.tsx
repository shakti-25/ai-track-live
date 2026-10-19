import React from 'react';
import {
  MapPin,
  ExternalLink,
  CalendarCheck,
  BarChart3,
  Lock,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Building2,
  Globe2,
  Cpu,
} from 'lucide-react';
import { getLocationDisplayName } from '../utils/formAudit.ts';
import type { GPSLocation, GroundingResult } from '../types.ts';
import type { AuthSession } from '../utils/auth.ts';

interface EnterpriseMenuBarProps {
  activeTab: 'form' | 'history' | 'analytics';
  onTabSelect: (tab: 'form' | 'history' | 'analytics') => void;
  location: GPSLocation | null;
  grounding: GroundingResult | null;
  historyCount: number;
  isLocating: boolean;
  authSession: AuthSession | null;
  onOpenGoogleSignIn: (featureName?: string) => void;
  onOpenLocationPrompt: () => void;
  onLogout: () => void;
  apiConnected: boolean;
}

export const EnterpriseMenuBar: React.FC<EnterpriseMenuBarProps> = ({
  activeTab,
  onTabSelect,
  location,
  grounding,
  historyCount,
  isLocating,
  authSession,
  onOpenGoogleSignIn,
  onOpenLocationPrompt,
  onLogout,
  apiConnected,
}) => {
  const isManager = authSession?.isAuthenticated && authSession.role === 'authorised_manager';
  const locationName = getLocationDisplayName(grounding, location);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Formal Corporate Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Brand & Entity Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  SalesTrack <span className="text-blue-400 font-normal">Enterprise</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Daily Sales Scheduling
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Field Operations Web Portal &bull; Google Maps Grounding &bull; Cloud Audit Sync
              </p>
            </div>
          </div>

          {/* Center/Right Status Badges */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* API Status Pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300">
              <Cpu className="h-3.5 w-3.5 text-blue-400" />
              <span
                className={`h-2 w-2 rounded-full ${
                  apiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
              <span>
                {apiConnected ? 'API: Connected & Verified' : 'API: Connecting...'}
              </span>
            </div>

            {/* Location Status Pill: ALWAYS SHOWS LOCATION NAME, NOT COORDINATES */}
            {location ? (
              <button
                onClick={onOpenLocationPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors shadow-xs"
                title={`Verified Location: ${locationName}`}
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold truncate max-w-[170px] sm:max-w-[240px]">
                  {locationName}
                </span>
                <span className="text-[10px] text-emerald-400/70 hidden sm:inline">
                  (±{Math.round(location.accuracy)}m)
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenLocationPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-xs font-semibold animate-pulse transition-colors"
                title="Location is off. Click to turn on location."
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Turn On Location</span>
              </button>
            )}

            {/* Google Sign In / User Profile */}
            {isManager ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-700">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center justify-center border border-white/20 shadow-xs">
                  {authSession?.name ? authSession.name[0] : 'M'}
                </div>
                <div className="hidden md:block text-left text-[11px]">
                  <span className="font-bold text-white block truncate max-w-[130px]">
                    {authSession?.email?.split('@')[0] || 'Manager'}
                  </span>
                  <span className="text-emerald-400 text-[10px]">Authorised</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Sign out / Lock manager access"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* Official Google Sign-In Button */
              <button
                onClick={() => onOpenGoogleSignIn('Manager Portal')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-md cursor-pointer border border-slate-200"
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
                <span className="hidden sm:inline">Sign In with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Formal Secondary Menu Navigation Bar */}
        <div className="flex items-center justify-between border-t border-slate-800/80 py-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2 whitespace-nowrap">
            {/* Menu 1: Field Visit Entry */}
            <button
              onClick={() => onTabSelect('form')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>Field Visit Entry</span>
            </button>

            {/* Menu 2: Visit Records & Maps (Restricted to Authorised) */}
            <button
              onClick={() => onTabSelect('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Visit Records & Maps</span>
              {isManager ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-blue-300 font-mono">
                  {historyCount}
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Lock className="h-2 w-2" />
                  <span>Authorised</span>
                </span>
              )}
            </button>

            {/* Menu 3: Sales Performance Dashboard (Restricted to Authorised) */}
            <button
              onClick={() => onTabSelect('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Performance Analytics</span>
              {!isManager && (
                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Lock className="h-2 w-2" />
                  <span>Authorised</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
