import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18nStore } from '@/store/i18nStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle2, AlertCircle, FileText, User, MapPin, Phone, Shield, RefreshCw, Smartphone, Home, Calendar, UserX, Heart, Lock } from 'lucide-react';

const API = '/api';

async function fetchComplaintStatus(number: string) {
  const clean = number.trim().toUpperCase();

  // 1. Always try DB first
  try {
    const res = await fetch(`${API}?action=fir_by_number&number=${encodeURIComponent(clean)}`,
      { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // Sync latest status back to localStorage
        try {
          const stored = localStorage.getItem('sk_submitted_refs');
          if (stored) {
            const refs = JSON.parse(stored);
            if (refs[clean]) {
              refs[clean].status = json.data.status;
              localStorage.setItem('sk_submitted_refs', JSON.stringify(refs));
            }
          }
        } catch { /* */ }
        return { source: 'db', data: json.data };
      }
    }
  } catch { /* offline */ }

  // 2. localStorage fallback
  try {
    const stored = localStorage.getItem('sk_submitted_refs');
    if (stored) {
      const refs: Record<string, Record<string,string>> = JSON.parse(stored);
      if (refs[clean]) {
        const d = refs[clean];
        return { source: 'local', data: {
          fir_number: clean,
          complainant_name: d.complainant_name || d.missing_name || d.applicant_name || '',
          complainant_phone: d.complainant_phone || d.reporter_phone || d.applicant_phone || '',
          crime_category: d.crime_category || '',
          sub_category: d.sub_category || d.article_type || d.event_type || '',
          incident_date: d.incident_date || d.date_missing || d.date_lost || d.event_date || '',
          incident_place: d.incident_place || d.last_seen_location || d.place_lost || d.venue || '',
          incident_description: d.incident_description || d.description || '',
          station_name: d.station_name || '',
          station_phone: d.station_phone || '',
          status: d.status || 'Pending',
          created_at: d.created_at || '',
          complaint_type: d.crime_category === 'Missing Person' ? 'missing'
            : d.crime_category === 'Tenant Verification' ? 'tenant'
            : d.crime_category === 'Senior Citizen Registration' ? 'senior'
            : d.article_type ? 'elost'
            : d.event_type ? 'event'
            : 'fir',
          timeline: [],
        }};
      }
    }
  } catch { /* */ }
  return null;
}

// Status configs per complaint type
type StatusStep = { label: string; labelKn: string; desc: string; color: string };

