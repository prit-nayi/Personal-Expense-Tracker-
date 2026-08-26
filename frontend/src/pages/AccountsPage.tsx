import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, Landmark, CreditCard, Banknote, Edit2, Archive, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { AccountModal } from '../features/accounts/AccountModal';
import { accountsApi } from '../api/accountsApi';
import { Account, AccountType } from '../types';
import { formatCurrency } from '../utils/formatters';

export const AccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['accounts', includeArchived],
    queryFn: () => accountsApi.getAll(includeArchived),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => accountsApi.deleteOrArchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-5 h-5" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5" />;
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'wallet':
        return <Wallet className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const getAccountTypeBadge = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Badge variant="blue">Bank</Badge>;
      case 'credit_card':
        return <Badge variant="purple">Credit Card</Badge>;
      case 'cash':
        return <Badge variant="emerald">Cash</Badge>;
      case 'wallet':
        return <Badge variant="amber">Wallet</Badge>;
      default:
        return <Badge variant="slate">{type}</Badge>;
    }
  };

  const handleEdit = (acc: Account) => {
    setAccountToEdit(acc);
    setIsModalOpen(true);
  };

  const handleArchive = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to archive "${name}"? Historical records will remain intact.`)) {
      archiveMutation.mutate(id);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Accounts & Balances"
        subtitle="Manage your bank accounts, credit cards, and digital wallets"
        actions={
          <Button
            onClick={() => {
              setAccountToEdit(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            size="sm"
          >
            Add Account
          </Button>
        }
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Show archived accounts</span>
          </label>
        </div>

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-44" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
            Failed to load accounts. Please try again.
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => (
              <Card key={acc.id} hoverEffect className={`flex flex-col justify-between ${acc.is_archived ? 'opacity-60 bg-slate-50' : ''}`}>
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        {getAccountIcon(acc.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-base">{acc.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getAccountTypeBadge(acc.type)}
                          {acc.is_archived && <Badge variant="rose">Archived</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(acc)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="Edit Account"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!acc.is_archived && (
                        <button
                          onClick={() => handleArchive(acc.id, acc.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Archive Account"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {acc.description && (
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">{acc.description}</p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Current Balance
                    </span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(acc.current_balance, acc.currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Opening: {formatCurrency(acc.opening_balance, acc.currency)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Wallet className="w-6 h-6" />}
            title="No accounts found"
            description="Create your first financial account (such as Checking, Cash, or Credit Card) to begin tracking balances."
            actionLabel="Add First Account"
            onAction={() => {
              setAccountToEdit(null);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAccountToEdit(null);
        }}
        accountToEdit={accountToEdit}
      />
    </div>
  );
};
