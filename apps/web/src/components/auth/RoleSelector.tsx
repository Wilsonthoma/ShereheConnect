'use client';

import { User, Calendar } from 'lucide-react';

interface RoleSelectorProps {
  value: 'ATTENDEE' | 'ORGANIZER';
  onChange: (role: 'ATTENDEE' | 'ORGANIZER') => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="mb-4">
      <div className="text-center text-xs text-white/60 mb-3">Register as:</div>
      <div className="flex justify-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer group">
          <span className="relative flex items-center justify-center">
            <input
              type="radio"
              name="role"
              value="ATTENDEE"
              checked={value === 'ATTENDEE'}
              onChange={() => onChange('ATTENDEE')}
              className="sr-only peer"
            />
            <span
              className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                value === 'ATTENDEE'
                  ? 'border-gold bg-gold'
                  : 'border-white/30 group-hover:border-gold/60'
              }`}
            >
              {value === 'ATTENDEE' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </span>
          </span>
          <User className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-white">Attendee</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <span className="relative flex items-center justify-center">
            <input
              type="radio"
              name="role"
              value="ORGANIZER"
              checked={value === 'ORGANIZER'}
              onChange={() => onChange('ORGANIZER')}
              className="sr-only peer"
            />
            <span
              className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                value === 'ORGANIZER'
                  ? 'border-gold bg-gold'
                  : 'border-white/30 group-hover:border-gold/60'
              }`}
            >
              {value === 'ORGANIZER' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </span>
          </span>
          <Calendar className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-white">Organizer</span>
        </label>
      </div>
    </div>
  );
}
