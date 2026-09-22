'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, updateUserRole, isLoading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ইউজার অলরেডি রোল নিয়ে লগইন থাকলে সরাসরি ড্যাশবোর্ডে যাবে
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // নতুন ইউজারের রোল সাবমিট
  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (!identifier.trim()) {
      setErrorMessage(selectedRole === 'student' ? 'রোল বা শিক্ষার্থী আইডি লিখুন' : 'শিক্ষক পদবী বা আইডি লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserRole(selectedRole, identifier.trim());
      router.push('/dashboard');
    } catch (err) {
      setErrorMessage('রোল সেভ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] p-4 text-slate-900 antialiased selection:bg-[#064e3b] selection:text-white">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">

        {/* Branding & Islamic Header */}
        <div className="text-center space-y-2.5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#064e3b] text-white shadow-md">
            <span className="text-3xl font-bold font-sans">ম</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">মাদ্রাসাতুল কুরআন আল-ইসলামিয়া</h1>
            <p className="text-xs text-emerald-800 font-medium mt-0.5">
              "তোমাদের মধ্যে সর্বোত্তম ব্যক্তি সে, যে নিজে কুরআন শেখে এবং অন্যকে শেখায়।"
            </p>
          </div>
        </div>

        {/* Scenario 1: User Not Logged In -> Google Sign In Screen */}
        {!user && (
          <div className="space-y-5 pt-2">
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-[#d4af37] mb-1.5" />
              <p className="text-xs font-semibold text-[#064e3b]">অ্যাপ ব্যবহারে স্বাগতম</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                আপনার গুগল একাউন্ট (Gmail) দিয়ে এক ক্লিকে নিরাপদে সাইন ইন করুন
              </p>
            </div>

            <button
              type="button"
              onClick={loginWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
            >
              {/* Google Colored SVG Icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              গুগল দিয়ে সাইন ইন করুন
            </button>
          </div>
        )}

        {/* Scenario 2: Logged In via Google, but Role not chosen yet */}
        {user && !user.role && (
          <div className="space-y-5 pt-1">
            <div className="text-center">
              <p className="text-xs font-bold text-[#064e3b]">স্বাগতম, {user.name}!</p>
              <p className="text-[11px] text-slate-500">আপনার সঠিক ভূমিকা নির্বাচন করে প্রোফাইল সম্পন্ন করুন</p>
            </div>

            {/* Role Options */}
            {!selectedRole ? (
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-[#064e3b] hover:bg-white active:scale-95"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-[#064e3b]">
                    <GraduationCap className="h-6 w-6 stroke-[2]" />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-bold text-slate-800">আমি শিক্ষার্থী</span>
                    <span className="text-[10px] text-slate-500">পড়াশোনা ও রুটিন</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-[#064e3b] hover:bg-white active:scale-95"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                    <Users className="h-6 w-6 stroke-[2]" />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-bold text-slate-800">আমি শিক্ষক</span>
                    <span className="text-[10px] text-slate-500">হাজিরা ও ক্লাস পরিচালনা</span>
                  </div>
                </button>
              </div>
            ) : (
              <form onSubmit={handleRoleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#064e3b]">
                    {selectedRole === 'student' ? '🎓 শিক্ষার্থী তথ্য' : '👨‍🏫 শিক্ষক তথ্য'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(null);
                      setErrorMessage('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                  >
                    ভূমিকা পরিবর্তন
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    {selectedRole === 'student' ? 'আপনার রোল নম্বর বা শিক্ষার্থী UID:' : 'শিক্ষক আইডি বা পদবী:'}
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={selectedRole === 'student' ? 'উদা: ০৫ বা STU-102' : 'উদা: সহকারী শিক্ষক'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#064e3b] focus:bg-white focus:outline-none"
                    autoFocus
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#064e3b] py-2.5 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? 'সেভ হচ্ছে...' : 'ড্যাশবোর্ডে প্রবেশ করুন'} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}