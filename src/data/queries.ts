import { stations, officers, firs, criminals, users, units } from './index';
import type { PoliceStation, Officer, FIR, Criminal, User, DistrictStats, CrimeCategory, FIRStatus } from '@/types';

// Haversine formula to calculate distance between two lat/lng points
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get nearest police stations
export function getNearestStations(lat: number, lng: number, limit: number = 3): Array<PoliceStation & { distance: number }> {
  return stations
    .map(station => ({
      ...station,
      distance: haversineDistance(lat, lng, station.lat, station.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

// Get stations by district
export function getStationsByDistrict(district: string): PoliceStation[] {
  return stations.filter(s => s.district.toLowerCase().includes(district.toLowerCase()));
}

// Get station by ID
export function getStationById(stationId: string): PoliceStation | undefined {
  return stations.find(s => s.station_id === stationId);
}

// Get officers by station
export function getOfficersByStation(stationId: string): Officer[] {
  return officers.filter(o => o.station_id === stationId);
}

// Get officer by ID
export function getOfficerById(officerId: string): Officer | undefined {
  return officers.find(o => o.officer_id === officerId);
}

// Get FIR by number
export function getFIRByNumber(firNumber: string): FIR | undefined {
  return firs.find(f => f.fir_number.toLowerCase() === firNumber.toLowerCase());
}

// Get FIRs with filters
export function getFIRs(filters?: {
  stationId?: string;
  status?: FIRStatus;
  category?: CrimeCategory;
  search?: string;
  page?: number;
  pageSize?: number;
}): { data: FIR[]; total: number; page: number; pageSize: number } {
  let result = [...firs];

  if (filters?.stationId) {
    result = result.filter(f => f.station_id === filters.stationId);
  }
  if (filters?.status) {
    result = result.filter(f => f.status === filters.status);
  }
  if (filters?.category) {
    result = result.filter(f => f.crime_category === filters.category);
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(f =>
      f.fir_number.toLowerCase().includes(search) ||
      f.complainant_name.toLowerCase().includes(search) ||
      f.incident_description.toLowerCase().includes(search)
    );
  }

  const total = result.length;
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const start = (page - 1) * pageSize;
  const data = result.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

// Get FIR status timeline (simulated)
export function getFIRTimeline(firId: string) {
  const fir = firs.find(f => f.fir_id === firId);
  if (!fir) return [];

  const timeline: Array<{ step: number; title: string; title_kn: string; timestamp: string; status: 'completed' | 'current'; description: string }> = [
    { step: 1, title: 'FIR Registered', title_kn: 'ದೂರು ದಾಖಲಾಗಿದೆ', timestamp: fir.created_at, status: 'completed', description: `FIR ${fir.fir_number} registered at ${getStationById(fir.station_id)?.name || 'Unknown Station'}` },
  ];

  if (fir.assigned_officer_id) {
    const officer = getOfficerById(fir.assigned_officer_id);
    timeline.push({
      step: 2,
      title: 'Assigned to IO',
      title_kn: 'ತನಿಖಾಧಿಕಾರಿಗೆ ನಿಯುಕ್ತಿ',
      timestamp: new Date(new Date(fir.created_at).getTime() + 86400000).toISOString(),
      status: 'completed',
      description: `Assigned to ${officer?.name || 'Investigating Officer'} (${officer?.badge_no || ''})`,
    });
  }

  if (fir.status === 'Investigating' || fir.status === 'ChargeSheeted' || fir.status === 'Closed' || fir.status === 'Referred') {
    timeline.push({
      step: 3,
      title: 'Under Investigation',
      title_kn: 'ತನಿಖೆಯ ಹಂತದಲ್ಲಿದೆ',
      timestamp: new Date(new Date(fir.created_at).getTime() + 172800000).toISOString(),
      status: fir.status === 'Investigating' ? 'current' : 'completed',
      description: 'Investigation is ongoing. Statements recorded, evidence collected.',
    });
  }

  if (fir.status === 'ChargeSheeted' || fir.status === 'Closed') {
    timeline.push({
      step: 4,
      title: 'Charge Sheet Filed',
      title_kn: 'ದೋಷಾರೋಪಣ ಪಟ್ಟಿ ಸಲ್ಲಿಕೆ',
      timestamp: fir.updated_at,
      status: fir.status === 'ChargeSheeted' ? 'current' : 'completed',
      description: 'Charge sheet filed before the competent court.',
    });
  }

  if (fir.status === 'Closed') {
    timeline.push({
      step: 5,
      title: 'Case Closed',
      title_kn: 'ಪ್ರಕರಣ ಮುಚ್ಚಲಾಗಿದೆ',
      timestamp: fir.updated_at,
      status: 'completed',
      description: 'Case closed after judicial proceedings.',
    });
  }

  if (fir.status === 'Referred') {
    timeline.push({
      step: 4,
      title: 'Referred to Higher Authority',
      title_kn: 'ಉನ್ನತ ಅಧಿಕಾರಿಗೆ ಒಪ್ಪಿಸಲಾಗಿದೆ',
      timestamp: fir.updated_at,
      status: 'current',
      description: 'Case referred to CID/Special Wing for further investigation.',
    });
  }

  return timeline;
}

// Get criminals with filters
export function getCriminals(filters?: {
  stationId?: string;
  rowdy?: boolean;
  history?: boolean;
  goonda?: boolean;
  kcoca?: boolean;
  search?: string;
}): Criminal[] {
  let result = [...criminals];

  if (filters?.stationId) {
    result = result.filter(c => c.station_id === filters.stationId);
  }
  if (filters?.rowdy) {
    result = result.filter(c => c.is_rowdy_sheeter);
  }
  if (filters?.history) {
    result = result.filter(c => c.is_history_sheeter);
  }
  if (filters?.goonda) {
    result = result.filter(c => c.goonda_act);
  }
  if (filters?.kcoca) {
    result = result.filter(c => c.kcoca);
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.aliases.toLowerCase().includes(search)
    );
  }

  return result;
}

// Get district stats for heatmap
export function getDistrictStats(): DistrictStats[] {
  const districtMap = new Map<string, DistrictStats>();

  // Initialize with all districts
  const allDistricts = [...new Set(stations.map(s => s.district))];
  allDistricts.forEach(district => {
    districtMap.set(district, {
      district,
      total_firs: 0,
      resolved: 0,
      pending: 0,
      charge_sheeted: 0,
      crime_rate_per_100k: 0,
      resolution_rate: 0,
      by_category: {},
    });
  });

  // Count FIRs per district
  firs.forEach(fir => {
    const station = getStationById(fir.station_id);
    if (!station) return;

    const stats = districtMap.get(station.district);
    if (!stats) return;

    stats.total_firs++;
    if (fir.status === 'Closed') stats.resolved++;
    if (fir.status === 'Pending') stats.pending++;
    if (fir.status === 'ChargeSheeted') stats.charge_sheeted++;

    const cat = fir.crime_category;
    stats.by_category[cat] = (stats.by_category[cat] || 0) + 1;
  });

  // Calculate resolution rate and mock crime rate
  districtMap.forEach(stats => {
    stats.resolution_rate = stats.total_firs > 0 ? Math.round((stats.resolved / stats.total_firs) * 100) : 0;
    stats.crime_rate_per_100k = stats.total_firs * 2.5 + Math.random() * 5; // Mock calculation
  });

  return Array.from(districtMap.values());
}

// Get stats for a specific station
export function getStationStats(stationId: string) {
  const stationFirs = firs.filter(f => f.station_id === stationId);
  return {
    total: stationFirs.length,
    pending: stationFirs.filter(f => f.status === 'Pending').length,
    investigating: stationFirs.filter(f => f.status === 'Investigating').length,
    chargeSheeted: stationFirs.filter(f => f.status === 'ChargeSheeted').length,
    closed: stationFirs.filter(f => f.status === 'Closed').length,
    highPriority: stationFirs.filter(f => f.priority === 'High').length,
  };
}

// Get monthly FIR trend (last 6 months)
export function getMonthlyTrend(stationId?: string) {
  const months = ['Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026'];
  return months.map(month => {
    const data = stationId ? firs.filter(f => f.station_id === stationId) : firs;
    // Return random-ish but consistent counts
    const monthIndex = months.indexOf(month);
    const baseCount = stationId ? Math.floor(data.length / 6) : Math.floor(data.length / 6);
    return {
      month,
      total: baseCount + Math.floor(Math.sin(monthIndex * 1.5) * 3) + 5,
      resolved: Math.floor(baseCount * 0.6) + Math.floor(Math.cos(monthIndex) * 2),
    };
  });
}

// Get crime category distribution
export function getCategoryDistribution(stationId?: string) {
  const data = stationId ? firs.filter(f => f.station_id === stationId) : firs;
  const categories: Record<string, number> = {};
  data.forEach(f => {
    categories[f.crime_category] = (categories[f.crime_category] || 0) + 1;
  });
  return Object.entries(categories).map(([category, count]) => ({ category, count }));
}

// Get all unique districts
export function getAllDistricts(): string[] {
  return [...new Set(stations.map(s => s.district))].sort();
}

// Get all unique districts from commissionerates
export function getAllCommissionerates(): string[] {
  return units.filter(u => u.type === 'commissionerate').map(u => u.name);
}

// Login function
export function loginUser(email: string, password: string): User | null {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  return user ? { ...user, password: '' } : null; // Don't return password
}

// Get user by email
export function getUserByEmail(email: string): User | undefined {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  return user ? { ...user, password: '' } : undefined;
}

// Generate FIR number
let firCounter = 4238;
export function generateFIRNumber(stationId: string): string {
  const station = getStationById(stationId);
  if (!station) return `KAR/2026/UNK/PS/${firCounter++}`;

  const unit = units.find(u => u.unit_id === station.parent_unit_id);
  const district = station.district.substring(0, 3).toUpperCase();
  const unitCode = unit?.type === 'commissionerate' ? 'CP' : 'PS';
  return `KAR/2026/${district}/${unitCode}/${String(firCounter++).padStart(6, '0')}`;
}

// Register new FIR
export function registerFIR(data: Partial<FIR>): FIR {
  const newFIR: FIR = {
    fir_id: `FIR${String(firs.length + 1).padStart(3, '0')}`,
    fir_number: data.fir_number || generateFIRNumber(data.station_id || 'PS001'),
    complainant_name: data.complainant_name || '',
    complainant_phone: data.complainant_phone || '',
    complainant_address: data.complainant_address || '',
    incident_date: data.incident_date || new Date().toISOString().split('T')[0],
    incident_time: data.incident_time || '00:00',
    incident_place: data.incident_place || '',
    incident_description: data.incident_description || '',
    crime_category: data.crime_category || 'IPC',
    sub_category: data.sub_category || '',
    suspect_details: data.suspect_details,
    witness_details: data.witness_details,
    station_id: data.station_id || 'PS001',
    assigned_officer_id: null,
    status: 'Pending',
    priority: data.priority || 'Medium',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: data.created_by,
  };
  firs.push(newFIR);
  return newFIR;
}