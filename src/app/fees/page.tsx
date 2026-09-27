'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CircleDollarSign,
  Receipt,
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  User,
  X,
  History,
  AlertCircle,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { localDb } from '@/db/localDb';
import { supabase } from '@/lib/supabaseClient';
import type { Student, FeePayment } from '@/types/database.types';

import { FeeCollectionModal } from '@/components/admin/FeeCollectionModal';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';

interface PaymentWithStudent extends FeePayment {
  student?: Student;
}

type ViewFilter = 'paid' | 'due';
type TimeScope = 'current_month' | 'all_time';

interface RunningMonthStatus {
  key: string; // e.g. "2026-09"
  label: string; // e.g. "সেপ্টেম্বর ২০২৬"
  isPaid: boolean;
}

interface StudentDueInfo {
  student: Student;
  totalDueMonths: number;
  unpaidMonths: string[];
  paidMonths: string[];
  runningMonths: RunningMonthStatus[];
  totalExpectedFee: number;
  totalDueAmount: number;
  totalPaidAmount: number;
  payments: PaymentWithStudent[];
  firstUnpaidMonthLabel?: string;
}

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BENGALI_TO_ENG_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const toEnglishDigitsStr = (str: string): string => {
  return str.replace(/[০-৯]/g, (w) => BENGALI_TO_ENG_DIGITS[w] || w);
};

// যেকোনো স্ট্রিং থেকে স্ট্যান্ডার্ড "YYYY-MM" কী তৈরি করে
const normalizeMonthKey = (rawMonth?: string, paymentDate?: string): string => {
  if (!rawMonth && !paymentDate) return '';
  const str = toEnglishDigitsStr(rawMonth || paymentDate || '').trim();

  // YYYY-MM ম্যাচিং
  const yyyyMmMatch = str.match(/(\d{4})[-/](\d{1,2})/);
  if (yyyyMmMatch) {
    const y = yyyyMmMatch[1];
    const m = String(parseInt(yyyyMmMatch[2], 10)).padStart(2, '0');
    return `${y}-${m}`;
  }

  // বাংলা মাসের নাম থেকে রূপান্তর
  for (let i = 0; i < BENGALI_MONTHS.length; i++) {
    const bMonth = BENGALI_MONTHS[i];
    if (rawMonth && rawMonth.includes(bMonth)) {
      const yearMatch = str.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
      const monthNum = String(i + 1).padStart(2, '0');
      return `${year}-${monthNum}`;
    }
  }

  if (paymentDate && paymentDate.length >= 7) {
    return paymentDate.slice(0, 7);
  }

  return str;
};

const formatMonthBengali = (monthKey: string): string => {
  const normKey = normalizeMonthKey(monthKey);
  const parts = normKey.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      const banglaYear = year.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
      return `${BENGALI_MONTHS[monthIdx]} ${banglaYear}`;
    }
  }
  return monthKey;
};

