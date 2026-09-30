'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  BookOpen,
  School,
  Users,
  Award,
  CheckCircle2,
  Loader2,
  Save,
  User,
  Plus,
  Trash2,
  AlertCircle,
  X,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Student, InstitutionType } from '@/types/database.types';

interface AdminResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentsList: Student[];
  onSuccess: (msg: string) => void;
}

const INSTITUTION_OPTIONS = [
  { id: 'madrasa' as InstitutionType, label: 'মাদ্রাসা', icon: BookOpen },
  { id: 'school' as InstitutionType, label: 'স্কুল', icon: School },
  { id: 'mohila_madrasa' as InstitutionType, label: 'মহিলা মাদ্রাসা', icon: Users },
];

const CLASSES_BY_INSTITUTION: Record<InstitutionType, { id: string; label: string }[]> = {
  madrasa: [
    { id: 'সব', label: 'সব' },
    { id: 'হিফজুল কুরআন', label: 'হিফজ' },
    { id: 'নাজেরা', label: 'নাজেরা' },
    { id: 'নূরানী', label: 'নূরানী' },
    { id: 'মিজান', label: 'মিজান' },
    { id: 'নাহবেমীর', label: 'নাহবেমীর' },
    { id: 'কাফিয়া', label: 'কাফিয়া' },
    { id: 'হেদায়া', label: 'হেদায়া' },
    { id: 'দাউরায়ে হাদিস', label: 'দাউরা' },
  ],
  school: [
    { id: 'সব', label: 'সব' },
    { id: 'প্লে', label: 'প্লে' },
    { id: 'নার্সারি', label: 'নার্সারি' },
    { id: 'কেজি', label: 'কেজি' },
    { id: '১ম শ্রেণি', label: '১ম শ্রেণি' },
    { id: '২য় শ্রেণি', label: '২য় শ্রেণি' },
    { id: '৩য় শ্রেণি', label: '৩য় শ্রেণি' },
    { id: '৪র্থ শ্রেণি', label: '৪র্থ শ্রেণি' },
    { id: '৫ম শ্রেণি', label: '৫ম শ্রেণি' },
    { id: '৬ষ্ঠ শ্রেণি', label: '৬ষ্ঠ শ্রেণি' },
    { id: '৭ম শ্রেণি', label: '৭ম শ্রেণি' },
    { id: '৮ম শ্রেণি', label: '৮ম শ্রেণি' },
    { id: '৯ম শ্রেণি', label: '৯ম শ্রেণি' },
    { id: '১০ম শ্রেণি', label: '১০ম শ্রেণি' },
  ],
  mohila_madrasa: [
    { id: 'সব', label: 'সব' },
    { id: 'মহিলা হিফজ', label: 'মহিলা হিফজ' },
    { id: 'মহিলা নূরানী', label: 'মহিলা নূরানী' },
    { id: 'মহিলা নাজেরা', label: 'মহিলা নাজেরা' },
    { id: 'ইবতেদায়ী', label: 'ইবতেদায়ী' },
    { id: 'মুয়াল্লিমা প্রশিক্ষণ', label: 'মুয়াল্লিমা' },
    { id: 'মহিলা মিজান', label: 'মহিলা মিজান' },
  ],
};

