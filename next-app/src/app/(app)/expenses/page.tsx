'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  ExpenseTabs,
  ExpenseList,
  ExpenseForm,
  AICopilot,
  ExpenseSummary,
  DeleteExpenseDialog,
} from '@/components/features/expenses';
import { AIFloatingButton } from '@/components/shared/ai-floating-button';
import { useExpenseActions } from '@/lib/hooks/use-expense-actions';
import { Expense } from '@/lib/types/expense';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<'recent' | 'summary'>('recent');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  
  const { handleDelete: deleteExpense, deleting } = useExpenseActions();

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowCreateDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingExpenseId(id);
  };

  const confirmDelete = async () => {
    if (deletingExpenseId) {
      await deleteExpense(deletingExpenseId);
      setDeletingExpenseId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowCreateDialog(false);
    setEditingExpense(null);
  };

  const handleFormCancel = () => {
    setShowCreateDialog(false);
    setEditingExpense(null);
  };

  return (
    <div className="flex h-full">
      <div className={cn(
        'flex-1 transition-all duration-300',
        showAICopilot ? 'mr-96' : 'mr-0'
      )}>
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
              <p className="text-muted-foreground">
                Track and manage your spending
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>

      {/* Tabs */}
      <ExpenseTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content based on active tab */}
      {activeTab === 'recent' ? (
        <ExpenseList onEdit={handleEdit} onDelete={handleDeleteClick} />
      ) : (
        <ExpenseSummary />
      )}

      {/* Create/Edit Expense Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Create New Expense'}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

        </div>
      </div>

      {/* AI Copilot Dialog */}
      <Dialog open={showAICopilot} onOpenChange={setShowAICopilot}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Expense Assistant</DialogTitle>
          </DialogHeader>
          <AICopilot />
        </DialogContent>
      </Dialog>

      {/* Floating AI Button */}
      <AIFloatingButton onClick={() => setShowAICopilot(true)} isOpen={showAICopilot} />

      {/* Delete Confirmation Dialog */}
      <DeleteExpenseDialog
        open={!!deletingExpenseId}
        onOpenChange={(open) => !open && setDeletingExpenseId(null)}
        onConfirm={confirmDelete}
        expenseName="this expense"
      />
    </div>
  );
}
