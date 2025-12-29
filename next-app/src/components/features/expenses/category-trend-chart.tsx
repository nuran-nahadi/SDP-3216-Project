'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoryTrend } from '@/lib/api/expenses';
import { Skeleton } from '@/components/shared/skeleton';
import { useEventBus } from '@/lib/hooks/use-event-bus';
import {
  EXPENSE_CREATED,
  EXPENSE_UPDATED,
  EXPENSE_DELETED,
} from '@/lib/utils/event-types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CategoryTrendData {
  month: string;
  [category: string]: string | number;
}

const categoryColors: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  entertainment: '#a855f7',
  bills: '#ef4444',
  shopping: '#ec4899',
  health: '#22c55e',
  education: '#6366f1',
  travel: '#06b6d4',
  other: '#6b7280',
};

export function CategoryTrendChart() {
  const [data, setData] = useState<CategoryTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCategoryTrend();

      // Transform the data from array of items to grouped by month
      const groupedByMonth: Record<string, CategoryTrendData> = {};
      const uniqueCategories = new Set<string>();

      response.data.forEach((item) => {
        if (!groupedByMonth[item.month]) {
          groupedByMonth[item.month] = { month: item.month };
        }
        groupedByMonth[item.month][item.category] = item.amount;
        uniqueCategories.add(item.category);
      });

      const transformedData = Object.values(groupedByMonth);
      setData(transformedData);
      setCategories(Array.from(uniqueCategories));
    } catch (error) {
      console.error('Error fetching category trend:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEventBus([EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED], fetchData);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Trend (6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Trend (6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // Format month string (e.g., "2024-01" -> "Jan")
                const date = new Date(value + '-01');
                return date.toLocaleDateString('en-US', { month: 'short' });
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              labelFormatter={(label) => {
                const date = new Date(label + '-01');
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              }}
            />
            <Legend />
            {categories.map((category) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={categoryColors[category] || categoryColors.other}
                fill={categoryColors[category] || categoryColors.other}
                name={category.charAt(0).toUpperCase() + category.slice(1)}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
