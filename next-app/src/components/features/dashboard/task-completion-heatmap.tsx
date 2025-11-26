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

      // Get completed tasks from the last 90 days
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

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/20';
    if (count === 2) return 'bg-primary/40';
    if (count === 3) return 'bg-primary/60';
    if (count === 4) return 'bg-primary/80';
    return 'bg-primary';
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

  // Group by weeks for better display
  const weeks: HeatmapData[][] = [];
  let currentWeek: HeatmapData[] = [];

  heatmapData.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === heatmapData.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
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
          Last 90 days • {maxCount > 0 ? `Peak: ${maxCount} tasks/day` : 'No tasks completed'}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          {/* Heatmap grid */}
          <div className="overflow-x-auto pb-2">
            <div className="inline-flex flex-col gap-1.5 min-w-full">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex gap-1.5">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary hover:scale-110 ${getIntensityClass(
                        day.count
                      )}`}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} tasks`}
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
          <div className="flex items-center justify-center gap-3 mt-6 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <span className="font-medium">Less</span>
            <div className="flex gap-1.5">
              <div className="w-4 h-4 rounded bg-muted border" />
              <div className="w-4 h-4 rounded bg-primary/20" />
              <div className="w-4 h-4 rounded bg-primary/40" />
              <div className="w-4 h-4 rounded bg-primary/60" />
              <div className="w-4 h-4 rounded bg-primary/80" />
              <div className="w-4 h-4 rounded bg-primary" />
            </div>
            <span className="font-medium">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
