import React from 'react';
import { MapPin, Navigation, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface LocationEnforcementModalProps {
  isOpen: boolean;
  onRetryLocation: () => void;
  isLocating: boolean;
  error?: string | null;
  onDismiss?: () => void;
}

export const LocationEnforcementModal: React.FC<LocationEnforcementModalProps> = ({
  isOpen,
  onRetryLocation,
  isLocating,
  error,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Notice Header */}
        <div className="p-6 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white relative">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center mb-3 text-white shadow-inner">
            <MapPin className="h-6 w-6 animate-pulse" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 inline-block mb-1">
            Mandatory Requirement
          </span>

          <h3 className="text-xl font-bold tracking-tight">Please Turn On Location</h3>
          <p className="text-xs text-amber-100 mt-1 leading-relaxed">
            Company field protocol requires automatic location verification to record and certify client visits.
          </p>
        </div>

        {/* Content & Steps */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Device Location is Currently Inactive</span>
                <span className="text-[11px] text-amber-800">
                  {error || 'Your browser has not received a location signal or permission is pending.'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
              How to enable location:
            </span>
            <div className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span>
                Tap <strong>"Allow Location / Turn On GPS"</strong> below when prompted by your browser.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span>
                If blocked, tap the <strong>site permissions / lock icon</strong> in the address bar and select <strong>"Allow Location"</strong>.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <span>
                Ensure your device's <strong>System Location / GPS toggle</strong> is turned on in device settings.
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onRetryLocation}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring Location Signal...' : 'Turn On Location / Authorize GPS'}</span>
            </button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Continue in Manual Pin Mode
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Certified by Google Maps Grounding &bull; Real-time Field Verification
        </div>
      </div>
    </div>
  );
};
