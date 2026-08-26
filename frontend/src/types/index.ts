export interface User {
  id: string;
  email: string;
  full_name: string | null;
  currency_code: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type AccountType = 'bank' | 'cash' | 'credit_card' | 'wallet' | 'other';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  opening_balance: string | number;
  current_balance: string | number;
  currency: string;
  description?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
  is_archived: boolean;
  is_system: boolean;
  created_at: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id?: string | null;
  category_id?: string | null;
  type: TransactionType;
  amount: string | number;
  currency: string;
  occurred_at: string;
  description: string;
  notes?: string | null;
  tags?: string | null;
  created_at: string;
  updated_at: string;
  account_name?: string | null;
  destination_account_name?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: string | number;
  currency: string;
  month: string;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
  spent_amount: string | number;
  remaining_amount: string | number;
  utilization_percentage: number;
  status: 'normal' | 'warning' | 'danger';
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_balance: string | number;
  period_income: string | number;
  period_expenses: string | number;
  period_net_savings: string | number;
  savings_rate_percentage: number;
  currency: string;
  active_accounts_count: number;
  transactions_count: number;
}

export interface CategorySpendingItem {
  category_id?: string | null;
  category_name: string;
  color: string;
  icon: string;
  amount: string | number;
  percentage: number;
  transaction_count: number;
}

export interface MonthlyTrendItem {
  month: string;
  income: string | number;
  expenses: string | number;
  net: string | number;
}

export interface AnalyticsData {
  summary: DashboardSummary;
  category_spending: CategorySpendingItem[];
  monthly_trends: MonthlyTrendItem[];
  recent_transactions: Transaction[];
}
