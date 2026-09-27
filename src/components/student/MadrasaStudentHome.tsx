'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  ChevronRight,
  Clock,
  BookmarkCheck,
  BookOpen,
  Award,
  Receipt,
  CalendarDays,
  CalendarCheck,
  Megaphone,
  CheckCircle2,
  Circle,
  HelpCircle,
} from 'lucide-react';
import type { Student } from '@/types/database.types';
import { formatCountdownBengali, type CalculatedPrayerData } from '@/lib/prayerCalculator';
import type { Notice } from '@/components/admin/NoticeModal';
import { supabase } from '@/lib/supabaseClient';
import { localDb } from '@/db/localDb';

interface MadrasaStudentHomeProps {
  student: Student;
  studentFormattedName: string;
  avatarImgError: boolean;
  setAvatarImgError: (err: boolean) => void;
  setPreviewImage: (prev: { url: string; title: string; subtitle?: string } | null) => void;
  setActiveTab: (tab: 'home' | 'fees' | 'results' | 'notices' | 'profile') => void;
  setIsRoutineOpen: (open: boolean) => void;
  setIsPrayerModalOpen: (open: boolean) => void;
  latestNotice: Notice | null;
  livePrayerData: CalculatedPrayerData;
  attendanceRate: number;
  isFeePaidThisMonth: boolean;
}

