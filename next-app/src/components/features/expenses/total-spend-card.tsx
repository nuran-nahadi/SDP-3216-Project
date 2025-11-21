'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTotalSpend } from '@/lib/api/expenses';
import { useEventBus } from '@/lib/hooks/use-event-bus';
import {
  EXPENSE_CREATED,
  EXPENSE_UPDATED,
  EXPENSE_DELETED,
} from '@/lib/utils/event-types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/shared/skeleton';

interface TotalSpendData {
  current_month: number;
  previous_month: number;
  percentage_change: number;
  change_direction: 'increase' | 'decrease' | 'same';
}

export function TotalSpendCard() {
  const [data, setData] = useState<TotalSpendData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTotalSpend();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching total spend:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to expense events for auto-refresh
  useEventBus([EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED], fetchData);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const isPositive = data.percentage_change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Spend This Month</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${data.current_month.toFixed(2)}
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <TrendIcon
            className={`h-4 w-4 mr-1 ${
              isPositive ? 'text-red-500' : 'text-green-500'
            }`}
          />
          <span className={isPositive ? 'text-red-500' : 'text-green-500'}>
            {Math.abs(data.percentage_change).toFixed(1)}%
          </span>
          <span className="ml-1">vs last month</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Previous month: ${data.previous_month.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}
