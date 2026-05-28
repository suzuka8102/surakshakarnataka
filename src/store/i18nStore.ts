import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface I18nState {
  lang: 'en' | 'kn';
  toggle: () => void;
  setLang: (lang: 'en' | 'kn') => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      lang: 'en',
      toggle: () => set((state) => ({ lang: state.lang === 'en' ? 'kn' : 'en' })),
      setLang: (lang) => set({ lang }),
    }),
    { name: 'suraksha-lang' }
  )
);

// Full translation dictionary — EN + KN
const translations: Record<string, Record<string, string>> = {
  en: {
    'app.name': 'SurakshaKarnataka',
    'app.tagline': 'Safer Karnataka, Smarter Policing',
    'app.govt': 'Government of Karnataka',
    'nav.home': 'Home', 'nav.services': 'Services', 'nav.track': 'Track',
    'nav.stationFinder': 'Find Station', 'nav.login': 'Login / Sign Up',
    'nav.dashboard': 'My Dashboard', 'nav.logout': 'Logout',
    'hero.title': 'ಸುರಕ್ಷಿತ ಕರ್ನಾಟಕ', 'hero.subtitle': 'Report. Track. Resolve.',
    'hero.fileFIR': 'FILE e-FIR', 'hero.track': 'TRACK STATUS',
    'services.title': 'CITIZEN SERVICES',
    'services.elost': 'e-LOST REPORT', 'services.elost.desc': 'Report lost mobile, documents, vehicle',
    'services.tenant': 'TENANT VERIFICATION', 'services.tenant.desc': 'Verify tenant antecedents online',
    'services.senior': 'SENIOR CITIZEN', 'services.senior.desc': 'Monthly beat officer visits',
    'services.cyber': 'CYBER CRIME', 'services.cyber.desc': 'Report UPI fraud, online scams',
    'services.track': 'TRACK COMPLAINT', 'services.track.desc': 'Check your FIR / complaint status',
    'services.event': 'EVENT PERMISSION', 'services.event.desc': 'Procession, rally, loudspeaker NOC',
    'services.missing': 'MISSING PERSON', 'services.missing.desc': 'Report a missing person',
    'services.noc': 'NOC / PASSPORT', 'services.noc.desc': 'Police NOC for passport, arms licence',
    'station.finder': 'Find Your Nearest Station', 'station.enterPincode': 'Enter pincode',
    'station.detectLocation': 'Use My Location', 'station.nearest': 'Nearest Stations',
    'station.distance': 'km away', 'station.callNow': 'Call Station',
    'station.directions': 'Get Directions', 'station.fileHere': 'File Complaint Here',
    'track.title': 'Track Your Complaint', 'track.placeholder': 'Enter reference number',
    'track.search': 'Track', 'track.notFound': 'Not Found',
    'login.title': 'Login', 'login.signup': 'Sign Up', 'login.email': 'Email',
    'login.password': 'Password', 'login.name': 'Full Name', 'login.phone': 'Phone',
    'login.submit': 'Login', 'login.signupSubmit': 'Create Account',
    'complaint.file': 'File Complaint', 'complaint.submitted': 'Submitted!',
    'complaint.ref': 'Reference Number', 'complaint.download': 'Download PDF',
    'dashboard.myComplaints': 'My Complaints', 'dashboard.nearbyStations': 'Nearby Stations',
    'dashboard.services': 'Services', 'dashboard.location': 'Your Location',
    'helpline.emergency': 'Emergency', 'helpline.cyber': 'Cyber Crime',
    'helpline.women': 'Women Safety', 'helpline.child': 'Child Helpline',
    'helpline.antidrug': 'Anti-Drug',
  },
  kn: {
    'app.name': 'ಸುರಕ್ಷಾ ಕರ್ನಾಟಕ',
    'app.tagline': 'ಸುರಕ್ಷಿತ ಕರ್ನಾಟಕ, ಸ್ಮಾರ್ಟ್ ಪೊಲೀಸಿಂಗ್',
    'app.govt': 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
    'nav.home': 'ಮುಖಪುಟ', 'nav.services': 'ಸೇವೆಗಳು', 'nav.track': 'ಟ್ರ್ಯಾಕ್',
    'nav.stationFinder': 'ಠಾಣೆ ಹುಡುಕಿ', 'nav.login': 'ಲಾಗಿನ್ / ನೋಂದಣಿ',
    'nav.dashboard': 'ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'nav.logout': 'ಲಾಗ್‌ಔಟ್',
    'hero.title': 'ಸುರಕ್ಷಿತ ಕರ್ನಾಟಕ', 'hero.subtitle': 'ದೂರು ದಾಖಲಿಸಿ. ಟ್ರ್ಯಾಕ್ ಮಾಡಿ. ಪರಿಹಾರ ಪಡೆಯಿರಿ.',
    'hero.fileFIR': 'e-FIR ದಾಖಲಿಸಿ', 'hero.track': 'ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ',
    'services.title': 'ನಾಗರಿಕ ಸೇವೆಗಳು',
    'services.elost': 'e-ಲೋಸ್ಟ್ ವರದಿ', 'services.elost.desc': 'ಕಳೆದ ಮೊಬೈಲ್, ದಾಖಲೆ, ವಾಹನ ವರದಿ',
    'services.tenant': 'ಕಿರಾಯಿದಾರ ಪರಿಶೀಲನೆ', 'services.tenant.desc': 'ಕಿರಾಯಿದಾರ ಹಿನ್ನೆಲೆ ಪರಿಶೀಲಿಸಿ',
    'services.senior': 'ಹಿರಿಯ ನಾಗರಿಕ', 'services.senior.desc': 'ಮಾಸಿಕ ಬೀಟ್ ಅಧಿಕಾರಿ ಭೇಟಿ',
    'services.cyber': 'ಸೈಬರ್ ಅಪರಾಧ', 'services.cyber.desc': 'UPI ವಂಚನೆ, ಆನ್‌ಲೈನ್ ಹಗರಣ ದೂರು',
    'services.track': 'ದೂರು ಟ್ರ್ಯಾಕ್', 'services.track.desc': 'FIR / ದೂರಿನ ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ',
    'services.event': 'ಕಾರ್ಯಕ್ರಮ ಅನುಮತಿ', 'services.event.desc': 'ಮೆರವಣಿಗೆ, ಸಭೆ, ಧ್ವನಿವರ್ಧಕ NOC',
    'services.missing': 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿ', 'services.missing.desc': 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿ ವರದಿ ದಾಖಲಿಸಿ',
    'services.noc': 'NOC / ಪಾಸ್‌ಪೋರ್ಟ್', 'services.noc.desc': 'ಪೊಲೀಸ್ NOC ಅರ್ಜಿ',
    'station.finder': 'ಹತ್ತಿರದ ಠಾಣೆ ಹುಡುಕಿ', 'station.enterPincode': 'ಪಿನ್‌ಕೋಡ್ ನಮೂದಿಸಿ',
    'station.detectLocation': 'ನನ್ನ ಸ್ಥಳ ಬಳಸಿ', 'station.nearest': 'ಹತ್ತಿರದ ಠಾಣೆಗಳು',
    'station.distance': 'ಕಿ.ಮೀ ದೂರ', 'station.callNow': 'ಠಾಣೆಗೆ ಕರೆ ಮಾಡಿ',
    'station.directions': 'ದಿಕ್ಕು ತಿಳಿಯಿರಿ', 'station.fileHere': 'ಇಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ',
    'track.title': 'ನಿಮ್ಮ ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', 'track.placeholder': 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ',
    'track.search': 'ಟ್ರ್ಯಾಕ್', 'track.notFound': 'ಕಂಡುಬಂದಿಲ್ಲ',
    'login.title': 'ಲಾಗಿನ್', 'login.signup': 'ನೋಂದಣಿ', 'login.email': 'ಇಮೇಲ್',
    'login.password': 'ಪಾಸ್‌ವರ್ಡ್', 'login.name': 'ಪೂರ್ಣ ಹೆಸರು', 'login.phone': 'ಫೋನ್',
    'login.submit': 'ಲಾಗಿನ್', 'login.signupSubmit': 'ಖಾತೆ ರಚಿಸಿ',
    'complaint.file': 'ದೂರು ದಾಖಲಿಸಿ', 'complaint.submitted': 'ಸಲ್ಲಿಸಲಾಗಿದೆ!',
    'complaint.ref': 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ', 'complaint.download': 'PDF ಡೌನ್‌ಲೋಡ್',
    'dashboard.myComplaints': 'ನನ್ನ ದೂರುಗಳು', 'dashboard.nearbyStations': 'ಹತ್ತಿರದ ಠಾಣೆಗಳು',
    'dashboard.services': 'ಸೇವೆಗಳು', 'dashboard.location': 'ನಿಮ್ಮ ಸ್ಥಳ',
    'helpline.emergency': 'ತುರ್ತು', 'helpline.cyber': 'ಸೈಬರ್ ಅಪರಾಧ',
    'helpline.women': 'ಮಹಿಳಾ ಸಹಾಯ', 'helpline.child': 'ಮಕ್ಕಳ ಸಹಾಯ',
    'helpline.antidrug': 'ಮಾದಕ ದ್ರವ್ಯ ವಿರೋಧಿ',
  }
};

export function t(key: string, lang: 'en' | 'kn'): string {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}
