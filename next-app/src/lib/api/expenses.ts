import apiClient from './client';
import { ApiResponse } from '../types';
import {
  Expense,
  ExpenseFormData,
  ExpenseFilters,
  AIParsedExpense,
} from '../types/expense';

/**
 * Expense API service
 * Handles expense CRUD operations, AI parsing, and dashboard analytics
 */

// ============================================================================
// Basic CRUD Operations
// ============================================================================

/**
 * Get list of expenses with optional filters
 * @param filters - Optional filters for expenses
 * @returns Paginated list of expenses
 */
export async function getExpenses(
  filters?: ExpenseFilters
): Promise<ApiResponse<Expense[]>> {
  const response = await apiClient.get<ApiResponse<Expense[]>>('/expenses/', {
    params: filters,
  });
  return response.data;
}

/**
 * Get a specific expense by ID
 * @param id - Expense ID
 * @returns Expense object
 */
export async function getExpense(id: string): Promise<ApiResponse<Expense>> {
  const response = await apiClient.get<ApiResponse<Expense>>(`/expenses/${id}`);
  return response.data;
}

/**
 * Create a new expense
 * @param data - Expense data
 * @returns Created expense object
 */
export async function createExpense(
  data: ExpenseFormData
): Promise<ApiResponse<Expense>> {
  const response = await apiClient.post<ApiResponse<Expense>>('/expenses/', data);
  return response.data;
}

/**
 * Update an existing expense
 * @param id - Expense ID
 * @param data - Updated expense data
 * @returns Updated expense object
 */
export async function updateExpense(
  id: string,
  data: Partial<ExpenseFormData>
): Promise<ApiResponse<Expense>> {
  const response = await apiClient.put<ApiResponse<Expense>>(
    `/expenses/${id}`,
    data
  );
  return response.data;
}

/**
 * Delete an expense
 * @param id - Expense ID
 * @returns Deleted expense object
 */
export async function deleteExpense(id: string): Promise<ApiResponse<Expense>> {
  const response = await apiClient.delete<ApiResponse<Expense>>(`/expenses/${id}`);
  return response.data;
}

// ============================================================================
// AI Parsing Functions
// ============================================================================

export interface ParseTextRequest {
  text: string;
}

export interface ParseTextResponse {
  id: string;
  amount: number;
  currency: string;
  category: string;
  merchant: string | null;
  description: string | null;
  date: string;
  payment_method: string | null;
  tags: string[];
  parsed_data: AIParsedExpense;
  confidence: number;
}

/**
 * Parse natural language text into expense data using AI
 * @param text - Natural language description of expense
 * @returns Parsed expense data with confidence score
 */
export async function parseText(
  text: string
): Promise<ApiResponse<ParseTextResponse>> {
  const response = await apiClient.post<ApiResponse<ParseTextResponse>>(
    '/expenses/ai/parse-text',
    { text }
  );
  return response.data;
}

/**
 * Parse receipt image into expense data using AI
 * @param file - Receipt image file
 * @returns Parsed expense data with confidence score
 */
