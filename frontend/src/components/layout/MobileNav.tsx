import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  PieChart,
  Plus,
} from 'lucide-react';

interface MobileNavProps {
  onAddTransaction: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onAddTransaction }) => {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Activity', icon: ArrowLeftRight },
    { to: '/accounts', label: 'Accounts', icon: Wallet },
    { to: '/budgets', label: 'Budgets', icon: Target },
    { to: '/analytics', label: 'Analytics', icon: PieChart },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2">
      <div className="flex items-center justify-around relative">
        {links.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Floating Quick Action Button */}
        <button
          onClick={onAddTransaction}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 -mt-6 hover:bg-emerald-700 active:scale-95 transition-all"
          aria-label="Add Transaction"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {links.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
