'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  BookOpen,
  CalendarDays,
  CircleHelp,
  ChartNoAxesColumn,
  Clock,
  Sparkles,
  ChevronRight,
  Bookmark,
  House,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'study' | 'quiz' | 'profile'>('home');

  return (
    <div className="space-y-4 pb-20">
      {/* ================= 1. PRISTINE HEADER ================= */}
      <header className="relative overflow-hidden rounded-3xl bg-[#064e3b] p-5 text-white shadow-md">
        <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-[0.07]">
          <svg width="180" height="180" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="50,0 61,38 100,38 68,62 79,100 50,76 21,100 32,62 0,38 39,38" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-bold text-lg text-[#064e3b] shadow-sm">
              {user?.name ? user.name.charAt(0) : 'শ'}
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                মাদ্রাসাতুল কুরআন আল-ইসলামিয়া
              </h1>
              <p className="text-[11px] font-normal text-slate-200">
                {user?.name || 'শিক্ষার্থী'} • রোল: {user?.identifier || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Greeting Banner */}
        <div className="relative z-10 mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#d4af37] shrink-0 fill-[#d4af37]/20" />
            <span className="text-xs font-bold text-[#064e3b]">
              আসসালামু আলাইকুম! পড়াশোনায় স্বাগতম
            </span>
          </div>
          <span className="rounded-full bg-[#064e3b] px-3 py-1 text-[10px] font-semibold text-white">
            হিফজ বিভাগ
          </span>
        </div>
      </header>

      {/* ================= 2. WAQT STRIP ================= */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Clock className="h-4 w-4 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">পরবর্তী ওয়াক্ত: যোহর</p>
            <p className="text-[10px] text-slate-500">জামাত: ০১:১৫ মিনিট</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
          ০১:১৫ PM
        </span>
      </section>

      {/* ================= 3. STUDENT METRICS (2x2 GRID) ================= */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#064e3b] px-1">
          আমার শিক্ষা বিবরণী
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Classmates */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">সহপাঠী সংখ্যা</span>
              <GraduationCap className="h-5 w-5 text-slate-500 stroke-[1.8]" />
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-bold text-slate-900">২৫ <span className="text-xs font-normal text-slate-400">জন</span></p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">আমার শ্রেণি</p>
            </div>
          </div>

          {/* Teachers */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">শ্রেণি শিক্ষক</span>
              <Users className="h-5 w-5 text-slate-500 stroke-[1.8]" />
            </div>
            <div className="mt-2.5">
              <p className="text-sm font-bold text-slate-900">মাওলানা আব্দুল্লাহ</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">হিফজ প্রশিক্ষক</p>
            </div>
          </div>

          {/* Personal Attendance */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">আমার উপস্থিতি</span>
              <CalendarCheck className="h-5 w-5 text-emerald-600 stroke-[1.8]" />
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-bold text-emerald-800">৯৬%</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">নিয়মিত শিক্ষার্থী</p>
            </div>
          </div>

          {/* Today Routine */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">আজকের ক্লাস</span>
              <CalendarDays className="h-5 w-5 text-slate-500 stroke-[1.8]" />
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-bold text-slate-900">৪ টি</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">পরবর্তী: তাজবীদ</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. STUDENT QUICK ACTIONS ================= */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#064e3b] px-1">
          পড়াশোনা ও অনুশীলন
        </h2>

        <div className="grid grid-cols-4 gap-2.5">
          <Link
            href="/quran"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#064e3b]">
              <BookOpen className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700">কুরআন</span>
          </Link>

          <Link
            href="/routine"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#064e3b]">
              <CalendarDays className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700">রুটিন</span>
          </Link>

          <Link
            href="/quiz"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#064e3b]">
              <CircleHelp className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700">কুইজ</span>
          </Link>

          <Link
            href="/results"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#064e3b]">
              <ChartNoAxesColumn className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700">ফলাফল</span>
          </Link>
        </div>
      </section>

      {/* ================= 5. NOTICE CARD ================= */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-emerald-50 p-2 text-[#064e3b]">
              <Bookmark className="h-4 w-4" />
            </div>
            <div>
              <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#064e3b] border border-emerald-100">
                শ্রেণি নোটিশ
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800">
                আগামীকাল সকাল ৮:০০ টায় সূরা মূলকের মূল্যায়ন পরীক্ষা
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">সকলকে যথাসময়ে উপস্থিত থাকতে বলা হচ্ছে।</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 self-center" />
        </div>
      </section>

      {/* ================= 6. STUDENT BOTTOM NAVIGATION ================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
          {/* ১. হোম */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 ${
              activeTab === 'home'
                ? 'text-[#064e3b] font-bold scale-105'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <House size={20} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[11px] mt-1 tracking-tight">হোম</span>
            {activeTab === 'home' && (
              <span className="mt-1 h-1 w-1 rounded-full bg-[#064e3b]"></span>
            )}
          </button>

          {/* ২. পড়াশোনা */}
          <button
            onClick={() => setActiveTab('study')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 ${
              activeTab === 'study'
                ? 'text-[#064e3b] font-bold scale-105'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <BookOpen size={20} className={activeTab === 'study' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[11px] mt-1 tracking-tight">পড়াশোনা</span>
            {activeTab === 'study' && (
              <span className="mt-1 h-1 w-1 rounded-full bg-[#064e3b]"></span>
            )}
          </button>

          {/* ৩. কুইজ */}
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 ${
              activeTab === 'quiz'
                ? 'text-[#064e3b] font-bold scale-105'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <CircleHelp size={20} className={activeTab === 'quiz' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[11px] mt-1 tracking-tight">কুইজ</span>
            {activeTab === 'quiz' && (
              <span className="mt-1 h-1 w-1 rounded-full bg-[#064e3b]"></span>
            )}
          </button>

          {/* ৪. প্রোফাইল */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 ${
              activeTab === 'profile'
                ? 'text-[#064e3b] font-bold scale-105'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <UserRound size={20} className={activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[11px] mt-1 tracking-tight">প্রোফাইল</span>
            {activeTab === 'profile' && (
              <span className="mt-1 h-1 w-1 rounded-full bg-[#064e3b]"></span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}