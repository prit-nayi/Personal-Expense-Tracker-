import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddTransaction?: () => void;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onAddTransaction,
  actions,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          {onAddTransaction && (
            <Button
              onClick={onAddTransaction}
              leftIcon={<Plus className="w-4 h-4" />}
              size="sm"
              className="shadow-sm"
            >
              Add Transaction
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
