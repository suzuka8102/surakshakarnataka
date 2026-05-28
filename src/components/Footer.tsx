import { useI18nStore, t } from '@/store/i18nStore';
import { Shield, ExternalLink } from 'lucide-react';

export default function Footer() {
  const { lang } = useI18nStore();

  const kspWings = [
    'Law \u0026 Order', 'CID', 'Traffic', 'CCB', 'Cyber Crime',
    'Wireless', 'Training', 'KSRP', 'Fire \u0026 Emergency',
  ];

  const citizenServices = [
    'e-Lost Report', 'Tenant Verification', 'Senior Citizen Registration',
    'File e-FIR', 'Track Complaint', 'Event Permission',
    'Nearest Police Station',
  ];

  const quickLinks = [
    'RTI', 'Citizen Charter', 'Tenders', 'Recruitment',
    'Contact Us', 'Feedback',
  ];

  return (
    <footer className="bg-[#081428] text-[#F5F5F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* KSP Wings */}
          <div>
            <h3 className="text-[#F0C75E] text-sm uppercase tracking-wider font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              KSP Wings
            </h3>
            <ul className="space-y-2">
              {kspWings.map((wing) => (
                <li key={wing}>
                  <span className="text-gray-400 text-sm hover:text-[#F0C75E] transition-colors cursor-pointer flex items-center gap-1">
                    {wing}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Citizen Services */}
          <div>
            <h3 className="text-[#F0C75E] text-sm uppercase tracking-wider font-semibold mb-4">
              {lang === 'kn' ? 'ನಾಗರಿಕ ಸೇವೆಗಳು' : 'Citizen Services'}
            </h3>
            <ul className="space-y-2">
              {citizenServices.map((service) => (
                <li key={service}>
                  <span className="text-gray-400 text-sm hover:text-[#F0C75E] transition-colors cursor-pointer flex items-center gap-1">
                    {service}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#F0C75E] text-sm uppercase tracking-wider font-semibold mb-4">
              {lang === 'kn' ? 'ತ್ವರಿತ ಕೊಂಡಿಗಳು' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link}>
                  <span className="text-gray-400 text-sm hover:text-[#F0C75E] transition-colors cursor-pointer flex items-center gap-1">
                    {link}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[#F0C75E] text-sm uppercase tracking-wider font-semibold mb-4">
              {lang === 'kn' ? 'ಸಂಪರ್ಕ' : 'Contact'}
            </h3>
            <div className="space-y-3 text-gray-400 text-sm">
              <p>
                <span className="text-[#F5F5F0]">Karnataka State Police Headquarters</span><br />
                No. 1, Infantry Road,<br />
                Bengaluru - 560001
              </p>
              <p>Phone: 080-22943001</p>
              <p>Control Room: 100 / 112</p>
              <p>Cyber Crime: 1930</p>
              <p>Women Helpline: 1091</p>
              <div className="flex gap-3 mt-4">
                <span className="w-8 h-8 bg-[#0F1E36] flex items-center justify-center hover:bg-[#F0C75E] hover:text-[#081428] transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </span>
                <span className="w-8 h-8 bg-[#0F1E36] flex items-center justify-center hover:bg-[#F0C75E] hover:text-[#081428] transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </span>
                <span className="w-8 h-8 bg-[#0F1E36] flex items-center justify-center hover:bg-[#F0C75E] hover:text-[#081428] transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="border-t border-[#2A3244]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-gray-500 text-xs text-center md:text-left">
            {t('footer.copyright', lang)}
          </p>
          <p className="text-gray-600 text-xs">
            Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </footer>
  );
}
