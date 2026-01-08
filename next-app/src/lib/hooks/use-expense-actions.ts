import { useState } from 'react';
import { deleteExpense } from '@/lib/api/expenses';
import { eventBus } from '@/lib/utils/event-bus';
import { EXPENSE_DELETED } from '@/lib/utils/event-types';
import { toast } from 'sonner';

export function useExpenseActions() {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await deleteExpense(id);
      eventBus.publish(EXPENSE_DELETED, { id });
      toast.success('Expense deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    handleDelete,
    deleting,
  };
}
