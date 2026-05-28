import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';
import {
  LayoutDashboard, Map, CheckCircle2, FileText, RefreshCw,
  LogOut, Download, Search, AlertTriangle, Users, Shield,
  BarChart3, MapPin, Phone, Mail, UserCheck, Heart,
  Calendar, UserX, Clock, TrendingUp, Activity, Eye, Lock
} from 'lucide-react';

const API = '/api';
const apiFetch = async (action: string, params: Record<string,string> = {}) => {
  try {
    const url = new URL(API, window.location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
    const r = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j.success ? j.data : null;
  } catch { return null; }
};
const apiPost = async (action: string, body: Record<string,unknown>) => {
  try {
    const res = await fetch(`${API}?action=${action}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    const j = await res.json();
    return j.success ? j.data : null;
  } catch { return null; }
};

const navItems = [
  { key:'overview',   icon: LayoutDashboard, label:'Overview',          labelKn:'ಅವಲೋಕನ' },
  { key:'firs',       icon: FileText,        label:'All FIRs',          labelKn:'ಎಲ್ಲಾ FIR ಗಳು' },
  { key:'elost',      icon: Shield,          label:'e-Lost Reports',    labelKn:'e-ಲೋಸ್ಟ್' },
  { key:'missing',    icon: UserX,           label:'Missing Persons',   labelKn:'ನಾಪತ್ತೆ' },
  { key:'events',     icon: Calendar,        label:'Event Permissions', labelKn:'ಕಾರ್ಯಕ್ರಮ ಅನುಮತಿ' },
  { key:'verifs',     icon: UserCheck,       label:'Verifications',     labelKn:'ಪರಿಶೀಲನೆ' },
  { key:'senior',     icon: Heart,           label:'Senior Citizens',   labelKn:'ಹಿರಿಯ ನಾಗರಿಕರು' },
  { key:'stations',   icon: MapPin,          label:'All Stations',      labelKn:'ಎಲ್ಲಾ ಠಾಣೆಗಳು' },
  { key:'officers',   icon: Users,           label:'Officers / Users',  labelKn:'ಅಧಿಕಾರಿಗಳು' },
  { key:'criminals',  icon: AlertTriangle,   label:'Criminals / Wanted',labelKn:'ಕ್ರಿಮಿನಲ್ / ಬೇಕಾಗಿದೆ' },
  { key:'reports',    icon: BarChart3,       label:'NCRB Reports',      labelKn:'NCRB ವರದಿ' },
  { key:'audit',      icon: Activity,        label:'Audit Log',         labelKn:'ಆಡಿಟ್ ಲಾಗ್' },
  { key:'noc',        icon: Lock,            label:'NOC Applications',  labelKn:'NOC ಅರ್ಜಿಗಳು' },
  { key:'sec144',     icon: AlertTriangle,   label:'Section 144 Orders',labelKn:'ಕಲಂ 144 ಆದೇಶ' },
  { key:'sos',        icon: Shield,          label:'SOS Alerts',        labelKn:'SOS ಎಚ್ಚರಿಕೆ' },
  { key:'perf',       icon: TrendingUp,      label:'Officer Performance',labelKn:'ಅಧಿಕಾರಿ ಕಾರ್ಯಕ್ಷಮತೆ' },
];

// ─── Sidebar ─────────────────────────────────────────────────────
function AdminSidebar({ active, onNavigate, counts }: { active:string; onNavigate:(k:string)=>void; counts:Record<string,number> }) {
  const { user, logout } = useAuthStore();
  const { lang } = useI18nStore();
  return (
    <aside className="w-56 bg-[#081428] min-h-screen flex flex-col border-r border-[#2A3244] flex-shrink-0">
      <div className="p-4 border-b border-[#2A3244]">
        <div className="w-9 h-9 bg-[#A8362A] flex items-center justify-center text-white font-bold mb-2">{user?.name?.[0] || 'A'}</div>
        <p className="text-[#F5F5F0] text-sm font-semibold truncate">{user?.name}</p>
        <p className="text-[#F0C75E] text-xs">{user?.rank} · Admin</p>
        <p className="text-gray-500 text-[0.6rem] mt-0.5 uppercase tracking-wider">Full System Access</p>
      </div>
      <nav className="flex-1 py-1 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.key} onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[0.7rem] uppercase tracking-wider transition-colors text-left ${active === item.key ? 'bg-[#0F1E36] text-[#F0C75E] border-l-2 border-[#F0C75E]' : 'text-gray-400 hover:bg-[#0F1E36] hover:text-[#F5F5F0]'}`}>
            <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 truncate">{lang === 'kn' ? item.labelKn : item.label}</span>
            {counts[item.key] > 0 && <span className="bg-[#A8362A] text-white text-[0.5rem] px-1.5 py-0.5 rounded-sm">{counts[item.key]}</span>}
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

// ─── KPI Card ────────────────────────────────────────────────────
function KPICard({ label, value, color, icon: Icon, sub }: { label:string; value:number|string; color:string; icon:typeof Shield; sub?:string }) {
  return (
    <div className="bg-white border-l-4 p-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-[#081428]">{value ?? '—'}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
          {sub && <p className="text-[0.6rem] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: color + '20' }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────
function OverviewView() {
  const [kpis, setKpis] = useState<Record<string,number>>({});
  const [stationSummary, setStationSummary] = useState<Record<string,string>[]>([]);
  const [distStats, setDistStats] = useState<Record<string,string|number>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch('dashboard_kpis'), apiFetch('station_summary'), apiFetch('district_stats')])
      .then(([k, s, d]) => {
        if (k) setKpis(k);
        if (s) setStationSummary(s.slice(0, 10));
        if (d) setDistStats(d.slice(0, 8));
        setLoading(false);
      });
  }, []);

  const kpiCards = [
    { label:'Total FIRs', value: kpis.total, color:'#A8362A', icon: FileText },
    { label:'Pending FIRs', value: kpis.pending, color:'#F59E0B', icon: Clock },
    { label:'Investigating', value: kpis.solving, color:'#3B82F6', icon: Search },
    { label:'Charge Sheeted', value: kpis.charged, color:'#10B981', icon: CheckCircle2 },
    { label:'Missing Open', value: kpis.missing, color:'#8B5CF6', icon: UserX },
    { label:'Wanted Persons', value: kpis.wanted, color:'#EF4444', icon: AlertTriangle },
    { label:'Senior Citizens', value: kpis.seniors, color:'#F97316', icon: Heart },
    { label:'Total Stations', value: kpis.stations, color:'#6B7280', icon: MapPin },
  ];

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm flex items-center justify-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading live data from database...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(c => <KPICard key={c.label} label={c.label} value={c.value} color={c.color} icon={c.icon} />)}
      </div>

      {/* District stats table */}
      <div className="bg-white border border-[#e5e7eb]">
        <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#081428] uppercase tracking-wider">District-wise Crime Statistics</h3>
          <span className="text-xs text-gray-400">{distStats.length} districts</span>
        </div>
        <div className="overflow-auto max-h-64">
          <table className="w-full text-xs">
            <thead className="bg-[#081428] text-[#F5F5F0] sticky top-0">
              <tr>{['District','Category','Total','Pending','Investigating','ChargeSheeted','Closed'].map(h => (
                <th key={h} className="px-3 py-2 text-left uppercase tracking-wider whitespace-nowrap text-[0.6rem]">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {distStats.map((d, i) => (
                <tr key={i} className="border-b border-[#e5e7eb] hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-[#081428]">{d.district}</td>
                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-[#0F1E36] text-[#F0C75E] text-[0.55rem]">{d.crime_category}</span></td>
                  <td className="px-3 py-2 font-bold text-[#A8362A]">{d.total}</td>
                  <td className="px-3 py-2 text-yellow-700">{d.pending}</td>
                  <td className="px-3 py-2 text-blue-700">{d.investigating}</td>
                  <td className="px-3 py-2 text-green-700">{d.charge_sheeted}</td>
                  <td className="px-3 py-2 text-gray-500">{d.closed}</td>
                </tr>
              ))}
              {distStats.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No data. Import SQL and file complaints to see stats.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crime Heatmap by District */}
      <div className="bg-white border border-[#e5e7eb]">
        <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#081428] uppercase tracking-wider">District Crime Heatmap</h3>
          <span className="text-xs text-gray-400">Circle size = FIR count</span>
        </div>
        <div className="p-4 overflow-x-auto">
          <div className="flex flex-wrap gap-4 items-end min-h-[120px]">
            {distStats.slice(0, 12).map((d, i) => {
              const count = parseInt(String(d.total || 0));
              const maxCount = Math.max(...distStats.slice(0,12).map(x => parseInt(String(x.total||0))));
              const size = Math.max(32, Math.min(96, (count / Math.max(1, maxCount)) * 96));
              const colors = ['#A8362A','#F59E0B','#3B82F6','#10B981','#8B5CF6','#F97316','#06B6D4','#EC4899','#84CC16','#6366F1','#14B8A6','#F43F5E'];
              return (
                <div key={String(d.district)+i} className="flex flex-col items-center gap-1.5">
                  <div className="rounded-full flex items-center justify-center text-white font-bold transition-all hover:scale-110"
                    style={{ width: size, height: size, backgroundColor: colors[i % colors.length], fontSize: size > 50 ? '14px' : '10px' }}
                    title={`${d.district}: ${count} FIRs`}>
                    {count}
                  </div>
                  <p className="text-[0.55rem] text-gray-500 text-center max-w-[60px] leading-tight">{String(d.district).split(' ')[0]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top stations */}
      <div className="bg-white border border-[#e5e7eb]">
        <div className="px-4 py-3 border-b border-[#e5e7eb]">
          <h3 className="text-xs font-bold text-[#081428] uppercase tracking-wider">Station Performance (Top 10 by FIR count)</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#081428] text-[#F5F5F0]">
              <tr>{['Station','District','Total FIRs','Pending','Active','ChargeSheeted','Seniors','Rowdy Sheeters'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left uppercase tracking-wider whitespace-nowrap text-[0.6rem]">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {stationSummary.map(s => (
                <tr key={s.station_id} className="border-b border-[#e5e7eb] hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-[#081428]">{s.name}</td>
                  <td className="px-3 py-2 text-gray-500">{s.district}</td>
                  <td className="px-3 py-2 font-bold text-[#A8362A]">{s.total_firs}</td>
                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[0.55rem]">{s.pending_firs}</span></td>
                  <td className="px-3 py-2">{s.active_firs}</td>
                  <td className="px-3 py-2 text-green-700">{s.charged_firs}</td>
                  <td className="px-3 py-2">{s.registered_seniors}</td>
                  <td className="px-3 py-2 text-[#A8362A] font-semibold">{s.rowdy_sheeters}</td>
                </tr>
              ))}
              {stationSummary.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Generic Admin Table ──────────────────────────────────────────
function AdminTable({ title, items, loading, onRefresh, columns, renderRow, renderActions, exportName }: {
  title:string; items:Record<string,string|number>[]; loading:boolean; onRefresh:()=>void;
  columns:string[]; renderRow:(item:Record<string,string|number>)=>React.ReactNode[];
  renderActions?:(item:Record<string,string|number>)=>React.ReactNode; exportName?:string;
}) {
  const exportCSV = () => {
    const rows = items.map(item => renderRow(item).map(cell => `"${String(cell ?? '').replace(/"/g,'""')}"`).join(','));
    const csv = [columns.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${exportName || title}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{items.length} {title.toLowerCase()}</p>
        <div className="flex gap-2">
          {exportName && (
            <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 border border-[#e5e7eb] text-xs hover:bg-gray-50">
              <Download size={11} /> Export CSV
            </button>
          )}
          <button onClick={onRefresh} className="text-xs text-[#081428] flex items-center gap-1 hover:underline">
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>
      <div className="bg-white border border-[#e5e7eb] overflow-auto max-h-[68vh]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#081428] text-[#F5F5F0]">
            <tr>
              {columns.map(c => <th key={c} className="px-3 py-2.5 text-left uppercase tracking-wider whitespace-nowrap text-[0.62rem]">{c}</th>)}
              {renderActions && <th className="px-3 py-2.5 text-left uppercase tracking-wider text-[0.62rem]">Action</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={String(item.id || item.fir_id || item.station_id || item.user_id || item.criminal_id || i)}
                className="border-b border-[#e5e7eb] hover:bg-gray-50">
                {renderRow(item).map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}
                {renderActions && <td className="px-3 py-2">{renderActions(item)}</td>}
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-10 text-center text-gray-400">No data found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── All FIRs ─────────────────────────────────────────────────────
function AllFIRsView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = { page_size:'200' };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    const d = await apiFetch('firs', params);
    setItems(d?.items || []);
    setLoading(false);
  }, [search, statusFilter]);
  useEffect(() => { load(); }, [load]);
  const statusColors: Record<string,string> = { 'Pending':'bg-yellow-50 text-yellow-800 border-yellow-200', 'Investigating':'bg-blue-50 text-blue-800 border-blue-200', 'ChargeSheeted':'bg-green-50 text-green-800 border-green-200', 'Closed':'bg-gray-50 text-gray-600 border-gray-200', 'Referred':'bg-purple-50 text-purple-800 border-purple-200' };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FIR / name / description..."
            className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] outline-none text-xs focus:border-[#081428]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-2 border border-[#e5e7eb] text-xs bg-white outline-none">
          <option value="">All Status</option>
          {['Pending','Investigating','ChargeSheeted','Closed','Referred'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={load} className="px-3 py-2 bg-[#081428] text-white text-xs flex items-center gap-1">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={() => { const csv = ['FIR No,Date,Complainant,Phone,Category,Status,Station,District', ...items.map(f => `"${f.fir_number}","${f.created_at}","${f.complainant_name}","${f.complainant_phone}","${f.crime_category}","${f.status}","${f.station_name}","${f.district}"`)].join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='FIRs_NCRB.csv'; a.click(); }}
          className="px-3 py-2 border border-[#081428] text-[#081428] text-xs flex items-center gap-1 hover:bg-[#081428] hover:text-white transition-colors">
          <Download size={11} /> Export NCRB CSV
        </button>
      </div>
      <p className="text-xs text-gray-500">{items.length} FIRs</p>
      <div className="bg-white border border-[#e5e7eb] overflow-auto max-h-[65vh]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#081428] text-[#F5F5F0]">
            <tr>{['FIR No.','Date','Complainant','Phone','Category','Sub-Category','Station','District','Status','Update'].map(h => (
              <th key={h} className="px-2.5 py-2.5 text-left uppercase tracking-wider whitespace-nowrap text-[0.6rem]">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {items.map(fir => (
              <tr key={fir.fir_id} className="border-b border-[#e5e7eb] hover:bg-gray-50">
                <td className="px-2.5 py-2 font-mono text-[0.58rem] text-[#A8362A]">{fir.fir_number}</td>
                <td className="px-2.5 py-2 text-gray-500 whitespace-nowrap">{fir.created_at ? new Date(fir.created_at).toLocaleDateString('en-IN') : '—'}</td>
                <td className="px-2.5 py-2 font-medium text-[#081428]">{fir.complainant_name}</td>
                <td className="px-2.5 py-2 text-gray-500">{fir.complainant_phone}</td>
                <td className="px-2.5 py-2"><span className="px-1.5 py-0.5 bg-[#0F1E36] text-[#F0C75E] text-[0.5rem]">{fir.crime_category}</span></td>
                <td className="px-2.5 py-2 text-gray-600 max-w-[100px] truncate">{fir.sub_category}</td>
                <td className="px-2.5 py-2 text-gray-600">{fir.station_name}</td>
                <td className="px-2.5 py-2 text-gray-500">{fir.district}</td>
                <td className="px-2.5 py-2"><span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[fir.status] || ''}`}>{fir.status}</span></td>
                <td className="px-2.5 py-2">
                  <select value={fir.status} onChange={async e => { await apiPost('update_fir_status', { fir_id: fir.fir_id, status: e.target.value, officer_id: 'admin' }); load(); }}
                    className="text-[0.58rem] border border-[#e5e7eb] bg-white px-1 py-0.5 outline-none">
                    {['Pending','Investigating','ChargeSheeted','Closed','Referred'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && <tr><td colSpan={10} className="py-10 text-center text-gray-400">No FIRs found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── All Stations ─────────────────────────────────────────────────
function StationsView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = { limit: '200' };
    if (search) params.search = search;
    const d = await apiFetch('stations', params);
    setItems(d || []);
    setLoading(false);
  }, [search]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by station, district, pincode..."
            className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] outline-none text-xs focus:border-[#081428]" />
        </div>
        <button onClick={load} className="px-3 py-2 bg-[#081428] text-white text-xs flex items-center gap-1">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Search
        </button>
      </div>
      <p className="text-xs text-gray-500">{items.length} stations (Kolar/South Karnataka shown first)</p>
      <AdminTable title="Stations" items={items} loading={loading} onRefresh={load}
        columns={['Station','District','Taluk','Pincode','Phone','SHO','Type']}
        renderRow={item => [
          <span className={`font-medium ${item.district === 'Kolar' ? 'text-[#A8362A]' : 'text-[#081428]'}`}>{item.name}</span>,
          item.district,
          item.taluk,
          item.pincode,
          <a href={`tel:${item.phone}`} className="text-blue-600">{item.phone}</a>,
          item.sho_name || '—',
          <span className={`px-1.5 py-0.5 text-[0.5rem] border ${item.jurisdiction_type === 'commissionerate' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{item.jurisdiction_type}</span>,
        ]}
        exportName="Stations_Karnataka" />
    </div>
  );
}

// ─── Officers / Users ─────────────────────────────────────────────
function OfficersView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    // Get all police users from users table via custom endpoint
    const d = await apiFetch('admin_users');
    if (d) setItems(d);
    else {
      // Fallback: show from local users data
      const { users } = await import('@/data/users');
      setItems(users.map(u => ({ ...u, password_hash: '***' })) as unknown as Record<string,string>[]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const roleColors: Record<string,string> = { 'admin':'bg-red-50 text-red-700 border-red-200', 'police':'bg-blue-50 text-blue-700 border-blue-200', 'citizen':'bg-green-50 text-green-700 border-green-200' };
  return (
    <AdminTable title="Officers & Users" items={items} loading={loading} onRefresh={load}
      columns={['Name','Email','Phone','Role','Rank','Badge No','Station/Unit']}
      renderRow={item => [
        <span className="font-medium text-[#081428]">{item.name}</span>,
        <span className="text-gray-500 text-[0.65rem]">{item.email}</span>,
        item.phone || '—',
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${roleColors[item.role] || ''}`}>{item.role}</span>,
        item.rank || '—',
        item.badge_no || '—',
        item.station_id || item.unit_id || '—',
      ]}
      exportName="Officers_Karnataka" />
  );
}

// ─── Missing Persons ──────────────────────────────────────────────
function MissingView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const d = await apiFetch('missing_persons_all');
    setItems(d || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const statusColors: Record<string,string> = { 'Open':'bg-red-50 text-red-700 border-red-200', 'Traced':'bg-green-50 text-green-700 border-green-200', 'Closed':'bg-gray-50 text-gray-600 border-gray-200' };
  return (
    <AdminTable title="Missing Persons" items={items} loading={loading} onRefresh={load}
      columns={['Name','Age','Gender','Date Missing','Last Seen','Contact','Station','Status']}
      renderRow={item => [
        <span className="font-semibold text-[#081428]">{item.name}</span>,
        item.age,
        item.gender,
        item.date_missing,
        <span className="max-w-[120px] block truncate text-gray-500">{item.last_seen_location}</span>,
        <a href={`tel:${item.contact_number}`} className="text-blue-600">{item.contact_number}</a>,
        item.station_name || '—',
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[item.status] || ''}`}>{item.status}</span>,
      ]}
      renderActions={item => (
        <div className="flex gap-1">
          <button onClick={async () => { await apiPost('update_missing_status', { missing_id: item.missing_id, status: 'Traced' }); load(); }} className="px-2 py-0.5 text-[0.55rem] bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-colors">Traced</button>
          <button onClick={async () => { await apiPost('update_missing_status', { missing_id: item.missing_id, status: 'Closed' }); load(); }} className="px-2 py-0.5 text-[0.55rem] bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-600 hover:text-white transition-colors">Close</button>
        </div>
      )}
      exportName="Missing_Persons" />
  );
}

// ─── e-Lost ───────────────────────────────────────────────────────
function ELostView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const d = await apiFetch('lost_articles'); setItems(d || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const statusColors: Record<string,string> = { 'Reported':'bg-yellow-50 text-yellow-800 border-yellow-200', 'Found':'bg-green-50 text-green-700 border-green-200', 'Closed':'bg-gray-50 text-gray-600 border-gray-200' };
  return (
    <AdminTable title="e-Lost Reports" items={items} loading={loading} onRefresh={load}
      columns={['Ref No.','Date','Applicant','Phone','Article','Description','Station','Status']}
      renderRow={item => [
        <span className="font-mono text-[0.6rem] text-[#A8362A]">{item.report_number}</span>,
        item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '—',
        item.applicant_name,
        item.applicant_phone,
        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[0.55rem]">{item.article_type}</span>,
        <span className="max-w-[120px] block truncate text-gray-500">{item.article_description}</span>,
        item.station_id || '—',
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[item.status] || ''}`}>{item.status}</span>,
      ]}
      renderActions={item => (
        <select value={item.status} onChange={async e => { await apiPost('update_lost_status', { report_id: item.report_id, status: e.target.value }); load(); }}
          className="text-[0.6rem] border border-[#e5e7eb] bg-white px-1 py-0.5 outline-none">
          {['Reported','Found','Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
      )}
      exportName="eLost_Reports" />
  );
}

// ─── Verifications ────────────────────────────────────────────────
function VerifsView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const d = await apiFetch('verifications'); setItems(d || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const statusColors: Record<string,string> = { 'Pending':'bg-yellow-50 text-yellow-800 border-yellow-200', 'Verified':'bg-green-50 text-green-700 border-green-200', 'Rejected':'bg-red-50 text-red-700 border-red-200' };
  return (
    <AdminTable title="Verification Requests" items={items} loading={loading} onRefresh={load}
      columns={['Landlord','Phone','Tenant','Tenant Phone','Rental Address','ID','Status']}
      renderRow={item => [
        <span className="font-medium text-[#081428]">{item.landlord_name}</span>,
        item.landlord_phone,
        item.tenant_name,
        item.tenant_phone,
        <span className="max-w-[120px] block truncate text-gray-500">{item.rental_address}</span>,
        `${item.id_type}: ${item.id_number}`,
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[item.status] || ''}`}>{item.status}</span>,
      ]}
      renderActions={item => (
        <div className="flex gap-1">
          <button onClick={async () => { await apiPost('update_verification', { verify_id: item.verify_id, status: 'Verified' }); load(); }} className="px-2 py-0.5 text-[0.55rem] bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-colors">Verify</button>
          <button onClick={async () => { await apiPost('update_verification', { verify_id: item.verify_id, status: 'Rejected' }); load(); }} className="px-2 py-0.5 text-[0.55rem] bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-colors">Reject</button>
        </div>
      )}
      exportName="Verifications" />
  );
}

// ─── Senior Citizens ──────────────────────────────────────────────
function SeniorView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const d = await apiFetch('senior_citizens'); setItems(d || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const today = new Date().toISOString().split('T')[0];
  return (
    <AdminTable title="Senior Citizens" items={items} loading={loading} onRefresh={load}
      columns={['Name','Age','Phone','Address','Medical','Emergency Contact','Station','Last Visit']}
      renderRow={item => [
        <span className="font-medium text-[#081428]">{item.name}</span>,
        item.age,
        <a href={`tel:${item.phone}`} className="text-blue-600">{item.phone}</a>,
        <span className="max-w-[140px] block truncate text-gray-500">{item.address}</span>,
        <span className="max-w-[100px] block truncate text-gray-500">{item.medical_conditions || '—'}</span>,
        item.local_contact_name ? `${item.local_contact_name} (${item.local_contact_phone})` : '—',
        item.station_name || item.station_id || '—',
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${item.last_visit_date === today ? 'bg-green-50 text-green-700 border-green-200' : !item.last_visit_date ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{item.last_visit_date || 'Never visited'}</span>,
      ]}
      exportName="Senior_Citizens" />
  );
}

// ─── Events ───────────────────────────────────────────────────────
function EventsView() {
  const [items, setItems] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const d = await apiFetch('event_permissions'); setItems(d || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const statusColors: Record<string,string> = { 'Pending':'bg-yellow-50 text-yellow-800 border-yellow-200', 'Approved':'bg-green-50 text-green-700 border-green-200', 'Rejected':'bg-red-50 text-red-700 border-red-200', 'Conditional':'bg-blue-50 text-blue-700 border-blue-200' };
  return (
    <AdminTable title="Event Permissions" items={items} loading={loading} onRefresh={load}
      columns={['Applicant','Phone','Event Type','Event Name','Date','Crowd','Venue','Status']}
      renderRow={item => [
        <span className="font-medium text-[#081428]">{item.applicant_name}</span>,
        item.phone,
        <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 text-[0.55rem]">{item.event_type}</span>,
        item.event_name,
        item.event_date,
        item.expected_crowd ? `${item.expected_crowd}` : '—',
        <span className="max-w-[100px] block truncate text-gray-500">{item.venue}</span>,
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[item.status] || ''}`}>{item.status}</span>,
      ]}
      renderActions={item => (
        <div className="flex gap-1">
          <button onClick={async () => { await apiPost('update_event_status', { perm_id: item.perm_id, status: 'Approved', conditions: '' }); load(); }} className="px-2 py-0.5 text-[0.55rem] bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-colors">Approve</button>
          <button onClick={async () => { await apiPost('update_event_status', { perm_id: item.perm_id, status: 'Rejected', conditions: '' }); load(); }} className="px-2 py-0.5 text-[0.55rem] bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-colors">Reject</button>
        </div>
      )}
      exportName="Event_Permissions" />
  );
}

// ─── Criminals / Wanted ───────────────────────────────────────────
function CriminalsView() {
  const [criminals, setCriminals] = useState<Record<string,string>[]>([]);
  const [wanted, setWanted] = useState<Record<string,string>[]>([]);
  const [tab, setTab] = useState<'criminals'|'wanted'>('criminals');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    Promise.all([apiFetch('criminals'), apiFetch('wanted')]).then(([c, w]) => {
      if (c) setCriminals(c);
      if (w) setWanted(w);
      setLoading(false);
    });
  }, []);
  const items = tab === 'criminals' ? criminals : wanted;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['criminals','wanted'].map(t => (
          <button key={t} onClick={() => setTab(t as typeof tab)}
            className={`px-4 py-2 text-xs uppercase tracking-wider border transition-colors ${tab === t ? 'bg-[#081428] text-white border-[#081428]' : 'border-[#e5e7eb] text-gray-600 hover:border-[#081428]'}`}>
            {t === 'criminals' ? `Rowdy / History Sheeters (${criminals.length})` : `Wanted Persons (${wanted.length})`}
          </button>
        ))}
      </div>
      {tab === 'criminals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criminals.map(c => (
            <div key={c.criminal_id} className="bg-white border border-[#e5e7eb] p-4">
              <div className="flex gap-3 mb-2">
                <div className="w-11 h-11 bg-[#0F1E36] flex items-center justify-center text-[#F0C75E] text-lg font-bold flex-shrink-0">{c.name?.[0]}</div>
                <div>
                  <h3 className="text-sm font-semibold text-[#081428]">{c.name}</h3>
                  <p className="text-xs text-gray-500">{c.aliases}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.is_rowdy_sheeter === '1' && <span className="text-[0.5rem] px-1 py-0.5 bg-[#A8362A] text-white">ROWDY</span>}
                    {c.is_history_sheeter === '1' && <span className="text-[0.5rem] px-1 py-0.5 bg-[#F0C75E] text-[#081428]">HISTORY</span>}
                    {c.goonda_act === '1' && <span className="text-[0.5rem] px-1 py-0.5 bg-[#7C2D12] text-white">GOONDA</span>}
                    {c.kcoca === '1' && <span className="text-[0.5rem] px-1 py-0.5 bg-[#581C87] text-white">KCOCA</span>}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">Cases: <strong>{c.cases_count}</strong></p>
              <p className="text-xs text-gray-400">{c.last_known_location}</p>
            </div>
          ))}
          {!loading && criminals.length === 0 && <p className="text-gray-400 text-sm col-span-3 text-center py-8">No criminals in database</p>}
        </div>
      )}
      {tab === 'wanted' && (
        <div className="space-y-3">
          {wanted.map(w => (
            <div key={w.wanted_id} className="bg-white border border-[#e5e7eb] p-4 flex items-center gap-4">
              <div className="w-2 h-12 rounded-full bg-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[#081428] text-sm">{w.name}</p>
                <p className="text-xs text-gray-500">{w.aliases && `Alias: ${w.aliases} · `}{w.crime_category}</p>
                <p className="text-xs text-gray-400">FIR: {w.fir_number} · Last: {w.last_known_location}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#A8362A]">₹{parseInt(w.reward_amount || '0').toLocaleString('en-IN')}</p>
                <p className="text-[0.6rem] text-gray-400">Reward</p>
              </div>
              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[0.6rem] font-semibold">WANTED</span>
            </div>
          ))}
          {!loading && wanted.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No wanted persons</p>}
        </div>
      )}
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────
function ReportsView() {
  const [distStats, setDistStats] = useState<Record<string,string|number>[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setLoading(true); apiFetch('district_stats').then(d => { if(d) setDistStats(d); setLoading(false); }); }, []);
  const exportCSV = () => {
    const headers = ['District','Crime Category','Total','Pending','Investigating','Charge Sheeted','Closed'];
    const rows = distStats.map(d => [d.district,d.crime_category,d.total,d.pending,d.investigating,d.charge_sheeted,d.closed].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = 'SurakshaKarnataka_NCRB_Report.csv'; a.click();
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#081428]">NCRB-Format Crime Statistics — All Karnataka</h3>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#081428] text-white text-xs uppercase tracking-wider hover:bg-[#0F1E36]">
          <Download size={12} /> Export NCRB CSV
        </button>
      </div>
      <AdminTable title="Crime Stats" items={distStats} loading={loading} onRefresh={() => { setLoading(true); apiFetch('district_stats').then(d => { if(d) setDistStats(d); setLoading(false); }); }}
        columns={['District','Category','Total','Pending','Investigating','Charge Sheeted','Closed']}
        renderRow={item => [
          <span className="font-medium text-[#081428]">{item.district}</span>,
          <span className="px-1.5 py-0.5 bg-[#0F1E36] text-[#F0C75E] text-[0.55rem]">{item.crime_category}</span>,
          <span className="font-bold text-[#A8362A]">{item.total}</span>,
          <span className="text-yellow-700">{item.pending}</span>,
          <span className="text-blue-700">{item.investigating}</span>,
          <span className="text-green-700">{item.charge_sheeted}</span>,
          <span className="text-gray-500">{item.closed}</span>,
        ]}
        exportName="NCRB_Karnataka" />
    </div>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────
function AuditView() {
  const [logs, setLogs] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setLoading(true); apiFetch('audit_log').then(d => { if(d) setLogs(d); setLoading(false); }); }, []);
  const roleColors: Record<string,string> = { 'admin':'bg-red-50 text-red-700', 'police':'bg-blue-50 text-blue-700', 'citizen':'bg-green-50 text-green-700' };
  return (
    <AdminTable title="Audit Log Entries" items={logs} loading={loading}
      onRefresh={() => { setLoading(true); apiFetch('audit_log').then(d => { if(d) setLogs(d); setLoading(false); }); }}
      columns={['Time','User','Role','Action','Entity','Details']}
      renderRow={item => [
        <span className="text-gray-400 text-[0.6rem] whitespace-nowrap">{item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : '—'}</span>,
        <span className="font-mono text-[0.6rem]">{item.user_id}</span>,
        <span className={`px-1.5 py-0.5 text-[0.55rem] rounded ${roleColors[item.user_role] || ''}`}>{item.user_role}</span>,
        <span className="font-mono text-[0.6rem] text-[#A8362A]">{item.action}</span>,
        <span className="text-gray-600">{item.entity_type}: {item.entity_id}</span>,
        <span className="text-gray-400 max-w-[160px] block truncate text-[0.6rem]">{item.new_values}</span>,
      ]} />
  );
}


// ─── NOC Applications (Admin) ─────────────────────────────────
function AdminNOCView() {
  const [items, setItems] = useState<Record<string,string|number>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const d = await apiFetch('noc_applications'); setItems(d || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const statusColors: Record<string,string> = {
    'Pending':'bg-yellow-50 text-yellow-800 border-yellow-200',
    'Approved':'bg-green-50 text-green-700 border-green-200',
    'Rejected':'bg-red-50 text-red-700 border-red-200',
    'Conditional':'bg-blue-50 text-blue-700 border-blue-200'
  };
  return (
    <AdminTable title="NOC Applications" items={items} loading={loading} onRefresh={load}
      columns={['Applicant','Phone','NOC Type','Purpose','Date of Birth','Station','Status']}
      renderRow={item => [
        <span className="font-medium text-[#081428]">{item.applicant_name}</span>,
        item.applicant_phone,
        <span className="px-1.5 py-0.5 bg-[#0F1E36] text-[#F0C75E] text-[0.55rem]">{item.noc_type}</span>,
        <span className="max-w-[120px] block truncate text-gray-500">{item.purpose || '—'}</span>,
        String(item.date_of_birth || '—'),
        String(item.station_name || item.station_id),
        <span className={`px-1.5 py-0.5 border text-[0.55rem] ${statusColors[String(item.status)] || ''}`}>{item.status}</span>,
      ]}
      renderActions={item => (
        <div className="flex gap-1">
          <button onClick={async () => { await apiPost('update_noc_status', { noc_id: item.noc_id, status: 'Approved', remarks: 'Approved by Admin' }); load(); }}
            className="px-2 py-0.5 text-[0.55rem] bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-colors">Approve</button>
          <button onClick={async () => { await apiPost('update_noc_status', { noc_id: item.noc_id, status: 'Rejected', remarks: '' }); load(); }}
            className="px-2 py-0.5 text-[0.55rem] bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-colors">Reject</button>
        </div>
      )}
      exportName="NOC_Applications" />
  );
}


// ─── Section 144 Orders ────────────────────────────────────────
function Section144View() {
  const [orders, setOrders] = useState<Record<string,string|number>[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ district:'Kolar', area_description:'', pincode:'', reason:'', start_datetime:'', end_datetime:'', issued_by:'SP', issued_by_rank:'SP' });
  const load = async () => { setLoading(true); const d = await apiFetch('section144', { active:'0' }); setOrders(d || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 p-4">
        <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3">Issue New Section 144 Order</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[['District','district'],['Area Description','area_description'],['Pincode','pincode'],['Reason','reason'],['Start','start_datetime'],['End','end_datetime'],['Issued By','issued_by'],['Rank','issued_by_rank']].map(([label,key]) => (
            <div key={key}>
              <p className="text-gray-500 mb-0.5 uppercase tracking-wider text-[0.6rem]">{label}</p>
              <input type={key.includes('datetime') ? 'datetime-local' : 'text'} value={String(form[key as keyof typeof form])}
                onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                className="w-full px-2 py-1.5 border border-red-200 outline-none focus:border-red-500 bg-white text-xs" />
            </div>
          ))}
        </div>
        <button onClick={async () => {
          if (!form.district || !form.reason || !form.start_datetime || !form.end_datetime) { alert('Fill all fields'); return; }
          await apiPost('issue_section144', form);
          load();
          setForm({ district:'Kolar', area_description:'', pincode:'', reason:'', start_datetime:'', end_datetime:'', issued_by:'SP', issued_by_rank:'SP' });
        }} className="mt-3 px-4 py-2 bg-red-700 text-white text-xs uppercase tracking-wider hover:bg-red-800 transition-colors">
          Issue Section 144 Order
        </button>
      </div>
      <AdminTable title="Section 144 Orders" items={orders} loading={loading} onRefresh={load}
        columns={['District','Area','Valid From','Valid To','Issued By','Status']}
        renderRow={item => [
          <span className="font-medium text-[#081428]">{item.district}</span>,
          <span className="max-w-[140px] block truncate text-gray-500">{item.area_description}</span>,
          String(item.start_datetime),
          String(item.end_datetime),
          `${item.issued_by} (${item.issued_by_rank})`,
          <span className={`px-1.5 py-0.5 border text-[0.55rem] ${item.is_active === '1' || item.is_active === 1 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{item.is_active === '1' || item.is_active === 1 ? 'Active' : 'Revoked'}</span>,
        ]}
        renderActions={item => (
          item.is_active === '1' || item.is_active === 1 ? (
            <button onClick={async () => { await apiPost('revoke_section144', { order_id: item.order_id }); load(); }}
              className="px-2 py-0.5 text-[0.55rem] bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-colors">Revoke</button>
          ) : <span className="text-gray-400 text-[0.55rem]">Revoked</span>
        )} />
    </div>
  );
}

// ─── SOS Alerts (Admin) ────────────────────────────────────────
function SOSAlertsView() {
  const [alerts, setAlerts] = useState<Record<string,string|number>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const d = await apiFetch('sos_alerts'); setAlerts(d || []); setLoading(false); };
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Live SOS Alerts — Auto-refreshes every 30s</p>
        </div>
        <button onClick={load} className="text-xs text-[#081428] flex items-center gap-1"><RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>
      {alerts.length === 0 && !loading && <div className="bg-green-50 border border-green-200 p-4 text-center text-green-700 text-xs">✓ No active SOS alerts</div>}
      {alerts.map(a => (
        <div key={String(a.alert_id)} className={`border p-4 ${a.status === 'Active' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${a.status === 'Active' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-bold text-[#081428]">{a.user_name} — {a.user_phone}</span>
            </div>
            <span className="text-[0.6rem] text-gray-400">{new Date(String(a.created_at)).toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-gray-600">{a.location_description || 'Location not provided'}</p>
          {a.nearest_station_id && <p className="text-xs text-blue-600 mt-0.5">Nearest station: {a.nearest_station_id}</p>}
          {a.beat_officer_phone && <p className="text-xs text-green-700 mt-0.5">Beat officer: <a href={`tel:${a.beat_officer_phone}`} className="underline">{a.beat_officer_phone}</a></p>}
          {a.status === 'Active' && (
            <button onClick={async () => { await apiPost('update_sos_status', { alert_id: a.alert_id, status: 'Responded' }); load(); }}
              className="mt-2 px-3 py-1 bg-green-600 text-white text-[0.6rem] uppercase tracking-wider hover:bg-green-700 transition-colors">Mark Responded</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Officer Performance ───────────────────────────────────────
function OfficerPerformanceView() {
  const [data, setData] = useState<Record<string,string|number>[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const d = await apiFetch('officer_performance'); setData(d || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Officers Tracked', val: data.length },
          { label: 'Avg Resolution Rate', val: data.length ? Math.round(data.reduce((s, d) => s + parseFloat(String(d.resolution_rate || 0)), 0) / data.length) + '%' : '—' },
          { label: 'Total Cases', val: data.reduce((s, d) => s + parseInt(String(d.total_assigned || 0)), 0) },
        ].map(c => (
          <div key={c.label} className="bg-white border-l-4 border-[#081428] p-3">
            <p className="text-xl font-bold text-[#081428]">{c.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
      <AdminTable title="Officer Performance" items={data} loading={loading} onRefresh={load}
        columns={['Officer','Rank','Station','Total','Resolved','Pending','Resolution Rate','Avg Days']}
        renderRow={item => [
          <span className="font-medium text-[#081428]">{item.officer_name || 'Unassigned'}</span>,
          item.officer_rank || '—',
          <span className="max-w-[100px] block truncate text-gray-500">{item.station_name}</span>,
          <span className="font-bold">{item.total_assigned}</span>,
          <span className="text-green-700">{item.resolved}</span>,
          <span className="text-yellow-700">{item.pending}</span>,
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(String(item.resolution_rate || 0)))}%` }} />
            </div>
            <span className="font-bold text-green-700">{item.resolution_rate}%</span>
          </div>,
          `${item.avg_days_to_resolve} days`,
        ]}
        exportName="Officer_Performance" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [counts, setCounts] = useState<Record<string,number>>({});
  const { lang } = useI18nStore();

  useEffect(() => {
    Promise.all([apiFetch('dashboard_kpis'), apiFetch('missing_persons_all'), apiFetch('event_permissions'), apiFetch('verifications')]).then(([kpis, missing, events, verifs]) => {
      setCounts({
        firs: kpis?.pending || 0,
        missing: (missing || []).filter((m: Record<string,string>) => m.status === 'Open').length,
        events: (events || []).filter((e: Record<string,string>) => e.status === 'Pending').length,
        verifs: (verifs || []).filter((v: Record<string,string>) => v.status === 'Pending').length,
      });
    });
  }, []);

  const title = navItems.find(n => n.key === activeView)?.label || 'Overview';

  const renderView = () => {
    switch (activeView) {
      case 'overview':  return <OverviewView />;
      case 'firs':      return <AllFIRsView />;
      case 'elost':     return <ELostView />;
      case 'missing':   return <MissingView />;
      case 'events':    return <EventsView />;
      case 'verifs':    return <VerifsView />;
      case 'senior':    return <SeniorView />;
      case 'stations':  return <StationsView />;
      case 'officers':  return <OfficersView />;
      case 'criminals': return <CriminalsView />;
      case 'reports':   return <ReportsView />;
      case 'audit':     return <AuditView />;
      case 'noc':       return <AdminNOCView />;
      case 'sec144':    return <Section144View />;
      case 'sos':       return <SOSAlertsView />;
      case 'perf':      return <OfficerPerformanceView />;
      default:          return <OverviewView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F0]">
      <AdminSidebar active={activeView} onNavigate={setActiveView} counts={counts} />
      <div className="flex-1 p-5 overflow-auto">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-[#081428] uppercase tracking-wider">{title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Karnataka State Police · Admin Command Dashboard · Live from XAMPP MySQL</p>
        </div>
        {renderView()}
      </div>
    </div>
  );
}
