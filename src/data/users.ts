import type { User } from '@/types';

export const users: User[] = [
  // Citizens
  { user_id: 'USR001', name: 'Kiran M.', email: 'kiran@citizen.in', password: 'Citizen@123', role: 'citizen', phone: '9876543210' },
  { user_id: 'USR002', name: 'Anitha Pinto', email: 'anitha@citizen.in', password: 'Citizen@123', role: 'citizen', phone: '8765432109' },
  { user_id: 'USR_DAN', name: 'Rajesh Dandeli', email: 'rajesh@citizen.in', password: 'Citizen@123', role: 'citizen', phone: '9480081325' },
  { user_id: 'USR_KLR', name: 'Suresh Kolar', email: 'suresh@citizen.in', password: 'Citizen@123', role: 'citizen', phone: '9480081357' },
  // Police - Kolar (new)
  { user_id: 'USR_SHO_KL', name: 'Ravi Kumar S.', email: 'sho.kolar@ksp.gov.in', password: 'Police@123', role: 'police', phone: '9480081001', station_id: 'KL001', rank: 'PI', badge_no: 'KSP-PI-8152' },
  // Police - existing
  { user_id: 'USR003', name: 'Rajan Kumar Shetty', email: 'sho.cubbonpark@ksp.gov.in', password: 'Police@123', role: 'police', phone: '9480801301', station_id: 'PS001', rank: 'PI', badge_no: 'KSP-PI-4821' },
  { user_id: 'USR004', name: 'Pooja S. Rao', email: 'sho.mlrnorth@ksp.gov.in', password: 'Police@123', role: 'police', phone: '9480801302', station_id: 'PS034', rank: 'PI', badge_no: 'KSP-PI-5823' },
  { user_id: 'USR_SHO_DT', name: 'Suresh Naik', email: 'sho.dandeli@ksp.gov.in', password: 'Police@123', role: 'police', phone: '9480081001', station_id: 'PS_DT01', rank: 'PI', badge_no: 'KSP-PI-8284' },
  // Admin
  { user_id: 'USR005', name: 'Dr. M.A. Saleem', email: 'cp.bengaluru@ksp.gov.in', password: 'Commissioner@123', role: 'admin', phone: '9480801303', unit_id: 'CMR01', rank: 'CP', badge_no: 'KSP-CP-0001' },
  { user_id: 'USR006', name: 'Dr. Bheemashankar S Guled', email: 'sp.dk@ksp.gov.in', password: 'SP@123', role: 'admin', phone: '9480801304', unit_id: 'DST10', rank: 'SP', badge_no: 'KSP-SP-0004' },
  { user_id: 'USR_SP_UK', name: 'Raghavendra Aurad', email: 'sp.uk@ksp.gov.in', password: 'SP@123', role: 'admin', phone: '9480827001', unit_id: 'DST27', rank: 'SP', badge_no: 'KSP-SP-0027' },
  { user_id: 'USR_SP_KL', name: 'Rashmi D. Rathod', email: 'sp.kolar@ksp.gov.in', password: 'SP@123', role: 'admin', phone: '9480078152', unit_id: 'DST18', rank: 'SP', badge_no: 'KSP-SP-0018' },
];
