import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { analyticsApi } from '../api/analyticsApi';
import { transactionsApi } from '../api/transactionsApi';
import { formatCurrency } from '../utils/formatters';

export const AnalyticsPage: React.FC = () => {
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

  const handleExportCsv = () => {
    const url = transactionsApi.exportCsvUrl();
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Analytics & Financial Reports"
        subtitle="Detailed insights into spending distribution, cash flows, and trends"
        actions={
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Report
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 flex-1">
        {isLoading ? (
          <div className="space-y-6">
            <LoadingSkeleton className="h-28 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton className="h-80" />
              <LoadingSkeleton className="h-80" />
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
            Failed to load analytics data.
          </div>
        ) : (
          <>
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Savings Rate</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.savings_rate_percentage}%</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Net Cash Flow ({selectedMonth})</p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(summary?.period_net_savings, summary?.currency)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total Transactions Logged</p>
                    <p className="text-xl font-bold text-slate-900">{summary?.transactions_count || 0}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Cash Flow Trends Chart */}
            <Card>
              <div className="pb-4 border-b border-slate-100 mb-4">
                <h3 className="font-semibold text-slate-900 text-sm">6-Month Cash Flow Overview</h3>
                <p className="text-xs text-slate-500">Historical comparison of income vs expenses</p>
              </div>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value, summary?.currency)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" name="Total Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Total Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="net" name="Net Savings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Breakdown Table */}
            <Card>
              <div className="pb-4 border-b border-slate-100 mb-4">
                <h3 className="font-semibold text-slate-900 text-sm">Expense Categories Breakdown</h3>
                <p className="text-xs text-slate-500">All spending grouped by category for {selectedMonth}</p>
              </div>

              {categorySpending.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Transactions</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categorySpending.map((cat) => (
                        <tr key={cat.category_name} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="font-medium text-slate-900">{cat.category_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">{cat.transaction_count}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-900">
                            {formatCurrency(cat.amount, summary?.currency)}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 font-medium">
                            {cat.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No expense records found for this period.
                </p>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
