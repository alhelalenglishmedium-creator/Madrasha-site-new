'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';

export default function DashboardPage() {
  const { user, isLoading, updateUserRole, logout } = useAuth();
  const router = useRouter();

  // ভেরিফিকেশন স্টেটের জন্য
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
  const [uidInput, setUidInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-xs font-semibold text-slate-400">লোড হচ্ছে...</p>
      </div>
    );
  }

  // UID ভেরিফিকেশন সাবমিট হ্যান্ডলার
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !uidInput.trim()) return;

    setIsVerifying(true);
    setErrorMessage('');

    const res = await updateUserRole(selectedRole, uidInput.trim());

    if (!res.success) {
      setErrorMessage(res.message || 'ভুল ইউআইডি! আবার চেষ্টা করুন।');
    }
    setIsVerifying(false);
  };

  // রোল সেট না থাকলে (নতুন ইউজার) রোল সিলেকশন ও UID ভেরিফিকেশন কার্ড দেখাবে
  if (!user.role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] p-4 text-slate-900">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-slate-100">
          
          {!selectedRole ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-2xl font-bold">
                🏫
              </div>
              <h2 className="text-lg font-bold text-slate-800">পরিচয় নিশ্চিত করুন</h2>
              <p className="mt-1 text-xs text-slate-500">
                মাদ্রাসার পোর্টালে প্রবেশের জন্য আপনার সঠিক রোল নির্বাচন করুন
              </p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setSelectedRole('student')}
                  className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 font-semibold text-emerald-800 transition hover:bg-emerald-100 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📖</span>
                    <span>শিক্ষার্থী (Student)</span>
                  </div>
                  <span className="text-emerald-600">➔</span>
                </button>

                <button
                  onClick={() => setSelectedRole('teacher')}
                  className="flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/50 p-4 font-semibold text-blue-800 transition hover:bg-blue-100 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👨‍🏫</span>
                    <span>শিক্ষক (Teacher)</span>
                  </div>
                  <span className="text-blue-600">➔</span>
                </button>
              </div>

              <button
                onClick={logout}
                className="mt-6 text-xs font-semibold text-rose-500 hover:underline"
              >
                লগআউট করুন
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifySubmit}>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setErrorMessage('');
                }}
                className="mb-3 text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                ← পেছনে যান
              </button>

              <h2 className="text-base font-bold text-slate-800">
                {selectedRole === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'} ইউআইডি প্রদান করুন
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                মাদ্রাসা অফিস থেকে দেওয়া আপনার নির্দিষ্ট UID দিন
              </p>

              {errorMessage && (
                <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-100">
                  {errorMessage}
                </div>
              )}

              <div className="mt-4">
                <input
                  type="text"
                  placeholder={selectedRole === 'teacher' ? 'যেমন: T-101' : 'যেমন: S-101'}
                  value={uidInput}
                  onChange={(e) => setUidInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="mt-4 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
              >
                {isVerifying ? 'যাচাই করা হচ্ছে...' : 'যাচাই করুন ও প্রবেশ করুন'}
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // রোল ভেরিফাইড হলে ড্যাশবোর্ড রেন্ডার
  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 text-slate-900 antialiased">
      <main className="mx-auto max-w-lg p-4 sm:p-5">
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'student' && <StudentDashboard />}
        {user.role === 'teacher' && <AdminDashboard />}
      </main>
    </div>
  );
}