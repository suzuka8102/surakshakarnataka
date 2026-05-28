import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useI18nStore } from '@/store/i18nStore';
import { generateAcknowledgementPDF } from '@/lib/pdfGenerator';
import { generateFIRNumber, registerFIR } from '@/data';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  FileText, Download, CheckCircle2, Shield, User, AlertTriangle,
  Phone, MapPin, Car, Smartphone, CreditCard, UserX, Calendar,
  Home, Briefcase, Baby, ChevronRight, ChevronLeft, Globe, Lock
} from 'lucide-react';
import { stations } from '@/data/stations';

// ─── Complaint type config ───────────────────────────────────────────
const COMPLAINT_TYPES = {
  fir: {
    icon: FileText, label: 'File General FIR / Complaint', labelKn: 'ದೂರು ದಾಖಲಿಸಿ',
    color: 'from-red-900/60 to-red-950/60', border: 'border-red-500/30',
  },
  elost: {
    icon: Smartphone, label: 'e-Lost Report', labelKn: 'ಕಳೆದ ವಸ್ತು ವರದಿ',
    color: 'from-blue-900/60 to-blue-950/60', border: 'border-blue-500/30',
  },
  cyber: {
    icon: Globe, label: 'Cyber Crime Complaint', labelKn: 'ಸೈಬರ್ ಅಪರಾಧ ದೂರು',
    color: 'from-purple-900/60 to-purple-950/60', border: 'border-purple-500/30',
  },
  tenant: {
    icon: Home, label: 'Tenant Verification', labelKn: 'ಕಿರಾಯಿದಾರ ಪರಿಶೀಲನೆ',
    color: 'from-green-900/60 to-green-950/60', border: 'border-green-500/30',
  },
  servant: {
    icon: Briefcase, label: 'Servant / Employee Verification', labelKn: 'ನೌಕರ / ಉದ್ಯೋಗಿ ಪರಿಶೀಲನೆ',
    color: 'from-yellow-900/60 to-yellow-950/60', border: 'border-yellow-500/30',
  },
  senior: {
    icon: User, label: 'Senior Citizen Registration', labelKn: 'ಹಿರಿಯ ನಾಗರಿಕ ನೋಂದಣಿ',
    color: 'from-orange-900/60 to-orange-950/60', border: 'border-orange-500/30',
  },
  event: {
    icon: Calendar, label: 'Event / Procession Permission', labelKn: 'ಕಾರ್ಯಕ್ರಮ / ಮೆರವಣಿಗೆ ಅನುಮತಿ',
    color: 'from-teal-900/60 to-teal-950/60', border: 'border-teal-500/30',
  },
  missing: {
    icon: UserX, label: 'Missing Person Report', labelKn: 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿ ವರದಿ',
    color: 'from-rose-900/60 to-rose-950/60', border: 'border-rose-500/30',
  },
  passport: {
    icon: Lock, label: 'NOC for Passport / Loudspeaker', labelKn: 'ಪಾಸ್‌ಪೋರ್ಟ್ / ಲೌಡ್‌ಸ್ಪೀಕರ್ NOC',
    color: 'from-indigo-900/60 to-indigo-950/60', border: 'border-indigo-500/30',
  },
} as const;

type ComplaintType = keyof typeof COMPLAINT_TYPES;

// Sub-categories per crime type for FIR
const cyberSubCategories = [
  'UPI / Banking Fraud', 'Online Job Fraud', 'Investment Scam', 'OLX / E-commerce Fraud',
  'Social Media Hacking', 'Sextortion / Blackmail', 'Phishing / Fake Website',
  'Cyber Stalking / Harassment', 'Business Email Compromise', 'Identity Theft / Fake Profile',
  'Loan App Fraud', 'SIM Swap Fraud', 'Other Cyber Crime',
];
const ipcSubCategories = [
  'Theft (Section 379)', 'Robbery (Section 392)', 'House Break-in (Section 380)',
  'Chain Snatching', 'Assault (Section 323)', 'Criminal Intimidation (Section 506)',
  'Cheating (Section 420)', 'Domestic Violence (Section 498A)', 'Dowry Harassment',
  'Stalking / Molestation (Section 354)', 'Murder (Section 302)',
  'Attempt to Murder (Section 307)', 'Hit and Run (Section 304A)',
  'Land Grabbing / Property Dispute', 'Cattle Theft', 'Drug Trafficking (NDPS)',
  'SC/ST Atrocity', 'Child Abuse (POCSO)', 'Other',
];
const lostArticleTypes = ['Mobile Phone', 'Vehicle (Two-Wheeler)', 'Vehicle (Four-Wheeler)', 'Aadhaar Card', 'PAN Card', 'Passport', 'Driving Licence', 'Bank Documents', 'Wallet / Cash', 'Jewellery', 'Other Document'];
const eventTypes = ['Cultural Programme', 'Religious Procession', 'Political Meeting', 'Sports Event', 'Dharna / Protest', 'Road Show / Rally', 'Other'];