const CLASS_SUBJECTS_MAP: Record<string, string[]> = {
  // মাদ্রাসা বিষয়সমূহ
  'হিফজুল কুরআন': ['হিফজুল কুরআন (তিলাওয়াত ও শুনানী)', 'তাজবীদ ও মাখরাজ', 'মাসনূন দুআ ও নামাজ', 'আদব ও আখলাক'],
  'হিফজ': ['হিফজুল কুরআন (তিলাওয়াত ও শুনানী)', 'তাজবীদ ও মাখরাজ', 'মাসনূন দুআ ও নামাজ', 'আদব ও আখলাক'],
  'নাজেরা': ['নাজেরা কুরআন তিলাওয়াত', 'তাজবীদ শিক্ষা', 'দীনিয়াত ও দুআ', 'আখলাক ও শিষ্টাচার'],
  'নূরানী': ['নূরানী কুরআন শিক্ষা', 'বাংলা ভাষা', 'প্রাথমিক গণিত', 'ইংরেজি', 'দীনিয়াত ও ইসলাম শিক্ষা'],
  'মিজান': ['মিজানুস সারফ', 'মুনশাইব', 'নাহবেমীর', 'ফিকহ (নূরুল ইযাহ)', 'সিরাত ও আখলাক'],
  'নাহবেমীর': ['নাহবেমীর', 'ইলমুস সারফ', 'ফিকহ', 'আরবি সাহিত্য', 'উর্দু'],
  'কাফিয়া': ['কাফিয়া', 'উসুলুশ শাশী', 'নূরুল আনওয়ার', 'মাকামাত', 'তারিখ'],

  // স্কুল বিষয়সমূহ
  'প্লে': ['ছড়া ও গল্প', 'অঙ্ক চেনার ছড়া', 'ছবি দেখে পড়া', 'সাধারণ জ্ঞান ও আদব'],
  'নার্সারি': ['কুরআন ও কায়দা', 'বাংলা বর্ণমালা', 'English Alphabet', 'গণিত প্রাথমিক'],
  'কেজি': ['বাংলা', 'ইংরেজি', 'গণিত', 'ইসলাম শিক্ষা', 'ড্রয়িং ও সাধারণ জ্ঞান'],
  '১ম শ্রেণি': ['বাংলা', 'ইংরেজি', 'গণিত', 'ইসলাম ও নৈতিক শিক্ষা', 'পরিবেশ পরিচিতি'],
  '২য় শ্রেণি': ['বাংলা', 'ইংরেজি', 'গণিত', 'ইসলাম ও নৈতিক শিক্ষা', 'সাধারণ বিজ্ঞান'],
  '৩য় শ্রেণি': ['বাংলা', 'ইংরেজি', 'গণিত', 'বাংলাদেশ ও বিশ্বপরিচয়', 'প্রাথমিক বিজ্ঞান', 'ইসলাম ও নৈতিক শিক্ষা'],
  '৪র্থ শ্রেণি': ['বাংলা', 'ইংরেজি', 'গণিত', 'বাংলাদেশ ও বিশ্বপরিচয়', 'প্রাথমিক বিজ্ঞান', 'ইসলাম ও নৈতিক শিক্ষা'],
  '৫ম শ্রেণি': ['বাংলা', 'ইংরেজি', 'গণিত', 'বাংলাদেশ ও বিশ্বপরিচয়', 'প্রাথমিক বিজ্ঞান', 'ইসলাম ও নৈতিক শিক্ষা'],
  '৬ষ্ঠ শ্রেণি': ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'ইতিহাস ও সামাজিক বিজ্ঞান', 'ডিজিটাল প্রযুক্তি', 'ইসলাম শিক্ষা'],
  '৭ম শ্রেণি': ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'ইতিহাস ও সামাজিক বিজ্ঞান', 'ডিজিটাল প্রযুক্তি', 'ইসলাম শিক্ষা'],
  '৮ম শ্রেণি': ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'বাংলাদেশ ও বিশ্বপরিচয়', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'ধর্ম'],
  '৯ম শ্রেণি': ['বাংলা ১ম ও ২য়', 'ইংরেজি ১ম ও ২য়', 'সাধারণ গণিত', 'পদার্থবিজ্ঞান / হিসাববিজ্ঞান', 'উচ্চতর গণিত', 'তথ্য প্রযুক্তি'],
  '১০ম শ্রেণি': ['বাংলা ১ম ও ২য়', 'ইংরেজি ১ম ও ২য়', 'সাধারণ গণিত', 'পদার্থবিজ্ঞান / হিসাববিজ্ঞান', 'উচ্চতর গণিত', 'তথ্য প্রযুক্তি'],

  // মহিলা মাদ্রাসা বিষয়সমূহ
  'মহিলা হিফজ': ['হিফজুল কুরআন', 'তাজবীদ ও মাখরাজ', 'মাসনূন দুআ', 'আখলাক ও শিষ্টাচার'],
  'মহিলা নূরানী': ['নূরানী কুরআন', 'বাংলা', 'গণিত', 'ইংরেজি', 'দীনিয়াত ও নামাজ শিক্ষা'],
  'মহিলা নাজেরা': ['নাজেরা তিলাওয়াত', 'তাজবীদ', 'দীনিয়াত ও জরুরি মাসআলা'],
  'ইবতেদায়ী': ['কুরআন ও তাজবীদ', 'আরবি ভাষা', 'বাংলা', 'ইংরেজি', 'গণিত', 'দীনিয়াত'],
  'মুয়াল্লিমা প্রশিক্ষণ': ['কুরআন ও তাজবীদ পদ্ধতি', 'ফিকহুন্নিসা (নারী মাসআলা)', 'শিশু মনস্তত্ত্ব ও শিক্ষাদান পদ্ধতি', 'আদব'],
  'মহিলা মিজান': ['মিজানুস সারফ', 'মুনশাইব', 'নাহবেমীর', 'ফিকহুন্নিসা', 'সিরাত'],
};

