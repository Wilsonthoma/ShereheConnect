'use client';

import {
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface VerifyOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

const LENGTH = 6;

export function VerifyOtpInput({
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
}: VerifyOtpInputProps) {
  const { t } = useLanguage();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Build aria-label for each digit box (fallback if key missing)
  const digitLabel = (i: number) => {
    const translated = t('otp.digit' as any, { number: i + 1 });
    return translated === 'otp.digit' ? `Digit ${i + 1}` : translated;
  };

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const digits = value.padEnd(LENGTH, ' ').split('').slice(0, LENGTH);

  const focusIndex = (i: number) => {
    const clamped = Math.max(0, Math.min(LENGTH - 1, i));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;

    const next = (
      value.slice(0, index) +
      digit +
      value.slice(index + 1)
    )
      .replace(/\s/g, '')
      .slice(0, LENGTH);
    onChange(next);
    focusIndex(index + 1);
  };

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index] && digits[index] !== ' ') {
        const next = value.slice(0, index) + value.slice(index + 1);
        onChange(next);
      } else {
        focusIndex(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusIndex(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, LENGTH);
    if (pasted) {
      onChange(pasted);
      focusIndex(pasted.length);
    }
  };

  const baseClasses =
    'w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-2 transition-all outline-none ' +
    'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white ' +
    'placeholder:text-slate-400 dark:placeholder:text-white/20';

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit === ' ' ? '' : digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={digitLabel(i)}
          className={`${baseClasses} ${
            error
              ? 'border-red-500/60 focus:border-red-500'
              : 'border-slate-300 dark:border-white/15 focus:border-gold focus:bg-white dark:focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
}