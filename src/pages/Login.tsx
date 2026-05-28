import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, UserCheck, BarChart3, Eye, EyeOff, Phone, Mail, Lock } from 'lucide-react';

type Tab = 'citizen' | 'police' | 'admin';
type Mode = 'login' | 'signup';

const DEMO: Record<Tab, { email: string; password: string }> = {
  citizen:  { email: 'suresh@citizen.in',           password: 'Citizen@123' },
  police:   { email: 'sho.kolar@ksp.gov.in',       password: 'Police@123' },
  admin:    { email: 'sp.kolar@ksp.gov.in',         password: 'SP@123' },
};

export default function Login() {
  const navigate = useNavigate();
  const { login, signup, isLoading } = useAuthStore();
  const { lang } = useI18nStore();
  const [tab, setTab] = useState<Tab>('citizen');
  const [mode, setMode] = useState<Mode>('login');
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const L = (en: string, kn: string) => lang === 'kn' ? kn : en;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill all fields'); return; }
    const ok = await login(form.email, form.password);
    if (ok) {
      toast.success('Login successful!');
      const role = useAuthStore.getState().role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'police') navigate('/police');
      else navigate('/citizen');
    } else {
      toast.error(useAuthStore.getState().error || 'Invalid credentials');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) { toast.error('Fill all fields'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const ok = await signup(form.name, form.email, form.phone, form.password);
    if (ok) {
      toast.success('Account created! Welcome.');
      navigate('/citizen');
    } else {
      toast.error(useAuthStore.getState().error || 'Signup failed');
    }
  };

  const tabs = [
    { key: 'citizen' as Tab, icon: User,       label: 'Citizen',  labelKn: 'ನಾಗರಿಕ' },
    { key: 'police'  as Tab, icon: UserCheck,  label: 'Police',   labelKn: 'ಪೊಲೀಸ್' },
    { key: 'admin'   as Tab, icon: BarChart3,  label: 'Admin',    labelKn: 'ಆಡಳಿತ' },
  ];

  return (
    <div className="min-h-screen bg-[#081428] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-[#F0C75E] mx-auto mb-3" />
          <h1 className="text-xl font-bold text-[#F5F5F0] uppercase tracking-wider">SurakshaKarnataka</h1>
          <p className="text-gray-500 text-sm mt-1">ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ · Karnataka State Police</p>
        </div>

        <div className="bg-[#F5F5F0] border border-[#2A3244]">
          {/* Role Tabs */}
          <div className="flex border-b border-[#e5e7eb]">
            {tabs.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setMode('login'); setForm({ name:'', email:'', phone:'', password:'', confirm:'' }); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wider font-medium transition-colors ${tab === t.key ? 'bg-[#081428] text-[#F0C75E]' : 'text-gray-500 hover:text-[#081428] hover:bg-gray-100'}`}>
                <t.icon className="w-4 h-4" />
                {lang === 'kn' ? t.labelKn : t.label}
              </button>
            ))}
          </div>

          {/* Login / Signup toggle — only for citizens */}
          {tab === 'citizen' && (
            <div className="flex border-b border-[#e5e7eb]">
              {(['login','signup'] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-wider font-medium transition-colors ${mode === m ? 'bg-[#A8362A] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {m === 'login' ? L('Login','ಲಾಗಿನ್') : L('Sign Up','ನೋಂದಣಿ')}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form key="login" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onSubmit={handleLogin} className="p-6 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {L('Email','ಇಮೇಲ್')}
                  </label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm bg-white"
                    placeholder="Enter your email" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {L('Password','ಪಾಸ್‌ವರ್ಡ್')}
                  </label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm bg-white pr-10"
                      placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-3 bg-[#081428] text-[#F5F5F0] text-sm uppercase tracking-wider font-medium hover:bg-[#0F1E36] transition-colors disabled:opacity-50">
                  {isLoading ? 'Logging in...' : L('Login','ಲಾಗಿನ್')}
                </button>
                {tab === 'citizen' && (
                  <p className="text-xs text-center text-gray-500">
                    No account? <button type="button" onClick={() => setMode('signup')} className="text-[#A8362A] hover:underline font-medium">{L('Sign Up here','ಇಲ್ಲಿ ನೋಂದಣಿ ಮಾಡಿ')}</button>
                  </p>
                )}
                {/* Demo fill */}
                <div className="pt-3 border-t border-[#e5e7eb] text-center">
                  <button type="button" onClick={() => setForm(f => ({ ...f, email: DEMO[tab].email, password: DEMO[tab].password }))}
                    className="text-xs text-[#A8362A] hover:underline">
                    Use demo credentials
                  </button>
                  <p className="text-[0.62rem] text-gray-400 mt-0.5">{DEMO[tab].email} / {DEMO[tab].password}</p>
                </div>
              </motion.form>
            ) : (
              <motion.form key="signup" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onSubmit={handleSignup} className="p-6 space-y-4">
                <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 p-2 rounded">
                  Create a citizen account to file complaints, track status, and get station recommendations near you.
                </p>
                {[
                  { label:'Full Name', labelKn:'ಪೂರ್ಣ ಹೆಸರು', key:'name', type:'text', icon: User, placeholder:'As on ID proof' },
                  { label:'Email',     labelKn:'ಇಮೇಲ್',       key:'email', type:'email', icon: Mail, placeholder:'your@email.com' },
                  { label:'Phone',     labelKn:'ಫೋನ್',         key:'phone', type:'tel',   icon: Phone, placeholder:'10-digit mobile number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block">
                      {lang === 'kn' ? f.labelKn : f.label}
                    </label>
                    <input type={f.type} value={form[f.key as keyof typeof form]}
                      onChange={e => set(f.key, e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm bg-white"
                      placeholder={f.placeholder} />
                  </div>
                ))}
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block">{L('Password','ಪಾಸ್‌ವರ್ಡ್')}</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm bg-white pr-10"
                      placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block">{L('Confirm Password','ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ')}</label>
                  <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#e5e7eb] focus:border-[#081428] outline-none text-sm bg-white"
                    placeholder="Repeat password" />
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-3 bg-[#A8362A] text-white text-sm uppercase tracking-wider font-medium hover:bg-[#8B2D22] transition-colors disabled:opacity-50">
                  {isLoading ? 'Creating account...' : L('Create Account','ಖಾತೆ ರಚಿಸಿ')}
                </button>
                <p className="text-xs text-center text-gray-500">
                  Already have an account? <button type="button" onClick={() => setMode('login')} className="text-[#081428] hover:underline font-medium">{L('Login','ಲಾಗಿನ್')}</button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
