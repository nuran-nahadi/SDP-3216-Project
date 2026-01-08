'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { isoToDatetimeLocal } from '@/lib/utils/date';
import { Calendar, Clock, MapPin, Tag, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { eventSchema, EventFormData } from '@/lib/utils/validators';
import { Event } from '@/lib/types/event';
import { cn } from '@/lib/utils/cn';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  event?: Event;
  initialDate?: Date;
  initialData?: Partial<EventFormData>;
}

const COLOR_OPTIONS = [
  { value: '#8b5cf6', label: 'Primary', class: 'bg-[#8b5cf6]' },
  { value: '#ef4444', label: 'Red', class: 'bg-red-500' },
  { value: '#f97316', label: 'Orange', class: 'bg-orange-500' },
  { value: '#eab308', label: 'Yellow', class: 'bg-yellow-500' },
  { value: '#22c55e', label: 'Green', class: 'bg-green-500' },
  { value: '#3b82f6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#a855f7', label: 'Purple', class: 'bg-purple-500' },
  { value: '#ec4899', label: 'Pink', class: 'bg-pink-500' },
];

export function EventForm({
  isOpen,
  onClose,
  onSubmit,
  event,
  initialDate,
  initialData,
}: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const isEditing = !!event;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      tags: [],
      is_all_day: false,
      reminder_minutes: undefined,
      recurrence_rule: '',
      color: '#8b5cf6',
    },
  });

  // Initialize form with event data or initial date
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || '',
        start_time: isoToDatetimeLocal(event.start_time),
        end_time: isoToDatetimeLocal(event.end_time),
        location: event.location || '',
        tags: event.tags || [],
        is_all_day: event.is_all_day,
        reminder_minutes: event.reminder_minutes || undefined,
        recurrence_rule: event.recurrence_rule || '',
        color: event.color || '#8b5cf6',
      });
      setTags(event.tags || []);
    } else if (initialData) {
      // Set form with AI-parsed data (already in datetime-local format)
      const startTime = initialData.start_time || '';
      const endTime = initialData.end_time || '';

      form.reset({
        title: initialData.title || '',
        description: initialData.description || '',
        start_time: startTime,
        end_time: endTime,
        location: initialData.location || '',
        tags: initialData.tags || [],
        is_all_day: initialData.is_all_day || false,
        reminder_minutes: initialData.reminder_minutes || undefined,
        recurrence_rule: initialData.recurrence_rule || '',
        color: initialData.color || '#8b5cf6',
      });
      setTags(initialData.tags || []);
    } else if (initialDate) {
      // Set default times for new event
      const startTime = new Date(initialDate);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(initialDate);
      endTime.setHours(10, 0, 0, 0);

      form.reset({
        title: '',
        description: '',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: '',
        tags: [],
        is_all_day: false,
        reminder_minutes: undefined,
        recurrence_rule: '',
        color: '#8b5cf6',
      });
      setTags([]);
    }
  }, [event, initialDate, initialData, form]);

  const handleSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);
      
      // Convert datetime-local format to ISO for backend
      const submitData = {
        ...data,
        tags,
        start_time: data.start_time ? new Date(data.start_time).toISOString() : '',
        end_time: data.end_time ? new Date(data.end_time).toISOString() : '',
      };
      
      await onSubmit(submitData);
      form.reset();
      setTags([]);
      onClose();
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Event title"
                      {...field}
                      disabled={isSubmitting}
                    />
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
                      placeholder="Event description"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* All-day toggle */}
            <FormField
              control={form.control}
              name="is_all_day"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>All-day event</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Start and End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Event location"
                        className="pl-9"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color/Priority */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COLOR_OPTIONS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-4 h-4 rounded-full',
                                color.class
                              )}
                            />
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reminder */}
            <FormField
              control={form.control}
              name="reminder_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder (minutes before)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? parseInt(value) : undefined)
                    }
                    value={field.value?.toString()}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No reminder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">At time of event</SelectItem>
                      <SelectItem value="5">5 minutes before</SelectItem>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Add tag"
                    className="pl-9"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={isSubmitting || !tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Event'
                    : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
