import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18nStore, t } from '@/store/i18nStore';
import { stations } from '@/data/stations';
import { haversineDistance } from '@/data/queries';
import { MapPin, Phone, Navigation, Search, FileText, Map, RefreshCw, Building2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Station = typeof stations[0] & { distance?: number };

// Comprehensive pincode map
const PINCODE_COORDS: Record<string, [number, number, string]> = {
  // Kolar (priority)
  '563101':[13.1357,78.1324,'Kolar Town'], '563114':[12.9700,78.1900,'Bangarpet'], '563122':[12.9400,78.2650,'KGF'],
  '563128':[13.0950,78.1700,'Vemagal'], '563130':[13.0050,77.9370,'Malur'], '563131':[13.1630,78.3960,'Mulbagal'],
  '563133':[13.2300,78.0900,'Narsapura'], '563135':[13.3440,78.2170,'Srinivasapura'],
  // South Karnataka
  '562101':[13.4355,77.7315,'Chikkaballapur'], '562159':[12.7252,77.2807,'Ramanagara'],
  '562160':[12.6510,77.2060,'Channapatna'], '562117':[12.5480,77.4190,'Kanakapura'],
  '571401':[12.5243,76.8953,'Mandya'], '571428':[12.5820,77.0440,'Maddur'],
  '571301':[12.1170,76.6850,'Nanjangud'], '571105':[12.3020,76.2920,'Hunsur'],
  '571313':[11.9260,76.9402,'Chamarajanagar'], '571440':[12.1580,77.1050,'Kollegal'],
  '573201':[13.0068,76.0996,'Hassan'], '573115':[13.1630,75.8680,'Belur'],
  '571201':[12.4208,75.7397,'Madikeri'],
  // Tumakuru
  '572101':[13.3400,77.1000,'Tumakuru'], '572201':[13.2590,76.4790,'Tiptur'],
  '572130':[13.0240,77.0240,'Kunigal'],
  // Bengaluru
  '560001':[12.9763,77.5929,'Bengaluru Central'], '560011':[12.9250,77.5938,'Jayanagar'],
  '560034':[12.9279,77.6271,'Koramangala'], '560038':[12.9718,77.6414,'Indiranagar'],
  '560066':[12.9698,77.7499,'Whitefield'], '560100':[12.8458,77.6604,'Electronic City'],
  '560070':[12.9258,77.5838,'Banashankari'], '560004':[12.9422,77.5756,'Basavanagudi'],
  // Mysuru
  '570001':[12.3084,76.6526,'Mysuru City'], '570010':[12.3024,76.6589,'Nazarbad'],
  // Coastal Karnataka
  '575001':[12.8800,74.8500,'Mangaluru'], '576101':[13.3409,74.7421,'Udupi'],
  '576104':[13.3533,74.7833,'Manipal'], '574201':[12.7600,75.2000,'Puttur'],
  // Uttara Kannada
  '581325':[15.2574,74.6211,'Dandeli'], '581301':[14.8126,74.1294,'Karwar'],
  '581401':[14.6214,74.8381,'Sirsi'],
};

function getPrefixCoords(pincode: string): [number, number] | null {
  const prefixMap: Record<string,[number,number]> = {
    '5631':[13.1357,78.1324], '5632':[12.7252,77.2807], '5621':[13.4355,77.7315],
    '5714':[12.5243,76.8953], '5713':[11.9260,76.9402], '5731':[13.0068,76.0996],
    '5722':[13.3400,77.1000], '560':[12.9716,77.5946], '561':[13.1363,77.6071],
    '562':[12.7252,77.2807], '563':[13.1357,78.1324], '570':[12.2958,76.6394],
    '571':[12.5243,76.8953], '572':[13.3400,77.1000], '573':[13.0068,76.0996],
    '574':[12.9141,74.8560], '575':[12.9141,74.8560], '576':[13.3409,74.7421],
    '577':[13.9299,75.5681], '580':[15.4600,75.0000], '581':[14.8185,74.1416],
    '583':[15.1394,76.9214], '584':[16.2076,77.3463], '585':[17.3297,76.8343],
    '586':[16.8302,75.7100], '590':[15.8497,74.4977],
  };
  const p4 = pincode.substring(0,4);
  const p3 = pincode.substring(0,3);
  return prefixMap[p4] || prefixMap[p3] || null;
}

export default function StationFinder() {
  const { lang } = useI18nStore();
  const [pincode, setPincode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const [userLocation, setUserLocation] = useState<[number,number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle'|'loading'|'done'|'error'>('idle');
  const [activeTab, setActiveTab] = useState<'nearest'|'search'|'district'>('nearest');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [locatedPlace, setLocatedPlace] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const districts = [...new Set(stations.map(s => s.district))].sort();

  const [section144Orders, setSection144Orders] = useState<Record<string,string>[]>([]);

  // Check active Section 144 orders
  useEffect(() => {
    fetch('/api?action=section144&active=1')
      .then(r => r.json())
      .then(j => { if (j.success) setSection144Orders(j.data); })
      .catch(() => {});
  }, []);

  // Auto detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocationStatus('loading');
    if (!navigator.geolocation) { setLocationStatus('error'); loadDefault(); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number,number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setLocationStatus('done');
        const nearest = getNearest(coords[0], coords[1], 10);
        setResults(nearest);
        setLocatedPlace('Your Location');
      },
      () => { setLocationStatus('error'); loadDefault(); },
      { timeout: 8000 }
    );
  };

  const loadDefault = () => {
    // Default: Kolar
    const nearest = getNearest(13.1357, 78.1324, 10);
    setResults(nearest);
    setLocatedPlace('Kolar (Default)');
  };

  const getNearest = (lat: number, lng: number, n: number): Station[] =>
    [...stations]
      .map(s => ({ ...s, distance: haversineDistance(lat, lng, s.lat, s.lng) }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, n);

  const searchByPincode = () => {
    const p = pincode.trim();
    if (p.length !== 6) return;
    if (PINCODE_COORDS[p]) {
      const [lat, lng, place] = PINCODE_COORDS[p];
      setResults(getNearest(lat, lng, 10));
      setLocatedPlace(place);
      setUserLocation([lat, lng]);
    } else {
      const coords = getPrefixCoords(p);
      if (coords) { setResults(getNearest(coords[0], coords[1], 10)); setLocatedPlace(`PIN: ${p}`); }
      else setResults([]);
    }
  };

  const searchByName = (q: string) => {
    setSearchName(q);
    if (!q.trim()) { setResults(userLocation ? getNearest(userLocation[0], userLocation[1], 10) : []); return; }
    const filtered = stations.filter(s =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.district.toLowerCase().includes(q.toLowerCase()) ||
      s.taluk.toLowerCase().includes(q.toLowerCase()) ||
      s.pincode.includes(q)
    ).slice(0, 20);
    setResults(filtered.map(s => ({ ...s, distance: userLocation ? haversineDistance(userLocation[0], userLocation[1], s.lat, s.lng) : undefined })));
  };

  const filterByDistrict = (d: string) => {
    setSelectedDistrict(d);
    const filtered = d ? stations.filter(s => s.district === d) : [];
    setResults(filtered.map(s => ({ ...s, distance: userLocation ? haversineDistance(userLocation[0], userLocation[1], s.lat, s.lng) : undefined })));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-[#081428] py-10 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-[#F0C75E] text-[#081428] px-3 py-1 text-xs uppercase tracking-widest font-bold mb-4">
          <MapPin size={12} /> Station Locator
        </div>
        <h1 className="text-2xl font-bold text-[#F5F5F0] uppercase tracking-wider mb-2">
          {t('station.finder', lang)}
        </h1>
        <p className="text-gray-400 text-sm max-w-lg mx-auto">
          {lang === 'kn' ? 'ನಿಮ್ಮ ಸ್ಥಳ, ಪಿನ್‌ಕೋಡ್ ಅಥವಾ ಜಿಲ್ಲೆ ಮೂಲಕ ಹತ್ತಿರದ ಪೊಲೀಸ್ ಠಾಣೆ ಹುಡುಕಿ'
            : 'Find nearest Karnataka Police station by GPS location, pincode, name or district'}
        </p>

        {/* Location Status Bar */}
        <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 text-xs ${locationStatus === 'done' ? 'bg-green-900/30 text-green-300 border border-green-700/30' : locationStatus === 'loading' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/30' : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/30'}`}>
          <Navigation size={11} className={locationStatus === 'loading' ? 'animate-spin' : ''} />
          {locationStatus === 'done' ? `📍 Location detected — ${locatedPlace}` :
           locationStatus === 'loading' ? 'Detecting your location...' :
           `⚠ Location unavailable — showing ${locatedPlace || 'Kolar'} stations`}
          {locationStatus !== 'loading' && (
            <button onClick={detectLocation} className="ml-2 underline hover:text-white transition-colors">
              {t('station.detectLocation', lang)}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Tabs */}
        <div className="flex border-b border-[#e5e7eb] mb-5 bg-white">
          {[
            { key:'nearest', label:'📍 Nearest to Me', labelKn:'ನನ್ನ ಹತ್ತಿರ' },
            { key:'search',  label:'🔍 Search by Name / PIN', labelKn:'ಹೆಸರು / ಪಿನ್ ಹುಡುಕಿ' },
            { key:'district',label:'🗺 Browse by District', labelKn:'ಜಿಲ್ಲೆ ಮೂಲಕ' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-3 text-xs uppercase tracking-wider font-medium transition-colors border-b-2 ${activeTab === tab.key ? 'border-[#A8362A] text-[#A8362A] bg-red-50/50' : 'border-transparent text-gray-500 hover:text-[#081428]'}`}>
              {lang === 'kn' ? tab.labelKn : tab.label}
            </button>
          ))}
        </div>

        {/* Search Inputs */}
        <AnimatePresence mode="wait">
          {activeTab === 'nearest' && (
            <motion.div key="nearest" initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex gap-3 mb-5">
              <input ref={inputRef} type="text" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g,'').slice(0,6))}
                onKeyDown={e => e.key === 'Enter' && searchByPincode()}
                placeholder={t('station.enterPincode', lang) + ' (e.g. 563101 for Kolar)'}
                className="flex-1 px-4 py-2.5 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal" />
              <button onClick={searchByPincode}
                className="px-5 py-2.5 bg-[#081428] text-white text-xs uppercase tracking-wider hover:bg-[#0F1E36] flex items-center gap-2">
                <Search size={14} /> Search
              </button>
              <button onClick={detectLocation} className="px-4 py-2.5 border border-[#081428] text-[#081428] text-xs uppercase tracking-wider hover:bg-[#081428] hover:text-white transition-colors flex items-center gap-2">
                <Navigation size={14} className={locationStatus === 'loading' ? 'animate-spin' : ''} />
                {lang === 'kn' ? 'GPS' : 'GPS'}
              </button>
            </motion.div>
          )}
          {activeTab === 'search' && (
            <motion.div key="search" initial={{ opacity:0 }} animate={{ opacity:1 }} className="relative mb-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchName} onChange={e => searchByName(e.target.value)}
                placeholder="Type station name, district, taluk or pincode..."
                className="w-full pl-10 pr-4 py-3 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm" />
            </motion.div>
          )}
          {activeTab === 'district' && (
            <motion.div key="district" initial={{ opacity:0 }} animate={{ opacity:1 }} className="mb-5">
              <select value={selectedDistrict} onChange={e => filterByDistrict(e.target.value)}
                className="w-full px-4 py-3 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm bg-white">
                <option value="">— Select District —</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">
            {results.length > 0 ? `${results.length} station${results.length !== 1 ? 's' : ''} found${locatedPlace ? ` near ${locatedPlace}` : ''}` : 'Search above to find stations'}
          </p>
          {locationStatus === 'done' && activeTab === 'nearest' && (
            <p className="text-xs text-green-600 flex items-center gap-1"><Navigation size={10} /> Sorted by distance from your GPS location</p>
          )}
        </div>

        {/* Section 144 Active Orders */}
        {section144Orders.length > 0 && (
          <div className="mb-4 space-y-2">
            {section144Orders.map(order => (
              <div key={order.order_id} className="bg-red-900 border border-red-500 p-3 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">⚠</span>
                <div>
                  <p className="text-red-200 text-xs font-bold uppercase tracking-wider">Section 144 Active — {order.district}</p>
                  <p className="text-red-300 text-xs mt-0.5">{order.area_description}</p>
                  <p className="text-red-400 text-xs mt-0.5">Valid: {new Date(order.start_datetime).toLocaleString('en-IN')} → {new Date(order.end_datetime).toLocaleString('en-IN')}</p>
                  <p className="text-red-400 text-xs">Issued by: {order.issued_by} ({order.issued_by_rank})</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Station Cards */}
        <div className="space-y-3">
          {results.map((station, i) => (
            <motion.div key={station.station_id}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-[#e5e7eb] hover:border-[#A8362A]/40 hover:shadow-sm transition-all">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#0F1E36] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Building2 size={16} className="text-[#F0C75E]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {i === 0 && activeTab !== 'district' && (
                          <span className="text-[0.55rem] bg-[#A8362A] text-white px-1.5 py-0.5 font-bold uppercase">NEAREST</span>
                        )}
                        {station.district === 'Kolar' && (
                          <span className="text-[0.55rem] bg-[#F0C75E] text-[#081428] px-1.5 py-0.5 font-bold uppercase">HOME DISTRICT ★</span>
                        )}
                        <h3 className="text-sm font-bold text-[#081428]">{station.name} Police Station</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{station.district} · {station.taluk} Taluk · PIN {station.pincode}</p>
                    </div>
                  </div>
                  {station.distance !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-[#A8362A] leading-none">{station.distance.toFixed(1)}</p>
                      <p className="text-[0.6rem] text-gray-400">km away</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-3 pl-12">{station.address}</p>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pl-12">
                  <a href={`tel:${station.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors">
                    <Phone size={11} /> {station.phone}
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors">
                    <Map size={11} /> {t('station.directions', lang)}
                  </a>
                  <Link to={`/file-fir?station=${station.station_id}&type=fir`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#081428] text-[#F0C75E] text-xs font-medium hover:bg-[#A8362A] hover:text-white transition-colors">
                    <FileText size={11} /> {t('station.fileHere', lang)}
                  </Link>
                  {station.email && (
                    <a href={`mailto:${station.email}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] text-gray-600 text-xs hover:border-[#081428] transition-colors">
                      <ExternalLink size={11} /> Email
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {results.length === 0 && (
            <div className="bg-white border border-[#e5e7eb] p-12 text-center">
              <MapPin size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {activeTab === 'district' ? 'Select a district above to browse stations' :
                 activeTab === 'search' ? 'Type to search stations' :
                 'Enter a pincode or use GPS to find nearest stations'}
              </p>
            </div>
          )}
        </div>

        {/* Helpline strip */}
        <div className="mt-8 bg-[#081428] p-4">
          <p className="text-[#F0C75E] text-xs font-bold uppercase tracking-wider mb-3">Emergency Helplines</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[['112','ERSS'],['1930','Cyber'],['1091','Women'],['1098','Child'],['100','Police'],['14410','Anti-Drug']].map(([num, lbl]) => (
              <a key={num} href={`tel:${num}`} className="flex flex-col items-center py-2 bg-[#0F1E36] border border-[#2A3244] hover:border-[#F0C75E] transition-colors">
                <span className="text-[#F0C75E] font-bold text-sm">{num}</span>
                <span className="text-gray-500 text-[0.55rem] uppercase tracking-wider">{lbl}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
