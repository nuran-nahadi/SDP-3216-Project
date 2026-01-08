'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type TaskFilter = 'today' | 'overdue' | 'all';

interface TaskTabsProps {
  activeTab: TaskFilter;
  onTabChange: (tab: TaskFilter) => void;
}

export function TaskTabs({ activeTab, onTabChange }: TaskTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TaskFilter)}>
      <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="overdue">Overdue</TabsTrigger>
        <TabsTrigger value="all">All</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
