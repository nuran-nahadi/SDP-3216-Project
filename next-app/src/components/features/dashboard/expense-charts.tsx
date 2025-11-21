'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getCategoryBreakdown,
  getSpendTrend,
  CategoryBreakdownItem,
  SpendTrendItem,
} from '@/lib/api/expenses';
import { useEventBus } from '@/lib/hooks/use-event-bus';
import {
  EXPENSE_CREATED,
  EXPENSE_UPDATED,
  EXPENSE_DELETED,
} from '@/lib/utils/event-types';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { PieChart, TrendingUp } from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ExpenseCharts() {
  const [categoryData, setCategoryData] = useState<CategoryBreakdownItem[]>([]);
  const [trendData, setTrendData] = useState<SpendTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoryResponse, trendResponse] = await Promise.all([
        getCategoryBreakdown({ period: 'current_month' }),
        getSpendTrend({ period: 'daily', days: 30 }),
      ]);

      setCategoryData(categoryResponse.data);
      setTrendData(trendResponse.data);
    } catch (err) {
      console.error('Error fetching expense chart data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Subscribe to expense events for auto-refresh
  useEventBus(
    [EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED],
    fetchChartData
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load expense data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasData = categoryData.length > 0 || trendData.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={PieChart}
            title="No expense data"
            description="Add expenses to see your spending analytics."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Expense Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="category" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="category" className="text-sm font-medium">
              Category Breakdown
            </TabsTrigger>
            <TabsTrigger value="trend" className="text-sm font-medium">
              Spending Trend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="mt-4">
            {categoryData.length === 0 ? (
              <EmptyState
                icon={PieChart}
                title="No category data"
                description="Add expenses to see category breakdown."
              />
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryData.map(item => ({
                        ...item,
                        name: item.category
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const entry = props as unknown as CategoryBreakdownItem;
                        return `${entry.category}: ${entry.percentage.toFixed(1)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="category"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Category breakdown table */}
                <div className="space-y-3">
                  {categoryData.map((item, index) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent/70 transition-all duration-200 border border-transparent hover:border-primary/20 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-semibold capitalize">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold">
                          ${item.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.transaction_count}{' '}
                          {item.transaction_count === 1 ? 'transaction' : 'transactions'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trend" className="mt-4">
            {trendData.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No trend data"
                description="Add expenses to see spending trends."
              />
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                    />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      labelFormatter={(date) =>
                        format(parseISO(date as string), 'MMMM d, yyyy')
                      }
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-accent/50 to-accent/30 border border-primary/10 hover:shadow-sm transition-shadow">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Spent</div>
                    <div className="text-2xl font-bold mt-2 text-primary">
                      $
                      {trendData
                        .reduce((sum, item) => sum + item.amount, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-accent/50 to-accent/30 border border-primary/10 hover:shadow-sm transition-shadow">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Avg per Day
                    </div>
                    <div className="text-2xl font-bold mt-2 text-primary">
                      $
                      {(
                        trendData.reduce((sum, item) => sum + item.amount, 0) /
                        trendData.length
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
