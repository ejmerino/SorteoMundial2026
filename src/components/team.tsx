"use client";

import type { Team } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface TeamComponentProps {
  team: Team;
  variant?: 'default' | 'small' | 'large';
}

export default function TeamComponent({ team, variant = 'default' }: TeamComponentProps) {
  const isPlaceholder = team.code.startsWith('fifa-') || team.code.startsWith('uefa-');
  const flagName = isPlaceholder ? 'fifa' : team.code.toLowerCase();
  const flagUrl = `https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${flagName}.svg`;

  const sizes = {
    small: { wrapper: 'w-6 h-4 shadow', icon: 'w-4 h-4', text: 'text-xs' },
    default: { wrapper: 'w-10 h-7 shadow-md', icon: 'w-6 h-6', text: 'text-sm' },
    large: { wrapper: 'w-20 h-14 shadow-lg', icon: 'w-10 h-10', text: 'text-2xl' },
  }

  const currentSize = sizes[variant];

  return (
    <div className={cn(
        "flex items-center gap-4 w-full",
        variant === 'large' && 'flex-col'
      )}>
      <div className={cn("relative shrink-0 overflow-hidden rounded-sm flex items-center justify-center bg-gray-200", currentSize.wrapper)}>
        {isPlaceholder ? (
            <Globe className={cn(currentSize.icon, "text-gray-500")} />
        ) : (
            <Image
              src={flagUrl}
              alt={`${team.name} flag`}
              fill
              style={{ objectFit: 'cover' }}
            />
        )}
      </div>
      <span className={cn("font-medium text-foreground", currentSize.text, variant === 'large' && 'font-bold tracking-tight')}>
        {team.name}
      </span>
    </div>
  );
}
