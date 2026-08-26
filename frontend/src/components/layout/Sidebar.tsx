import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { to: '/accounts', label: 'Accounts', icon: Wallet },
    { to: '/budgets', label: 'Budgets', icon: Target },
    { to: '/analytics', label: 'Analytics', icon: PieChart },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <TrendingUp className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">Expense Tracker</span>
          <span className="block text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">MVP Edition</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name || 'My Account'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
