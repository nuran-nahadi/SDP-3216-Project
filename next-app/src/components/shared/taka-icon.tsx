'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

type TakaIconProps = React.SVGProps<SVGSVGElement>;

export function TakaIcon({ className, ...props }: TakaIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
      {...props}
    >
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="16"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"
        fontWeight="700"
        fill="currentColor"
      >
        ৳
      </text>
    </svg>
  );
}

