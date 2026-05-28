import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore, t } from '@/store/i18nStore';
import {
  Shield, Menu, X, LogOut, ChevronDown, User, LayoutDashboard,
  UserCheck, BarChart3, FileText, MapPin, Phone
} from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'online'|'offline'|'checking'>('checking');

  // Check DB connection every 30 seconds
  useEffect(() => {
    const checkDB = async () => {
      try {
        const res = await fetch('/api?action=ping', { signal: AbortSignal.timeout(3000) });
        const j = await res.json();
        setDbStatus(j.success ? 'online' : 'offline');
      } catch {
        setDbStatus('offline');
      }
    };
    checkDB();
    const interval = setInterval(checkDB, 30000);
    return () => clearInterval(interval);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, role, logout } = useAuthStore();
  const { lang, toggle } = useI18nStore();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); setProfileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  // Scroll to section on homepage or navigate there first
  const scrollToSection = (id: string) => {
    if (location.pathname === '/') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
    setMobileMenuOpen(false);
  };

  const isHome = location.pathname === '/';

  const navLinks = [
    { label: 'Home', labelKn: 'ಮುಖಪುಟ', action: () => navigate('/') },
    { label: 'Services', labelKn: 'ಸೇವೆಗಳು', action: () => scrollToSection('services') },
    { label: 'Track', labelKn: 'ಟ್ರ್ಯಾಕ್', action: () => navigate('/track') },
    { label: 'Find Station', labelKn: 'ಠಾಣೆ ಹುಡುಕಿ', action: () => navigate('/stations') },
  ];

  return (
    <>
      <div className="bg-[#0a2540] text-white text-[0.7rem] uppercase tracking-[0.1em] py-2 px-4 hidden md:flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#F0C75E]" />
          <span>ಕರ್ನಾಟಕ ಸರ್ಕಾರ | Government of Karnataka</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <a href="tel:112" className="hover:text-[#F0C75E] transition-colors flex items-center gap-1"><Phone className="w-3 h-3" />112 Emergency</a>
          <a href="tel:1930" className="hover:text-[#F0C75E] transition-colors">1930 Cyber</a>
          <a href="tel:1091" className="hover:text-[#F0C75E] transition-colors">1091 Women</a>
        </div>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled || !isHome ? 'bg-[#081428] shadow-lg' : 'bg-transparent'}`} style={{ height: '72px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#F0C75E]" />
            <div className="flex flex-col">
              <span className="text-[#F5F5F0] font-bold text-sm tracking-wider uppercase">SurakshaKarnataka</span>
              <span className="text-[#F0C75E] text-[0.6rem] uppercase tracking-wider hidden sm:block">Karnataka State Police</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <button key={link.label} onClick={link.action}
                className="px-3 py-2 text-[0.8rem] uppercase tracking-wider font-medium transition-colors text-[#F5F5F0] hover:text-[#F0C75E]">
                {lang === 'kn' ? link.labelKn : link.label}
              </button>
            ))}
            <Link to="/file-fir" className="ml-2 px-3 py-2 bg-[#A8362A] text-white text-[0.75rem] uppercase tracking-wider hover:bg-[#8B2D22] transition-colors flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> {lang === 'kn' ? 'ದೂರು ದಾಖಲಿಸಿ' : 'File Complaint'}
            </Link>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* DB Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 border border-[#2A3244] text-[0.6rem] uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-green-400 animate-pulse' : dbStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-400 animate-pulse'}`} />
              <span className={dbStatus === 'online' ? 'text-green-400' : dbStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'}>
                {dbStatus === 'online' ? 'DB Live' : dbStatus === 'offline' ? 'DB Offline' : 'Connecting'}
              </span>
            </div>
            <button onClick={toggle} className="px-3 py-1 text-xs uppercase tracking-wider border border-[#F0C75E] text-[#F0C75E] hover:bg-[#F0C75E] hover:text-[#081428] transition-all">
              {lang === 'en' ? 'ಕನ್ನಡ' : 'EN'}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 text-[#F5F5F0] hover:text-[#F0C75E] transition-colors px-2 py-1">
                  <div className="w-7 h-7 bg-[#F0C75E] rounded-full flex items-center justify-center text-[#081428] font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#0F1E36] border border-[#2A3244] shadow-xl z-50">
                    <div className="p-4 border-b border-[#2A3244]">
                      <p className="text-[#F5F5F0] font-medium text-sm">{user?.name}</p>
                      <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#F0C75E] text-[#081428] text-[0.6rem] uppercase font-bold">{role}</span>
                    </div>
                    {role === 'citizen' && (
                      <Link to="/citizen" className="flex items-center gap-2 px-4 py-3 text-[#F5F5F0] hover:bg-[#152238] text-sm" onClick={() => setProfileOpen(false)}>
                        <User className="w-4 h-4" /> My Dashboard
                      </Link>
                    )}
                    {role === 'police' && (
                      <Link to="/police" className="flex items-center gap-2 px-4 py-3 text-[#F5F5F0] hover:bg-[#152238] text-sm" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard className="w-4 h-4" /> Police Dashboard
                      </Link>
                    )}
                    {role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-3 text-[#F5F5F0] hover:bg-[#152238] text-sm" onClick={() => setProfileOpen(false)}>
                        <BarChart3 className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <Link to="/file-fir" className="flex items-center gap-2 px-4 py-3 text-[#F5F5F0] hover:bg-[#152238] text-sm" onClick={() => setProfileOpen(false)}>
                      <FileText className="w-4 h-4" /> File Complaint
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-[#152238] text-sm w-full border-t border-[#2A3244]">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#A8362A] text-[#F5F5F0] text-sm uppercase tracking-wider hover:bg-[#8B2D22] transition-colors">
                <UserCheck className="w-4 h-4" />
                {lang === 'kn' ? 'ಲಾಗಿನ್' : 'Login / Sign Up'}
              </Link>
            )}

            <button className="lg:hidden text-[#F5F5F0]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#081428] border-t border-[#2A3244]">
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map(link => (
                <button key={link.label} onClick={link.action}
                  className="text-left text-[#F5F5F0] hover:text-[#F0C75E] text-sm uppercase tracking-wider py-2.5 border-b border-[#2A3244] transition-colors">
                  {lang === 'kn' ? link.labelKn : link.label}
                </button>
              ))}
              <Link to="/file-fir" className="mt-2 px-4 py-2.5 bg-[#A8362A] text-white text-sm uppercase tracking-wider text-center">
                File Complaint
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to={role === 'citizen' ? '/citizen' : role === 'police' ? '/police' : '/admin'}
                    className="px-4 py-2.5 text-[#F0C75E] text-sm uppercase tracking-wider text-center border border-[#F0C75E]">
                    My Dashboard
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-2.5 text-red-400 text-sm text-center">Logout</button>
                </>
              ) : (
                <Link to="/login" className="px-4 py-2.5 bg-white text-[#081428] text-sm uppercase tracking-wider text-center">
                  Login / Sign Up
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
