'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  BookOpen,
  School,
  Users,
  UserPlus,
  User,
  Phone,
  X,
  Edit,
  ChevronRight,
  Trash2,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Plus,
  Check,
  Building2,
  CreditCard,
  MapPin,
  IdCard,
} from 'lucide-react';
import { localDb } from '@/db/localDb';
import { supabase } from '@/lib/supabaseClient';
import { checkUidAvailability } from '@/lib/uidUtils';
import type { Student, Staff, InstitutionType } from '@/types/database.types';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { useInstitution } from '@/context/InstitutionContext';
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal';
import {
  StudentFormModal,
  getClassesForInstitution,
  saveCustomClassForInstitution,
} from '@/components/admin/StudentFormModal';

export default function StudentsDirectoryPage() {
  const { currentInstitution, setInstitutionByType } = useInstitution();

  const [students, setStudents] = useState<Student[]>([]);
  const [teachersList, setTeachersList] = useState<Staff[]>([]);

  // ফটো প্রিভিউ লাইটবক্স স্টেট
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // মূল প্রতিষ্ঠান হেডার ট্যাব (মাদ্রাসা | স্কুল | মহিলা মাদ্রাসা)
  const [activeInstTab, setActiveInstTab] = useState<InstitutionType>(
    currentInstitution?.type || 'madrasa'
  );

  // গ্লোবাল ইনস্টিটিউশন চেঞ্জ হলে সিঙ্ক করা
  useEffect(() => {
    if (currentInstitution?.type && currentInstitution.type !== activeInstTab) {
      setActiveInstTab(currentInstitution.type);
      setSelectedClass('সব');
    }
  }, [currentInstitution]);

  // সাব-ক্লাস ফিল্টার স্টেট
  const [selectedClass, setSelectedClass] = useState<string>('সব');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ডায়নামিক ক্যাটাগরি/শ্রেণি যোগ করার স্টেট
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // মোডাল ও অ্যাকশন স্টেট
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // শিক্ষক অ্যাসাইনমেন্ট মোডাল স্টেট (Single & Bulk)
  const [assigningSingleStudent, setAssigningSingleStudent] = useState<Student | null>(null);
  const [bulkAssignClass, setBulkAssignClass] = useState<string | null>(null);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // সক্রিয় প্রতিষ্ঠানের জন্য ডায়নামিক শ্রেণির তালিকা
  const availableClassesForInst = useMemo(() => {
    const list = getClassesForInstitution(activeInstTab);
    return ['সব', ...list];
  }, [activeInstTab, isAddingCategory]);

  // প্রতিষ্ঠান হেডার ট্যাব পরিবর্তন হলে সিঙ্ক করা
  const handleTabChange = (tab: InstitutionType) => {
    setActiveInstTab(tab);
    setInstitutionByType(tab);
    setSelectedClass('সব');
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  // অ্যাডমিন কর্তৃক ডায়নামিক নতুন ক্যাটাগরি/শ্রেণি তৈরি
  const handleCreateNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    saveCustomClassForInstitution(activeInstTab, trimmed);
    setSelectedClass(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // শিক্ষকদের তালিকা লোড (Instant Cache First)
  const loadTeachers = async () => {
    try {
      const localStaff = await localDb.staff.toArray();
      if (localStaff && localStaff.length > 0) {
        setTeachersList(localStaff);
      }

      const { data: cloudStaff } = await supabase.from('staff').select('id, teacher_uid, full_name, name, phone, email, role, designation, assigned_class, is_class_teacher, monthly_salary, photo_url, joining_date, status');
      if (cloudStaff && cloudStaff.length > 0) {
        const mapped: Staff[] = cloudStaff.map((s: any) => ({
          id: s.id,
          teacher_uid: s.teacher_uid || s.id,
          fullName: s.full_name || s.fullName || s.name || '',
          phone: s.phone || '',
          email: s.email || '',
          role: s.role || 'teacher',
          designation: s.designation || 'শিক্ষক',
          assignedClass: s.assigned_class || '',
          isClassTeacher: s.is_class_teacher ?? false,
          monthlySalary: Number(s.monthly_salary || 0),
          photoUrl: s.photo_url || '',
          joiningDate: s.joining_date || s.joiningDate || new Date().toISOString().split('T')[0],
          status: s.status || 'active',
          createdAt: s.created_at || new Date().toISOString(),
          updatedAt: s.updated_at || new Date().toISOString(),
        }));
        setTeachersList(mapped);
      }
    } catch (e) {
      console.warn('Teacher fetch warning:', e);
    }
  };

  // শিক্ষার্থী তালিকা লোড (Instant Cache-First + Background Revalidation)
  const loadStudents = async () => {
    try {
      // ১. ফার্স্ট রিড: মিলি-সেকেন্ডে লোকালডিবি থেকে ইনস্ট্যান্ট রেন্ডার
      const localData = await localDb.students.where('status').equals('active').toArray();
      if (localData && localData.length > 0) {
        localData.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        setStudents(localData);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      // ২. ব্যাকগ্রাউন্ডে সাইলেন্ট ক্যোয়ারী
      const { data: supaStudents, error: supaErr } = await supabase
        .from('students')
        .select('*');

      if (!supaErr && supaStudents) {
        const formattedStudents: Student[] = supaStudents.map((s: any) => ({
          id: s.id,
          admissionNo: s.admission_no || s.id,
          fullName: s.full_name || s.fullName || s.name || '',
          fullNameBangla: s.full_name_bangla || s.fullNameBangla || s.full_name || s.name || '',
          institutionType: s.institution_type || s.institutionType || 'madrasa',
          className: s.class_name || s.className || 'প্লে',
          rollNo: String(s.roll || s.roll_no || ''),
          fatherName: s.father_name || s.fatherName || '',
          phone: s.phone || '',
          guardianContacts: Array.isArray(s.guardian_contacts)
            ? s.guardian_contacts
            : (typeof s.guardian_contacts === 'string'
                ? (function () { try { return JSON.parse(s.guardian_contacts); } catch (e) { return []; } })()
                : (s.phone ? [{ id: 'c_1', title: 'অভিভাবক', phone: s.phone }] : [])),
          address: s.address || '',
          bloodGroup: s.blood_group || s.bloodGroup || '',
          monthlyFee: Number(s.monthly_fee || s.monthlyFee || 0),
          photoUrl: s.photo_url || s.photoUrl || '',
          assigned_teacher_uid: s.assigned_teacher_uid || '',
          assigned_teacher_name: s.assigned_teacher_name || '',
          status: s.status || 'active',
          createdAt: s.created_at || s.createdAt,
          updatedAt: s.updated_at || s.updatedAt,
        }));

        if (formattedStudents.length > 0) {
          await localDb.students.clear();
          await localDb.students.bulkPut(formattedStudents);
        }
        setStudents(formattedStudents);
      }
    } catch (err) {
      console.error('ডাটা লোড ত্রুটি:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadTeachers();

    const channel = supabase
      .channel('realtime_students_and_staff')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => loadStudents()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        () => loadTeachers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // শিক্ষার্থী ডিলিট নিশ্চিতকরণ (Optimistic UI)
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    const targetId = studentToDelete.id;
    setStudentToDelete(null);

    setStudents((prev) => prev.filter((s) => s.id !== targetId));
    if (selectedStudent?.id === targetId) {
      setSelectedStudent(null);
    }

    try {
      await localDb.students.delete(targetId);
      await supabase.from('students').delete().eq('id', targetId);
    } catch (err) {
      console.error('শিক্ষার্থী ডিলিট এরর:', err);
    }
  };

  // একক শিক্ষার্থীকে শিক্ষকের সাথে যুক্তকরণ (Optimistic UI)
  const handleAssignSingleStudent = async () => {
    if (!assigningSingleStudent) return;
    const stdId = assigningSingleStudent.id;
    const selectedTeacherObj = teachersList.find(
      (t) => (t.teacher_uid || t.id) === selectedTeacherForAssign || t.id === selectedTeacherForAssign
    );

    const teacherName = selectedTeacherObj ? selectedTeacherObj.fullName : '';
    const teacherUidVal = selectedTeacherObj ? (selectedTeacherObj.teacher_uid || selectedTeacherObj.id) : '';

    setAssigningSingleStudent(null);
    setSelectedTeacherForAssign('');

    setStudents((prev) =>
      prev.map((s) =>
        s.id === stdId
          ? { ...s, assigned_teacher_uid: teacherUidVal, assigned_teacher_name: teacherName }
          : s
      )
    );

    try {
      await localDb.students.update(stdId, {
        assigned_teacher_uid: teacherUidVal,
        assigned_teacher_name: teacherName,
      } as any);

      await supabase
        .from('students')
        .update({
          assigned_teacher_uid: teacherUidVal,
          assigned_teacher_name: teacherName,
        })
        .eq('id', stdId);
    } catch (err: any) {
      console.error('Single assign error:', err);
    }
  };

  // বিভাগের সকল শিক্ষার্থীকে একসাথে শিক্ষক যুক্তকরণ
  const handleBulkAssignClass = async () => {
    if (!bulkAssignClass) return;

    const targetClass = bulkAssignClass;
    const selectedTeacherObj = teachersList.find(
      (t) => (t.teacher_uid || t.id) === selectedTeacherForAssign || t.id === selectedTeacherForAssign
    );

    if (!selectedTeacherObj) {
      alert('অনুগ্রহ করে একজন শিক্ষক নির্বাচন করুন!');
      return;
    }

    const teacherName = selectedTeacherObj.fullName;
    const teacherUidVal = selectedTeacherObj.teacher_uid || selectedTeacherObj.id;

    const targetStudents = students.filter(
      (s) => (s.institutionType || 'madrasa') === activeInstTab && s.className === targetClass
    );
    if (targetStudents.length === 0) {
      alert(`${targetClass} বিভাগে কোনো শিক্ষার্থী পাওয়া যায়নি!`);
      return;
    }

    const ids = targetStudents.map((s) => s.id);
    setBulkAssignClass(null);
    setSelectedTeacherForAssign('');

    setStudents((prev) =>
      prev.map((s) =>
        ids.includes(s.id)
          ? { ...s, assigned_teacher_uid: teacherUidVal, assigned_teacher_name: teacherName }
          : s
      )
    );

    try {
      for (const stdId of ids) {
        await localDb.students.update(stdId, {
          assigned_teacher_uid: teacherUidVal,
          assigned_teacher_name: teacherName,
        } as any);
      }

      await supabase
        .from('students')
        .update({
          assigned_teacher_uid: teacherUidVal,
          assigned_teacher_name: teacherName,
        })
        .in('id', ids);
    } catch (err: any) {
      console.error('Bulk assign error:', err);
    }
  };

  // বাংলা সংখ্যা কনভার্ট করে সঠিক নিউমেরিক সর্টিং হেলপার
  const parseRollNumber = (rollStr?: string): number => {
    if (!rollStr) return 99999;
    const banglaToEng: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const engStr = String(rollStr).replace(/[০-৯]/g, (w) => banglaToEng[w] || w).replace(/\D/g, '');
    const parsed = parseInt(engStr, 10);
    return isNaN(parsed) ? 99999 : parsed;
  };

  // ফিল্টারিং ও রোল অনুযায়ী নিউমেরিক সর্টিং সার্ভিস
  const filteredStudents = useMemo(() => {
    const list = students.filter((std) => {
      const stdInst = std.institutionType || 'madrasa';
      if (stdInst !== activeInstTab) return false;

      const matchClass = selectedClass === 'সব' || std.className === selectedClass;
      if (!matchClass) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (std.fullNameBangla && std.fullNameBangla.toLowerCase().includes(q)) ||
        (std.fullName && std.fullName.toLowerCase().includes(q)) ||
        (std.rollNo && std.rollNo.toString().includes(q)) ||
        (std.phone && std.phone.includes(q)) ||
        (std.address && std.address.toLowerCase().includes(q)) ||
        (std.assigned_teacher_name && std.assigned_teacher_name.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => parseRollNumber(a.rollNo) - parseRollNumber(b.rollNo));
  }, [students, activeInstTab, selectedClass, searchQuery]);

  // প্রতিষ্ঠান অনুযায়ী গণনাকরণ
  const countsByInstitution = useMemo(() => {
    let madrasa = 0;
    let school = 0;
    let mohila = 0;

    students.forEach((s) => {
      const type = s.institutionType || 'madrasa';
      if (type === 'madrasa') madrasa++;
      else if (type === 'school') school++;
      else if (type === 'mohila_madrasa') mohila++;
    });

    return { madrasa, school, mohila };
  }, [students]);

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-[#EDF3EF] text-[#1F2937] antialiased p-0 sm:py-4 font-hind overflow-hidden">
      
      {/* মোবাইল ফ্রেম কনটেইনার */}
      <div className="relative w-full max-w-[430px] bg-[#F7FBF9] h-full sm:h-[870px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-[#DFECE5]">
        
        {/* ================= ১. টপ হেডার বার ================= */}
        <header className="shrink-0 bg-[#F7FBF9] px-4 pt-4 pb-2 z-30 flex items-center justify-between border-b border-[#E7F0EB]">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="h-10 w-10 rounded-2xl bg-white border border-[#E5EFEA] flex items-center justify-center text-[#4B5563] shadow-xs active:scale-95 transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-[#1F2937] leading-none">শিক্ষার্থী তালিকা</h1>
              <p className="text-[10px] text-[#008955] font-bold mt-1 bg-[#E7F6ED] px-2 py-0.5 rounded-full inline-block font-sans">
                মোট শিক্ষার্থী: {filteredStudents.length} জন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingStudent(null);
              setIsFormModalOpen(true);
            }}
            className="h-10 w-10 rounded-2xl bg-[#008955] text-white flex items-center justify-center shadow-xs active:scale-95 transition hover:bg-[#007548] cursor-pointer"
            title="নতুন ছাত্র ভর্তি"
          >
            <UserPlus size={18} />
          </button>
        </header>

        {/* ================= ২. হেডার ফিল্টার ও নেভিগেশন ================= */}
        <div className="px-4 pt-3 pb-2 space-y-2.5 shrink-0 bg-[#F7FBF9] z-20 border-b border-[#E7F0EB]">

          {/* (ক) ৩টি মূল প্রতিষ্ঠান হেডার ট্যাব (মাদ্রাসা | স্কুল | মহিলা মাদ্রাসা) */}
          <div className="grid grid-cols-3 gap-1 bg-[#E7F0EB] p-1 rounded-2xl border border-[#D9E7E0]">
            <button
              type="button"
              onClick={() => handleTabChange('madrasa')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                activeInstTab === 'madrasa'
                  ? 'bg-[#008955] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              <BookOpen size={14} />
              <span>মাদ্রাসা ({countsByInstitution.madrasa})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('school')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                activeInstTab === 'school'
                  ? 'bg-[#008955] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              <School size={14} />
              <span>স্কুল ({countsByInstitution.school})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('mohila_madrasa')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                activeInstTab === 'mohila_madrasa'
                  ? 'bg-[#008955] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              <Users size={14} />
              <span>মহিলা ({countsByInstitution.mohila})</span>
            </button>
          </div>

          {/* (খ) সার্চ বার */}
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={`${selectedClass === 'সব' ? 'নাম, রোল, ফোন বা শিক্ষক' : selectedClass + ' শ্রেণির ছাত্র'} দিয়ে খুঁজুন...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#D9E7E0] rounded-2xl text-xs font-semibold text-slate-800 shadow-2xs focus:border-[#008955] focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* (গ) ডায়নামিক সাব-ক্লাস ফিল্টার বাটন ও নতুন ক্যাটাগরি তৈরি */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#4B5563]">শ্রেণি অনুযায়ী ফিল্টার:</span>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#008955] bg-[#E7F6ED] border border-[#BBE3D3] px-2 py-0.5 rounded-full hover:bg-[#D4EFE0] transition cursor-pointer"
              >
                <Plus size={11} />
                <span>নতুন শ্রেণি যুক্ত করুন</span>
              </button>
            </div>

            {/* অ্যাডমিনের নতুন শ্রেণি যোগ করার ইনপুট বক্স */}
            {isAddingCategory && (
              <div className="flex items-center gap-1.5 p-1.5 bg-[#E7F6ED] border border-[#BBE3D3] rounded-2xl animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="শ্রেণির নাম (যেমন: কেজী বা নাজেরা)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-white px-2.5 py-1 text-xs font-bold text-[#1F2937] rounded-xl border border-[#C6EAD7] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="px-3 py-1 rounded-xl bg-[#008955] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check size={12} />
                  <span>সেভ</span>
                </button>
              </div>
            )}

            {/* সাব-ক্লাস ক্যাটাগরি বাটন ফিল্টার */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {availableClassesForInst.map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`py-1 px-3 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#008955] text-white shadow-xs'
                        : 'bg-white text-[#4B5563] border border-[#E1EDE6] hover:bg-[#EDF4F0]'
                    }`}
                  >
                    <span>{cls}</span>
                  </button>
                );
              })}

              {/* বাল্ক অ্যাসাইন বাটন */}
              <button
                type="button"
                onClick={() => {
                  const targetCls = selectedClass === 'সব' ? availableClassesForInst[1] || 'প্লে' : selectedClass;
                  setBulkAssignClass(targetCls);
                  setSelectedTeacherForAssign('');
                }}
                className="py-1 px-2.5 rounded-xl bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs hover:bg-amber-600 active:scale-95 transition shrink-0 border border-amber-400/30 cursor-pointer"
                title="এই বিভাগের সকল শিক্ষার্থীকে একসাথে শিক্ষক যুক্ত করুন"
              >
                <Users size={11} />
                <span>Add All</span>
              </button>
            </div>
          </div>

        </div>

        {/* ================= ৩. শিক্ষার্থী তালিকা (Instant Render / Skeleton Shimmer) ================= */}
        <main className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-4 py-2 space-y-2.5">
          {isLoading && students.length === 0 ? (
            <div className="space-y-2.5 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 w-full rounded-2xl bg-[#E7F0EB] animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="group relative bg-white border border-[#E1EDE6] rounded-2xl p-2.5 flex items-center justify-between shadow-2xs hover:border-[#008955] hover:shadow-xs active:scale-[0.99] transition cursor-pointer"
              >
                {/* প্রোফাইল ইমেজ ও তথ্য */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    onClick={(e) => {
                      if (student.photoUrl) {
                        e.stopPropagation();
                        setPreviewImage({
                          url: student.photoUrl,
                          title: student.fullNameBangla || student.fullName,
                          subtitle: `শ্রেণি: ${student.className} • রোল: ${student.rollNo}`,
                        });
                      }
                    }}
                    className="relative shrink-0 cursor-pointer group/img"
                    title="ছবি সম্পূর্ণ দেখুন"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#E7F6ED] to-[#FEF3C7] border border-[#D9E7E0] overflow-hidden flex items-center justify-center text-[#008955] group-hover/img:scale-105 transition">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.fullNameBangla || student.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={22} className="text-[#008955]/70" />
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-[#008955] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md border border-white font-sans">
                      {student.rollNo || '০'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {student.fullNameBangla || student.fullName}
                    </h4>

                    {/* অ্যাসাইন করা শিক্ষকের নাম */}
                    {student.assigned_teacher_name ? (
                      <p className="text-[9px] font-bold text-[#008955] truncate mt-0.5 flex items-center gap-1">
                        <UserCheck size={11} className="text-[#008955]" />
                        <span>উস্তাদ: {student.assigned_teacher_name}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        পিতা: {student.fatherName || 'তথ্য নেই'}
                      </p>
                    )}

                    <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                      {student.phone ? `ফোন: ${student.phone}` : 'মোবাইল নেই'}
                    </p>
                  </div>
                </div>

                {/* শ্রেণি, শিক্ষক যুক্ত ও অ্যাকশন */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] font-bold text-[#008955] bg-[#E7F6ED] px-2 py-0.5 rounded-lg border border-[#CDE9DC]">
                    {student.className || 'সাধারণ'}
                  </span>

                  {/* সিঙ্গেল "Add" শিক্ষক যুক্তকরণ বাটন */}
                  <button
                    type="button"
                    onClick={() => {
                      setAssigningSingleStudent(student);
                      setSelectedTeacherForAssign(student.assigned_teacher_uid || '');
                    }}
                    className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-90 border cursor-pointer ${
                      student.assigned_teacher_name
                        ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                        : 'bg-[#E7F6ED] text-[#008955] border-[#BBE3D3] hover:bg-[#008955] hover:text-white'
                    }`}
                    title="শিক্ষকের সাথে যুক্ত করুন"
                  >
                    <UserCheck size={12} />
                    <span>{student.assigned_teacher_name ? 'চেঞ্জ' : 'Add'}</span>
                  </button>

                  {/* সরাসরি ডিলিট বাটন */}
                  <button
                    type="button"
                    onClick={() => setStudentToDelete(student)}
                    className="h-7 w-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition active:scale-90 border border-rose-100 cursor-pointer"
                    title="শিক্ষার্থী বাতিল করুন"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#E7F6ED] text-[#008955] flex items-center justify-center border border-[#BBE3D3]">
                <User size={24} />
              </div>
              <p className="text-xs font-bold text-slate-700">কোনো শিক্ষার্থী পাওয়া যায়নি!</p>
              <p className="text-[10px] text-slate-400">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
            </div>
          )}
        </main>

        {/* ================= ৪. শিক্ষার্থী বিস্তারিত প্রোফাইল মোডাল ================= */}
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 font-hind animate-in fade-in duration-200">
            <div className="relative w-full max-w-[380px] sm:max-w-[410px] rounded-[32px] bg-[#F7FBF9] shadow-2xl border border-[#DFECE5] overflow-hidden">

              {/* টপ আইডি কার্ড ব্যানার হেডার */}
              <div className="bg-gradient-to-r from-[#008955] via-emerald-600 to-teal-700 px-4 pt-4 pb-11 text-white relative flex items-start justify-between">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20">
                  <IdCard size={12} />
                  <span>শিক্ষার্থী আইডি কার্ড প্রোফাইল</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 flex items-center justify-center transition border border-white/20 active:scale-95 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* সেন্টার অ্যাভাটার / ছবি (ক্লিক করলে ফুল প্রিভিউ) */}
              <div className="relative -mt-9 flex flex-col items-center justify-center px-4">
                <div
                  onClick={() => {
                    if (selectedStudent.photoUrl) {
                      setPreviewImage({
                        url: selectedStudent.photoUrl,
                        title: selectedStudent.fullNameBangla || selectedStudent.fullName,
                        subtitle: `শ্রেণি: ${selectedStudent.className} • রোল: ${selectedStudent.rollNo} • UID: ${selectedStudent.admissionNo || selectedStudent.id}`,
                      });
                    }
                  }}
                  className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-tr from-[#E7F6ED] to-[#FEF3C7] shadow-md overflow-hidden flex items-center justify-center text-[#008955] shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition"
                  title="ছবি সম্পূর্ণ দেখতে ক্লিক করুন"
                >
                  {selectedStudent.photoUrl ? (
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.fullNameBangla || selectedStudent.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={38} className="text-[#008955]/70" />
                  )}
                </div>

                {/* নাম ও সাবটাইটেল */}
                <h3 className="text-base font-black text-slate-900 leading-tight text-center mt-2.5 px-2">
                  {selectedStudent.fullNameBangla || selectedStudent.fullName}
                </h3>
                {selectedStudent.fullNameBangla && selectedStudent.fullName && (
                  <p className="text-xs text-slate-500 font-medium text-center font-sans">
                    {selectedStudent.fullName}
                  </p>
                )}

                {/* সেন্টার্ড ব্যাজেস */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap mt-2">
                  <span className="bg-[#E7F6ED] text-[#008955] border border-[#BBE3D3] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {selectedStudent.className || 'সাধারণ'} বিভাগ
                  </span>

                  <span className="bg-[#FEF3C7] text-[#92400E] border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-sans">
                    রোল: {selectedStudent.rollNo || '০'}
                  </span>

                  <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-sans">
                    UID: {selectedStudent.admissionNo || selectedStudent.id}
                  </span>

                  {selectedStudent.bloodGroup && (
                    <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      রক্ত: {selectedStudent.bloodGroup}
                    </span>
                  )}
                </div>
              </div>

              {/* ব্যালেন্সড ২-কলাম ইনফরমেশন গ্রিড */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* পিতার নাম */}
                  <div className="bg-white p-2.5 rounded-2xl border border-[#E1EDE6] shadow-2xs space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                      <User size={11} className="text-[#008955]" />
                      <span>পিতার নাম</span>
                    </span>
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {selectedStudent.fatherName || 'তথ্য নেই'}
                    </span>
                  </div>

                  {/* উস্তাদ/শিক্ষক */}
                  <div className="bg-white p-2.5 rounded-2xl border border-[#E1EDE6] shadow-2xs space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                      <UserCheck size={11} className="text-[#008955]" />
                      <span>উস্তাদ / শিক্ষক</span>
                    </span>
                    <span className="font-bold text-[#008955] text-xs block truncate">
                      {selectedStudent.assigned_teacher_name || 'যুক্ত করা হয়নি'}
                    </span>
                  </div>

                  {/* মাসিক প্রদেয় ফি */}
                  <div className="bg-white p-2.5 rounded-2xl border border-[#E1EDE6] shadow-2xs space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                      <CreditCard size={11} className="text-[#008955]" />
                      <span>মাসিক প্রদেয় ফি</span>
                    </span>
                    <span className="font-black text-[#008955] text-xs block font-sans">
                      {selectedStudent.monthlyFee?.toLocaleString('bn-BD') || '০'} ৳
                    </span>
                  </div>

                  {/* ঠিকানা / গ্রাম */}
                  <div className="bg-white p-2.5 rounded-2xl border border-[#E1EDE6] shadow-2xs space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                      <MapPin size={11} className="text-[#008955]" />
                      <span>ঠিকানা / গ্রাম</span>
                    </span>
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {selectedStudent.address || 'তথ্য নেই'}
                    </span>
                  </div>
                </div>

                {/* অভিভাবকের মোবাইল নাম্বারসমূহ */}
                <div className="bg-white p-3 rounded-2xl border border-[#E1EDE6] shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Phone size={12} className="text-[#008955]" />
                    <span>অভিভাবকের মোবাইল নম্বরসমূহ</span>
                  </span>

                  <div className="space-y-1.5">
                    {Array.isArray(selectedStudent.guardianContacts) &&
                    selectedStudent.guardianContacts.length > 0 ? (
                      selectedStudent.guardianContacts.map((contact, idx) => (
                        <div
                          key={contact.id || idx}
                          className="flex items-center justify-between bg-[#F7FBF9] p-2 rounded-xl border border-[#E1EDE6]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-bold text-[#008955] bg-[#E7F6ED] px-2 py-0.5 rounded-md border border-[#CDE9DC]">
                              {contact.title || 'অভিভাবক'}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 font-sans truncate">
                              {contact.phone || 'নম্বর নেই'}
                            </span>
                          </div>

                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="h-6 px-2.5 rounded-lg bg-[#E7F6ED] text-[#008955] border border-[#BBE3D3] text-[10px] font-bold flex items-center gap-1 hover:bg-[#008955] hover:text-white transition active:scale-95 shrink-0"
                            >
                              <Phone size={10} />
                              <span>কল</span>
                            </a>
                          )}
                        </div>
                      ))
                    ) : selectedStudent.phone ? (
                      <div className="flex items-center justify-between bg-[#F7FBF9] p-2 rounded-xl border border-[#E1EDE6]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#008955] bg-[#E7F6ED] px-2 py-0.5 rounded-md">
                            অভিভাবক
                          </span>
                          <span className="text-xs font-semibold text-slate-800 font-sans">
                            {selectedStudent.phone}
                          </span>
                        </div>
                        <a
                          href={`tel:${selectedStudent.phone}`}
                          className="h-6 px-2.5 rounded-lg bg-[#E7F6ED] text-[#008955] border border-[#BBE3D3] text-[10px] font-bold flex items-center gap-1 hover:bg-[#008955] hover:text-white transition active:scale-95 shrink-0"
                        >
                          <Phone size={10} />
                          <span>কল</span>
                        </a>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">কোনো ফোন নম্বর দেওয়া নেই</p>
                    )}
                  </div>
                </div>

                {/* অ্যাকশন বাটনসমূহ */}
                <div className="pt-2 flex items-center justify-between border-t border-[#E7F0EB]">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="rounded-xl border border-[#D9E7E0] bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(selectedStudent);
                      setSelectedStudent(null);
                      setIsFormModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#008955] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#007548] active:scale-95 transition cursor-pointer"
                  >
                    <Edit size={13} />
                    <span>সম্পাদনা করুন</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ================= ৫. একক শিক্ষার্থী শিক্ষক অ্যাসাইন মোডাল ================= */}
        {assigningSingleStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck size={16} className="text-[#008955]" />
                  <span>উস্তাদ/শিক্ষক যুক্ত করুন</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setAssigningSingleStudent(null)}
                  className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-800">
                  ছাত্র: {assigningSingleStudent.fullNameBangla || assigningSingleStudent.fullName}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  শ্রেণি: {assigningSingleStudent.className} | রোল: {assigningSingleStudent.rollNo}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  শিক্ষক নির্বাচন করুন:
                </label>
                <select
                  value={selectedTeacherForAssign}
                  onChange={(e) => setSelectedTeacherForAssign(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#008955] focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- কোনো শিক্ষক নেই --</option>
                  {teachersList.map((teacher) => (
                    <option key={teacher.id} value={teacher.teacher_uid || teacher.id}>
                      {teacher.fullName} ({teacher.designation || 'শিক্ষক'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningSingleStudent(null)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleAssignSingleStudent}
                  disabled={isAssigning}
                  className="rounded-xl bg-[#008955] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#007548] cursor-pointer"
                >
                  {isAssigning ? 'সেভ হচ্ছে...' : 'সংরক্ষণ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ৬. বাল্ক শিক্ষক অ্যাসাইন মোডাল ================= */}
        {bulkAssignClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-[#008955] flex items-center gap-1.5">
                  <Users size={16} />
                  <span>বিভাগের সবাইকে শিক্ষক যুক্ত করুন</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setBulkAssignClass(null)}
                  className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                আপনি <span className="text-[#008955] font-black">{bulkAssignClass}</span> বিভাগের সকল শিক্ষার্থীকে নিচের শিক্ষকের সাথে যুক্ত করছেন:
              </p>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  শিক্ষক নির্বাচন করুন:
                </label>
                <select
                  value={selectedTeacherForAssign}
                  onChange={(e) => setSelectedTeacherForAssign(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#008955] focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- শিক্ষক নির্বাচন করুন --</option>
                  {teachersList.map((teacher) => (
                    <option key={teacher.id} value={teacher.teacher_uid || teacher.id}>
                      {teacher.fullName} ({teacher.designation || 'শিক্ষক'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkAssignClass(null)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleBulkAssignClass}
                  disabled={isAssigning || !selectedTeacherForAssign}
                  className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
                >
                  {isAssigning ? 'যুক্ত হচ্ছে...' : 'সবাইকে যুক্ত করুন'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ৭. ডিলিট কনফার্মেশন মোডাল ================= */}
        {studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 shadow-2xl border border-rose-100 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">শিক্ষার্থী ডিলিট নিশ্চিতকরণ</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  আপনি কি নিশ্চিত যে <span className="font-bold text-rose-600">"{studentToDelete.fullNameBangla || studentToDelete.fullName}"</span>-এর তথ্য মুছে ফেলবেন?
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  disabled={isDeleting}
                  className="rounded-xl border px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'মুছছে...' : 'হ্যাঁ, মুছুন'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ৮. তথ্য সম্পাদনা ও নতুন শিক্ষার্থী ভর্তি মোডাল ================= */}
        <StudentFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingStudent(null);
          }}
          initialData={editingStudent}
          onSave={async (studentData) => {
            const primaryPhone = studentData.phone || (studentData.guardianContacts?.[0]?.phone || '');

            if (editingStudent) {
              const oldOriginalUid = editingStudent.id;
              const newCustomUid = (studentData.admissionNo || editingStudent.admissionNo || oldOriginalUid).trim();

              const uidCheck = await checkUidAvailability(newCustomUid, oldOriginalUid);
              if (uidCheck.isTaken) {
                alert(uidCheck.message || 'এই ইউআইডিটি ইতোমধ্যে ব্যবহৃত হচ্ছে!');
                throw new Error(uidCheck.message);
              }

              const updatedRecord: Student = {
                ...editingStudent,
                ...studentData,
                id: newCustomUid,
                admissionNo: newCustomUid,
                phone: primaryPhone,
                updatedAt: new Date().toISOString(),
              };

              setStudents((prev) =>
                prev.map((s) => (s.id === oldOriginalUid ? updatedRecord : s))
              );
              setIsFormModalOpen(false);
              setEditingStudent(null);

              try {
                if (newCustomUid !== oldOriginalUid) {
                  await localDb.students.delete(oldOriginalUid);
                }
                await localDb.students.put(updatedRecord);

                const fullPayload: any = {
                  id: newCustomUid,
                  admission_no: newCustomUid,
                  name: studentData.fullNameBangla || studentData.fullName,
                  full_name: studentData.fullName || studentData.fullNameBangla,
                  full_name_bangla: studentData.fullNameBangla || studentData.fullName,
                  institution_type: studentData.institutionType || 'madrasa',
                  class_name: studentData.className,
                  roll: String(studentData.rollNo || '০১'),
                  roll_no: String(studentData.rollNo || '০১'),
                  phone: primaryPhone || null,
                  guardian_contacts: studentData.guardianContacts || [],
                  father_name: studentData.fatherName || null,
                  address: studentData.address || null,
                  blood_group: studentData.bloodGroup || null,
                  monthly_fee: Number(studentData.monthlyFee || 0),
                  photo_url: studentData.photoUrl || null,
                  assigned_teacher_uid: (editingStudent as any).assigned_teacher_uid || null,
                  assigned_teacher_name: (editingStudent as any).assigned_teacher_name || null,
                  status: studentData.status || 'active',
                  updated_at: new Date().toISOString(),
                };

                await supabase.from('students').upsert([fullPayload], { onConflict: 'id' });
              } catch (e) {
                console.error('Background save error:', e);
              }
            } else {
              const stdUid = (studentData.admissionNo || `UID-2026-${String(studentData.rollNo || Math.floor(10 + Math.random() * 90)).padStart(2, '0')}`).trim();
              const newId = stdUid;

              const uidCheck = await checkUidAvailability(newId);
              if (uidCheck.isTaken) {
                alert(uidCheck.message || 'এই ইউআইডিটি ইতোমধ্যে ব্যবহৃত হচ্ছে!');
                throw new Error(uidCheck.message);
              }

              const newRecord: Student = {
                ...studentData,
                id: newId,
                admissionNo: stdUid,
                phone: primaryPhone,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              setStudents((prev) => [newRecord, ...prev]);
              setIsFormModalOpen(false);

              try {
                await localDb.students.put(newRecord);

                const insertPayload: any = {
                  id: newId,
                  admission_no: stdUid,
                  name: studentData.fullNameBangla || studentData.fullName,
                  full_name: studentData.fullName,
                  full_name_bangla: studentData.fullNameBangla,
                  institution_type: studentData.institutionType || 'madrasa',
                  class_name: studentData.className,
                  roll: String(studentData.rollNo || '০১'),
                  roll_no: String(studentData.rollNo || '০১'),
                  phone: primaryPhone || null,
                  guardian_contacts: studentData.guardianContacts || [],
                  father_name: studentData.fatherName || null,
                  address: studentData.address || null,
                  blood_group: studentData.bloodGroup || null,
                  monthly_fee: Number(studentData.monthlyFee || 0),
                  photo_url: studentData.photoUrl || null,
                  status: 'active',
                  updated_at: new Date().toISOString(),
                };

                const { error: upsertErr } = await supabase
                  .from('students')
                  .upsert([insertPayload], { onConflict: 'id' });

                if (upsertErr) {
                  console.error('Supabase student save failed:', upsertErr);
                  alert(`সুপাবেসে সংরক্ষণ ব্যর্থ হয়েছে: ${upsertErr.message}`);
                }
              } catch (e) {
                console.error('Background save error:', e);
              }
            }
          }}
        />

        {/* ================= ৯. ফটো প্রিভিউ ফুল-স্ক্রিন মোডাল (Lightbox) ================= */}
        <ImagePreviewModal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage?.url}
          title={previewImage?.title}
          subtitle={previewImage?.subtitle}
        />

        {/* বটম নেভিগেশন বার */}
        <AdminBottomNav activeTab="students" />

      </div>
    </div>
  );
}