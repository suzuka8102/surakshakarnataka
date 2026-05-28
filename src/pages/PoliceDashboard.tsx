import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';
import { getStationById } from '@/data';
import {
  LayoutDashboard, Mail, BookOpen, Map, Database, Lock,
  Scale, Heart, UserCheck, AlertTriangle, LogOut, Search,
  CheckCircle2, Clock, Plus, MapPin, Phone, RefreshCw,
  FileText, Car, Calendar, UserX, AlertCircle
} from 'lucide-react';

const API = '/api';

const apiFetch = async (action: string, params: Record<string,string> = {}) => {
  try {
    const url = new URL(API, window.location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const j = await res.json();
    return j.success ? j.data : null;
  } catch { return null; }
};

const apiPost = async (action: string, body: Record<string, unknown>) => {
  try {
    const res = await fetch(`${API}?action=${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(8000)
    });
    const j = await res.json();
    return j.success ? j.data : null;
  } catch { return null; }
};

// Merge DB results with localStorage
function mergeWithLocalStorage(dbItems: Record<string,string>[], type: string) {
  try {
    const stored = localStorage.getItem('sk_submitted_refs');
    if (!stored) return dbItems;
    const refs = JSON.parse(stored) as Record<string, Record<string,string>>;
    const extras: Record<string,string>[] = [];
    Object.entries(refs).forEach(([ref, d]) => {
      const cat = (d.crime_category || '').toUpperCase();
      const activeType = d.crime_category === 'elost' || d.article_type ? 'elost'
        : d.crime_category === 'tenant' || d.landlord_name ? 'tenant'
        : d.crime_category === 'senior' || d.age ? 'senior'
        : d.crime_category === 'event' || d.event_name ? 'event'
        : d.missing_name ? 'missing' : 'fir';
      
      const matches = type === 'fir' || type === activeType;
      const notDuplicate = !dbItems.find(r => r.fir_number === ref || r.report_number === ref);
      if (matches && notDuplicate) {
        extras.push({ fir_id: 'LOCAL_' + ref, fir_number: ref, report_number: ref, ...d });
      }
    });
    return [...dbItems, ...extras];
  } catch { return dbItems; }
}

const navItems = [
  { key: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard',         labelKn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
  { key: 'fir-inbox',   icon: Mail,            label: 'FIR Inbox',         labelKn: 'FIR ಇನ್‌ಬಾಕ್ಸ್' },
  { key: 'elost',       icon: FileText,        label: 'e-Lost Reports',    labelKn: 'e-ಲೋಸ್ಟ್ ವರದಿ' },
  { key: 'tenant',      icon: UserCheck,       label: 'Verifications',     labelKn: 'ಪರಿಶೀಲನೆಗಳು' },
  { key: 'senior',      icon: Heart,           label: 'Senior Citizens',   labelKn: 'ಹಿರಿಯ ನಾಗರಿಕರು' },
  { key: 'events',      icon: Calendar,        label: 'Event Permissions', labelKn: 'ಕಾರ್ಯಕ್ರಮ ಅನುಮತಿ' },
  { key: 'missing',     icon: UserX,           label: 'Missing Persons',   labelKn: 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿಗಳು' },
  { key: 'case-diary',  icon: BookOpen,        label: 'Case Diary',        labelKn: 'ಕೇಸ್ ಡೈರಿ' },
  { key: 'beat-mgmt',   icon: Map,             label: 'Beat Management',   labelKn: 'ಬೀಟ್ ನಿರ್ವಹಣೆ' },
  { key: 'criminal-db', icon: Database,        label: 'Criminal DB',       labelKn: 'ಕ್ರಿಮಿನಲ್ ದಾಖಲೆ' },
  { key: 'bolo',        icon: AlertTriangle,   label: 'BOLO Alerts',       labelKn: 'BOLO ಎಚ್ಚರಿಕೆ' },
  { key: 'noc',         icon: Lock,            label: 'NOC Applications',  labelKn: 'NOC ಅರ್ಜಿಗಳು' },
];

const statusColors: Record<string,string> = {
  'Pending': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'Investigating': 'bg-blue-50 text-blue-800 border-blue-200',
  'ChargeSheeted': 'bg-green-50 text-green-800 border-green-200',
  'Closed': 'bg-gray-50 text-gray-600 border-gray-200',
  'Referred': 'bg-purple-50 text-purple-800 border-purple-200',
  'Verified': 'bg-green-50 text-green-700 border-green-200',
  'Rejected': 'bg-red-50 text-red-700 border-red-200',
  'Reported': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'Found': 'bg-green-50 text-green-700 border-green-200',
  'Open': 'bg-red-50 text-red-700 border-red-200',
  'Traced': 'bg-green-50 text-green-700 border-green-200',
  'Approved': 'bg-green-50 text-green-700 border-green-200',
  'Conditional': 'bg-blue-50 text-blue-700 border-blue-200',
};

// ─── Sidebar ─────────────────────────────────────────────────────
function Sidebar({ active, onNavigate, counts }: { active:string; onNavigate:(k:string)=>void; counts: Record<string,number> }) {
  const { user, logout } = useAuthStore();
  const { lang } = useI18nStore();
  const station = user?.station_id ? getStationById(user.station_id) : null;

  return (
    <aside className="w-56 bg-[#081428] min-h-screen flex flex-col border-r border-[#2A3244] flex-shrink-0">
      <div className="p-4 border-b border-[#2A3244]">
        <div className="w-9 h-9 bg-[#F0C75E] flex items-center justify-center text-[#081428] font-bold text-base mb-2">
          {user?.name?.[0] || 'P'}
        </div>
        <p className="text-[#F5F5F0] text-sm font-semibold truncate">{user?.name}</p>
        <p className="text-[#F0C75E] text-xs">{user?.rank} · {user?.badge_no}</p>
        {station && <p className="text-gray-500 text-xs mt-0.5 truncate">{station.name} PS</p>}
      </div>
      <nav className="flex-1 py-1 overflow-y-auto">
        {navItems.map((item) => (
          <button key={item.key} onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[0.7rem] uppercase tracking-wider transition-colors text-left ${
              active === item.key ? 'bg-[#0F1E36] text-[#F0C75E] border-l-2 border-[#F0C75E]' : 'text-gray-400 hover:bg-[#0F1E36] hover:text-[#F5F5F0]'
            }`}>
            <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 truncate">{lang === 'kn' ? item.labelKn : item.label}</span>
            {counts[item.key] > 0 && (
              <span className="bg-[#A8362A] text-white text-[0.55rem] px-1.5 py-0.5 rounded-sm">{counts[item.key]}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-[#2A3244]">
        <button onClick={logout} className="flex items-center gap-2 text-red-400 text-xs uppercase tracking-wider hover:text-red-300">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Generic Table View ───────────────────────────────────────────
function TableView({
  title, items, loading, onRefresh, columns, renderRow, renderActions, emptyMsg
}: {
  title: string;
  items: Record<string,string>[];
  loading: boolean;
  onRefresh: () => void;
  columns: string[];
  renderRow: (item: Record<string,string>) => React.ReactNode[];
  renderActions?: (item: Record<string,string>) => React.ReactNode;
  emptyMsg?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{items.length} {title.toLowerCase()} found</p>
        <button onClick={onRefresh} className="text-xs text-[#081428] flex items-center gap-1 hover:underline">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      <div className="bg-white border border-[#e5e7eb] overflow-auto max-h-[70vh]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#081428] text-[#F5F5F0]">
            <tr>
              {columns.map(c => <th key={c} className="px-3 py-2.5 text-left uppercase tracking-wider whitespace-nowrap">{c}</th>)}
              {renderActions && <th className="px-3 py-2.5 text-left uppercase tracking-wider">Action</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id || item.fir_id || item.report_id || item.citizen_id || item.perm_id || item.missing_id || item.verify_id || i}
                className="border-b border-[#e5e7eb] hover:bg-gray-50">
                {renderRow(item).map((cell, j) => (
                  <td key={j} className="px-3 py-2">{cell}</td>
                ))}
                {renderActions && <td className="px-3 py-2">{renderActions(item)}</td>}
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-gray-400">{emptyMsg || 'No data found'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Dashboard KPIs ───────────────────────────────────────────────
function DashboardView() {
  const [kpis, setKpis] = useState<Record<string,number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('dashboard_kpis').then(d => { if(d) setKpis(d); setLoading(false); });
  }, []);

  const cards = [
    { label:'Total FIRs', value: kpis.total, color:'#A8362A' },
    { label:'Pending', value: kpis.pending, color:'#F59E0B' },
    { label:'Investigating', value: kpis.solving, color:'#3B82F6' },
    { label:'Charge Sheeted', value: kpis.charged, color:'#10B981' },
    { label:'Missing Open', value: kpis.missing, color:'#8B5CF6' },
    { label:'Wanted', value: kpis.wanted, color:'#EF4444' },
    { label:'Senior Citizens', value: kpis.seniors, color:'#F97316' },
    { label:'Total Stations', value: kpis.stations, color:'#6B7280' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {loading && <p className="col-span-4 text-gray-400 text-sm text-center py-8">Loading from database...</p>}
      {cards.map(c => (
        <div key={c.label} className="bg-white border-l-4 p-4" style={{ borderLeftColor: c.color }}>
          <p className="text-2xl font-bold text-[#081428]">{c.value ?? '—'}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}


// ─── Print FIR Document ───────────────────────────────────────
function printFIRDocument(fir: Record<string,string>) {
  const win = window.open('', '_blank', 'width=850,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html><head><title>FIR ${fir.fir_number}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; color: #000; }
  .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px; }
  h1 { font-size: 16px; margin: 0; } h2 { font-size: 13px; margin: 2px 0; }
  .kannada { font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  td, th { border: 1px solid #000; padding: 5px 8px; vertical-align: top; }
  th { background: #f0f0f0; text-align: left; width: 35%; }
  .signature-area { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 30px; }
  .sig-box { text-align: center; border-top: 1px solid #000; padding-top: 5px; }
  .stamp-area { width: 100px; height: 100px; border: 2px dashed #ccc; display: inline-block; margin: 10px; }
  @media print { .no-print { display: none; } }
  .fir-badge { display: inline-block; border: 2px solid #000; padding: 4px 12px; font-weight: bold; font-size: 13px; }
</style></head>
<body>
<div class="header">
  <p class="kannada">ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್</p>
  <h1>KARNATAKA STATE POLICE</h1>
  <h2>FIRST INFORMATION REPORT (FIR)</h2>
  <h2>ಪ್ರಥಮ ಮಾಹಿತಿ ವರದಿ</h2>
  <p>Under Section 154 CrPC / BNSS 2023</p>
</div>

<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
  <div><span class="fir-badge">FIR No: ${fir.fir_number || '—'}</span></div>
  <div>Date: ${fir.created_at ? new Date(fir.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
  <div>Station: ${fir.station_name || '—'}</div>
</div>

<table>
  <tr><th>1. Complainant Name / ದೂರುದಾರ ಹೆಸರು</th><td>${fir.complainant_name || '—'}</td></tr>
  <tr><th>2. Phone / ದೂರವಾಣಿ</th><td>${fir.complainant_phone || '—'}</td></tr>
  <tr><th>3. Address / ವಿಳಾಸ</th><td>${fir.complainant_address || '—'}</td></tr>
  <tr><th>4. ID Type & Number</th><td>${fir.id_type || '—'}: ${fir.id_number || '—'}</td></tr>
  <tr><th>5. Date & Time of Incident</th><td>${fir.incident_date || '—'} ${fir.incident_time || ''}</td></tr>
  <tr><th>6. Place of Incident / ಘಟನಾ ಸ್ಥಳ</th><td>${fir.incident_place || '—'}</td></tr>
  <tr><th>7. Crime Category / ಅಪರಾಧ ವರ್ಗ</th><td>${fir.crime_category || '—'} — ${fir.sub_category || '—'}</td></tr>
  <tr><th>8. Description / ವಿವರಣೆ</th><td style="min-height:80px">${fir.incident_description || '—'}</td></tr>
  <tr><th>9. Suspect Details / ಆರೋಪಿ ವಿವರ</th><td>${fir.suspect_details || 'Unknown'}</td></tr>
  <tr><th>10. Witness / ಸಾಕ್ಷಿ</th><td>${fir.witness_details || 'None'}</td></tr>
  <tr><th>11. Status / ಸ್ಥಿತಿ</th><td><strong>${fir.status || 'Pending'}</strong></td></tr>
</table>

<div class="signature-area">
  <div class="sig-box">Complainant Signature<br>ದೂರುದಾರ ಸಹಿ</div>
  <div class="sig-box">Investigating Officer<br>ತನಿಖಾ ಅಧಿಕಾರಿ</div>
  <div class="sig-box">SHO / PI<br>ಠಾಣಾಧಿಕಾರಿ<div class="stamp-area"></div></div>
</div>

<div class="no-print" style="margin-top:20px;text-align:center">
  <button onclick="window.print()" style="padding:8px 24px;background:#081428;color:#F0C75E;border:none;cursor:pointer;font-size:12px">🖨 Print FIR</button>
  <button onclick="window.close()" style="margin-left:10px;padding:8px 16px;background:#fff;border:1px solid #ccc;cursor:pointer;font-size:12px">Close</button>
</div>
</body></html>`);
  win.document.close();
}

// ─── FIR Inbox ────────────────────────────────────────────────────
function FIRInboxView() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [firs, setFirs] = useState<Record<string,string>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string,string> | null>(null);
  const [updating, setUpdating] = useState('');

  // Debounce search - 300ms delay for live typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = { page_size: '100' };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.status = statusFilter;
    const data = await apiFetch('firs', params);
    const dbItems = data?.items || [];
    const merged = mergeWithLocalStorage(dbItems, 'fir');
    setFirs(merged);
    setTotal(merged.length);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (firId: string, status: string, firNumber?: string) => {
    setUpdating(firId);
    if (firId.startsWith('LOCAL_') && firNumber) {
      try {
        const stored = localStorage.getItem('sk_submitted_refs');
        if (stored) {
          const refs = JSON.parse(stored);
          if (refs[firNumber]) { refs[firNumber].status = status; localStorage.setItem('sk_submitted_refs', JSON.stringify(refs)); }
        }
      } catch { /* */ }
    } else {
      await apiPost('update_fir_status', { fir_id: firId, status, officer_id: 'officer' });
    }
    await load();
    if (selected?.fir_id === firId) setSelected(p => p ? { ...p, status } : null);
    setUpdating('');
  };

  return (
    <div className="flex gap-4 h-full">
      <div className={`space-y-3 ${selected ? 'w-1/2' : 'w-full'} transition-all`}>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FIR / name..."
              className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] focus:border-[#081428] outline-none text-xs" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-2 border border-[#e5e7eb] text-xs bg-white outline-none">
            <option value="">All Status</option>
            {['Pending','Investigating','ChargeSheeted','Closed','Referred'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={load} className="px-3 py-2 bg-[#081428] text-white text-xs flex items-center gap-1">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        <p className="text-xs text-gray-500">{total} FIRs</p>
        <div className="bg-white border border-[#e5e7eb] overflow-auto max-h-[68vh]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#081428] text-[#F5F5F0]">
              <tr>{['FIR No.','Date','Complainant','Category','Status','Update'].map(h => (
                <th key={h} className="px-2.5 py-2.5 text-left uppercase tracking-wider whitespace-nowrap text-[0.65rem]">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {firs.map(fir => (
                <tr key={fir.fir_id} onClick={() => setSelected(fir)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${selected?.fir_id === fir.fir_id ? 'bg-[#F0C75E]/10' : 'hover:bg-gray-50'}`}>
                  <td className="px-2.5 py-2 font-mono text-[0.6rem] text-[#A8362A] whitespace-nowrap">{fir.fir_number}</td>
                  <td className="px-2.5 py-2 text-gray-500 whitespace-nowrap">{fir.created_at ? new Date(fir.created_at).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-2.5 py-2 font-medium text-[#081428]">{fir.complainant_name}</td>
                  <td className="px-2.5 py-2"><span className="px-1.5 py-0.5 bg-[#0F1E36] text-[#F0C75E] text-[0.55rem]">{fir.crime_category}</span></td>
                  <td className="px-2.5 py-2"><span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[fir.status] || ''}`}>{fir.status}</span></td>
                  <td className="px-2.5 py-2" onClick={e => e.stopPropagation()}>
                    <select value={fir.status} onChange={e => updateStatus(fir.fir_id, e.target.value, fir.fir_number)}
                      disabled={updating === fir.fir_id}
                      className="text-[0.6rem] border border-[#e5e7eb] bg-white px-1 py-0.5 outline-none cursor-pointer">
                      {['Pending','Investigating','ChargeSheeted','Closed','Referred'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && firs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-xs">No FIRs found. File a complaint as a citizen to see it here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-1/2 bg-white border border-[#e5e7eb] p-4 overflow-auto max-h-[80vh] text-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#081428] text-sm">FIR Details</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => printFIRDocument(selected)}
                className="px-2 py-1 text-[0.6rem] bg-[#081428] text-[#F0C75E] hover:bg-[#0F1E36] transition-colors flex items-center gap-1">
                🖨 Print FIR
              </button>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
          </div>
          <p className="font-mono text-[#A8362A] font-bold text-sm">{selected.fir_number}</p>
          {[
            ['Complainant', selected.complainant_name],
            ['Phone', selected.complainant_phone],
            ['Address', selected.complainant_address],
            ['Category', selected.crime_category],
            ['Sub-Category', selected.sub_category],
            ['Date', selected.incident_date],
            ['Place', selected.incident_place],
            ['Status', selected.status],
          ].map(([k,v]) => v && (
            <div key={k} className="border-b border-[#f0f0f0] pb-2">
              <p className="text-gray-400 uppercase tracking-wider text-[0.58rem]">{k}</p>
              <p className="text-[#081428] mt-0.5">{v}</p>
            </div>
          ))}
          <div>
            <p className="text-gray-400 uppercase tracking-wider text-[0.58rem] mb-1">Description</p>
            <p className="text-[#081428] bg-gray-50 p-2 leading-relaxed">{selected.incident_description}</p>
          </div>
          {selected.suspect_details && (
            <div>
              <p className="text-gray-400 uppercase tracking-wider text-[0.58rem] mb-1">Suspect</p>
              <p className="text-[#081428] bg-red-50 p-2">{selected.suspect_details}</p>
            </div>
          )}

          {/* CCTNS Case Progress Timeline */}
          <div>
            <p className="text-gray-400 uppercase tracking-wider text-[0.58rem] mb-2">Case Journey</p>
            <div className="flex items-center gap-0">
              {(['Registered','Investigating','ChargeSheeted','Court','Closed'] as const).map((stage, i) => {
                const statusOrder = { 'Pending':0,'Investigating':1,'ChargeSheeted':2,'Referred':2,'Closed':4 };
                const currentOrder = statusOrder[selected.status as keyof typeof statusOrder] || 0;
                const stageOrder = i;
                const isCompleted = stageOrder <= currentOrder;
                const isCurrent = stageOrder === currentOrder;
                return (
                  <div key={stage} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.5rem] font-bold border-2 ${isCompleted ? 'bg-[#081428] border-[#081428] text-[#F0C75E]' : 'bg-white border-gray-300 text-gray-400'} ${isCurrent ? 'ring-2 ring-[#F0C75E] ring-offset-1' : ''}`}>
                        {isCompleted ? '✓' : i+1}
                      </div>
                      <p className={`text-[0.48rem] mt-0.5 text-center leading-tight ${isCompleted ? 'text-[#081428] font-semibold' : 'text-gray-400'}`}>{stage}</p>
                    </div>
                    {i < 4 && <div className={`flex-1 h-0.5 mb-4 ${stageOrder < currentOrder ? 'bg-[#081428]' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wider text-[0.58rem] mb-2">Update Status</p>
            {/* Witness Protection Flag */}
          {selected.witness_details && !selected.witness_details.startsWith('[PROTECTED]') && (
            <div className="mb-3">
              <p className="text-gray-400 uppercase tracking-wider text-[0.58rem] mb-1">Witness Protection</p>
              <button onClick={async () => {
                await apiPost('flag_witness', { fir_id: selected.fir_id, officer_id: 'officer' });
                toast.success('Witness marked for protection');
                load();
              }} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-300 text-orange-700 text-xs hover:bg-orange-600 hover:text-white transition-colors">
                🛡 Flag Witness for Protection
              </button>
            </div>
          )}
          {selected.witness_details?.startsWith('[PROTECTED]') && (
            <div className="mb-3 px-2 py-1.5 bg-orange-50 border border-orange-300 text-orange-700 text-xs flex items-center gap-1.5">
              🛡 Witness protection active
            </div>
          )}
          <div className="flex flex-wrap gap-1">
              {['Pending','Investigating','ChargeSheeted','Closed','Referred'].map(s => (
                <button key={s} onClick={() => updateStatus(selected.fir_id, s, selected.fir_number)}
                  className={`px-2 py-1 text-[0.6rem] border transition-colors ${selected.status === s ? 'bg-[#081428] text-white border-[#081428]' : 'border-[#e5e7eb] hover:border-[#081428] hover:bg-gray-50'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── e-Lost Reports ───────────────────────────────────────────────
function ELostView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const data = await apiFetch('lost_articles');
    const merged = mergeWithLocalStorage(data || [], 'elost');
    setItems(merged);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <TableView title="e-Lost Reports" items={items} loading={loading} onRefresh={load}
      columns={['Ref No.', 'Date', 'Applicant', 'Article Type', 'Lost At', 'Status']}
      renderRow={item => [
        <span className="font-mono text-[0.6rem] text-[#A8362A]">{item.report_number || item.fir_number}</span>,
        new Date(item.created_at || Date.now()).toLocaleDateString('en-IN'),
        item.applicant_name || item.complainant_name,
        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[0.55rem] border border-blue-200">{item.article_type || 'Article'}</span>,
        item.place_lost || item.incident_place || '—',
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[item.status || 'Reported'] || ''}`}>{item.status || 'Reported'}</span>,
      ]}
      renderActions={item => (
        <select value={item.status || 'Reported'}
          onChange={async e => { await apiPost('update_lost_status', { report_id: item.report_id, status: e.target.value }); load(); }}
          className="text-[0.6rem] border border-[#e5e7eb] bg-white px-1 py-0.5 outline-none">
          {['Reported','Found','Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
      )}
      emptyMsg="No e-Lost reports. Citizens can file at File Complaint → e-Lost Report." />
  );
}

// ─── Verifications (Tenant + Servant) ─────────────────────────────
function VerificationsView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const data = await apiFetch('verifications', { type: 'tenant' });
    const merged = mergeWithLocalStorage(data || [], 'tenant');
    setItems(merged);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <TableView title="Verification Requests" items={items} loading={loading} onRefresh={load}
      columns={['Landlord', 'Tenant', 'Phone', 'Rental Address', 'ID', 'Status']}
      renderRow={item => [
        <span className="font-medium text-[#081428]">{item.landlord_name || item.complainant_name || '—'}</span>,
        item.tenant_name || '—',
        item.tenant_phone || item.complainant_phone || '—',
        <span className="text-gray-500 max-w-[120px] block truncate">{item.rental_address || item.complainant_address || '—'}</span>,
        `${item.id_type || 'ID'}: ${item.id_number || '—'}`,
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[item.status || 'Pending'] || ''}`}>{item.status || 'Pending'}</span>,
      ]}
      renderActions={item => (
        <div className="flex gap-1">
          <button onClick={async () => { await apiPost('update_verification', { verify_id: item.verify_id || item.fir_id, status: 'Verified' }); load(); }}
            className="px-1.5 py-0.5 text-[0.55rem] bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-colors">Verify</button>
          <button onClick={async () => { await apiPost('update_verification', { verify_id: item.verify_id || item.fir_id, status: 'Rejected' }); load(); }}
            className="px-1.5 py-0.5 text-[0.55rem] bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-colors">Reject</button>
        </div>
      )}
      emptyMsg="No verification requests. Citizens can apply at File Complaint → Tenant/Servant Verification." />
  );
}

// ─── Senior Citizens ──────────────────────────────────────────────
function SeniorCitizenView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState('');
  const load = async () => {
    setLoading(true);
    const data = await apiFetch('senior_citizens');
    const merged = mergeWithLocalStorage(data || [], 'senior');
    setItems(merged);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const today = new Date().toISOString().split('T')[0];
  return (
    <TableView title="Senior Citizens" items={items} loading={loading} onRefresh={load}
      columns={['Name', 'Age', 'Phone', 'Address', 'Medical', 'Last Visit']}
      renderRow={item => [
        <span className="font-medium text-[#081428]">{item.name}</span>,
        item.age,
        <a href={`tel:${item.phone}`} className="text-blue-600">{item.phone}</a>,
        <span className="text-gray-500 max-w-[140px] block truncate">{item.address}</span>,
        <span className="text-gray-500 max-w-[100px] block truncate">{item.medical_conditions || '—'}</span>,
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${item.last_visit_date === today ? 'bg-green-50 text-green-700 border-green-200' : !item.last_visit_date ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {item.last_visit_date || 'Never'}
        </span>,
      ]}
      renderActions={item => (
        <button onClick={async () => {
          setMarking(item.citizen_id);
          await apiPost('record_sc_visit', { citizen_id: item.citizen_id });
          await load();
          setMarking('');
        }} disabled={marking === item.citizen_id || item.last_visit_date === today}
          className="px-2 py-0.5 text-[0.6rem] border border-[#081428] hover:bg-[#081428] hover:text-white transition-colors disabled:opacity-40">
          {item.last_visit_date === today ? '✓ Visited' : 'Mark Visit'}
        </button>
      )}
      emptyMsg="No senior citizens registered. Citizens can register at File Complaint → Senior Citizen Registration." />
  );
}

// ─── Event Permissions ────────────────────────────────────────────
function EventsView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const data = await apiFetch('event_permissions');
    const merged = mergeWithLocalStorage(data || [], 'event');
    setItems(merged);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <TableView title="Event Permission Requests" items={items} loading={loading} onRefresh={load}
      columns={['Applicant', 'Event Type', 'Event Name', 'Date', 'Crowd', 'Venue', 'Status']}
      renderRow={item => [
        <span className="font-medium text-[#081428]">{item.applicant_name || item.complainant_name || '—'}</span>,
        <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[0.55rem] border border-teal-200">{item.event_type || '—'}</span>,
        item.event_name || '—',
        item.event_date || '—',
        item.expected_crowd ? `${item.expected_crowd} persons` : '—',
        <span className="text-gray-500 max-w-[100px] block truncate">{item.venue || item.incident_place || '—'}</span>,
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[item.status || 'Pending'] || ''}`}>{item.status || 'Pending'}</span>,
      ]}
      renderActions={item => (
        <div className="flex gap-1">
          <button onClick={async () => { await apiPost('update_event_status', { perm_id: item.perm_id || item.fir_id, status: 'Approved', conditions: '' }); load(); }}
            className="px-1.5 py-0.5 text-[0.55rem] bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-colors">Approve</button>
          <button onClick={async () => { await apiPost('update_event_status', { perm_id: item.perm_id || item.fir_id, status: 'Rejected', conditions: '' }); load(); }}
            className="px-1.5 py-0.5 text-[0.55rem] bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-colors">Reject</button>
        </div>
      )}
      emptyMsg="No event permission requests. Citizens can apply at File Complaint → Event Permission." />
  );
}

// ─── Missing Persons ──────────────────────────────────────────────
function MissingView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const data = await apiFetch('missing_persons_all');
    const merged = mergeWithLocalStorage(data || [], 'missing');
    setItems(merged);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <TableView title="Missing Person Reports" items={items} loading={loading} onRefresh={load}
      columns={['Name', 'Age', 'Gender', 'Date Missing', 'Last Seen', 'Contact', 'Status']}
      renderRow={item => [
        <span className="font-semibold text-[#081428]">{item.name || item.missing_name || '—'}</span>,
        item.age || item.missing_age || '—',
        item.gender || item.missing_gender || '—',
        item.date_missing || '—',
        <span className="text-gray-500 max-w-[120px] block truncate">{item.last_seen_location || '—'}</span>,
        <a href={`tel:${item.contact_number || item.reporter_phone}`} className="text-blue-600">{item.contact_number || item.reporter_phone || '—'}</a>,
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[item.status || 'Open'] || ''}`}>{item.status || 'Open'}</span>,
      ]}
      renderActions={item => (
        <div className="flex gap-1">
          <button onClick={async () => { await apiPost('update_missing_status', { missing_id: item.missing_id || item.fir_id, status: 'Traced' }); load(); }}
            className="px-1.5 py-0.5 text-[0.55rem] bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-colors">Traced</button>
          <button onClick={async () => { await apiPost('update_missing_status', { missing_id: item.missing_id || item.fir_id, status: 'Closed' }); load(); }}
            className="px-1.5 py-0.5 text-[0.55rem] bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-600 hover:text-white transition-colors">Close</button>
        </div>
      )}
      emptyMsg="No missing person reports. Citizens can report at File Complaint → Missing Person." />
  );
}

// ─── Criminal DB ──────────────────────────────────────────────────
function CriminalDBView() {
  const [search, setSearch] = useState('');
  const [criminals, setCriminals] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const params: Record<string,string> = {};
    if (search) params.search = search;
    apiFetch('criminals', params).then(d => { if(d) setCriminals(d); setLoading(false); });
  }, [search]);
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / alias..."
          className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {criminals.map(c => (
          <div key={c.criminal_id} className="bg-white border border-[#e5e7eb] p-4">
            <div className="flex gap-3 mb-2">
              <div className="w-12 h-12 bg-[#0F1E36] flex items-center justify-center text-[#F0C75E] text-lg font-bold flex-shrink-0">{c.name?.[0]}</div>
              <div>
                <h3 className="text-sm font-semibold text-[#081428]">{c.name}</h3>
                <p className="text-xs text-gray-500">{c.aliases}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.is_rowdy_sheeter === '1' && <span className="text-[0.5rem] px-1.5 py-0.5 bg-[#A8362A] text-white">ROWDY</span>}
                  {c.is_history_sheeter === '1' && <span className="text-[0.5rem] px-1.5 py-0.5 bg-[#F0C75E] text-[#081428]">HISTORY</span>}
                  {c.goonda_act === '1' && <span className="text-[0.5rem] px-1.5 py-0.5 bg-[#7C2D12] text-white">GOONDA</span>}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">Cases: <strong>{c.cases_count}</strong> · {c.last_known_location}</p>
          </div>
        ))}
        {!loading && criminals.length === 0 && <p className="text-gray-400 text-sm col-span-3 text-center py-8">No criminals found</p>}
      </div>
    </div>
  );
}

// ─── Beat Management ──────────────────────────────────────────────
function BeatMgmtView() {
  const [beats, setBeats] = useState<Record<string,string>[]>([]);
  useEffect(() => { apiFetch('beat_workload').then(d => { if(d) setBeats(d); }); }, []);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {beats.map(b => (
        <div key={b.beat_id} className="bg-white border border-[#e5e7eb] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.6rem] bg-[#F0C75E] text-[#081428] px-2 py-0.5 font-semibold">BEAT {b.beat_no}</span>
            <span className="text-xs text-gray-500">Seniors: {b.senior_citizen_count || 0}</span>
          </div>
          <h4 className="text-sm font-semibold text-[#081428] mb-1">{b.area_name}</h4>
          <p className="text-xs text-gray-500">{b.pincode} · {b.assigned_officer_rank} {b.assigned_officer_name}</p>
          {b.assigned_officer_phone && <a href={`tel:${b.assigned_officer_phone}`} className="text-xs text-blue-600 mt-1 block">{b.assigned_officer_phone}</a>}
        </div>
      ))}
      {beats.length === 0 && <p className="text-gray-400 text-sm col-span-2 text-center py-8">No beats configured</p>}
    </div>
  );
}

// ─── Case Diary ───────────────────────────────────────────────────
function CaseDiaryView() {
  const [firs, setFirs] = useState<Record<string,string>[]>([]);
  const [selected, setSelected] = useState<Record<string,string> | null>(null);
  const [entry, setEntry] = useState('');
  const [entries, setEntries] = useState<{ date: string; text: string }[]>([]);
  useEffect(() => {
    apiFetch('firs', { status: 'Investigating', page_size: '50' }).then(d => { if(d?.items) setFirs(d.items); });
  }, []);
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="bg-white border border-[#e5e7eb] overflow-auto max-h-[70vh]">
        <p className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50 uppercase tracking-wider">Active Investigations</p>
        {firs.map(f => (
          <button key={f.fir_id} onClick={() => { setSelected(f); setEntries([]); }}
            className={`w-full text-left px-3 py-2.5 border-b border-[#e5e7eb] text-xs hover:bg-gray-50 ${selected?.fir_id === f.fir_id ? 'bg-[#F0C75E]/10 border-l-2 border-l-[#F0C75E]' : ''}`}>
            <p className="font-mono text-[0.62rem] text-[#A8362A]">{f.fir_number}</p>
            <p className="font-medium text-[#081428] mt-0.5">{f.complainant_name}</p>
            <p className="text-gray-500">{f.crime_category}</p>
          </button>
        ))}
        {firs.length === 0 && <p className="text-gray-400 text-xs text-center py-8">No active investigations</p>}
      </div>
      <div className="bg-white border border-[#e5e7eb] p-4 space-y-3">
        {selected ? (
          <>
            <h4 className="text-xs font-semibold text-[#081428]">Case Diary — {selected.fir_number}</h4>
            <div className="space-y-2 max-h-[40vh] overflow-auto">
              {entries.map((e, i) => (
                <div key={i} className="bg-gray-50 border border-[#e5e7eb] p-2 text-xs">
                  <p className="text-gray-400 text-[0.58rem] mb-0.5">{e.date}</p>
                  <p className="text-[#081428]">{e.text}</p>
                </div>
              ))}
              {entries.length === 0 && <p className="text-gray-400 text-xs">Add daily investigation notes below.</p>}
            </div>
            <textarea value={entry} onChange={e => setEntry(e.target.value)} placeholder="Today's investigation note..."
              className="w-full border border-[#e5e7eb] p-2 text-xs resize-none h-20 focus:border-[#081428] outline-none" />
            <button onClick={() => { if(!entry.trim()) return; setEntries(e => [...e, { date: new Date().toLocaleString('en-IN'), text: entry.trim() }]); setEntry(''); }}
              className="w-full py-2 bg-[#081428] text-white text-xs uppercase tracking-wider hover:bg-[#0F1E36]">
              <Plus size={11} className="inline mr-1" /> Add Entry
            </button>
          </>
        ) : <p className="text-gray-400 text-xs text-center pt-8">Select a case from the left</p>}
      </div>
    </div>
  );
}

// ─── BOLO Alerts ──────────────────────────────────────────────────
function BOLOView() {
  const [wanted, setWanted] = useState<Record<string,string>[]>([]);
  useEffect(() => { apiFetch('wanted').then(d => { if(d) setWanted(d); }); }, []);
  return (
    <div className="space-y-3">
      <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
        <AlertTriangle size={14} /> BOLO — Be On Look Out. Alerts shared across all stations in the range.
      </div>
      {wanted.map(w => (
        <div key={w.wanted_id} className="bg-white border border-[#e5e7eb] p-4 flex items-center gap-4">
          <div className="w-2 h-12 rounded-full bg-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[#081428] text-sm">{w.name}</p>
            <p className="text-xs text-gray-500">{w.crime_category} · {w.last_known_location}</p>
            <p className="text-xs text-gray-400 mt-0.5">FIR: {w.fir_number} · Reward: ₹{parseInt(w.reward_amount || '0').toLocaleString('en-IN')}</p>
          </div>
          <span className="ml-auto text-[0.6rem] px-2 py-0.5 bg-red-50 text-red-700 border border-red-200">WANTED</span>
        </div>
      ))}
      {wanted.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No active BOLO alerts</p>}
    </div>
  );
}


// ─── NOC Applications ─────────────────────────────────────────
function NOCView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const data = await apiFetch('noc_applications');
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const statusColors: Record<string,string> = {
    'Pending':'bg-yellow-50 text-yellow-800 border-yellow-200',
    'Approved':'bg-green-50 text-green-700 border-green-200',
    'Rejected':'bg-red-50 text-red-700 border-red-200',
    'Conditional':'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{items.length} NOC applications</p>
        <button onClick={load} className="text-xs text-[#081428] flex items-center gap-1 hover:underline">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      <div className="bg-white border border-[#e5e7eb] overflow-auto max-h-[70vh]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#081428] text-[#F5F5F0]">
            <tr>{['Applicant','Phone','NOC Type','Purpose','Station','Status','Action'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left uppercase tracking-wider whitespace-nowrap text-[0.6rem]">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {items.map((n, i) => (
              <tr key={n.noc_id || String(i)} className="border-b border-[#e5e7eb] hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-[#081428]">{n.applicant_name}</td>
                <td className="px-3 py-2 text-gray-500">{n.applicant_phone}</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-[#0F1E36] text-[#F0C75E] text-[0.55rem]">{n.noc_type}</span></td>
                <td className="px-3 py-2 text-gray-500 max-w-[140px] truncate">{n.purpose || '—'}</td>
                <td className="px-3 py-2 text-gray-500">{n.station_name || n.station_id}</td>
                <td className="px-3 py-2"><span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[n.status] || ''}`}>{n.status}</span></td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={async () => { await apiPost('update_noc_status', { noc_id: n.noc_id, status: 'Approved', remarks: 'Approved by SHO' }); load(); }}
                      className="px-1.5 py-0.5 text-[0.55rem] bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-colors">Approve</button>
                    <button onClick={async () => { await apiPost('update_noc_status', { noc_id: n.noc_id, status: 'Rejected', remarks: 'Rejected by SHO' }); load(); }}
                      className="px-1.5 py-0.5 text-[0.55rem] bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-colors">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-xs">No NOC applications yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function PoliceDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [counts, setCounts] = useState<Record<string,number>>({});
  const { lang } = useI18nStore();

  useEffect(() => {
    // Load badge counts for sidebar
    Promise.all([
      apiFetch('firs', { status: 'Pending', page_size: '1' }),
      apiFetch('verifications', { type: 'tenant' }),
      apiFetch('event_permissions'),
      apiFetch('missing_persons_all'),
    ]).then(([firs, verifs, events, missing]) => {
      setCounts({
        'fir-inbox': firs?.total || 0,
        'tenant': (verifs || []).filter((v: Record<string,string>) => v.status === 'Pending').length,
        'events': (events || []).filter((e: Record<string,string>) => e.status === 'Pending').length,
        'missing': (missing || []).filter((m: Record<string,string>) => m.status === 'Open').length,
      });
    });
  }, []);

  const title = navItems.find(n => n.key === activeView)?.label || 'Dashboard';

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':   return <DashboardView />;
      case 'fir-inbox':   return <FIRInboxView />;
      case 'elost':       return <ELostView />;
      case 'tenant':      return <VerificationsView />;
      case 'senior':      return <SeniorCitizenView />;
      case 'events':      return <EventsView />;
      case 'missing':     return <MissingView />;
      case 'case-diary':  return <CaseDiaryView />;
      case 'beat-mgmt':   return <BeatMgmtView />;
      case 'criminal-db': return <CriminalDBView />;
      case 'bolo':        return <BOLOView />;
      case 'noc':         return <NOCView />;
      default:            return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F0]">
      <Sidebar active={activeView} onNavigate={setActiveView} counts={counts} />
      <div className="flex-1 p-5 overflow-auto">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-[#081428] uppercase tracking-wider">{title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Karnataka State Police · Station Dashboard · Live from XAMPP DB</p>
        </div>
        {renderView()}
      </div>
    </div>
  );
}
