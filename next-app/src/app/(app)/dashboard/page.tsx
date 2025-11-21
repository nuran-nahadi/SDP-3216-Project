'use client';

import { MetricCard } from '@/components/features/dashboard/metric-card';
import { TodayTasksList } from '@/components/features/dashboard/today-tasks-list';
import { WeeklyCalendarGrid } from '@/components/features/dashboard/weekly-calendar-grid';
import { TaskCompletionHeatmap } from '@/components/features/dashboard/task-completion-heatmap';
import { ExpenseCharts } from '@/components/features/dashboard/expense-charts';
import { AIInsights } from '@/components/features/dashboard/ai-insights';
import { DashboardSkeleton } from '@/components/features/dashboard/dashboard-skeleton';
import { Skeleton } from '@/components/shared/skeleton';
import { useDashboardMetrics } from '@/lib/hooks/use-dashboard-metrics';
import {
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { metrics, loading, error } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-[1600px]">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-[1600px]">
        {/* Page header with better spacing */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Welcome back! Here&apos;s an overview of your productivity.
          </p>
        </div>

        {/* Metrics cards with improved layout */}
        {error ? (
          <div className="p-6 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            Failed to load dashboard metrics. Please try again.
          </div>
        ) : metrics ? (
          <>
            {/* Metrics Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <MetricCard
                title="Tasks Completed Today"
                value={metrics.taskCompletionCount}
                icon={CheckCircle2}
                trend="neutral"
              />
              <MetricCard
                title="Upcoming Events"
                value={metrics.upcomingEventsCount}
                icon={Calendar}
                trend="neutral"
              />
              <MetricCard
                title="Monthly Expenses"
                value={`$${metrics.totalExpense.toFixed(2)}`}
                change={metrics.expenseChange}
                icon={DollarSign}
                trend={
                  metrics.expenseChangeDirection === 'increase'
                    ? 'up'
                    : metrics.expenseChangeDirection === 'decrease'
                      ? 'down'
                      : 'neutral'
                }
              />
              <MetricCard
                title="Spending Trend"
                value={
                  metrics.expenseChangeDirection === 'increase'
                    ? 'Increasing'
                    : metrics.expenseChangeDirection === 'decrease'
                      ? 'Decreasing'
                      : 'Stable'
                }
                icon={TrendingUp}
                trend={
                  metrics.expenseChangeDirection === 'increase'
                    ? 'up'
                    : metrics.expenseChangeDirection === 'decrease'
                      ? 'down'
                      : 'neutral'
                }
              />
            </div>

            {/* Primary Content - 3 Column Layout on large screens */}
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              {/* Today's Tasks - Takes priority position */}
              <div className="lg:col-span-1">
                <TodayTasksList />
              </div>

              {/* Weekly Calendar - Center spotlight */}
              <div className="lg:col-span-2">
                <WeeklyCalendarGrid />
              </div>
            </div>

            {/* Secondary Content - 2 Column Layout */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              {/* AI Insights - Prominent position */}
              <AIInsights />

              {/* Task Completion Heatmap */}
              <TaskCompletionHeatmap />
            </div>

            {/* Expense Analytics - Full Width for better chart visibility */}
            <div className="mb-8">
              <ExpenseCharts />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
