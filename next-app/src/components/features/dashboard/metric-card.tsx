'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ title, value, change, icon: Icon, trend }: MetricCardProps) {
  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'text-muted-foreground';
    return trend === 'up' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
  };

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-primary/50">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {change !== undefined && (
          <div className={cn('flex items-center text-xs mt-2 font-medium', getTrendColor())}>
            {trend === 'up' && <ArrowUpIcon className="h-3.5 w-3.5 mr-1" />}
            {trend === 'down' && <ArrowDownIcon className="h-3.5 w-3.5 mr-1" />}
            <span>
              {change > 0 ? '+' : ''}
              {change}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
