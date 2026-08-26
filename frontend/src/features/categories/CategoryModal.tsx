import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { categoriesApi } from '../../api/categoriesApi';
import { Category, CategoryType } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState('#3B82F6');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color || '#3B82F6');
    } else {
      setName('');
      setType('expense');
      setColor('#3B82F6');
    }
    setErrorMsg('');
  }, [categoryToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Category name is required.');

      if (categoryToEdit) {
        return await categoriesApi.update(categoryToEdit.id, {
          name: name.trim(),
          color,
        });
      } else {
        return await categoriesApi.create({
          name: name.trim(),
          type,
          color,
          icon: 'Tag',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to save category.');
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
      title={categoryToEdit ? 'Edit Category' : 'Create Custom Category'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        {!categoryToEdit && (
          <Select
            label="Category Type"
            value={type}
            onChange={(e) => setType(e.target.value as CategoryType)}
            required
          >
            <option value="expense">Expense Category</option>
            <option value="income">Income Category</option>
          </Select>
        )}

        <Input
          label="Category Name"
          placeholder="e.g., Gym & Fitness, Software Subscriptions, Crypto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Badge Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  color === c ? 'scale-110 border-slate-900 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {categoryToEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
