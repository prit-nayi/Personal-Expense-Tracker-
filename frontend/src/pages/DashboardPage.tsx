import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
  CreditCard,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { analyticsApi } from '../api/analyticsApi';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { openTransactionModal } = useOutletContext<{ openTransactionModal: () => void }>();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'dashboard', selectedMonth],
    queryFn: () => analyticsApi.getDashboardData(selectedMonth),
  });

  const summary = data?.summary;
  const categorySpending = data?.category_spending || [];
  const monthlyTrends = data?.monthly_trends || [];
  const recentTransactions = data?.recent_transactions || [];

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Financial Dashboard"
        subtitle="Real-time overview of your balances, income, and expenses"
        onAddTransaction={openTransactionModal}
        actions={
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        }
      />

      <div className="p-6 space-y-6 flex-1">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <LoadingSkeleton key={i} className="h-28" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton className="h-80" />
              <LoadingSkeleton className="h-80" />
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
            Failed to load dashboard data. Please try again.
          </div>
        ) : (
          <>
            {/* Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Balance */}
              <Card className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Balance
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(summary?.total_balance, summary?.currency)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Across {summary?.active_accounts_count || 0} active accounts
                  </p>
                </div>
              </Card>

              {/* Monthly Income */}
              <Card>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Period Income
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-emerald-600">
                    +{formatCurrency(summary?.period_income, summary?.currency)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Earned in {selectedMonth}</p>
                </div>
              </Card>

              {/* Monthly Expenses */}
              <Card>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Period Expenses
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-rose-600">
                    -{formatCurrency(summary?.period_expenses, summary?.currency)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Spent in {selectedMonth}</p>
                </div>
              </Card>

              {/* Net Savings & Rate */}
              <Card>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Net Savings
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(summary?.period_net_savings, summary?.currency)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={Number(summary?.savings_rate_percentage) >= 20 ? 'emerald' : 'amber'}>
                      {summary?.savings_rate_percentage}% savings rate
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Visual Analytics Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Spending Donut */}
              <Card className="flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Expenses by Category</h3>
                    <p className="text-[11px] text-slate-500">Distribution for {selectedMonth}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Total: {formatCurrency(summary?.period_expenses, summary?.currency)}
                  </span>
                </div>

                {categorySpending.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-1">
                    <div className="w-full sm:w-1/2 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categorySpending}
                            dataKey="amount"
                            nameKey="category_name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {categorySpending.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            formatter={(value: any) => formatCurrency(value, summary?.currency)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full sm:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-2">
                      {categorySpending.map((item) => (
                        <div key={item.category_name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-slate-700 truncate font-medium">{item.category_name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-semibold text-slate-900">{formatCurrency(item.amount, summary?.currency)}</span>
                            <span className="text-slate-400 ml-1 text-[11px]">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-400">
                    No expense transactions logged for this month.
                  </div>
                )}
              </Card>

              {/* 6-Month Income vs Expense Bar Chart */}
              <Card className="flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Monthly Trend (Last 6 Months)</h3>
                    <p className="text-[11px] text-slate-500">Income vs Expenses cash flow</p>
                  </div>
                </div>

                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
                      <ChartTooltip formatter={(value: any) => formatCurrency(value, summary?.currency)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Recent Transactions List */}
            <Card>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Recent Activity</h3>
                  <p className="text-[11px] text-slate-500">Latest financial transactions recorded</p>
                </div>
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-50 text-emerald-600'
                              : tx.type === 'expense'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : tx.type === 'expense' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                          <p className="text-xs text-slate-500">
                            {tx.type === 'transfer'
                              ? `${tx.account_name} → ${tx.destination_account_name}`
                              : `${tx.category_name || 'General'} • ${tx.account_name}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            tx.type === 'income'
                              ? 'text-emerald-600'
                              : tx.type === 'expense'
                              ? 'text-rose-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                          {formatCurrency(tx.amount, tx.currency)}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatDateTime(tx.occurred_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CreditCard className="w-6 h-6" />}
                  title="No transactions yet"
                  description="Start tracking your expenses by recording your first transaction or setting up accounts."
                  actionLabel="Add Transaction"
                  onAction={openTransactionModal}
                />
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
