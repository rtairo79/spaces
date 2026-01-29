'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    document.documentElement.setAttribute('data-page', 'login');
    return () => document.documentElement.removeAttribute('data-page');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@library.org', password: 'password', icon: '👑' },
    { role: 'Staff', email: 'staff@library.org', password: 'password', icon: '📋' },
    { role: 'Patron', email: 'patron@library.org', password: 'password', icon: '📚' },
  ];

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />

        {/* Logo & Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Library Rooms</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Book Your Perfect<br />
            <span className="text-blue-200">Study Space</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            Reserve meeting rooms, study spaces, and collaborative areas.
            Manage your library experience with ease.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 pt-4">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white border border-white/20">
              Easy Booking
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white border border-white/20">
              Real-time Availability
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white border border-white/20">
              Smart Scheduling
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-blue-200 text-sm">
          Empowering libraries with modern room management
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Library Rooms</span>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Enter your credentials to access your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                  placeholder="you@example.com"
                />
                <Mail className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors duration-200 ${
                  focusedField === 'email' ? 'text-blue-600' : 'text-slate-400'
                }`} />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                  placeholder="Enter your password"
                />
                <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors duration-200 ${
                  focusedField === 'password' ? 'text-blue-600' : 'text-slate-400'
                }`} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts Section */}
          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-sm text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Demo Accounts
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillDemo(account.email, account.password)}
                  className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{account.icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-slate-900">{account.role}</div>
                      <div className="text-xs text-slate-500">{account.email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 transition-all duration-200 group-hover:text-blue-500 group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
