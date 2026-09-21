'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

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
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

    const next = (value.slice(0, index) + digit + value.slice(index + 1))
      .replace(/\s/g, '')
      .slice(0, LENGTH);
    onChange(next);
    focusIndex(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (pasted) {
      onChange(pasted);
      focusIndex(pasted.length);
    }
  };

  const baseClasses =
    'w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl bg-white/5 border-2 transition-all outline-none text-white placeholder:text-white/20';

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
          aria-label={`Digit ${i + 1}`}
          className={`${baseClasses} ${
            error
              ? 'border-red/50 focus:border-red'
              : 'border-white/15 focus:border-gold focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
}
