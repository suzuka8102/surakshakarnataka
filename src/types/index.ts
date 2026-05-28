// SurakshaKarnataka - Core Type Definitions

export type Rank = 'DGP' | 'ADGP' | 'IGP' | 'DIG' | 'CP' | 'SP' | 'DCP' | 'ACP' | 'DySP' | 'CI' | 'PI' | 'PSI' | 'ASI' | 'HC' | 'PC';
export type JurisdictionType = 'commissionerate' | 'district' | 'isd' | 'cid';
export type UserRole = 'citizen' | 'police' | 'admin';
export type FIRStatus = 'Pending' | 'Investigating' | 'ChargeSheeted' | 'Closed' | 'Referred';
export type CrimeCategory = 'IPC' | 'Cyber Crime' | 'NDPS' | 'POCSO' | 'Crime Against Women' | 'SC-ST Atrocities' | 'Traffic' | 'Other';

export interface Range {
  range_id: string;
  name: string;
  hq: string;
}

export interface Unit {
  unit_id: string;
  type: JurisdictionType;
  name: string;
  range_id: string;
  hq: string;
}

export interface PoliceStation {
  station_id: string;
  name: string;
  jurisdiction_type: 'commissionerate' | 'district';
  parent_unit_id: string;
  address: string;
  taluk: string;
  district: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  sho_id: string | null;
}

export interface Officer {
  officer_id: string;
  name: string;
  rank: Rank;
  badge_no: string;
  station_id: string | null;
  unit_id: string | null;
  photo?: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface FIR {
  fir_id: string;
  fir_number: string;
  complainant_name: string;
  complainant_phone: string;
  complainant_address: string;
  incident_date: string;
  incident_time: string;
  incident_place: string;
  incident_description: string;
  crime_category: CrimeCategory;
  sub_category: string;
  suspect_details?: string;
  witness_details?: string;
  station_id: string;
  assigned_officer_id: string | null;
  status: FIRStatus;
  priority: 'High' | 'Medium' | 'Low';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Criminal {
  criminal_id: string;
  name: string;
  aliases: string;
  father_name: string;
  dob: string;
  photo?: string;
  address: string;
  station_id: string;
  is_rowdy_sheeter: boolean;
  is_history_sheeter: boolean;
  goonda_act: boolean;
  kcoca: boolean;
  cases_count: number;
  last_known_location: string;
  created_at: string;
}

export interface SeniorCitizen {
  citizen_id: string;
  name: string;
  age: number;
  address: string;
  pincode: string;
  phone: string;
  local_contact: string;
  station_id: string;
  beat_id: string | null;
  registered_date: string;
  last_visit_date: string | null;
  visit_notes?: string;
  medical_conditions?: string;
  photo?: string;
}

export interface Beat {
  beat_id: string;
  station_id: string;
  beat_no: string;
  area_name: string;
  pincode_start: string;
  pincode_end: string;
  assigned_pc_id: string | null;
}

export interface WantedPerson {
  wanted_id: string;
  name: string;
  aliases: string;
  photo?: string;
  crime_category: string;
  last_known_location: string;
  reward_amount: number;
  fir_number: string;
  created_at: string;
}

export interface MissingPerson {
  missing_id: string;
  name: string;
  age: number;
  gender: string;
  photo?: string;
  last_seen_location: string;
  date_missing: string;
  description: string;
  contact_number: string;
  status: 'Open' | 'Traced' | 'Closed';
  station_id: string;
}

export interface Advisory {
  advisory_id: string;
  title_kn: string;
  title_en: string;
  content_kn: string;
  content_en: string;
  type: 'General' | 'Section 144' | 'Cyber';
  district: string;
  publish_date: string;
  effective_date?: string;
  duration_hours?: number;
  is_active: boolean;
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  user_role: UserRole;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  created_at: string;
}

export interface User {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  station_id?: string;
  unit_id?: string;
  photo?: string;
  rank?: Rank;
  badge_no?: string;
}

export interface DistrictStats {
  district: string;
  total_firs: number;
  resolved: number;
  pending: number;
  charge_sheeted: number;
  crime_rate_per_100k: number;
  resolution_rate: number;
  by_category: Record<string, number>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
