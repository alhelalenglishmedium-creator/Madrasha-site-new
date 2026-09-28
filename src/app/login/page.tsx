'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  GraduationCap,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  LogOut,
  ShieldCheck,
  School,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Phone,
  MessageCircle,
  Sparkles,
  Lock,
  AlertCircle,
  X,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useInstitution } from '@/context/InstitutionContext';
import { INSTITUTIONS, type Institution } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, updateUserRole, logout, isLoading } = useAuth();
  const { setInstitution, currentInstitution } = useInstitution();

  // অনবোর্ডিং ফ্লো স্টেট (ধাপ ১: প্রতিষ্ঠান -> ধাপ ২: জিমেইল -> ধাপ ৩: রোল ও ইউআইডি)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);

  // লোগো ফলব্যাক এরর হ্যান্ডলিং
  const [logoError, setLogoError] = useState(false);

  // রোল ও ফর্ম স্টেট
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');
  const [identifier, setIdentifier] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // হেল্প ও সাপোর্ট মোডাল স্টেট
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // লোকাল স্টোরেজ থেকে পূর্বে সংরক্ষিত প্রতিষ্ঠান সেশন লোড
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInst = localStorage.getItem('selected_institution');
      if (savedInst) {
        try {
          const parsed = JSON.parse(savedInst);
          if (parsed && (parsed.id || parsed.type)) {
            const matched = INSTITUTIONS.find((i) => i.id === parsed.id || i.type === parsed.type);
            if (matched) {
              setSelectedInstitution(matched);
              setInstitution(matched);
            }
          }
        } catch (e) {}
      }
    }
  }, [setInstitution]);

  // ইউজার সাইন-ইন অবস্থায় থাকলে উপযুক্ত ধাপে রিডাইরেক্ট
  useEffect(() => {
    if (!isLoading) {
      if (user && user.role) {
        router.replace('/dashboard');
      } else if (user && !user.role) {
        // গুগল দিয়ে সাইন-ইন সম্পন্ন কিন্তু রোল ও ইউআইডি সেট করা হয়নি
        setCurrentStep(3);
      }
    }
  }, [user, isLoading, router]);

  // ধাপ ১: প্রতিষ্ঠান নির্বাচন
  const handleSelectInstitution = (inst: Institution) => {
    setSelectedInstitution(inst);
    setInstitution(inst);
    setErrorMessage('');
    setCurrentStep(2); // স্বয়ংক্রিয়ভাবে পরবর্তী জিমেইল সাইন-ইন ধাপে রূপান্তর
  };

  // ধাপ ৩: ভূমিকা ও ইউআইডি সাবমিট হ্যান্ডলার
  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = identifier.trim();

    if (!rawInput) {
      setErrorMessage('আপনার ইউআইডি (UID) বা রোল নম্বর প্রদান করুন।');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await updateUserRole(selectedRole, rawInput);
      if (res && res.success) {
        router.replace('/dashboard');
      } else {
        setErrorMessage(
          res?.message || 'আপনার ইউআইডিটি সঠিক নয়! সঠিক তথ্য দিন অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।'
        );
      }
    } catch (err) {
      setErrorMessage('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // থিম ডিটেকশন (মাদ্রাসা vs স্কুল)
  const isSchool = selectedInstitution?.type === 'school';
  const isMohila = selectedInstitution?.type === 'mohila_madrasa';

  // লোডিং স্টেট
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white font-['Noto_Sans_Bengali',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-slate-200">নিরাপদ সেশন যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // যদি ইউজার ইতিমধ্যে অথেনটিকেটেড থাকে এবং রিডাইরেক্ট চলমান থাকে
  if (user && user.role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white font-['Noto_Sans_Bengali',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-slate-200">ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3.5 sm:p-6 bg-slate-950 overflow-hidden font-['Noto_Sans_Bengali',sans-serif] selection:bg-emerald-500 selection:text-white">
      
      {/* ================= ডায়নামিক অ্যাম্বিয়েন্ট ব্যাকগ্রাউন্ড ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* ব্যাকগ্রাউন্ড প্যাটার্ন গ্রিড */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />

        {/* থিম অনুযায়ী ফ্লোটিং অ্যাম্বিয়েন্ট লাইট স্ফিয়ার */}
        <div
          className={`absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl transition-all duration-700 opacity-30 ${
            isSchool
              ? 'bg-blue-600'
              : isMohila
              ? 'bg-purple-600'
              : 'bg-emerald-600'
          }`}
        />
        <div
          className={`absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl transition-all duration-700 opacity-25 ${
            isSchool
              ? 'bg-cyan-500'
              : isMohila
              ? 'bg-pink-500'
              : 'bg-teal-500'
          }`}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-slate-900/40 blur-2xl" />
      </div>

      {/* ================= মূল লগইন কনটেইনার ================= */}
      <div className="relative z-10 w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-300">
        
        {/* প্রিমিয়াম এলিভেটেড কার্ড */}
        <div className="relative rounded-[32px] border border-white/10 bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/40 overflow-hidden">
          
          {/* কার্ডের উপরের অংশের হালকা বর্ডার শাইন */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent" />

          {/* ================= হেডার ও ব্র্যান্ডিং ================= */}
          <div className="text-center space-y-3 pb-2">
            
            {/* প্রাতিষ্ঠানিক লোগো ব্যাজ */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/30 p-1.5 border border-emerald-400/40 relative group">
              {!logoError ? (
                <img
                  src="/logo.png"
                  alt="Institute Logo"
                  className="w-full h-full object-contain rounded-xl"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <ShieldCheck size={34} className="stroke-[2.2]" />
              )}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs border-2 border-white">
                <Sparkles size={11} className="stroke-[2.5]" />
              </div>
            </div>

            {/* হেডিং ও সাব-হেডিং */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700 mb-1.5 shadow-2xs">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>অফিসিয়াল স্মার্ট এডুকেশন পোর্টাল</span>
              </div>
              
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug tracking-tight">
                {selectedInstitution ? selectedInstitution.name : 'আল হেলাল এডুকেশন নেটওয়ার্ক'}
              </h1>
              
              <p className="text-xs text-emerald-800 font-bold mt-0.5">
                {selectedInstitution
                  ? selectedInstitution.tagline
                  : 'কওমি মাদ্রাসা, ইসলামিক স্কুল ও মহিলা মাদ্রাসা সমন্বিত ক্যাম্পাস'}
              </p>
            </div>
          </div>

          {/* ================= ৩-ধাপের ইন্টারেক্টিভ স্টেপার ================= */}
          <div className="my-5 px-1">
            <div className="relative flex items-center justify-between">
              
              {/* ব্যাকগ্রাউন্ড কানেক্টিং লাইন */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
              
              {/* অ্যাক্টিভ প্রগ্রেস লাইন */}
              <div
                className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-500 z-0"
                style={{
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                }}
              />

              {/* ধাপ ১ নোড */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    currentStep > 1
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle2 size={15} /> : '১'}
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 ${
                    currentStep === 1 ? 'text-emerald-800' : 'text-slate-500'
                  }`}
                >
                  প্রতিষ্ঠান
                </span>
              </div>

              {/* ধাপ ২ নোড */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    currentStep > 2
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : currentStep === 2
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle2 size={15} /> : '২'}
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 ${
                    currentStep === 2 ? 'text-emerald-800' : 'text-slate-500'
                  }`}
                >
                  জিমেইল
                </span>
              </div>

              {/* ধাপ ৩ নোড */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    currentStep === 3
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  ৩
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 ${
                    currentStep === 3 ? 'text-emerald-800' : 'text-slate-500'
                  }`}
                >
                  আইডি ও রোল
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              স্ক্রিন ১: প্রতিষ্ঠান নির্বাচন (ব্র্যান্ডেড কার্ডসমূহ)
             ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-center">
                <p className="text-xs font-bold text-slate-800">
                  আপনার শিক্ষা প্রতিষ্ঠান নির্বাচন করুন
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  নিচের তালিকা থেকে আপনার শাখা বেছে নিয়ে লগইন প্রক্রিয়া শুরু করুন
                </p>
              </div>

              <div className="space-y-2.5">
                {INSTITUTIONS.map((inst) => {
                  const isSelected = selectedInstitution?.id === inst.id;
                  const isSchoolType = inst.type === 'school';
                  const isMohilaType = inst.type === 'mohila_madrasa';

                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => handleSelectInstitution(inst)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden ${
                        isSelected
                          ? isSchoolType
                            ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-md'
                            : isMohilaType
                            ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20 shadow-md'
                            : 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-md'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        
                        {/* আইকন ব্যাজ */}
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                            isSchoolType
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                              : isMohilaType
                              ? 'bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white'
                              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                          }`}
                        >
                          {isSchoolType ? (
                            <School size={20} />
                          ) : isMohilaType ? (
                            <Building2 size={20} />
                          ) : (
                            <BookOpen size={20} />
                          )}
                        </div>

                        {/* নাম ও ট্যাগলাইন */}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h2 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight truncate">
                              {inst.name}
                            </h2>
                          </div>
                          <p className="text-[10.5px] text-slate-500 font-medium truncate">
                            {inst.tagline}
                          </p>
                          <span
                            className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                              isSchoolType
                                ? 'bg-blue-100 text-blue-800'
                                : isMohilaType
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {inst.shortName}
                          </span>
                        </div>
                      </div>

                      {/* নেভিগেশন তীর */}
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 ${
                          isSelected
                            ? isSchoolType
                              ? 'bg-blue-600 text-white'
                              : isMohilaType
                              ? 'bg-purple-600 text-white'
                              : 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-700'
                        }`}
                      >
                        <ChevronRight size={18} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              স্ক্রিন ২: জিমেইল সাইন-ইন
             ========================================================= */}
          {currentStep === 2 && !user && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-300">
              
              {/* ব্যাক বাটন ও বর্তমান প্রতিষ্ঠান সামারি */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <ArrowLeft size={14} className="stroke-[2.5]" />
                  <span>প্রতিষ্ঠান পরিবর্তন</span>
                </button>

                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ধাপ ২ / ৩
                </span>
              </div>

              {/* নির্বাচিত প্রতিষ্ঠানের হাইলাইট কার্ড */}
              <div
                className={`rounded-2xl p-4 border text-center space-y-1.5 shadow-2xs ${
                  isSchool
                    ? 'bg-blue-50/60 border-blue-200'
                    : isMohila
                    ? 'bg-purple-50/60 border-purple-200'
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}
              >
                <div
                  className={`mx-auto h-11 w-11 flex items-center justify-center rounded-2xl text-white shadow-xs ${
                    isSchool
                      ? 'bg-blue-600'
                      : isMohila
                      ? 'bg-purple-600'
                      : 'bg-emerald-600'
                  }`}
                >
                  {isSchool ? <School size={22} /> : <BookOpen size={22} />}
                </div>

                <div>
                  <h2 className="text-xs font-bold text-slate-900">
                    {selectedInstitution?.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    আপনার প্রাতিষ্ঠানিক ডেটা অ্যাক্সেস করতে জিমেইল নির্বাচন করুন
                  </p>
                </div>
              </div>

              {/* গুগল অথেনটিকেশন বাটন (অফিসিয়াল ডিজাইন) */}
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/80 bg-white py-3.5 px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow active:scale-[0.98] cursor-pointer"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* সিকিউরিটি ট্রাস্ট ব্যাজ */}
              <div className="flex items-center justify-center gap-1.5 pt-2 text-[10.5px] text-slate-500 font-medium">
                <Lock size={12} className="text-emerald-600" />
                <span>256-bit SSL সুরক্ষিত • Supabase Cloud Authentication</span>
              </div>
            </div>
          )}

          {/* =========================================================
              স্ক্রিন ৩: ভূমিকা ও ইউআইডি যাচাইকরণ (Role & UID Verification)
             ========================================================= */}
          {user && !user.role && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-300">
              
              {/* ইউজার ওয়েলকাম ব্যানার */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-3.5 border border-emerald-200/80 text-center space-y-1 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <p className="text-xs font-bold text-emerald-950">
                    স্বাগতম, {user.name}!
                  </p>
                </div>
                <p className="text-[11px] font-bold text-emerald-800">
                  {selectedInstitution?.name || 'শিক্ষা প্রতিষ্ঠান'}
                </p>
                <p className="text-[10px] text-slate-600 font-medium">
                  ড্যাশবোর্ডে প্রবেশ করতে আপনার পরিচয় ও ইউআইডি নিশ্চিত করুন
                </p>
              </div>

              <form onSubmit={handleRoleSubmit} className="space-y-4">
                
                {/* ১. ভূমিকা নির্বাচন (শিক্ষার্থী বনাম শিক্ষক) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>আপনার ভূমিকা নির্বাচন করুন:</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      লগইন পোর্টাল
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    
                    {/* শিক্ষার্থী বাটন */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('student');
                        setErrorMessage('');
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all duration-200 active:scale-95 cursor-pointer ${
                        selectedRole === 'student'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                          selectedRole === 'student'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <GraduationCap size={18} />
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-bold">শিক্ষার্থী</span>
                        <span className="block text-[9px] text-slate-400 font-medium">Student Portal</span>
                      </div>
                    </button>

                    {/* শিক্ষক বাটন */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('teacher');
                        setErrorMessage('');
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all duration-200 active:scale-95 cursor-pointer ${
                        selectedRole === 'teacher'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                          selectedRole === 'teacher'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Users size={18} />
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-bold">শিক্ষক / উস্তাদ</span>
                        <span className="block text-[9px] text-slate-400 font-medium">Teacher Portal</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ২. ইউআইডি ইনপুট ফিল্ড */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      {selectedRole === 'student'
                        ? 'শিক্ষার্থী ইউআইডি (UID) বা রোল:'
                        : 'শিক্ষক আইডি / ইউআইডি:'}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">প্রয়োজনীয় তথ্য</span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <BadgeCheck size={18} className="text-emerald-600" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder={
                        selectedRole === 'student'
                          ? isSchool
                            ? 'যেমন: SCH-101, 101 বা আপনার স্কুল রোল'
                            : isMohila
                            ? 'যেমন: F-101, 101 বা আপনার আইডি'
                            : 'যেমন: MAD-101, 101 বা আপনার কওমি রোল'
                          : 'যেমন: TEA-101 বা আপনার শিক্ষক ইউআইডি'
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-2xs font-sans placeholder:text-slate-400"
                      autoFocus
                      required
                    />
                  </div>

                  {/* ফরম্যাট সহায়িকা হিন্ট */}
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                    <Sparkles size={11} className="text-amber-500 shrink-0" />
                    <span>
                      অ্যাডমিন প্যানেল বা রেজিস্ট্রেশন ফর্মে থাকা নির্ধারিত আইডি প্রদান করুন।
                    </span>
                  </div>
                </div>

                {/* ৩. শিক্ষক হলে ঐচ্ছিক পূর্ণ নাম ফিল্ড */}
                {selectedRole === 'teacher' && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-slate-700">
                      শিক্ষকের পূর্ণ নাম লিখুন (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="যেমন: মাওলানা মোঃ আব্দুল্লাহ"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-2xs"
                    />
                  </div>
                )}

                {/* ৪. এরর মেসেজ প্রদর্শনী */}
                {errorMessage && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 flex items-start gap-2 animate-in fade-in shadow-2xs">
                    <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="leading-tight">{errorMessage}</p>
                      <button
                        type="button"
                        onClick={() => setIsHelpModalOpen(true)}
                        className="text-[10.5px] font-bold text-rose-800 underline mt-1 inline-block cursor-pointer"
                      >
                        আইডি খুঁজে পাচ্ছেন না? হেল্পলাইনে কথা বলুন
                      </button>
                    </div>
                  </div>
                )}

                {/* ৫. সাবমিট বাটন */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 py-3.5 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98] shadow-md shadow-emerald-700/20 disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>পরিচয় যাচাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>লগইন নিশ্চিত করুন</span>
                      <ArrowRight size={17} className="stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              {/* অন্য জিমেইলে সাইন-ইন বাটন */}
              <div className="text-center pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 transition inline-flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <LogOut size={13} className="text-rose-500" />
                  <span>অন্য জিমেইল অ্যাকাউন্ট ব্যবহার করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= ফুটার ও হেল্পলাইন অ্যাকশন ================= */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              <HelpCircle size={13} />
              <span>লগইন সহায়তা ও হেল্পলাইন</span>
            </button>

            <span className="text-[10px] font-semibold text-slate-400 font-sans">
              v2.0 • ২০২৬
            </span>
          </div>
        </div>

        {/* নিচের সিকিউর কপিরাইট নোট */}
        <p className="text-center text-[10.5px] font-medium text-slate-400 mt-4 leading-relaxed">
          © ২০২৬ আল হেলাল এডুকেশন নেটওয়ার্ক। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>

      {/* ================= হেল্প ও সাপোর্ট মোডাল ================= */}
      {isHelpModalOpen && (
        <div
          onClick={() => setIsHelpModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Phone size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  লগইন সহায়তা ও হেল্পলাইন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                আপনার ইউআইডি (UID) বা রোল নম্বর ভুল দেখালে কিংবা জিমেইল সাইন-ইনে সমস্যা হলে অনুগ্রহ করে আমাদের অ্যাডমিন বা অফিসে যোগাযোগ করুন:
              </p>

              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2.5 text-slate-800 font-bold">
                  <Phone size={14} className="text-emerald-600" />
                  <span>অফিস হেল্পলাইন: +৮৮০ ১৩XX-XXXXXX</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-800 font-bold">
                  <MessageCircle size={14} className="text-emerald-600" />
                  <span>হোয়াটসঅ্যাপ: +৮৮০ ১৭XX-XXXXXX</span>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-2.5 text-[11px] text-emerald-800 border border-emerald-100">
                <strong>পরামর্শ:</strong> শিক্ষার্থী আইডি সাধারণত <span className="font-sans font-bold">STU-101</span> বা শুধু রোল নম্বর এবং শিক্ষক আইডি <span className="font-sans font-bold">TEA-101</span> হয়ে থাকে।
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              বুঝেছি, বন্ধ করুন
            </button>
          </div>
        </div>
      )}

    </div>
  );
}