export default function FeesPage() {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [classList, setClassList] = useState<string[]>(['সব', 'প্লে', 'নার্সারি', 'হিফজ']);
  const [selectedClass, setSelectedClass] = useState<string>('সব');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('paid');
  const [timeScope, setTimeScope] = useState<TimeScope>('current_month');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedStudent, setPreselectedStudent] = useState<Student | null>(null);
  const [selectedModalMonth, setSelectedModalMonth] = useState<string | undefined>(undefined);
  const [successToast, setSuccessToast] = useState('');

  // শিক্ষার্থী লেজার পপআপ
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<StudentDueInfo | null>(null);

  // চলতি মাস
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // ১. ফি পেমেন্ট ও ছাত্র তালিকা লোড
  const loadFeeData = async () => {
    try {
      setIsLoading(true);

      const students = await localDb.students.where('status').equals('active').toArray();
      setStudentsList(students);
      const studentMap = new Map<string, Student>();
      students.forEach((s) => studentMap.set(s.id, s));

      const defaultClasses = ['প্লে', 'নার্সারি', 'হিফজ'];
      const savedClasses = localStorage.getItem('madrasa_custom_classes');
      if (savedClasses) {
        try {
          const parsed = JSON.parse(savedClasses);
          if (Array.isArray(parsed)) {
            parsed.forEach((c) => {
              if (!defaultClasses.includes(c)) defaultClasses.push(c);
            });
          }
        } catch (e) {
          console.error(e);
        }
      }

      students.forEach((s) => {
        if (s.className && !defaultClasses.includes(s.className)) {
          defaultClasses.push(s.className);
        }
      });
      setClassList(['সব', ...defaultClasses]);

      const allPayments = await localDb.feePayments.toArray();
      allPayments.reverse();

      const combined: PaymentWithStudent[] = allPayments.map((p) => ({
        ...p,
        student: studentMap.get(p.studentId),
      }));

      setPayments(combined);
    } catch (err) {
      console.error('ফি ডাটা লোড ত্রুটি:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, []);

  // নতুন ফি সংরক্ষণ
  const handleSavePayment = async (paymentData: any) => {
    try {
      const paymentId = `fee_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const feeTypeName = paymentData.feeTypeId || paymentData.feeType || 'মাসিক বেতন';
      const paymentNotes = paymentData.notes || paymentData.note || '';
      const actualPaidAt = paymentData.paymentDate
        ? (paymentData.paymentDate.includes('T') ? paymentData.paymentDate : `${paymentData.paymentDate}T12:00:00Z`)
        : now;

      const newPayment: FeePayment = {
        ...paymentData,
        feeTypeId: feeTypeName,
        feeType: feeTypeName,
        notes: paymentNotes,
        note: paymentNotes,
        paymentDate: paymentData.paymentDate || now.split('T')[0],
        id: paymentId,
        receiptNo: receiptNumber,
        synced: true,
        createdAt: now,
      };

      await localDb.feePayments.add(newPayment);

      try {
        const { error: supaErr } = await supabase.from('student_fees').insert([{
          student_id: paymentData.studentId,
          amount: Number(paymentData.amount) || 0,
          fee_type: feeTypeName,
          month: paymentData.month || 'চলতি মাস',
          payment_method: paymentData.paymentMethod || 'cash',
          receipt_no: receiptNumber,
          note: paymentNotes,
          paid_at: actualPaidAt,
          created_at: now,
        }]);

        if (supaErr) {
          console.warn('student_fees insert warning:', supaErr.message);
        }
      } catch (e: any) {
        console.warn('student_fees network error:', e?.message || e);
      }

      setSuccessToast('ফি আদায় সফলভাবে সম্পন্ন হয়েছে!');
      setTimeout(() => setSuccessToast(''), 3000);
      setPreselectedStudent(null);
      await loadFeeData();
    } catch (e) {
      alert('ফি সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // ২. জানুয়ারি হতে চলতি মাস পর্যন্ত প্রতি শিক্ষার্থীর পূর্ণ হিসাব ও পেইড/আনপেইড গ্রিড
  const studentsDueSummary = useMemo(() => {
    const summaryMap = new Map<string, StudentDueInfo>();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthNum = currentDate.getMonth(); // 0 = Jan, 8 = Sep

    studentsList.forEach((std) => {
      // শিক্ষার্থীর হিসাব বছর শুরুর জানুয়ারি থেকে বর্তমান মাস পর্যন্ত
      const startYear = currentYear;
      const startMonth = 0; // জানুয়ারি

      const studentPayments = payments.filter((p) => p.studentId === std.id);
      const paidMonthsSet = new Set<string>();

      studentPayments.forEach((p) => {
        const normKey = normalizeMonthKey(p.month, p.paymentDate);
        if (normKey) {
          paidMonthsSet.add(normKey);
        }
      });

      const unpaidMonths: string[] = [];
      const paidMonthsList: string[] = [];
      const runningMonths: RunningMonthStatus[] = [];

      // জানুয়ারি থেকে চলতি মাস পর্যন্ত প্রতি মাসের স্ট্যাটাস
      let y = startYear;
      let m = startMonth;

      while (y < currentYear || (y === currentYear && m <= currentMonthNum)) {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        const isPaid = paidMonthsSet.has(monthStr);

        if (isPaid) {
          paidMonthsList.push(monthStr);
        } else {
          unpaidMonths.push(monthStr);
        }

        runningMonths.push({
          key: monthStr,
          label: formatMonthBengali(monthStr),
          isPaid,
        });

        m++;
        if (m > 11) {
          m = 0;
          y++;
        }
      }

      const monthlyFee = Number(std.monthlyFee) || 0;
      const totalExpectedFee = runningMonths.length * monthlyFee;
      const totalPaidAmount = studentPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const totalDueAmount = Math.max(0, totalExpectedFee - totalPaidAmount);

      const firstUnpaid = unpaidMonths.length > 0 ? formatMonthBengali(unpaidMonths[0]) : undefined;

      summaryMap.set(std.id, {
        student: std,
        totalDueMonths: unpaidMonths.length,
        unpaidMonths,
        paidMonths: paidMonthsList,
        runningMonths,
        totalExpectedFee,
        totalPaidAmount,
        totalDueAmount,
        payments: studentPayments,
        firstUnpaidMonthLabel: firstUnpaid,
      });
    });

    return summaryMap;
  }, [studentsList, payments]);

  // ৩. ড্যাশবোর্ড পরিসংখ্যান মেট্রিক্স
  const metrics = useMemo(() => {
    if (timeScope === 'current_month') {
      // চলতি মাসের জন্য স্পেসিফিক পেইড স্টুডেন্ট চেক
      const paidStudentIds = new Set<string>();
      let paidTotalAmount = 0;

      payments.forEach((p) => {
        const norm = normalizeMonthKey(p.month, p.paymentDate);
        if (norm === currentMonthKey) {
          paidStudentIds.add(p.studentId);
          paidTotalAmount += Number(p.amount) || 0;
        }
      });

      const paidCount = paidStudentIds.size;
      const dueStudents = studentsList.filter((s) => !paidStudentIds.has(s.id));
      const dueCount = dueStudents.length;
      const dueTotalAmount = dueStudents.reduce((sum, s) => sum + (Number(s.monthlyFee) || 0), 0);

      return {
        paidTotalAmount,
        paidCount,
        dueTotalAmount,
        dueCount,
      };
    } else {
      let paidTotalAmount = 0;
      let dueTotalAmount = 0;
      let dueCount = 0;
      let paidCount = 0;

      studentsDueSummary.forEach((info) => {
        paidTotalAmount += info.totalPaidAmount;
        dueTotalAmount += info.totalDueAmount;
        if (info.totalDueMonths > 0) {
          dueCount++;
        } else {
          paidCount++;
        }
      });

      return {
        paidTotalAmount,
        paidCount,
        dueTotalAmount,
        dueCount,
      };
    }
  }, [timeScope, payments, studentsList, studentsDueSummary, currentMonthKey]);

  // ৪. বিভাগ অনুযায়ী বকেয়া শিক্ষার্থীর সংখ্যা
  const dueCountByClass = useMemo(() => {
    const map: Record<string, number> = { সব: metrics.dueCount };

    classList.forEach((cls) => {
      if (cls !== 'সব') {
        let count = 0;
        studentsList.forEach((s) => {
          if (s.className === cls) {
            const info = studentsDueSummary.get(s.id);
            if (timeScope === 'current_month') {
              const isPaidCurrent = info?.paidMonths.includes(currentMonthKey);
              if (!isPaidCurrent) count++;
            } else {
              if (info && info.totalDueMonths > 0) count++;
            }
          }
        });
        map[cls] = count;
      }
    });

    return map;
  }, [classList, studentsList, studentsDueSummary, timeScope, currentMonthKey, metrics.dueCount]);

  // ৫. ফিল্টারকৃত শিক্ষার্থী তালিকা
  const displayedStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return studentsList.filter((std) => {
      const matchClass = selectedClass === 'সব' || std.className === selectedClass;
      if (!matchClass) return false;

      const info = studentsDueSummary.get(std.id);
      const isCurrentPaid = info ? info.paidMonths.includes(currentMonthKey) : false;

      if (viewFilter === 'paid') {
        if (timeScope === 'current_month' && !isCurrentPaid) return false;
        if (timeScope === 'all_time' && (info?.totalPaidAmount || 0) <= 0) return false;
      } else {
        if (timeScope === 'current_month' && isCurrentPaid) return false;
        if (timeScope === 'all_time' && (info?.totalDueMonths || 0) <= 0) return false;
      }

      if (!q) return true;
      return (
        (std.fullNameBangla && std.fullNameBangla.toLowerCase().includes(q)) ||
        (std.fullName && std.fullName.toLowerCase().includes(q)) ||
        (std.rollNo && std.rollNo.toString().includes(q)) ||
        (std.phone && std.phone.includes(q))
      );
    });
  }, [studentsList, selectedClass, studentsDueSummary, viewFilter, timeScope, currentMonthKey, searchQuery]);

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-[#EDF3EF] text-[#1F2937] antialiased p-0 sm:py-4 font-hind overflow-hidden">

      {/* মোবাইল ফ্রেম */}
      <div className="relative w-full max-w-[430px] bg-[#F7FBF9] h-full sm:h-[870px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-[#DFECE5]">

        {/* টোস্ট */}
        {successToast && (
          <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#008955] px-4 py-2 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={15} className="text-emerald-200" />
            <span>{successToast}</span>
          </div>
        )}

        {/* হেডার */}
        <header className="shrink-0 bg-[#F7FBF9] px-4 pt-5 pb-3 z-30 flex items-center justify-between border-b border-[#E7F0EB]">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="h-10 w-10 rounded-2xl bg-white border border-[#E5EFEA] flex items-center justify-center text-[#4B5563] shadow-xs active:scale-95 transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-[#1F2937] leading-none">ফি ও হিসাব লেজার</h1>
              <p className="text-[10px] text-[#008955] font-semibold mt-1">
                মোট শিক্ষার্থী: {studentsList.length} জন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPreselectedStudent(null);
              setSelectedModalMonth(undefined);
              setIsModalOpen(true);
            }}
            className="h-10 px-3.5 rounded-2xl bg-[#008955] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition hover:bg-[#007548]"
          >
            <Plus size={16} />
            <span>ফি আদায়</span>
          </button>
        </header>

        {/* বডি স্ক্রল */}
        <main className="flex-1 overflow-y-auto overscroll-contain no-scrollbar p-4 space-y-3.5">

          {/* টাইমস্কোপ ফিল্টার */}
          <div className="flex items-center justify-between rounded-2xl bg-[#E8F4EE] p-1 border border-[#CCE8DA]">
            <button
              type="button"
              onClick={() => setTimeScope('current_month')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                timeScope === 'current_month'
                  ? 'bg-[#008955] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={13} />
              <span>চলতি মাসের হিসাব</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeScope('all_time')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                timeScope === 'all_time'
                  ? 'bg-[#008955] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>জানুয়ারি হতে আজ পর্যন্ত</span>
            </button>
          </div>

          {/* আদায় ও বকেয়া কার্ড মেট্রিক */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setViewFilter('paid')}
              className={`bg-white rounded-2xl p-3 flex flex-col justify-between h-[116px] border cursor-pointer transition active:scale-95 shadow-2xs ${
                viewFilter === 'paid' ? 'border-[#008955] ring-2 ring-[#008955]/20' : 'border-[#E1EDE6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">
                  {timeScope === 'current_month' ? 'চলতি মাসে আদায়' : 'মোট আদায়কৃত ফি'}
                </span>
                <span className="p-1 rounded-lg bg-[#E7F6ED] text-[#008955]">
                  <CircleDollarSign size={14} />
                </span>
              </div>
              <div>
                <p className="text-xl font-black text-[#008955] font-sans tracking-tight leading-none">
                  ৳ {metrics.paidTotalAmount.toLocaleString('en-US')}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  পরিশোধ: <span className="text-[#008955] font-sans font-black">{metrics.paidCount} জন</span>
                </p>
              </div>
            </div>

            <div
              onClick={() => setViewFilter('due')}
              className={`bg-white rounded-2xl p-3 flex flex-col justify-between h-[116px] border cursor-pointer transition active:scale-95 shadow-2xs ${
                viewFilter === 'due' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-[#E1EDE6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">
                  {timeScope === 'current_month' ? 'চলতি মাসে বকেয়া' : 'মোট বকেয়া ফি'}
                </span>
                <span className="p-1 rounded-lg bg-rose-50 text-rose-600">
                  <AlertCircle size={14} />
                </span>
              </div>
              <div>
                <p className="text-xl font-black text-rose-600 font-sans tracking-tight leading-none">
                  ৳ {metrics.dueTotalAmount.toLocaleString('en-US')}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  বকেয়া: <span className="text-rose-600 font-sans font-black">{metrics.dueCount} জন</span>
                </p>
              </div>
            </div>
          </div>

          {/* ট্যাব সুইচ */}
          <div className="flex rounded-2xl bg-white p-1 border border-[#D9E7E0] shadow-2xs">
            <button
              type="button"
              onClick={() => setViewFilter('paid')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                viewFilter === 'paid'
                  ? 'bg-[#008955] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>পরিশোধিত তালিকা ({metrics.paidCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('due')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                viewFilter === 'due'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <AlertCircle size={13} />
              <span>বকেয়া তালিকা ({metrics.dueCount})</span>
            </button>
          </div>

          {/* সার্চ ও শ্রেণি ফিল্টার */}
          <div className="space-y-2.5">
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder={`${selectedClass === 'সব' ? 'নাম, রোল বা মোবাইল' : selectedClass + ' শ্রেণির ছাত্র'} দিয়ে খুঁজুন...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#D9E7E0] rounded-2xl text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#008955] focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {classList.map((cls) => {
                const isSelected = selectedClass === cls;
                const dueCount = dueCountByClass[cls] || 0;

                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`min-w-[75px] py-1 px-3 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[#008955] text-white shadow-xs'
                        : 'bg-white text-[#4B5563] border border-[#E1EDE6] hover:bg-[#EDF4F0]'
                    }`}
                  >
                    <span>{cls}</span>
                    {dueCount > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-full font-sans ${
                          isSelected ? 'bg-white text-[#008955]' : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {dueCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* শিক্ষার্থী তালিকা */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-slate-700">
                {viewFilter === 'paid' ? 'পরিশোধিত শিক্ষার্থীদের তালিকা' : 'বকেয়া ফি সহ শিক্ষার্থীদের তালিকা'}
              </h2>
              <span className="text-[10px] text-slate-400 font-sans font-medium">
                {displayedStudents.length} জন
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-[#008955] border-t-transparent"></div>
                <p className="mt-2 text-xs font-medium text-slate-400">ডাটা লোড হচ্ছে...</p>
              </div>
            ) : displayedStudents.length > 0 ? (
              displayedStudents.map((std) => {
                const dueInfo = studentsDueSummary.get(std.id);

                return (
                  <div
                    key={std.id}
                    onClick={() => dueInfo && setSelectedStudentHistory(dueInfo)}
                    className={`group relative bg-white rounded-2xl p-3 flex items-center justify-between shadow-2xs hover:shadow-xs active:scale-[0.99] transition cursor-pointer border ${
                      viewFilter === 'due' ? 'border-rose-100' : 'border-[#E1EDE6]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="h-12 w-12 rounded-2xl rounded-tr-3xl rounded-bl-3xl bg-gradient-to-tr from-[#E7F6ED] to-[#FEF3C7] border border-[#D9E7E0] overflow-hidden flex items-center justify-center text-[#008955] shadow-2xs">
                          {std.photoUrl ? (
                            <img
                              src={std.photoUrl}
                              alt="Student"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User size={22} className="text-[#008955]/70" />
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-[#008955] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md border border-white font-sans">
                          {std.rollNo || '০'}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                            {std.fullNameBangla || std.fullName}
                          </h4>
                          <span className="text-[9px] font-bold text-[#008955] bg-[#E7F6ED] px-1.5 py-0.2 rounded border border-[#CDE9DC] shrink-0">
                            {std.className || 'সাধারণ'}
                          </span>
                        </div>

                        {/* বকেয়া মাসের সতর্কবার্তা */}
                        {dueInfo && dueInfo.totalDueMonths > 0 ? (
                          <p className="text-[9px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle size={10} />
                            <span>{dueInfo.totalDueMonths} মাসের বেতন বাকি ({dueInfo.firstUnpaidMonthLabel})</span>
                          </p>
                        ) : (
                          <p className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={10} />
                            <span>সব মাসের বেতন পরিশোধিত</span>
                          </p>
                        )}

                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          পিতা: {std.fatherName || 'তথ্য নেই'} • রেট: ৳{std.monthlyFee || 0}
                        </p>
                      </div>
                    </div>

                    {/* ডান পাশ: টাকার অংক ও আদায় বাটন */}
                    <div className="text-right shrink-0">
                      {viewFilter === 'paid' ? (
                        <div>
                          <span className="text-sm font-black text-[#008955] font-sans block">
                            ৳ {(timeScope === 'current_month' ? std.monthlyFee : dueInfo?.totalPaidAmount || 0).toLocaleString('en-US')}
                          </span>
                          <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            পরিশোধিত
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm font-black text-rose-600 font-sans block">
                            বকেয়া: ৳ {(timeScope === 'current_month' ? std.monthlyFee : dueInfo?.totalDueAmount || 0).toLocaleString('en-US')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreselectedStudent(std);
                              setSelectedModalMonth(dueInfo?.firstUnpaidMonthLabel);
                              setIsModalOpen(true);
                            }}
                            className="mt-1 inline-flex items-center gap-1 rounded-xl bg-[#008955] px-2.5 py-1 text-[10px] font-bold text-white shadow-xs active:scale-95 transition hover:bg-[#007548]"
                          >
                            <Plus size={11} />
                            <span>আদায়</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-[#DFECE5] bg-white p-8 text-center shadow-2xs">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7F6ED] text-[#008955]">
                  <Receipt size={24} />
                </div>
                <h3 className="mt-2.5 text-xs font-bold text-slate-700">
                  {viewFilter === 'paid' ? 'কোনো আদায়ের রেকর্ড নেই' : 'কোনো বকেয়া শিক্ষার্থী নেই! আলহামদুলিল্লাহ'}
                </h3>
              </div>
            )}
          </div>

        </main>

        {/* ৭. শিক্ষার্থীর লেজার ও ১২ মাসের স্ট্যাটাস পপআপ */}
        {selectedStudentHistory && (
          <div
            onClick={() => setSelectedStudentHistory(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 font-hind animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[360px] max-h-[85vh] rounded-3xl bg-white p-4 shadow-2xl overflow-y-auto flex flex-col no-scrollbar border border-slate-200"
            >
              {/* পপআপ হেডার */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <History size={15} className="text-[#008955]" />
                  <span className="text-xs font-bold text-[#008955]">শিক্ষার্থীর ফি লেজার ও বিবরণ</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentHistory(null)}
                  className="h-7 w-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* সংক্ষিপ্ত তথ্য */}
              <div className="flex items-center gap-3 py-2.5 border-b border-slate-100">
                <div className="h-11 w-11 rounded-2xl bg-[#E7F6ED] flex items-center justify-center text-[#008955] font-bold text-sm">
                  {selectedStudentHistory.student.fullNameBangla?.charAt(0) || 'ছা'}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">
                    {selectedStudentHistory.student.fullNameBangla || selectedStudentHistory.student.fullName}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    রোল: {selectedStudentHistory.student.rollNo} • {selectedStudentHistory.student.className} শ্রেণি
                  </p>
                  <p className="text-[10px] text-[#008955] font-bold">
                    মাসিক বেতন রেট: ৳ {selectedStudentHistory.student.monthlyFee || 0}
                  </p>
                </div>
              </div>

              {/* ফি আদায় বাটন */}
              <button
                type="button"
                onClick={() => {
                  setPreselectedStudent(selectedStudentHistory.student);
                  setSelectedModalMonth(selectedStudentHistory.firstUnpaidMonthLabel);
                  setSelectedStudentHistory(null);
                  setIsModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#008955] hover:bg-[#007347] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer my-2 shrink-0"
              >
                <Receipt size={16} />
                <span>ফি আদায় করুন (Collect Fee)</span>
              </button>

              {/* মোট হিসাব বক্স */}
              <div className="mb-2.5 grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 block">মোট পরিশোধ</span>
                  <span className="text-sm font-black text-[#008955] font-sans">
                    ৳ {selectedStudentHistory.totalPaidAmount.toLocaleString('en-US')}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-center">
                  <span className="text-[10px] font-bold text-rose-800 block">মোট বাকি</span>
                  <span className="text-sm font-black text-rose-600 font-sans">
                    ৳ {selectedStudentHistory.totalDueAmount.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* চলতি বছরের মাসসমূহের স্ট্যাটাস গ্রিড (পরিশোধিত হলে গ্রিন, বকেয়া হলে রেড) */}
              <div className="mb-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1 mb-2">
                  <Layers size={13} className="text-[#008955]" />
                  <span>চলতি বছরের মাসভিত্তিক বেতন অবস্থা:</span>
                </span>

                <div className="grid grid-cols-2 gap-1.5">
                  {selectedStudentHistory.runningMonths.map((m) => (
                    <div
                      key={m.key}
                      className={`flex items-center justify-between p-1.5 rounded-xl border text-[10px] font-bold ${
                        m.isPaid
                          ? 'bg-[#E7F6ED] text-[#008955] border-[#BBE3D3]'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}
                    >
                      <span>{m.label.split(' ')[0]}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] ${m.isPaid ? 'bg-[#008955] text-white' : 'bg-rose-600 text-white'}`}>
                        {m.isPaid ? 'পরিশোধিত' : 'বকেয়া'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* জমার ইতিহাস */}
              <span className="text-[10px] font-bold text-slate-500 mb-1 px-1">জমার ট্রানজ্যাকশন হিস্ট্রি:</span>
              <div className="max-h-[140px] overflow-y-auto no-scrollbar space-y-1.5">
                {selectedStudentHistory.payments.length > 0 ? (
                  selectedStudentHistory.payments.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl border border-slate-100 bg-[#F7FBF9] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">
                          {item.month || 'মাসিক বেতন'}
                        </p>
                        <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                          {item.paymentDate} • {item.paymentMethod === 'cash' ? 'নগদ' : item.paymentMethod}
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#008955] font-sans">
                        +৳ {item.amount?.toLocaleString('en-US')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-2 text-xs text-slate-400">কোনো জমার রেকর্ড পাওয়া যায়নি</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ফি কালেকশন মোডাল */}
        <FeeCollectionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setPreselectedStudent(null);
            setSelectedModalMonth(undefined);
          }}
          student={preselectedStudent}
          studentsList={studentsList}
          initialMonth={selectedModalMonth}
          onSavePayment={handleSavePayment}
        />

        <AdminBottomNav />
      </div>
    </div>
  );
}