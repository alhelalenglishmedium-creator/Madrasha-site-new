'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  UserPlus,
  GraduationCap,
  Plus,
  Check,
  Camera,
  Trash2,
  User,
  Loader2,
  IdCard,
  Sparkles,
  Phone,
  Building2,
  BookOpen,
  School,
  Users,
  AlertTriangle,
} from 'lucide-react';
import type { Student, GuardianContact, InstitutionType } from '@/types/database.types';
import { localDb } from '@/db/localDb';
import { supabase } from '@/lib/supabaseClient';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete?: (studentId: string) => Promise<void>;
  initialData?: Student | null;
}

export const INSTITUTION_OPTIONS = [
  { id: 'madrasa' as InstitutionType, name: 'মাদ্রাসা (কওমি ও হিফজ)', shortName: 'মাদ্রাসা', icon: BookOpen },
  { id: 'school' as InstitutionType, name: 'আল হেলাল স্কুল', shortName: 'স্কুল', icon: School },
  { id: 'mohila_madrasa' as InstitutionType, name: 'মহিলা কওমি মাদ্রাসা', shortName: 'মহিলা মাদ্রাসা', icon: Users },
];

export const DEFAULT_CLASSES_BY_INSTITUTION: Record<InstitutionType, string[]> = {
  madrasa: ['প্লে', 'নার্সারি', 'ইবতেদায়ী', 'হিফজুল কুরআন', 'নাজেরা', 'কিতাব বিভাগ', 'মিশকাত', 'দাওরায়ে হাদিস'],
  school: ['প্লে', 'নার্সারি', 'কেজি', 'ক্লাস ১', 'ক্লাস ২', 'ক্লাস ৩', 'ক্লাস ৪', 'ক্লাস ৫', 'ক্লাস ৬', 'ক্লাস ৭', 'ক্লাস ৮', 'ক্লাস ৯', 'ক্লাস ১০'],
  mohila_madrasa: ['প্লে', 'নার্সারি', 'মহিলা হিফজ শাখা', 'মহিলা কিতাব শাখা'],
};

// প্রতিষ্ঠান অনুযায়ী শ্রেণি তালিকা পড়ার হেল্পার
export const getClassesForInstitution = (instType: InstitutionType): string[] => {
  const baseClasses = DEFAULT_CLASSES_BY_INSTITUTION[instType] || DEFAULT_CLASSES_BY_INSTITUTION['madrasa'];
  if (typeof window !== 'undefined') {
    const savedClassesStr = localStorage.getItem(`custom_classes_${instType}`) || localStorage.getItem('madrasa_custom_classes');
    if (savedClassesStr) {
      try {
        const parsed = JSON.parse(savedClassesStr);
        if (Array.isArray(parsed)) {
          const extra = parsed.filter((c) => typeof c === 'string' && !baseClasses.includes(c));
          return [...baseClasses, ...extra];
        }
      } catch (e) {}
    }
  }
  return baseClasses;
};

