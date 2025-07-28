'use client';

import { cn } from '@/lib/utils';

export function Footer({ className }: { className?: string }) {
  return (
    <div className={cn("relative font-headline text-foreground", className)}>
        <svg viewBox="0 0 150 100" className="w-auto h-full">
            {/* Incomplete square border */}
            <path d="M40 10 H 140 V 90 H 10 V 25" stroke="currentColor" strokeWidth="4" fill="none" />
            
            {/* Brand Name */}
            <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" fontSize="28" fill="currentColor" className="font-headline">bread</text>
            <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fontSize="28" fill="currentColor" className="font-headline">mate</text>
            
            {/* Strapline */}
            <text x="50%" y="85%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="currentColor" className="font-body">homemade breadsticks</text>
        </svg>
    </div>
  );
}
