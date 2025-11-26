'use client';

import { Expense } from '@/lib/types/expense';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  food: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  entertainment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  bills: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  health: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  education: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  travel: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const categoryColor = categoryColors[expense.category] || categoryColors.other;

  return (
    <Card className="p-5 border-2 bg-gradient-to-br from-card to-teal-500/5 hover:shadow-xl hover:border-teal-500/30 transition-all duration-200 smooth-transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${categoryColor} font-semibold border-2`}>
              {expense.category}
            </Badge>
            {expense.subcategory && (
              <Badge variant="outline" className="text-xs border-2 border-primary/20 bg-primary/5 font-medium">
                {expense.subcategory}
              </Badge>
            )}
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {expense.currency} {expense.amount.toFixed(2)}
            </span>
            {expense.merchant && (
              <span className="text-sm font-medium text-muted-foreground">
                at {expense.merchant}
              </span>
            )}
          </div>

          {expense.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {expense.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span>{formatDate(expense.date)}</span>
            {expense.payment_method && (
              <span className="capitalize px-2 py-1 rounded-md bg-primary/10 text-primary">
                {expense.payment_method.replace('_', ' ')}
              </span>
            )}
          </div>

          {expense.tags && expense.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {expense.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 font-medium">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(expense)}
            aria-label="Edit expense"
            className="hover:bg-primary/10"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(expense.id)}
            aria-label="Delete expense"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
