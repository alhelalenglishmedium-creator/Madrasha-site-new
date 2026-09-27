'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type InstitutionType = 'madrasa' | 'school' | 'womens_madrasa';

const INSTITUTION_OPTIONS: { id: InstitutionType; label: string }[] = [
  { id: 'madrasa', label: 'মাদ্রাসা' },
  { id: 'school', label: 'স্কুল' },
  { id: 'womens_madrasa', label: 'মহিলা মাদ্রাসা' },
];

const CLASSES_BY_TYPE: Record<InstitutionType, string[]> = {
  madrasa: ['হিফজুল কুরআন', 'নূরানী', 'নাজেরা', 'মিজান', 'নাহবেমীর', 'কাফিয়া', 'হেদায়া', 'দাউরায়ে হাদিস'],
  school: ['প্লে', 'নার্সারি', 'কেজি', '১ম শ্রেণি', '২য় শ্রেণি', '৩য় শ্রেণি', '৪র্থ শ্রেণি', '৫ম শ্রেণি', '৬ষ্ঠ শ্রেণি', '৭ম শ্রেণি', '৮ম শ্রেণি', '৯ম শ্রেণি', '১০ম শ্রেণি'],
  womens_madrasa: ['মহিলা হিফজ', 'মহিলা নূরানী', 'মহিলা নাজেরা', 'ইবতেদায়ী', 'মুয়াল্লিমা প্রশিক্ষণ', 'মহিলা মিজান'],
};

const DEFAULT_SUBJECTS_BY_TYPE: Record<InstitutionType, string[]> = {
  madrasa: ['কুরআনুল কারীম', 'হাদিস শরীফ', 'ফিকাহ', 'নাহু ও সরফ', 'তাজবীদ ও মাখরাজ', 'আকাইদ ও আখলাক', 'আরবি ভাষা', 'মাসনূন দুআ', 'বাংলা', 'গণিত', 'ইংরেজি'],
  school: ['বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ বিজ্ঞান', 'বাংলাদেশ ও বিশ্বপরিচয়', 'ইসলাম ও নৈতিক শিক্ষা', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'ডিজিটাল প্রযুক্তি', 'শিল্প ও সংস্কৃতি', 'স্বাস্থ্য সুরক্ষা'],
  womens_madrasa: ['কুরআন ও তাজবীদ', 'হাদিস ও দুআ', 'ফিকহুন্নিসা (নারী মাসআলা)', 'আরবি আদব', 'বাংলা ও সাধারণ জ্ঞান', 'আখলাক ও শিষ্টাচার'],
};

const ROUTINE_DAYS = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার'];

interface AdminRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminRoutineModal({ isOpen, onClose }: AdminRoutineModalProps) {
  const [selectedInstType, setSelectedInstType] = useState<InstitutionType>('madrasa');
  const [selectedClass, setSelectedClass] = useState<string>('হিফজুল কুরআন');
  const [selectedDay, setSelectedDay] = useState<string>('শনিবার');

  const [subjectList, setSubjectList] = useState<string[]>(DEFAULT_SUBJECTS_BY_TYPE['madrasa']);
  const [subjectName, setSubjectName] = useState<string>(DEFAULT_SUBJECTS_BY_TYPE['madrasa'][0]);
  const [isAddingCustomSubject, setIsAddingCustomSubject] = useState<boolean>(false);
  const [customSubjectInput, setCustomSubjectInput] = useState<string>('');

  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [startTime, setStartTime] = useState<string>('09:00 AM');
  const [endTime, setEndTime] = useState<string>('10:00 AM');
  const [teacherName, setTeacherName] = useState<string>('');
  const [roomNo, setRoomNo] = useState<string>('');