const DEFAULT_SUBJECTS_BY_INSTITUTION: Record<InstitutionType, string[]> = {
  madrasa: ['কুরআনুল কারীম', 'হাদিস শরীফ', 'ফিকাহ', 'তাজবীদ ও মাখরাজ', 'দীনিয়াত'],
  school: ['বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ বিজ্ঞান', 'ইসলাম ও নৈতিক শিক্ষা'],
  mohila_madrasa: ['কুরআন ও তাজবীদ', 'হাদিস ও দুআ', 'ফিকহুন্নিসা', 'বাংলা ও সাধারণ জ্ঞান'],
};

const EXAM_TYPES = [
  '১ম সাময়িক পরীক্ষা ২০২৬',
  '২য় সাময়িক পরীক্ষা ২০২৬',
  'বার্ষিক মূল্যায়ন ২০২৬',
  'মাসিক টেস্ট ২০২৬',
];

function matchesInstitution(std: Student, instType: InstitutionType): boolean {
  const stdInst = String(std.institutionType || (std as any).institution_type || '').toLowerCase();
  
  if (stdInst === instType) return true;
  if (instType === 'mohila_madrasa' && (stdInst === 'womens_madrasa' || stdInst === 'mohila')) return true;

  // যদি সরাসরি institutionType না থাকে, তবে ক্লাসের নাম থেকে যাচাই
  const cls = (std.className || '').toLowerCase();
  const isMohilaClass = cls.includes('মহিলা') || cls.includes('মুয়াল্লিমা');
  const isSchoolClass =
    cls.includes('প্লে') ||
    cls.includes('play') ||
    cls.includes('নার্সারি') ||
    cls.includes('nursery') ||
    cls.includes('কেজি') ||
    cls.includes('kg') ||
    cls.includes('শ্রেণি') ||
    cls.includes('ক্লাস') ||
    cls.includes('class') ||
    cls.includes('standard');

  if (instType === 'school') {
    return isSchoolClass && !isMohilaClass;
  }
  if (instType === 'mohila_madrasa') {
    return isMohilaClass;
  }
  if (instType === 'madrasa') {
    return !isSchoolClass && !isMohilaClass;
  }
  return true;
}