// কাস্টম শ্রেণি সংরক্ষণের হেল্পার
export const saveCustomClassForInstitution = (instType: InstitutionType, newClass: string): string[] => {
  if (typeof window === 'undefined' || !newClass.trim()) return getClassesForInstitution(instType);
  const trimmed = newClass.trim();
  const key = `custom_classes_${instType}`;
  const savedStr = localStorage.getItem(key);
  let existing: string[] = [];
  if (savedStr) {
    try { existing = JSON.parse(savedStr); } catch (e) {}
  }
  if (!existing.includes(trimmed)) {
    existing.push(trimmed);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  // লেগাসি কি সিঙ্ক
  const legacyStr = localStorage.getItem('madrasa_custom_classes');
  let legacyExisting: string[] = [];
  if (legacyStr) {
    try { legacyExisting = JSON.parse(legacyStr); } catch (e) {}
  }
  if (!legacyExisting.includes(trimmed)) {
    legacyExisting.push(trimmed);
    localStorage.setItem('madrasa_custom_classes', JSON.stringify(legacyExisting));
  }

  return getClassesForInstitution(instType);
};

export function StudentFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}: StudentFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [classList, setClassList] = useState<string[]>([]);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [studentUid, setStudentUid] = useState<string>('');

  const [formData, setFormData] = useState({
    fullName: '',
    fullNameBangla: '',
    institutionType: 'madrasa' as InstitutionType,
    className: 'প্লে',
    rollNo: '',
    fatherName: '',
    phone: '',
    guardianContacts: [] as GuardianContact[],
    address: '',
    bloodGroup: '',
    monthlyFee: 1000,
    photoUrl: '',
    status: 'active' as const,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // প্রতিষ্ঠান পরিবর্তন হলে শ্রেণি তালিকা আপডেট
  const handleInstitutionChange = (newInstType: InstitutionType) => {
    const availableClasses = getClassesForInstitution(newInstType);
    setClassList(availableClasses);

    // বর্তমান সিলেক্টেড ক্লাস নতুন তালিকায় না থাকলে প্রথম ক্লাস বেছে নেওয়া হবে
    const nextClass = availableClasses.includes(formData.className)
      ? formData.className
      : (availableClasses[0] || 'প্লে');

    setFormData((prev) => ({
      ...prev,
      institutionType: newInstType,
      className: nextClass,
    }));
  };

  // নতুন কাস্টম শ্রেণি তৈরি
  const handleAddNewClass = () => {
    if (!newClassName.trim()) return;
    const trimmed = newClassName.trim();
    const updated = saveCustomClassForInstitution(formData.institutionType, trimmed);
    setClassList(updated);
    setFormData((prev) => ({ ...prev, className: trimmed }));
    setNewClassName('');
    setIsAddingClass(false);
  };

  // অভিভাবক কন্টাক্ট হ্যান্ডলার
  const handleAddContact = () => {
    setFormData((prev) => ({
      ...prev,
      guardianContacts: [
        ...prev.guardianContacts,
        { id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, title: 'অভিভাবক', phone: '' },
      ],
    }));
  };

  const handleRemoveContact = (index: number) => {
    setFormData((prev) => {
      const updated = prev.guardianContacts.filter((_, i) => i !== index);
      const firstPhone = updated.find((c) => c.phone.trim())?.phone || '';
      return {
        ...prev,
        phone: firstPhone,
        guardianContacts: updated.length > 0 ? updated : [{ id: `c_${Date.now()}`, title: 'অভিভাবক', phone: '' }],
      };
    });
  };

  const handleContactChange = (index: number, field: 'title' | 'phone', value: string) => {
    setFormData((prev) => {
      const updated = [...prev.guardianContacts];
      updated[index] = { ...updated[index], [field]: value };
      const firstPhone = updated.find((c) => c.phone.trim())?.phone || (field === 'phone' ? value : prev.phone);
      return {
        ...prev,
        phone: firstPhone,
        guardianContacts: updated,
      };
    });
  };

  // ফর্ম ডাটা ও ইনিশিয়াল ডাটা লোড
  useEffect(() => {
    if (initialData) {
      const existingContacts: GuardianContact[] =
        Array.isArray(initialData.guardianContacts) && initialData.guardianContacts.length > 0
          ? initialData.guardianContacts
          : (initialData.phone
              ? [{ id: 'c_1', title: 'অভিভাবক', phone: initialData.phone }]
              : [{ id: 'c_1', title: 'বাবা', phone: '' }]);

      const instType = initialData.institutionType || 'madrasa';
      const availableClasses = getClassesForInstitution(instType);
      setClassList(availableClasses);

      setStudentUid(initialData.admissionNo || initialData.id || '');
      setFormData({
        fullName: initialData.fullName || '',
        fullNameBangla: initialData.fullNameBangla || '',
        institutionType: instType,
        className: initialData.className || (availableClasses[0] || 'প্লে'),
        rollNo: initialData.rollNo || '',
        fatherName: initialData.fatherName || '',
        phone: initialData.phone || (existingContacts[0]?.phone || ''),
        guardianContacts: existingContacts,
        address: initialData.address || '',
        bloodGroup: initialData.bloodGroup || '',
        monthlyFee: initialData.monthlyFee || 0,
        photoUrl: initialData.photoUrl || '',
        status: (initialData.status as any) || 'active',
      });
    } else {
      const defaultInst: InstitutionType = 'madrasa';
      const availableClasses = getClassesForInstitution(defaultInst);
      setClassList(availableClasses);

      setStudentUid('');
      setFormData({
        fullName: '',
        fullNameBangla: '',
        institutionType: defaultInst,
        className: availableClasses[0] || 'প্লে',
        rollNo: '',
        fatherName: '',
        phone: '',
        guardianContacts: [{ id: 'c_1', title: 'বাবা', phone: '' }],
        address: '',
        bloodGroup: '',
        monthlyFee: 1000,
        photoUrl: '',
        status: 'active',
      });
    }
    setIsAddingClass(false);
    setNewClassName('');
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // ছবি সুপাবেস বাকেট 'madrasha' এ আপলোড হ্যান্ডলার
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('ছবির সাইজ সর্বোচ্চ ৩ মেগাবাইট হতে পারবে!');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setErrorMessage('');

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('madrasha')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.warn('সুপাবেস স্টোরেজ সতর্কতা:', uploadError.message);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({
            ...prev,
            photoUrl: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('madrasha')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          setFormData((prev) => ({
            ...prev,
            photoUrl: publicUrlData.publicUrl,
          }));
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'ছবি আপলোড করতে সমস্যা হয়েছে!');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ফর্ম সাবমিট
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullNameBangla && !formData.fullName) {
      setErrorMessage('শিক্ষার্থীর নাম প্রদান করুন!');
      return;
    }
    if (!formData.rollNo) {
      setErrorMessage('রোল নম্বর প্রদান করুন!');
      return;
    }

    const validContacts = formData.guardianContacts.filter(
      (c) => c.phone.trim() || c.title.trim()
    );
    const primaryPhone =
      formData.phone.trim() ||
      validContacts.find((c) => c.phone.trim())?.phone.trim() ||
      '';

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSave({
        ...formData,
        phone: primaryPhone,
        guardianContacts: validContacts,
        admissionNo: studentUid.trim(),
        monthlyFee: Number(formData.monthlyFee) || 0,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'ডাটা সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // শিক্ষার্থী সম্পূর্ণ মুছে ফেলা
  const handleDeleteStudent = async () => {
    if (!initialData?.id) return;
    const confirmed = window.confirm(
      `আপনি কি নিশ্চিত যে "${initialData.fullNameBangla || initialData.fullName}"-এর তথ্য চিরতরে মুছে ফেলবেন?`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete(initialData.id);
      } else {
        await localDb.students.delete(initialData.id);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage('শিক্ষার্থী মুছতে সমস্যা হয়েছে।');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 font-hind animate-in fade-in duration-200">
      
      {/* মূল মোডাল বক্স */}
      <div className="relative max-h-[88vh] w-full max-w-[390px] flex flex-col rounded-[28px] bg-[#F7FBF9] shadow-2xl border border-[#DFECE5] overflow-hidden">
        
        {/* টপ হেডার বার */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#E7F0EB] bg-[#F7FBF9]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#008955] text-white flex items-center justify-center shadow-xs">
              {initialData ? <GraduationCap size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#1F2937] leading-tight">
                {initialData ? 'শিক্ষার্থীর তথ্য পরিবর্তন' : 'নতুন শিক্ষার্থী ভর্তি'}
              </h2>
              <p className="text-[10px] text-[#008955] font-medium">সঠিক তথ্য দিয়ে পূরণ করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-white border border-[#E5EFEA] flex items-center justify-center text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition active:scale-95 shadow-2xs"
          >
            <X size={15} />
          </button>
        </div>

        {/* এরর মেসেজ */}
        {errorMessage && (
          <div className="mx-4 mt-2 rounded-xl bg-rose-50 border border-rose-100 p-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* স্ক্রলেবল ইনপুট অংশ */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          
          {/* ফটো আপলোড সেকশন */}
          <div className="flex flex-col items-center justify-center p-2.5 bg-white border border-[#D9E7E0] rounded-2xl shadow-2xs">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl rounded-tr-3xl rounded-bl-3xl bg-gradient-to-tr from-[#E7F6ED] to-[#FEF3C7] border-2 border-white shadow-xs overflow-hidden flex items-center justify-center">
                {isUploadingPhoto ? (
                  <Loader2 size={24} className="text-[#008955] animate-spin" />
                ) : formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Student Photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={30} className="text-[#008955]/60" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-[#008955] text-white flex items-center justify-center shadow-md hover:bg-[#007548] active:scale-90 transition border border-white"
                title="ছবি বাছাই করুন"
              >
                <Camera size={13} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="text-[11px] font-bold text-[#008955] hover:underline"
              >
                {isUploadingPhoto
                  ? 'ছবি আপলোড হচ্ছে...'
                  : formData.photoUrl
                  ? 'ছবি পরিবর্তন করুন'
                  : 'ছবি আপলোড করুন (Choose Photo)'}
              </button>
              {formData.photoUrl && !isUploadingPhoto && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  মুছুন
                </button>
              )}
            </div>
          </div>

          {/* ১. প্রতিষ্ঠান / শাখা নির্বাচন (Institution Selector with Lucide Icons) */}
          <div className="bg-white border border-[#D9E7E0] p-2.5 rounded-2xl shadow-2xs space-y-1.5">
            <label className="text-[10px] font-bold text-[#374151] flex items-center gap-1">
              <Building2 size={13} className="text-[#008955]" />
              <span>প্রতিষ্ঠান / শাখা নির্বাচন করুন *</span>
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              {INSTITUTION_OPTIONS.map((opt) => {
                const isSelected = formData.institutionType === opt.id;
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleInstitutionChange(opt.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition active:scale-95 ${
                      isSelected
                        ? 'bg-[#E7F6ED] border-[#008955] text-[#008955] ring-1 ring-[#008955]'
                        : 'bg-white border-[#E1EDE6] text-[#4B5563] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <IconComp size={16} className="mb-1 shrink-0" />
                    <span className="text-[10px] font-bold leading-tight">{opt.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* নাম */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-[#374151] block mb-0.5 px-1">
                শিক্ষার্থীর নাম (বাংলায়) *
              </label>
              <input
                type="text"
                placeholder="যেমন: মোঃ রাসেল হোসাইন"
                value={formData.fullNameBangla}
                onChange={(e) => setFormData({ ...formData, fullNameBangla: e.target.value })}
                className="w-full rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2937] focus:border-[#008955] focus:outline-none shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#374151] block mb-0.5 px-1">
                ইংরেজি নাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="Md. Rasel Hossain"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2937] focus:border-[#008955] focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* শিক্ষার্থী UID (স্মার্ট আইডি) */}
          <div className="bg-white border border-[#D9E7E0] p-2.5 rounded-2xl shadow-2xs space-y-1">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-[#374151] flex items-center gap-1">
                <IdCard size={13} className="text-[#008955]" />
                <span>শিক্ষার্থী UID (স্মার্ট আইডি)</span>
              </label>
              <span className="text-[9px] text-[#008955] font-semibold">লগইন আইডি</span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="যেমন: 101, S-101, 202601"
                value={studentUid}
                onChange={(e) => setStudentUid(e.target.value)}
                className="flex-1 rounded-xl border border-[#BBE3D3] bg-[#E7F6ED] px-3 py-1.5 text-xs font-black font-sans text-[#008955] focus:border-[#008955] focus:bg-white focus:outline-none transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => {
                  setStudentUid(`S-${Math.floor(100 + Math.random() * 900)}`);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shrink-0"
                title="অটো সিরিয়াল তৈরি করুন"
              >
                <Sparkles size={12} />
                <span>অটো</span>
              </button>
            </div>
          </div>

          {/* ২. ডায়নামিক শ্রেণি নির্বাচন (Dynamic Class List) */}
          <div>
            <div className="flex items-center justify-between px-1 mb-0.5">
              <label className="text-[10px] font-bold text-[#374151]">
                শ্রেণি / বিভাগ *
              </label>
              <button
                type="button"
                onClick={() => setIsAddingClass(!isAddingClass)}
                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#008955] bg-[#E7F6ED] px-1.5 py-0.2 rounded-full hover:bg-[#D4EFE0] transition"
              >
                <Plus size={10} />
                <span>নতুন শ্রেণি</span>
              </button>
            </div>

            {isAddingClass && (
              <div className="flex items-center gap-1 mb-1.5 p-1 bg-[#E7F6ED] border border-[#C6EAD7] rounded-xl">
                <input
                  type="text"
                  placeholder="যেমন: কেজী বা নাজেরা"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 bg-white px-2 py-1 text-xs font-bold text-[#1F2937] rounded-lg border border-[#BBE3D3] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddNewClass}
                  className="h-6 px-2 rounded-lg bg-[#008955] text-white text-[10px] font-bold flex items-center gap-0.5"
                >
                  <Check size={11} />
                  <span>যোগ</span>
                </button>
              </div>
            )}

            <select
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              className="w-full rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-xs font-bold text-[#1F2937] focus:border-[#008955] focus:outline-none shadow-2xs cursor-pointer"
            >
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* রোল ও রক্তের গ্রুপ */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-[#374151] block mb-0.5 px-1">
                রোল নম্বর *
              </label>
              <input
                type="text"
                placeholder="যেমন: ০১"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-xs font-bold text-[#008955] focus:border-[#008955] focus:outline-none shadow-2xs font-sans"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#374151] block mb-0.5 px-1">
                রক্তের গ্রুপ
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-xs font-bold text-rose-600 focus:border-[#008955] focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="">নির্বাচন করুন</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* পিতা ও অভিভাবকের তথ্য */}
          <div>
            <label className="text-[10px] font-bold text-[#374151] block mb-0.5 px-1">
              পিতার নাম
            </label>
            <input
              type="text"
              placeholder="পিতার নাম"
              value={formData.fatherName}
              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              className="w-full rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2937] focus:border-[#008955] focus:outline-none shadow-2xs"
            />
          </div>

          {/* একাধিক অভিভাবকের মোবাইল নম্বর */}
          <div className="bg-white border border-[#D9E7E0] p-2.5 rounded-2xl shadow-2xs space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-[#374151] flex items-center gap-1">
                <Phone size={13} className="text-[#008955]" />
                <span>অভিভাবকের মোবাইল নম্বরসমূহ *</span>
              </label>
              <button
                type="button"
                onClick={handleAddContact}
                className="inline-flex items-center gap-1 text-[9px] font-bold text-[#008955] bg-[#E7F6ED] border border-[#BBE3D3] px-2 py-0.5 rounded-full hover:bg-[#D4EFE0] transition active:scale-95"
              >
                <Plus size={10} />
                <span>নতুন নম্বর</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.guardianContacts.map((contact, index) => (
                <div
                  key={contact.id || index}
                  className="flex items-center gap-1.5 bg-[#F7FBF9] p-1.5 rounded-xl border border-[#E1EDE6]"
                >
                  <div className="w-28 shrink-0">
                    <input
                      type="text"
                      placeholder="যেমন: বাবা / মা"
                      value={contact.title}
                      onChange={(e) => handleContactChange(index, 'title', e.target.value)}
                      className="w-full rounded-lg border border-[#D9E7E0] bg-white px-2 py-1 text-xs font-bold text-[#008955] focus:border-[#008955] focus:outline-none"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="tel"
                      placeholder="017xxxxxxxx"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                      className="w-full rounded-lg border border-[#D9E7E0] bg-white px-2 py-1 text-xs font-semibold text-[#1F2937] focus:border-[#008955] focus:outline-none font-sans"
                    />
                  </div>

                  {formData.guardianContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(index)}
                      className="h-6 w-6 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition shrink-0 border border-rose-100"
                      title="নম্বরটি ডিলিট করুন"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ফি ও ঠিকানা */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-[#374151] block mb-0.5 px-1">
                মাসিক ফি (টাকা) *
              </label>
              <input
                type="number"
                placeholder="1000"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                className="w-full rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-xs font-black text-[#008955] focus:border-[#008955] focus:outline-none shadow-2xs font-sans"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#374151] block mb-0.5 px-1">
                ঠিকানা / গ্রাম
              </label>
              <input
                type="text"
                placeholder="ঠিকানা"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2937] focus:border-[#008955] focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* ফুটার বাটন */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E7F0EB]">
            {initialData ? (
              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={isDeleting || isSubmitting}
                className="flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 active:scale-95 transition disabled:opacity-50"
              >
                <Trash2 size={13} />
                <span>{isDeleting ? 'মুছছে...' : 'মুছুন'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="rounded-xl border border-[#D9E7E0] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6B7280] hover:bg-[#F3F4F6] active:scale-95 transition"
              >
                বাতিল
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhoto || isDeleting}
                className="flex items-center gap-1 rounded-xl bg-[#008955] px-4 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-[#007548] active:scale-95 transition disabled:opacity-50"
              >
                <Save size={13} />
                <span>{isSubmitting ? 'সেভ হচ্ছে...' : 'সংরক্ষণ'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}