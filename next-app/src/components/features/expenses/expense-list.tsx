'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense } from '@/lib/types/expense';
import { ExpenseItem } from './expense-item';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/shared/skeleton';
import { useEventBus } from '@/lib/hooks/use-event-bus';
import {
  EXPENSE_CREATED,
  EXPENSE_UPDATED,
  EXPENSE_DELETED,
} from '@/lib/utils/event-types';
import { getExpenses } from '@/lib/api/expenses';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExpenseListProps {
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({ onEdit, onDelete }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchExpenses = useCallback(async (isInitial = false) => {
    try {
      // Only show loading on initial load or page change
      if (isInitial) {
        setLoading(true);
      }
      setError(null);
      const response = await getExpenses({ page, limit });
      setExpenses(response.data);
      if (response.meta) {
        setTotalPages(response.meta.pages || 1);
      }
    } catch (err) {
      setError('Failed to load expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, [page]);

  useEffect(() => {
    fetchExpenses(true);
  }, [fetchExpenses]);

  // Subscribe to expense events for auto-refresh (without loading state)
  useEventBus([EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED], () => {
    fetchExpenses(false);
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        {error}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        title="No expenses yet"
        description="Start tracking your expenses by adding your first one."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {expenses.map((expense, index) => (
          <div 
            key={expense.id}
            className="fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <ExpenseItem
              expense={expense}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
