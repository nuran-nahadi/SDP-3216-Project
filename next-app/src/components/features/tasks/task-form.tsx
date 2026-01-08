'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Task, TaskPriority } from '@/lib/types/task';
import { taskSchema, TaskFormData } from '@/lib/utils/validators';
import { createTask, updateTask } from '@/lib/api/tasks';
import { eventBus } from '@/lib/utils/event-bus';
import { TASK_CREATED, TASK_UPDATED } from '@/lib/utils/event-types';
import { isoToDatetimeLocal } from '@/lib/utils/date';
import { handleApiError } from '@/lib/utils/error-handler';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface TaskFormProps {
  task?: Task;
  initialData?: Partial<TaskFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ task, initialData, onSuccess, onCancel }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const isEditMode = !!task;

  // Convert task due_date to datetime-local format if it exists
  const getInitialDueDate = () => {
    if (initialData?.due_date) return initialData.due_date;
    if (task?.due_date) return isoToDatetimeLocal(task.due_date);
    return '';
  };

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialData?.title || task?.title || '',
      description: initialData?.description || task?.description || '',
      due_date: getInitialDueDate(),
      priority: initialData?.priority || task?.priority || TaskPriority.MEDIUM,
      estimated_duration: initialData?.estimated_duration || task?.estimated_duration || undefined,
      tags: initialData?.tags || task?.tags || [],
      parent_task_id: initialData?.parent_task_id || task?.parent_task_id || undefined,
    },
  });

  // Reset form when initialData or task changes
  useEffect(() => {
    form.reset({
      title: initialData?.title || task?.title || '',
      description: initialData?.description || task?.description || '',
      due_date: getInitialDueDate(),
      priority: initialData?.priority || task?.priority || TaskPriority.MEDIUM,
      estimated_duration: initialData?.estimated_duration || task?.estimated_duration || undefined,
      tags: initialData?.tags || task?.tags || [],
      parent_task_id: initialData?.parent_task_id || task?.parent_task_id || undefined,
    });
  }, [initialData, task, form]);

  const tags = form.watch('tags') || [];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        form.setValue('tags', [...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      'tags',
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      setIsSubmitting(true);

      // Convert datetime-local format to ISO for backend if due_date exists
      const submitData = {
        ...data,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
      };

      if (isEditMode && task) {
        const response = await updateTask(task.id, submitData);
        eventBus.publish(TASK_UPDATED, response.data);
        toast.success('Task updated successfully');
      } else {
        const response = await createTask(submitData);
        eventBus.publish(TASK_CREATED, response.data);
        toast.success('Task created successfully');
      }

      form.reset();
      onSuccess?.();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter task description (optional)"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Date and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estimated Duration */}
        <FormField
          control={form.control}
          name="estimated_duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    placeholder="Type a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
