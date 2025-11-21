'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInsights, SpendingInsights } from '@/lib/api/expenses';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
} from 'lucide-react';

export function AIInsights() {
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [noData, setNoData] = useState(false);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNoData(false);

      const response = await getInsights({ days: 30 });

      // Check if response indicates insufficient data
      if ('insights' in response.data && typeof response.data.insights === 'string') {
        setNoData(true);
        setInsights(null);
      } else {
        setInsights(response.data as SpendingInsights);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const getTrendIcon = () => {
    if (!insights) return Minus;
    switch (insights.spending_trend) {
      case 'increasing':
        return TrendingUp;
      case 'decreasing':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = () => {
    if (!insights) return 'text-muted-foreground';
    switch (insights.spending_trend) {
      case 'increasing':
        return 'text-red-600 dark:text-red-500';
      case 'decreasing':
        return 'text-green-600 dark:text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Spending Insights
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Spending Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load insights. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (noData || !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Spending Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Sparkles}
            title="Not enough data"
            description="Add more expenses to get AI-powered insights and recommendations."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          AI Spending Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {/* Spending overview */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-accent/50 to-accent/30 border border-primary/10 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Spending</span>
            <span className="text-2xl font-bold text-primary">
              ${insights.total_spending.toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Top Category</span>
            <div className="text-right">
              <div className="text-sm font-semibold capitalize">
                {insights.top_category}
              </div>
              <div className="text-xs text-muted-foreground">
                ${insights.top_category_amount.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Trend</span>
            <Badge
              variant="secondary"
              className={`${getTrendColor()} flex items-center gap-1.5 px-3 py-1`}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              <span className="capitalize">{insights.spending_trend}</span>
            </Badge>
          </div>
        </div>

        {/* Insights */}
        {insights.insights && insights.insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Key Insights
            </h4>
            <div className="space-y-2">
              {insights.insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-card/50 text-sm leading-relaxed hover:shadow-sm transition-shadow"
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {insights.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-sm leading-relaxed hover:shadow-sm transition-all hover:bg-primary/15"
                >
                  {recommendation}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
