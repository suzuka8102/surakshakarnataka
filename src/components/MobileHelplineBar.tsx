import { Phone } from 'lucide-react';

const helplines = [
  { number: '112', label: 'ERSS', color: '#A8362A' },
  { number: '1930', label: 'Cyber', color: '#8B5CF6' },
  { number: '14410', label: 'Anti-Drug', color: '#F0C75E' },
  { number: '1091', label: 'Women', color: '#E11D48' },
  { number: '1098', label: 'Child', color: '#10B981' },
];

export default function MobileHelplineBar() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#081428] border-t border-[#2A3244] z-50 overflow-x-auto">
      <div className="flex items-center gap-1 px-2 py-2" style={{ minWidth: 'max-content' }}>
        {helplines.map((h) => (
          <a
            key={h.number}
            href={`tel:${h.number}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium"
            style={{
              backgroundColor: `${h.color}15`,
              color: h.color,
              border: `1px solid ${h.color}30`,
            }}
          >
            <Phone className="w-3 h-3" />
            <span>{h.number}</span>
            <span className="opacity-60">({h.label})</span>
          </a>
        ))}
      </div>
    </div>
  );
}