export async function parseReceipt(
  file: File
): Promise<ApiResponse<ParseTextResponse>> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<ParseTextResponse>>(
    '/expenses/ai/parse-receipt',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Parse voice recording into expense data using AI
 * @param file - Audio file
 * @returns Parsed expense data with confidence score and transcription
 */
export async function parseVoice(
  file: File
): Promise<ApiResponse<ParseTextResponse & { transcribed_text?: string }>> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<
    ApiResponse<ParseTextResponse & { transcribed_text?: string }>
  >('/expenses/ai/parse-voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// ============================================================================
// Dashboard Analytics Functions
// ============================================================================

export interface TotalSpendData {
  current_month: number;
  previous_month: number;
  percentage_change: number;
  change_direction: 'increase' | 'decrease' | 'same';
}

/**
 * Get total spend comparison for dashboard
 * @returns Current vs previous month spending with percentage change
 */
export async function getTotalSpend(): Promise<ApiResponse<TotalSpendData>> {
  const response = await apiClient.get<ApiResponse<TotalSpendData>>(
    '/expenses/dashboard/total-spend'
  );
  return response.data;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface CategoryBreakdownParams {
  period?: 'current_month' | 'last_30_days' | 'current_year';
}

/**
 * Get category breakdown for pie chart
 * @param params - Optional period parameter
 * @returns Category breakdown with amounts and percentages
 */
export async function getCategoryBreakdown(
  params?: CategoryBreakdownParams
): Promise<ApiResponse<CategoryBreakdownItem[]>> {
  const response = await apiClient.get<ApiResponse<CategoryBreakdownItem[]>>(
    '/expenses/dashboard/category-breakdown',
    { params }
  );
  return response.data;
}

export interface CategoryTrendItem {
  month: string;
  category: string;
  amount: number;
  percentage: number;
}

export interface CategoryTrendParams {
  months?: number;
}

/**
 * Get category spending trend over time
 * @param params - Optional months parameter (default: 6)
 * @returns Category trend data for multiple months
 */
export async function getCategoryTrend(
  params?: CategoryTrendParams
): Promise<ApiResponse<CategoryTrendItem[]>> {
  const response = await apiClient.get<ApiResponse<CategoryTrendItem[]>>(
    '/expenses/dashboard/category-trend',
    { params }
  );
  return response.data;
}

export interface SpendTrendItem {
  date: string;
  amount: number;
  transaction_count: number;
}

export interface SpendTrendParams {
  period?: 'daily' | 'weekly' | 'monthly';
  days?: number;
}

/**
 * Get spending trend over time for line chart
 * @param params - Optional period and days parameters
 * @returns Spending trend data
 */
export async function getSpendTrend(
  params?: SpendTrendParams
): Promise<ApiResponse<SpendTrendItem[]>> {
  const response = await apiClient.get<ApiResponse<SpendTrendItem[]>>(
    '/expenses/dashboard/spend-trend',
    { params }
  );
  return response.data;
}

export interface TopTransaction {
  id: string;
  amount: number;
  category: string;
  merchant: string | null;
  description: string | null;
  date: string;
}

export interface TopTransactionsParams {
  period?: 'weekly' | 'monthly' | 'yearly';
  limit?: number;
}

/**
 * Get top transactions by amount
 * @param params - Optional period and limit parameters
 * @returns List of top transactions
 */
export async function getTopTransactions(
  params?: TopTransactionsParams
): Promise<ApiResponse<TopTransaction[]>> {
  const response = await apiClient.get<ApiResponse<TopTransaction[]>>(
    '/expenses/dashboard/top-transactions',
    { params }
  );
  return response.data;
}

// ============================================================================
// AI Insights
// ============================================================================

export interface SpendingInsights {
  total_spending: number;
  top_category: string;
  top_category_amount: number;
  insights: string[];
  recommendations: string[];
  spending_trend: 'increasing' | 'decreasing' | 'stable';
}

export interface InsightsParams {
  days?: number;
}

/**
 * Get AI-generated spending insights and recommendations
 * @param params - Optional days parameter (default: 30)
 * @returns AI-generated insights and recommendations
 */
export async function getInsights(
  params?: InsightsParams
): Promise<ApiResponse<SpendingInsights | { insights: string }>> {
  const response = await apiClient.get<
    ApiResponse<SpendingInsights | { insights: string }>
  >('/expenses/ai/insights', { params });
  return response.data;
}

// ============================================================================
// Additional Utility Functions
// ============================================================================

/**
 * Upload receipt for an existing expense
 * @param expenseId - Expense ID
 * @param file - Receipt image file
 * @returns Updated expense with receipt URL
 */
export async function uploadReceipt(
  expenseId: string,
  file: File
): Promise<ApiResponse<Expense>> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<Expense>>(
    `/expenses/${expenseId}/receipt`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export interface ExpenseSummary {
  total_amount: number;
  total_count: number;
  average_amount: number;
  categories: CategoryBreakdownItem[];
  period_start: string;
  period_end: string;
}

export interface SummaryParams {
  start_date?: string;
  end_date?: string;
}

/**
 * Get expense summary with category breakdown
 * @param params - Optional date range parameters
 * @returns Expense summary data
 */
export async function getExpenseSummary(
  params?: SummaryParams
): Promise<ApiResponse<ExpenseSummary>> {
  const response = await apiClient.get<ApiResponse<ExpenseSummary>>(
    '/expenses/summary',
    { params }
  );
  return response.data;
}

/**
 * Get recurring expenses
 * @returns List of recurring expenses
 */
export async function getRecurringExpenses(): Promise<ApiResponse<Expense[]>> {
  const response = await apiClient.get<ApiResponse<Expense[]>>(
    '/expenses/recurring'
  );
  return response.data;
}

/**
 * Bulk import expenses
 * @param expenses - Array of expense data
 * @returns Array of created expenses
 */
export async function bulkImportExpenses(
  expenses: ExpenseFormData[]
): Promise<ApiResponse<Expense[]>> {
  const response = await apiClient.post<ApiResponse<Expense[]>>(
    '/expenses/bulk',
    { expenses }
  );
  return response.data;
}

export interface ExportParams {
  format?: 'csv' | 'json';
  start_date?: string;
  end_date?: string;
}

/**
 * Export expenses to CSV or JSON
 * @param params - Export format and date range
 * @returns Exported data as string (CSV) or array (JSON)
 */
export async function exportExpenses(
  params?: ExportParams
): Promise<ApiResponse<string | Expense[]>> {
  const response = await apiClient.get<ApiResponse<string | Expense[]>>(
    '/expenses/export',
    { params }
  );
  return response.data;
}
