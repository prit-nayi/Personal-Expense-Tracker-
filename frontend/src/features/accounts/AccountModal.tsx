import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { accountsApi } from '../../api/accountsApi';
import { Account, AccountType } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
}) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [openingBalance, setOpeningBalance] = useState('0.00');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setOpeningBalance(String(accountToEdit.opening_balance));
      setCurrency(accountToEdit.currency);
      setDescription(accountToEdit.description || '');
    } else {
      setName('');
      setType('bank');
      setOpeningBalance('0.00');
      setCurrency('USD');
      setDescription('');
    }
    setErrorMsg('');
  }, [accountToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Account name is required.');
      const bal = parseFloat(openingBalance);
      if (isNaN(bal)) throw new Error('Valid opening balance is required.');

      if (accountToEdit) {
        return await accountsApi.update(accountToEdit.id, {
          name: name.trim(),
          type,
          currency: currency.toUpperCase(),
          description: description.trim() || undefined,
        });
      } else {
        return await accountsApi.create({
          name: name.trim(),
          type,
          opening_balance: bal,
          currency: currency.toUpperCase(),
          description: description.trim() || undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to save account.');
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
      title={accountToEdit ? 'Edit Account' : 'Add Financial Account'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        <Input
          label="Account Name"
          placeholder="e.g., Chase Checking, Physical Wallet, Amex Gold"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Account Type"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            required
          >
            <option value="bank">Bank Account</option>
            <option value="cash">Cash</option>
            <option value="credit_card">Credit Card</option>
            <option value="wallet">Digital Wallet</option>
            <option value="other">Other</option>
          </Select>

          <Input
            label="Currency Code"
            placeholder="USD, EUR, GBP, INR"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            required
            maxLength={5}
          />
        </div>

        {!accountToEdit && (
          <Input
            label="Opening Balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            required
            helperText="Starting balance for this account before recorded transactions."
          />
        )}

        <Input
          label="Description (Optional)"
          placeholder="e.g. Primary salary account"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {accountToEdit ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