// ─── Reusable field components ────────────────────────────────────────
const Field = ({ label, labelKn, lang, children }: { label: string; labelKn: string; lang: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
      {lang === 'kn' ? labelKn : label}
    </label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600 ${props.className || ''}`} />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <select {...props} className={`w-full bg-[#0a1628] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50 ${props.className || ''}`}>
    {props.children}
  </select>
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600 min-h-[80px] resize-none" />
);

// ─── Station selector — Dandeli first ───────────────────────────────
const ukFirst = [...stations].sort((a, b) => {
  if (a.district === 'Uttara Kannada' && b.district !== 'Uttara Kannada') return -1;
  if (b.district === 'Uttara Kannada' && a.district !== 'Uttara Kannada') return 1;
  return a.district.localeCompare(b.district);
});

// ─── Complaint type selector ─────────────────────────────────────────
function TypeSelector({ current, lang, onSelect }: { current: ComplaintType; lang: string; onSelect: (t: ComplaintType) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {(Object.entries(COMPLAINT_TYPES) as [ComplaintType, typeof COMPLAINT_TYPES[ComplaintType]][]).map(([key, cfg]) => {
        const Icon = cfg.icon;
        return (
          <button key={key} onClick={() => onSelect(key)}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
              current === key
                ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
            }`}>
            <Icon size={16} />
            <span className="text-center leading-tight">{lang === 'kn' ? cfg.labelKn : cfg.label.split(' ').slice(0, 2).join(' ')}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── FORM: General FIR ──────────────────────────────────────────────
function FIRForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    complainant_name: '', complainant_phone: '', complainant_email: '',
    complainant_address: '', id_type: 'Aadhaar', id_number: '',
    crime_category: 'IPC', sub_category: '', incident_date: '',
    incident_time: '', incident_place: '', incident_description: '',
    suspect_details: '', witness_details: '', station_id: 'KL001',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;

  const steps = [
    { title: L('Complainant Details', 'ದೂರುದಾರರ ವಿವರ'), num: 1 },
    { title: L('Incident Details', 'ಘಟನೆಯ ವಿವರ'), num: 2 },
    { title: L('Station & Review', 'ಠಾಣೆ & ಪರಿಶೀಲನೆ'), num: 3 },
  ];

  return (
    <div>
      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {steps.map(s => (
          <div key={s.num} className="flex-1">
            <div className={`h-1 rounded-full mb-1 ${step >= s.num ? 'bg-yellow-400' : 'bg-white/10'}`} />
            <p className={`text-xs ${step === s.num ? 'text-yellow-300' : 'text-gray-500'}`}>{s.title}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" labelKn="ಪೂರ್ಣ ಹೆಸರು" lang={lang}>
                <Input required value={form.complainant_name} onChange={e => set('complainant_name', e.target.value)} placeholder="As on ID proof" />
              </Field>
              <Field label="Phone Number" labelKn="ದೂರವಾಣಿ" lang={lang}>
                <Input type="tel" maxLength={10} value={form.complainant_phone} onChange={e => set('complainant_phone', e.target.value)} placeholder="10-digit mobile" />
              </Field>
            </div>
            <Field label="Email Address" labelKn="ಇಮೇಲ್" lang={lang}>
              <Input type="email" value={form.complainant_email} onChange={e => set('complainant_email', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Full Address" labelKn="ವಿಳಾಸ" lang={lang}>
              <Textarea value={form.complainant_address} onChange={e => set('complainant_address', e.target.value)} placeholder="House No., Street, Locality, District, Pincode" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ID Type" labelKn="ಗುರುತಿನ ಪ್ರಕಾರ" lang={lang}>
                <Select value={form.id_type} onChange={e => set('id_type', e.target.value)}>
                  {['Aadhaar', 'PAN Card', 'Driving Licence', 'Voter ID', 'Passport'].map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="ID Number" labelKn="ಗುರುತಿನ ಸಂಖ್ಯೆ" lang={lang}>
                <Input value={form.id_number} onChange={e => set('id_number', e.target.value)} placeholder="Enter ID number" />
              </Field>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Crime Category" labelKn="ಅಪರಾಧ ವರ್ಗ" lang={lang}>
                <Select value={form.crime_category} onChange={e => { set('crime_category', e.target.value); set('sub_category', ''); }}>
                  {['IPC', 'Cyber Crime', 'NDPS', 'POCSO', 'Crime Against Women', 'SC-ST Atrocities', 'Traffic', 'Other'].map(c => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Sub-Category" labelKn="ಉಪ ವರ್ಗ" lang={lang}>
                <Select value={form.sub_category} onChange={e => set('sub_category', e.target.value)}>
                  <option value="">-- Select --</option>
                  {(form.crime_category === 'Cyber Crime' ? cyberSubCategories : ipcSubCategories).map(s => <option key={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of Incident" labelKn="ಘಟನೆ ದಿನಾಂಕ" lang={lang}>
                <Input type="date" value={form.incident_date} onChange={e => set('incident_date', e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </Field>
              <Field label="Time of Incident" labelKn="ಘಟನೆ ಸಮಯ" lang={lang}>
                <Input type="time" value={form.incident_time} onChange={e => set('incident_time', e.target.value)} />
              </Field>
            </div>
            <Field label="Place of Incident" labelKn="ಘಟನೆ ಸ್ಥಳ" lang={lang}>
              <Input value={form.incident_place} onChange={e => set('incident_place', e.target.value)} placeholder="Landmark, street, area, district" />
            </Field>
            <Field label="Description of Incident" labelKn="ಘಟನೆಯ ವಿವರಣೆ" lang={lang}>
              <div className="relative">
                <Textarea value={form.incident_description} onChange={e => set('incident_description', e.target.value)} placeholder="Describe what happened in detail..." className="min-h-[100px] pr-10" />
                <button type="button" title="Voice input (speak in Kannada or English)"
                  onClick={() => {
                    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
                    if (!SpeechRecognition) { alert('Voice input not supported in this browser. Use Chrome.'); return; }
                    const recognition = new (SpeechRecognition as new() => {lang:string;onresult:(e:SpeechRecognitionEvent)=>void;onerror:()=>void;start:()=>void})();
                    recognition.lang = 'kn-IN';
                    recognition.onresult = (e: SpeechRecognitionEvent) => {
                      const transcript = Array.from(e.results).map((r: SpeechRecognitionResult) => r[0].transcript).join('');
                      set('incident_description', form.incident_description + ' ' + transcript);
                    };
                    recognition.onerror = () => { recognition.lang = 'en-IN'; recognition.start(); };
                    recognition.start();
                  }}
                  className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-[#A8362A] hover:bg-red-50 rounded transition-colors"
                >🎤</button>
              </div>
            </Field>
            <Field label="Suspect Details (if known)" labelKn="ಆರೋಪಿ ವಿವರ" lang={lang}>
              <Textarea value={form.suspect_details} onChange={e => set('suspect_details', e.target.value)} placeholder="Name, age, description, vehicle number, phone..." />
            </Field>
            <Field label="Witness Details" labelKn="ಸಾಕ್ಷಿ ವಿವರ" lang={lang}>
              <Input value={form.witness_details} onChange={e => set('witness_details', e.target.value)} placeholder="Witness name & contact (optional)" />
            </Field>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <Field label="Police Station (Dandeli/UK stations shown first)" labelKn="ಪೊಲೀಸ್ ಠಾಣೆ (ಡಾಂಡೇಲಿ ಮೊದಲು)" lang={lang}>
              <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
                {ukFirst.map(s => (
                  <option key={s.station_id} value={s.station_id}>
                    {s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm border border-white/10">
              <h4 className="font-semibold text-yellow-300 flex items-center gap-2"><FileText size={14} />Summary</h4>
              {[
                ['Complainant', form.complainant_name],
                ['Phone', form.complainant_phone],
                ['Crime', `${form.crime_category} — ${form.sub_category}`],
                ['Date', form.incident_date],
                ['Place', form.incident_place],
              ].map(([k, v]) => v && (
                <div key={k} className="flex gap-2 text-xs"><span className="text-gray-500 w-24">{k}:</span><span className="text-white">{v}</span></div>
              ))}
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
              ⚠️ Filing a false FIR is an offence punishable under Section 182 IPC. Ensure all information is accurate.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/15 transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-300 transition-colors">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">
            <Shield size={16} /> Submit FIR / Complaint
          </button>
        )}
      </div>
    </div>
  );
}

// ─── FORM: e-Lost Report ─────────────────────────────────────────────
function ELostForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    applicant_name: '', applicant_phone: '', applicant_address: '',
    article_type: 'Mobile Phone', imei_number: '', vehicle_number: '',
    document_type: '', article_description: '', date_lost: '', place_lost: '',
    station_id: 'KL001',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
        📄 e-Lost Report generates a PDF acknowledgement accepted by telecom companies, banks & courts for duplicate ID/SIM cards.
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Your Full Name" labelKn="ಹೆಸರು" lang={lang}><Input required value={form.applicant_name} onChange={e => set('applicant_name', e.target.value)} placeholder="Full name" /></Field>
        <Field label="Phone" labelKn="ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.applicant_phone} onChange={e => set('applicant_phone', e.target.value)} placeholder="10-digit" /></Field>
      </div>
      <Field label="Your Address" labelKn="ವಿಳಾಸ" lang={lang}><Textarea value={form.applicant_address} onChange={e => set('applicant_address', e.target.value)} placeholder="Full address with pincode" /></Field>
      <Field label="Type of Lost Article" labelKn="ಕಳೆದ ವಸ್ತು ಪ್ರಕಾರ" lang={lang}>
        <Select value={form.article_type} onChange={e => set('article_type', e.target.value)}>
          {lostArticleTypes.map(t => <option key={t}>{t}</option>)}
        </Select>
      </Field>
      {form.article_type === 'Mobile Phone' && (
        <Field label="IMEI Number" labelKn="IMEI ಸಂಖ್ಯೆ" lang={lang}><Input value={form.imei_number} onChange={e => set('imei_number', e.target.value)} placeholder="Dial *#06# to get IMEI (optional)" /></Field>
      )}
      {(form.article_type.includes('Vehicle')) && (
        <Field label="Vehicle Registration Number" labelKn="ವಾಹನ ನಂಬರ್" lang={lang}><Input value={form.vehicle_number} onChange={e => set('vehicle_number', e.target.value)} placeholder="e.g. KA-65-AB-1234" /></Field>
      )}
      {form.article_type.includes('Document') || form.article_type.includes('Card') || form.article_type.includes('Licence') ? (
        <Field label="Document Details" labelKn="ದಾಖಲೆ ವಿವರ" lang={lang}><Input value={form.document_type} onChange={e => set('document_type', e.target.value)} placeholder="Card/document number if known" /></Field>
      ) : null}
      <Field label="Description of Lost Article" labelKn="ವಸ್ತುವಿನ ವಿವರ" lang={lang}><Textarea value={form.article_description} onChange={e => set('article_description', e.target.value)} placeholder="Brand, colour, model, distinguishing marks..." /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date Lost" labelKn="ಕಳೆದ ದಿನಾಂಕ" lang={lang}><Input type="date" value={form.date_lost} onChange={e => set('date_lost', e.target.value)} max={new Date().toISOString().split('T')[0]} /></Field>
        <Field label="Place Lost" labelKn="ಕಳೆದ ಸ್ಥಳ" lang={lang}><Input value={form.place_lost} onChange={e => set('place_lost', e.target.value)} placeholder="Location where lost" /></Field>
      </div>
      <Field label="Nearest Police Station" labelKn="ಹತ್ತಿರದ ಠಾಣೆ" lang={lang}>
        <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
          {ukFirst.map(s => <option key={s.station_id} value={s.station_id}>{s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}</option>)}
        </Select>
      </Field>
      <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
        <Download size={16} /> Generate e-Lost Report PDF
      </button>
    </div>
  );
}

// ─── FORM: Cyber Crime ───────────────────────────────────────────────
function CyberForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    complainant_name: '', complainant_phone: '', complainant_email: '',
    complainant_address: '', id_type: 'Aadhaar', id_number: '',
    cyber_type: '', date_of_fraud: '', amount_lost: '', upi_id: '',
    fraud_phone: '', fraud_url: '', transaction_ids: '',
    incident_description: '', bank_name: '', bank_account: '',
    station_id: 'KL001',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;

  return (
    <div className="space-y-4">
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-xs text-purple-300">
        🚨 For financial fraud, also report immediately to <strong>1930</strong> (Cyber Crime Helpline) and <strong>cybercrime.gov.in</strong>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Your Full Name" labelKn="ಹೆಸರು" lang={lang}><Input required value={form.complainant_name} onChange={e => set('complainant_name', e.target.value)} placeholder="Full name" /></Field>
        <Field label="Phone" labelKn="ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.complainant_phone} onChange={e => set('complainant_phone', e.target.value)} /></Field>
      </div>
      <Field label="Email" labelKn="ಇಮೇಲ್" lang={lang}><Input type="email" value={form.complainant_email} onChange={e => set('complainant_email', e.target.value)} /></Field>
      <Field label="Full Address" labelKn="ವಿಳಾಸ" lang={lang}><Textarea value={form.complainant_address} onChange={e => set('complainant_address', e.target.value)} placeholder="Full address with pincode" /></Field>
      <Field label="Type of Cyber Crime" labelKn="ಸೈಬರ್ ಅಪರಾಧ ಪ್ರಕಾರ" lang={lang}>
        <Select value={form.cyber_type} onChange={e => set('cyber_type', e.target.value)}>
          <option value="">-- Select Type --</option>
          {cyberSubCategories.map(c => <option key={c}>{c}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of Fraud / Incident" labelKn="ವಂಚನೆ ದಿನಾಂಕ" lang={lang}><Input type="date" value={form.date_of_fraud} onChange={e => set('date_of_fraud', e.target.value)} max={new Date().toISOString().split('T')[0]} /></Field>
        <Field label="Amount Lost (₹)" labelKn="ನಷ್ಟ ಮೊತ್ತ (₹)" lang={lang}><Input type="number" value={form.amount_lost} onChange={e => set('amount_lost', e.target.value)} placeholder="In rupees (if financial)" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fraudster's Phone / UPI ID" labelKn="ವಂಚಕ ಫೋನ್ / UPI" lang={lang}><Input value={form.fraud_phone} onChange={e => set('fraud_phone', e.target.value)} placeholder="+91-XXXXXXXXXX or UPI@bank" /></Field>
        <Field label="Fraudulent URL / App" labelKn="ನಕಲಿ URL / ಆ್ಯಪ್" lang={lang}><Input value={form.fraud_url} onChange={e => set('fraud_url', e.target.value)} placeholder="Website or app name" /></Field>
      </div>
      <Field label="Transaction IDs / Reference Numbers" labelKn="ವ್ಯವಹಾರ ಸಂಖ್ಯೆಗಳು" lang={lang}><Textarea value={form.transaction_ids} onChange={e => set('transaction_ids', e.target.value)} placeholder="List all UTR / transaction reference numbers (one per line)" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Your Bank Name" labelKn="ಬ್ಯಾಂಕ್" lang={lang}><Input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. SBI, Canara Bank" /></Field>
        <Field label="Your Account / UPI Number" labelKn="ಖಾತೆ / UPI ಸಂಖ್ಯೆ" lang={lang}><Input value={form.bank_account} onChange={e => set('bank_account', e.target.value)} placeholder="Last 4 digits only" /></Field>
      </div>
      <Field label="Detailed Description" labelKn="ವಿಸ್ತೃತ ವಿವರಣೆ" lang={lang}><Textarea value={form.incident_description} onChange={e => set('incident_description', e.target.value)} placeholder="Explain what happened step by step..." className="min-h-[100px]" /></Field>
      <Field label="Police Station" labelKn="ಪೊಲೀಸ್ ಠಾಣೆ" lang={lang}>
        <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
          {ukFirst.map(s => <option key={s.station_id} value={s.station_id}>{s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}</option>)}
        </Select>
      </Field>
      <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="w-full py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2">
        <Shield size={16} /> Submit Cyber Crime Complaint
      </button>
    </div>
  );
}

// ─── FORM: Tenant Verification ────────────────────────────────────────
function TenantForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    landlord_name: '', landlord_phone: '', landlord_address: '',
    tenant_name: '', tenant_phone: '', tenant_permanent_address: '',
    tenant_native: '', tenant_occupation: '', tenant_id_type: 'Aadhaar', tenant_id_number: '',
    rental_address: '', rental_from: '', monthly_rent: '',
    num_occupants: '', station_id: 'KL001',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;

  return (
    <div className="space-y-5">
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-xs text-green-300">
        🏠 Tenant Verification is mandatory under Karnataka Rent Control Act. Complete within 24 hours of tenant moving in.
      </div>
      <div>
        <h4 className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2"><Home size={14} /> {L('Landlord Details', 'ಮಾಲೀಕರ ವಿವರ')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Landlord Name" labelKn="ಮಾಲೀಕರ ಹೆಸರು" lang={lang}><Input required value={form.landlord_name} onChange={e => set('landlord_name', e.target.value)} /></Field>
          <Field label="Landlord Phone" labelKn="ಮಾಲೀಕರ ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.landlord_phone} onChange={e => set('landlord_phone', e.target.value)} /></Field>
        </div>
        <Field label="Landlord Address" labelKn="ಮಾಲೀಕರ ವಿಳಾಸ" lang={lang}><Textarea value={form.landlord_address} onChange={e => set('landlord_address', e.target.value)} placeholder="Permanent address of landlord" /></Field>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2"><User size={14} /> {L('Tenant Details', 'ಕಿರಾಯಿದಾರ ವಿವರ')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tenant Full Name" labelKn="ಕಿರಾಯಿದಾರ ಹೆಸರು" lang={lang}><Input required value={form.tenant_name} onChange={e => set('tenant_name', e.target.value)} /></Field>
          <Field label="Tenant Phone" labelKn="ಕಿರಾಯಿದಾರ ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.tenant_phone} onChange={e => set('tenant_phone', e.target.value)} /></Field>
        </div>
        <Field label="Tenant's Permanent Address" labelKn="ಶಾಶ್ವತ ವಿಳಾಸ" lang={lang}><Textarea value={form.tenant_permanent_address} onChange={e => set('tenant_permanent_address', e.target.value)} placeholder="Native address" /></Field>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Native District / State" labelKn="ಮೂಲ ಜಿಲ್ಲೆ / ರಾಜ್ಯ" lang={lang}><Input value={form.tenant_native} onChange={e => set('tenant_native', e.target.value)} placeholder="e.g. Udupi, Karnataka" /></Field>
          <Field label="Occupation" labelKn="ವೃತ್ತಿ" lang={lang}><Input value={form.tenant_occupation} onChange={e => set('tenant_occupation', e.target.value)} placeholder="e.g. Software Engineer, Farmer" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="ID Type" labelKn="ಗುರುತಿನ ಪ್ರಕಾರ" lang={lang}>
            <Select value={form.tenant_id_type} onChange={e => set('tenant_id_type', e.target.value)}>
              {['Aadhaar', 'PAN Card', 'Driving Licence', 'Voter ID', 'Passport'].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="ID Number" labelKn="ಗುರುತಿನ ಸಂಖ್ಯೆ" lang={lang}><Input value={form.tenant_id_number} onChange={e => set('tenant_id_number', e.target.value)} /></Field>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2"><MapPin size={14} /> {L('Rental Property Details', 'ಬಾಡಿಗೆ ಆಸ್ತಿ ವಿವರ')}</h4>
        <Field label="Rental Property Address" labelKn="ಬಾಡಿಗೆ ಮನೆ ವಿಳಾಸ" lang={lang}><Textarea value={form.rental_address} onChange={e => set('rental_address', e.target.value)} placeholder="Full address of rented property" /></Field>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Field label="Rental From (Date)" labelKn="ಬಾಡಿಗೆ ದಿನಾಂಕ" lang={lang}><Input type="date" value={form.rental_from} onChange={e => set('rental_from', e.target.value)} /></Field>
          <Field label="Monthly Rent (₹)" labelKn="ಮಾಸಿಕ ಬಾಡಿಗೆ" lang={lang}><Input type="number" value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)} /></Field>
          <Field label="No. of Occupants" labelKn="ವ್ಯಕ್ತಿಗಳ ಸಂಖ್ಯೆ" lang={lang}><Input type="number" value={form.num_occupants} onChange={e => set('num_occupants', e.target.value)} /></Field>
        </div>
      </div>
      <Field label="Police Station" labelKn="ಪೊಲೀಸ್ ಠಾಣೆ" lang={lang}>
        <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
          {ukFirst.map(s => <option key={s.station_id} value={s.station_id}>{s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}</option>)}
        </Select>
      </Field>
      <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-colors flex items-center justify-center gap-2">
        <CheckCircle2 size={16} /> Submit Tenant Verification
      </button>
    </div>
  );
}

// ─── FORM: Senior Citizen Registration ───────────────────────────────
function SeniorCitizenForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    name: '', age: '', phone: '', address: '', pincode: '',
    medical_conditions: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_relation: '',
    lives_alone: 'No', id_type: 'Aadhaar', id_number: '',
    station_id: 'KL001',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;

  return (
    <div className="space-y-4">
      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 text-xs text-orange-300">
        👴 Registered senior citizens get monthly beat officer visits & priority emergency response under KSP Senior Citizen Safety Initiative.
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Senior Citizen's Name" labelKn="ಹೆಸರು" lang={lang}><Input required value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Age" labelKn="ವಯಸ್ಸು" lang={lang}><Input type="number" min={60} value={form.age} onChange={e => set('age', e.target.value)} placeholder="Min. 60 years" /></Field>
      </div>
      <Field label="Phone Number" labelKn="ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label="Full Residential Address" labelKn="ವಾಸದ ವಿಳಾಸ" lang={lang}><Textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="House No., Street, Ward/Colony, City, District" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pincode" labelKn="ಪಿನ್‌ಕೋಡ್" lang={lang}><Input maxLength={6} value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="e.g. 581325" /></Field>
        <Field label="Lives Alone?" labelKn="ಒಂಟಿಯಾಗಿ ವಾಸಿಸುತ್ತಾರೆಯೇ?" lang={lang}>
          <Select value={form.lives_alone} onChange={e => set('lives_alone', e.target.value)}>
            <option>No</option><option>Yes</option>
          </Select>
        </Field>
      </div>
      <Field label="Medical Conditions / Special Needs" labelKn="ವೈದ್ಯಕೀಯ ಸ್ಥಿತಿ" lang={lang}><Textarea value={form.medical_conditions} onChange={e => set('medical_conditions', e.target.value)} placeholder="e.g. Diabetes, Hypertension, requires wheelchair..." /></Field>
      <div>
        <h4 className="text-sm font-semibold text-yellow-300 mb-3">{L('Emergency Contact', 'ತುರ್ತು ಸಂಪರ್ಕ')}</h4>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Contact Name" labelKn="ಸಂಪರ್ಕದ ಹೆಸರು" lang={lang}><Input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Son/Daughter/Relative" /></Field>
          <Field label="Contact Phone" labelKn="ಸಂಪರ್ಕ ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} /></Field>
          <Field label="Relation" labelKn="ಸಂಬಂಧ" lang={lang}><Input value={form.emergency_relation} onChange={e => set('emergency_relation', e.target.value)} placeholder="e.g. Son" /></Field>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="ID Type" labelKn="ಗುರುತಿನ ಪ್ರಕಾರ" lang={lang}>
          <Select value={form.id_type} onChange={e => set('id_type', e.target.value)}>
            {['Aadhaar', 'PAN Card', 'Driving Licence', 'Voter ID'].map(t => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="ID Number" labelKn="ಗುರುತಿನ ಸಂಖ್ಯೆ" lang={lang}><Input value={form.id_number} onChange={e => set('id_number', e.target.value)} /></Field>
      </div>
      <Field label="Police Station" labelKn="ಪೊಲೀಸ್ ಠಾಣೆ" lang={lang}>
        <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
          {ukFirst.map(s => <option key={s.station_id} value={s.station_id}>{s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}</option>)}
        </Select>
      </Field>
      <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="w-full py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-500 transition-colors flex items-center justify-center gap-2">
        <User size={16} /> Register as Senior Citizen
      </button>
    </div>
  );
}

// ─── FORM: Servant/Employee Verification ─────────────────────────────
function ServantForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    employer_name: '', employer_phone: '', employer_address: '',
    servant_name: '', servant_phone: '', servant_address: '', servant_native: '',
    servant_type: 'Domestic Help', id_type: 'Aadhaar', id_number: '',
    working_since: '', station_id: 'KL001',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;
  return (
    <div className="space-y-4">
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
        👷 Servant/Employee Verification helps ensure safety of your household and verify antecedents.
      </div>
      <div>
        <h4 className="text-sm font-semibold text-yellow-300 mb-3">{L('Employer Details', 'ಮಾಲೀಕ ವಿವರ')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employer Name" labelKn="ಮಾಲೀಕ ಹೆಸರು" lang={lang}><Input required value={form.employer_name} onChange={e => set('employer_name', e.target.value)} /></Field>
          <Field label="Employer Phone" labelKn="ಮಾಲೀಕ ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.employer_phone} onChange={e => set('employer_phone', e.target.value)} /></Field>
        </div>
        <Field label="Employer Address" labelKn="ಮಾಲೀಕ ವಿಳಾಸ" lang={lang}><Textarea value={form.employer_address} onChange={e => set('employer_address', e.target.value)} /></Field>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-yellow-300 mb-3">{L('Servant / Employee Details', 'ನೌಕರ ವಿವರ')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" labelKn="ಹೆಸರು" lang={lang}><Input required value={form.servant_name} onChange={e => set('servant_name', e.target.value)} /></Field>
          <Field label="Phone" labelKn="ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.servant_phone} onChange={e => set('servant_phone', e.target.value)} /></Field>
        </div>
        <Field label="Permanent Address" labelKn="ಶಾಶ್ವತ ವಿಳಾಸ" lang={lang}><Textarea value={form.servant_address} onChange={e => set('servant_address', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Type of Work" labelKn="ಕೆಲಸದ ಪ್ರಕಾರ" lang={lang}>
            <Select value={form.servant_type} onChange={e => set('servant_type', e.target.value)}>
              {['Domestic Help', 'Driver', 'Watchman/Guard', 'Cook', 'Baby Sitter', 'Plumber/Electrician', 'Other'].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Working Since" labelKn="ಕೆಲಸ ಆರಂಭ" lang={lang}><Input type="date" value={form.working_since} onChange={e => set('working_since', e.target.value)} max={new Date().toISOString().split('T')[0]} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="ID Type" labelKn="ಗುರುತಿನ ಪ್ರಕಾರ" lang={lang}>
            <Select value={form.id_type} onChange={e => set('id_type', e.target.value)}>
              {['Aadhaar', 'PAN Card', 'Driving Licence', 'Voter ID', 'Passport'].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="ID Number" labelKn="ಗುರುತಿನ ಸಂಖ್ಯೆ" lang={lang}><Input value={form.id_number} onChange={e => set('id_number', e.target.value)} /></Field>
        </div>
      </div>
      <Field label="Police Station" labelKn="ಪೊಲೀಸ್ ಠಾಣೆ" lang={lang}>
        <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
          {ukFirst.map(s => <option key={s.station_id} value={s.station_id}>{s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}</option>)}
        </Select>
      </Field>
      <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="w-full py-2.5 rounded-lg bg-yellow-600 text-white text-sm font-semibold hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2">
        <CheckCircle2 size={16} /> Submit Verification Request
      </button>
    </div>
  );
}

// ─── FORM: Event Permission ───────────────────────────────────────────
function EventForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    applicant_name: '', organization: '', phone: '', address: '',
    event_type: 'Cultural Programme', event_name: '', event_date: '',
    start_time: '', end_time: '', venue: '', expected_crowd: '',
    purpose: '', station_id: 'KL001',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;
  return (
    <div className="space-y-4">
      <div className="bg-teal-900/20 border border-teal-500/30 rounded-lg p-3 text-xs text-teal-300">
        📋 Apply at least <strong>15 days before</strong> the event. Police permission is mandatory for gatherings of 50+ persons.
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Applicant Name" labelKn="ಅರ್ಜಿದಾರ ಹೆಸರು" lang={lang}><Input required value={form.applicant_name} onChange={e => set('applicant_name', e.target.value)} /></Field>
        <Field label="Organisation / Party" labelKn="ಸಂಸ್ಥೆ / ಪಕ್ಷ" lang={lang}><Input value={form.organization} onChange={e => set('organization', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" labelKn="ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="Type of Event" labelKn="ಕಾರ್ಯಕ್ರಮ ಪ್ರಕಾರ" lang={lang}>
          <Select value={form.event_type} onChange={e => set('event_type', e.target.value)}>
            {eventTypes.map(t => <option key={t}>{t}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Event Name / Description" labelKn="ಕಾರ್ಯಕ್ರಮದ ಹೆಸರು" lang={lang}><Input value={form.event_name} onChange={e => set('event_name', e.target.value)} placeholder="Name or purpose of event" /></Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Event Date" labelKn="ದಿನಾಂಕ" lang={lang}><Input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} min={new Date().toISOString().split('T')[0]} /></Field>
        <Field label="Start Time" labelKn="ಆರಂಭ ಸಮಯ" lang={lang}><Input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} /></Field>
        <Field label="End Time" labelKn="ಅಂತ್ಯ ಸಮಯ" lang={lang}><Input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} /></Field>
      </div>
      <Field label="Venue / Route" labelKn="ಸ್ಥಳ / ಮಾರ್ಗ" lang={lang}><Textarea value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Full address, landmarks, or route of procession" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Expected Crowd" labelKn="ಅಂದಾಜು ಜನಸಂಖ್ಯೆ" lang={lang}><Input type="number" value={form.expected_crowd} onChange={e => set('expected_crowd', e.target.value)} placeholder="Number of expected attendees" /></Field>
        <Field label="Police Station" labelKn="ಪೊಲೀಸ್ ಠಾಣೆ" lang={lang}>
          <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
            {ukFirst.map(s => <option key={s.station_id} value={s.station_id}>{s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Purpose / Brief Description" labelKn="ಉದ್ದೇಶ / ವಿವರ" lang={lang}><Textarea value={form.purpose} onChange={e => set('purpose', e.target.value)} placeholder="Brief description of purpose and programme" /></Field>
      <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="w-full py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 transition-colors flex items-center justify-center gap-2">
        <Calendar size={16} /> Apply for Event Permission
      </button>
    </div>
  );
}

// ─── FORM: Missing Person ─────────────────────────────────────────────
function MissingPersonForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    reporter_name: '', reporter_phone: '', reporter_relation: '',
    missing_name: '', missing_age: '', missing_gender: 'Male', _match_checked: '',
    missing_address: '', date_missing: '', last_seen_location: '',
    description: '', distinguishing_marks: '', last_seen_wearing: '',
    station_id: 'KL001',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;
  return (
    <div className="space-y-4">
      <div className="bg-rose-900/20 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-300">
        🚨 For missing children (under 18), dial <strong>1098</strong> (Childline) immediately. All missing person reports are shared with ERSS 112.
      </div>
      <div>
        <h4 className="text-sm font-semibold text-yellow-300 mb-3">{L('Reporter Details', 'ವರದಿ ಮಾಡುವವರ ವಿವರ')}</h4>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Your Name" labelKn="ನಿಮ್ಮ ಹೆಸರು" lang={lang}><Input required value={form.reporter_name} onChange={e => set('reporter_name', e.target.value)} /></Field>
          <Field label="Your Phone" labelKn="ನಿಮ್ಮ ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.reporter_phone} onChange={e => set('reporter_phone', e.target.value)} /></Field>
          <Field label="Relation to Missing" labelKn="ಸಂಬಂಧ" lang={lang}><Input value={form.reporter_relation} onChange={e => set('reporter_relation', e.target.value)} placeholder="e.g. Father, Friend" /></Field>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2"><UserX size={14} />{L('Missing Person Details', 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿ ವಿವರ')}</h4>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Full Name" labelKn="ಹೆಸರು" lang={lang}><Input required value={form.missing_name} onChange={e => set('missing_name', e.target.value)} /></Field>
          <Field label="Age" labelKn="ವಯಸ್ಸು" lang={lang}><Input type="number" value={form.missing_age} onChange={e => set('missing_age', e.target.value)} /></Field>
          <Field label="Gender" labelKn="ಲಿಂಗ" lang={lang}>
            <Select value={form.missing_gender} onChange={e => set('missing_gender', e.target.value)}>
              <option>Male</option><option>Female</option><option>Other</option>
            </Select>
          </Field>
        </div>
        <Field label="Residential Address" labelKn="ವಾಸದ ವಿಳಾಸ" lang={lang}><Textarea value={form.missing_address} onChange={e => set('missing_address', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Date Missing" labelKn="ನಾಪತ್ತೆ ದಿನಾಂಕ" lang={lang}><Input type="date" value={form.date_missing} onChange={e => set('date_missing', e.target.value)} max={new Date().toISOString().split('T')[0]} /></Field>
          <Field label="Last Seen Location" labelKn="ಕೊನೆಯ ಬಾರಿ ಕಂಡ ಸ್ಥಳ" lang={lang}><Input value={form.last_seen_location} onChange={e => set('last_seen_location', e.target.value)} placeholder="Area, landmark" /></Field>
        </div>
        <Field label="Physical Description" labelKn="ದೈಹಿಕ ವಿವರಣೆ" lang={lang}><Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Height, build, complexion, hair, any medical condition..." /></Field>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Distinguishing Marks" labelKn="ವಿಶೇಷ ಗುರುತುಗಳು" lang={lang}><Input value={form.distinguishing_marks} onChange={e => set('distinguishing_marks', e.target.value)} placeholder="Scars, tattoos, moles..." /></Field>
          <Field label="Last Seen Wearing" labelKn="ಕೊನೆಯ ಬಾರಿ ತೊಟ್ಟ ಉಡುಪು" lang={lang}><Input value={form.last_seen_wearing} onChange={e => set('last_seen_wearing', e.target.value)} placeholder="Colour and type of clothes" /></Field>
        </div>
      </div>
      <Field label="Police Station" labelKn="ಪೊಲೀಸ್ ಠಾಣೆ" lang={lang}>
        <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
          {ukFirst.map(s => <option key={s.station_id} value={s.station_id}>{s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}</option>)}
        </Select>
      </Field>
      <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="w-full py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 transition-colors flex items-center justify-center gap-2">
        <UserX size={16} /> File Missing Person Report
      </button>
    </div>
  );
}

// ─── FORM: NOC Passport / Loudspeaker ────────────────────────────────
function NocForm({ lang, onSubmit }: { lang: string; onSubmit: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    applicant_name: '', phone: '', address: '',
    noc_type: 'Passport', passport_file_no: '', date_of_birth: '',
    loudspeaker_purpose: '', loudspeaker_date: '', loudspeaker_location: '',
    station_id: 'KL001',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Your Full Name" labelKn="ಹೆಸರು" lang={lang}><Input required value={form.applicant_name} onChange={e => set('applicant_name', e.target.value)} /></Field>
        <Field label="Phone" labelKn="ದೂರವಾಣಿ" lang={lang}><Input type="tel" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
      </div>
      <Field label="Address" labelKn="ವಿಳಾಸ" lang={lang}><Textarea value={form.address} onChange={e => set('address', e.target.value)} /></Field>
      <Field label="NOC Type" labelKn="NOC ಪ್ರಕಾರ" lang={lang}>
        <Select value={form.noc_type} onChange={e => set('noc_type', e.target.value)}>
          <option>Passport</option><option>Loudspeaker / DJ</option><option>Arms Licence</option>
        </Select>
      </Field>
      {form.noc_type === 'Passport' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Passport File No. (if renewal)" labelKn="ಪಾಸ್‌ಪೋರ್ಟ್ ಫೈಲ್ ಸಂಖ್ಯೆ" lang={lang}><Input value={form.passport_file_no} onChange={e => set('passport_file_no', e.target.value)} placeholder="Leave blank if fresh" /></Field>
          <Field label="Date of Birth" labelKn="ಜನ್ಮ ದಿನಾಂಕ" lang={lang}><Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></Field>
        </div>
      )}
      {form.noc_type.includes('Loudspeaker') && (
        <>
          <Field label="Purpose / Event" labelKn="ಉದ್ದೇಶ" lang={lang}><Input value={form.loudspeaker_purpose} onChange={e => set('loudspeaker_purpose', e.target.value)} placeholder="Wedding, Cultural event, etc." /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Use" labelKn="ಉಪಯೋಗದ ದಿನಾಂಕ" lang={lang}><Input type="date" value={form.loudspeaker_date} onChange={e => set('loudspeaker_date', e.target.value)} min={new Date().toISOString().split('T')[0]} /></Field>
            <Field label="Location" labelKn="ಸ್ಥಳ" lang={lang}><Input value={form.loudspeaker_location} onChange={e => set('loudspeaker_location', e.target.value)} placeholder="Venue address" /></Field>
          </div>
        </>
      )}
      <Field label="Police Station" labelKn="ಪೊಲೀಸ್ ಠಾಣೆ" lang={lang}>
        <Select value={form.station_id} onChange={e => set('station_id', e.target.value)}>
          {ukFirst.map(s => <option key={s.station_id} value={s.station_id}>{s.name} — {s.district} {s.district === 'Uttara Kannada' ? '★' : ''}</option>)}
        </Select>
      </Field>
      <button onClick={() => onSubmit(form as unknown as Record<string, string>)} className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2">
        <Lock size={16} /> Apply for NOC
      </button>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────
function SuccessScreen({ refNumber, type, onReset }: { refNumber: string; type: ComplaintType; onReset: () => void }) {
  const navigate = useNavigate();
  const label = COMPLAINT_TYPES[type].label;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 size={32} className="text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Submitted Successfully!</h3>
        <p className="text-gray-400 text-sm">{label} has been registered</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-1">Reference Number</p>
        <p className="text-lg font-mono font-bold text-yellow-300">{refNumber}</p>
        <p className="text-xs text-gray-500 mt-2">Note this number to track your complaint at <strong>/track</strong></p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-center">
        <QRCodeSVG value={`https://surakshakarnataka.gov.in/track?ref=${refNumber}`} size={120} bgColor="transparent" fgColor="#ffffff" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => { generateAcknowledgementPDF({
              refNumber: refNumber,
              type: COMPLAINT_TYPES[type].label,
              complainantName: '',
              complainantPhone: '',
              stationName: 'Karnataka Police Station',
              stationPhone: '100',
              date: new Date().toLocaleDateString('en-IN'),
              details: 'Complaint filed via SurakshaKarnataka portal',
              status: 'Pending Review',
            }); }} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
          <Download size={16} /> Download PDF
        </button>
        <button onClick={() => navigate('/track')} className="flex-1 py-2.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/15 transition-colors">
          Track Status
        </button>
      </div>
      <button onClick={onReset} className="text-gray-500 text-xs hover:text-gray-400 transition-colors">
        + Submit another complaint
      </button>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────
export default function FileFIR() {
  const [searchParams] = useSearchParams();
  const { lang } = useI18nStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/file-fir' + (searchParams.get('type') ? '?type=' + searchParams.get('type') : ''));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-sm mb-4">Please login to file a complaint</p>
          <Link to="/login" className="px-6 py-2 bg-[#F0C75E] text-[#081428] font-semibold text-sm">Login / Sign Up</Link>
        </div>
      </div>
    );
  }

  const initialType = (searchParams.get('type') as ComplaintType) || 'fir';
  const initialStation = searchParams.get('station') || 'KL001';
  const [activeType, setActiveType] = useState<ComplaintType>(
    Object.keys(COMPLAINT_TYPES).includes(initialType) ? initialType : 'fir'
  );

  const handleSubmit = async (data: Record<string, string>) => {
    // Generate local fallback ref number
    const prefix = activeType === 'fir' ? 'FIR' : activeType === 'elost' ? 'EL' : activeType === 'cyber' ? 'CYB' : activeType.toUpperCase().slice(0, 3);
    const stationId = data.station_id || 'KL001';
    const distCode = stationId.includes('DT') || stationId.includes('DR') || stationId.includes('AB') ? 'UK/DAN'
      : stationId.startsWith('PS0') ? 'BNG/CP' : stationId.includes('KW') ? 'UK/KW' : 'KAR';
    const num = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
    const year = new Date().getFullYear();
    const localRef = `KAR/${year}/${distCode}/${prefix}/${num}`;

    // Map complaint type to API action
    const actionMap: Record<string, string> = {
      fir: 'register_fir',
      cyber: 'register_fir',
      elost: 'submit_elost',
      tenant: 'submit_tenant',
      servant: 'submit_tenant',
      senior: 'submit_senior',
      event: 'submit_event',
      missing: 'submit_missing',
      passport: 'submit_noc',
    };

    // Add crime category for cyber
    // Get current user for attribution
    const { user: currentUser } = (await import('@/store/authStore')).useAuthStore.getState();
    const payload = { ...data, created_by: currentUser?.user_id || currentUser?.email || 'citizen' };
    if (activeType === 'cyber') {
      payload.crime_category = 'Cyber Crime';
      payload.sub_category = data.cyber_type || 'Other Cyber Crime';
    }
    if (activeType === 'fir' && !payload.crime_category) {
      payload.crime_category = 'IPC';
    }
    
    // For missing person - check for existing matches first
    if (activeType === 'missing' && data.missing_age && data.missing_gender) {
      try {
        const matchRes = await fetch(`/api?action=check_missing_match&age=${data.missing_age}&gender=${data.missing_gender}&location=${encodeURIComponent(data.last_seen_location || '')}`);
        const matchJson = await matchRes.json();
        if (matchJson.success && matchJson.data.count > 0) {
          const matches = matchJson.data.possible_matches;
          const matchList = matches.map((m: Record<string,string>) => `• ${m.name}, Age ${m.age}, Last seen: ${m.last_seen_location}`).join('\n');
          toast(`⚠ ${matchJson.data.count} similar missing person record(s) found:\n${matchList}`, { duration: 8000 });
        }
      } catch { /* ignore */ }
    }
    if (activeType === 'passport') {
      payload.noc_type = data.noc_type || 'Passport';
      payload.applicant_name = data.complainant_name || '';
      payload.applicant_phone = data.complainant_phone || '';
      payload.applicant_address = data.complainant_address || '';
    }
    if (activeType === 'servant') {
      payload.landlord_name = data.employer_name || '';
      payload.landlord_phone = data.employer_phone || '';
      payload.tenant_name = data.servant_name || '';
      payload.tenant_phone = data.servant_phone || '';
      payload.tenant_permanent_address = data.servant_address || '';
      payload.rental_address = data.employer_address || '';
      payload.rental_from = data.working_since || new Date().toISOString().split('T')[0];
      payload.tenant_id_type = data.id_type || 'Aadhaar';
      payload.tenant_id_number = data.id_number || '';
    }

    let finalRef = localRef;
    let savedToDb = false;
    try {
      const res = await fetch(
        `/api?action=${actionMap[activeType] || 'register_fir'}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) }
      );
      const json = await res.json();
      if (json.success) {
        // Check for duplicate warning
        if (json.data?.warning === 'POSSIBLE_DUPLICATE') {
          const proceed = window.confirm(`⚠ Possible Duplicate Detected!\n\nA similar FIR already exists: ${json.data.existing_fir}\n\nDo you still want to file a new complaint?`);
          if (!proceed) { setLoading(false); return; }
          // User confirmed - proceed with local ref
          finalRef = localRef;
          savedToDb = false;
        } else {
          // Use DB-generated reference number (authoritative)
          finalRef = json.data.fir_number || json.data.report_number || json.data.reference || json.data.verify_id || json.data.perm_id || json.data.missing_id || json.data.citizen_id || localRef;
          savedToDb = true;
        }
      } else {
        // API returned error - show it
        console.warn('API error:', json.error);
        toast.error(`DB error: ${json.error || 'Submission failed'} — saved locally`);
      }
    } catch (err) {
      // Network error - XAMPP not running
      console.warn('API unreachable:', err);
      toast.error('XAMPP not reachable — complaint saved locally only');
    }

    setRefNumber(finalRef);
    setSubmitted(true);
    toast.success(`Submitted! Ref: ${finalRef}`);

    // Save to localStorage so TrackComplaint and CitizenDashboard can find it
    try {
      const stored = localStorage.getItem('sk_submitted_refs');
      const refs: Record<string, Record<string, string>> = stored ? JSON.parse(stored) : {};
      // Find station name from stations data
      const { stations: stationList } = await import('@/data/stations');
      const stationObj = stationList.find(s => s.station_id === (data.station_id || 'KL001'));
      refs[finalRef] = {
        complainant_name: data.complainant_name || data.applicant_name || data.reporter_name || currentUser?.name || 'Applicant',
        complainant_phone: data.complainant_phone || data.applicant_phone || data.reporter_phone || currentUser?.phone || '',
        complainant_address: data.complainant_address || data.applicant_address || '',
        crime_category: data.crime_category || activeType.toUpperCase(),
        sub_category: data.sub_category || data.cyber_type || data.article_type || activeType,
        incident_date: data.incident_date || data.date_lost || data.date_missing || new Date().toISOString().split('T')[0],
        incident_place: data.incident_place || data.place_lost || data.last_seen_location || '',
        incident_description: data.incident_description || data.article_description || data.description || `${COMPLAINT_TYPES[activeType].label} submitted`,
        station_id: data.station_id || 'KL001',
        station_name: stationObj ? `${stationObj.name} Police Station` : (data.station_id || 'Police Station'),
        station_phone: stationObj?.phone || '',
        created_at: new Date().toISOString(),
        status: 'Pending',
        filed_by_email: currentUser?.email || '',
        filed_by_user_id: currentUser?.user_id || '',
      };
      localStorage.setItem('sk_submitted_refs', JSON.stringify(refs));
    } catch { /* */ }
  };

  const resetForm = () => { setSubmitted(false); setRefNumber(''); };

  const cfg = COMPLAINT_TYPES[activeType];
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-[#0a1628] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl bg-gradient-to-br ${cfg.color} border ${cfg.border} p-5 mb-6`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Icon size={20} className="text-yellow-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {lang === 'kn' ? cfg.labelKn : cfg.label}
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <Shield size={10} />
                SurakshaKarnataka · Karnataka State Police · Secure & Encrypted
              </p>
            </div>
          </div>
        </div>

        {/* Helplines strip */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[['112', 'ERSS'], ['1930', 'Cyber'], ['1091', 'Women'], ['1098', 'Child']].map(([num, lbl]) => (
            <a key={num} href={`tel:${num}`} className="flex flex-col items-center py-2 bg-red-900/20 border border-red-500/20 rounded-lg hover:bg-red-900/30 transition-colors">
              <span className="text-red-400 font-bold text-sm">{num}</span>
              <span className="text-gray-500 text-xs">{lbl}</span>
            </a>
          ))}
        </div>

        {/* Type selector */}
        {!submitted && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Select Service Type</p>
            <TypeSelector current={activeType} lang={lang} onSelect={t => { setActiveType(t); resetForm(); }} />
          </div>
        )}

        {/* Form area */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <AnimatePresence mode="wait">
            {submitted ? (
              <SuccessScreen key="success" refNumber={refNumber} type={activeType} onReset={resetForm} />
            ) : (
              <motion.div key={activeType} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {activeType === 'fir' && <FIRForm lang={lang} onSubmit={handleSubmit} />}
                {activeType === 'elost' && <ELostForm lang={lang} onSubmit={handleSubmit} />}
                {activeType === 'cyber' && <CyberForm lang={lang} onSubmit={handleSubmit} />}
                {activeType === 'tenant' && <TenantForm lang={lang} onSubmit={handleSubmit} />}
                {activeType === 'servant' && <ServantForm lang={lang} onSubmit={handleSubmit} />}
                {activeType === 'senior' && <SeniorCitizenForm lang={lang} onSubmit={handleSubmit} />}
                {activeType === 'event' && <EventForm lang={lang} onSubmit={handleSubmit} />}
                {activeType === 'missing' && <MissingPersonForm lang={lang} onSubmit={handleSubmit} />}
                {activeType === 'passport' && <NocForm lang={lang} onSubmit={handleSubmit} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 mt-4">
          SurakshaKarnataka · ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ · Powered by KSP CCTNS · All information is secure
        </p>
      </div>
    </div>
  );
}
