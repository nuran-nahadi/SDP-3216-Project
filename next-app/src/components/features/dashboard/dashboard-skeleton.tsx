import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/shared/skeleton';

export function DashboardSkeleton() {
  return (
    <>
      {/* Metrics Grid Skeleton */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="relative overflow-hidden transition-all duration-300 border-l-4 border-l-primary/50"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </CardHeader>
              <CardContent className="relative z-10">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Primary Content - 3 Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Today's Tasks Skeleton */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-3 p-4 rounded-lg border"
                    >
                      <Skeleton className="h-5 w-5 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Calendar Skeleton */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-xl border">
                      <div className="text-center mb-3">
                        <Skeleton className="h-3 w-12 mx-auto mb-2" />
                        <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                      </div>
                      <div className="space-y-1.5">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Secondary Content - 2 Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* AI Insights Skeleton */}
          <Card className="h-full bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="p-5 rounded-xl bg-gradient-to-br from-accent/50 to-accent/30 border space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Task Completion Heatmap Skeleton */}
          <Card className="h-full">
            <CardHeader className="border-b bg-muted/30">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-40 mt-2" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-1.5">
                {Array.from({ length: 13 }).map((_, i) => (
                  <div key={i} className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Skeleton key={j} className="w-5 h-5 rounded" />
                    ))}
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 w-full rounded-lg mt-6" />
            </CardContent>
          </Card>
        </div>

        {/* Expense Analytics Skeleton - Full Width */}
        <div className="mb-8">
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-11 w-full rounded-lg mb-4" />
              <Skeleton className="h-80 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </>
  );
}
