'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  ChevronRight,
  Clock,
  BookOpen,
  Award,
  Receipt,
  CalendarDays,
  CalendarCheck,
  Megaphone,
  CheckCircle2,
  TrendingUp,
  School,
  Sparkles,
  User,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toBengaliNumber } from '@/lib/prayerCalculator';
import type { Student } from '@/types/database.types';
import type { Notice } from '@/components/admin/NoticeModal';

interface SchoolStudentHomeProps {
  student: Student;
  studentFormattedName: string;
  avatarImgError: boolean;
  setAvatarImgError: (err: boolean) => void;
  setPreviewImage: (prev: { url: string; title: string; subtitle?: string } | null) => void;
  setActiveTab: (tab: 'home' | 'fees' | 'results' | 'notices' | 'profile') => void;
  setIsRoutineOpen: (open: boolean) => void;
  latestNotice: Notice | null;
  attendanceRate: number;
  isFeePaidThisMonth: boolean;
}

export interface ClassPeriod {
  id: string;
  period: string; // যেমন: '১ম পিরিয়ড', '২য় পিরিয়ড'
  startTime: string; // যেমন: '09:00 AM'
  endTime: string; // যেমন: '09:40 AM'
  time: string; // যেমন: '০৯:০০ AM - ০৯:৪০ AM'
  subject: string;
  teacher: string; // যেমন: 'সুলতানা রাজিয়া ম্যাডাম'
  room?: string;
  color: string;
  badgeColor: string;
}

