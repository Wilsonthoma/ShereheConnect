'use client';

import type { HTMLAttributes, ReactNode } from 'react';

interface MixedHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: 1 | 2;
}

function renderMixedChildren(
  children: ReactNode,
  state: { wordIndex: number },
): ReactNode {
  if (typeof children === 'string') {
    const parts = children.split(/(\s+)/);
    return parts.map((part, index) => {
      if (!part.trim()) return part;

      const className =
        state.wordIndex % 2 === 0 ? 'heading-coddy' : 'heading-kaushan';
      state.wordIndex += 1;

      return (
        <span className={className} key={`${state.wordIndex}-${index}`}>
          {part}
        </span>
      );
    });
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <span key={index}>{renderMixedChildren(child, state)}</span>
    ));
  }

  return children;
}

export function MixedHeading({
  children,
  level = 1,
  className = '',
  ...props
}: MixedHeadingProps) {
  const Heading = level === 1 ? 'h1' : 'h2';

  return (
    <Heading
      className={`${level === 1 ? 'heading-display' : 'heading-display'} ${className}`}
      {...props}
    >
      {renderMixedChildren(children, { wordIndex: 0 })}
    </Heading>
  );
}
