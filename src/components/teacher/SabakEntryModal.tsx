'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookOpen,
  Save,
  CheckCircle2,
  Award,
  Sparkles,
  AlertCircle,
  BookmarkCheck,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import type { Student } from '@/types/database.types';
import { localDb } from '@/db/localDb';
import { supabase } from '@/lib/supabaseClient';
import { fetchLatestSabak } from '@/lib/sabakService';

export type HifzSectionType = 'sabak' | 'saatSabak' | 'alMukhta' | 'sabina';

export interface SabakRecord {
  id?: string;
  studentId: string;
  date: string;
  // ৪টি প্রধান স্তম্ভ
  sabak: string;          // ১. সবক (পারা ও পৃষ্ঠা)
  saatSabak: string;      // ২. সাত সবক (পারা ও পৃষ্ঠা রেঞ্জ)
  alMukhta: string;       // ৩. আমুখতা (পারা ও পৃষ্ঠা রেঞ্জ)
  sabina: string;         // ৪. সবিনা (সাপ্তাহিক শুনানী)
  // ব্যাকওয়ার্ড কম্প্যাটিবিলিটি ফিল্ড
  newSabak: string;
  sabki: string;
  satpara: string;
  grade: 'মুমতায' | 'জাইয়্যিদ জিদ্দান' | 'জাইয়্যিদ' | 'মাকবুল' | 'মেহনত প্রয়োজন';
  remark?: string;
}

interface SabakEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  studentsList?: Student[];
  initialSection?: HifzSectionType;
  onSaveSabak: (record: SabakRecord, sectionType: HifzSectionType) => Promise<void> | void;
}

