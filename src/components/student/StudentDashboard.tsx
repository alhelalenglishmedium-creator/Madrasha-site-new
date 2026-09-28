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
import { StudentStudyView } from './StudentStudyView';
import { MadrasaStudentHome } from './MadrasaStudentHome';
import { SchoolStudentHome } from './SchoolStudentHome';
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
  const { currentInstitution, setInstitutionByType } = useInstitution();
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

          const rRollClean = rRoll.replace(/\D/g, '');
          const matchRoll = Boolean(
            onlyDigits &&
            rRollClean &&
            (rRollClean === onlyDigits ||
              rRollClean.padStart(2, '0') === onlyDigits.padStart(2, '0') ||
              String(parseInt(rRollClean, 10)) === String(parseInt(onlyDigits, 10)))
          );

          return (
            (authUserId && (rId === authUserId || rAdm === authUserId)) ||
            (cleanUid && (rId === cleanUid || rAdm === cleanUid || rRoll === cleanUid)) ||
            matchRoll ||
            (onlyDigits && onlyDigits.length >= 3 && (rId.endsWith(onlyDigits) || rAdm.endsWith(onlyDigits))) ||
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

        // ৩. ব্যাকগ্রাউন্ডে সাইলেন্টলি (Stale-While-Revalidate) মাল্টি-ফিল্ড সুপাবেস ক্যোয়ারী
        try {
          const queryVal = cleanUid || authUserId;
          if (queryVal) {
            const rollClean = queryVal.replace(/\D/g, '');
            const rollPadded = rollClean ? rollClean.padStart(2, '0') : '';
            const rollRaw = rollClean ? String(parseInt(rollClean, 10)) : '';

            const orConditions = [
              `id.eq.${queryVal}`,
              `admission_no.eq.${queryVal}`,
              `roll.eq.${queryVal}`,
              `roll_no.eq.${queryVal}`,
            ];
            if (rollPadded && rollPadded !== queryVal) {
              orConditions.push(`roll.eq.${rollPadded}`, `roll_no.eq.${rollPadded}`);
            }
            if (rollRaw && rollRaw !== queryVal) {
              orConditions.push(`roll.eq.${rollRaw}`, `roll_no.eq.${rollRaw}`);
            }

            const { data: cloudStudent } = await supabase
              .from('students')
              .select('*')
              .or(Array.from(new Set(orConditions)).join(','))
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

            let allFees: any[] = [];
            if (!feeErr && feeData && feeData.length > 0) {
              allFees = feeData;
            } else {
              const localFee = await localDb.feePayments.toArray();
              allFees = localFee.filter((p) => candidateIds.includes(String(p.studentId).trim()));
            }

            const now = new Date();
            const currentMonthISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const currentMonthIdx = now.getMonth();
            const BENGALI_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
            const ENGLISH_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
            const currentMonthBn = BENGALI_MONTHS[currentMonthIdx];
            const currentMonthEn = ENGLISH_MONTHS[currentMonthIdx];
            const currentYear = now.getFullYear().toString();
            const currentMonthNum = currentMonthIdx + 1;

            const isPaid = allFees.some((f) => {
              const mStr = String(f.month || '').toLowerCase();
              const pDate = String(f.paid_at || f.paymentDate || f.created_at || '');
              return (
                pDate.startsWith(currentMonthISO) ||
                mStr.includes(currentMonthISO) ||
                mStr.includes(currentMonthBn.toLowerCase()) ||
                mStr.includes(currentMonthEn) ||
                (mStr.includes(currentYear) && mStr.includes(String(currentMonthNum)))
              );
            });

            setIsFeePaidThisMonth(isPaid);
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

          let classResults: any[] = [];
          try {
            if (activeClassName) {
              const { data: clsData } = await supabase
                .from('exam_results')
                .select('*')
                .eq('class_name', activeClassName)
                .order('created_at', { ascending: false });
              if (clsData && clsData.length > 0) {
                classResults = clsData;
              }
            }

            if (candidateIds.length > 0) {
              const { data: stdData } = await supabase
                .from('exam_results')
                .select('*')
                .in('student_id', candidateIds)
                .order('created_at', { ascending: false });
              if (stdData && stdData.length > 0) {
                const existingIds = new Set(classResults.map((r: any) => String(r.id)));
                for (const r of stdData) {
                  if (!existingIds.has(String(r.id))) {
                    classResults.push(r);
                  }
                }
              }
            }
          } catch (fetchErr) {
            console.warn('Exam query warning:', fetchErr);
          }

          if (classResults.length > 0) {
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
          setExamResultsList([]);
          setSelectedExamId('');
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
      institutionType: (user?.extraData?.institutionType as any) || currentInstitution?.type || 'madrasa',
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
  }, [student, user, currentInstitution?.type]);

  const isSchool = useMemo(() => {
    if (displayStudent.institutionType === 'school') return true;
    if (currentInstitution?.type === 'school') return true;
    const cls = (displayStudent.className || '').toLowerCase();
    if (
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
    ) {
      if (displayStudent.institutionType !== 'madrasa') return true;
    }
    return false;
  }, [displayStudent.institutionType, displayStudent.className, currentInstitution?.type]);

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
    <div className={`fixed inset-0 flex justify-center items-center ${isSchool ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950'} text-slate-900 antialiased p-0 sm:py-4 font-['Noto_Sans_Bengali',sans-serif] overflow-hidden`}>
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

          {/* ================= TAB ১: হোম (মাদ্রাসা vs স্কুল সম্পূর্ণ আলাদা ইন্টারফেস) ================= */}
          {activeTab === 'home' && (
            isSchool ? (
              <SchoolStudentHome
                student={displayStudent}
                studentFormattedName={studentFormattedName}
                avatarImgError={avatarImgError}
                setAvatarImgError={setAvatarImgError}
                setPreviewImage={setPreviewImage}
                setActiveTab={setActiveTab}
                setIsRoutineOpen={setIsRoutineOpen}
                latestNotice={latestNotice}
                attendanceRate={attendanceRate}
                isFeePaidThisMonth={isFeePaidThisMonth}
              />
            ) : (
              <MadrasaStudentHome
                student={displayStudent}
                studentFormattedName={studentFormattedName}
                avatarImgError={avatarImgError}
                setAvatarImgError={setAvatarImgError}
                setPreviewImage={setPreviewImage}
                setActiveTab={setActiveTab}
                setIsRoutineOpen={setIsRoutineOpen}
                setIsPrayerModalOpen={setIsPrayerModalOpen}
                latestNotice={latestNotice}
                livePrayerData={livePrayerData}
                attendanceRate={attendanceRate}
                isFeePaidThisMonth={isFeePaidThisMonth}
              />
            )
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
                <div className="space-y-3 py-2 animate-pulse">
                  <div className="h-28 rounded-3xl bg-slate-200/70 p-4 border border-slate-200 flex flex-col justify-between">
                    <div className="h-4 w-32 bg-slate-300/80 rounded-lg" />
                    <div className="flex justify-between items-center">
                      <div className="h-8 w-24 bg-slate-300/80 rounded-xl" />
                      <div className="h-8 w-20 bg-slate-300/80 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 rounded-2xl bg-white border border-slate-200/80 p-3 flex justify-between items-center">
                      <div className="h-4 w-36 bg-slate-200 rounded-md" />
                      <div className="h-5 w-16 bg-slate-200 rounded-md" />
                    </div>
                    <div className="h-12 rounded-2xl bg-white border border-slate-200/80 p-3 flex justify-between items-center">
                      <div className="h-4 w-40 bg-slate-200 rounded-md" />
                      <div className="h-5 w-16 bg-slate-200 rounded-md" />
                    </div>
                  </div>
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

        <StudentBottomNav activeTab={activeTab} setActiveTab={setActiveTab} isSchool={isSchool} />
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

            {/* দৈনিক সবক ও ক্লাস রুটিনের তালিকা */}
            <StudentStudyView student={displayStudent} />
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