import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.register({
        email: cleanEmail,
        password,
        full_name: fullName.trim() || undefined,
        currency_code: currency,
      });
      login(res);
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError(detail.map((d: any) => d.msg || 'Invalid field').join(', '));
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 mb-4">
          <TrendingUp className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Take control of your personal income, expenses, and savings
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-100">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftElement={<User className="w-4 h-4" />}
              autoFocus
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftElement={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password (min 6 characters)"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftElement={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            <Select
              label="Primary Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
              <option value="JPY">JPY (¥)</option>
            </Select>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Get Started Free
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
