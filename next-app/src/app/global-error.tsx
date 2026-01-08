'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { logError } from '@/lib/utils/error-handler';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to console or error tracking service
    logError(error, 'Global Root Error Handler');
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h1 className="text-xl font-semibold">Application Error</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              A critical error occurred. Please refresh the page or contact support if the
              problem persists.
            </p>
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">Error Details</p>
              <p className="mt-1 text-xs text-destructive/80">
                {error.message || 'An unknown error occurred'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
