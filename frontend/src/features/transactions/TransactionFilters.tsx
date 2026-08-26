import React from 'react';
import { Search, RotateCcw, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Account, Category, TransactionType } from '../../types';
import { transactionsApi, TransactionFilterParams } from '../../api/transactionsApi';

interface TransactionFiltersProps {
  filters: TransactionFilterParams;
  onFilterChange: (newFilters: Partial<TransactionFilterParams>) => void;
  onResetFilters: () => void;
  accounts: Account[];
  categories: Category[];
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  accounts,
  categories,
}) => {
  const handleExportCsv = () => {
    const url = transactionsApi.exportCsvUrl(filters);
    window.open(url, '_blank');
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.type ||
    filters.account_id ||
    filters.category_id ||
    filters.start_date ||
    filters.end_date
  );

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, notes, tags..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 hover:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Reset Filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
        {/* Type Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) => onFilterChange({ type: (e.target.value as TransactionType) || undefined, page: 1 })}
            className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
            <option value="transfer">Transfers Only</option>
          </select>
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Account</label>
          <select
            value={filters.account_id || ''}
            onChange={(e) => onFilterChange({ account_id: e.target.value || undefined, page: 1 })}
            className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
          <select
            value={filters.category_id || ''}
            onChange={(e) => onFilterChange({ category_id: e.target.value || undefined, page: 1 })}
            className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Start Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={filters.start_date ? filters.start_date.slice(0, 10) : ''}
            onChange={(e) =>
              onFilterChange({
                start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                page: 1,
              })
            }
            className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
