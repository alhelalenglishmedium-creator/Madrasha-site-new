'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BookOpen, User, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toBengaliNumber } from '@/lib/prayerCalculator';

interface RoutinePeriod {
  id?: string;
  className: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  roomNo?: string;
  periodName?: string;
  cw?: string;
  hw?: string;
  dueDate?: string;
}

interface StudentRoutineProps {
  classNameProp?: string;
}

export function StudentRoutine({ classNameProp = 'হিফজুল কুরআন' }: StudentRoutineProps) {
  const [routines, setRoutines] = useState<RoutinePeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<string>('আজকের দিন');

  const daysList = ['আজকের দিন', 'প্রতিদিন', 'শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার'];

  useEffect(() => {
    const fetchClassRoutine = async () => {
      try {
        setLoading(true);

        // Supabase-এর class_routines টেবিল থেকে শিক্ষার্থীর ক্লাস অনুযায়ী ডাটা কোয়েরি
        const { data, error } = await supabase
          .from('class_routines')
          .select('*')
          .or(`class_name.eq.${classNameProp},class_name.ilike.%${classNameProp}%`);

        let rawList: any[] = [];
        if (!error && data && data.length > 0) {
          rawList = data;
        } else {
          const cached = localStorage.getItem(`madrasa_routine_${classNameProp}`) ||
                         localStorage.getItem(`school_class_diary_${classNameProp}`);
          if (cached) {
            try {
              rawList = JSON.parse(cached);
            } catch (e) {}
          }
        }

        const formatted: RoutinePeriod[] = rawList.map((item: any) => {
          let periodName = item.period || '';
          let cw = item.cw || '';
          let hw = item.hw || '';
          let dueDate = item.dueDate || '';
          let roomNo = item.room_no || item.room || '';

          if (item.room_no && typeof item.room_no === 'string' && item.room_no.startsWith('{')) {
            try {
              const meta = JSON.parse(item.room_no);
              periodName = meta.period || periodName;
              cw = meta.cw || cw;
              hw = meta.hw || hw;
              dueDate = meta.dueDate || dueDate;
              roomNo = meta.room || '';
            } catch (e) {}
          }

          return {
            id: item.id,
            className: item.class_name || classNameProp,
            day: item.day || 'প্রতিদিন',
            startTime: item.start_time || item.startTime || '',
            endTime: item.end_time || item.endTime || '',
            subjectName: item.subject_name || item.subjectName || item.subject || 'সাধারণ বিষয়',
            teacherName: item.teacher_name || item.teacherName || item.teacher || 'শিক্ষক নির্ধারণ করা হয়নি',
            roomNo,
            periodName,
            cw,
            hw,
            dueDate,
          };
        });

        setRoutines(formatted);
      } catch (err) {
        console.warn('রুটিন লোড ত্রুটি:', err);
        setRoutines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassRoutine();
  }, [classNameProp]);

  // ফিল্টার করা পিরিয়ড তালিকা
  const displayRoutines = routines.filter((r) => {
    if (selectedDay === 'আজকের দিন') return true;
    return r.day === selectedDay;
  });

  return (
    <div className="space-y-3 font-['Noto_Sans_Bengali',sans-serif]">
      {/* দিনের ফিল্টার বাটন */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {daysList.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition ${
              selectedDay === day
                ? 'bg-[#008955] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* কনটেন্ট তালিকা */}
      {loading ? (
        <div className="py-12 text-center space-y-2">
          <Loader2 size={24} className="animate-spin text-[#008955] mx-auto" />
          <p className="text-xs text-slate-400">ক্লাস রুটিন যাচাই করা হচ্ছে...</p>
        </div>
      ) : displayRoutines.length > 0 ? (
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto no-scrollbar pr-0.5">
          {displayRoutines.map((period, idx) => (
            <div
              key={period.id || idx}
              className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs hover:border-emerald-200 transition space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {period.periodName && (
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-[#1E3A8A] text-white font-sans shrink-0">
                      {period.periodName}
                    </span>
                  )}
                  <span className="font-sans font-bold text-[10.5px] text-[#008955] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-xl shrink-0">
                    {toBengaliNumber(period.startTime)} - {toBengaliNumber(period.endTime)}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {period.subjectName}
                  </h4>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <User size={11} className="text-slate-400" />
                <span>শিক্ষক: <strong className="text-slate-700">{period.teacherName}</strong></span>
                {period.roomNo && (
                  <>
                    <span>•</span>
                    <span>কক্ষ: {toBengaliNumber(period.roomNo)}</span>
                  </>
                )}
              </p>

              {(period.cw || period.hw) && (
                <div className="pt-1.5 border-t border-slate-100 text-[10px] space-y-1">
                  {period.cw && (
                    <div className="text-slate-600 flex items-start gap-1">
                      <span className="font-bold text-blue-700 bg-blue-50 px-1 rounded text-[9px] shrink-0 font-sans">C.W.</span>
                      <span>{period.cw}</span>
                    </div>
                  )}
                  {period.hw && (
                    <div className="text-slate-800 font-medium flex items-start gap-1">
                      <span className="font-bold text-amber-800 bg-amber-100 px-1 rounded text-[9px] shrink-0 font-sans">H.W.</span>
                      <span>{period.hw}</span>
                      {period.dueDate && <span className="text-[9px] text-slate-400 ml-auto font-sans">(জমা: {period.dueDate})</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* অ্যাডমিন থেকে রুটিন না দেওয়া থাকলে ফাঁকা স্টেট */
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">কোনো ক্লাস রুটিন যুক্ত করা হয়নি</h4>
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-0.5 leading-relaxed">
              অ্যাডমিন প্যানেল থেকে <span className="font-bold text-slate-700">{classNameProp}</span> বিভাগের জন্য রুটিন আপলোড করা হলে এখানে প্রদর্শিত হবে।
            </p>
          </div>
        </div>
      )}
    </div>
  );
}