'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CircleDollarSign,
  UserPlus,
  Receipt,
  FileSpreadsheet,
  BellRing,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminBottomNav } from './AdminBottomNav';

export function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-['Hind_Siliguri',sans-serif]">
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* ================= ১. অ্যাডমিন হেডার ================= */}
        <header className="relative overflow-hidden rounded-[20px] bg-[#065F46] p-5 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-[0.08]">
            <svg width="180" height="180" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,0 61,38 100,38 68,62 79,100 50,76 21,100 32,62 0,38 39,38" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-xl font-bold text-white border border-white/20 shadow-inner">
                {user?.name ? user.name.charAt(0) : 'ম'}
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">
                  মাদ্রাসাতুল কুরআন আল-ইসলামিয়া
                </h1>
                <p className="text-[12px] text-emerald-100">
                  {user?.name || 'মুহতামিম / প্রশাসক'} • অ্যাডমিন প্যানেল
                </p>
              </div>
            </div>
          </div>

          {/* আজকের সারসংক্ষেপ স্ট্রিপ */}
          <div className="relative z-10 mt-4 flex items-center justify-between rounded-xl bg-white px-3.5 py-2 text-[#065F46] shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#065F46] shrink-0" />
              <span className="text-xs font-semibold">সকল অ্যাকাডেমিক কার্যক্রম সক্রিয়</span>
            </div>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-100">
              দৈনিক রিপোর্ট
            </span>
          </div>
        </header>

        {/* ================= ২. ওয়াক্ত স্ট্রিপ ================= */}
        <section className="flex items-center justify-between rounded-[16px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#065F46]">
              <Clock className="h-4 w-4 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1E293B]">পরবর্তী ওয়াক্ত: যোহর</p>
              <p className="text-[11px] text-[#64748B]">জামাত: ০১:১৫ মিনিট</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            ০১:১৫ PM
          </span>
        </section>

        {/* ================= ৩. প্রতিষ্ঠানের পরিসংখ্যান ================= */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#065F46] px-1">
            প্রতিষ্ঠানের পরিসংখ্যান
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* মোট শিক্ষার্থী */}
            <div className="rounded-[16px] border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B]">মোট শিক্ষার্থী</span>
                <GraduationCap className="h-4 w-4 text-slate-500 stroke-[1.8]" />
              </div>
              <div className="mt-2">
                <p className="text-xl font-bold text-[#1E293B]">১২০ <span className="text-xs font-normal text-[#64748B]">জন</span></p>
                <p className="mt-0.5 text-[10px] font-medium text-emerald-700">সকল বিভাগ মিলিয়ে</p>
              </div>
            </div>

            {/* মোট স্টাফ */}
            <div className="rounded-[16px] border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B]">ওস্তাদ ও স্টাফ</span>
                <Users className="h-4 w-4 text-slate-500 stroke-[1.8]" />
              </div>
              <div className="mt-2">
                <p className="text-xl font-bold text-[#1E293B]">১২ <span className="text-xs font-normal text-[#64748B]">জন</span></p>
                <p className="mt-0.5 text-[10px] font-medium text-[#64748B]">৮ জন উপস্থিত</p>
              </div>
            </div>

            {/* উপস্থিতি হার */}
            <div className="rounded-[16px] border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B]">আজকের উপস্থিতি</span>
                <CalendarCheck className="h-4 w-4 text-[#065F46] stroke-[1.8]" />
              </div>
              <div className="mt-2">
                <p className="text-xl font-bold text-[#065F46]">৯২%</p>
                <p className="mt-0.5 text-[10px] font-medium text-[#64748B]">অনুপস্থিত: ১০ জন</p>
              </div>
            </div>

            {/* ফি আদায় */}
            <div className="rounded-[16px] border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B]">মাসিক ফি আদায়</span>
                <CircleDollarSign className="h-4 w-4 text-slate-500 stroke-[1.8]" />
              </div>
              <div className="mt-2">
                <p className="text-xl font-bold text-[#1E293B]">৪৫,০০০ <span className="text-xs font-normal text-[#64748B]">৳</span></p>
                <p className="mt-0.5 text-[10px] font-medium text-rose-600">বকেয়া: ১৫,০০০ ৳</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ৪. প্রশাসনিক অ্যাকশন ================= */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#065F46] px-1">
            প্রশাসনিক নিয়ন্ত্রণ
          </h2>

          <div className="grid grid-cols-4 gap-2.5">
            <Link
              href="/students/new"
              className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-slate-200/80 bg-white p-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-transform active:scale-95"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#065F46]">
                <UserPlus className="h-4 w-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-medium text-[#1E293B]">ভর্তি ফরম</span>
            </Link>

            <Link
              href="/fees/collect"
              className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-slate-200/80 bg-white p-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-transform active:scale-95"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#065F46]">
                <Receipt className="h-4 w-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-medium text-[#1E293B]">ফি আদায়</span>
            </Link>

            <Link
              href="/reports"
              className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-slate-200/80 bg-white p-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-transform active:scale-95"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#065F46]">
                <FileSpreadsheet className="h-4 w-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-medium text-[#1E293B]">রিপোর্ট</span>
            </Link>

            <Link
              href="/notice/create"
              className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-slate-200/80 bg-white p-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-transform active:scale-95"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[#065F46]">
                <BellRing className="h-4 w-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-medium text-[#1E293B]">নোটিশ</span>
            </Link>
          </div>
        </section>
      </div>

      {/* ================= ৫. বটম বার ================= */}
      <AdminBottomNav />
    </div>
  );
}