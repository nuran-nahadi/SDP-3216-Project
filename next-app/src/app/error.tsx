'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logError } from '@/lib/utils/error-handler';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console or error tracking service
    logError(error, 'Global Error Handler');
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An unexpected error occurred. Please try again or contact support if the problem
            persists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              {error.message || 'An unknown error occurred'}
            </AlertDescription>
          </Alert>
          {process.env.NODE_ENV === 'development' && error.digest && (
            <p className="mt-4 text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} className="flex-1">
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/dashboard')}
            className="flex-1"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