const TYPE_CONFIG: Record<string, {
  icon: typeof FileText; label: string; labelKn: string;
  statuses: Record<string, { color: string; bg: string; border: string; label: string; labelKn: string }>;
  steps: (status: string, data: Record<string,unknown>) => StatusStep[];
}> = {
  fir: {
    icon: Shield, label: 'FIR / Complaint', labelKn: 'ದೂರು',
    statuses: {
      'Pending':       { color:'#B45309', bg:'#FEF3C7', border:'#FCD34D', label:'Pending Review',      labelKn:'ಪರಿಶೀಲನೆ ಬಾಕಿ' },
      'Investigating': { color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD', label:'Investigating',        labelKn:'ತನಿಖೆ ನಡೆಯುತ್ತಿದೆ' },
      'ChargeSheeted': { color:'#065F46', bg:'#ECFDF5', border:'#6EE7B7', label:'Charge Sheet Filed',   labelKn:'ದೋಷಾರೋಪಣ ಸಲ್ಲಿಕೆ' },
      'Closed':        { color:'#374151', bg:'#F9FAFB', border:'#D1D5DB', label:'Case Closed',          labelKn:'ಪ್ರಕರಣ ಮುಕ್ತಾಯ' },
      'Referred':      { color:'#5B21B6', bg:'#F5F3FF', border:'#C4B5FD', label:'Referred to CID',      labelKn:'CID ಗೆ ವರ್ಗಾಯಿಸಿದೆ' },
    },
    steps: (status, data) => [
      { label:'FIR Registered', labelKn:'ದೂರು ದಾಖಲಾಗಿದೆ', desc:`Ref: ${data.fir_number} at ${data.station_name}`, color: 'green' },
      { label:'Under Investigation', labelKn:'ತನಿಖೆ', desc: ['Investigating','ChargeSheeted','Closed','Referred'].includes(status) ? 'Case assigned to Investigating Officer.' : 'Awaiting assignment.', color: ['Investigating','ChargeSheeted','Closed','Referred'].includes(status) ? 'green' : 'gray' },
      { label:'Charge Sheet / Final Action', labelKn:'ಅಂತಿಮ ಕ್ರಮ', desc: ['ChargeSheeted','Closed'].includes(status) ? 'Charge sheet filed in court.' : status === 'Referred' ? 'Referred to CID/Special Wing.' : 'Pending.', color: ['ChargeSheeted','Closed','Referred'].includes(status) ? 'green' : 'gray' },
      { label:'Case Disposed', labelKn:'ಪ್ರಕರಣ ಮುಕ್ತಾಯ', desc: status === 'Closed' ? 'Case concluded.' : 'Pending court proceedings.', color: status === 'Closed' ? 'green' : 'gray' },
    ],
  },
  elost: {
    icon: Smartphone, label: 'e-Lost Report', labelKn: 'e-ಲೋಸ್ಟ್ ವರದಿ',
    statuses: {
      'Reported': { color:'#B45309', bg:'#FEF3C7', border:'#FCD34D', label:'Reported',    labelKn:'ವರದಿಯಾಗಿದೆ' },
      'Found':    { color:'#065F46', bg:'#ECFDF5', border:'#6EE7B7', label:'Article Found', labelKn:'ವಸ್ತು ಸಿಕ್ಕಿದೆ' },
      'Closed':   { color:'#374151', bg:'#F9FAFB', border:'#D1D5DB', label:'Closed',       labelKn:'ಮುಕ್ತಾಯ' },
    },
    steps: (status) => [
      { label:'Report Submitted', labelKn:'ವರದಿ ಸಲ್ಲಿಕೆ', desc:'e-Lost report registered. Download PDF for use with telecom/bank.', color:'green' },
      { label:'Under Police Review', labelKn:'ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ', desc: status !== 'Reported' ? 'Police have reviewed the report.' : 'Pending police review.', color: status !== 'Reported' ? 'green' : 'gray' },
      { label:'Article Found / Closed', labelKn:'ವಸ್ತು ಸಿಕ್ಕಿದೆ / ಮುಕ್ತಾಯ', desc: status === 'Found' ? 'Article recovered. Contact station.' : status === 'Closed' ? 'Case closed.' : 'Ongoing search.', color: ['Found','Closed'].includes(status) ? 'green' : 'gray' },
    ],
  },
  missing: {
    icon: UserX, label: 'Missing Person', labelKn: 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿ',
    statuses: {
      'Open':   { color:'#991B1B', bg:'#FEF2F2', border:'#FCA5A5', label:'Search Active',  labelKn:'ಹುಡುಕಾಟ ನಡೆಯುತ್ತಿದೆ' },
      'Traced': { color:'#065F46', bg:'#ECFDF5', border:'#6EE7B7', label:'Person Traced',  labelKn:'ವ್ಯಕ್ತಿ ಸಿಕ್ಕಿದ್ದಾರೆ' },
      'Closed': { color:'#374151', bg:'#F9FAFB', border:'#D1D5DB', label:'Case Closed',    labelKn:'ಪ್ರಕರಣ ಮುಕ್ತಾಯ' },
    },
    steps: (status) => [
      { label:'Report Filed', labelKn:'ವರದಿ ದಾಖಲಾಗಿದೆ', desc:'Missing person report registered. Shared with all stations and ERSS 112.', color:'green' },
      { label:'Active Search', labelKn:'ಹುಡುಕಾಟ ನಡೆಯುತ್ತಿದೆ', desc:'Police actively searching. Details shared on KSP network.', color: status !== 'Closed' && status !== 'Traced' ? 'blue' : 'green' },
      { label:'Person Traced / Case Closed', labelKn:'ವ್ಯಕ್ತಿ ಸಿಕ್ಕಿದ್ದಾರೆ / ಮುಕ್ತಾಯ', desc: status === 'Traced' ? '✓ Person has been traced and reunited.' : status === 'Closed' ? 'Case closed.' : 'Search ongoing.', color: ['Traced','Closed'].includes(status) ? 'green' : 'gray' },
    ],
  },
  tenant: {
    icon: Home, label: 'Tenant Verification', labelKn: 'ಕಿರಾಯಿದಾರ ಪರಿಶೀಲನೆ',
    statuses: {
      'Pending':  { color:'#B45309', bg:'#FEF3C7', border:'#FCD34D', label:'Verification Pending', labelKn:'ಪರಿಶೀಲನೆ ಬಾಕಿ' },
      'Verified': { color:'#065F46', bg:'#ECFDF5', border:'#6EE7B7', label:'Verified & Approved',  labelKn:'ಪರಿಶೀಲಿಸಲಾಗಿದೆ' },
      'Rejected': { color:'#991B1B', bg:'#FEF2F2', border:'#FCA5A5', label:'Verification Rejected', labelKn:'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ' },
    },
    steps: (status) => [
      { label:'Application Submitted', labelKn:'ಅರ್ಜಿ ಸಲ್ಲಿಕೆ', desc:'Tenant verification application received.', color:'green' },
      { label:'Police Verification', labelKn:'ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ', desc: status !== 'Pending' ? 'Police have completed antecedent verification.' : 'Pending physical verification by beat officer.', color: status !== 'Pending' ? 'green' : 'gray' },
      { label:'Certificate Issued', labelKn:'ಪ್ರಮಾಣಪತ್ರ', desc: status === 'Verified' ? '✓ Verification certificate approved.' : status === 'Rejected' ? '✗ Application rejected.' : 'Pending.', color: status === 'Verified' ? 'green' : status === 'Rejected' ? 'red' : 'gray' },
    ],
  },
  event: {
    icon: Calendar, label: 'Event Permission', labelKn: 'ಕಾರ್ಯಕ್ರಮ ಅನುಮತಿ',
    statuses: {
      'Pending':     { color:'#B45309', bg:'#FEF3C7', border:'#FCD34D', label:'Approval Pending',   labelKn:'ಅನುಮೋದನೆ ಬಾಕಿ' },
      'Approved':    { color:'#065F46', bg:'#ECFDF5', border:'#6EE7B7', label:'Permission Granted',  labelKn:'ಅನುಮತಿ ನೀಡಲಾಗಿದೆ' },
      'Rejected':    { color:'#991B1B', bg:'#FEF2F2', border:'#FCA5A5', label:'Permission Denied',   labelKn:'ಅನುಮತಿ ನಿರಾಕರಿಸಿದೆ' },
      'Conditional': { color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD', label:'Conditional Approval', labelKn:'ಷರತ್ತು ಸಹಿತ ಅನುಮತಿ' },
    },
    steps: (status) => [
      { label:'Application Filed', labelKn:'ಅರ್ಜಿ ದಾಖಲು', desc:'Event permission application received.', color:'green' },
      { label:'Police Review', labelKn:'ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ', desc: status !== 'Pending' ? 'Application reviewed by SHO.' : 'Awaiting review by SHO.', color: status !== 'Pending' ? 'green' : 'gray' },
      { label:'Decision', labelKn:'ನಿರ್ಧಾರ', desc: status === 'Approved' ? '✓ Permission granted.' : status === 'Rejected' ? '✗ Permission denied.' : status === 'Conditional' ? '✓ Conditional approval granted.' : 'Pending.', color: ['Approved','Conditional'].includes(status) ? 'green' : status === 'Rejected' ? 'red' : 'gray' },
    ],
  },
  noc: {
    icon: Lock, label: 'NOC / Passport Application', labelKn: 'NOC / ಪಾಸ್‌ಪೋರ್ಟ್ ಅರ್ಜಿ',
    statuses: {
      'Pending':     { color:'#B45309', bg:'#FEF3C7', border:'#FCD34D', label:'Application Pending',   labelKn:'ಅರ್ಜಿ ಬಾಕಿ' },
      'Approved':    { color:'#065F46', bg:'#ECFDF5', border:'#6EE7B7', label:'NOC Granted',            labelKn:'NOC ನೀಡಲಾಗಿದೆ' },
      'Rejected':    { color:'#991B1B', bg:'#FEF2F2', border:'#FCA5A5', label:'Application Rejected',   labelKn:'ಅರ್ಜಿ ತಿರಸ್ಕರಿಸಿದೆ' },
      'Conditional': { color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD', label:'Conditional Approval',   labelKn:'ಷರತ್ತು ಸಹಿತ ಅನುಮತಿ' },
    },
    steps: (status) => [
      { label:'Application Submitted', labelKn:'ಅರ್ಜಿ ಸಲ್ಲಿಕೆ', desc:'NOC application received by police station.', color:'green' },
      { label:'Police Verification', labelKn:'ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ', desc: status !== 'Pending' ? 'Antecedents verified by SHO.' : 'Background verification in progress.', color: status !== 'Pending' ? 'green' : 'gray' },
      { label:'NOC Issued / Decision', labelKn:'NOC ನಿರ್ಧಾರ', desc: status === 'Approved' ? '✓ NOC granted. Collect from station.' : status === 'Rejected' ? '✗ Application rejected. Visit station for details.' : status === 'Conditional' ? '✓ NOC with conditions attached.' : 'Decision pending.', color: status === 'Approved' || status === 'Conditional' ? 'green' : status === 'Rejected' ? 'red' : 'gray' },
    ],
  },
  senior: {
    icon: Heart, label: 'Senior Citizen Registration', labelKn: 'ಹಿರಿಯ ನಾಗರಿಕ ನೋಂದಣಿ',
    statuses: {
      'Active':   { color:'#065F46', bg:'#ECFDF5', border:'#6EE7B7', label:'Registered & Active', labelKn:'ನೋಂದಾಯಿತ' },
      'Inactive': { color:'#374151', bg:'#F9FAFB', border:'#D1D5DB', label:'Inactive',            labelKn:'ನಿಷ್ಕ್ರಿಯ' },
    },
    steps: () => [
      { label:'Registration Complete', labelKn:'ನೋಂದಣಿ ಪೂರ್ಣ', desc:'Senior citizen registered under KSP Safety Initiative.', color:'green' },
      { label:'Beat Officer Assigned', labelKn:'ಬೀಟ್ ಅಧಿಕಾರಿ ನಿಯೋಜಿಸಲಾಗಿದೆ', desc:'Local beat officer assigned for monthly visits.', color:'green' },
      { label:'Monthly Visits Active', labelKn:'ಮಾಸಿಕ ಭೇಟಿ', desc:'Beat officer will visit monthly. Emergency: call 112.', color:'green' },
    ],
  },
};

const SAMPLE_NUMBERS = [
  'KAR/2026/KLR/PS/000001',
  'KAR/2026/KLR/PS/000002',
  'KAR/2026/BNG/CP/004217',
  'KAR/2026/UK/DAN/000001',
];

export default function TrackComplaint() {
  const { lang } = useI18nStore();
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('ref') || searchParams.get('fir') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');

  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;

  const doSearch = async (num?: string) => {
    const q = (num || input).trim().toUpperCase();
    if (!q) return;
    setLoading(true); setError(''); setResult(null);
    const found = await fetchComplaintStatus(q);
    if (found) { setResult(found.data as Record<string,unknown>); setSource(found.source); }
    else setError(`No record found for "${q}". Check your reference number.`);
    setLoading(false);
  };

  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('fir');
    if (ref) { setInput(ref.toUpperCase()); doSearch(ref); }
  }, []);

  // Determine complaint type
  const complaintType = result ? (String(result.complaint_type || 'fir')) : 'fir';
  const cfg = TYPE_CONFIG[complaintType] || TYPE_CONFIG['fir'];
  const status = String(result?.status || 'Pending');
  const statusCfg = cfg.statuses[status] || Object.values(cfg.statuses)[0];
  const steps = result ? cfg.steps(status, result) : [];
  const TypeIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#081428] text-[#F0C75E] px-4 py-1.5 text-xs uppercase tracking-widest mb-4">
            <Shield size={12} /> SurakshaKarnataka
          </div>
          <h1 className="text-2xl font-bold text-[#081428] uppercase tracking-wider mb-1">
            {L('Track Your Complaint', 'ನಿಮ್ಮ ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ')}
          </h1>
          <p className="text-gray-500 text-sm">
            {L('Works for FIR, e-Lost, Missing Person, Tenant Verification, Event Permission', 'ಎಲ್ಲಾ ದೂರು ಪ್ರಕಾರಗಳಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ')}
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white border border-[#e5e7eb] shadow-sm p-5 mb-5">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="KAR/2026/KLR/PS/000001 or reference number"
              className="flex-1 px-4 py-2.5 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-300" />
            <button onClick={() => doSearch()} disabled={loading || !input.trim()}
              className="px-5 py-2.5 bg-[#081428] text-white text-sm uppercase tracking-wider hover:bg-[#0F1E36] disabled:opacity-40 flex items-center gap-2">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              {L('Track', 'ಟ್ರ್ಯಾಕ್')}
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
            <p className="text-xs text-gray-400 mb-1.5">{L('Sample numbers:', 'ಮಾದರಿ ಸಂಖ್ಯೆ:')}</p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_NUMBERS.map(n => (
                <button key={n} onClick={() => { setInput(n); doSearch(n); }}
                  className="text-[0.6rem] font-mono px-2 py-0.5 bg-[#F5F5F0] hover:bg-[#081428] hover:text-white border border-[#e5e7eb] transition-colors">{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && !result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 p-4 flex gap-3 mb-4">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{L('Not Found', 'ಕಂಡುಬಂದಿಲ್ಲ')}</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Offline warning */}
              {source === 'local' && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2">
                  <RefreshCw size={10} /> Showing locally saved data — XAMPP may be offline. Status updates from police may not appear.
                </div>
              )}

              {/* Type + Status Banner */}
              <div className="bg-white border border-[#e5e7eb] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-[#0F1E36] flex items-center justify-center">
                    <TypeIcon size={14} className="text-[#F0C75E]" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">{lang === 'kn' ? cfg.labelKn : cfg.label}</span>
                </div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[0.58rem] text-gray-400 uppercase tracking-widest mb-0.5">{L('Reference Number', 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ')}</p>
                    <p className="font-mono font-bold text-[#081428] text-sm">{String(result.fir_number || '')}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
                    style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
                    <CheckCircle2 size={11} />
                    {lang === 'kn' ? statusCfg.labelKn : statusCfg.label}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white border border-[#e5e7eb] p-4">
                <h3 className="text-xs font-bold text-[#081428] uppercase tracking-widest mb-3">{L('Details', 'ವಿವರ')}</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { icon: User,     label: L('Name','ಹೆಸರು'),          val: result.complainant_name },
                    { icon: Phone,    label: L('Phone','ಫೋನ್'),           val: result.complainant_phone },
                    { icon: FileText, label: L('Type','ಪ್ರಕಾರ'),          val: result.crime_category },
                    { icon: FileText, label: L('Details','ವಿವರ'),         val: result.sub_category || result.incident_description },
                    { icon: Clock,    label: L('Date','ದಿನಾಂಕ'),           val: result.incident_date },
                    { icon: MapPin,   label: L('Location','ಸ್ಥಳ'),         val: result.incident_place },
                    { icon: Shield,   label: L('Station','ಠಾಣೆ'),          val: result.station_name },
                    { icon: Clock,    label: L('Filed On','ದಾಖಲಾದ ದಿನ'),  val: result.created_at ? new Date(String(result.created_at)).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '' },
                  ].filter(r => r.val).map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-start gap-2">
                      <Icon size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-400 text-[0.57rem] uppercase tracking-wider">{label}</p>
                        <p className="text-[#081428] mt-0.5 text-[0.75rem] leading-snug">{String(val).substring(0, 80)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="bg-white border border-[#e5e7eb] p-4">
                <h3 className="text-xs font-bold text-[#081428] uppercase tracking-widest mb-5">{L('Progress', 'ಪ್ರಗತಿ')}</h3>
                <div className="relative">
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-[#e5e7eb]" />
                  <div className="space-y-5">
                    {steps.map((step, i) => {
                      const isDone = step.color === 'green';
                      const isActive = i === steps.findIndex(s => s.color !== 'green' && s.color !== 'gray') || 
                        (i === steps.length - 1 && steps.every(s => s.color === 'green'));
                      const isRed = step.color === 'red';
                      return (
                        <div key={i} className="flex gap-4 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 text-xs font-bold ${
                            isRed ? 'bg-red-500 border-red-500 text-white' :
                            isDone ? 'bg-green-500 border-green-500 text-white' :
                            step.color === 'blue' ? 'bg-blue-500 border-blue-500 text-white' :
                            'bg-white border-[#e5e7eb] text-gray-400'
                          }`}>
                            {isDone || isRed ? <CheckCircle2 size={14} /> : i + 1}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className={`text-sm font-semibold ${isDone || step.color === 'blue' || isRed ? 'text-[#081428]' : 'text-gray-400'}`}>
                              {lang === 'kn' ? step.labelKn : step.label}
                            </p>
                            <p className={`text-xs mt-0.5 ${isDone || step.color === 'blue' ? 'text-gray-500' : 'text-gray-300'}`}>{step.desc}</p>
                            {step.color === 'blue' && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-[0.6rem] text-blue-600 font-semibold uppercase tracking-wider">{L('In Progress', 'ಪ್ರಗತಿಯಲ್ಲಿದೆ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Call Station */}
              {result.station_phone && String(result.station_phone).length > 3 && (
                <div className="bg-[#081428] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[0.6rem] text-gray-500 uppercase tracking-wider">{L('Station Contact', 'ಠಾಣೆ ಸಂಪರ್ಕ')}</p>
                    <p className="text-[#F0C75E] font-mono text-sm font-bold mt-0.5">{String(result.station_phone)}</p>
                    <p className="text-gray-500 text-xs">{String(result.station_name || '')}</p>
                  </div>
                  <a href={`tel:${result.station_phone}`}
                    className="px-4 py-2 bg-[#F0C75E] text-[#081428] text-xs font-bold uppercase tracking-wider hover:bg-yellow-300 transition-colors">
                    {L('Call Now', 'ಕರೆ ಮಾಡಿ')}
                  </a>
                </div>
              )}

              <button onClick={() => doSearch()} className="w-full py-2 text-xs text-gray-400 hover:text-[#081428] flex items-center justify-center gap-1 transition-colors">
                <RefreshCw size={10} /> {L('Refresh Status', 'ಸ್ಥಿತಿ ನವೀಕರಿಸಿ')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helplines */}
        <div className="mt-8 pt-5 border-t border-[#e5e7eb] grid grid-cols-3 gap-3 text-center">
          {[['112','Emergency'],['1930','Cyber Crime'],['100','Police']].map(([num, lbl]) => (
            <a key={num} href={`tel:${num}`} className="group">
              <p className="text-xl font-bold text-[#A8362A] group-hover:text-[#081428] transition-colors">{num}</p>
              <p className="text-xs text-gray-400">{lbl}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
