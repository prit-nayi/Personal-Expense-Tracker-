import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Shield, User, Globe, Edit2, Archive, Check, Eye, EyeOff } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { CategoryModal } from '../features/categories/CategoryModal';
import { categoriesApi } from '../api/categoriesApi';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState(user?.currency_code || 'USD');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const archiveCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteOrArchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);

    try {
      const updated = await authApi.updateProfile({
        full_name: fullName.trim() || undefined,
        currency_code: currency,
      });
      updateUser(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to update password.');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Settings & Categories"
        subtitle="Manage your profile, currencies, categories, and account security"
      />

      <div className="p-6 space-y-6 flex-1 max-w-5xl">
        {/* Profile Settings */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Personal Profile</h3>
          </div>

          {profileSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4" /> Profile updated successfully.
            </div>
          )}
          {profileError && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email address cannot be changed."
              />
            </div>

            <div className="sm:w-1/2">
              <Select
                label="Display Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </Select>
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm">
                Save Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Category Management */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Transaction Categories</h3>
                <p className="text-xs text-slate-500">Preset and custom income & expense categories</p>
              </div>
            </div>

            <Button
              onClick={() => {
                setCategoryToEdit(null);
                setIsCategoryModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              size="sm"
            >
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#6B7280' }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{cat.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge variant={cat.type === 'income' ? 'emerald' : 'rose'} size="sm">
                        {cat.type}
                      </Badge>
                      {cat.is_system && (
                        <span className="text-[10px] text-slate-400">System</span>
                      )}
                    </div>
                  </div>
                </div>

                {!cat.is_system && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setCategoryToEdit(cat);
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete or archive category "${cat.name}"?`)) {
                          archiveCategoryMutation.mutate(cat.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Security / Password Change */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Security & Password</h3>
          </div>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4" /> Password changed successfully.
            </div>
          )}
          {passwordError && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />
            <Input
              label="New Password (min 6 chars)"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />
            <Button type="submit" variant="secondary" size="sm">
              Update Password
            </Button>
          </form>
        </Card>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
};
