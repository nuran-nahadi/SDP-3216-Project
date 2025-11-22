'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Expense, ExpenseCategory, PaymentMethod } from '@/lib/types/expense';
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
import { createExpense, updateExpense } from '@/lib/api/expenses';
import { eventBus } from '@/lib/utils/event-bus';
import { EXPENSE_CREATED, EXPENSE_UPDATED } from '@/lib/utils/event-types';
import { toast } from 'sonner';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const expenseFormSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  category: z.nativeEnum(ExpenseCategory),
  subcategory: z.string().optional(),
  merchant: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.nativeEnum(PaymentMethod).optional(),
  tags: z.array(z.string()).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  initialData?: Partial<ExpenseFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ expense, initialData, onSuccess, onCancel }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || expense?.tags || []);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: initialData?.amount || expense?.amount || 0,
      currency: initialData?.currency || expense?.currency || 'USD',
      category: initialData?.category || expense?.category || ExpenseCategory.OTHER,
      subcategory: initialData?.subcategory || expense?.subcategory || '',
      merchant: initialData?.merchant || expense?.merchant || '',
      description: initialData?.description || expense?.description || '',
      date: initialData?.date || expense?.date || new Date().toISOString().split('T')[0],
      payment_method: initialData?.payment_method || expense?.payment_method || undefined,
      tags: initialData?.tags || expense?.tags || [],
    },
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      setLoading(true);
      
      // Convert date string to ISO datetime string
      const dateTime = new Date(data.date);
      dateTime.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      const expenseData = {
        ...data,
        date: dateTime.toISOString(),
        tags: tags,
      };

      if (expense) {
        // Update existing expense
        await updateExpense(expense.id, expenseData);
        eventBus.publish(EXPENSE_UPDATED, { id: expense.id, ...expenseData });
        toast.success('Expense updated successfully');
      } else {
        // Create new expense
        const response = await createExpense(expenseData);
        eventBus.publish(EXPENSE_CREATED, response.data);
        toast.success('Expense created successfully');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency *</FormLabel>
                <FormControl>
                  <Input placeholder="USD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ExpenseCategory.FOOD}>Food</SelectItem>
                    <SelectItem value={ExpenseCategory.TRANSPORT}>Transport</SelectItem>
                    <SelectItem value={ExpenseCategory.ENTERTAINMENT}>Entertainment</SelectItem>
                    <SelectItem value={ExpenseCategory.BILLS}>Bills</SelectItem>
                    <SelectItem value={ExpenseCategory.SHOPPING}>Shopping</SelectItem>
                    <SelectItem value={ExpenseCategory.HEALTH}>Health</SelectItem>
                    <SelectItem value={ExpenseCategory.EDUCATION}>Education</SelectItem>
                    <SelectItem value={ExpenseCategory.TRAVEL}>Travel</SelectItem>
                    <SelectItem value={ExpenseCategory.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Groceries" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="merchant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Merchant</FormLabel>
              <FormControl>
                <Input placeholder="Where did you spend?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes..."
                  className="resize-none"
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                    <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                    <SelectItem value={PaymentMethod.DEBIT_CARD}>Debit Card</SelectItem>
                    <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                    <SelectItem value={PaymentMethod.DIGITAL_WALLET}>Digital Wallet</SelectItem>
                    <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Tags</FormLabel>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add a tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
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

        <div className="flex gap-2 justify-end pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
