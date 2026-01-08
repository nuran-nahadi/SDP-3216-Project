'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTopTransactions, TopTransaction } from '@/lib/api/expenses';
import { Skeleton } from '@/components/shared/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';
import { formatTaka } from '@/lib/utils/currency';

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

interface TopTransactionsListProps {
  onViewDetails?: (transaction: TopTransaction) => void;
}

export function TopTransactionsList({ onViewDetails }: TopTransactionsListProps) {
  const [data, setData] = useState<TopTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getTopTransactions();
        setData(response.data);
      } catch (error) {
        console.error('Error fetching top transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onViewDetails?.(transaction)}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className={categoryColors[transaction.category] || categoryColors.other}>
                    {transaction.category}
                  </Badge>
                  {transaction.merchant && (
                    <span className="text-sm font-medium">{transaction.merchant}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(transaction.date)}</span>
                  {transaction.description && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{transaction.description}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formatTaka(transaction.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
