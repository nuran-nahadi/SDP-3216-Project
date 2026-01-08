/**
 * Expense type definitions
 */

export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ENTERTAINMENT = 'entertainment',
  BILLS = 'bills',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  EDUCATION = 'education',
  TRAVEL = 'travel',
  OTHER = 'other',
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  OTHER = 'other',
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  subcategory: string | null;
  merchant: string | null;
  description: string | null;
  date: string;
  payment_method: PaymentMethod | null;
  receipt_url: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  subcategory?: string;
  merchant?: string;
  description?: string;
  date: string;
  payment_method?: PaymentMethod;
  tags?: string[];
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface AIParsedExpense {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  merchant?: string;
  description?: string;
  date: string;
  confidence: number;
}
