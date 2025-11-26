'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AIFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function AIFloatingButton({ onClick, isOpen }: AIFloatingButtonProps) {
  if (isOpen) return null;

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40',
        'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
        'transition-all duration-300 hover:scale-110',
        'animate-in fade-in slide-in-from-bottom-4'
      )}
    >
      <Sparkles className="h-6 w-6 text-white" />
    </Button>
  );
}
