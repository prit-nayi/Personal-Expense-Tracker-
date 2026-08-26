import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { TransactionFilters } from '../features/transactions/TransactionFilters';
import { TransactionTable } from '../features/transactions/TransactionTable';
import { TransactionModal } from '../features/transactions/TransactionModal';
import { transactionsApi, TransactionFilterParams } from '../api/transactionsApi';
import { accountsApi } from '../api/accountsApi';
import { categoriesApi } from '../api/categoriesApi';
import { Transaction } from '../types';

export const TransactionsPage: React.FC = () => {
  const { openTransactionModal: globalOpenTransactionModal } = useOutletContext<{ openTransactionModal: () => void }>();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<TransactionFilterParams>({
    page: 1,
    limit: 20,
  });

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch Transactions with current filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.getAll(filters),
  });

  // Fetch Accounts for filter dropdowns
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll(false),
  });

  // Fetch Categories for filter dropdowns
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const handleFilterChange = (newFilters: Partial<TransactionFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 20 });
  };

  const handleEdit = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? Account balances will adjust automatically.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Transactions"
        subtitle="Manage and search all income, expense, and transfer records"
        onAddTransaction={globalOpenTransactionModal}
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Filters Bar */}
        <TransactionFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          accounts={accounts}
          categories={categories}
        />

        {/* Transactions Table or Skeletons */}
        {isLoading ? (
          <div className="space-y-3 bg-white p-6 rounded-xl border border-slate-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <LoadingSkeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
            Failed to load transactions. Please try again.
          </div>
        ) : data && data.items.length > 0 ? (
          <TransactionTable
            transactions={data.items}
            totalCount={data.total}
            currentPage={data.page}
            totalPages={data.total_pages}
            onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState
            icon={<ArrowLeftRight className="w-6 h-6" />}
            title="No transactions found"
            description="No transactions match your current search or filter criteria. Try adjusting filters or create a new record."
            actionLabel="Add Transaction"
            onAction={globalOpenTransactionModal}
          />
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <TransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setTransactionToEdit(null);
          }}
          transactionToEdit={transactionToEdit}
        />
      )}
    </div>
  );
};
