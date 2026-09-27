'use client';

import React, { useState, useEffect } from 'react';
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
  Circle,
  HelpCircle,
  ListTodo,
  TrendingUp,
  School,
  Sparkles,
} from 'lucide-react';
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

interface HomeworkTask {
  id: string;
  subject: string;
  task: string;
  dueDate: string;
  isDone: boolean;
  color: string;
  badgeColor: string;
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
  // ডিজিটাল ডায়েরি ও হোমওয়ার্ক স্টেট (লোকালস্টোরেজে সিঙ্কসহ)
  const [homeworkList, setHomeworkList] = useState<HomeworkTask[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`school_homework_${student.id || 'default'}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'hw_1',
        subject: 'English Language',
        task: 'Grammar Workbook Page 45: Exercise A & B complete',
        dueDate: 'আগামীকাল',
        isDone: false,
        color: 'border-l-blue-600 bg-blue-50/50',
        badgeColor: 'bg-blue-100 text-blue-800',
      },
      {
        id: 'hw_2',
        subject: 'Mathematics',
        task: 'Chapter 3: Fractions Exercise 3.2 (Sums 5 to 10 in C.W. copy)',
        dueDate: 'আগামীকাল',
        isDone: true,
        color: 'border-l-indigo-600 bg-indigo-50/50',
        badgeColor: 'bg-indigo-100 text-indigo-800',
      },
      {
        id: 'hw_3',
        subject: 'General Science',
        task: 'Draw & label the Parts of a Plant diagram in practical notebook',
        dueDate: 'মঙ্গলবারের মধ্যে',
        isDone: false,
        color: 'border-l-emerald-600 bg-emerald-50/50',
        badgeColor: 'bg-emerald-100 text-emerald-800',
      },
      {
        id: 'hw_4',
        subject: 'বাংলা সাহিত্য',
        task: 'কবিতা "আমাদের গ্রাম" মুখস্থ করে না দেখে লেখা',
        dueDate: 'বুধবার',
        isDone: false,
        color: 'border-l-amber-600 bg-amber-50/50',
        badgeColor: 'bg-amber-100 text-amber-800',
      },
    ];
  });

  const toggleTask = (id: string) => {
    const updated = homeworkList.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t));
    setHomeworkList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`school_homework_${student.id || 'default'}`, JSON.stringify(updated));
    }
  };

  const completedCount = homeworkList.filter((t) => t.isDone).length;

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

      {/* ================= ৩. আজকের লাইভ পিরিয়ড ও ক্লাস টাইমটেবিল ================= */}
      <div className="bg-white rounded-2xl border border-blue-100 p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                আজকের পিরিয়ড ও ক্লাস সময়সূচি
              </span>
              <span className="text-[9.5px] text-slate-400">রানিং ক্লাস ও সময় ট্র্যাকার</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRoutineOpen(true)}
            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            সম্পূর্ণ রুটিন
          </button>
        </div>

        {/* রানিং পিরিয়ড হাইলাইট কার্ড */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                চলমান পিরিয়ড • ২য় ঘণ্টা
              </span>
            </div>
            <h4 className="text-sm font-extrabold mt-0.5">Mathematics (গণিত)</h4>
            <p className="text-[10.5px] text-blue-100 font-medium">
              উস্তাদ কামরুল হাসান • রুম নম্বর ২০৪
            </p>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-xs border border-white/20 px-2.5 py-1.5 rounded-xl">
            <span className="text-xs font-mono font-bold block">১০:৪০ - ১১:২০</span>
            <span className="text-[9px] text-cyan-200 block">সকাল</span>
          </div>
        </div>

        {/* পরবর্তী পিরিয়ডগুলোর স্ন্যাপশট */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 block">৩য় পিরিয়ড (১১:২০ - ১২:০০)</span>
            <span className="font-bold text-slate-800 text-[11px] block mt-0.5">English Language</span>
            <span className="text-[9.5px] text-slate-500">উস্তাদ আব্দুর রহমান</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 block">৪র্থ পিরিয়ড (১২:০০ - ১২:৪০)</span>
            <span className="font-bold text-slate-800 text-[11px] block mt-0.5">General Science</span>
            <span className="text-[9.5px] text-slate-500">উস্তাদ মাহমুদুল হাসান</span>
          </div>
        </div>
      </div>

      {/* ================= ৪. ডিজিটাল ডায়েরি ও হোমওয়ার্ক ট্র্যাকার ================= */}
      <div className="bg-white rounded-2xl border border-blue-100 p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ListTodo size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">
                ডিজিটাল ডায়েরি ও হোমওয়ার্ক
              </h3>
              <p className="text-[9.5px] text-slate-500">
                সম্পন্ন: {completedCount}/{homeworkList.length} টি বিষয়
              </p>
            </div>
          </div>
          <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            আজকের ডায়েরি
          </span>
        </div>

        <div className="space-y-2">
          {homeworkList.map((hw) => (
            <div
              key={hw.id}
              onClick={() => toggleTask(hw.id)}
              className={`p-2.5 rounded-xl border border-slate-200/80 border-l-4 ${hw.color} flex items-start justify-between gap-2 cursor-pointer transition active:scale-[0.99] hover:shadow-2xs`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${hw.badgeColor}`}>
                    {hw.subject}
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans">• জমা: {hw.dueDate}</span>
                </div>
                <p className={`text-[11px] mt-1 leading-snug font-medium ${
                  hw.isDone ? 'line-through text-slate-400' : 'text-slate-800'
                }`}>
                  {hw.task}
                </p>
              </div>

              <button
                type="button"
                className={`h-6 w-6 rounded-lg flex items-center justify-center transition shrink-0 mt-0.5 ${
                  hw.isDone ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-300'
                }`}
              >
                <CheckCircle2 size={16} />
              </button>
            </div>
          ))}
        </div>
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
