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
  ExpenseSummary,
  DeleteExpenseDialog,
} from '@/components/features/expenses';
import { AIChatPanel } from '@/components/shared/ai-chat-panel';
import { AIFloatingButton } from '@/components/shared/ai-floating-button';
import { useExpenseActions } from '@/lib/hooks/use-expense-actions';
import { parseText, parseReceipt, parseVoice } from '@/lib/api/expenses';
import { Expense } from '@/lib/types/expense';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<'recent' | 'summary'>('recent');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
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
    setAiSuggestion(null);
  };

  const handleFormCancel = () => {
    setShowCreateDialog(false);
    setEditingExpense(null);
    setAiSuggestion(null);
  };

  const handleAIMessage = async (message: string) => {
    try {
      const response = await parseText(message);
      const parsed = response.data;

      let content = 'I\'ve analyzed your expense! Here\'s what I found:\n\n';
      
      if (parsed.amount) content += `💰 Amount: ${parsed.currency || 'USD'} ${parsed.amount}\n`;
      if (parsed.category) content += `📁 Category: ${parsed.category}\n`;
      if (parsed.merchant) content += `🏪 Merchant: ${parsed.merchant}\n`;
      if (parsed.date) content += `📅 Date: ${parsed.date}\n`;
      if (parsed.payment_method) content += `💳 Payment: ${parsed.payment_method}\n`;

      content += '\nWould you like to create this expense?';

      return {
        content,
        data: {
          amount: parsed.amount || 0,
          currency: parsed.currency || 'USD',
          category: parsed.category,
          subcategory: parsed.subcategory,
          merchant: parsed.merchant,
          description: parsed.description,
          date: parsed.date || new Date().toISOString().split('T')[0],
          payment_method: parsed.payment_method,
        },
      };
    } catch (error) {
      return {
        content: 'I had trouble understanding that. Could you describe the expense differently?',
      };
    }
  };

  const handleAIVoice = async (audioFile: File) => {
    try {
      const response = await parseVoice(audioFile);
      
      // Check if the response indicates failure
      if (!response.success) {
        const transcribedText = (response as any).transcribed_text;
        let errorContent = response.message || 'I had trouble understanding that.';
        if (transcribedText) {
          errorContent = `📝 I heard: "${transcribedText}"\n\n${errorContent}\n\nPlease try describing the expense with more details like amount and category.`;
        }
        return {
          content: errorContent,
          transcribedText,
        };
      }

      const parsed = response.data;

      let content = 'I\'ve analyzed your voice input! Here\'s what I found:\n\n';
      
      if (parsed.amount) content += `💰 Amount: ${parsed.currency || 'USD'} ${parsed.amount}\n`;
      if (parsed.category) content += `📁 Category: ${parsed.category}\n`;
      if (parsed.merchant) content += `🏪 Merchant: ${parsed.merchant}\n`;
      if (parsed.date) content += `📅 Date: ${parsed.date}\n`;
      if (parsed.payment_method) content += `💳 Payment: ${parsed.payment_method}\n`;

      content += '\nWould you like to create this expense?';

      return {
        content,
        transcribedText: parsed.transcribed_text,
        data: {
          amount: parsed.amount || 0,
          currency: parsed.currency || 'USD',
          category: parsed.category,
          subcategory: parsed.subcategory,
          merchant: parsed.merchant,
          description: parsed.description,
          date: parsed.date || new Date().toISOString().split('T')[0],
          payment_method: parsed.payment_method,
        },
      };
    } catch (error) {
      console.error('Voice parsing error:', error);
      return {
        content: 'I had trouble understanding your voice message. Please try again or speak more clearly.',
      };
    }
  };

  const handleAIImage = async (imageFile: File) => {
    try {
      const response = await parseReceipt(imageFile);
      const parsed = response.data;

      let content = 'I\'ve analyzed your receipt! Here\'s what I found:\n\n';
      
      if (parsed.amount) content += `💰 Amount: ${parsed.currency || 'USD'} ${parsed.amount}\n`;
      if (parsed.category) content += `📁 Category: ${parsed.category}\n`;
      if (parsed.merchant) content += `🏪 Merchant: ${parsed.merchant}\n`;
      if (parsed.date) content += `📅 Date: ${parsed.date}\n`;
      if (parsed.payment_method) content += `💳 Payment: ${parsed.payment_method}\n`;

      content += '\nWould you like to create this expense?';

      return {
        content,
        data: {
          amount: parsed.amount || 0,
          currency: parsed.currency || 'USD',
          category: parsed.category,
          subcategory: parsed.subcategory,
          merchant: parsed.merchant,
          description: parsed.description,
          date: parsed.date || new Date().toISOString().split('T')[0],
          payment_method: parsed.payment_method,
        },
      };
    } catch (error) {
      return {
        content: 'I had trouble analyzing that receipt. Please try with a clearer image.',
      };
    }
  };

  const handleAcceptSuggestion = (data: any) => {
    setAiSuggestion(data);
    setShowCreateDialog(true);
    setShowAIChat(false);
  };

  return (
    <div className="flex h-full">
      <div className={cn(
        'flex-1 transition-all duration-300',
        showAIChat ? 'mr-96' : 'mr-0'
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
            initialData={aiSuggestion}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        title="Expense AI Assistant"
        placeholder="Describe your expense..."
        onSendMessage={handleAIMessage}
        onSendVoice={handleAIVoice}
        onSendImage={handleAIImage}
        onAcceptSuggestion={handleAcceptSuggestion}
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        supportsVoice={true}
        supportsImage={true}
      />

      {/* Floating AI Button */}
      <AIFloatingButton onClick={() => setShowAIChat(true)} isOpen={showAIChat} />

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
