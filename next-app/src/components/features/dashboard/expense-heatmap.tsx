'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getExpenses } from '@/lib/api/expenses';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { DollarSign } from 'lucide-react';
import {
  format,
  subDays,
  parseISO,
  eachDayOfInterval,
} from 'date-fns';

interface HeatmapData {
  date: Date;
  amount: number;
}

export function ExpenseHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hoveredDay, setHoveredDay] = useState<HeatmapData | null>(null);

  const fetchExpenseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = subDays(endDate, 89); // 90 days including today

      // Fetch expenses with pagination (backend limit is 100)
      let allExpenses: any[] = [];
      let page = 1;
      const pageLimit = 100;
      
      // Fetch up to 500 expenses (5 pages)
      while (page <= 5) {
        const response = await getExpenses({
          page,
          limit: pageLimit,
        });
        
        if (response.data.length === 0) break;
        allExpenses = [...allExpenses, ...response.data];
        
        // If we got less than the limit, we've reached the end
        if (response.data.length < pageLimit) break;
        page++;
      }

      const response = { data: allExpenses };

      // Create a map of dates to expense amounts
      const expenseMap = new Map<string, number>();

      // Initialize all days with 0
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      allDays.forEach((day) => {
        expenseMap.set(format(day, 'yyyy-MM-dd'), 0);
      });

      // Sum expenses per day
      response.data.forEach((expense) => {
        if (expense.date) {
          const expenseDate = parseISO(expense.date);
          const dateKey = format(expenseDate, 'yyyy-MM-dd');
          
          if (expenseDate >= startDate && expenseDate <= endDate) {
            expenseMap.set(dateKey, (expenseMap.get(dateKey) || 0) + expense.amount);
          }
        }
      });

      // Convert map to array
      const data: HeatmapData[] = Array.from(expenseMap.entries()).map(
        ([dateStr, amount]) => ({
          date: parseISO(dateStr),
          amount,
        })
      );

      setHeatmapData(data);
    } catch (err) {
      console.error('Error fetching expense data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenseData();
  }, [fetchExpenseData]);

  const getIntensityColor = (amount: number, maxAmount: number) => {
    if (amount === 0) return '#f3f4f6';
    const intensity = Math.min(amount / (maxAmount * 0.8), 1);
    if (intensity <= 0.2) return 'rgba(245, 158, 11, 0.2)';
    if (intensity <= 0.4) return 'rgba(245, 158, 11, 0.4)';
    if (intensity <= 0.6) return 'rgba(245, 158, 11, 0.6)';
    if (intensity <= 0.8) return 'rgba(245, 158, 11, 0.8)';
    return 'rgba(245, 158, 11, 1)';
  };

  const maxAmount = Math.max(...heatmapData.map((d) => d.amount), 0);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Expense Activity</CardTitle>
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
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Expense Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load expense data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (heatmapData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Expense Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="No expenses yet"
            description="Add expenses to see your spending heatmap."
          />
        </CardContent>
      </Card>
    );
  }

  // Organize data into weeks (columns) - each week has 7 days (rows)
  const weeks: (HeatmapData | null)[][] = [];
  let currentWeek: (HeatmapData | null)[] = [];
  
  const firstDayOfWeek = heatmapData[0]?.date.getDay() || 0;
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  for (let i = 0; i < adjustedFirstDay; i++) {
    currentWeek.push(null);
  }
  
  heatmapData.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  const cellSize = 14;
  const gap = 2;
  const monthLabels: { name: string; position: number }[] = [];
  let lastMonth = '';
  
  weeks.forEach((week, weekIndex) => {
    const firstValidDay = week.find(d => d !== null);
    if (firstValidDay) {
      const monthName = format(firstValidDay.date, 'MMM');
      if (monthName !== lastMonth) {
        monthLabels.push({
          name: monthName,
          position: weekIndex * (cellSize + gap),
        });
        lastMonth = monthName;
      }
    }
  });

  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-500" />
            Expense Activity
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Last 3 months • {maxAmount > 0 ? `Peak: $${maxAmount.toFixed(2)}/day` : 'No expenses recorded'}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          {/* Month labels */}
          <div className="relative h-5 mb-2 ml-10">
            {monthLabels.map((month, idx) => (
              <div
                key={idx}
                className="absolute text-xs text-muted-foreground"
                style={{ left: `${month.position}px` }}
              >
                {month.name}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 pr-2 w-8">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div
                  key={day}
                  className="h-3.5 text-[10px] flex items-center justify-end text-muted-foreground"
                  style={{ visibility: idx % 2 === 0 ? 'visible' : 'hidden' }}
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grid columns (weeks) */}
            <div className="flex gap-0.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="w-3.5 h-3.5 rounded-sm cursor-pointer transition-all duration-200"
                      style={{
                        backgroundColor: day ? getIntensityColor(day.amount, maxAmount) : 'transparent',
                        border: day ? '1px solid rgba(245, 158, 11, 0.2)' : 'none'
                      }}
                      onMouseEnter={() => day && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={day ? `${format(day.date, 'MMM d, yyyy')}: $${day.amount.toFixed(2)}` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {hoveredDay && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-2.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border z-10 whitespace-nowrap">
              <div className="font-semibold">
                {format(hoveredDay.date, 'MMMM d, yyyy')}
              </div>
              <div className="text-muted-foreground mt-1">
                ${hoveredDay.amount.toFixed(2)} spent
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 mt-6 text-xs p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', color: '#9ca3af' }}>
            <span className="font-medium">Less</span>
            <div className="flex gap-1.5">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f3f4f6', border: '1px solid rgba(245, 158, 11, 0.2)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.3)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.4)', border: '1px solid rgba(245, 158, 11, 0.5)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.6)', border: '1px solid rgba(245, 158, 11, 0.7)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.8)', border: '1px solid rgba(245, 158, 11, 0.9)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 1)', border: '1px solid rgba(245, 158, 11, 1)' }} />
            </div>
            <span className="font-medium">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
