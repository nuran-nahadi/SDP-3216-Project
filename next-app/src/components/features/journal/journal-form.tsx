'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { JournalEntry, JournalMood } from '@/lib/types/journal';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createJournalEntry, updateJournalEntry } from '@/lib/api/journal';
import { toast } from 'sonner';

const journalFormSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required').max(10000),
  mood: z.nativeEnum(JournalMood).optional(),
  weather: z.string().optional(),
  location: z.string().optional(),
});

type JournalFormValues = z.infer<typeof journalFormSchema>;

interface JournalFormProps {
  entry?: JournalEntry;
  initialData?: Partial<JournalFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function JournalForm({ entry, initialData, onSuccess, onCancel }: JournalFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      title: initialData?.title || entry?.title || '',
      content: initialData?.content || entry?.content || '',
      mood: initialData?.mood || entry?.mood || undefined,
      weather: initialData?.weather || entry?.weather || '',
      location: initialData?.location || entry?.location || '',
    },
  });

  // Reset form when initialData or entry changes
  useEffect(() => {
    form.reset({
      title: initialData?.title || entry?.title || '',
      content: initialData?.content || entry?.content || '',
      mood: initialData?.mood || entry?.mood || undefined,
      weather: initialData?.weather || entry?.weather || '',
      location: initialData?.location || entry?.location || '',
    });
  }, [initialData, entry, form]);

  const onSubmit = async (data: JournalFormValues) => {
    try {
      setLoading(true);
      if (entry) {
        await updateJournalEntry(entry.id, data);
        toast.success('Journal entry updated');
      } else {
        await createJournalEntry(data);
        toast.success('Journal entry created');
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Give your entry a title..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your thoughts..."
                  className="min-h-[200px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mood</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={JournalMood.VERY_HAPPY}>😄 Very Happy</SelectItem>
                    <SelectItem value={JournalMood.HAPPY}>😊 Happy</SelectItem>
                    <SelectItem value={JournalMood.NEUTRAL}>😐 Neutral</SelectItem>
                    <SelectItem value={JournalMood.SAD}>😢 Sad</SelectItem>
                    <SelectItem value={JournalMood.VERY_SAD}>😭 Very Sad</SelectItem>
                    <SelectItem value={JournalMood.ANGRY}>😠 Angry</SelectItem>
                    <SelectItem value={JournalMood.EXCITED}>🤩 Excited</SelectItem>
                    <SelectItem value={JournalMood.ANXIOUS}>😰 Anxious</SelectItem>
                    <SelectItem value={JournalMood.GRATEFUL}>🙏 Grateful</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weather"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weather</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sunny, Rainy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Where are you?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
