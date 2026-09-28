'use client';

import React, { useState, useEffect } from 'react';
import { BookmarkCheck, BookOpen, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { StudentRoutine } from './StudentRoutine';
import { supabase } from '@/lib/supabaseClient';
import { localDb } from '@/db/localDb';
import type { Student } from '@/types/database.types';
import { isHifzStudent } from '../teacher/SabakEntryModal';
import { fetchLatestSabak, type SabakData } from '@/lib/sabakService';

interface StudentStudyViewProps {
  student: Student;
}

export const StudentStudyView: React.FC<StudentStudyViewProps> = ({ student }) => {
  const isHifz = isHifzStudent(student);
  const [latestSabak, setLatestSabak] = useState<SabakData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isHifz) {
      setLatestSabak(null);
      setLoading(false);
      return;
    }

    const loadSabak = async () => {
      try {
        setLoading(true);
        const data = await fetchLatestSabak(student);
        if (data) {
          setLatestSabak(data);
        }
      } catch (err) {
        console.error('সবক তথ্য লোড ত্রুটি:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSabak();

    // শিক্ষক বা এডমিন যেকোনো স্থান থেকে সবক পরিবর্তন করলে তাৎক্ষণিক অটো-সিঙ্ক
    const handleLiveSync = () => {
      loadSabak();
    };

    window.addEventListener('sabak_updated', handleLiveSync);
    window.addEventListener('storage', handleLiveSync);

    return () => {
      window.removeEventListener('sabak_updated', handleLiveSync);
      window.removeEventListener('storage', handleLiveSync);
    };
  }, [student, isHifz]);

  return (
    <div className="space-y-4">
      {/* দৈনিক সবক ও পাঠ্যসূচি হেডার */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
            {isHifz ? 'হিফজুল কুরআন দৈনিক পাঠ ও রুটিন' : 'দৈনিক ক্লাস রুটিন ও পাঠ্যসূচি'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            জামাত: <strong className="text-slate-700">{student.className}</strong>
            {student.section ? ` • শাখা-${student.section}` : ''}
          </p>
        </div>
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black shadow-2xs">
          শিক্ষাবর্ষ ২০২৬
        </span>
      </div>

      {/* হিফজ বিভাগ খাস: আজকের সবক বক্স (শুধুমাত্র হিফজ শিক্ষার্থীদের জন্য) */}
      {isHifz && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-[#008955]" />
              <span className="text-xs font-bold text-slate-900">সর্বশেষ নির্ধারিত সবক ও রিভিশন</span>
              <span className="text-[9px] bg-emerald-100 text-[#008955] font-bold px-1.5 py-0.5 rounded">
                হিফজ খাস
              </span>
            </div>
            {latestSabak && (
              <span className="text-[10px] bg-emerald-100/80 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Calendar size={11} />
                <span>{latestSabak.date}</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2 py-3 animate-pulse">
              <div className="h-10 bg-slate-100 rounded-2xl" />
              <div className="h-10 bg-slate-100 rounded-2xl" />
            </div>
          ) : latestSabak ? (
            <div className="space-y-2 text-xs">
              {/* ১. সবক */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-emerald-950">১. সবক (আজকের নতুন পাঠ)</p>
                  <p className="text-[11.5px] font-semibold text-emerald-800 mt-0.5">
                    {latestSabak.sabak || latestSabak.newSabak || 'কোনো পড়া নেই'}
                  </p>
                </div>
                <span className="font-bold text-[11px] text-[#008955] bg-white border border-emerald-200 px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
                  নতুন পাঠ
                </span>
              </div>

              {/* ২. সাত সবক */}
              {(latestSabak.saatSabak || latestSabak.sabki) && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">২. সাত সবক (চলতি রিভিশন)</p>
                    <p className="text-[11.5px] font-semibold text-slate-700 mt-0.5">
                      {latestSabak.saatSabak || latestSabak.sabki}
                    </p>
                  </div>
                  <span className="font-bold text-[11px] text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
                    চলতি রিভিশন
                  </span>
                </div>
              )}

              {/* ৩. আমুখতা */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-amber-950">৩. আমুখতা (পেছনের রিভিশন)</p>
                  <p className="text-[11.5px] font-semibold text-amber-900 mt-0.5">
                    {latestSabak.alMukhta || latestSabak.satpara || 'নির্ধারিত হয়নি'}
                  </p>
                </div>
                <span className="font-bold text-[11px] text-amber-700 bg-white border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
                  আমুখতা
                </span>
              </div>

              {/* ৪. সবিনা (সামগ্রিক শুনানী) */}
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-purple-950">৪. সবিনা (সামগ্রিক শুনানী)</p>
                  <p className="text-[11.5px] font-semibold text-purple-900 mt-0.5">
                    {latestSabak.sabina || 'নির্ধারিত হয়নি'}
                  </p>
                </div>
                <span className="font-bold text-[11px] text-purple-700 bg-white border border-purple-200 px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
                  সবিনা
                </span>
              </div>

              {/* মান ও মন্তব্য */}
              <div className="pt-1 flex items-center justify-between text-[11px] px-1 text-slate-500">
                <span>
                  মূল্যায়ন মান: <strong className="text-emerald-700 font-bold">{latestSabak.grade}</strong>
                </span>
                {latestSabak.remark && (
                  <span className="text-slate-600 truncate max-w-[180px]">
                    মন্তব্য: {latestSabak.remark}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
              <BookOpen className="w-5 h-5 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">আজকের কোনো সবক এন্ট্রি করা হয়নি</p>
              <p className="text-[10px] text-slate-400">উস্তাদজি সবক এন্ট্রি দিলে এখানে বিস্তারিত দেখা যাবে।</p>
            </div>
          )}
        </div>
      )}

      {/* পাঠ্যসূচি ও রুটিন কম্পোনেন্ট */}
      <StudentRoutine classNameProp={student.className} />
    </div>
  );
};