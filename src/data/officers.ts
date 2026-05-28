import type { Officer } from '@/types';

export const officers: Officer[] = [
  // Key officers for demo logins
  { officer_id: 'OFF001', name: 'Rajan Kumar Shetty', rank: 'PI', badge_no: 'KSP-PI-4821', station_id: 'PS001', unit_id: 'CMR01', photo: '/images/officer-male-1.jpg', phone: '9480801301', email: 'sho.cubbonpark@ksp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF002', name: 'Pooja S. Rao', rank: 'PI', badge_no: 'KSP-PI-5823', station_id: 'PS034', unit_id: 'CMR03', photo: '/images/officer-female-1.jpg', phone: '9480801302', email: 'sho.mlrnorth@ksp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF003', name: 'Dr. M.A. Saleem', rank: 'CP', badge_no: 'KSP-CP-0001', station_id: null, unit_id: 'CMR01', phone: '9480801303', email: 'cp.bengaluru@ksp.gov.in', password: 'Commissioner@123', role: 'admin' },
  { officer_id: 'OFF004', name: 'Dr. Bheemashankar S Guled', rank: 'SP', badge_no: 'KSP-SP-0004', station_id: null, unit_id: 'DST10', phone: '9480801304', email: 'sp.dk@ksp.gov.in', password: 'SP@123', role: 'admin' },

  // Bengaluru City officers (additional 30)
  { officer_id: 'OFF005', name: 'Venkatesh Murthy', rank: 'PSI', badge_no: 'KSP-PSI-1205', station_id: 'PS001', unit_id: 'CMR01', phone: '9480801305', email: 'venkatesh@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF006', name: 'Lakshmi Devi', rank: 'PSI', badge_no: 'KSP-PSI-1206', station_id: 'PS009', unit_id: 'CMR01', phone: '9480801306', email: 'lakshmi@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF007', name: 'Suresh Babu', rank: 'HC', badge_no: 'KSP-HC-3407', station_id: 'PS004', unit_id: 'CMR01', phone: '9480801307', email: 'suresh@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF008', name: 'Anita Reddy', rank: 'ASI', badge_no: 'KSP-ASI-2108', station_id: 'PS015', unit_id: 'CMR01', phone: '9480801308', email: 'anita@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF009', name: 'Mohammed Ismail', rank: 'PC', badge_no: 'KSP-PC-5609', station_id: 'PS013', unit_id: 'CMR01', phone: '9480801309', email: 'ismail@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF010', name: 'Gowramma', rank: 'PC', badge_no: 'KSP-PC-5610', station_id: 'PS007', unit_id: 'CMR01', phone: '9480801310', email: 'gowramma@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF011', name: 'Nagaraj Hegde', rank: 'PI', badge_no: 'KSP-PI-4822', station_id: 'PS007', unit_id: 'CMR01', phone: '9480801311', email: 'nagaraj@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF012', name: 'Shantha Kumari', rank: 'PSI', badge_no: 'KSP-PSI-1207', station_id: 'PS018', unit_id: 'CMR01', phone: '9480801312', email: 'shantha@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF013', name: 'Krishna Prasad', rank: 'ASI', badge_no: 'KSP-ASI-2109', station_id: 'PS022', unit_id: 'CMR01', phone: '9480801313', email: 'krishna@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF014', name: 'Farida Begum', rank: 'HC', badge_no: 'KSP-HC-3408', station_id: 'PS025', unit_id: 'CMR01', phone: '9480801314', email: 'farida@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF015', name: 'Ramesh Naik', rank: 'DCP', badge_no: 'KSP-DCP-0101', station_id: null, unit_id: 'CMR01', phone: '9480801315', email: 'dcp.east@bcp.gov.in', password: 'Police@123', role: 'admin' },
  { officer_id: 'OFF016', name: 'Saraswathi', rank: 'PC', badge_no: 'KSP-PC-5611', station_id: 'PS010', unit_id: 'CMR01', phone: '9480801316', email: 'saraswathi@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF017', name: 'Abdul Khader', rank: 'PC', badge_no: 'KSP-PC-5612', station_id: 'PS014', unit_id: 'CMR01', phone: '9480801317', email: 'abdul@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF018', name: 'Meera Joshi', rank: 'PSI', badge_no: 'KSP-PSI-1208', station_id: 'PS020', unit_id: 'CMR01', phone: '9480801318', email: 'meera@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF019', name: 'Prakash Gowda', rank: 'HC', badge_no: 'KSP-HC-3409', station_id: 'PS011', unit_id: 'CMR01', phone: '9480801319', email: 'prakash@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF020', name: 'Sunita Devi', rank: 'ASI', badge_no: 'KSP-ASI-2110', station_id: 'PS003', unit_id: 'CMR01', phone: '9480801320', email: 'sunita@bcp.gov.in', password: 'Police@123', role: 'police' },

  // Mysuru City officers
  { officer_id: 'OFF021', name: 'Chandrakanth', rank: 'PI', badge_no: 'KSP-PI-4823', station_id: 'PS026', unit_id: 'CMR02', phone: '9480801321', email: 'chandrakanth@mcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF022', name: 'Kavitha Raj', rank: 'PSI', badge_no: 'KSP-PSI-1209', station_id: 'PS030', unit_id: 'CMR02', phone: '9480801322', email: 'kavitha@mcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF023', name: 'Basavaraj', rank: 'HC', badge_no: 'KSP-HC-3410', station_id: 'PS033', unit_id: 'CMR02', phone: '9480801323', email: 'basavaraj@mcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF024', name: 'Padmavathi', rank: 'PC', badge_no: 'KSP-PC-5613', station_id: 'PS027', unit_id: 'CMR02', phone: '9480801324', email: 'padmavathi@mcp.gov.in', password: 'Police@123', role: 'police' },

  // Mangaluru City officers
  { officer_id: 'OFF025', name: 'Umesh Naik', rank: 'PI', badge_no: 'KSP-PI-4824', station_id: 'PS034', unit_id: 'CMR03', phone: '9480801325', email: 'umesh@mngcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF026', name: 'Shailaja', rank: 'PSI', badge_no: 'KSP-PSI-1210', station_id: 'PS038', unit_id: 'CMR03', phone: '9480801326', email: 'shailaja@mngcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF027', name: 'Jose Pinto', rank: 'ASI', badge_no: 'KSP-ASI-2111', station_id: 'PS040', unit_id: 'CMR03', phone: '9480801327', email: 'jose@mngcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF028', name: 'Rashmi', rank: 'PC', badge_no: 'KSP-PC-5614', station_id: 'PS036', unit_id: 'CMR03', phone: '9480801328', email: 'rashmi@mngcp.gov.in', password: 'Police@123', role: 'police' },

  // Hubballi-Dharwad officers
  { officer_id: 'OFF029', name: 'Gururaj Patil', rank: 'PI', badge_no: 'KSP-PI-4825', station_id: 'PS043', unit_id: 'CMR04', phone: '9480801329', email: 'gururaj@hdcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF030', name: 'Veena Kulkarni', rank: 'PSI', badge_no: 'KSP-PSI-1211', station_id: 'PS045', unit_id: 'CMR04', phone: '9480801330', email: 'veena@hdcp.gov.in', password: 'Police@123', role: 'police' },

  // Udupi district officers
  { officer_id: 'OFF031', name: 'Ganapathi Bhat', rank: 'PI', badge_no: 'KSP-PI-4826', station_id: 'PS056', unit_id: 'DST26', phone: '9480801331', email: 'ganapathi@udps.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF032', name: 'Ranjini', rank: 'PSI', badge_no: 'KSP-PSI-1212', station_id: 'PS058', unit_id: 'DST26', phone: '9480801332', email: 'ranjini@udps.gov.in', password: 'Police@123', role: 'police' },

  // Top brass
  { officer_id: 'OFF033', name: 'Alok Mohan', rank: 'DGP', badge_no: 'KSP-DGP-0001', station_id: null, unit_id: null, phone: '080-22943001', email: 'dgp@ksp.gov.in', password: 'DGP@123', role: 'admin' },
  { officer_id: 'OFF034', name: 'Kamal Pant', rank: 'ADGP', badge_no: 'KSP-ADGP-0001', station_id: null, unit_id: null, phone: '080-22943002', email: 'adgp@ksp.gov.in', password: 'ADGP@123', role: 'admin' },
  { officer_id: 'OFF035', name: 'Praveen Sood', rank: 'IGP', badge_no: 'KSP-IGP-0001', station_id: null, unit_id: 'RNG01', phone: '080-22943003', email: 'igp.blr@ksp.gov.in', password: 'IGP@123', role: 'admin' },
  { officer_id: 'OFF036', name: 'Dr. Chetan Singh Rathor', rank: 'IGP', badge_no: 'KSP-IGP-0002', station_id: null, unit_id: 'RNG03', phone: '0831-2405200', email: 'igp.blg@ksp.gov.in', password: 'IGP@123', role: 'admin' },

  // More beat constables for Bengaluru
  { officer_id: 'OFF037', name: 'Mallikarjuna', rank: 'PC', badge_no: 'KSP-PC-5615', station_id: 'PS001', unit_id: 'CMR01', phone: '9480801333', email: 'mallik@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF038', name: 'Revathi', rank: 'PC', badge_no: 'KSP-PC-5616', station_id: 'PS002', unit_id: 'CMR01', phone: '9480801334', email: 'revathi@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF039', name: 'Hemanth Kumar', rank: 'PC', badge_no: 'KSP-PC-5617', station_id: 'PS005', unit_id: 'CMR01', phone: '9480801335', email: 'hemanth@bcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF040', name: 'Naseema', rank: 'PC', badge_no: 'KSP-PC-5618', station_id: 'PS008', unit_id: 'CMR01', phone: '9480801336', email: 'naseema@bcp.gov.in', password: 'Police@123', role: 'police' },

  // Dharwad, Belagavi, Kalaburagi officers
  { officer_id: 'OFF041', name: 'Shivanand Patil', rank: 'PI', badge_no: 'KSP-PI-4827', station_id: 'PS049', unit_id: 'CMR05', phone: '9480801337', email: 'shivanand@blgcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF042', name: 'Rohini', rank: 'PSI', badge_no: 'KSP-PSI-1213', station_id: 'PS071', unit_id: 'CMR06', phone: '9480801338', email: 'rohini@klbcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF043', name: 'Ningaraju', rank: 'PC', badge_no: 'KSP-PC-5619', station_id: 'PS076', unit_id: 'CMR07', phone: '9480801339', email: 'ningaraju@dvgcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF044', name: 'Savitri', rank: 'PC', badge_no: 'KSP-PC-5620', station_id: 'PS081', unit_id: 'CMR09', phone: '9480801340', email: 'savitri@smgcp.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF045', name: 'Puttaraju', rank: 'PC', badge_no: 'KSP-PC-5621', station_id: 'PS086', unit_id: 'CMR08', phone: '9480801341', email: 'puttaraju@tmkcp.gov.in', password: 'Police@123', role: 'police' },

  // Additional district officers (various)
  { officer_id: 'OFF046', name: 'Mohan Kumar', rank: 'SP', badge_no: 'KSP-SP-0010', station_id: null, unit_id: 'DST08', phone: '9480801342', email: 'sp.chk@ksp.gov.in', password: 'SP@123', role: 'admin' },
  { officer_id: 'OFF047', name: 'Geetha Rani', rank: 'DySP', badge_no: 'KSP-DYSP-0020', station_id: null, unit_id: 'DST14', phone: '9480801343', email: 'dysp.hsn@ksp.gov.in', password: 'Police@123', role: 'admin' },
  { officer_id: 'OFF048', name: 'Harish', rank: 'PI', badge_no: 'KSP-PI-4828', station_id: 'PS064', unit_id: 'DST10', phone: '9480801344', email: 'harish@dkps.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF049', name: 'Mamatha', rank: 'PSI', badge_no: 'KSP-PSI-1214', station_id: 'PS090', unit_id: 'DST08', phone: '9480801345', email: 'mamatha@cmgps.gov.in', password: 'Police@123', role: 'police' },
  { officer_id: 'OFF050', name: 'Krishnamurthy', rank: 'CI', badge_no: 'KSP-CI-0030', station_id: null, unit_id: 'CMR01', phone: '9480801346', email: 'ci.east@bcp.gov.in', password: 'Police@123', role: 'admin' },
];
