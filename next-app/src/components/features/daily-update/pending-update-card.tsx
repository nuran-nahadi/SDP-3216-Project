'use client';

import React from 'react';
import { 
  CheckSquare, 
  Calendar, 
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PendingUpdate, UpdateCategory, UpdateStatus } from '@/lib/types/daily-update';
import { cn } from '@/lib/utils/cn';
import { TakaIcon } from '@/components/shared/taka-icon';
import { formatTaka } from '@/lib/utils/currency';

interface PendingUpdateCardProps {
  update: PendingUpdate;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEdit: (update: PendingUpdate) => void;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const categoryConfig: Record<UpdateCategory, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  task: { 
    icon: CheckSquare, 
    label: 'Task', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  expense: { 
    icon: TakaIcon, 
    label: 'Expense', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  event: { 
    icon: Calendar, 
    label: 'Event', 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  journal: { 
    icon: BookOpen, 
    label: 'Journal', 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
};

const statusConfig: Record<UpdateStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  pending: { label: 'Pending Review', variant: 'outline' },
  accepted: { label: 'Accepted', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

function formatStructuredData(category: UpdateCategory, data: Record<string, unknown>): React.ReactNode {
  const getValue = (key: string): string => {
    const val = data[key];
    return val !== undefined && val !== null ? String(val) : '';
  };

  const hasValue = (key: string): boolean => {
    const val = data[key];
    return val !== undefined && val !== null && val !== '';
  };

  switch (category) {
    case 'task':
      return (
        <div className="space-y-1 text-sm">
          {hasValue('title') && <p><span className="font-medium">Title:</span> {getValue('title')}</p>}
          {hasValue('description') && <p className="text-muted-foreground">{getValue('description')}</p>}
          {hasValue('due_date') && <p><span className="font-medium">Due:</span> {getValue('due_date')}</p>}
          {hasValue('priority') && <p><span className="font-medium">Priority:</span> {getValue('priority')}</p>}
        </div>
      );
    case 'expense':
      return (
        <div className="space-y-1 text-sm">
          {hasValue('description') && <p><span className="font-medium">Description:</span> {getValue('description')}</p>}
          {hasValue('amount') && <p><span className="font-medium">Amount:</span> {formatTaka(Number(data.amount))}</p>}
          {hasValue('category') && <p><span className="font-medium">Category:</span> {getValue('category')}</p>}
          {hasValue('date') && <p><span className="font-medium">Date:</span> {getValue('date')}</p>}
        </div>
      );
    case 'event':
      return (
        <div className="space-y-1 text-sm">
          {hasValue('title') && <p><span className="font-medium">Event:</span> {getValue('title')}</p>}
          {hasValue('description') && <p className="text-muted-foreground">{getValue('description')}</p>}
          {hasValue('start_time') && <p><span className="font-medium">Start:</span> {getValue('start_time')}</p>}
          {hasValue('end_time') && <p><span className="font-medium">End:</span> {getValue('end_time')}</p>}
          {hasValue('location') && <p><span className="font-medium">Location:</span> {getValue('location')}</p>}
        </div>
      );
    case 'journal': {
      const content = getValue('content');
      return (
        <div className="space-y-1 text-sm">
          {hasValue('title') && <p><span className="font-medium">Title:</span> {getValue('title')}</p>}
          {hasValue('content') && (
            <p className="text-muted-foreground line-clamp-3">
              {content.substring(0, 200)}
              {content.length > 200 ? '...' : ''}
            </p>
          )}
          {hasValue('mood') && <p><span className="font-medium">Mood:</span> {getValue('mood')}</p>}
        </div>
      );
    }
    default:
      return <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
  }
}

export function PendingUpdateCard({
  update,
  onAccept,
  onReject,
  onEdit,
  onDelete,
  isLoading = false,
}: PendingUpdateCardProps) {
  const [accepting, setAccepting] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);

  const config = categoryConfig[update.category];
  const statusInfo = statusConfig[update.status];
  const CategoryIcon = config.icon;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept(update.id);
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onReject(update.id);
    } finally {
      setRejecting(false);
    }
  };

  const isPending = update.status === 'pending';

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200",
      isPending && "hover:shadow-lg hover:border-primary/40"
    )}>
      {/* Category indicator bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.bgColor)} />
      
      <CardHeader className="pb-3 pl-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <CategoryIcon className={cn("h-4 w-4", config.color)} />
            </div>
            <div>
              <CardTitle className="text-base">
                {config.label}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(update.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pl-5 pb-3">
        {/* Raw text from conversation */}
        {update.raw_text && (
          <div className="mb-3 p-3 rounded-lg bg-muted/50 border border-dashed">
            <p className="text-sm italic text-muted-foreground">
              &quot;{update.raw_text}&quot;
            </p>
          </div>
        )}

        {/* Structured data */}
        {update.structured_data && (
          <div className="space-y-2">
            {formatStructuredData(update.category, update.structured_data)}
          </div>
        )}

        {/* Confidence score */}
        {update.confidence_score !== null && update.confidence_score !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  update.confidence_score >= 0.8 ? "bg-green-500" :
                  update.confidence_score >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${(update.confidence_score * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(update.confidence_score * 100)}% confidence
            </span>
          </div>
        )}
      </CardContent>

      {isPending && (
        <CardFooter className="gap-2 pl-5 pt-0">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading || accepting || rejecting}
            className="flex-1"
          >
            {accepting ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(update)}
            disabled={isLoading || accepting || rejecting}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading || accepting || rejecting}
          >
            {rejecting ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            Reject
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(update.id)}
              disabled={isLoading || accepting || rejecting}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export default PendingUpdateCard;
