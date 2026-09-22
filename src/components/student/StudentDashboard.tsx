'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  Award,
  CreditCard,
  ChevronRight,
  CalendarCheck,
  Receipt,
  Download,
  CalendarDays,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Megaphone,
  X,
  Trophy,
  History,
  GraduationCap,
  Medal,
  ChevronDown,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useInstitution } from '@/context/InstitutionContext';
import { localDb } from '@/db/localDb';
import { supabase } from '@/lib/supabaseClient';
import type { Student, AttendanceRecord } from '@/types/database.types';

import { StudentBottomNav } from './StudentBottomNav';
import { StudentRoutine } from './StudentRoutine';
import { StudentProfile } from './StudentProfile';
import { StudentFeeTab } from './StudentFeeTab';
import { PrayerScheduleModal } from './PrayerScheduleModal';
import { DashboardHeader } from '@/components/common/DashboardHeader';
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal';
import {
  calculateOfflinePrayerTimes,
  formatTimeBengali,
  formatCountdownBengali,
  DEFAULT_COORDINATES,
  CalculatedPrayerData,
  toBengaliNumber,
} from '@/lib/prayerCalculator';
import type { Notice } from '@/components/admin/NoticeModal';

export type StudentTab = 'home' | 'fees' | 'results' | 'notices' | 'profile';

