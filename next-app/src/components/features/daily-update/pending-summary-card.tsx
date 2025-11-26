'use client';

import React from 'react';
import { ClipboardList, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PendingSummary, UpdateCategory } from '@/lib/types/daily-update';
import { cn } from '@/lib/utils/cn';

interface PendingSummaryCardProps {
  summary: PendingSummary | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const categoryLabels: Record<UpdateCategory, { label: string; color: string }> = {
  task: { label: 'Tasks', color: 'bg-blue-500' },
  expense: { label: 'Expenses', color: 'bg-green-500' },
  event: { label: 'Events', color: 'bg-purple-500' },
  journal: { label: 'Journal', color: 'bg-orange-500' },
};

export function PendingSummaryCard({
  summary,
  isLoading = false,
  error = null,
  className,
}: PendingSummaryCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("h-full border-destructive/50", className)}>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const hasPending = summary?.has_pending ?? false;
  const totalPending = summary?.total_pending ?? 0;

  return (
    <Card className={cn(
      "h-full transition-all duration-200",
      hasPending && "border-primary/30 bg-primary/5",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              hasPending ? "bg-primary/10" : "bg-muted"
            )}>
              <ClipboardList className={cn(
                "h-5 w-5",
                hasPending ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <CardTitle className="text-base font-medium">
              Pending Updates
            </CardTitle>
          </div>
          {hasPending && (
            <Badge variant="default" className="text-lg px-3">
              {totalPending}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasPending && summary ? (
          <>
            {/* Category breakdown */}
            <div className="flex flex-wrap gap-2">
              {(Object.entries(summary.by_category) as [UpdateCategory, number][])
                .filter(([, count]) => count > 0)
                .map(([category, count]) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className="gap-1"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        categoryLabels[category].color
                      )}
                    />
                    {categoryLabels[category].label}: {count}
                  </Badge>
                ))}
            </div>

            {/* Action button */}
            <Link href="/daily-update" className="block">
              <Button variant="outline" className="w-full group">
                Review Pending Items
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No pending updates to review
            </p>
            <Link href="/daily-update">
              <Button variant="outline" size="sm">
                Start Daily Update
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PendingSummaryCard;
