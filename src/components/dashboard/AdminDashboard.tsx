'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  CircleDollarSign,
  UserPlus,
  ClipboardCheck,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { getDashboardMetrics, type DashboardMetrics } from '@/services/dashboardService';

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    totalStaff: 0,
    todayPresentCount: 0,
    todayCollection: 0,
    totalPendingDue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-4">
      {/* Pristine Header */}
      <header className="relative overflow-hidden rounded-3xl bg-[#064e3b] p-5 text-white shadow-md">
        <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-[0.07]">
          <svg width="180" height="180" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="50,0 61,38 100,38 68,62 79,100 50,76 21,100 32,62 0,38 39,38" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-bold text-lg text-[#064e3b] shadow-sm">
              ম
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                মাদ্রাসাতুল কুরআন আল-ইসলামিয়া
              </h1>
              <p className="text-[11px] font-normal text-slate-200">
                মুহতামিম প্যানেল • ১৯ সফর, ১৪৪৮ হি.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#d4af37] shrink-0 fill-[#d4af37]/20" />
            <span className="text-xs font-bold text-[#064e3b]">
              আসসালামু আলাইকুম, প্রধান প্রশাসক
            </span>
          </div>
          <span className="rounded-full bg-[#064e3b] px-3 py-1 text-[10px] font-semibold text-white">
            এডমিন কন্ট্রোল
          </span>
        </div>
      </header>

      {/* Waqt Strip */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Clock className="h-4 w-4 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">পরবর্তী ওয়াক্ত: যোহর</p>
            <p className="text-[10px] text-slate-500">আযান: ১২:০৫ মিনিট • জামাত: ০১:১৫ মিনিট</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
          ০১:১৫ PM
        </span>
      </section>

      {/* 2x2 Admin Metrics */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#064e3b] px-1">
          আজকের সারসংক্ষেপ
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">মোট শিক্ষার্থী</span>
              <GraduationCap className="h-5 w-5 text-slate-500 stroke-[1.8]" />
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : metrics.totalStudents}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">সক্রিয় শিক্ষার্থী তালিকা</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">শিক্ষক ও স্টাফ</span>
              <Users className="h-5 w-5 text-slate-500 stroke-[1.8]" />
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : metrics.totalStaff}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">কর্মরত শিক্ষককুল</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">আজকের হাজিরা</span>
              <CalendarCheck className="h-5 w-5 text-slate-500 stroke-[1.8]" />
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : metrics.todayPresentCount}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">উপস্থিত</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">আজকের আদায়</span>
              <CircleDollarSign className="h-5 w-5 text-[#d4af37] stroke-[1.8]" />
            </div>
            <div className="mt-2.5">
              <p className="text-2xl font-bold text-slate-900">
                ৳ {isLoading ? '...' : metrics.todayCollection.toLocaleString('bn-BD')}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">নগদ ও ডিজিটাল জমা</p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Quick Actions */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#064e3b] px-1">
          কুইক অ্যাকশন
        </h2>

        <div className="grid grid-cols-4 gap-2.5">
          <Link
            href="/students"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#064e3b]">
              <UserPlus className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700">নতুন ভর্তি</span>
          </Link>

          <Link
            href="/attendance"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#064e3b]">
              <ClipboardCheck className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700">হাজিরা</span>
          </Link>

          <Link
            href="/fees"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#064e3b]">
              <CircleDollarSign className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700">ফি জমা</span>
          </Link>

          <Link
            href="/reports"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#064e3b]">
              <FileText className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-medium text-slate-700">রিপোর্ট</span>
          </Link>
        </div>
      </section>

      {/* Notice Strip */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-emerald-50 p-2 text-[#064e3b]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="inline-block rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100">
                জরুরি নোটিশ
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800">
                আগামী বৃহস্পতিবার মাসিক পরীক্ষার ফলাফল প্রকাশ
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                সকল শ্রেণি শিক্ষককে যথাসময়ে মূল্যায়ন নম্বর জমা দিতে বলা হচ্ছে।
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 self-center" />
        </div>
      </section>
    </div>
  );
}