const COLOR_PALETTES = [
  { color: 'border-l-blue-600 bg-blue-50/50', badgeColor: 'bg-blue-100 text-blue-800' },
  { color: 'border-l-indigo-600 bg-indigo-50/50', badgeColor: 'bg-indigo-100 text-indigo-800' },
  { color: 'border-l-emerald-600 bg-emerald-50/50', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { color: 'border-l-amber-600 bg-amber-50/50', badgeColor: 'bg-amber-100 text-amber-800' },
  { color: 'border-l-purple-600 bg-purple-50/50', badgeColor: 'bg-purple-100 text-purple-800' },
  { color: 'border-l-rose-600 bg-rose-50/50', badgeColor: 'bg-rose-100 text-rose-800' },
];

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const eng = timeStr.replace(/[০-৯]/g, (d) => '0123456789'['০১২৩৪৫৬৭৮৯'.indexOf(d)]).trim().toLowerCase();
  const isPM = eng.includes('pm') || eng.includes('দুপুর') || eng.includes('বিকাল') || eng.includes('রাত');
  const isAM = eng.includes('am') || eng.includes('সকাল');
  const match = eng.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function SchoolStudentHome({
  student,
  studentFormattedName,
  avatarImgError,
  setAvatarImgError,
  setPreviewImage,
  setActiveTab,
  setIsRoutineOpen,
  latestNotice,
  attendanceRate,
  isFeePaidThisMonth,
}: SchoolStudentHomeProps) {
  // লাইভ ক্লাস পিরিয়ড ও রুটিন স্টেট
  const [periodList, setPeriodList] = useState<ClassPeriod[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // প্রতি ৩০ সেকেন্ড পর পর লাইভ ক্লক আপডেট হবে যাতে রানিং পিরিয়ড স্বয়ংক্রিয়ভাবে পরিবর্তিত হয়
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchRoutines = async () => {
    try {
      setIsLoadingRoutines(true);
      const studentClass = (student?.className || '').trim();
      const BENGALI_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      const todayBn = BENGALI_DAYS[new Date().getDay()];

      let records: any[] = [];

      // ১. সুপাবেস class_routines টেবিল থেকে ডাটা ফেচ
      try {
        let query = supabase.from('class_routines').select('*');
        if (studentClass) {
          query = query.or(`class_name.eq.${studentClass},class_name.ilike.%${studentClass}%`);
        }
        const { data, error } = await query.order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          records = data;
        }
      } catch (err) {
        console.warn('Class routine fetch error from Supabase:', err);
      }

      // ২. লোকালস্টোরেজ ক্যাশ ব্যাকআপ (অফলাইন বা তাত্ক্ষণিক আপডেটের জন্য)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`madrasa_routine_${studentClass}`) ||
                       localStorage.getItem(`school_class_diary_${studentClass}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (records.length === 0) {
                records = parsed;
              } else {
                const map = new Map<string, any>();
                [...parsed, ...records].forEach((item) => {
                  const key = String(item.id || item.subject_name || item.subject);
                  map.set(key, item);
                });
                records = Array.from(map.values());
              }
            }
          } catch (e) {}
        }
      }

      if (records.length === 0) {
        setPeriodList([]);
        return;
      }

      // ৩. আজকের বার অথবা 'প্রতিদিন' অনুযায়ী ফিল্টার
      let dayFiltered = records.filter(
        (r) => r.day === todayBn || r.day === 'প্রতিদিন'
      );
      if (dayFiltered.length === 0) {
        dayFiltered = records;
      }

      // ৪. ক্লাস পিরিয়ড অবজেক্টে রূপান্তর
      const mapped: ClassPeriod[] = dayFiltered.map((item, idx) => {
        let period = `${toBengaliNumber(idx + 1)}ম পিরিয়ড`;
        let room = '';

        if (item.room_no && typeof item.room_no === 'string' && item.room_no.startsWith('{')) {
          try {
            const parsed = JSON.parse(item.room_no);
            period = parsed.period || period;
            room = parsed.room || '';
          } catch (e) {}
        } else {
          period = item.period || `${toBengaliNumber(idx + 1)}ম পিরিয়ড`;
          room = item.room_no || item.room || '';
        }

        const startTime = item.start_time || item.startTime || '09:00 AM';
        const endTime = item.end_time || item.endTime || '09:40 AM';
        const palette = COLOR_PALETTES[idx % COLOR_PALETTES.length];

        return {
          id: String(item.id || `period_${idx}`),
          period,
          startTime,
          endTime,
          time: `${toBengaliNumber(startTime)} - ${toBengaliNumber(endTime)}`,
          subject: item.subject_name || item.subject || 'সাধারণ বিষয়',
          teacher: item.teacher_name || item.teacher || 'শিক্ষক নির্ধারণ করা হয়নি',
          room,
          color: palette.color,
          badgeColor: palette.badgeColor,
        };
      });

      setPeriodList(mapped);
    } catch (err) {
      console.warn('Failed to parse routine list:', err);
    } finally {
      setIsLoadingRoutines(false);
    }
  };

  useEffect(() => {
    fetchRoutines();

    const handleUpdate = () => {
      fetchRoutines();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('school_diary_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('school_diary_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [student?.id, student?.className]);

  // ৫. বর্তমান ক্লক সময় অনুযায়ী প্রতিটি পিরিয়ডের লাইভ স্ট্যাটাস নির্ণয়
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const periodsWithStatus = useMemo(() => {
    return periodList.map((p) => {
      const startM = parseTimeToMinutes(p.startTime);
      const endM = parseTimeToMinutes(p.endTime);
      let status: 'running' | 'upcoming' | 'completed' = 'upcoming';

      if (startM !== null && endM !== null) {
        if (currentMinutes >= startM && currentMinutes < endM) {
          status = 'running';
        } else if (currentMinutes >= endM) {
          status = 'completed';
        } else {
          status = 'upcoming';
        }
      }
      return { ...p, status, startM, endM };
    });
  }, [periodList, currentTime, currentMinutes]);

  const runningPeriod = periodsWithStatus.find((p) => p.status === 'running');
  const nextPeriod = periodsWithStatus.find((p) => p.status === 'upcoming');
  const allCompleted = periodsWithStatus.length > 0 && periodsWithStatus.every((p) => p.status === 'completed');

  return (
    <div className="space-y-3.5 pb-2 animate-in fade-in duration-200">
      {/* ================= ১. স্কুল স্টুডেন্ট ব্যানার ================= */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0B1329] via-[#1E3A8A] to-[#2563EB] p-4.5 text-white shadow-lg shadow-blue-950/30 border border-blue-400/20">
        <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-blue-400/25 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={() => {
                if (student.photoUrl) {
                  setPreviewImage({
                    url: student.photoUrl,
                    title: studentFormattedName,
                    subtitle: `ক্লাস: ${student.className} • রোল: ${student.rollNo} • Student ID: ${student.admissionNo}`,
                  });
                }
              }}
              className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md border border-cyan-300/40 flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition"
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
                student.fullNameBangla?.charAt(0) || student.fullName?.charAt(0) || 'S'
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-cyan-200 font-medium">Welcome Student</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8.5px] font-extrabold bg-gradient-to-r from-cyan-400 to-blue-300 text-blue-950 rounded-full shadow-xs">
                  <School className="w-2.5 h-2.5" /> আল হেলাল ইংলিশ মিডিয়াম
                </span>
              </div>

              <h2 className="text-[15px] font-bold text-white leading-normal truncate mt-0.5 tracking-wide">
                {studentFormattedName}
              </h2>

              <p className="text-[11px] text-blue-100 font-medium truncate mt-0.5">
                <span>ক্লাস: {student.className || 'Standard 4'}</span>
                <span className="mx-1.5 text-blue-300/60">•</span>
                <span>রোল: {student.rollNo || '০৫'}</span>
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

        <div className="relative z-10 mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-100 leading-relaxed">
          <span className="flex items-center gap-1.5 font-normal tracking-wide">
            <Calendar className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            শিক্ষাবর্ষ ২০২৬ • টার্ম ২ (Academic Term II)
          </span>
          <span className="font-bold bg-cyan-950/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-cyan-200 border border-cyan-400/20 text-[10px]">
            ইংলিশ ভার্সন
          </span>
        </div>
      </div>

      {/* ================= ২. জরুরি স্কুল নোটিশ / সার্কুলার ================= */}
      {latestNotice && (
        <div
          onClick={() => setActiveTab('notices')}
          className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50 border border-blue-200 rounded-2xl px-3 py-2 flex items-center justify-between cursor-pointer hover:shadow-xs transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-6 w-6 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Megaphone size={12} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-blue-950 truncate">
                {latestNotice.title}
              </p>
              <p className="text-[9px] text-blue-700 truncate font-sans">
                {latestNotice.date} • {latestNotice.targetAudienceLabel || 'স্কুল নোটিশ'}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-extrabold text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
            দেখুন
          </span>
        </div>
      )}

      {/* ================= ৩. রানিং ক্লাস ও আজকের পিরিয়ড রুটিন ================= */}
      <div className="bg-white rounded-2xl border border-blue-100 p-3.5 shadow-xs space-y-3">
        {/* হেডার */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Clock size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  রানিং ক্লাস ও পিরিয়ড রুটিন
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {student.className || 'শ্রেণি'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                লাইভ সময় অনুযায়ী চলমান পিরিয়ড ও শিক্ষক
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRoutineOpen(true)}
            className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/70 px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <span>পূর্ণাঙ্গ রুটিন</span>
            <ChevronRight size={12} />
          </button>
        </div>

        {/* লাইভ রানিং স্পটলাইট কার্ড */}
        {isLoadingRoutines ? (
          <div className="p-4 rounded-2xl bg-slate-100 animate-pulse space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-6 w-48 bg-slate-200 rounded" />
          </div>
        ) : periodList.length === 0 ? (
          <div className="p-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 text-center space-y-1.5">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <Clock size={20} />
            </div>
            <h4 className="text-xs font-bold text-slate-800">আজকের কোনো ক্লাস রুটিন যুক্ত করা হয়নি</h4>
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              অ্যাডমিন প্যানেল থেকে <strong className="text-blue-900">{student.className || 'শ্রেণি'}</strong>-এর ক্লাস রুটিন ও শিক্ষক/ম্যাডাম সেট করা হলে এখানে লাইভ প্রদর্শিত হবে।
            </p>
          </div>
        ) : runningPeriod ? (
          /* রানিং ক্লাস থাকলে স্পটলাইট কার্ড */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-indigo-700 text-white p-3.5 shadow-md shadow-blue-900/20 border border-blue-400/30">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300" />
                  </span>
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-cyan-200 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    চলমান ক্লাস • {runningPeriod.period}
                  </span>
                </div>

                <h3 className="text-base font-black text-white mt-1.5 tracking-tight truncate">
                  {runningPeriod.subject}
                </h3>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-blue-100 text-[11px]">
                  <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-lg backdrop-blur-xs font-medium">
                    <User size={12} className="text-cyan-300" />
                    <span>শিক্ষক/ম্যাডাম: <strong className="text-white font-bold">{runningPeriod.teacher}</strong></span>
                  </span>
                  {runningPeriod.room && (
                    <span className="bg-white/15 px-2 py-0.5 rounded-lg backdrop-blur-xs font-medium">
                      কক্ষ: {runningPeriod.room}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 bg-white/10 border border-white/20 backdrop-blur-xs px-2.5 py-1.5 rounded-xl">
                <span className="text-xs font-mono font-bold block text-white">{runningPeriod.time}</span>
                <span className="text-[9px] text-cyan-200 block font-medium">ক্লাস সময়সূচি</span>
              </div>
            </div>
          </div>
        ) : nextPeriod ? (
          /* রানিং ক্লাস না থাকলে কিন্তু পরবর্তী ক্লাস থাকলে */
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 border border-blue-200/80 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-[10px] font-extrabold text-blue-900 uppercase">
                  পরবর্তী ক্লাস • {nextPeriod.period}
                </span>
                <span className="text-[9.5px] font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                  {nextPeriod.time}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                {nextPeriod.subject}
              </h4>
              <p className="text-[10.5px] text-slate-600 flex items-center gap-1 mt-0.5">
                <User size={11} className="text-blue-600" />
                <span>শিক্ষক/ম্যাডাম: <strong>{nextPeriod.teacher}</strong></span>
                {nextPeriod.room && <span className="text-slate-400">• কক্ষ {nextPeriod.room}</span>}
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-xl shrink-0">
              অপেক্ষমাণ
            </span>
          </div>
        ) : allCompleted ? (
          /* আজকের সকল ক্লাস শেষ হয়ে থাকলে */
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">আজকের সকল ক্লাস সম্পন্ন হয়েছে / ছুটি</h4>
              <p className="text-[10px] text-emerald-700">আজকের জন্য নির্ধারিত সকল পিরিয়ড শেষ। পরবর্তী দিনের রুটিন দেখতে সম্পূর্ণ রুটিনে চাপ দিন।</p>
            </div>
          </div>
        ) : null}

        {/* আজকের সকল পিরিয়ডের তালিকা */}
        {periodList.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-semibold px-0.5">
              <span>আজকের সকল পিরিয়ড ({toBengaliNumber(periodList.length)} টি)</span>
              <span>শিক্ষক ও বিষয়</span>
            </div>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin">
              {periodsWithStatus.map((p) => {
                const isRunning = p.status === 'running';
                const isDone = p.status === 'completed';

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isRunning
                        ? 'bg-blue-50/90 border-blue-400 shadow-xs ring-1 ring-blue-300'
                        : isDone
                        ? 'bg-slate-50/70 border-slate-200/70 opacity-75'
                        : 'bg-white border-slate-200/80 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* পিরিয়ড ব্যাজ */}
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md shrink-0 font-sans ${
                            isRunning
                              ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                              : isDone
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-[#1E3A8A] text-white'
                          }`}
                        >
                          {p.period}
                        </span>

                        {/* বিষয় ও শিক্ষক */}
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate leading-snug ${
                              isRunning
                                ? 'text-blue-950 font-black'
                                : isDone
                                ? 'text-slate-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {p.subject}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <User size={10} className={isRunning ? 'text-blue-600' : 'text-slate-400'} />
                            <span>{p.teacher}</span>
                            {p.room && <span className="text-slate-400">• কক্ষ {p.room}</span>}
                          </p>
                        </div>
                      </div>

                      {/* সময় ও স্ট্যাটাস ব্যাজ */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono font-bold text-slate-600 block">
                          {p.time}
                        </span>
                        {isRunning ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                            চলমান
                          </span>
                        ) : isDone ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                            সম্পন্ন ✓
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                            অপেক্ষমাণ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= ৫. উপস্থিতি ও স্কুল টিউশন ফি ================= */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* হাজিরা বক্স */}
        <div className="bg-white rounded-2xl border border-blue-100 p-3 shadow-xs flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>ক্লাস উপস্থিতি</span>
            <div className="h-6 w-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold font-sans text-slate-900">{attendanceRate}%</span>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(attendanceRate, 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-medium text-slate-400 mt-1 block">
              {attendanceRate >= 80 ? 'নিয়মিত শিক্ষার্থী' : 'উপস্থিতি বৃদ্ধি প্রয়োজন'}
            </span>
          </div>
        </div>

        {/* স্কুল টিউশন ফি বক্স */}
        <div
          onClick={() => setActiveTab('fees')}
          className="bg-white rounded-2xl border border-blue-100 p-3 shadow-xs flex flex-col justify-between h-24 cursor-pointer hover:border-blue-500 transition active:scale-95"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>স্কুল টিউশন ফি</span>
            <div className="h-6 w-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-0.5">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${
                isFeePaidThisMonth ? 'text-blue-800 bg-blue-100' : 'text-rose-700 bg-rose-100'
              }`}
            >
              {isFeePaidThisMonth ? 'পরিশোধিত ✓' : 'বকেয়া চালান'}
            </span>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isFeePaidThisMonth ? 'bg-blue-600 w-full' : 'bg-rose-400 w-1/4'
                }`}
              />
            </div>
            <span className="text-[9px] font-medium text-slate-500 mt-1 block font-sans">
              ৳ {student.monthlyFee}
            </span>
          </div>
        </div>
      </div>

      {/* ================= ৬. স্কুল কুইক অ্যাকশন মেনু ================= */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            স্কুল সেবা ও মেনু
          </p>
          <span className="text-[10px] font-bold text-blue-600">কুইক সার্ভিস</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            {
              icon: CalendarDays,
              label: 'ক্লাস রুটিন',
              grad: 'from-blue-600 to-indigo-700',
              shadow: 'shadow-blue-600/20',
              action: () => setIsRoutineOpen(true),
            },
            {
              icon: Receipt,
              label: 'টিউশন ফি',
              grad: 'from-sky-500 to-blue-600',
              shadow: 'shadow-sky-500/20',
              action: () => setActiveTab('fees'),
            },
            {
              icon: Award,
              label: 'টার্ম রেজাল্ট',
              grad: 'from-indigo-600 to-purple-600',
              shadow: 'shadow-indigo-600/20',
              action: () => setActiveTab('results'),
            },
            {
              icon: GraduationCap,
              label: 'স্টুডেন্ট আইডি',
              grad: 'from-cyan-600 to-teal-600',
              shadow: 'shadow-cyan-600/20',
              action: () => setActiveTab('profile'),
            },
          ].map((btn, idx) => {
            const Icon = btn.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={btn.action}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-md group cursor-pointer"
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