export interface SubjectMark {
  subjectName: string;
  totalMarks: number;
  obtainedMarks: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  className: string;
  examName: string;
  year: string;
  subjects: SubjectMark[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  position: number;
  isCurrent?: boolean;
}

function calculateGrade(percentage: number): string {
  if (percentage >= 80) return 'মুমতাজ (A+)';
  if (percentage >= 70) return 'জায়্যিদ জিদ্দান (A)';
  if (percentage >= 60) return 'জায়্যিদ (A-)';
  if (percentage >= 50) return 'মাকবুল (B)';
  if (percentage >= 40) return 'রাসিব (C)';
  return 'অনুত্তীর্ণ';
}

function formatBengaliPosition(pos: number): string {
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const banglaNum = String(pos).split('').map((d) => digits[Number(d)]).join('');
  if (pos === 1) return '১ম';
  if (pos === 2) return '২য়';
  if (pos === 3) return '৩য়';
  if (pos >= 4) return `${banglaNum}তম`;
  return `${banglaNum}`;
}

export function StudentDashboard() {
  const { user, logout } = useAuth?.() || { user: null, logout: () => {} };
  const { setInstitutionByType } = useInstitution();
  const [activeTab, setActiveTab] = useState<StudentTab>('home');
  const [student, setStudent] = useState<Student | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const [avatarImgError, setAvatarImgError] = useState<boolean>(false);
  const [isRoutineOpen, setIsRoutineOpen] = useState<boolean>(false);
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState<boolean>(false);

  // অফলাইন নামাজের লাইভ ওয়াক্ত ও কাউন্টডাউন
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_COORDINATES.latitude,
    lng: DEFAULT_COORDINATES.longitude,
  });

  const [livePrayerData, setLivePrayerData] = useState<CalculatedPrayerData>(() =>
    calculateOfflinePrayerTimes(DEFAULT_COORDINATES.latitude, DEFAULT_COORDINATES.longitude)
  );

  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [todayAttendanceStatus, setTodayAttendanceStatus] = useState<'present' | 'absent' | 'leave' | 'not_taken'>('not_taken');
  const [isFeePaidThisMonth, setIsFeePaidThisMonth] = useState<boolean>(false);
  const [latestNotice, setLatestNotice] = useState<Notice | null>(null);
  const [studentNoticesList, setStudentNoticesList] = useState<Notice[]>([]);
  const [todayRoutines, setTodayRoutines] = useState<any[]>([]);
  const [isTodayRoutineLoading, setIsTodayRoutineLoading] = useState<boolean>(true);

  // ফলাফল ও হিস্ট্রি স্টেট
  const [examResultsList, setExamResultsList] = useState<ExamResult[]>([]);
  const [resultSubView, setResultSubView] = useState<'latest' | 'history'>('latest');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isResultLoading, setIsResultLoading] = useState<boolean>(true);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthISO = useMemo(() => new Date().toISOString().slice(0, 7), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          setLivePrayerData(calculateOfflinePrayerTimes(lat, lng));
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrayerData(calculateOfflinePrayerTimes(userCoords.lat, userCoords.lng));
    }, 1000);

    return () => clearInterval(interval);
  }, [userCoords]);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        let currentStudent: Student | null = null;
        const activeUid = user?.identifier || (typeof window !== 'undefined' ? localStorage.getItem('madrasa_active_uid') : null);

        const cleanUid = String(activeUid || '').toLowerCase().trim();
        const onlyDigits = cleanUid.replace(/\D/g, '');
        const uPhone = String(user?.phone || '').trim();
        const uEmail = String(user?.email || '').trim().toLowerCase();
        const authUserId = String(user?.id || '').trim().toLowerCase();

        // টিচার ড্যাশবোর্ডের মতো মাল্টি-ক্রাইটেরিয়া স্টুডেন্ট ম্যাচিং লজিক
        const isStudentMatch = (rec: any) => {
          const rId = String(rec.id || '').toLowerCase().trim();
          const rAdm = String(rec.admission_no || rec.admissionNo || rec.id || '').toLowerCase().trim();
          const rRoll = String(rec.roll || rec.roll_no || rec.rollNo || '').toLowerCase().trim();
          const rPhone = String(rec.phone || '').trim();
          const rEmail = String(rec.email || '').toLowerCase().trim();

          return (
            (authUserId && (rId === authUserId || rAdm === authUserId)) ||
            (cleanUid && (rId === cleanUid || rAdm === cleanUid || rRoll === cleanUid || rId.includes(cleanUid) || rAdm.includes(cleanUid))) ||
            (onlyDigits && (rId.endsWith(onlyDigits) || rAdm.endsWith(onlyDigits) || rRoll === onlyDigits)) ||
            (uPhone && rPhone === uPhone) ||
            (uEmail && rEmail === uEmail)
          );
        };

        const mapStudentData = (raw: any): Student => ({
          id: String(raw.id || raw.admission_no || raw.admissionNo || cleanUid),
          admissionNo: String(raw.admission_no || raw.admissionNo || raw.id || cleanUid),
          fullName: raw.full_name || raw.fullName || raw.name || user?.name || 'শিক্ষার্থী',
          fullNameBangla: raw.full_name_bangla || raw.fullNameBangla || raw.full_name || raw.name || user?.name || 'শিক্ষার্থী',
          institutionType: raw.institution_type || raw.institutionType || 'madrasa',
          fatherName: raw.father_name || raw.fatherName || 'তথ্য নেই',
          className: raw.class_name || raw.className || user?.extraData?.className || 'হিফজুল কুরআন',
          rollNo: String(raw.roll || raw.roll_no || raw.rollNo || user?.extraData?.rollNo || '০১'),
          phone: raw.phone || user?.phone || '',
          photoUrl: raw.photo_url || raw.photoUrl || user?.avatarUrl || '',
          status: (raw.status as any) || 'active',
          monthlyFee: Number(raw.monthly_fee || raw.monthlyFee || 1000),
          createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // ১. মিলি-সেকেন্ডে লোকালডিবি (Dexie Cache First) থেকে ইনস্ট্যান্ট রিড
        if (localDb?.students) {
          try {
            const allLocalStudents = await localDb.students.toArray();
            if (allLocalStudents.length > 0) {
              const found = allLocalStudents.find(isStudentMatch);
              if (found) {
                currentStudent = mapStudentData(found);
                setStudent(currentStudent);
                if (currentStudent.institutionType) {
                  setInstitutionByType(currentStudent.institutionType);
                }
              }
            }
          } catch (e) {}
        }

        // ২. যদি লোকালডিবিতে না পাওয়া যায় -> ফলব্যাক সেশন অবজেক্ট
        if (!currentStudent && (user || activeUid)) {
          currentStudent = {
            id: user?.identifier || activeUid || 'STU-101',
            admissionNo: user?.identifier || activeUid || 'STU-101',
            fullName: user?.name || 'শিক্ষার্থী',
            fullNameBangla: user?.name || 'শিক্ষার্থী',
            fatherName: 'তথ্য আপডেট করা হচ্ছে',
            className: user?.extraData?.className || 'হিফজুল কুরআন',
            rollNo: user?.extraData?.rollNo || '০১',
            phone: user?.phone || '',
            photoUrl: user?.avatarUrl || '',
            status: 'active',
            monthlyFee: 1000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setStudent(currentStudent);
        }

        // ৩. ব্যাকগ্রাউন্ডে সাইলেন্টলি (Stale-While-Revalidate) শুধুমাত্র ১টি টার্গেটেড সুপাবেস ক্যোয়ারী
        try {
          const queryVal = cleanUid || authUserId;
          if (queryVal) {
            const { data: cloudStudent } = await supabase
              .from('students')
              .select('*')
              .or(`id.eq.${queryVal},admission_no.eq.${queryVal}`)
              .maybeSingle();

            if (cloudStudent) {
              const updatedStudent = mapStudentData(cloudStudent);
              currentStudent = updatedStudent;
              setStudent(updatedStudent);
              await localDb.students.put(updatedStudent);
              if (updatedStudent.institutionType) {
                setInstitutionByType(updatedStudent.institutionType);
              }
            }
          }
        } catch (e) {}

        if (currentStudent && localDb?.students) {
          try {
            await localDb.students.put(currentStudent);
          } catch (e) {}
        }

        setStudent(currentStudent);

        if (currentStudent && currentStudent.institutionType) {
          setInstitutionByType(currentStudent.institutionType);
        }

        const activeStudentId = currentStudent?.admissionNo || currentStudent?.id || 'ADM-2026-089';
        const activeClassName = currentStudent?.className || 'হিফজুল কুরআন';

        // ১. হাজিরা
        let attendanceList: AttendanceRecord[] = [];
        try {
          const { data: supaAtt } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', currentStudent?.id || 'std_demo');

          if (supaAtt && supaAtt.length > 0) {
            attendanceList = supaAtt.map((a: any) => ({
              id: a.id,
              studentId: a.student_id,
              date: a.date,
              status: a.status,
              className: a.class_name,
              synced: true,
              createdAt: a.created_at,
            }));
          } else if (localDb?.attendance && currentStudent?.id) {
            attendanceList = await localDb.attendance.where('studentId').equals(currentStudent.id).toArray();
          }
        } catch (e) {
          console.warn('হাজিরা লোড স্কিপ');
        }

        if (attendanceList.length > 0) {
          const presentCount = attendanceList.filter((a) => a.status === 'present').length;
          const rate = Math.round((presentCount / attendanceList.length) * 100);
          setAttendanceRate(rate);

          const todayRecord = attendanceList.find((a) => a.date === todayStr);
          if (todayRecord) {
            setTodayAttendanceStatus(todayRecord.status as any);
          }
        }

        // ২. ফি
        try {
          if (currentStudent?.id) {
            const candidateIds = Array.from(
              new Set(
                [
                  String(currentStudent.id || '').trim(),
                  String(currentStudent.admissionNo || '').trim(),
                  String((currentStudent as any).identifier || '').trim(),
                  String(currentStudent.rollNo || '').trim(),
                ].filter(Boolean)
              )
            );

            const { data: feeData, error: feeErr } = await supabase
              .from('student_fees')
              .select('*')
              .in('student_id', candidateIds);

            if (feeErr) {
              console.warn('Fee fetch error:', feeErr.message);
            } else if (feeData && feeData.length > 0) {
              setIsFeePaidThisMonth(true);
            } else {
              const localFee = await localDb.feePayments.toArray();
              const hasLocal = localFee.some((p) => candidateIds.includes(String(p.studentId).trim()));
              if (hasLocal) setIsFeePaidThisMonth(true);
            }
          }
        } catch (e: any) {
          console.warn('Network error (fees):', e?.message || e);
        }

        // ৩. নোটিশ লোড ও স্মার্ট ফিল্টারিং (সুপাবেস + লোকালস্টোরেজ)
        try {
          let cloudNotices: any[] = [];
          const { data: supaNotices, error: noticeErr } = await supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false });

          if (!noticeErr && supaNotices && supaNotices.length > 0) {
            cloudNotices = supaNotices;
          } else {
            const cached = localStorage.getItem('madrasa_admin_notices') || localStorage.getItem('madrasa_notices');
            if (cached) cloudNotices = JSON.parse(cached);
          }

          const studentCandidateIds = Array.from(
            new Set([
              String(currentStudent?.id || '').trim().toLowerCase(),
              String(currentStudent?.admissionNo || '').trim().toLowerCase(),
              String((currentStudent as any)?.identifier || '').trim().toLowerCase(),
              String(currentStudent?.rollNo || '').trim().toLowerCase(),
            ].filter(Boolean))
          );

          const activeCls = String(activeClassName || currentStudent?.className || '').trim().toLowerCase();

          const relevant = cloudNotices.filter((n: any) => {
            const tType = n.target_type || n.targetAudience;
            const tId = String(n.target_id || '').trim().toLowerCase();

            if (!tType || tType === 'all') return true;
            if (tType === 'all_students' || tType === 'students_all') return true;
            if (tType === 'specific_class') {
              return tId === activeCls || tId === `std_${activeCls}`;
            }
            if (tType === 'specific_student') {
              return studentCandidateIds.includes(tId);
            }
            if (tType === `std_${activeClassName}`) return true;

            return false;
          });

          const formattedNotices: Notice[] = relevant.map((n: any) => ({
            id: String(n.id),
            title: n.title,
            description: n.description || n.content || '',
            content: n.description || n.content || '',
            category: n.category || 'জরুরি',
            target_type: n.target_type || 'all',
            target_id: n.target_id || '',
            date: n.created_at ? n.created_at.split('T')[0] : (n.date || new Date().toISOString().split('T')[0]),
            author: n.created_by || n.author || 'প্রশাসন',
          }));

          setStudentNoticesList(formattedNotices);
          if (formattedNotices.length > 0) {
            setLatestNotice(formattedNotices[0]);
          }
        } catch (e) {
          console.warn('Student notice fetch error:', e);
        }

        // ৩.৫. আজকের ক্লাসের সময়সূচি লোড (এডমিন ডেটা)
        try {
          setIsTodayRoutineLoading(true);
          const daysBengali = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
          const todayDay = daysBengali[new Date().getDay()];
          const activeCls = String(activeClassName || currentStudent?.className || '').trim();

          const { data: supaRoutines, error: rErr } = await supabase
            .from('class_routines')
            .select('*')
            .eq('class_name', activeCls)
            .eq('day', todayDay)
            .order('created_at', { ascending: true });

          if (!rErr && supaRoutines && supaRoutines.length > 0) {
            setTodayRoutines(supaRoutines);
          } else {
            const cachedKey = `madrasa_routine_${activeCls}`;
            const cached = localStorage.getItem(cachedKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              const filteredToday = parsed.filter((r: any) => r.day === todayDay || r.day === 'আজকের দিন');
              setTodayRoutines(filteredToday);
            } else {
              setTodayRoutines([]);
            }
          }
        } catch (e) {
          console.warn('Today routine fetch warning:', e);
          setTodayRoutines([]);
        } finally {
          setIsTodayRoutineLoading(false);
        }

        // ৪. পরীক্ষার ফলাফল
        setIsResultLoading(true);
        let foundRealData = false;

        try {
          const candidateIds = Array.from(
            new Set(
              [
                String(currentStudent?.id || '').trim(),
                String(currentStudent?.admissionNo || '').trim(),
                String((currentStudent as any)?.identifier || '').trim(),
                String(currentStudent?.rollNo || '').trim(),
              ].filter(Boolean)
            )
          );

          const { data: classResults, error: resultError } = await supabase
            .from('exam_results')
            .select('*')
            .or(`class_name.eq."${activeClassName}",student_id.in.(${candidateIds.map(id => `"${id}"`).join(',')})`)
            .order('created_at', { ascending: false });

          if (!resultError && classResults && classResults.length > 0) {
            const examsByName: { [examName: string]: any[] } = {};
            classResults.forEach((rec: any) => {
              const eName = rec.exam_name || 'মূল্যায়ন পরীক্ষা';
              if (!examsByName[eName]) examsByName[eName] = [];
              examsByName[eName].push(rec);
            });

            const studentExams: ExamResult[] = [];

            Object.keys(examsByName).forEach((eName, idx) => {
              const sorted = examsByName[eName].sort(
                (a, b) => Number(b.obtained_marks || 0) - Number(a.obtained_marks || 0)
              );

              sorted.forEach((rec, rankIdx) => {
                if (candidateIds.includes(String(rec.student_id).trim())) {
                  const percentage = Number(rec.percentage || (rec.total_marks ? (rec.obtained_marks / rec.total_marks) * 100 : 0));
                  studentExams.push({
                    id: rec.id,
                    studentId: rec.student_id,
                    className: rec.class_name || activeClassName,
                    examName: rec.exam_name || eName,
                    year: rec.year || '২০২৬',
                    subjects: rec.subjects || [],
                    totalMarks: Number(rec.total_marks || 0),
                    obtainedMarks: Number(rec.obtained_marks || 0),
                    percentage: Math.round(percentage),
                    grade: rec.grade || calculateGrade(percentage),
                    position: rec.position || rankIdx + 1,
                    isCurrent: idx === 0,
                  });
                }
              });
            });

            if (studentExams.length > 0) {
              setExamResultsList(studentExams);
              setSelectedExamId(studentExams[0].id);
              foundRealData = true;
            }
          }
        } catch (err) {
          console.warn('রেজাল্ট ফেচ ত্রুটি:', err);
        }

        if (!foundRealData) {
          const demoExams: ExamResult[] = [
            {
              id: 'exam_term_2_2026',
              studentId: activeStudentId,
              className: activeClassName,
              examName: '২য় সাময়িক পরীক্ষা ২০২৬',
              year: '২০২৬',
              isCurrent: true,
              subjects: [
                { subjectName: 'হিফজুল কুরআন (তিলাওয়াত ও শুনানী)', totalMarks: 100, obtainedMarks: 96 },
                { subjectName: 'তাজবীদুল কুরআন ও সিফাত মশক', totalMarks: 100, obtainedMarks: 95 },
                { subjectName: 'দীনিয়াত ও মাসনুন দোয়া', totalMarks: 100, obtainedMarks: 97 },
                { subjectName: 'আখলাক ও শৃঙ্খলা মান', totalMarks: 50, obtainedMarks: 48 },
              ],
              totalMarks: 350,
              obtainedMarks: 336,
              percentage: 96,
              grade: 'মুমতাজ (A+)',
              position: 1,
            },
            {
              id: 'exam_term_1_2026',
              studentId: activeStudentId,
              className: activeClassName,
              examName: '১ম সাময়িক পরীক্ষা ২০২৬',
              year: '২০২৬',
              isCurrent: false,
              subjects: [
                { subjectName: 'হিফজুল কুরআন (তিলাওয়াত ও শুনানী)', totalMarks: 100, obtainedMarks: 92 },
                { subjectName: 'তাজবীদুল কুরআন ও সিফাত মশক', totalMarks: 100, obtainedMarks: 91 },
                { subjectName: 'দীনিয়াত ও মাসনুন দোয়া', totalMarks: 100, obtainedMarks: 94 },
                { subjectName: 'আখলাক ও শৃঙ্খলা মান', totalMarks: 50, obtainedMarks: 45 },
              ],
              totalMarks: 350,
              obtainedMarks: 322,
              percentage: 92,
              grade: 'মুমতাজ (A+)',
              position: 2,
            },
          ];

          setExamResultsList(demoExams);
          setSelectedExamId(demoExams[0].id);
        }
      } catch (err) {
        console.error('শিক্ষার্থী তথ্য লোড ত্রুটি:', err);
      } finally {
        setIsResultLoading(false);
      }
    };

    loadStudentData();
  }, [todayStr, currentMonthISO, user, user?.identifier]);

  const displayStudent: Student = useMemo(() => {
    if (student) return student;

    const activeUid = user?.identifier || (typeof window !== 'undefined' ? localStorage.getItem('madrasa_active_uid') : null);

    return {
      id: activeUid || 'STU-101',
      admissionNo: activeUid || 'STU-101',
      fullName: user?.name || 'শিক্ষার্থী',
      fullNameBangla: user?.name || 'শিক্ষার্থী',
      className: user?.extraData?.className || 'হিফজুল কুরআন',
      section: '',
      rollNo: user?.extraData?.rollNo || '০১',
      fatherName: 'তথ্য আপডেট করা হচ্ছে',
      phone: user?.phone || '',
      photoUrl: user?.avatarUrl || '',
      monthlyFee: 1000,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [student, user]);

  const studentFormattedName = useMemo(() => {
    const raw = displayStudent.fullNameBangla || displayStudent.fullName || 'আব্দুল্লাহ মাহমুদ';
    return raw.startsWith('মুহাম্মাদ') || raw.startsWith('মোহাম্মদ') ? raw : `মুহাম্মাদ ${raw}`;
  }, [displayStudent]);

  const latestExam = useMemo(() => {
    return examResultsList.find((e) => e.isCurrent) || examResultsList[0] || null;
  }, [examResultsList]);

  const historyExam = useMemo(() => {
    return examResultsList.find((e) => e.id === selectedExamId) || examResultsList[0] || null;
  }, [examResultsList, selectedExamId]);

  const currentDisplayedExam = resultSubView === 'latest' ? latestExam : historyExam;

  const handleDownloadPdf = (exam: ExamResult | null) => {
    if (!exam) return;
    alert(`${exam.examName} (${exam.year})-এর অফিসিয়াল রেজাল্ট কার্ড PDF হিসেবে প্রস্তুত হচ্ছে...`);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-900 antialiased p-0 sm:py-4 font-['Noto_Sans_Bengali',sans-serif] overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap');
        .bengali-clean-text {
          font-family: 'Noto Sans Bengali', sans-serif !important;
          text-rendering: optimizeLegibility !important;
          font-feature-settings: 'liga' 1, 'calt' 1 !important;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <div className="relative w-full max-w-[430px] bg-[#F8FAFC] h-full sm:h-[870px] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col border border-white/20 bengali-clean-text">

        {/* ================= হেডার ================= */}
        <DashboardHeader
          onNotificationClick={() => setActiveTab('notices')}
          hasNotification={!!latestNotice}
        />

        {/* ================= স্ক্রলেবল কনটেন্ট ================= */}
        <main className="flex-1 overflow-y-auto overscroll-contain no-scrollbar p-3.5 space-y-3.5">

          {/* ================= TAB ১: হোম ================= */}
          {activeTab === 'home' && (
            <div className="space-y-3.5 pb-2 animate-in fade-in duration-200">
              <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#0D9488] p-4.5 text-white shadow-lg shadow-emerald-900/25">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-400/25 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-teal-300/20 blur-xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => {
                        if (displayStudent.photoUrl) {
                          setPreviewImage({
                            url: displayStudent.photoUrl,
                            title: studentFormattedName,
                            subtitle: `শ্রেণি: ${displayStudent.className} • রোল: ${displayStudent.rollNo} • UID: ${displayStudent.admissionNo}`,
                          });
                        }
                      }}
                      className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition"
                      title="ছবি সম্পূর্ণ দেখতে ক্লিক করুন"
                    >
                      {displayStudent.photoUrl && !avatarImgError ? (
                        <img
                          src={displayStudent.photoUrl}
                          alt={studentFormattedName}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={() => setAvatarImgError(true)}
                        />
                      ) : (
                        displayStudent.fullNameBangla?.replace(/^মুহাম্মাদ\s+/i, '').replace(/^মোহাম্মদ\s+/i, '').charAt(0) || 'আ'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-emerald-100 font-normal">আসসালামু আলাইকুম</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 rounded-full shadow-xs">
                          <Sparkles className="w-2.5 h-2.5" /> তালিবুল ইলম
                        </span>
                      </div>

                      <h2 className="text-[15px] font-bold text-white leading-normal truncate mt-0.5 tracking-wide">
                        {studentFormattedName}
                      </h2>

                      <p className="text-[11px] text-emerald-100/95 font-medium truncate mt-0.5">
                        <span>{displayStudent.className || 'হিফজুল কুরআন'}</span>
                        <span className="mx-1.5 text-emerald-300/60">•</span>
                        <span>সিরিয়াল: {displayStudent.rollNo || '০১'}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="h-8.5 w-8.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-2xs cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative z-10 mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-50 leading-relaxed">
                  <span className="flex items-center gap-1.5 font-normal tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    ১৫ রবিউস সানি, ১৪৪৮ হিজরি
                  </span>
                  <span className="font-bold bg-black/25 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/10 text-[10px]">
                    শিক্ষাবর্ষ: ২০২৬
                  </span>
                </div>
              </div>

              {latestNotice && (
                <div
                  onClick={() => setActiveTab('notices')}
                  className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-200 rounded-2xl px-3 py-2 flex items-center justify-between cursor-pointer hover:shadow-xs transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-6 w-6 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Megaphone size={12} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-amber-950 truncate">
                        {latestNotice.title}
                      </p>
                      <p className="text-[9px] text-amber-700 truncate font-sans">
                        {latestNotice.date} • {latestNotice.targetAudienceLabel || 'জরুরি নোটিশ'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                    দেখুন
                  </span>
                </div>
              )}

              {/* ওয়াক্ত ও সালাত ট্র্যাকার */}
              <div
                onClick={() => setIsPrayerModalOpen(true)}
                className="bg-white rounded-2xl border border-emerald-100 p-2.5 flex items-center justify-between shadow-xs cursor-pointer hover:border-emerald-300 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    <Clock className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 leading-normal">
                        চলমান ওয়াক্ত: {livePrayerData.currentPrayer}
                      </p>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">
                      পরবর্তী: {livePrayerData.nextPrayer} ({formatTimeBengali(livePrayerData.nextPrayerTime)})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-sans text-emerald-950 bg-gradient-to-r from-emerald-200 to-teal-200 px-3 py-1 rounded-xl shadow-2xs border border-emerald-300/60 block">
                    {formatCountdownBengali(livePrayerData.remainingSeconds)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">বাকি সময়</span>
                </div>
              </div>

              {/* ৩টি কালারফুল পরিসংখ্যান কার্ড */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-gradient-to-b from-white to-emerald-50/70 rounded-2xl border border-emerald-200/80 p-3 shadow-xs flex flex-col justify-between h-24">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                    <span>উপস্থিতি</span>
                    <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="my-0.5">
                    <span className="text-xl font-extrabold font-sans text-emerald-950">{attendanceRate}%</span>
                  </div>
                  <div>
                    <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 mt-1 block">
                      {attendanceRate >= 80 ? 'সন্তোষজনক' : 'মনোযোগ কাম্য'}
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-3 shadow-xs flex flex-col justify-between h-24 ${
                    todayAttendanceStatus === 'present'
                      ? 'bg-gradient-to-b from-white to-teal-50/70 border-teal-200/80'
                      : todayAttendanceStatus === 'absent'
                      ? 'bg-gradient-to-b from-white to-rose-50/70 border-rose-200/80'
                      : 'bg-gradient-to-b from-white to-amber-50/70 border-amber-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span>আজকের হাজিরা</span>
                    <div className="h-6 w-6 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center shadow-2xs">
                      {todayAttendanceStatus === 'present' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : todayAttendanceStatus === 'absent' ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                  </div>

                  <div className="my-0.5">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                        todayAttendanceStatus === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : todayAttendanceStatus === 'absent'
                          ? 'bg-rose-100 text-rose-800'
                          : todayAttendanceStatus === 'leave'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {todayAttendanceStatus === 'present'
                        ? 'উপস্থিত ✓'
                        : todayAttendanceStatus === 'absent'
                        ? 'অনুপস্থিত'
                        : todayAttendanceStatus === 'leave'
                        ? 'ছুটি'
                        : 'নেওয়া বাকি'}
                    </span>
                  </div>

                  <span className="text-[9px] font-medium text-slate-500">
                    {todayAttendanceStatus === 'present' ? 'ক্লাসে উপস্থিত' : 'দৈনিক হিসাব'}
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('fees')}
                  className="bg-gradient-to-b from-white to-indigo-50/70 rounded-2xl border border-indigo-200/80 p-3 shadow-xs flex flex-col justify-between h-24 cursor-pointer active:scale-95 transition"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-800">
                    <span>মাসিক ফি</span>
                    <div className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-2xs">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="my-0.5">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${
                        isFeePaidThisMonth ? 'text-indigo-800 bg-indigo-100' : 'text-rose-700 bg-rose-100'
                      }`}
                    >
                      {isFeePaidThisMonth ? 'পরিশোধিত' : 'বকেয়া'}
                    </span>
                  </div>

                  <div>
                    <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFeePaidThisMonth
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-500 w-full'
                            : 'bg-rose-400 w-1/4'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-500 mt-1 block">
                      ৳ {displayStudent.monthlyFee}
                    </span>
                  </div>
                </div>
              </div>

              {/* কুইক অ্যাকশন মেনু (সংশোধিত ৪টি আইটেম) */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    প্রয়োজনীয় মেনু ও সেবা
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700">কুইক অ্যাকশন</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: CalendarDays, label: 'ক্লাস রুটিন', grad: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/20', action: () => setIsRoutineOpen(true) },
                    { icon: Receipt, label: 'ফি ও রসিদ', grad: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20', action: () => setActiveTab('fees') },
                    { icon: Award, label: 'পরীক্ষার ফল', grad: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', action: () => setActiveTab('results') },
                    { icon: CreditCard, label: 'ডিজিটাল আইডি', grad: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/20', action: () => setActiveTab('profile') },
                  ].map((btn, idx) => {
                    const Icon = btn.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={btn.action}
                        className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-md group cursor-pointer"
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

              {/* আজকের ক্লাসের সময়সূচি (সম্পূর্ণ এডমিন ডাটাবেজ ডাইনামিক) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#008955] animate-pulse" />
                    <span className="text-xs font-bold text-slate-900">আজকের ক্লাসের সময়সূচি</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRoutineOpen(true)}
                    className="text-[11px] text-[#008955] font-bold hover:underline cursor-pointer"
                  >
                    সম্পূর্ণ দেখুন
                  </button>
                </div>

                {isTodayRoutineLoading ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    <Loader2 size={16} className="animate-spin mx-auto text-[#008955] mb-1" />
                    <span>আজকের রুটিন লোড হচ্ছে...</span>
                  </div>
                ) : todayRoutines.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {todayRoutines.map((routine, idx) => (
                      <div
                        key={routine.id || idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                          idx === 0
                            ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border-emerald-200/80'
                            : 'bg-slate-50 border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className={`font-sans font-bold text-[10px] px-2 py-0.5 rounded-md shadow-2xs shrink-0 ${
                              idx === 0
                                ? 'bg-[#008955] text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {routine.start_time || routine.startTime} - {routine.end_time || routine.endTime}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs leading-tight truncate">
                              {routine.subject_name || routine.subjectName}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              শিক্ষক: {routine.teacher_name || routine.teacherName || 'উস্তাদ নির্ধারণ করা হয়নি'}
                              {routine.room_no && ` • রুম: ${routine.room_no}`}
                            </p>
                          </div>
                        </div>

                        {idx === 0 && (
                          <span className="text-[9px] font-extrabold text-[#008955] bg-emerald-100/90 border border-emerald-300/60 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Zap className="w-2.5 h-2.5 fill-[#008955]" /> প্রথম ক্লাস
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* যদি এডমিন আজকের দিনে কোনো রুটিন এড না করে থাকে */
                  <div className="py-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-600">আজকে কোনো ক্লাস রুটিন যুক্ত করা নেই</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      অ্যাডমিন প্যানেল থেকে {displayStudent.className || 'সাধারণ'} শ্রেণির আজকের রুটিন যুক্ত করা হলে এখানে দেখাবে
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB ২: ফি ও রসিদ ================= */}
          {activeTab === 'fees' && <StudentFeeTab student={displayStudent} />}

          {/* ================= TAB ৩: প্রফেশনাল একাডেমিক ফলাফল ================= */}
          {activeTab === 'results' && (
            <div className="space-y-3.5 pb-4 animate-in fade-in duration-200">

              {/* টার্ম ও ফলাফল হিস্ট্রি সুইচ */}
              <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center border border-slate-300/60">
                <button
                  type="button"
                  onClick={() => setResultSubView('latest')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    resultSubView === 'latest'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap size={15} className={resultSubView === 'latest' ? 'text-emerald-600' : 'text-slate-500'} />
                  <span>সর্বশেষ মূল্যায়ন</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResultSubView('history')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    resultSubView === 'history'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History size={14} className={resultSubView === 'history' ? 'text-emerald-600' : 'text-slate-500'} />
                  <span>বিগত পরীক্ষার রেকর্ড</span>
                </button>
              </div>

              {isResultLoading ? (
                <div className="py-20 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent"></div>
                  <p className="mt-2 text-xs font-medium text-slate-500">একাডেমিক ফলাফল লোড হচ্ছে...</p>
                </div>
              ) : currentDisplayedExam ? (
                <>
                  {resultSubView === 'history' && examResultsList.length > 0 && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between shadow-2xs">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <History size={14} className="text-emerald-600" />
                        <span>পরীক্ষার সেশন নির্বাচন:</span>
                      </span>
                      <div className="relative">
                        <select
                          value={selectedExamId}
                          onChange={(e) => setSelectedExamId(e.target.value)}
                          className="appearance-none bg-emerald-50 text-[11px] font-bold text-emerald-800 border border-emerald-200 rounded-xl pl-3 pr-6 py-1.5 shadow-2xs focus:outline-none cursor-pointer"
                        >
                          {examResultsList.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.examName} ({exam.year})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-2.5 text-emerald-700 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        {currentDisplayedExam.examName}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {currentDisplayedExam.className || displayStudent.className} বিভাগ • শিক্ষাবর্ষ: {currentDisplayedExam.year}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-amber-950 rounded-full text-xs font-black shadow-xs border border-amber-300/60">
                      <Trophy size={13} className="text-amber-950 fill-amber-950" />
                      <span>মেধা স্থান: {formatBengaliPosition(currentDisplayedExam.position)}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
                    <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 border border-white/25 px-2 py-0.5 rounded-md text-emerald-100">
                            {currentDisplayedExam.isCurrent ? 'সর্বশেষ প্রকাশিত ফলাফল' : 'আর্কাইভ রেকর্ড'}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1.5">
                            {displayStudent.fullNameBangla}
                          </h3>
                          <p className="text-[10px] text-emerald-100/90 font-sans mt-0.5">
                            আইডি: {displayStudent.admissionNo || displayStudent.id} • রোল: {displayStudent.rollNo || '০১'}
                          </p>
                        </div>

                        <div className="text-right bg-white/10 backdrop-blur-xs border border-white/20 px-3.5 py-2 rounded-2xl">
                          <span className="text-2xl font-black font-sans text-white tracking-tight block">
                            {currentDisplayedExam.percentage}%
                          </span>
                          <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                            {currentDisplayedExam.grade}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        <span>নির্ধারিত বিষয়সমূহ</span>
                        <span>প্রাপ্ত নম্বর / পূর্ণমান</span>
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                        {currentDisplayedExam.subjects.length > 0 ? (
                          currentDisplayedExam.subjects.map((sub, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 px-3 bg-white hover:bg-slate-50 transition"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="text-slate-800 font-bold text-[11.5px] block truncate">
                                  {sub.subjectName}
                                </span>
                                <span className="text-[9.5px] text-slate-400 font-sans">
                                  পূর্ণমান: {toBengaliNumber(sub.totalMarks)}
                                </span>
                              </div>

                              <div className="shrink-0 font-sans font-bold text-slate-900 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl text-xs">
                                <span className="text-emerald-700 font-extrabold">{toBengaliNumber(sub.obtainedMarks)}</span>
                                <span className="text-slate-400 text-[10px]"> / {toBengaliNumber(sub.totalMarks)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400">
                            কোনো বিস্তারিত বিষয়ের নম্বর পাওয়া যায়নি।
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Medal size={16} className="text-emerald-700" />
                          <span className="font-bold text-slate-800">সর্বমোট প্রাপ্ত নম্বর:</span>
                        </div>
                        <span className="font-sans font-black text-sm text-emerald-800">
                          {toBengaliNumber(currentDisplayedExam.obtainedMarks)} / {toBengaliNumber(currentDisplayedExam.totalMarks)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(currentDisplayedExam)}
                        className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-xs cursor-pointer"
                      >
                        <Download size={15} />
                        <span>অফিশিয়াল রেজাল্ট কার্ড (PDF)</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-2xs space-y-2 mt-4">
                  <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                    <Award size={30} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-2">
                    এখনো কোনো ফলাফল প্রকাশিত হয়নি
                  </h3>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    মাদ্রাসার অ্যাডমিন প্যানেল থেকে নম্বর এন্ট্রি সম্পন্ন হলে এই প্যানেলে আপনার বিস্তারিত মূল্যায়ন ও মেধা স্থান দেখা যাবে।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB ৪: নোটিশ ================= */}
          {activeTab === 'notices' && (
            <div className="space-y-3 pb-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-900">মাদ্রাসার নোটিশ বোর্ড</h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {displayStudent.className}
                </span>
              </div>

              {studentNoticesList.length > 0 ? (
                studentNoticesList.map((notice) => (
                  <div key={notice.id} className="bg-white rounded-2xl border-l-4 border-l-emerald-600 border-slate-200/80 p-3.5 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {notice.category || 'সাধারণ'}
                      </span>
                      <span className="text-slate-400 font-sans">{notice.date}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{notice.title}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-line">
                      {notice.content || notice.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                  <Bell className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-bold text-slate-700">কোনো নোটিশ নেই</p>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB ৫: প্রোফাইল ================= */}
          {activeTab === 'profile' && <StudentProfile student={displayStudent} onLogout={logout} />}
        </main>

        <StudentBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* ক্লাস রুটিন ফুল পেজ স্ক্রিন (Full Page Screen View) */}
      {isRoutineOpen && (
        <div className="absolute inset-0 z-[150] bg-[#F8FAFC] flex flex-col font-['Noto_Sans_Bengali',sans-serif] animate-in slide-in-from-right duration-200">

          {/* ফুল পেজ ব্র্যান্ডেড হেডার */}
          <header className="shrink-0 bg-white px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRoutineOpen(false)}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer shadow-2xs"
                title="পিছনে যান"
              >
                <ArrowLeft size={18} className="stroke-[2.2]" />
              </button>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  ক্লাস রুটিন ও সময়সূচি
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-[#008955] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {displayStudent.className || 'সাধারণ'} বিভাগ
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">• শিক্ষাবর্ষ ২০২৬</span>
                </div>
              </div>
            </div>

            <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarDays size={18} />
            </div>
          </header>

          {/* ফুল পেজ বডি */}
          <main className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
            <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-bold text-sky-100 bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  দৈনিক সময়সূচি
                </span>
                <h3 className="text-xs sm:text-sm font-bold leading-tight">
                  {displayStudent.fullNameBangla || displayStudent.fullName}-এর রুটিন
                </h3>
                <p className="text-[10px] text-sky-100 mt-0.5 font-medium">
                  শ্রেণি: {displayStudent.className} • রোল: {displayStudent.rollNo}
                </p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/20">
                <Clock size={20} />
              </div>
            </div>

            {/* ক্লাস রুটিনের তালিকা */}
            <StudentRoutine classNameProp={displayStudent.className} />
          </main>

        </div>
      )}

      {/* নামাজের সময়সূচি মোডাল */}
      <PrayerScheduleModal
        isOpen={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
      />

      {/* ফটো ফুল-স্ক্রিন প্রিভিউ লাইটবক্স মোডাল */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
      />
    </div>
  );
}