export function MadrasaStudentHome({
  student,
  studentFormattedName,
  avatarImgError,
  setAvatarImgError,
  setPreviewImage,
  setActiveTab,
  setIsRoutineOpen,
  setIsPrayerModalOpen,
  latestNotice,
  livePrayerData,
  attendanceRate,
  isFeePaidThisMonth,
}: MadrasaStudentHomeProps) {
  // সবক রেকর্ড স্টেট
  const [latestSabak, setLatestSabak] = useState<{
    newSabak: string;
    sabki: string;
    satpara: string;
    grade: string;
    date: string;
  } | null>(null);

  // ৩০ পারা হিফজ অগ্রগতি স্টেট (ডিফল্ট বা সংরক্ষিত ডাটা)
  const [completedParasCount, setCompletedParasCount] = useState<number>(12); // উদাহারণস্বরূপ ১২ পারা
  const [showParaGrid, setShowParaGrid] = useState<boolean>(false);

  useEffect(() => {
    const fetchSabak = async () => {
      try {
        const candidateIds = Array.from(
          new Set(
            [
              String(student.id || '').trim(),
              String(student.admissionNo || '').trim(),
              String((student as any).identifier || '').trim(),
              String(student.rollNo || '').trim(),
            ].filter(Boolean)
          )
        );

        // ১. Supabase থেকে
        const { data, error } = await supabase
          .from('sabak_records')
          .select('*')
          .in('student_id', candidateIds)
          .order('date', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const r = data[0];
          setLatestSabak({
            newSabak: r.new_sabak || r.newSabak || 'পারা ১৬ • পৃষ্ঠা ৩০৫',
            sabki: r.sabki || 'পারা ১৫ সম্পূর্ণ',
            satpara: r.satpara || 'পারা ১ থেকে ৩',
            grade: r.grade || 'মুমতায',
            date: r.date,
          });
          return;
        }

        // ২. লোকাল Dexie
        if (localDb.sabakRecords) {
          const localRecords = await localDb.sabakRecords.toArray();
          const matched = localRecords
            .filter((s: any) => candidateIds.includes(String(s.studentId).trim()))
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (matched.length > 0) {
            const r = matched[0];
            setLatestSabak({
              newSabak: r.newSabak || 'পারা ১৬ • পৃষ্ঠা ৩০৫',
              sabki: r.sabki || 'পারা ১৫ সম্পূর্ণ',
              satpara: r.satpara || 'পারা ১ থেকে ৩',
              grade: r.grade || 'মুমতায',
              date: r.date,
            });
            return;
          }
        }

        // ফলব্যাক ডিফল্ট মাদ্রাসা সবক
        setLatestSabak({
          newSabak: 'পারা ১৬ • পৃষ্ঠা ৩০৫ (সূরা মারইয়াম)',
          sabki: 'পারা ১৫ সম্পূর্ণ অংশ শুনানী',
          satpara: 'পারা ১ থেকে পারা ৩ পর্যন্ত দোহর',
          grade: 'মুমতায (উত্তম)',
          date: new Date().toISOString().split('T')[0],
        });
      } catch (e) {}
    };

    fetchSabak();
  }, [student]);

  // ৩০ পারার তালিকা
  const totalParas = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-3.5 pb-2 animate-in fade-in duration-200">
      {/* ================= ১. মাদ্রাসা স্টুডেন্ট ব্যানার ================= */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#0D9488] p-4.5 text-white shadow-lg shadow-emerald-900/25 border border-emerald-500/20">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-400/25 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-teal-300/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={() => {
                if (student.photoUrl) {
                  setPreviewImage({
                    url: student.photoUrl,
                    title: studentFormattedName,
                    subtitle: `জামাত: ${student.className} • রোল: ${student.rollNo} • UID: ${student.admissionNo}`,
                  });
                }
              }}
              className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition"
              title="ছবি সম্পূর্ণ দেখতে ক্লিক করুন"
            >
              {student.photoUrl && !avatarImgError ? (
                <img
                  src={student.photoUrl}
                  alt={studentFormattedName}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={() => setAvatarImgError(true)}
                />
              ) : (
                student.fullNameBangla?.replace(/^মুহাম্মাদ\s+/i, '').replace(/^মোহাম্মদ\s+/i, '').charAt(0) || 'আ'
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-100 font-normal">আসসালামু আলাইকুম</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 rounded-full shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" /> তালিবুল ইলম (কওমি শাখা)
                </span>
              </div>

              <h2 className="text-[15px] font-bold text-white leading-normal truncate mt-0.5 tracking-wide">
                {studentFormattedName}
              </h2>

              <p className="text-[11px] text-emerald-100/95 font-medium truncate mt-0.5">
                <span>জামাত: {student.className || 'হিফজুল কুরআন'}</span>
                <span className="mx-1.5 text-emerald-300/60">•</span>
                <span>রোল: {student.rollNo || '০১'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="h-8.5 w-8.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-2xs cursor-pointer"
            title="প্রোফাইল দেখুন"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-50 leading-relaxed">
          <span className="flex items-center gap-1.5 font-normal tracking-wide">
            <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            ১৫ রবিউস সানি, ১৪৪৮ হিজরি
          </span>
          <span className="font-bold bg-black/25 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/10 text-[10px]">
            শিক্ষাবর্ষ: ২০২৬
          </span>
        </div>
      </div>

      {/* ================= ২. জরুরি নোটিশ বার ================= */}
      {latestNotice && (
        <div
          onClick={() => setActiveTab('notices')}
          className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-200 rounded-2xl px-3 py-2 flex items-center justify-between cursor-pointer hover:shadow-xs transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-6 w-6 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Megaphone size={12} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-amber-950 truncate">
                {latestNotice.title}
              </p>
              <p className="text-[9px] text-amber-700 truncate font-sans">
                {latestNotice.date} • {latestNotice.targetAudienceLabel || 'জরুরি নোটিশ'}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
            দেখুন
          </span>
        </div>
      )}

      {/* ================= ৩. ওয়াক্ত ও সালাত ট্র্যাকার ================= */}
      <div
        onClick={() => setIsPrayerModalOpen(true)}
        className="bg-white rounded-2xl border border-emerald-100 p-2.5 flex items-center justify-between shadow-xs cursor-pointer hover:border-emerald-300 transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-900 leading-normal">
                চলমান ওয়াক্ত: {livePrayerData.currentPrayer}
              </p>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
              পরবর্তী: {livePrayerData.nextPrayer} • বাকি {formatCountdownBengali(livePrayerData.remainingSeconds)}
            </p>
          </div>
        </div>

        <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
          সময়সূচি
        </span>
      </div>

      {/* ================= ৪. দৈনিক সবক ও পড়া ট্র্যাকার কার্ড ================= */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-[#008955] flex items-center justify-center">
              <BookmarkCheck size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                আজকের নির্ধারিত সবক ও পড়া
              </span>
              <span className="text-[9.5px] text-slate-400">হিফজ ও কিতাব বিভাগ</span>
            </div>
          </div>
          <span className="text-[9.5px] font-extrabold bg-[#C89B3C]/15 text-[#C89B3C] border border-[#C89B3C]/30 px-2 py-0.5 rounded-md">
            {latestSabak?.grade || 'মুমতায'}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* নতুন সবক */}
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-bold text-emerald-950">১. নতুন সবক (আজকের পাঠ)</p>
              <p className="text-[11px] font-medium text-emerald-800 mt-0.5">
                {latestSabak?.newSabak || 'পারা ১৬ • পৃষ্ঠা ৩০৫'}
              </p>
            </div>
            <span className="text-[9.5px] font-bold text-[#008955] bg-white border border-emerald-200 px-2 py-0.5 rounded-lg shadow-2xs">
              নতুন পাঠ
            </span>
          </div>

          {/* সবকি */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-bold text-slate-800">২. সাত সবকি (নিকটবর্তী রিভিশন)</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {latestSabak?.sabki || 'পারা ১৫ সম্পূর্ণ অংশ শুনানী'}
              </p>
            </div>
            <span className="text-[9.5px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
              রিভিশন
            </span>
          </div>

          {/* সাতপারা */}
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-bold text-amber-950">৩. সাতপারা / আমপারা দোহর</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {latestSabak?.satpara || 'পারা ১ থেকে পারা ৩ পর্যন্ত দোহর'}
              </p>
            </div>
            <span className="text-[9.5px] font-bold text-amber-700 bg-white border border-amber-200 px-2 py-0.5 rounded-lg">
              দোহর
            </span>
          </div>
        </div>
      </div>

      {/* ================= ৫. ৩০ পারা হিফজ অগ্রগতি মানচিত্র (30-Para Quran Map) ================= */}
      <div className="bg-gradient-to-br from-white to-[#F7FBF9] rounded-2xl border border-emerald-100 p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">
                ৩০ পারা হিফজ অগ্রগতি মানচিত্র
              </h3>
              <p className="text-[9.5px] text-slate-500">
                সম্পন্ন: {completedParasCount} পারা • বাকি: {30 - completedParasCount} পারা ({Math.round((completedParasCount / 30) * 100)}%)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowParaGrid(!showParaGrid)}
            className="text-[10px] font-bold text-[#008955] hover:underline cursor-pointer"
          >
            {showParaGrid ? 'সংক্ষিপ্ত' : 'সম্পূর্ণ ৩০ পারা'}
          </button>
        </div>

        {/* প্রগ্রেস বার */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#008955] via-teal-500 to-[#C89B3C] transition-all duration-500"
            style={{ width: `${(completedParasCount / 30) * 100}%` }}
          />
        </div>

        {/* ৩০ পারা ভিজ্যুয়াল গ্রিড */}
        {showParaGrid && (
          <div className="grid grid-cols-6 gap-1.5 pt-1.5 animate-in fade-in duration-200">
            {totalParas.map((paraNum) => {
              const isCompleted = paraNum <= completedParasCount;
              const isCurrent = paraNum === completedParasCount + 1;

              return (
                <div
                  key={paraNum}
                  className={`p-1.5 rounded-xl text-center border text-[10px] font-sans font-bold transition ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : isCurrent
                      ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/50 animate-pulse'
                      : 'bg-slate-50 text-slate-400 border-slate-200/80'
                  }`}
                  title={`পারা ${paraNum}: ${isCompleted ? 'সম্পন্ন' : isCurrent ? 'চলতি সবক' : 'বাকি আছে'}`}
                >
                  <span className="block text-[8px] opacity-75">পারা</span>
                  <span className="text-[11px] leading-none">{paraNum}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= ৬. হাজিরা ও মাসিক খোরাকি স্ট্যাটাস ================= */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* হাজিরা বক্স */}
        <div className="bg-white rounded-2xl border border-emerald-100/90 p-3 shadow-xs flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>মাদ্রাসার উপস্থিতি</span>
            <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold font-sans text-slate-900">{attendanceRate}%</span>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(attendanceRate, 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-medium text-slate-400 mt-1 block">
              {attendanceRate >= 80 ? 'মাশাআল্লাহ সন্তোষজনক' : 'নিয়মিত উপস্থিতি কাম্য'}
            </span>
          </div>
        </div>

        {/* খোরাকি ও মাসিক ফি বক্স */}
        <div
          onClick={() => setActiveTab('fees')}
          className="bg-white rounded-2xl border border-emerald-100/90 p-3 shadow-xs flex flex-col justify-between h-24 cursor-pointer hover:border-[#008955] transition active:scale-95"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>মাসিক খোরাকি / ফি</span>
            <div className="h-6 w-6 rounded-lg bg-emerald-50 text-[#008955] flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-0.5">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${
                isFeePaidThisMonth ? 'text-emerald-800 bg-emerald-100' : 'text-rose-700 bg-rose-100'
              }`}
            >
              {isFeePaidThisMonth ? 'পরিশোধিত ✓' : 'বকেয়া রয়েছে'}
            </span>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isFeePaidThisMonth ? 'bg-emerald-600 w-full' : 'bg-rose-400 w-1/4'
                }`}
              />
            </div>
            <span className="text-[9px] font-medium text-slate-500 mt-1 block font-sans">
              ৳ {student.monthlyFee}
            </span>
          </div>
        </div>
      </div>

      {/* ================= ৭. মাদ্রাসা কুইক মেনু ================= */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            মাদ্রাসা সেবা ও মেনু
          </p>
          <span className="text-[10px] font-bold text-[#008955]">কুইক অ্যাকশন</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            {
              icon: BookOpen,
              label: 'সবক ও রুটিন',
              grad: 'from-emerald-600 to-teal-700',
              shadow: 'shadow-emerald-600/20',
              action: () => setIsRoutineOpen(true),
            },
            {
              icon: Receipt,
              label: 'খোরাকি ও রসিদ',
              grad: 'from-[#008955] to-emerald-700',
              shadow: 'shadow-[#008955]/20',
              action: () => setActiveTab('fees'),
            },
            {
              icon: Award,
              label: 'মাদ্রাসার ফল',
              grad: 'from-amber-500 to-orange-500',
              shadow: 'shadow-amber-500/20',
              action: () => setActiveTab('results'),
            },
            {
              icon: Clock,
              label: 'নামাজের সময়',
              grad: 'from-teal-600 to-cyan-700',
              shadow: 'shadow-teal-600/20',
              action: () => setIsPrayerModalOpen(true),
            },
          ].map((btn, idx) => {
            const Icon = btn.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={btn.action}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-md group cursor-pointer"
              >
                <div
                  className={`h-9 w-9 rounded-2xl bg-gradient-to-tr ${btn.grad} text-white flex items-center justify-center shadow-md ${btn.shadow} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <span className="mt-1.5 text-[10.5px] font-bold text-slate-800 text-center leading-tight">
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
