'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTasks } from '@/lib/api/tasks';
import { TaskStatus } from '@/lib/types/task';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Activity } from 'lucide-react';
import {
  format,
  subDays,
  parseISO,
  eachDayOfInterval,
} from 'date-fns';

interface HeatmapData {
  date: Date;
  count: number;
}

export function TaskCompletionHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hoveredDay, setHoveredDay] = useState<HeatmapData | null>(null);

  const fetchCompletionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get completed tasks from the last 3 months (90 days)
      const endDate = new Date();
      const startDate = subDays(endDate, 89); // 90 days including today

      const response = await getTasks({
        status: TaskStatus.COMPLETED,
        limit: 100, // Maximum allowed by backend
      });

      // Create a map of dates to completion counts
      const completionMap = new Map<string, number>();

      // Initialize all days with 0
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      allDays.forEach((day) => {
        completionMap.set(format(day, 'yyyy-MM-dd'), 0);
      });

      // Count completions per day
      response.data.forEach((task) => {
        if (task.completion_date) {
          const completionDate = parseISO(task.completion_date);
          const dateKey = format(completionDate, 'yyyy-MM-dd');
          
          // Only count if within our 90-day range
          if (completionDate >= startDate && completionDate <= endDate) {
            completionMap.set(dateKey, (completionMap.get(dateKey) || 0) + 1);
          }
        }
      });

      // Convert map to array
      const data: HeatmapData[] = Array.from(completionMap.entries()).map(
        ([dateStr, count]) => ({
          date: parseISO(dateStr),
          count,
        })
      );

      setHeatmapData(data);
    } catch (err) {
      console.error('Error fetching task completion data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletionData();
  }, [fetchCompletionData]);

  const getIntensityColor = (count: number) => {
    if (count === 0) return '#f3f4f6'; // Light gray for empty in light mode
    if (count === 1) return 'rgba(139, 92, 246, 0.2)'; // 20% purple
    if (count === 2) return 'rgba(139, 92, 246, 0.4)'; // 40% purple
    if (count === 3) return 'rgba(139, 92, 246, 0.6)'; // 60% purple
    if (count === 4) return 'rgba(139, 92, 246, 0.8)'; // 80% purple
    return 'rgba(139, 92, 246, 1)'; // 100% purple
  };

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Activity</CardTitle>
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
          <CardTitle>Task Completion Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load activity data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (heatmapData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Complete tasks to see your activity heatmap."
          />
        </CardContent>
      </Card>
    );
  }

  // Organize data into weeks (columns) - each week has 7 days (rows)
  const weeks: (HeatmapData | null)[][] = [];
  let currentWeek: (HeatmapData | null)[] = [];
  
  // Get the first day and pad the beginning if needed
  const firstDayOfWeek = heatmapData[0]?.date.getDay() || 0;
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0
  
  // Pad the first week with nulls
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
  
  // Push remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  // Calculate month labels with proper positioning
  const cellSize = 14; // w-3.5 = 14px
  const gap = 2; // gap-0.5 = 2px
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
            <Activity className="h-5 w-5 text-primary" />
            Task Completion Activity
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Last 3 months • {maxCount > 0 ? `Peak: ${maxCount} tasks/day` : 'No tasks completed'}
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
                        backgroundColor: day ? getIntensityColor(day.count) : 'transparent',
                        border: day ? '1px solid rgba(139, 92, 246, 0.2)' : 'none'
                      }}
                      onMouseEnter={() => day && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={day ? `${format(day.date, 'MMM d, yyyy')}: ${day.count} tasks` : ''}
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
                {hoveredDay.count} {hoveredDay.count === 1 ? 'task' : 'tasks'} completed
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 mt-6 text-xs p-3 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)', color: '#9ca3af' }}>
            <span className="font-medium">Less</span>
            <div className="flex gap-1.5">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f3f4f6', border: '1px solid rgba(139, 92, 246, 0.2)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(139, 92, 246, 0.4)', border: '1px solid rgba(139, 92, 246, 0.5)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(139, 92, 246, 0.6)', border: '1px solid rgba(139, 92, 246, 0.7)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(139, 92, 246, 0.8)', border: '1px solid rgba(139, 92, 246, 0.9)' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(139, 92, 246, 1)', border: '1px solid rgba(139, 92, 246, 1)' }} />
            </div>
            <span className="font-medium">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
