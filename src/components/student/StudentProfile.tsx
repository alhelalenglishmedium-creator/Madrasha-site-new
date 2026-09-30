'use client';

import React, { useMemo } from 'react';
import {
  QrCode,
  LogOut,
  Droplet,
  Building2,
  Wallet,
  ShieldCheck,
  Phone,
  User,
} from 'lucide-react';
import type { Student } from '@/types/database.types';
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal';

interface StudentProfileProps {
  student: Student;
  onLogout?: () => void;
  isSchool?: boolean;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  onLogout,
  isSchool: isSchoolProp,
}) => {
  const [photoError, setPhotoError] = React.useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState<boolean>(false);

  const isSchool = useMemo(() => {
    if (typeof isSchoolProp === 'boolean') return isSchoolProp;
    if (student?.institutionType === 'school') return true;
    const cls = (student?.className || '').toLowerCase();
    return (
      cls.includes('class') ||
      cls.includes('play') ||
      cls.includes('nursery') ||
      cls.includes('প্লে') ||
      cls.includes('কেজি') ||
      cls.includes('ওয়ান') ||
      cls.includes('টু') ||
      cls.includes('থ্রি') ||
      cls.includes('ফোর') ||
      cls.includes('ফাইভ')
    );
  }, [isSchoolProp, student?.institutionType, student?.className]);

  // নামের শুরুতে 'মুহাম্মাদ' শুধুমাত্র মাদ্রাসার জন্য প্রযোজ্য হলে দেওয়া হবে, স্কুলে সরাসরি শিক্ষার্থীর নাম
  const formattedName = useMemo(() => {
    const raw = student.fullNameBangla || student.fullName || 'শিক্ষার্থী';
    if (isSchool) return raw;
    return raw.startsWith('মুহাম্মাদ') || raw.startsWith('মোহাম্মদ') ? raw : `মুহাম্মাদ ${raw}`;
  }, [student, isSchool]);

  // ফটো অ্যাভাটার বা আদ্যক্ষর
  const avatarLetter = useMemo(() => {
    return (student.fullNameBangla || student.fullName || 'আ')
      .replace(/^মুহাম্মাদ\s+/i, '')
      .replace(/^মোহাম্মদ\s+/i, '')
      .charAt(0) || 'আ';
  }, [student]);

  const studentPhoto = student.photoUrl || (student as any).photo_url;

  return (
    <div className="space-y-3.5 pb-2 font-['Noto_Sans_Bengali',sans-serif]">
      
      {/* সেকশন হেডার */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-slate-900">ডিজিটাল স্মার্ট আইডি ও প্রোফাইল</h2>
          <p className="text-[10px] text-slate-500">শিক্ষার্থীর অফিশিয়াল পরিচিতিপত্র</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
          isSchool
            ? 'bg-blue-100 text-blue-800 border-blue-300/60'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300/60'
        } border shadow-2xs`}>
          <ShieldCheck className={`w-3 h-3 ${isSchool ? 'text-blue-600' : 'text-emerald-600'}`} /> ভেরিফাইড
        </span>
      </div>

      {/* ================= ১. ডিজিটাল স্মার্ট আইডি কার্ড ================= */}
      <div className="relative overflow-hidden rounded-[26px] bg-white border border-slate-200/80 shadow-md p-4 space-y-3.5">
        
        {/* কার্ড ব্যাকগ্রাউন্ড সফট গ্লো */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-8 -mt-8 pointer-events-none ${
          isSchool ? 'bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent' : 'bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent'
        }`} />

        {/* কার্ড হেডার */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-lg ${
              isSchool ? 'bg-blue-600 text-white' : 'bg-[#008955] text-white'
            } flex items-center justify-center font-bold text-[10px] shadow-xs`}>
              {isSchool ? 'AHEM' : 'DU'}
            </div>
            <span className={`text-[11px] font-extrabold tracking-wider uppercase ${
              isSchool ? 'text-blue-700' : 'text-[#008955]'
            }`}>
              {isSchool ? 'SCHOOL SMART CARD' : 'STUDENT SMART CARD'}
            </span>
          </div>
          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
            isSchool ? 'bg-blue-50 text-blue-800 border-blue-200/80' : 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
          }`}>
            সক্রিয় ২০২৬
          </span>
        </div>

        {/* শিক্ষার্থী ছবি ও প্রধান তথ্য */}
        <div className="flex items-center gap-3.5">
          {/* ফটো স্লট */}
          <div
            onClick={() => {
              if (studentPhoto) setIsPreviewOpen(true);
            }}
            className={`h-20 w-20 rounded-2xl p-0.5 shadow-md shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition ${
              isSchool
                ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-blue-600/15'
                : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 shadow-emerald-600/15'
            }`}
            title="ছবি সম্পূর্ণ দেখতে ক্লিক করুন"
          >
            {studentPhoto && !photoError ? (
              <img
                src={studentPhoto}
                alt={formattedName}
                className="w-full h-full object-cover rounded-[14px]"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center text-2xl font-black ${
                isSchool ? 'bg-blue-50 text-blue-700' : 'bg-[#E7F6ED] text-[#008955]'
              }`}>
                {avatarLetter}
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs flex-1 min-w-0">
            <h4 className="text-[13.5px] font-extrabold text-slate-900 leading-snug truncate">
              {formattedName}
            </h4>
            
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`font-bold text-[11px] px-2.5 py-0.5 rounded-md border inline-block ${
                isSchool
                  ? 'text-blue-700 bg-blue-50 border-blue-200/60'
                  : 'text-[#008955] bg-emerald-50 border-emerald-200/60'
              }`}>
                {isSchool ? 'রোল' : 'সিরিয়াল'}: {student.rollNo || '০১'}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-600 font-medium truncate pt-0.5">
              {isSchool ? 'শ্রেণি / ক্লাস' : 'বিভাগ'}: <span className="font-bold text-slate-800">{student.className || (isSchool ? 'Play' : 'হিফজুল কুরআন')}</span>
            </p>
            
            <p className="text-[10px] text-slate-400">
              সেশন: ২০২৬ শিক্ষাবর্ষ
            </p>
          </div>
        </div>

        {/* কার্ড ফুটার ও কিউআর কোড */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <div className="space-y-0.5">
            <p className="text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" /> অভিভাবক: <span className="font-bold text-slate-700">{student.fatherName || (isSchool ? 'তথ্য নেই' : 'মাওলানা আব্দুর রহমান')}</span>
            </p>
            <p className="text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> ফোন: <span className="font-bold font-sans text-slate-700">{student.phone || '01712-345678'}</span>
            </p>
          </div>

          <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex items-center justify-center shadow-2xs">
            <QrCode className="w-full h-full text-slate-800" />
          </div>
        </div>

      </div>

      {/* ================= ২. ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য (৩টি কার্ড ও অভিভাবক মোবাইল) ================= */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
          ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য
        </p>

        {/* একাধিক অভিভাবকের মোবাইল নম্বরসমূহ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#008955]" />
              <span>অভিভাবকের যোগাযোগ নম্বরসমূহ</span>
            </span>
            <span className="text-[9.5px] font-bold text-[#008955] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              জরুরি যোগাযোগ
            </span>
          </div>

          {student.guardianContacts && student.guardianContacts.length > 0 ? (
            <div className="space-y-2 pt-0.5">
              {student.guardianContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#F7FBF9] px-3 py-2 rounded-xl border border-[#E1EDE6]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#008955] bg-[#E7F6ED] border border-[#BBE3D3] px-2 py-0.5 rounded-md">
                      {contact.title || 'অভিভাবক'}
                    </span>
                    <span className="font-bold font-sans text-slate-800 text-xs">{contact.phone}</span>
                  </div>
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-[10px] font-bold text-[#008955] bg-white px-2.5 py-1 rounded-lg border border-[#BBE3D3] hover:bg-[#E7F6ED] transition flex items-center gap-1 shadow-2xs"
                    >
                      <Phone size={10} />
                      <span>কল দিন</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">নম্বর নেই</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#F7FBF9] px-3 py-2 rounded-xl border border-[#E1EDE6]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#008955] bg-[#E7F6ED] border border-[#BBE3D3] px-2 py-0.5 rounded-md">
                  অভিভাবক
                </span>
                <span className="font-bold font-sans text-slate-800 text-xs">{student.phone || 'তথ্য নেই'}</span>
              </div>
              {student.phone && (
                <a
                  href={`tel:${student.phone}`}
                  className="text-[10px] font-bold text-[#008955] bg-white px-2.5 py-1 rounded-lg border border-[#BBE3D3] hover:bg-[#E7F6ED] transition flex items-center gap-1 shadow-2xs"
                >
                  <Phone size={10} />
                  <span>কল দিন</span>
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          
          {/* ১. মাসিক ফি কার্ড (প্রধান হাইলাইট ও বড় কার্ড) */}
          <div className={`${
            isSchool
              ? 'bg-gradient-to-r from-blue-50 via-indigo-50/70 to-white border-blue-200/80'
              : 'bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white border-emerald-200/80'
          } rounded-2xl border p-3.5 shadow-xs flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${
                isSchool
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-600/20'
                  : 'bg-gradient-to-br from-[#008955] to-teal-600 shadow-emerald-600/20'
              } text-white flex items-center justify-center shrink-0 shadow-md`}>
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-[10.5px] ${isSchool ? 'text-blue-800' : 'text-emerald-800'} block font-bold`}>
                  {isSchool ? 'নির্ধারিত টিউশন ফি' : 'নির্ধারিত মাসিক ফি'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isSchool ? 'স্কুল টিউশন ও সেশন চার্জ' : 'খোরাকি ও সাধারণ বেতন'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-lg font-black ${isSchool ? 'text-blue-700' : 'text-[#008955]'} font-sans block`}>
                ৳ {Number(student.monthlyFee || (isSchool ? 1000 : 1500)).toLocaleString('en-US')}
              </span>
              <span className={`text-[9px] font-bold ${
                isSchool ? 'text-blue-700 bg-blue-100/80' : 'text-emerald-700 bg-emerald-100/80'
              } px-2 py-0.2 rounded-md`}>
                নিয়মিত
              </span>
            </div>
          </div>

          {/* ২. রক্তের গ্রুপ কার্ড */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                <Droplet className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10.5px] text-slate-500 block font-bold">রক্তের গ্রুপ (Blood Group)</span>
                <span className="text-xs font-bold text-slate-800">অফিশিয়াল মেডিকেল রেকর্ড</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-rose-600 font-sans bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl inline-block">
                {student.bloodGroup || (student as any).blood_group || 'নির্ধারিত নেই'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ================= ৩. মার্জিত লগআউট বাটন ================= */}
      <button
        type="button"
        onClick={() => onLogout?.()}
        className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-2xs mt-3 cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> অ্যাকাউন্ট থেকে লগআউট
      </button>

      {/* ফটো ফুল-স্ক্রিন প্রিভিউ লাইটবক্স মোডাল */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={studentPhoto}
        title={formattedName}
        subtitle={`শ্রেণি: ${student.className || 'সাধারণ'} • সিরিয়াল/রোল: ${student.rollNo || '০১'}`}
      />

    </div>
  );
};