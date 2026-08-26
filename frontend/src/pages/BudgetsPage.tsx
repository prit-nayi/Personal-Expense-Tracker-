import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, AlertTriangle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { BudgetModal } from '../features/budgets/BudgetModal';
import { budgetsApi } from '../api/budgetsApi';
import { Budget } from '../types';
import { formatCurrency } from '../utils/formatters';

export const BudgetsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets', selectedMonth],
    queryFn: () => budgetsApi.getAll(selectedMonth),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleEdit = (b: Budget) => {
    setBudgetToEdit(b);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, catName?: string | null) => {
    if (window.confirm(`Delete budget for ${catName || 'this category'}?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate total monthly budget vs total spent
  const totalBudget = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent_amount), 0);
  const overallUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Monthly Budgets"
        subtitle="Set spending limits for categories and track utilization"
        actions={
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <Button
              onClick={() => {
                setBudgetToEdit(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              size="sm"
            >
              Set Budget
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Monthly Overview Card */}
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Budget Overview • {selectedMonth}
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl font-bold">{formatCurrency(totalSpent)}</span>
                <span className="text-sm text-slate-400">spent of {formatCurrency(totalBudget)} limit</span>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Overall Progress</span>
                <span className="font-semibold text-white">{overallUtilization}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    overallUtilization >= 100
                      ? 'bg-rose-500'
                      : overallUtilization >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(overallUtilization, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Budgets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-44" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
            Failed to load budgets. Please try again.
          </div>
        ) : budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((b) => {
              const util = b.utilization_percentage;
              const isOver = util >= 100;
              const isWarn = util >= 80 && !isOver;

              return (
                <Card key={b.id} hoverEffect className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.category_color || '#6B7280' }}
                        />
                        <h3 className="font-semibold text-slate-900 text-sm">{b.category_name}</h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(b)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.category_name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                      <div>
                        <span className="text-xl font-bold text-slate-900">
                          {formatCurrency(b.spent_amount, b.currency)}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          / {formatCurrency(b.amount, b.currency)}
                        </span>
                      </div>

                      <Badge variant={isOver ? 'rose' : isWarn ? 'amber' : 'emerald'}>
                        {isOver ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Over limit
                          </span>
                        ) : isWarn ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {util}%
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {util}%
                          </span>
                        )}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(util, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {Number(b.remaining_amount) >= 0
                        ? `${formatCurrency(b.remaining_amount, b.currency)} remaining`
                        : `${formatCurrency(Math.abs(Number(b.remaining_amount)), b.currency)} overspent`}
                    </span>
                    <span className="text-[11px] text-slate-400">{b.month}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Target className="w-6 h-6" />}
            title="No budgets set for this month"
            description="Create spending limits for categories like Food, Entertainment, or Shopping to prevent overspending."
            actionLabel="Set First Budget"
            onAction={() => {
              setBudgetToEdit(null);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBudgetToEdit(null);
        }}
        budgetToEdit={budgetToEdit}
        selectedMonth={selectedMonth}
      />
    </div>
  );
};
