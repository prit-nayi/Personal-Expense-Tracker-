import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { categoriesApi } from '../../api/categoriesApi';
import { budgetsApi } from '../../api/budgetsApi';
import { Budget } from '../../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
  selectedMonth: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
  selectedMonth,
}) => {
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(selectedMonth);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoriesApi.getAll('expense'),
    enabled: isOpen,
  });

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.category_id);
      setAmount(String(budgetToEdit.amount));
      setMonth(budgetToEdit.month);
    } else {
      setCategoryId(categories[0]?.id || '');
      setAmount('');
      setMonth(selectedMonth);
    }
    setErrorMsg('');
  }, [budgetToEdit, isOpen, selectedMonth, categories.length]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid budget amount greater than 0.');
      }
      if (!categoryId) {
        throw new Error('Please select an expense category.');
      }

      if (budgetToEdit) {
        return await budgetsApi.update(budgetToEdit.id, {
          amount: numAmount,
        });
      } else {
        return await budgetsApi.create({
          category_id: categoryId,
          amount: numAmount,
          month,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to save budget.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    saveMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Budget Limit' : 'Set Category Budget'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        {!budgetToEdit ? (
          <Select
            label="Expense Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Select Expense Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Category
            </label>
            <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {budgetToEdit.category_name}
            </p>
          </div>
        )}

        <Input
          label="Monthly Spending Limit"
          type="number"
          step="0.01"
          placeholder="500.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Month (YYYY-MM)"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={!!budgetToEdit}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {budgetToEdit ? 'Update Limit' : 'Set Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
