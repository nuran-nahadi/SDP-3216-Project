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

  const getGradientClass = () => {
    if (trend === 'up') return 'from-green-500/10 to-transparent';
    if (trend === 'down') return 'from-red-500/10 to-transparent';
    return 'from-primary/10 to-transparent';
  };

  return (
    <Card className="relative overflow-hidden group border-2 bg-gradient-to-br from-card to-primary/5">
      {/* Animated gradient background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-70',
        getGradientClass()
      )} />
      
      {/* Decorative circle */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        {change !== undefined && (
          <div className={cn('flex items-center text-xs mt-2.5 font-semibold', getTrendColor())}>
            {trend === 'up' && <ArrowUpIcon className="h-4 w-4 mr-1" />}
            {trend === 'down' && <ArrowDownIcon className="h-4 w-4 mr-1" />}
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
