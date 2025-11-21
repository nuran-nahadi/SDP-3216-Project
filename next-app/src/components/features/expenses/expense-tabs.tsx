'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExpenseTabsProps {
  activeTab: 'recent' | 'summary';
  onTabChange: (tab: 'recent' | 'summary') => void;
}

export function ExpenseTabs({ activeTab, onTabChange }: ExpenseTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'recent' | 'summary')}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="recent">Recent</TabsTrigger>
        <TabsTrigger value="summary">Summary</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
