import React, { useState } from 'react';
import {
  MapPin,
  RefreshCw,
  Compass,
  Navigation,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Sparkles,
  SlidersHorizontal,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MapView } from './MapView.tsx';
import type { GPSLocation, GroundingResult } from '../types.ts';
import { formatGoogleMapsUrl, getLocationDisplayName } from '../utils/formAudit.ts';

interface GPSPanelProps {
  location: GPSLocation | null;
  grounding: GroundingResult | null;
  isLocating: boolean;
  isGrounding: boolean;
  onRefreshLocation: () => void;
  onManualCoordinateSet: (lat: number, lng: number) => void;
  onOpenTurnOnPrompt?: () => void;
  groundingError?: string | null;
}

export const GPSPanel: React.FC<GPSPanelProps> = ({
  location,
  grounding,
  isLocating,
  isGrounding,
  onRefreshLocation,
  onManualCoordinateSet,
  onOpenTurnOnPrompt,
  groundingError,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showManualInputs, setShowManualInputs] = useState(false);
  const [customLat, setCustomLat] = useState(location ? String(location.latitude) : '28.613939');
  const [customLng, setCustomLng] = useState(location ? String(location.longitude) : '77.209021');

  const locationName = getLocationDisplayName(grounding, location);
  const fullAddress = grounding?.verifiedAddress || (location ? 'Field Visit Location' : 'Location Not Set');
  const mapsUrl = location ? formatGoogleMapsUrl(location.latitude, location.longitude) : '#';

  const handleCopyLocation = () => {
    if (!location) return;
    navigator.clipboard?.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onManualCoordinateSet(lat, lng);
      setShowManualInputs(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Verified Location</h2>
            <p className="text-[11px] text-slate-500">Auto-recorded and certified for field audit</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowManualInputs(!showManualInputs)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="Adjust location pin manually"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">Set Pin</span>
          </button>

          <button
            type="button"
            onClick={onRefreshLocation}
            disabled={isLocating}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Refresh Location'}</span>
          </button>
        </div>
      </div>

      {/* Warning if location is turned off */}
      {!location && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-xs block">Device Location Is Turned Off</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Please turn on your location to certify client visits.
              </p>
              <button
                type="button"
                onClick={onOpenTurnOnPrompt || onRefreshLocation}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Turn On Location Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Pin Override Drawer */}
      {showManualInputs && (
        <form onSubmit={handleApplyCustomCoords} className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 text-blue-600" />
            <span>Adjust Location Pin</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowManualInputs(false)}
              className="px-2 py-0.5 text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-xs"
            >
              Update Location
            </button>
          </div>
        </form>
      )}

      {/* Interactive Map */}
      <div className="relative">
        {location ? (
          <MapView
            latitude={location.latitude}
            longitude={location.longitude}
            accuracy={location.accuracy}
            label={locationName}
            className="h-44 sm:h-52 w-full"
            onLocationSelect={(lat, lng) => {
              setCustomLat(String(lat));
              setCustomLng(String(lng));
              onManualCoordinateSet(lat, lng);
            }}
          />
        ) : (
          <div className="h-44 w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
            <MapPin className="h-8 w-8 animate-bounce text-slate-400" />
            <span className="text-xs">Turn on location to display map</span>
          </div>
        )}

        {/* Location Verification Tag */}
        {location && (
          <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200 shadow-xs flex items-center gap-1.5 text-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>GPS Verified Location (±{Math.round(location.accuracy)}m)</span>
          </div>
        )}
      </div>

      {/* Primary Location Name Showcase */}
      <div className="p-4 space-y-3">
        {location ? (
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="h-3 w-3 text-blue-600" />
                <span>Verified Location Name</span>
              </span>

              <button
                type="button"
                onClick={handleCopyLocation}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Name</span>
                  </>
                )}
              </button>
            </div>

            {/* PROMINENT LOCATION NAME */}
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {locationName}
            </h3>

            {/* FULL STREET ADDRESS */}
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {fullAddress}
            </p>

            {grounding?.landmark && (
              <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center gap-1.5 text-xs text-slate-700">
                <span className="font-semibold text-slate-500 text-[11px]">Landmark:</span>
                <span className="font-medium text-slate-900">{grounding.landmark}</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/70 text-[11px] text-slate-500">
              <span>Timestamp: {new Date(location.timestamp).toLocaleTimeString()}</span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
              >
                <span>Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Collapsible Technical Details (Coordinates only on demand) */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-500 hover:text-slate-800"
              >
                <span>Technical Audit Coordinates (IT Reference)</span>
                {showTechnicalDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {showTechnicalDetails && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600 flex justify-between">
                  <span>Lat: {location.latitude.toFixed(6)}°</span>
                  <span>Lng: {location.longitude.toFixed(6)}°</span>
                  <span>Accuracy: ±{Math.round(location.accuracy)}m</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            Location is currently off. Please enable device location to continue.
          </div>
        )}

        {/* Google Maps Grounding & Place Links */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Google Maps & Location Verification</span>
            </div>
            {isGrounding ? (
              <span className="text-[10px] text-indigo-600 animate-pulse font-medium">
                Verifying location name...
              </span>
            ) : grounding?.verifiedAddress ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                <span>Verified</span>
              </span>
            ) : null}
          </div>

          {grounding?.places && grounding.places.length > 0 ? (
            <div>
              <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                Verified Nearby Places:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {grounding.places.map((place, idx) => (
                  <a
                    key={idx}
                    href={place.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-700 shadow-2xs transition-colors"
                  >
                    <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                    <span className="truncate max-w-[210px]">{place.title}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          ) : isGrounding ? (
            <p className="text-xs text-slate-500 italic">
              Identifying location name via Google Maps data...
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Google Maps verified location will be stamped onto your scheduled visit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
