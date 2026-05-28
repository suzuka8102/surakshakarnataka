import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18nStore, t } from '@/store/i18nStore';
import { getDistrictStats, getFIRs, getNearestStations, wantedPersons, missingPersons, advisories } from '@/data';
import { motion, useInView } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  FileSearch, Users, Shield, Monitor, Search, Calendar,
  UserCheck, MapPin, AlertTriangle, Phone,
  Info, Clock, AlertCircle, X
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Animated counter hook
function useAnimatedCounter(target: number, inView: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, inView]);
  return count;
}

// District data for choropleth
const districtCoords: Record<string, [number, number]> = {
  'Bengaluru Urban': [12.9716, 77.5946], 'Mysuru': [12.2958, 76.6394], 'Dakshina Kannada': [12.9141, 74.8560],
  'Belagavi': [15.8497, 74.4977], 'Kalaburagi': [17.3297, 76.8343], 'Dharwad': [15.4589, 75.0078],
  'Udupi': [13.3409, 74.7421], 'Shivamogga': [13.9299, 75.5681], 'Chikkamagaluru': [13.3181, 75.7740],
  'Hassan': [13.0068, 76.0996], 'Tumakuru': [13.3392, 77.1140], 'Mandya': [12.5243, 76.8953],
  'Davanagere': [14.4644, 75.9218], 'Ballari': [15.1394, 76.9214], 'Vijayapura': [16.8302, 75.7100],
  'Bidar': [17.9104, 77.5199], 'Raichur': [16.2076, 77.3463], 'Chitradurga': [14.2302, 76.4009],
  'Kolar': [13.1357, 78.1324], 'Kodagu': [12.4208, 75.7397], 'Uttara Kannada': [14.8185, 74.1416],
  'Gadag': [15.4315, 75.6355], 'Haveri': [14.7901, 75.4040], 'Koppal': [15.3501, 76.1500],
  'Bagalkot': [16.1853, 75.6961], 'Chamarajanagar': [11.9267, 76.9400], 'Chikkaballapur': [13.4355, 77.7315],
  'Ramanagara': [12.7252, 77.2807], 'Yadgir': [16.7625, 77.1376], 'Vijayanagara': [15.2689, 76.3909],
  'Bengaluru Rural': [13.1363, 77.6071],
};

function getChoroplethColor(count: number): string {
  if (count === 0) return '#0F1E36';
  if (count <= 2) return '#2A3244';
  if (count <= 4) return '#4A3655';
  if (count <= 6) return '#6A3A6A';
  return '#A8362A';
}

