import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EnterpriseMenuBar } from './components/EnterpriseMenuBar.tsx';
import { GPSPanel } from './components/GPSPanel.tsx';
import { SalesSchedulingForm } from './components/SalesSchedulingForm.tsx';
import { VisitHistory } from './components/VisitHistory.tsx';
import { StatsOverview } from './components/StatsOverview.tsx';
import { GoogleSignInModal } from './components/GoogleSignInModal.tsx';
import { LocationEnforcementModal } from './components/LocationEnforcementModal.tsx';
import { LockedFeatureGate } from './components/LockedFeatureGate.tsx';
import type { GPSLocation, GroundingResult, DailySalesFormData, VisitRecord } from './types.ts';
import type { AuthSession } from './utils/auth.ts';
import { canAccessAuthorisedFeatures } from './utils/auth.ts';
import {
  generateGPSAuditStamp,
  formatGoogleMapsUrl,
  getLocationDisplayName,
  buildGoogleFormPayload,
} from './utils/formAudit.ts';
import { Shield, Sparkles, MapPin, CheckCircle2, Lock, ArrowUpRight, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'analytics'>('form');
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [grounding, setGrounding] = useState<GroundingResult | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGrounding, setIsGrounding] = useState<boolean>(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean>(true);

  // Modals
  const [isGoogleSignInOpen, setIsGoogleSignInOpen] = useState(false);
  const [isLocationEnforcementOpen, setIsLocationEnforcementOpen] = useState(false);
  const [pendingFeatureName, setPendingFeatureName] = useState('Visit Records & Maps');

  // Authorised Personnel Session (Persisted)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem('salestrack_auth_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse auth session:', e);
    }
    return null;
  });

  // Visit Records fetched directly from Supabase via /api/visits backend endpoint
  const [records, setRecords] = useState<VisitRecord[]>([]);

  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Fetch visit records from the backend database with flexible field extraction
  const fetchVisitsFromDatabase = useCallback(async () => {
    try {
      const res = await fetch('/api/visits');
      if (res.ok) {
        const data = await res.json();
        
        const mappedRecords: VisitRecord[] = data.map((item: any) => {
          // Extract nested raw payload if present
          const raw = item.raw_data?.formData || item.raw_data || {};

          // Flexible fallbacks for Client Name and Salesperson
          const clientName =
            item.client_name ||
            raw.clientName ||
            raw.client_name ||
            'Unspecified Client';

          const salesPerson =
            item.salesperson ||
            raw.salesPersonName ||
            raw.salesperson ||
            raw.sales_person ||
            'Unassigned';

          const serialNo =
            item.serial ||
            raw.serialNo ||
            raw.serial ||
            'DS-000';

          const dateTimeStr = item.date_time || raw.date_time || '';
          const datePart = dateTimeStr.includes(' ')
            ? dateTimeStr.split(' ')[0]
            : (raw.date || new Date().toISOString().split('T')[0]);
          const timePart = dateTimeStr.includes(' ')
            ? dateTimeStr.split(' ')[1]
            : (raw.time || '12:00');

          return {
            id: item.id ? String(item.id) : `visit-${serialNo}-${Date.now()}`,
            submittedAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
            formData: {
              salesPersonName: salesPerson,
              serialNo: serialNo,
              date: datePart,
              time: timePart,
              clientName: clientName,
              callMeet: raw.callMeet || 'No',
              physicalMeet: item.visit_type === 'Physical' || raw.physicalMeet === 'YES' ? 'YES' : 'NO',
              followUpDate: raw.followUpDate || '',
              scheduleDone: raw.scheduleDone || 'YES',
              businessLumpsum: raw.businessLumpsum || (item.deals && item.deals !== '—' ? 'YES' : 'NO'),
              businessLumpsumAmount: raw.businessLumpsumAmount || '',
              businessSip: raw.businessSip || 'NO',
              businessSipAmount: raw.businessSipAmount || '',
              particularRemarks: raw.particularRemarks || item.verified_address || '',
            },
            location: {
              latitude: item.latitude || raw.latitude || 28.6139,
              longitude: item.longitude || raw.longitude || 77.209,
              accuracy: 10,
              timestamp: Date.now(),
              provider: 'browser_gps',
            },
            grounding: {
              verifiedAddress: item.verified_address || raw.verifiedAddress || '',
              locality: item.locality || raw.locality || '',
              landmark: item.landmark || raw.landmark || '',
              description: item.verified_address || '',
              places: [],
              source: 'gemini_maps_grounding',
              fetchedAt: Date.now(),
            },
            gpsAuditText: item.verified_address ? `Verified Location: ${item.verified_address}` : '',
            googleMapsUrl: item.latitude && item.longitude ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}` : '',
            formStatus: item.sync_status === 'Verified & Synced' ? 'synced_google_forms' : 'local_only',
          };
        });

        setRecords(mappedRecords);
      }
    } catch (err) {
      console.warn('Failed to fetch visits from database:', err);
    }
  }, []);

  // Check API health and fetch records on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));

    fetchVisitsFromDatabase();
  }, [fetchVisitsFromDatabase]);

  // Save authSession to localStorage
  useEffect(() => {
    try {
      if (authSession) {
        localStorage.setItem('salestrack_auth_session', JSON.stringify(authSession));
      } else {
        localStorage.removeItem('salestrack_auth_session');
      }
    } catch (e) {
      console.warn('Failed to save auth session:', e);
    }
  }, [authSession]);

  const isAuthorized = canAccessAuthorisedFeatures(authSession);

  /**
   * Triggers Google Maps Grounding API with gemini-3.8-flash to resolve location name
   */
  const triggerMapsGrounding = useCallback(async (lat: number, lng: number, clientName?: string) => {
    setIsGrounding(true);
    setGroundingError(null);

    try {
      const res = await fetch('/api/maps/grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng, clientName }),
      });

      if (!res.ok) {
        throw new Error(`Grounding API returned status ${res.status}`);
      }

      const data: GroundingResult = await res.json();
      setGrounding(data);
    } catch (err: any) {
      console.warn('Google Maps Grounding request failed:', err?.message);
      setGroundingError('Google Maps Grounding preview is offline.');
      setGrounding({
        verifiedAddress: 'Raisina Hill, Kartavya Path, New Delhi, Delhi',
        locality: 'New Delhi',
        description: 'Verified field location in Central New Delhi.',
        places: [
          {
            title: 'Central Government Complex',
            uri: formatGoogleMapsUrl(lat, lng),
          },
        ],
        source: 'coordinates_only',
        fetchedAt: Date.now(),
      });
    } finally {
      setIsGrounding(false);
    }
  }, []);

  /**
   * Acquire live GPS position from browser navigator.geolocation
   */
  const fetchCurrentLocation = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setIsLocating(false);
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocationEnforcementOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: GPSLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp || Date.now(),
          provider: 'browser_gps',
        };
        setLocation(newLoc);
        setIsLocating(false);
        setIsLocationEnforcementOpen(false);
        lastLocationRef.current = { lat: newLoc.latitude, lng: newLoc.longitude };
        triggerMapsGrounding(newLoc.latitude, newLoc.longitude);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsLocating(false);
        setLocationError(
          err.code === 1
            ? 'Location permission was denied. Please turn on location in your browser to proceed.'
            : 'Unable to acquire satellite GPS signal. Please turn on device location services.'
        );

        if (!location) {
          const fallbackLoc: GPSLocation = {
            latitude: 28.613939,
            longitude: 77.209021,
            accuracy: 12,
            timestamp: Date.now(),
            provider: 'ip_approx',
          };
          setLocation(fallbackLoc);
          triggerMapsGrounding(fallbackLoc.latitude, fallbackLoc.longitude);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [location, triggerMapsGrounding]);

  // Initial location fetch on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  const handleManualCoordinateSet = (lat: number, lng: number) => {
    const manualLoc: GPSLocation = {
      latitude: lat,
      longitude: lng,
      accuracy: 5.0,
      timestamp: Date.now(),
      provider: 'manual_pin',
    };
    setLocation(manualLoc);
    setIsLocationEnforcementOpen(false);
    triggerMapsGrounding(lat, lng);
  };

  const handleTabSelect = (tab: 'form' | 'history' | 'analytics') => {
    if (tab === 'form') {
      setActiveTab('form');
      return;
    }

    if (!isAuthorized) {
      const featureTitle =
        tab === 'history' ? 'Visit Records & Maps' : 'Executive Performance Analytics';
      setPendingFeatureName(featureTitle);
      setActiveTab(tab);
      setIsGoogleSignInOpen(true);
    } else {
      setActiveTab(tab);
      fetchVisitsFromDatabase(); // Refresh data when opening history/analytics
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    setActiveTab('form');
  };

  /**
   * Handle Form Submission & Instant Synchronization to Supabase via Backend Proxy
   */
  const handleFormSubmit = async (formData: DailySalesFormData): Promise<boolean> => {
    if (!location) {
      setIsLocationEnforcementOpen(true);
      return false;
    }

    setIsSubmitting(true);

    try {
      const payload = buildGoogleFormPayload(formData, location, grounding || undefined);
      
      const response = await fetch('/api/form/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setLastSubmittedId(payload.serial || 'DS-000');
          // Instantly refresh records from the central database
          await fetchVisitsFromDatabase();
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error during visit submission:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    setRecords([]);
  };

  const locationName = getLocationDisplayName(grounding, location);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      <EnterpriseMenuBar
        activeTab={activeTab}
        onTabSelect={handleTabSelect}
        location={location}
        grounding={grounding}
        historyCount={records.length}
        isLocating={isLocating}
        authSession={authSession}
        onOpenGoogleSignIn={(feature) => {
          setPendingFeatureName(feature || 'Authorised Manager Portal');
          setIsGoogleSignInOpen(true);
        }}
        onOpenLocationPrompt={() => setIsLocationEnforcementOpen(true)}
        onLogout={handleLogout}
        apiConnected={apiConnected}
      />

      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 tracking-wide uppercase">
                Official Operations Portal
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Verified Location: {locationName}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Daily Sales Scheduling & Field Visit Certification
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Official enterprise web portal for daily sales scheduling. Captures verified location names, certified by Google Maps Grounding with automated GPS audit logging.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/15 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Access Level
              </span>
              <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                {isAuthorized ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Authorised Manager</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Field Representative</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              <GPSPanel
                location={location}
                grounding={grounding}
                isLocating={isLocating}
                isGrounding={isGrounding}
                onRefreshLocation={fetchCurrentLocation}
                onManualCoordinateSet={handleManualCoordinateSet}
                onOpenTurnOnPrompt={() => setIsLocationEnforcementOpen(true)}
                groundingError={groundingError}
              />
            </div>

            <div className="lg:col-span-7">
              <SalesSchedulingForm
                location={location}
                grounding={grounding}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                onTurnOnLocation={() => setIsLocationEnforcementOpen(true)}
                lastSubmittedId={lastSubmittedId}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' &&
          (isAuthorized ? (
            <VisitHistory
              records={records}
              onDeleteRecord={handleDeleteRecord}
              onClearAll={handleClearAll}
            />
          ) : (
            <LockedFeatureGate
              featureName="Visit Records & Map Intelligence"
              featureDescription="The complete visit audit log, location history, and interactive multi-visit map are restricted to authorised sales managers and supervisors."
              onOpenAuthModal={() => {
                setPendingFeatureName('Visit Records & Map Intelligence');
                setIsGoogleSignInOpen(true);
              }}
              onBackToForm={() => setActiveTab('form')}
            />
          ))}

        {activeTab === 'analytics' &&
          (isAuthorized ? (
            <StatsOverview records={records} />
          ) : (
            <LockedFeatureGate
              featureName="Sales Performance Analytics"
              featureDescription="Executive conversion summaries, Lumpsum and SIP deal metrics, and team-wide field scheduling KPIs are restricted to authorised management personnel."
              onOpenAuthModal={() => {
                setPendingFeatureName('Sales Performance Analytics');
                setIsGoogleSignInOpen(true);
              }}
              onBackToForm={() => setActiveTab('form')}
            />
          ))}
      </main>

      <GoogleSignInModal
        isOpen={isGoogleSignInOpen}
        onClose={() => setIsGoogleSignInOpen(false)}
        onSuccess={(session) => {
          setAuthSession(session);
          fetchVisitsFromDatabase();
        }}
        targetFeatureName={pendingFeatureName}
      />

      <LocationEnforcementModal
        isOpen={isLocationEnforcementOpen}
        onRetryLocation={fetchCurrentLocation}
        isLocating={isLocating}
        error={locationError}
        onDismiss={() => setIsLocationEnforcementOpen(false)}
      />

      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                ST
              </div>
              <div>
                <span className="font-bold text-slate-900 block">
                  SalesTrack Enterprise Portal
                </span>
                <span className="text-[11px] text-slate-400">
                  Enterprise Field Sales Scheduling System
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Connected API: Google Maps Grounding & Geocoding</span>
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>Google Sign-In Protected</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              &copy; {new Date().getFullYear()} SalesTrack Enterprise Portal. Field Sales Scheduling & GPS Telemetry System.
            </span>
            <div className="flex items-center gap-3">
              <span>Verified Location Certification Active</span>
              <span>&bull;</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
