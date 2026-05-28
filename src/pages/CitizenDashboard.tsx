import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';
import { stations } from '@/data/stations';
import { motion } from 'framer-motion';
import {
  User, FileText, MapPin, Phone, Shield, LogOut, Plus,
  Clock, CheckCircle2, AlertCircle, Search, Navigation,
  ChevronRight, Bell, Home, RefreshCw, Smartphone, Globe,
  Calendar, UserX, Lock, Heart
} from 'lucide-react';
import { toast } from 'sonner';

const API = '/api';

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getNearestStations(lat: number, lng: number, n = 3) {
  return [...stations]
    .map(s => ({ ...s, distance: haversine(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n);
}

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  'Pending':       { color: '#F59E0B', bg: '#FEF3C7', icon: Clock,        label: 'Pending' },
  'Investigating': { color: '#3B82F6', bg: '#EFF6FF', icon: Search,       label: 'Investigating' },
  'ChargeSheeted': { color: '#10B981', bg: '#ECFDF5', icon: CheckCircle2, label: 'Charge Sheeted' },
  'Closed':        { color: '#6B7280', bg: '#F9FAFB', icon: CheckCircle2, label: 'Closed' },
  'Referred':      { color: '#8B5CF6', bg: '#F5F3FF', icon: AlertCircle,  label: 'Referred' },
};

const SERVICES = [
  { icon: FileText,  label: 'File FIR',          labelKn: 'ದೂರು ದಾಖಲಿಸಿ',        to: '/file-fir?type=fir' },
  { icon: Smartphone,label: 'e-Lost Report',      labelKn: 'e-ಲೋಸ್ಟ್ ವರದಿ',        to: '/file-fir?type=elost' },
  { icon: Globe,     label: 'Cyber Crime',        labelKn: 'ಸೈಬರ್ ಅಪರಾಧ',          to: '/file-fir?type=cyber' },
  { icon: Home,      label: 'Tenant Verify',      labelKn: 'ಕಿರಾಯಿದಾರ ಪರಿಶೀಲನೆ',   to: '/file-fir?type=tenant' },
  { icon: Heart,     label: 'Senior Citizen',     labelKn: 'ಹಿರಿಯ ನಾಗರಿಕ',          to: '/file-fir?type=senior' },
  { icon: Calendar,  label: 'Event Permission',   labelKn: 'ಕಾರ್ಯಕ್ರಮ ಅನುಮತಿ',      to: '/file-fir?type=event' },
  { icon: UserX,     label: 'Missing Person',     labelKn: 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿ',        to: '/file-fir?type=missing' },
  { icon: Lock,      label: 'NOC / Passport',     labelKn: 'NOC / ಪಾಸ್‌ಪೋರ್ಟ್',      to: '/file-fir?type=passport' },
];

type NearbyStation = ReturnType<typeof getNearestStations>[0];

export default function CitizenDashboard() {
  const { user, logout } = useAuthStore();
  const { lang } = useI18nStore();
  const navigate = useNavigate();
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;

  const [complaints, setComplaints] = useState<Record<string, string>[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [nearbyStations, setNearbyStations] = useState<NearbyStation[]>([]);
  const [locationStatus, setLocationStatus] = useState<'idle'|'loading'|'done'|'error'>('idle');
  const [userLocation, setUserLocation] = useState<{lat:number;lng:number;name:string}|null>(null);
  const [activeTab, setActiveTab] = useState<'complaints'|'stations'|'services'>('complaints');
  const [sosSending, setSosSending] = useState(false);
  const [sosAlert, setSosAlert] = useState<{sent: boolean; station?: string; officer?: string} | null>(null);

  const handleSOS = async () => {
    if (!window.confirm('🚨 Send SOS Emergency Alert?\n\nThis will alert the nearest police station with your location. Use only in genuine emergencies.')) return;
    setSosSending(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      const res = await fetch('/api?action=sos_alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          user_name: user.name,
          user_phone: user.phone || '',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_description: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        })
      });
      const json = await res.json();
      if (json.success) {
        setSosAlert({ sent: true, station: json.data.nearest_station?.name, officer: json.data.beat_officer?.assigned_officer_phone });
        toast.success('🚨 SOS Alert sent! Help is on the way.');
      }
    } catch {
      // Send without location
      await fetch('/api?action=sos_alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.user_id, user_name: user.name, user_phone: user.phone || '' }) });
      setSosAlert({ sent: true });
      toast.success('🚨 SOS Alert sent!');
    }
    setSosSending(false);
  };

  // Load complaints from API + localStorage
  const loadComplaints = useCallback(async () => {
    if (!user) return;
    setLoadingComplaints(true);
    const result: Record<string, string>[] = [];

    // 1. From XAMPP DB
    try {
      const res = await fetch(`${API}?action=citizen_complaints&email=${encodeURIComponent(user.email)}&user_id=${encodeURIComponent(user.user_id || '')}`, { signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) result.push(...json.data);
    } catch { /* offline */ }

    // 2. From localStorage (offline submissions — only this user's)
    try {
      const stored = localStorage.getItem('sk_submitted_refs');
      if (stored) {
        const refs = JSON.parse(stored) as Record<string, Record<string, string>>;
        Object.entries(refs).forEach(([ref, data]) => {
          // Only show complaints filed by this user (match by email or user_id)
          const filedBy = data.filed_by_email || data.created_by || '';
          const isOwner = filedBy === user.email || filedBy === user.user_id;
          // Avoid duplicates with DB results
          const alreadyInDB = result.find(r => r.fir_number === ref);
          if (isOwner && !alreadyInDB) {
            result.push({ fir_number: ref, ...data });
          }
        });
      }
    } catch { /* */ }

    setComplaints(result);
    setLoadingComplaints(false);
  }, [user]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setUserLocation({ lat, lng, name: 'Your Location' });
          setNearbyStations(getNearestStations(lat, lng, 5));
          setLocationStatus('done');
        },
        () => {
          // Default to Kolar
          setNearbyStations(getNearestStations(13.1357, 78.1324, 5));
          setLocationStatus('error');
        },
        { timeout: 8000 }
      );
    } else {
      setNearbyStations(getNearestStations(13.1357, 78.1324, 5));
      setLocationStatus('error');
    }
  }, []);

  const refreshLocation = () => {
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng, name: 'Your Location' });
        setNearbyStations(getNearestStations(lat, lng, 5));
        setLocationStatus('done');
        toast.success('Location updated!');
      },
      () => { setLocationStatus('error'); toast.error('Could not get location'); },
      { timeout: 8000 }
    );
  };

  if (!user) { navigate('/login'); return null; }

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const activeCount  = complaints.filter(c => c.status === 'Investigating').length;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Top Bar */}
      <div className="bg-[#081428] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F0C75E] flex items-center justify-center text-[#081428] font-bold text-lg rounded-full">
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[#F5F5F0] font-semibold text-sm">{user.name}</p>
              <p className="text-gray-400 text-xs">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/file-fir" className="flex items-center gap-1.5 px-3 py-2 bg-[#A8362A] text-white text-xs uppercase tracking-wider hover:bg-[#8B2D22] transition-colors">
              <Plus size={12} /> {L('File Complaint','ದೂರು')}
            </Link>
            <button onClick={handleSOS} disabled={sosSending}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs uppercase tracking-wider hover:bg-red-700 transition-colors animate-pulse disabled:opacity-50 disabled:animate-none">
              🚨 {sosSending ? 'Sending...' : 'SOS'}
            </button>
            <button onClick={() => { logout(); navigate('/'); }} className="text-gray-400 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: L('Total Filed','ಒಟ್ಟು'), value: complaints.length, color: '#081428' },
            { label: L('Pending','ಬಾಕಿ'), value: pendingCount, color: '#F59E0B' },
            { label: L('Active','ಸಕ್ರಿಯ'), value: activeCount, color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#e5e7eb] p-3 text-center" style={{ borderTopColor: s.color, borderTopWidth: 3 }}>
              <p className="text-2xl font-bold text-[#081428]">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* SOS Alert Banner */}
        {sosAlert?.sent && (
          <div className="mb-4 bg-red-900 border border-red-500 p-3 flex items-center justify-between">
            <div>
              <p className="text-red-200 text-xs font-bold uppercase tracking-wider">🚨 SOS Alert Sent</p>
              {sosAlert.station && <p className="text-red-300 text-xs mt-0.5">Nearest station: {sosAlert.station}</p>}
              {sosAlert.officer && <p className="text-red-300 text-xs">Beat officer: <a href={`tel:${sosAlert.officer}`} className="underline">{sosAlert.officer}</a></p>}
              <p className="text-red-400 text-xs mt-0.5">Emergency: <a href="tel:112" className="underline font-bold">Call 112</a></p>
            </div>
            <button onClick={() => setSosAlert(null)} className="text-red-400 hover:text-white text-xl">×</button>
          </div>
        )}

        {/* Location banner */}
        <div className={`mb-4 flex items-center gap-3 p-3 border text-sm ${locationStatus === 'done' ? 'bg-green-50 border-green-200 text-green-800' : locationStatus === 'loading' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          <Navigation size={16} className={locationStatus === 'loading' ? 'animate-spin' : ''} />
          <span className="flex-1 text-xs">
            {locationStatus === 'done' && userLocation ? `📍 Location detected — showing nearby stations` :
             locationStatus === 'loading' ? 'Detecting your location...' :
             'Location not available — showing Kolar stations by default'}
          </span>
          {locationStatus !== 'loading' && (
            <button onClick={refreshLocation} className="text-xs underline flex items-center gap-1">
              <RefreshCw size={10} /> Refresh
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e5e7eb] mb-5">
          {[
            { key:'complaints', label: L('My Complaints','ನನ್ನ ದೂರುಗಳು') },
            { key:'stations',   label: L('Nearby Stations','ಹತ್ತಿರದ ಠಾಣೆಗಳು') },
            { key:'services',   label: L('Services','ಸೇವೆಗಳು') },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`px-4 py-2.5 text-xs uppercase tracking-wider font-medium transition-colors border-b-2 ${activeTab === t.key ? 'border-[#A8362A] text-[#A8362A]' : 'border-transparent text-gray-500 hover:text-[#081428]'}`}>
              {t.label}
              {t.key === 'complaints' && complaints.length > 0 && (
                <span className="ml-1.5 bg-[#081428] text-white text-[0.55rem] px-1.5 py-0.5 rounded-full">{complaints.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: My Complaints */}
        {activeTab === 'complaints' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{complaints.length} complaint{complaints.length !== 1 ? 's' : ''} filed</p>
              <button onClick={loadComplaints} className="text-xs text-[#081428] flex items-center gap-1 hover:underline">
                <RefreshCw size={10} className={loadingComplaints ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loadingComplaints && (
              <div className="text-center py-8 text-gray-400 text-sm flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Loading complaints...
              </div>
            )}

            {!loadingComplaints && complaints.length === 0 && (
              <div className="bg-white border border-[#e5e7eb] p-8 text-center">
                <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{L('No complaints filed yet','ಇನ್ನೂ ದೂರು ದಾಖಲಾಗಿಲ್ಲ')}</p>
                <Link to="/file-fir" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#A8362A] text-white text-xs uppercase tracking-wider hover:bg-[#8B2D22] transition-colors">
                  <Plus size={12} /> {L('File Your First Complaint','ಮೊದಲ ದೂರು ದಾಖಲಿಸಿ')}
                </Link>
              </div>
            )}

            {complaints.map((c, i) => {
              const sc = statusConfig[c.status] || statusConfig['Pending'];
              const StatusIcon = sc.icon;
              return (
                <motion.div key={c.fir_id || c.fir_number || i}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white border border-[#e5e7eb] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-[#A8362A] font-bold mb-0.5">{c.fir_number}</p>
                      <p className="text-[#081428] text-sm font-medium truncate">{c.crime_category} — {c.sub_category}</p>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[0.6rem] font-semibold whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.color }}>
                      <StatusIcon size={10} /> {sc.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    {c.incident_date && <span>📅 {c.incident_date}</span>}
                    {c.incident_place && <span>📍 {String(c.incident_place).substring(0, 30)}</span>}
                    {c.station_name && <span>🏛 {c.station_name}</span>}
                    {c.created_at && <span>🕐 Filed: {new Date(c.created_at).toLocaleDateString('en-IN')}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/track?ref=${c.fir_number}`}
                      className="flex-1 text-center py-1.5 text-xs border border-[#081428] text-[#081428] hover:bg-[#081428] hover:text-white transition-colors uppercase tracking-wider">
                      Track Status
                    </Link>
                    {c.station_phone && (
                      <a href={`tel:${c.station_phone}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors">
                        <Phone size={10} /> Call Station
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* TAB: Nearby Stations */}
        {activeTab === 'stations' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">
                {locationStatus === 'done' ? 'Stations nearest to your location' : 'Stations near Kolar (default)'}
              </p>
              <button onClick={refreshLocation} className="text-xs text-[#A8362A] flex items-center gap-1 hover:underline">
                <Navigation size={10} /> {L('Update Location','ಸ್ಥಳ ನವೀಕರಿಸಿ')}
              </button>
            </div>
            {nearbyStations.map((s, i) => (
              <motion.div key={s.station_id}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
                className="bg-white border border-[#e5e7eb] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {i === 0 && <span className="text-[0.55rem] bg-[#A8362A] text-white px-1.5 py-0.5 font-semibold">NEAREST</span>}
                      <h3 className="text-sm font-semibold text-[#081428]">{s.name} Police Station</h3>
                    </div>
                    <p className="text-xs text-gray-500">{s.district} · {s.taluk}</p>
                  </div>
                  <span className="text-xs font-mono text-[#A8362A] font-bold whitespace-nowrap">{s.distance.toFixed(1)} km</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{s.address} · {s.pincode}</p>
                <div className="flex gap-2 flex-wrap">
                  <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs hover:bg-green-600 hover:text-white transition-colors">
                    <Phone size={10} /> {s.phone}
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs hover:bg-blue-600 hover:text-white transition-colors">
                    <MapPin size={10} /> Directions
                  </a>
                  <Link to={`/file-fir?station=${s.station_id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1E36] text-[#F0C75E] text-xs hover:bg-[#081428] transition-colors">
                    <FileText size={10} /> File Here
                  </Link>
                </div>
              </motion.div>
            ))}

            {/* Helplines */}
            <div className="bg-[#081428] p-4 mt-4">
              <p className="text-[#F0C75E] text-xs font-semibold uppercase tracking-wider mb-3">Emergency Helplines</p>
              <div className="grid grid-cols-2 gap-2">
                {[['112','Emergency / ERSS'],['1930','Cyber Crime'],['1091','Women Safety'],['1098','Child Helpline'],['100','Police Control'],['108','Ambulance']].map(([num, label]) => (
                  <a key={num} href={`tel:${num}`} className="flex items-center justify-between bg-[#0F1E36] border border-[#2A3244] px-3 py-2 hover:border-[#F0C75E] transition-colors">
                    <span className="text-[#F0C75E] font-bold text-sm">{num}</span>
                    <span className="text-gray-400 text-[0.6rem]">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Services */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map(s => (
              <Link key={s.to} to={s.to}
                className="bg-white border border-[#e5e7eb] p-4 flex flex-col items-center gap-2 text-center hover:border-[#A8362A] hover:shadow-sm transition-all group">
                <div className="w-10 h-10 bg-[#F5F5F0] group-hover:bg-[#A8362A] flex items-center justify-center transition-colors rounded-full">
                  <s.icon size={18} className="text-[#081428] group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs font-medium text-[#081428] leading-tight">
                  {lang === 'kn' ? s.labelKn : s.label}
                </span>
                <ChevronRight size={12} className="text-gray-400 group-hover:text-[#A8362A] transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
