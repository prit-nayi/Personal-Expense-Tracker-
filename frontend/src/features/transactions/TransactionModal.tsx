import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { accountsApi } from '../../api/accountsApi';
import { categoriesApi } from '../../api/categoriesApi';
import { transactionsApi } from '../../api/transactionsApi';
import { Transaction, TransactionType } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const queryClient = useQueryClient();

  const [type, setType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch active accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll(false),
    enabled: isOpen,
  });

  // Fetch categories based on transaction type
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', type],
    queryFn: () => categoriesApi.getAll(type === 'transfer' ? undefined : type),
    enabled: isOpen && type !== 'transfer',
  });

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAccountId(transactionToEdit.account_id);
      setDestinationAccountId(transactionToEdit.destination_account_id || '');
      setCategoryId(transactionToEdit.category_id || '');
      setAmount(String(transactionToEdit.amount));
      setOccurredAt(transactionToEdit.occurred_at ? transactionToEdit.occurred_at.slice(0, 16) : '');
      setDescription(transactionToEdit.description);
      setNotes(transactionToEdit.notes || '');
      setTags(transactionToEdit.tags || '');
    } else {
      setType('expense');
      setAccountId(accounts[0]?.id || '');
      setDestinationAccountId(accounts[1]?.id || '');
      setCategoryId(categories[0]?.id || '');
      setAmount('');
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setOccurredAt(localIso);
      setDescription('');
      setNotes('');
      setTags('');
    }
    setErrorMsg('');
  }, [transactionToEdit, isOpen, accounts.length]);

  // Set default category when type or category list changes
  useEffect(() => {
    if (!transactionToEdit && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId, transactionToEdit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0.');
      }
      if (!accountId) {
        throw new Error('Please select an account.');
      }
      if (type === 'transfer') {
        if (!destinationAccountId) {
          throw new Error('Please select a destination account.');
        }
        if (accountId === destinationAccountId) {
          throw new Error('Source and destination accounts must be different.');
        }
      } else {
        if (!categoryId) {
          throw new Error('Please select a category.');
        }
      }
      if (!description.trim()) {
        throw new Error('Please enter a description.');
      }

      const isoDate = new Date(occurredAt).toISOString();

      if (transactionToEdit) {
        return await transactionsApi.update(transactionToEdit.id, {
          type,
          account_id: accountId,
          destination_account_id: type === 'transfer' ? destinationAccountId : null,
          category_id: type === 'transfer' ? null : categoryId,
          amount: numAmount,
          occurred_at: isoDate,
          description: description.trim(),
          notes: notes.trim() || null,
          tags: tags.trim() || null,
        });
      } else {
        return await transactionsApi.create({
          type,
          account_id: accountId,
          destination_account_id: type === 'transfer' ? destinationAccountId : null,
          category_id: type === 'transfer' ? null : categoryId,
          amount: numAmount,
          occurred_at: isoDate,
          description: description.trim(),
          notes: notes.trim() || null,
          tags: tags.trim() || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to save transaction.');
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
      title={transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Transaction Type Segmented Switch */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setErrorMsg('');
                }}
                className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                  type === t
                    ? t === 'expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : t === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />

        {/* Account selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={type === 'transfer' ? 'From Account' : 'Account'}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="">Select Account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (${Number(acc.current_balance).toFixed(2)})
              </option>
            ))}
          </Select>

          {type === 'transfer' ? (
            <Select
              label="To Destination Account"
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              required
            >
              <option value="">Select Destination</option>
              {accounts
                .filter((acc) => acc.id !== accountId)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${Number(acc.current_balance).toFixed(2)})
                  </option>
                ))}
            </Select>
          ) : (
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Description & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Description"
            placeholder="e.g., Grocery Shopping, Uber, Salary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            required
          />
        </div>

        {/* Notes & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Notes (Optional)"
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Input
            label="Tags (Optional)"
            placeholder="e.g., vacation, dinner"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {transactionToEdit ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