// Map center component
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Home() {
  const { lang } = useI18nStore();
  const statsRef = useRef(null);
  const servicesRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });
  const servicesInView = useInView(servicesRef, { once: true });

  const firsCount = useAnimatedCounter(412, statsInView);
  const beatsCount = useAnimatedCounter(1204, statsInView);
  const tracedCount = useAnimatedCounter(28, statsInView);
  const resolutionRate = useAnimatedCounter(94, statsInView);

  const districtStats = getDistrictStats();
  const recentFIRs = getFIRs({ page: 1, pageSize: 8 }).data;

  // Nearest station state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestStations, setNearestStations] = useState<Array<ReturnType<typeof getNearestStations>[0]>>([]);
  const [pincode, setPincode] = useState('');
  const [stationError, setStationError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5, 76.5]);

  const detectLocation = () => {
    setStationError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const nearest = getNearestStations(latitude, longitude, 3);
          setNearestStations(nearest);
          setMapCenter([latitude, longitude]);
        },
        () => setStationError('Location access denied. Please enter pincode.')
      );
    } else {
      setStationError('Geolocation is not supported by this browser.');
    }
  };

  const findByPincode = () => {
    setStationError('');
    if (!pincode || pincode.length !== 6) {
      setStationError('Please enter a valid 6-digit pincode');
      return;
    }
    // Karnataka pincode → [lat, lng, place] — Kolar/South Karnataka prioritised
    const pincodeMap: Record<string, [number, number, string]> = {
      // === KOLAR DISTRICT (home base — first) ===
      '563101': [13.1357, 78.1324, 'Kolar Town'],
      '563114': [12.9700, 78.1900, 'Bangarpet, Kolar'],
      '563122': [12.9400, 78.2650, 'KGF, Kolar'],
      '563128': [13.0950, 78.1700, 'Vemagal, Kolar'],
      '563130': [13.0050, 77.9370, 'Malur, Kolar'],
      '563131': [13.1630, 78.3960, 'Mulbagal, Kolar'],
      '563133': [13.2300, 78.0900, 'Narsapura, Kolar'],
      '563135': [13.3440, 78.2170, 'Srinivasapura, Kolar'],
      // === CHIKKABALLAPUR ===
      '562101': [13.4355, 77.7315, 'Chikkaballapur'],
      '561207': [13.7820, 77.7890, 'Bagepalli'],
      '561208': [13.6140, 77.5180, 'Gauribidanur'],
      '562205': [13.3890, 77.8670, 'Sidlaghatta'],
      // === RAMANAGARA ===
      '562159': [12.7252, 77.2807, 'Ramanagara'],
      '562160': [12.6510, 77.2060, 'Channapatna'],
      '562120': [12.9580, 77.2260, 'Magadi'],
      '562117': [12.5480, 77.4190, 'Kanakapura'],
      // === MANDYA ===
      '571401': [12.5243, 76.8953, 'Mandya Town'],
      '571428': [12.5820, 77.0440, 'Maddur'],
      '571430': [12.3900, 77.0550, 'Malavalli'],
      '571438': [12.4270, 76.6970, 'Srirangapatna'],
      '571432': [12.8200, 76.7540, 'Nagamangala'],
      '571426': [12.6620, 76.4880, 'Krishnarajpet'],
      // === MYSURU RURAL ===
      '571301': [12.1170, 76.6850, 'Nanjangud'],
      '571105': [12.3020, 76.2920, 'Hunsur'],
      '571107': [12.3280, 76.0990, 'Periyapatna'],
      '571124': [12.2150, 76.8940, 'T. Narasipur'],
      '571114': [12.0200, 76.3600, 'H.D. Kote'],
      // === CHAMARAJANAGAR ===
      '571313': [11.9260, 76.9402, 'Chamarajanagar'],
      '571440': [12.1580, 77.1050, 'Kollegal'],
      '571111': [11.8060, 76.6900, 'Gundlupet'],
      '571441': [12.0530, 77.0330, 'Yelandur'],
      '571439': [12.0710, 77.2750, 'Hanur'],
      // === HASSAN ===
      '573201': [13.0068, 76.0996, 'Hassan Town'],
      '573211': [12.7870, 76.2420, 'Holenarasipur'],
      '573115': [13.1630, 75.8680, 'Belur'],
      '573103': [13.3140, 76.2590, 'Arsikere'],
      '573116': [12.9030, 76.3880, 'Channarayapatna'],
      '573134': [12.9440, 75.7890, 'Sakleshpur'],
      // === KODAGU ===
      '571201': [12.4208, 75.7397, 'Madikeri'],
      '571218': [12.1700, 75.8050, 'Virajpet'],
      '571236': [12.5990, 75.8490, 'Somwarpet'],
      // === TUMAKURU ===
      '572101': [13.3400, 77.1000, 'Tumakuru'],
      '572201': [13.2590, 76.4790, 'Tiptur'],
      '572130': [13.0240, 77.0240, 'Kunigal'],
      '572132': [13.6630, 77.2050, 'Madhugiri'],
      '572137': [13.7440, 76.9060, 'Sira'],
      '561202': [14.0960, 77.2760, 'Pavagada'],
      // === BENGALURU ===
      '560001': [12.9763, 77.5929, 'Bengaluru Central'],
      '560011': [12.9250, 77.5938, 'Jayanagar, Bengaluru'],
      '560034': [12.9279, 77.6271, 'Koramangala, Bengaluru'],
      '560066': [12.9698, 77.7499, 'Whitefield, Bengaluru'],
      '560100': [12.8458, 77.6604, 'Electronic City, Bengaluru'],
      '560078': [12.9076, 77.5850, 'JP Nagar, Bengaluru'],
      '560004': [12.9422, 77.5756, 'Basavanagudi, Bengaluru'],
      '560070': [12.9258, 77.5838, 'Banashankari, Bengaluru'],
      // === MYSURU CITY ===
      '570001': [12.3084, 76.6526, 'Mysuru City'],
      '570010': [12.3024, 76.6589, 'Nazarbad, Mysuru'],
      '570023': [12.2934, 76.6390, 'Kuvempunagar, Mysuru'],
      // === MANGALURU / DK ===
      '575001': [12.8800, 74.8500, 'Mangaluru City'],
      '575002': [12.8600, 74.8400, 'Mangaluru South'],
      '574201': [12.7600, 75.2000, 'Puttur, DK'],
      '574211': [12.9000, 75.0300, 'Bantwal, DK'],
      '574327': [12.5600, 75.3800, 'Sullia, DK'],
      // === UDUPI ===
      '576101': [13.3409, 74.7421, 'Udupi Town'],
      '576104': [13.3533, 74.7833, 'Manipal, Udupi'],
      '576201': [13.6300, 74.7000, 'Kundapura, Udupi'],
      // === DANDELI / UTTARA KANNADA ===
      '581325': [15.2574, 74.6211, 'Dandeli, Uttara Kannada'],
      '581301': [14.8126, 74.1294, 'Karwar, Uttara Kannada'],
      '581401': [14.6214, 74.8381, 'Sirsi, Uttara Kannada'],
    };

        // Prefix match — try pincode prefixes from most specific to least
    const prefixMap: Record<string, [number, number]> = {
      '5813': [15.2574, 74.6211], // Dandeli area — UK
      '5814': [14.6214, 74.8381], // Sirsi area — UK
      '5812': [14.8126, 74.1294], // Karwar area — UK
      '5811': [14.2757, 74.4440], // Honnavar/South UK
      '560': [12.9716, 77.5946],  // Bengaluru
      '561': [13.1363, 77.6071],  // Bengaluru Rural
      '562': [12.9716, 77.5946],  // Bengaluru periphery
      '563': [13.1357, 78.1324],  // Kolar
      '570': [12.2958, 76.6394],  // Mysuru
      '571': [12.5243, 76.8953],  // Mandya/Kodagu
      '572': [13.3400, 77.1000],  // Tumakuru
      '573': [13.0068, 76.0996],  // Hassan
      '574': [12.9141, 74.8560],  // DK Rural
      '575': [12.9141, 74.8560],  // Mangaluru
      '576': [13.3409, 74.7421],  // Udupi
      '577': [13.9299, 75.5681],  // Shivamogga/Davanagere
      '578': [14.2302, 76.4009],  // Chitradurga
      '580': [15.4600, 75.0000],  // Dharwad/Hubballi
      '581': [14.8185, 74.1416],  // Uttara Kannada (generic)
      '582': [15.4315, 75.6355],  // Gadag
      '583': [15.1394, 76.9214],  // Ballari
      '584': [16.2076, 77.3463],  // Raichur
      '585': [17.3297, 76.8343],  // Kalaburagi
      '586': [16.8302, 75.7100],  // Vijayapura
      '587': [16.1853, 75.6961],  // Bagalkot
      '591': [15.8497, 74.4977],  // Belagavi
      '590': [15.8497, 74.4977],  // Belagavi
    };

    // Try 4-char prefix first, then 3-char
    const prefix4 = pincode.substring(0, 4);
    const prefix3 = pincode.substring(0, 3);
    const coords = prefixMap[prefix4] || prefixMap[prefix3];

    if (coords) {
      setMapCenter(coords);
      const nearest = getNearestStations(coords[0], coords[1], 3);
      setNearestStations(nearest);
    } else {
      setStationError(`No stations found for pincode ${pincode}. Try: 563101 (Kolar), 560001 (Bengaluru), 570001 (Mysuru), 575001 (Mangaluru), 571401 (Mandya), 576101 (Udupi)`);
    }
  };

  const cyberTips = [
    'Do not share OTPs or UPI PINs with anyone — not even bank officials',
    'Beware of QR code scams — scanning unknown QR codes can empty your account',
    'Verify caller identity — cyber criminals spoof helpline numbers',
    'Do not click links in SMS/email claiming to be from banks or government',
    'Report cyber crime immediately on 1930 or cybercrime.gov.in',
    'Keep your mobile OS and apps updated to prevent malware attacks',
  ];

  const services = [
    { icon: FileSearch, title: 'e-Lost Report', titleKn: 'e-ಲೋಸ್ಟ್ ವರದಿ', desc: 'Lost mobile, documents, vehicle', to: '/file-fir?type=elost' },
    { icon: Users, title: 'Tenant Verification', titleKn: 'ಕಿರಾಯಿದಾರ ಪರಿಶೀಲನೆ', desc: 'Verify your tenant online', to: '/file-fir?type=tenant' },
    { icon: Shield, title: 'Senior Citizen Reg.', titleKn: 'ಹಿರಿಯ ನಾಗರಿಕ ನೋಂದಣಿ', desc: 'Priority safety & beat visits', to: '/file-fir?type=senior' },
    { icon: Monitor, title: 'Cyber Crime', titleKn: 'ಸೈಬರ್ ಅಪರಾಧ', desc: 'UPI fraud, online scams, hacking', to: '/file-fir?type=cyber' },
    { icon: Search, title: 'Track Complaint', titleKn: 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', desc: 'Check FIR / complaint status', to: '/track' },
    { icon: Calendar, title: 'Event Permission', titleKn: 'ಕಾರ್ಯಕ್ರಮ ಅನುಮತಿ', desc: 'Procession, rally, cultural events', to: '/file-fir?type=event' },
    { icon: UserCheck, title: 'Servant Verification', titleKn: 'ನೌಕರ ಪರಿಶೀಲನೆ', desc: 'Verify domestic staff antecedents', to: '/file-fir?type=servant' },
    { icon: MapPin, title: 'Missing Person', titleKn: 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿ', desc: 'Report a missing person', to: '/file-fir?type=missing' },
  ];

  return (
    <div>
      {/* Tricolor + Helpline Strip */}
      <div className="relative">
        <div className="h-1 flex">
          <div className="flex-1 bg-[#FF9932]" />
          <div className="flex-1 bg-[#F5F5F0]" />
          <div className="flex-1 bg-[#138808]" />
        </div>
        <div className="h-1 bg-[#D32F2F]" />
        <div className="h-1 bg-[#FFC107]" />
        <div className="bg-[#0F1E36] py-2 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs">
            {[
              { n: '112', l: 'ERSS', c: '#A8362A' },
              { n: '1930', l: 'Cyber Crime', c: '#8B5CF6' },
              { n: '14410', l: 'Anti-Drug', c: '#F0C75E' },
              { n: '1091', l: 'Women', c: '#E11D48' },
              { n: '1098', l: 'Child', c: '#10B981' },
              { n: '100', l: 'Police', c: '#3B82F6' },
              { n: '108', l: 'Ambulance', c: '#EF4444' },
            ].map((h) => (
              <a key={h.n} href={`tel:${h.n}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Phone className="w-3 h-3" style={{ color: h.c }} />
                <span className="font-bold" style={{ color: h.c }}>{h.n}</span>
                <span className="text-gray-400">{h.l}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-vidhana-soudha.jpg"
            alt="Vidhana Soudha"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#081428]/85" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-20">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <p className="text-[0.7rem] text-[#F0C75E] uppercase tracking-[0.15em] mb-4 font-mono">
                Karnataka State Police · Integrated Crime Management System · v3.2.1
              </p>
              <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-light text-[#F5F5F0] leading-tight mb-4">
                {lang === 'kn' ? 'ಸುರಕ್ಷಿತ ಕರ್ನಾಟಕ' : t('hero.title', lang)}
              </h1>
              <h2 className="text-[clamp(1.2rem,3vw,1.8rem)] text-[#F0C75E] font-serif mb-6">
                {lang === 'kn' ? 'ದೂರು ನೀಡಿ. ಟ್ರ್ಯಾಕ್ ಮಾಡಿ. ಪರಿಹರಿಸಿ.' : t('hero.subtitle', lang)}
              </h2>
              <p className="text-[#d1d5db] text-base max-w-xl mb-8 leading-relaxed">
                {lang === 'kn'
                  ? 'e-FIR ದಾಖಲಿಸಿ, ದೂರುಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ಕಿರಾಯಿದಾರರನ್ನು ಪರಿಶೀಲಿಸಿ, ಹಿರಿಯ ನಾಗರಿಕರನ್ನು ನೋಂದಾಯಿಸಿ, ಮತ್ತು ನಿಮ್ಮ ಸ್ಥಳೀಯ ಬೀಟ್ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ — ಎಲ್ಲವೂ ಒಂದೇ ಸುರಕ್ಷಿತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ.'
                  : t('hero.description', lang)}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/file-fir"
                  className="px-8 py-3 bg-[#A8362A] text-[#F5F5F0] text-sm uppercase tracking-wider font-medium hover:bg-[#8B2D22] transition-colors"
                >
                  {lang === 'kn' ? 'ದೂರು ದಾಖಲಿಸಿ' : t('hero.fileFIR', lang)}
                </Link>
                <Link
                  to="/track"
                  className="px-8 py-3 border border-[#F0C75E] text-[#F0C75E] text-sm uppercase tracking-wider font-medium hover:bg-[#F0C75E] hover:text-[#081428] transition-colors"
                >
                  {lang === 'kn' ? 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ' : t('hero.track', lang)}
                </Link>
              </div>
            </div>

            {/* Live Stats Card */}
            <div className="lg:col-span-2" ref={statsRef}>
              <div className="bg-[#0F1E36] border border-[#2A3244] p-6">
                <p className="text-[0.7rem] text-[#F0C75E] uppercase tracking-wider mb-6 font-mono">
                  Live Statistics · {new Date().toLocaleDateString('en-IN')}
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'FIRs Today', labelKn: 'ಇಂದು ದೂರು', value: firsCount },
                    { label: 'Beats Patrolled', labelKn: 'ಬೀಟ್ ಪೆಟ್ರೋಲ್', value: beatsCount },
                    { label: 'Missing Traced', labelKn: 'ಕಾಣೆದಾರರು ಪತ್ತೆ', value: tracedCount },
                    { label: 'Resolution Rate %', labelKn: 'ಪರಿಹಾರ ದರ %', value: resolutionRate },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[#F0C75E] text-2xl font-bold font-mono">{stat.value.toLocaleString()}</p>
                      <p className="text-[#9ca3af] text-xs uppercase tracking-wider mt-1">
                        {lang === 'kn' ? stat.labelKn : stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <div className="bg-[#A8362A] py-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[
            '⚡ BOLO ALERT: Suspected chain snatcher spotted in Jayanagar 4th Block — Vehicle KA-05-EF-9921',
            '📍 SECTION 144 ORDER: Udupi district — Procession restrictions from 06:00 to 22:00 on 20-Jan-2026',
            '✅ RESOLVED: Missing person Meena K. (age 72) traced in Mysuru City — reunited with family',
            '🚨 CYBER ALERT: New UPI fraud modus operandi reported in Bengaluru East — Do not scan QR codes from unknown sources',
            '⚡ BOLO: Wanted criminal "Kalia" Mohammed Ali may be hiding in Tamil Nadu — Contact 080-22943001',
            '✅ BEAT UPDATE: 1,204 beats patrolled across Karnataka today — 100% coverage in Bengaluru City',
          ].map((item, i) => (
            <span key={i} className="text-[#F5F5F0] text-xs uppercase tracking-wider mx-8 flex-shrink-0">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Services Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F5F0]" id="services" ref={servicesRef}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold uppercase tracking-[0.05em] text-[#081428] text-center mb-12">
              {lang === 'kn' ? 'ನಾಗರಿಕ ಸೇವೆಗಳು' : t('services.title', lang)}
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Link
                  to={service.to}
                  className="group block bg-[#F5F5F0] border border-[#2A3244] p-6 hover:border-[#F0C75E] hover:bg-white hover:shadow-lg transition-all duration-200"
                >
                  <service.icon className="w-10 h-10 text-[#081428] mb-4 group-hover:text-[#A8362A] transition-colors" />
                  <h3 className="text-sm font-semibold uppercase text-[#081428] mb-1">
                    {lang === 'kn' ? service.titleKn : t(service.title, lang)}
                  </h3>
                  <p className="text-xs text-[#6b7280] leading-relaxed">
                    {lang === 'kn' ? 'ಮಾಹಿತಿ ಪಡೆಯಿರಿ' : t(service.desc, lang)}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Crime Heatmap Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#081428]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold uppercase tracking-[0.05em] text-[#F5F5F0] mb-8">
            {lang === 'kn' ? 'ಜಿಲ್ಲಾ ಅಪರಾಧ ನಕ್ಷೆ' : t('heatmap.title', lang)}
          </h2>
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 h-[500px] bg-[#0F1E36] border border-[#2A3244]">
              <MapContainer center={[14.5, 76.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter center={mapCenter} />
                {districtStats.map((ds) => {
                  const coords = districtCoords[ds.district];
                  if (!coords) return null;
                  return (
                    <CircleMarker
                      key={ds.district}
                      center={coords}
                      radius={10 + ds.total_firs * 3}
                      fillColor={getChoroplethColor(ds.total_firs)}
                      color="#2A3244"
                      weight={1}
                      fillOpacity={0.7}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{ds.district}</p>
                          <p>Total FIRs: {ds.total_firs}</p>
                          <p>Resolved: {ds.resolved}</p>
                          <p>Resolution: {ds.resolution_rate}%</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
            <div className="lg:col-span-2 bg-[#0F1E36] border border-[#2A3244] p-4 overflow-y-auto max-h-[500px]">
              <p className="text-[#F0C75E] text-xs uppercase tracking-wider mb-4 font-mono">Recent FIRs</p>
              {recentFIRs.map((fir) => {
                const station = fir.station_id ? { name: 'Bengaluru PS' } : null;
                const catColors: Record<string, string> = {
                  'IPC': '#3B82F6', 'Cyber Crime': '#8B5CF6', 'NDPS': '#EF4444',
                  'POCSO': '#E11D48', 'Crime Against Women': '#F59E0B', 'Traffic': '#10B981',
                };
                return (
                  <div key={fir.fir_id} className="border-b border-[#2A3244] py-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#F0C75E] text-xs font-mono">{fir.fir_number}</span>
                      <span
                        className="text-[0.6rem] px-1.5 py-0.5 uppercase"
                        style={{ backgroundColor: `${catColors[fir.crime_category] || '#6b7280'}20`, color: catColors[fir.crime_category] || '#6b7280' }}
                      >
                        {fir.crime_category}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-1">{fir.complainant_name} — {station?.name || 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-600 text-[0.65rem]">{new Date(fir.created_at).toLocaleDateString('en-IN')}</span>
                      <span className={`text-[0.65rem] px-1 ${fir.status === 'Pending' ? 'text-yellow-500' : fir.status === 'Investigating' ? 'text-blue-400' : fir.status === 'ChargeSheeted' ? 'text-green-400' : 'text-gray-500'}`}>
                        {fir.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Wanted + Missing Persons */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto">
          {/* Wanted */}
          <h2 className="text-2xl font-semibold uppercase tracking-[0.05em] text-[#081428] mb-8">
            {lang === 'kn' ? 'ವಾರಂಟ್ ಹೊಂದಿರುವವರು' : t('wanted.title', lang)}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory mb-16">
            {wantedPersons.map((w) => (
              <div key={w.wanted_id} className="flex-shrink-0 w-72 snap-start bg-[#081428] border border-[#2A3244]">
                <div className="h-48 bg-[#0F1E36] flex items-center justify-center overflow-hidden">
                  {w.photo ? (
                    <img src={w.photo} alt={w.name} className="w-full h-full object-cover" />
                  ) : (
                    <AlertTriangle className="w-16 h-16 text-[#2A3244]" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-[#F5F5F0] font-medium text-sm mb-1">{w.name}</h3>
                  <p className="text-[#F0C75E] text-xs mb-2">{w.aliases}</p>
                  <p className="text-gray-400 text-xs mb-1">{w.crime_category}</p>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-1">{w.last_known_location}</p>
                  <p className="text-[#A8362A] text-sm font-semibold">Reward: ₹{w.reward_amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Missing Persons */}
          <h2 className="text-2xl font-semibold uppercase tracking-[0.05em] text-[#081428] mb-8">
            {lang === 'kn' ? 'ಕಾಣೆಯಾದ ವ್ಯಕ್ತಿಗಳು' : t('missing.title', lang)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {missingPersons.map((m) => (
              <div key={m.missing_id} className="bg-white border border-[#e5e7eb] p-4">
                <div className="h-40 bg-gray-100 mb-3 overflow-hidden">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Info className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm text-[#081428]">{m.name}</h3>
                <p className="text-xs text-gray-500">Age: {m.age} · {m.gender}</p>
                <p className="text-xs text-gray-500 line-clamp-1 mt-1">{m.last_seen_location}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(m.date_missing).toLocaleDateString('en-IN')}</p>
                <span className={`inline-block mt-2 text-[0.65rem] px-2 py-0.5 ${m.status === 'Traced' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {m.status}
                </span>
                <p className="text-[#A8362A] text-xs mt-2 font-medium">{m.contact_number}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Advisories + Cyber Tips */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0F1E36]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold uppercase tracking-[0.05em] text-[#F5F5F0] mb-8">
            {lang === 'kn' ? 'ಸಾರ್ವಜನಿಕ ಸಲಹೆಗಳು' : t('advisory.title', lang)}
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Advisories */}
            <div className="space-y-3">
              {advisories.map((adv) => (
                <div key={adv.advisory_id} className="bg-[#081428] border-l-4 border-[#F0C75E] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-[#F5F5F0] text-sm font-medium">
                        {lang === 'kn' ? adv.title_kn : adv.title_en}
                      </h3>
                      <span className="text-[0.65rem] text-gray-500">{adv.district} · {new Date(adv.publish_date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <span className={`text-[0.6rem] px-2 py-0.5 uppercase ${
                      adv.type === 'Section 144' ? 'bg-[#A8362A] text-white' :
                      adv.type === 'Cyber' ? 'bg-[#8B5CF6] text-white' :
                      'bg-[#F0C75E] text-[#081428]'
                    }`}>
                      {adv.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">{lang === 'kn' ? adv.content_kn : adv.content_en}</p>
                </div>
              ))}
            </div>

            {/* Cyber Safety Tips */}
            <div>
              <h3 className="text-[#F0C75E] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {lang === 'kn' ? 'ಸೈಬರ್ ಸುರಕ್ಷಾ ಸಲಹೆಗಳು' : t('cyber.title', lang)}
              </h3>
              <div className="space-y-2">
                {cyberTips.map((tip, i) => (
                  <div key={i} className="bg-[#081428] border border-[#2A3244] p-4 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-[#F0C75E] flex-shrink-0 mt-0.5" />
                    <p className="text-gray-400 text-xs leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find Nearest Station */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#081428]" id="station-finder">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold uppercase tracking-[0.05em] text-[#F5F5F0] mb-8">
            {lang === 'kn' ? 'ನಿಕಟತಮ ಪೊಲೀಸ್ ಠಾಣೆ' : t('nearest.title', lang)}
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={detectLocation}
                  className="flex items-center gap-2 px-6 py-3 bg-[#A8362A] text-[#F5F5F0] text-sm uppercase tracking-wider hover:bg-[#8B2D22] transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {lang === 'kn' ? 'ನನ್ನ ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಿ' : 'Detect My Location'}
                </button>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter Pincode (e.g. 560001)"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#0F1E36] border border-[#2A3244] text-[#F5F5F0] text-sm placeholder-gray-500 focus:border-[#F0C75E] outline-none"
                  maxLength={6}
                />
                <button
                  onClick={findByPincode}
                  className="px-6 py-3 bg-[#F0C75E] text-[#081428] text-sm uppercase tracking-wider font-medium hover:bg-[#D4A93C] transition-colors"
                >
                  {lang === 'kn' ? 'ಹುಡುಕಿ' : 'Find'}
                </button>
              </div>
              {stationError && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3">
                  <X className="w-4 h-4 flex-shrink-0" />
                  {stationError}
                </div>
              )}
              {nearestStations.length > 0 && (
                <div className="space-y-3 mt-4">
                  {nearestStations.map((s) => (
                    <div key={s.station_id} className="bg-[#0F1E36] border border-[#2A3244] p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-[#F5F5F0] text-sm font-medium">{s.name} Police Station</h3>
                        <span className="text-[#F0C75E] text-xs font-mono">{s.distance.toFixed(1)} km</span>
                      </div>
                      <p className="text-gray-400 text-xs mb-1">{s.address}, {s.district} - {s.pincode}</p>
                      <p className="text-gray-500 text-xs mb-2">Phone: {s.phone}</p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#F0C75E] text-xs hover:underline"
                      >
                        <MapPin className="w-3 h-3" />
                        Get Directions
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-[400px] bg-[#0F1E36] border border-[#2A3244]">
              <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter center={mapCenter} />
                {nearestStations.map((s) => (
                  <CircleMarker
                    key={s.station_id}
                    center={[s.lat, s.lng]}
                    radius={8}
                    fillColor="#A8362A"
                    color="#F0C75E"
                    weight={2}
                    fillOpacity={0.8}
                  >
                    <Popup>{s.name} Police Station<br />{s.phone}</Popup>
                  </CircleMarker>
                ))}
                {userLocation && (
                  <CircleMarker
                    center={[userLocation.lat, userLocation.lng]}
                    radius={6}
                    fillColor="#138808"
                    color="#F5F5F0"
                    weight={2}
                    fillOpacity={0.9}
                  >
                    <Popup>Your Location</Popup>
                  </CircleMarker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