  // প্রতিষ্ঠানের ধরন পরিবর্তন হলে শ্রেণি ও বিষয়সমূহ আপডেট
  const handleInstTypeChange = (type: InstitutionType) => {
    setSelectedInstType(type);
    const classes = CLASSES_BY_TYPE[type] || [];
    const subjects = DEFAULT_SUBJECTS_BY_TYPE[type] || [];
    setSelectedClass(classes[0] || 'সাধারণ');
    setSubjectList(subjects);
    setSubjectName(subjects[0] || '');
    setIsAddingCustomSubject(false);
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (!subjectList.includes(trimmed)) {
      setSubjectList((prev) => [...prev, trimmed]);
    }
    setSubjectName(trimmed);
    setCustomSubjectInput('');
    setIsAddingCustomSubject(false);
  };

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_routines')
        .select('*')
        .eq('class_name', selectedClass)
        .eq('day', selectedDay)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setRoutines(data);
      } else {
        const cached = localStorage.getItem(`madrasa_routine_${selectedClass}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setRoutines(parsed.filter((r: any) => r.day === selectedDay));
        } else {
          setRoutines([]);
        }
      }
    } catch {
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadRoutines();
  }, [isOpen, selectedClass, selectedDay, selectedInstType]);

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      alert('অনুগ্রহ করে বিষয় নির্বাচন বা টাইপ করুন!');
      return;
    }

    try {
      setSaving(true);
      const newPeriod = {
        institution_type: selectedInstType,
        class_name: selectedClass,
        day: selectedDay,
        start_time: startTime,
        end_time: endTime,
        subject_name: subjectName.trim(),
        teacher_name: teacherName.trim() || 'উস্তাদ নির্ধারণ করা হয়নি',
        room_no: roomNo.trim() || '১০১',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('class_routines').insert([newPeriod]);
      if (error) {
        await supabase.from('class_routines').insert([{
          class_name: selectedClass,
          day: selectedDay,
          start_time: startTime,
          end_time: endTime,
          subject_name: subjectName.trim(),
          teacher_name: teacherName.trim() || 'উস্তাদ নির্ধারণ করা হয়নি',
        }]);
      }

      const localKey = `madrasa_routine_${selectedClass}`;
      const cached = localStorage.getItem(localKey);
      const currentArr = cached ? JSON.parse(cached) : [];
      localStorage.setItem(localKey, JSON.stringify([...currentArr, newPeriod]));

      setTeacherName('');
      setRoomNo('');
      loadRoutines();
    } catch (err: any) {
      alert('রুটিন সেভ ত্রুটি: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    try {
      await supabase.from('class_routines').delete().eq('id', id);
      setRoutines((prev) => prev.filter((r) => r.id !== id));

      const localKey = `madrasa_routine_${selectedClass}`;
      const cached = localStorage.getItem(localKey);
      if (cached) {
        try {
          const arr = JSON.parse(cached);
          const filtered = arr.filter((r: any) => r.id !== id);
          localStorage.setItem(localKey, JSON.stringify(filtered));
        } catch (e) {}
      }
    } catch {
      alert('মুছে ফেলা যায়নি');
    }
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 font-hind animate-in fade-in">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[430px] bg-[#F8FAFC] rounded-t-[32px] sm:rounded-3xl shadow-2xl p-4 overflow-hidden border border-slate-200 flex flex-col max-h-[88vh]">

        {/* হেডার */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-8.5 w-8.5 rounded-xl bg-[#E7F6ED] text-[#008955] flex items-center justify-center shadow-2xs">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">ক্লাস রুটিন কন্ট্রোল</h3>
              <p className="text-[10.5px] text-slate-500 font-medium">প্রতিষ্ঠানের ধরন, শ্রেণি ও দিন অনুযায়ী রুটিন সেট করুন</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-3 no-scrollbar">

          {/* ১. প্রতিষ্ঠানের ধরন নির্বাচন (মাদ্রাসা / স্কুল / মহিলা মাদ্রাসা) */}
          <div className="bg-[#E7F6ED] p-1 rounded-2xl flex items-center gap-1 border border-[#CDEEDE]">
            {INSTITUTION_OPTIONS.map((opt) => {
              const isActive = selectedInstType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleInstTypeChange(opt.id)}
                  className={`flex-1 py-1.5 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#008955] text-white shadow-xs'
                      : 'text-[#0F2F24] hover:bg-white/50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* ২. জামাত/শ্রেণি ও বার নির্বাচন */}
          <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                {selectedInstType === 'school' ? 'শ্রেণি / ক্লাস' : 'জামাত / বিভাগ'}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008955] cursor-pointer"
              >
                {CLASSES_BY_TYPE[selectedInstType].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">বার / দিন</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008955] cursor-pointer"
              >
                {ROUTINE_DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ৩. নতুন পিরিয়ড এন্ট্রি ফর্ম */}
          <form onSubmit={handleAddPeriod} className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs space-y-2.5">
            <span className="text-[11px] font-black text-[#008955] block">
              + নতুন পিরিয়ড যুক্ত করুন
            </span>

            {/* সময়সূচি (শুরু ও শেষ) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 block mb-0.5">শুরুর সময়</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="যেমন: 09:00 AM"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008955]"
                  required
                />
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 block mb-0.5">শেষের সময়</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="যেমন: 10:00 AM"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008955]"
                  required
                />
              </div>
            </div>

            {/* বিষয় নির্বাচন + প্লাস বাটন দিয়ে কাস্টম সাবজেক্ট যোগ */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-700">বিষয় / বিষয়বস্তু *</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomSubject(!isAddingCustomSubject)}
                  className="text-[10px] font-bold text-[#008955] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{isAddingCustomSubject ? 'তালিকা থেকে সিলেক্ট' : 'নতুন বিষয় যোগ'}</span>
                </button>
              </div>

              {isAddingCustomSubject ? (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="নতুন বিষয়ের নাম লিখুন..."
                    className="flex-1 text-xs font-bold bg-slate-50 border border-[#008955] rounded-xl px-2.5 py-1.5 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3 py-1.5 rounded-xl bg-[#008955] text-white text-xs font-bold transition active:scale-95 shrink-0 cursor-pointer"
                  >
                    যোগ করুন
                  </button>
                </div>
              ) : (
                <select
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008955] cursor-pointer"
                  required
                >
                  {subjectList.map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              )}
            </div>

            {/* উস্তাদ/শিক্ষকের নাম (ঐচ্ছিক) & রুম নং */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 block mb-0.5">শিক্ষক/উস্তাদের নাম (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="যেমন: মাওলানা আব্দুর রহিম"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008955]"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 block mb-0.5">রুম নং (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  placeholder="যেমন: ১০১"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008955]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-[#008955] hover:bg-[#007548] text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
              <span>রুটিনে যুক্ত করুন</span>
            </button>
          </form>

          {/* ৪. বর্তমান ক্লাস রুটিন তালিকা */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black text-slate-800">
                {selectedClass} • {selectedDay}-এর রুটিন ({routines.length}টি)
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {selectedInstType === 'school' ? 'স্কুল' : selectedInstType === 'womens_madrasa' ? 'মহিলা মাদ্রাসা' : 'মাদ্রাসা'}
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <Loader2 size={18} className="animate-spin mx-auto text-[#008955] mb-1" />
                <span>রুটিন লোড হচ্ছে...</span>
              </div>
            ) : routines.length > 0 ? (
              routines.map((r) => (
                <div key={r.id || r.created_at} className="bg-[#F8FAF9] p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs hover:border-[#008955]/40 transition">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#008955] bg-[#E7F6ED] border border-[#CDEEDE] px-2 py-0.5 rounded-lg font-sans shrink-0">
                        {r.start_time} - {r.end_time}
                      </span>
                      <h4 className="font-bold text-slate-900 truncate">{r.subject_name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      শিক্ষক: <strong className="text-slate-700">{r.teacher_name || 'উস্তাদ নির্ধারণ করা হয়নি'}</strong>
                      {r.room_no && ` • রুম: ${r.room_no}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePeriod(r.id)}
                    className="h-7 w-7 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition shrink-0 cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                এই দিনে {selectedClass}-এর কোনো রুটিন যুক্ত করা হয়নি
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}