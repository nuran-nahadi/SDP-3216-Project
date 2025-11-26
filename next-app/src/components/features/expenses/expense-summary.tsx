'use client';

import { useCallback } from 'react';
import { TotalSpendCard } from './total-spend-card';
import { CategoryBreakdownTable } from './category-breakdown-table';
import { CategoryTrendChart } from './category-trend-chart';
import { SpendTrendChart } from './spend-trend-chart';
import { TopTransactionsList } from './top-transactions-list';
import { useEventBus } from '@/lib/hooks/use-event-bus';
import {
  EXPENSE_CREATED,
  EXPENSE_UPDATED,
  EXPENSE_DELETED,
} from '@/lib/utils/event-types';
import { TopTransaction } from '@/lib/api/expenses';

interface ExpenseSummaryProps {
  onViewDetails?: (transaction: TopTransaction) => void;
}

export function ExpenseSummary({ onViewDetails }: ExpenseSummaryProps) {
  // Force re-render when expenses change
  const handleExpenseChange = useCallback(() => {
    // Components will auto-refresh via their own event subscriptions
  }, []);

  useEventBus([EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED], handleExpenseChange);

  return (
    <div className="space-y-6">
      {/* Total Spend Card */}
      <TotalSpendCard />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <SpendTrendChart />
        <CategoryTrendChart />
      </div>

      {/* Category Breakdown and Top Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryBreakdownTable />
        <TopTransactionsList onViewDetails={onViewDetails} />
      </div>
    </div>
  );
}
