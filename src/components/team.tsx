"use client";

import type { Team } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface TeamComponentProps {
  team: Team;
  variant?: 'default' | 'small';
}

export default function TeamComponent({ team, variant = 'default' }: TeamComponentProps) {
  const isPlaceholder = team.code === 'fifa' || team.code === 'uefa';
  const flagUrl = `https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${team.code.toLowerCase()}.svg`;

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={cn("relative shrink-0 overflow-hidden rounded-sm flex items-center justify-center bg-gray-200", variant === 'small' ? 'w-6 h-4 shadow' : 'w-10 h-7 shadow-md')}>
        {isPlaceholder ? (
            <Globe className={cn(variant === 'small' ? "w-4 h-4" : "w-6 h-6", "text-gray-500")} />
        ) : (
            <Image
              src={flagUrl}
              alt={`${team.name} flag`}
              fill
              objectFit="cover"
            />
        )}
      </div>
      <span className={cn("font-medium text-foreground truncate", variant === 'small' ? 'text-xs' : 'text-sm')}>
        {team.name}
      </span>
    </div>
  );
}