export function AdminResultModal({
  isOpen,
  onClose,
  studentsList,
  onSuccess,
}: AdminResultModalProps) {
  // ১. প্রতিষ্ঠানের ধরন স্টেট (মাদ্রাসা | স্কুল | মহিলা মাদ্রাসা)
  const [selectedInstType, setSelectedInstType] = useState<InstitutionType>('madrasa');

  // ২. শ্রেণি ও সার্চ স্টেট
  const [selectedClass, setSelectedClass] = useState<string>('সব');
  const [examName, setExamName] = useState<string>('১ম সাময়িক পরীক্ষা ২০২৬');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ৩. সক্রিয় শিক্ষার্থী এবং বিষয় ও নম্বর স্টেট
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [currentSubjects, setCurrentSubjects] = useState<string[]>([]);
  const [studentSubjectMarks, setStudentSubjectMarks] = useState<{ [subject: string]: number }>({});
  const [newSubjectInput, setNewSubjectInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // প্রতিষ্ঠান পরিবর্তন হ্যান্ডলার
  const handleInstTypeChange = (type: InstitutionType) => {
    setSelectedInstType(type);
    setSelectedClass('সব');
    setActiveStudent(null);
  };

  // ডায়নামিক শ্রেণি ফিল্টারিং
  const filteredStudents = useMemo(() => {
    return studentsList.filter((std) => {
      // প্রতিষ্ঠান ম্যাচিং
      if (!matchesInstitution(std, selectedInstType)) return false;

      // শ্রেণি ম্যাচিং
      const matchClass =
        selectedClass === 'সব' ||
        selectedClass === 'সকল বিভাগ' ||
        (std.className && std.className.toLowerCase().includes(selectedClass.toLowerCase()));

      // সার্চ কুয়েরি
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (std.fullNameBangla && std.fullNameBangla.toLowerCase().includes(q)) ||
        (std.fullName && std.fullName.toLowerCase().includes(q)) ||
        (std.rollNo && String(std.rollNo).includes(q)) ||
        (std.phone && std.phone.includes(q)) ||
        (std.admissionNo && std.admissionNo.toLowerCase().includes(q));

      return matchClass && matchSearch;
    });
  }, [studentsList, selectedInstType, selectedClass, searchQuery]);

  if (!isOpen) return null;

  // শিক্ষার্থীর শ্রেণি ও প্রতিষ্ঠান অনুযায়ী বিষয় নির্ধারণ
  const getSubjectsForStudent = (student: Student) => {
    const cls = student.className || '';
    const foundKey = Object.keys(CLASS_SUBJECTS_MAP).find((key) => cls.includes(key));
    if (foundKey) return [...CLASS_SUBJECTS_MAP[foundKey]];
    return [...DEFAULT_SUBJECTS_BY_INSTITUTION[selectedInstType]];
  };

  // শিক্ষার্থীর প্রোফাইলে ক্লিক করলে নম্বর এন্ট্রি প্যানেল ওপেন
  const handleSelectStudentForResult = (student: Student) => {
    setActiveStudent(student);
    const defaultSubs = getSubjectsForStudent(student);
    setCurrentSubjects(defaultSubs);

    const initialMarks: { [subject: string]: number } = {};
    defaultSubs.forEach((sub) => {
      initialMarks[sub] = 0;
    });
    setStudentSubjectMarks(initialMarks);
    setNewSubjectInput('');
  };

  // নতুন বিষয় যোগকরণ
  const handleAddCustomSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;

    if (currentSubjects.includes(trimmed)) {
      alert('এই বিষয়টি ইতিমধ্যে তালিকায় রয়েছে!');
      return;
    }

    setCurrentSubjects((prev) => [...prev, trimmed]);
    setStudentSubjectMarks((prev) => ({ ...prev, [trimmed]: 0 }));
    setNewSubjectInput('');
  };

  // বিষয় মুছে ফেলা
  const handleRemoveSubject = (subName: string) => {
    if (currentSubjects.length <= 1) {
      alert('কমপক্ষে একটি বিষয় রাখা আবশ্যক!');
      return;
    }
    setCurrentSubjects((prev) => prev.filter((s) => s !== subName));
    setStudentSubjectMarks((prev) => {
      const copy = { ...prev };
      delete copy[subName];
      return copy;
    });
  };

  // নম্বর পরিবর্তন হ্যান্ডলার
  const handleSubjectMarkChange = (subject: string, val: string) => {
    const num = Number(val);
    setStudentSubjectMarks((prev) => ({
      ...prev,
      [subject]: isNaN(num) ? 0 : Math.min(100, Math.max(0, num)),
    }));
  };

  // নম্বর সংরক্ষণ ও প্রকাশ হ্যান্ডলার (Save & Publish)
  const handleSaveStudentResult = async () => {
    if (!activeStudent) return;
    if (currentSubjects.length === 0) {
      alert('অন্তত একটি বিষয় থাকতে হবে!');
      return;
    }

    try {
      setIsSaving(true);

      const totalPossibleMarks = currentSubjects.length * 100;
      let totalObtained = 0;

      const subjectBreakdown = currentSubjects.map((subj) => {
        const mark = studentSubjectMarks[subj] || 0;
        totalObtained += mark;

        let subGrade = 'F';
        if (mark >= 80) subGrade = 'A+';
        else if (mark >= 70) subGrade = 'A';
        else if (mark >= 60) subGrade = 'A-';
        else if (mark >= 50) subGrade = 'B';
        else if (mark >= 33) subGrade = 'C';

        return {
          subjectName: subj,
          totalMarks: 100,
          obtainedMarks: mark,
          grade: subGrade,
        };
      });

      const percentage = Math.round((totalObtained / (totalPossibleMarks || 100)) * 100);

      let grade = 'রাসিব (ফেল)';
      let gpa = 0.0;
      if (percentage >= 80) {
        grade = 'মুমতাজ (A+)';
        gpa = 5.0;
      } else if (percentage >= 70) {
        grade = 'জায়্যিদ জিদ্দান (A)';
        gpa = 4.0;
      } else if (percentage >= 60) {
        grade = 'জায়্যিদ (A-)';
        gpa = 3.5;
      } else if (percentage >= 50) {
        grade = 'মাকবুল (B)';
        gpa = 3.0;
      } else if (percentage >= 33) {
        grade = 'মাকবুল (C)';
        gpa = 2.0;
      }

      const payload = {
        student_id: activeStudent.id,
        class_name: activeStudent.className || 'সাধারণ',
        institution_type: selectedInstType,
        exam_name: examName,
        year: '২০২৬',
        subjects: subjectBreakdown,
        total_marks: totalPossibleMarks,
        obtained_marks: totalObtained,
        percentage,
        grade,
        gpa,
        published_at: new Date().toISOString(),
      };

      // ১. Supabase ক্লাউডে সংরক্ষণ
      try {
        const { error } = await supabase.from('exam_results').upsert(payload);
        if (error) {
          console.warn('Exam result cloud save warning:', error.message);
        }
      } catch (e) {
        console.warn('Cloud save error:', e);
      }

      // ২. লোকালস্টোরেজে অফলাইন ব্যাকআপ
      try {
        const storageKey = `student_result_${activeStudent.id}`;
        localStorage.setItem(storageKey, JSON.stringify(payload));

        const listKey = 'madrasa_exam_results';
        const existingList = localStorage.getItem(listKey);
        const parsed = existingList ? JSON.parse(existingList) : [];
        const filtered = parsed.filter(
          (r: any) => !(r.student_id === activeStudent.id && r.exam_name === examName)
        );
        localStorage.setItem(listKey, JSON.stringify([...filtered, payload]));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('exam_results_updated'));
        }
      } catch (e) {}

      onSuccess(
        `${activeStudent.fullNameBangla || activeStudent.fullName}-এর ফলাফল সংরক্ষিত ও প্রকাশিত হয়েছে!`
      );
      setActiveStudent(null);
    } catch (err: any) {
      alert('ফলাফল প্রকাশ করতে ত্রুটি হয়েছে: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex justify-center items-center bg-[#EDF3EF] text-[#1F2937] antialiased p-0 sm:py-4 font-hind overflow-hidden animate-in fade-in">
      <div className="relative w-full max-w-[440px] bg-[#F7FBF9] h-full sm:h-[870px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-[#DFECE5]">

        {/* ================= ১. হেডার ================= */}
        <header className="shrink-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white border border-[#E3ECE6] hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs active:scale-95 transition cursor-pointer"
            >
              <ArrowLeft size={19} className="stroke-[2.2]" />
            </button>
            <div>
              <h1 className="text-base font-black text-[#0F2F24] leading-tight">
                ফলাফল এন্ট্রি ও প্রকাশ
              </h1>
              <span className="inline-block text-[11px] font-bold text-[#008955] bg-[#E7F6ED] px-2.5 py-0.5 rounded-full mt-0.5 border border-[#D1EFE0]">
                শিক্ষার্থী: {filteredStudents.length} জন
              </span>
            </div>
          </div>

          <div className="h-10 w-10 rounded-2xl bg-[#008955] text-white flex items-center justify-center shadow-sm">
            <Award size={20} />
          </div>
        </header>

        {/* ================= ২. প্রতিষ্ঠানের ধরন নির্বাচন (মাদ্রাসা / স্কুল / মহিলা মাদ্রাসা) ================= */}
        <div className="px-4 pt-2.5 pb-1 bg-white border-b border-slate-100 shrink-0">
          <div className="bg-[#E7F6ED] p-1 rounded-2xl flex items-center gap-1 border border-[#CDEEDE]">
            {INSTITUTION_OPTIONS.map((opt) => {
              const isActive = selectedInstType === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleInstTypeChange(opt.id)}
                  className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-[#008955] text-white shadow-xs'
                      : 'text-[#0F2F24] hover:bg-white/50'
                  }`}
                >
                  <Icon size={14} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= ৩. সার্চ ও জামাত/শ্রেণি ফিল্টার ================= */}
        <div className="px-4 py-2 space-y-2 shrink-0 bg-white border-b border-slate-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, রোল, ফোন বা UID দিয়ে খুঁজুন..."
              className="w-full text-xs font-medium bg-[#F8FAF9] border border-[#DFECE5] rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#008955] shadow-2xs transition text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* সংশ্লিষ্ট প্রতিষ্ঠানের শ্রেণি সিলেক্টর পিলস */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CLASSES_BY_INSTITUTION[selectedInstType].map((pill) => {
              const isActive = selectedClass === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedClass(pill.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-[#008955] text-white shadow-xs'
                      : 'bg-white text-[#0F2F24] border border-[#DFECE5] hover:bg-slate-50'
                  }`}
                >
                  <BookOpen size={12} className={isActive ? 'text-white' : 'text-[#008955]'} />
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= ৪. পরীক্ষা নাম সিলেক্টর ================= */}
        <div className="px-4 py-2 bg-[#EFF8F3] border-b border-[#D5EBE0] shrink-0 flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F2F24]">পরীক্ষার নাম:</span>
          <select
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="text-xs font-bold text-[#008955] bg-white border border-[#C6E5D4] rounded-xl px-3 py-1 focus:outline-none cursor-pointer"
          >
            {EXAM_TYPES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* ================= ৫. শিক্ষার্থী তালিকা ================= */}
        <main className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-4 py-3 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-500 px-1">
            * শিক্ষার্থীর প্রোফাইলে চাপ দিয়ে নম্বর দিন অথবা ইচ্ছামতো বিষয় যোগ/ডিলিট করুন:
          </p>

          {filteredStudents.length > 0 ? (
            filteredStudents.map((std) => (
              <div
                key={std.id}
                onClick={() => handleSelectStudentForResult(std)}
                className="bg-white rounded-[22px] border border-[#DFECE5] p-3.5 shadow-2xs hover:border-[#008955] cursor-pointer transition active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#EFF8F3] border border-[#DCEBE2] overflow-hidden flex items-center justify-center">
                        {std.photoUrl ? (
                          <img
                            src={std.photoUrl}
                            alt={std.fullNameBangla || std.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={22} className="text-[#008955]" />
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-[#008955] text-white font-sans text-[9px] font-black px-1.5 py-0.2 rounded-md shadow-xs border border-white">
                        {String(std.rollNo || '০১').padStart(2, '0')}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-[#008955] transition truncate leading-tight">
                        {std.fullNameBangla || std.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        পিতা: {std.fatherName || 'তথ্য নেই'}
                      </p>
                      <span className="text-[9.5px] font-sans text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100 mt-0.5 inline-block">
                        UID: {std.admissionNo || 'বরাদ্দ নেই'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#008955] bg-[#E7F6ED] border border-[#CDEEDE] px-2.5 py-1 rounded-xl">
                      {std.className || 'সাধারণ'}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-[#E7F6ED] text-[#008955] flex items-center justify-center font-bold text-xs shadow-2xs group-hover:bg-[#008955] group-hover:text-white transition">
                      নম্বর
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-1 bg-white rounded-3xl border border-dashed border-slate-200">
              <AlertCircle size={28} className="mx-auto text-slate-300 mb-1" />
              <p className="text-xs font-bold text-slate-600">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
              <p className="text-[10px] text-slate-400">
                নির্বাচিত শাখা ও শ্রেণিতে কোনো সক্রিয় শিক্ষার্থীর তথ্য নেই
              </p>
            </div>
          )}
        </main>

        {/* ================= ৬. নির্বাচিত শিক্ষার্থীর নম্বর এন্ট্রি ড্রয়ার/পপআপ ================= */}
        {activeStudent && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
            <div className="bg-white rounded-t-[36px] max-h-[88%] flex flex-col shadow-2xl border-t border-[#DFECE5] overflow-hidden animate-in slide-in-from-bottom">

              {/* স্টুডেন্ট প্রোফাইল হেডার */}
              <div className="p-4 bg-[#F7FBF9] border-b border-[#DFECE5] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#EFF8F3] border border-[#DCEBE2] overflow-hidden flex items-center justify-center shrink-0">
                    {activeStudent.photoUrl ? (
                      <img src={activeStudent.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={22} className="text-[#008955]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 leading-tight truncate">
                      {activeStudent.fullNameBangla || activeStudent.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      শ্রেণি: <strong className="text-slate-700">{activeStudent.className || 'সাধারণ'}</strong> • রোল: {activeStudent.rollNo || '০১'} • UID: {activeStudent.admissionNo || activeStudent.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStudent(null)}
                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* বিষয় ও নম্বর ইনপুট এরিয়া */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">

                {/* কাস্টম নতুন বিষয় যোগ করার ইনপুট */}
                <div className="flex items-center gap-2 bg-[#F8FAF9] p-2 rounded-2xl border border-[#DFECE5]">
                  <input
                    type="text"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    placeholder="+ নতুন বিষয়ের নাম লিখুন..."
                    className="flex-1 text-xs font-semibold bg-white border border-[#DFECE5] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#008955]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubject();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="h-8 px-3 rounded-xl bg-[#008955] text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition shrink-0 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>যোগ করুন</span>
                  </button>
                </div>

                {/* বিষয়ভিত্তিক ইনপুট লিস্ট */}
                <div className="space-y-2">
                  {currentSubjects.map((subject, idx) => (
                    <div
                      key={subject}
                      className="bg-white p-3 rounded-2xl border border-[#DFECE5] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#008955] bg-[#E7F6ED] px-2 py-0.5 rounded-md inline-block mb-0.5">
                          বিষয় #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 truncate">{subject}</h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={studentSubjectMarks[subject] ?? ''}
                            onChange={(e) => handleSubjectMarkChange(subject, e.target.value)}
                            placeholder="০"
                            className="w-16 text-center text-sm font-black bg-[#F8FAF9] border border-[#C6E5D4] rounded-xl py-1.5 focus:outline-none focus:border-[#008955] font-sans"
                          />
                          <span className="text-[10px] font-bold text-slate-400 ml-1 font-sans">/ ১০০</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(subject)}
                          className="h-8 w-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition active:scale-95 cursor-pointer"
                          title="বিষয়টি বাদ দিন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* সামারি কার্ড */}
                <div className="bg-[#EFF8F3] p-3.5 rounded-2xl border border-[#C6E5D4] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F2F24]">
                    <span>মোট নম্বর:</span>
                    <span className="font-sans text-sm text-[#008955]">
                      {Object.values(studentSubjectMarks).reduce((a, b) => a + (Number(b) || 0), 0)} / {currentSubjects.length * 100}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>শতকরা হার:</span>
                    <span className="font-sans">
                      {Math.round(
                        (Object.values(studentSubjectMarks).reduce((a, b) => a + (Number(b) || 0), 0) /
                          ((currentSubjects.length * 100) || 100)) *
                          100
                      )}%
                    </span>
                  </div>
                </div>

              </div>

              {/* ফুটার বাটন */}
              <div className="p-4 bg-white border-t border-[#DFECE5] shrink-0">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveStudentResult}
                  className="w-full py-3.5 rounded-2xl bg-[#008955] hover:bg-[#007548] text-white text-xs font-black shadow-md shadow-[#008955]/20 flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>ফলাফল সংরক্ষণ করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 size={16} />
                      <span>নম্বর সংরক্ষণ ও প্রকাশ করুন</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}