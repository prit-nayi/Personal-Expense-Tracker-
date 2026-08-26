import React from 'react';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Tag } from 'lucide-react';
import { Transaction } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface TransactionTableProps {
  transactions: Transaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'income':
        return (
          <Badge variant="emerald">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            Income
          </Badge>
        );
      case 'expense':
        return (
          <Badge variant="rose">
            <ArrowUpRight className="w-3 h-3 text-rose-600" />
            Expense
          </Badge>
        );
      case 'transfer':
        return (
          <Badge variant="blue">
            <ArrowLeftRight className="w-3 h-3 text-blue-600" />
            Transfer
          </Badge>
        );
      default:
        return <Badge variant="slate">{type}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                  {formatDateTime(tx.occurred_at)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-900">{tx.description}</div>
                  {tx.notes && <div className="text-xs text-slate-500 truncate max-w-xs">{tx.notes}</div>}
                  {tx.tags && (
                    <div className="flex items-center gap-1 mt-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px] text-slate-400">{tx.tags}</span>
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {tx.type === 'transfer' ? (
                    <span className="text-xs text-slate-400 italic">Internal Transfer</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tx.category_color || '#6B7280' }}
                      />
                      {tx.category_name || 'Uncategorized'}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                  {tx.type === 'transfer' ? (
                    <div className="flex items-center gap-1">
                      <span>{tx.account_name}</span>
                      <span className="text-slate-400">→</span>
                      <span>{tx.destination_account_name}</span>
                    </div>
                  ) : (
                    tx.account_name
                  )}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-right font-semibold">
                  <span
                    className={
                      tx.type === 'income'
                        ? 'text-emerald-600'
                        : tx.type === 'expense'
                        ? 'text-rose-600'
                        : 'text-blue-600'
                    }
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit transaction"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900 text-sm">{tx.description}</div>
                <div className="text-xs text-slate-500">{formatDateTime(tx.occurred_at)}</div>
              </div>
              <div className="text-right">
                <span
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
                </span>
                <div>{getTypeBadge(tx.type)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <div>
                {tx.type === 'transfer' ? (
                  <span>
                    {tx.account_name} → {tx.destination_account_name}
                  </span>
                ) : (
                  <span>
                    {tx.category_name} • {tx.account_name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(tx)}
                  className="p-1 text-slate-500 hover:text-slate-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(tx.id)}
                  className="p-1 text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600">
          <div>
            Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
