'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/context/theme-context';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  const toggleTheme = () => {
    if (actualTheme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
      aria-label="Toggle theme"
    >
      {actualTheme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
