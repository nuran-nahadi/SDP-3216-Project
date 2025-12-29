'use client';

import React from 'react';
import {
  CheckSquare,
  Calendar,
  BookOpen,
  Save,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PendingUpdate, UpdateCategory, PendingUpdateEdit } from '@/lib/types/daily-update';
import { cn } from '@/lib/utils/cn';
import { TakaIcon } from '@/components/shared/taka-icon';

interface PendingReviewModalProps {
  update: PendingUpdate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: PendingUpdateEdit) => Promise<void>;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const categoryConfig: Record<UpdateCategory, {
  icon: React.ElementType;
  label: string;
  color: string;
  fields: Array<{ key: string; label: string; type: 'text' | 'textarea' | 'number' | 'datetime' }>;
}> = {
  task: {
    icon: CheckSquare,
    label: 'Task',
    color: 'text-blue-600',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'due_date', label: 'Due Date', type: 'datetime' },
      { key: 'priority', label: 'Priority', type: 'text' },
    ],
  },
  expense: {
    icon: TakaIcon,
    label: 'Expense',
    color: 'text-green-600',
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'date', label: 'Date', type: 'datetime' },
    ],
  },
  event: {
    icon: Calendar,
    label: 'Event',
    color: 'text-purple-600',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'start_time', label: 'Start Time', type: 'datetime' },
      { key: 'end_time', label: 'End Time', type: 'datetime' },
      { key: 'location', label: 'Location', type: 'text' },
    ],
  },
  journal: {
    icon: BookOpen,
    label: 'Journal Entry',
    color: 'text-orange-600',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea' },
      { key: 'mood', label: 'Mood', type: 'text' },
    ],
  },
};

export function PendingReviewModal({
  update,
  isOpen,
  onClose,
  onSave,
  onAccept,
  onReject,
  isLoading = false,
}: PendingReviewModalProps) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const [summary, setSummary] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);

  // Reset form when update changes
  React.useEffect(() => {
    if (update) {
      setFormData(update.structured_data || {});
      setSummary(update.summary || '');
    }
  }, [update]);

  if (!update) return null;

  const config = categoryConfig[update.category];
  const CategoryIcon = config.icon;

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(update.id, {
        summary,
        structured_data: formData,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      // Save first if there are changes
      await onSave(update.id, {
        summary,
        structured_data: formData,
      });
      await onAccept(update.id);
      onClose();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(update.id);
      onClose();
    } finally {
      setIsRejecting(false);
    }
  };

  const disabled = isLoading || isSaving || isAccepting || isRejecting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-muted")}>
              <CategoryIcon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Review {config.label}
              </DialogTitle>
              <DialogDescription>
                Edit the details before accepting or rejecting this entry
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original text */}
          {update.raw_text && (
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Original text:
              </p>
              <p className="text-sm italic">&quot;{update.raw_text}&quot;</p>
            </div>
          )}

          {/* Summary field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Summary</label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary..."
              disabled={disabled}
            />
          </div>

          {/* Dynamic fields based on category */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Badge variant="outline">{config.label} Details</Badge>
            </h4>
            {config.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={String(formData[field.key] || '')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    disabled={disabled}
                    rows={3}
                  />
                ) : field.type === 'number' ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={String(formData[field.key] || '')}
                    onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    disabled={disabled}
                  />
                ) : field.type === 'datetime' ? (
                  <Input
                    type="datetime-local"
                    value={String(formData[field.key] || '')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    disabled={disabled}
                  />
                ) : (
                  <Input
                    type="text"
                    value={String(formData[field.key] || '')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    disabled={disabled}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Confidence score */}
          {update.confidence_score !== null && update.confidence_score !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>AI Confidence:</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-32">
                <div
                  className={cn(
                    "h-full rounded-full",
                    update.confidence_score >= 0.8 ? "bg-green-500" :
                    update.confidence_score >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${(update.confidence_score * 100)}%` }}
                />
              </div>
              <span>{Math.round(update.confidence_score * 100)}%</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={disabled}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={disabled}
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={disabled}
          >
            {isAccepting ? 'Accepting...' : 'Accept & Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PendingReviewModal;
