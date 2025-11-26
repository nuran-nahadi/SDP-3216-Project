'use client';

import { useState } from 'react';
import { Task } from '@/lib/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string, actualDuration?: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function TaskItem({ task, onComplete, onEdit, onDelete }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [actualDuration, setActualDuration] = useState<string>('');

  const handleCheckboxChange = (checked: boolean) => {
    if (checked && !task.is_completed) {
      // Show completion dialog to optionally enter actual duration
      setShowCompletionDialog(true);
    }
  };

  const handleCompleteTask = () => {
    const duration = actualDuration ? Number(actualDuration) : undefined;
    onComplete(task.id, duration);
    setShowCompletionDialog(false);
    setActualDuration('');
  };

  const handleDelete = () => {
    onDelete(task.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="group border-2 rounded-xl p-4 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 smooth-transition">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={task.is_completed}
            onCheckedChange={handleCheckboxChange}
            className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    'font-semibold text-sm',
                    task.is_completed && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </h3>
                
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className={cn(priorityColors[task.priority], 'font-semibold border-2')}>
                    {task.priority}
                  </Badge>
                  
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(task.due_date)}</span>
                    </div>
                  )}
                  
                  {task.estimated_duration && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{task.estimated_duration}m</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 font-medium">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(task)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {task.description && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && task.description && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
                {task.actual_duration && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Completed in {task.actual_duration} minutes
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              How long did it take to complete this task? (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="actual-duration" className="text-sm font-medium">
                Actual Duration (minutes)
              </label>
              <Input
                id="actual-duration"
                type="number"
                placeholder={task.estimated_duration ? `Estimated: ${task.estimated_duration}` : 'e.g., 30'}
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteTask}>
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
