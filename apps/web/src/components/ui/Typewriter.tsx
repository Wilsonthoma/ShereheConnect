'use client';

import { useEffect, useState } from 'react';

interface TypewriterProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export function Typewriter({
  words,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 1800,
  className = '',
}: TypewriterProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  useEffect(() => {
    const current = words[wordIndex % words.length];

    if (phase === 'typing') {
      if (text.length < current.length) {
        const t = setTimeout(() => setText(current.slice(0, text.length + 1)), typingSpeed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('pausing'), pauseDuration);
      return () => clearTimeout(t);
    }

    if (phase === 'pausing') {
      const t = setTimeout(() => setPhase('deleting'), 200);
      return () => clearTimeout(t);
    }

    if (phase === 'deleting') {
      if (text.length > 0) {
        const t = setTimeout(() => setText(current.slice(0, text.length - 1)), deletingSpeed);
        return () => clearTimeout(t);
      }
      setWordIndex((i) => (i + 1) % words.length);
      setPhase('typing');
    }
  }, [text, phase, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[2px] h-[1em] bg-gold ml-1 align-middle animate-pulse" />
    </span>
  );
}