const GRADES = [
  { label: 'মুমতায (উত্তম)', value: 'মুমতায', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { label: 'জাইয়্যিদ জিদ্দান (খুব ভালো)', value: 'জাইয়্যিদ জিদ্দান', color: 'bg-teal-50 text-teal-800 border-teal-300' },
  { label: 'জাইয়্যিদ (ভালো)', value: 'জাইয়্যিদ', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { label: 'মাকবুল (চলতি)', value: 'মাকবুল', color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { label: 'মেহনত প্রয়োজন', value: 'মেহনত প্রয়োজন', color: 'bg-rose-50 text-rose-800 border-rose-300' },
];

// ইংরেজি সংখ্যাকে বাংলা সংখ্যায় রূপান্তর
export function toBengaliNum(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === '') return '';
  const banglaDigits: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(val).replace(/[0-9]/g, (d) => banglaDigits[d] || d);
}

// পৃষ্ঠা বা পৃষ্ঠা রেঞ্জ ফরম্যাটার (যেমন: 12 -> পৃষ্ঠা ১২, 12-15 -> পৃষ্ঠা ১২ - ১৫)
export function formatPageInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  
  // রেঞ্জ চেক (১২-১৫ বা 12-15 বা 12 - 15)
  const rangeMatch = trimmed.match(/^([0-9০-৯]+)\s*[-–—toথেকে]\s*([0-9০-৯]+)$/i);
  if (rangeMatch) {
    return `পৃষ্ঠা ${toBengaliNum(rangeMatch[1])} - ${toBengaliNum(rangeMatch[2])}`;
  }
  
  // একক সংখ্যা (12 বা ১২)
  if (/^[0-9০-৯]+$/.test(trimmed)) {
    return `পৃষ্ঠা ${toBengaliNum(trimmed)}`;
  }
  
  // কাস্টম টেক্সট
  return trimmed.startsWith('পৃষ্ঠা') ? trimmed : `পৃষ্ঠা ${trimmed}`;
}

// শুধুমাত্র হিফজুল কুরআন শিক্ষার্থী যাচাই
export function isHifzStudent(std: Student | null | undefined): boolean {
  if (!std) return false;
  const cls = String(std.className || '').toLowerCase();
  return (
    cls.includes('হিফজ') ||
    cls.includes('হিজফ') ||
    cls.includes('কুরআন') ||
    cls.includes('hifz') ||
    cls.includes('quran')
  );
}

export function SabakEntryModal({
  isOpen,
  onClose,
  student,
  studentsList = [],
  initialSection = 'sabak',
  onSaveSabak,
}: SabakEntryModalProps) {
  // শুধুমাত্র হিফজ বিভাগের শিক্ষার্থীদের ফিল্টার করা (Strictly Hifz Only)
  const hifzStudents = useMemo(() => {
    return studentsList.filter((s) => isHifzStudent(s));
  }, [studentsList]);

  // বর্তমান সক্রিয় সেকশন ট্যাব
  const [activeSection, setActiveSection] = useState<HifzSectionType>(initialSection);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [currentRecord, setCurrentRecord] = useState<SabakRecord | null>(null);

  // ১. সবক স্টেট (আজকের পড়া)
  const [sabakPara, setSabakPara] = useState('১');
  const [sabakPage, setSabakPage] = useState('');

  // ২. সাত সবক স্টেট (চলতি রিভিশন)
  const [saatSabakPara, setSaatSabakPara] = useState('১');
  const [saatSabakPage, setSaatSabakPage] = useState('');

  // ৩. আমুখতা স্টেট (পেছনের রিভিশন)
  const [alMukhtaFromPara, setAlMukhtaFromPara] = useState('১');
  const [alMukhtaToPara, setAlMukhtaToPara] = useState('১');
  const [alMukhtaPage, setAlMukhtaPage] = useState('');

  // ৪. সবিনা স্টেট (সাপ্তাহিক সামগ্রিক শুনানী)
  const [sabinaFromPara, setSabinaFromPara] = useState('১');
  const [sabinaToPara, setSabinaToPara] = useState('৫');
  const [sabinaCustom, setSabinaCustom] = useState('');

  // মূল্যায়ন ও মন্তব্য
  const [grade, setGrade] = useState<SabakRecord['grade']>('মুমতায');
  const [remark, setRemark] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // মডাল খুললে ইনিশিয়াল সেকশন ও স্টুডেন্ট সেট
  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
      if (student && isHifzStudent(student)) {
        setSelectedStudentId(student.id);
      } else if (hifzStudents.length > 0) {
        setSelectedStudentId(hifzStudents[0].id);
      }
      setErrorMessage('');
    }
  }, [isOpen, initialSection, student, hifzStudents]);

  // নির্বাচিত শিক্ষার্থীর বর্তমান রানিং সবক রেকর্ড লোড
  useEffect(() => {
    if (!selectedStudentId) {
      setCurrentRecord(null);
      return;
    }

    const fetchCurrent = async () => {
      try {
        const studentObj =
          hifzStudents.find((s) => s.id === selectedStudentId) ||
          (student?.id === selectedStudentId ? student : ({ id: selectedStudentId } as any));
        const res = await fetchLatestSabak(studentObj);
        if (res) {
          setCurrentRecord(res as any);
        } else {
          setCurrentRecord(null);
        }
      } catch (e) {
        console.warn('Current sabak fetch warning:', e);
      }
    };

    fetchCurrent();
  }, [selectedStudentId, isOpen, hifzStudents, student]);

  const activeStudent = student || hifzStudents.find((s) => s.id === selectedStudentId);

  // ১ থেকে ৩০ পারার অপশন
  const paraOptions = Array.from({ length: 30 }, (_, i) => String(i + 1));

  // লাইভ তৈরি হওয়া টেক্সট প্রিভিউ
  const formattedSabak = useMemo(() => {
    const pageText = formatPageInput(sabakPage);
    return pageText ? `পারা ${toBengaliNum(sabakPara)} • ${pageText}` : `পারা ${toBengaliNum(sabakPara)}`;
  }, [sabakPara, sabakPage]);

  const formattedSaatSabak = useMemo(() => {
    const pageText = formatPageInput(saatSabakPage);
    return pageText ? `পারা ${toBengaliNum(saatSabakPara)} • ${pageText}` : `পারা ${toBengaliNum(saatSabakPara)}`;
  }, [saatSabakPara, saatSabakPage]);

  const formattedAlMukhta = useMemo(() => {
    const from = toBengaliNum(alMukhtaFromPara);
    const to = toBengaliNum(alMukhtaToPara);
    const paraText = alMukhtaFromPara === alMukhtaToPara ? `পারা ${from}` : `পারা ${from} থেকে ${to}`;
    const pageText = formatPageInput(alMukhtaPage);
    return pageText ? `${paraText} • ${pageText}` : `${paraText} (পেছনের রিভিশন)`;
  }, [alMukhtaFromPara, alMukhtaToPara, alMukhtaPage]);

  const formattedSabina = useMemo(() => {
    if (sabinaCustom.trim()) return sabinaCustom.trim();
    const from = toBengaliNum(sabinaFromPara);
    const to = toBengaliNum(sabinaToPara);
    return sabinaFromPara === sabinaToPara
      ? `পারা ${from} সম্পূর্ণ`
      : `পারা ${from} থেকে পারা ${to} সম্পূর্ণ`;
  }, [sabinaFromPara, sabinaToPara, sabinaCustom]);

  if (!isOpen) return null;

  // সেকশন ভিত্তিক সাবমিট হ্যান্ডলার (শুধুমাত্র সংশ্লিষ্ট সেকশন আপডেট হবে)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMessage('অনুগ্রহ করে হিফজ বিভাগের একজন শিক্ষার্থী নির্বাচন করুন!');
      return;
    }

    // সেকশন অনুযায়ী ভ্যালিডেশন
    if (activeSection === 'sabak' && !sabakPage.trim()) {
      setErrorMessage('আজকের নতুন সবকের পৃষ্ঠা নম্বর প্রদান করুন!');
      return;
    }
    if (activeSection === 'saatSabak' && !saatSabakPage.trim()) {
      setErrorMessage('সাত সবকের পৃষ্ঠা বা পৃষ্ঠা রেঞ্জ (যেমন: ১২-১৫) প্রদান করুন!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // শুধুমাত্র সক্রিয় সেকশনটি আপডেট হবে, বাকিগুলো অক্ষত থাকবে
      const updatedSabak = activeSection === 'sabak'
        ? formattedSabak
        : (currentRecord?.sabak || currentRecord?.newSabak || '');

      const updatedSaatSabak = activeSection === 'saatSabak'
        ? formattedSaatSabak
        : (currentRecord?.saatSabak || currentRecord?.sabki || '');

      const updatedAlMukhta = activeSection === 'alMukhta'
        ? formattedAlMukhta
        : (currentRecord?.alMukhta || currentRecord?.satpara || '');

      const updatedSabina = activeSection === 'sabina'
        ? formattedSabina
        : (currentRecord?.sabina || '');

      await onSaveSabak({
        id: currentRecord?.id,
        studentId: selectedStudentId,
        rollNo: activeStudent?.rollNo,
        admissionNo: activeStudent?.admissionNo,
        date,
        sabak: updatedSabak,
        saatSabak: updatedSaatSabak,
        alMukhta: updatedAlMukhta,
        sabina: updatedSabina,
        newSabak: updatedSabak,
        sabki: updatedSaatSabak,
        satpara: updatedAlMukhta,
        grade,
        remark: remark.trim() || currentRecord?.remark || '',
      } as any, activeSection);

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs font-['Kalpurush','Hind_Siliguri',sans-serif]">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100">
        
        {/* ================= হেডার ================= */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#008955] border border-emerald-200">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 leading-tight">হিফজুল কুরআন দৈনিক ডায়েরি</h2>
                <span className="text-[9.5px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  হিফজ বিভাগ খাস
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">আলাদা সময়ে আলাদাভাবে শুনানী এন্ট্রি করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= ৪টি স্তম্ভের আলাদা ট্যাব সিলেকশন ================= */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl mt-3.5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveSection('sabak');
              setErrorMessage('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === 'sabak'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BookOpen size={14} />
            <span>১. সবক</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('saatSabak');
              setErrorMessage('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === 'saatSabak'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BookmarkCheck size={14} />
            <span>২. সাত সবক</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('alMukhta');
              setErrorMessage('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === 'alMukhta'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sparkles size={14} />
            <span>৩. আমুখতা</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('sabina');
              setErrorMessage('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSection === 'sabina'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Award size={14} />
            <span>৪. সবিনা</span>
          </button>
        </div>

        {/* এরর মেসেজ */}
        {errorMessage && (
          <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-4">
          
          {/* ================= শিক্ষার্থী ও তারিখ নির্বাচন ================= */}
          <div className="space-y-2">
            {!student && hifzStudents.length > 0 ? (
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  হিফজ শিক্ষার্থী নির্বাচন করুন *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#008955] focus:bg-white focus:outline-none"
                >
                  {hifzStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      রোল {toBengaliNum(s.rollNo || '-')} : {s.fullNameBangla || s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>
            ) : activeStudent ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008955] font-bold text-white shadow-xs text-xs">
                    {toBengaliNum(activeStudent.rollNo || '০১')}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {activeStudent.fullNameBangla || activeStudent.fullName}
                    </p>
                    <p className="text-[10.5px] text-emerald-800 font-medium">
                      বিভাগ: {activeStudent.className || 'হিফজুল কুরআন'}
                    </p>
                  </div>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                হিফজুল কুরআন বিভাগের কোনো শিক্ষার্থী পাওয়া যায়নি।
              </div>
            )}

            {/* শিক্ষার্থীর বর্তমান রানিং অবস্থা এক নজরে */}
            {currentRecord && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                  শিক্ষার্থীর বর্তমান রানিং অগ্রগতি:
                </span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-600">
                  <p><span className="font-bold text-emerald-700">সবক:</span> {currentRecord.sabak || currentRecord.newSabak || 'নির্ধারিত হয়নি'}</p>
                  <p><span className="font-bold text-sky-700">সাত সবক:</span> {currentRecord.saatSabak || currentRecord.sabki || 'নির্ধারিত হয়নি'}</p>
                  <p><span className="font-bold text-amber-700">আমুখতা:</span> {currentRecord.alMukhta || currentRecord.satpara || 'নির্ধারিত হয়নি'}</p>
                  <p><span className="font-bold text-purple-700">সবিনা:</span> {currentRecord.sabina || 'শুনানী নেই'}</p>
                </div>
              </div>
            )}
          </div>

          {/* ================= ১. শুধু সবক ফর্ম ================= */}
          {activeSection === 'sabak' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">১. সবক এন্ট্রি (আজকের নতুন পাঠ শুনানী)</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold bg-white border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs">
                  {formattedSabak}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">পারা নির্বাচন *</label>
                  <select
                    value={sabakPara}
                    onChange={(e) => setSabakPara(e.target.value)}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#008955] focus:outline-none"
                  >
                    {paraOptions.map((p) => (
                      <option key={p} value={p}>পারা {toBengaliNum(p)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">পৃষ্ঠা নম্বর *</label>
                  <input
                    type="text"
                    placeholder="যেমন: ১২ বা ১৫"
                    value={sabakPage}
                    onChange={(e) => setSabakPage(e.target.value)}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-[#008955] focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= ২. শুধু সাত সবক ফর্ম ================= */}
          {activeSection === 'saatSabak' && (
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/90 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                  <span className="text-xs font-bold text-sky-950">২. সাত সবক এন্ট্রি (চলতি পারার রিভিশন শুনানী)</span>
                </div>
                <span className="text-[10px] text-sky-800 font-bold bg-white border border-sky-200 px-2 py-0.5 rounded-md shadow-2xs">
                  {formattedSaatSabak}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">পারা নির্বাচন *</label>
                  <select
                    value={saatSabakPara}
                    onChange={(e) => setSaatSabakPara(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                  >
                    {paraOptions.map((p) => (
                      <option key={p} value={p}>পারা {toBengaliNum(p)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">পৃষ্ঠা রেঞ্জ *</label>
                  <input
                    type="text"
                    placeholder="যেমন: ১২-১৫ বা ৫-১০"
                    value={saatSabakPage}
                    onChange={(e) => setSaatSabakPage(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= ৩. শুধু আমুখতা ফর্ম ================= */}
          {activeSection === 'alMukhta' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
                  <span className="text-xs font-bold text-amber-950">৩. আমুখতা এন্ট্রি (পেছনের মুখস্থ পারার নিয়মিত দোহর)</span>
                </div>
                <span className="text-[10px] text-amber-800 font-bold bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs">
                  {formattedAlMukhta}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">শুরু পারা *</label>
                  <select
                    value={alMukhtaFromPara}
                    onChange={(e) => setAlMukhtaFromPara(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white px-2 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {paraOptions.map((p) => (
                      <option key={p} value={p}>পারা {toBengaliNum(p)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">শেষ পারা *</label>
                  <select
                    value={alMukhtaToPara}
                    onChange={(e) => setAlMukhtaToPara(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white px-2 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {paraOptions.map((p) => (
                      <option key={p} value={p}>পারা {toBengaliNum(p)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">পৃষ্ঠা (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: ১-২০"
                    value={alMukhtaPage}
                    onChange={(e) => setAlMukhtaPage(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white px-2 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= ৪. শুধু সবিনা ফর্ম ================= */}
          {activeSection === 'sabina' && (
            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/90 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                  <span className="text-xs font-bold text-purple-950">৪. সবিনা এন্ট্রি (সাপ্তাহিক সামগ্রিক পূর্ণ পারা শুনানী)</span>
                </div>
                <span className="text-[10px] text-purple-800 font-bold bg-white border border-purple-200 px-2 py-0.5 rounded-md shadow-2xs">
                  {formattedSabina}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">শুরু পারা *</label>
                  <select
                    value={sabinaFromPara}
                    onChange={(e) => setSabinaFromPara(e.target.value)}
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {paraOptions.map((p) => (
                      <option key={p} value={p}>পারা {toBengaliNum(p)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">শেষ পারা *</label>
                  <select
                    value={sabinaToPara}
                    onChange={(e) => setSabinaToPara(e.target.value)}
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {paraOptions.map((p) => (
                      <option key={p} value={p}>পারা {toBengaliNum(p)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-700 font-bold block mb-1">কাস্টম শুনানী নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: পারা ১ থেকে পারা ৫ সম্পূর্ণ শুনানী সম্পন্ন হয়েছে"
                  value={sabinaCustom}
                  onChange={(e) => setSabinaCustom(e.target.value)}
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ================= পড়ার মান ও মূল্যায়ন ================= */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              শুনানীর মান / মূল্যায়ন *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GRADES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGrade(g.value as SabakRecord['grade'])}
                  className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    grade === g.value
                      ? `${g.color} ring-2 ring-emerald-600/30 shadow-xs`
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* ================= ওস্তাদের মন্তব্য ================= */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              ওস্তাদের মন্তব্য / নসিহত (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেমন: মাশাআল্লাহ সুন্দর হয়েছে, ওয়াকফের প্রতি আরও যত্নশীল হতে হবে"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008955] focus:bg-white focus:outline-none"
            />
          </div>

          {/* বাটনসমূহ */}
          <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer ${
                activeSection === 'sabak'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : activeSection === 'saatSabak'
                  ? 'bg-sky-600 hover:bg-sky-700'
                  : activeSection === 'alMukhta'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Save size={15} />
              <span>
                {isSubmitting
                  ? 'সংরক্ষণ হচ্ছে...'
                  : activeSection === 'sabak'
                  ? 'নতুন সবক সংরক্ষণ করুন'
                  : activeSection === 'saatSabak'
                  ? 'সাত সবক সংরক্ষণ করুন'
                  : activeSection === 'alMukhta'
                  ? 'আমুখতা সংরক্ষণ করুন'
                  : 'সবিনা সংরক্ষণ করুন'}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}