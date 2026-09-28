import { supabase } from '@/lib/supabaseClient';
import { localDb } from '@/db/localDb';
import type { Student } from '@/types/database.types';

export interface SabakData {
  id?: string;
  studentId: string;
  rollNo?: string;
  admissionNo?: string;
  date: string;
  sabak: string;
  saatSabak: string;
  alMukhta: string;
  sabina: string;
  newSabak: string;
  sabki: string;
  satpara: string;
  grade: string;
  remark?: string;
}

// ডিফল্ট ডেমো সবক (একটাই সেন্ট্রাল সোর্স অব ট্রুথ)
export const DEFAULT_HIFZ_SABAK: SabakData = {
  studentId: '',
  date: new Date().toISOString().split('T')[0],
  sabak: 'পারা ১৬ • পৃষ্ঠা ৩০৫',
  saatSabak: 'পারা ১৫ • পৃষ্ঠা ২৯০ - ৩০৪',
  alMukhta: 'পারা ১ থেকে পারা ৩ পর্যন্ত • পৃষ্ঠা ১ - ৬০',
  sabina: 'পারা ১ থেকে পারা ৫ সম্পূর্ণ শুনানী',
  newSabak: 'পারা ১৬ • পৃষ্ঠা ৩০৫',
  sabki: 'পারা ১৫ • পৃষ্ঠা ২৯০ - ৩০৪',
  satpara: 'পারা ১ থেকে পারা ৩ পর্যন্ত',
  grade: 'মুমতায',
  remark: 'মাশাআল্লাহ সন্তোষজনক অগ্রগতি',
};

// হিফজুল কুরআন শিক্ষার্থী যাচাই
export function isHifzStudent(std: Student | null | undefined): boolean {
  if (!std) return false;
  const cls = String(std.className || (std as any).class_name || '').toLowerCase();
  return (
    cls.includes('হিফজ') ||
    cls.includes('হিজফ') ||
    cls.includes('কুরআন') ||
    cls.includes('hifz') ||
    cls.includes('quran')
  );
}

// স্টুডেন্টের সম্ভাব্য আইডিগুলো পাওয়ার হেল্পার (রোল, আইডি, এডমিশন নং এবং বাংলা সংখ্যা কনভার্সন)
export function getStudentCandidateIds(student: Student | null | undefined): string[] {
  if (!student) return [];
  const rawValues = [
    String(student.id || '').trim(),
    String(student.admissionNo || '').trim(),
    String((student as any).identifier || '').trim(),
    String(student.rollNo || '').trim(),
    String((student as any).roll || '').trim(),
    String((student as any).roll_no || '').trim(),
  ].filter(Boolean);

  const set = new Set<string>();
  rawValues.forEach((val) => {
    set.add(val);
    set.add(val.toLowerCase());

    // বাংলা সংখ্যা থাকলে ইংরেজি সংখ্যায় রূপান্তর
    const engVal = val.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
    set.add(engVal);

    const digitsOnly = engVal.replace(/\D/g, '');
    if (digitsOnly) {
      set.add(digitsOnly);
      const parsedInt = parseInt(digitsOnly, 10);
      if (!isNaN(parsedInt)) {
        set.add(String(parsedInt));
        set.add(String(parsedInt).padStart(2, '0'));
      }
    }
  });

  return Array.from(set).filter(Boolean);
}

/**
 * শিক্ষার্থীর সর্বশেষ সবক রেকর্ড লোড করা
 * ১. প্রথমে ক্যাশ / লোকাল স্টোরেজ চেক
 * ২. আইডি রেজোলিউশন (রোল থেকে আসল সুপাবেস আইডি)
 * ৩. এরপর সুপাবেস ক্লাউড ডাটাবেস
 * ৪. এরপর ডেক্সি লোকালডিবি
 * ৫. সবশেষে সেন্ট্রাল ফলব্যাক ডিফল্ট
 */
export async function fetchLatestSabak(student: Student | null | undefined): Promise<SabakData | null> {
  if (!student) return null;

  const candidateIds = getStudentCandidateIds(student);

  // ১. লোকাল স্টোরেজ (সবার আগে ইনস্ট্যান্ট রেসপন্সের জন্য)
  if (typeof window !== 'undefined') {
    for (const cid of candidateIds) {
      const cached = localStorage.getItem(`madrasa_sabak_${cid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.sabak || parsed.newSabak)) {
            return parsed;
          }
        } catch (e) {}
      }
    }

    // গ্লোবাল অ্যাক্টিভ সবক ব্যাকআপ (হিফজ শিক্ষার্থীদের জন্য)
    const globalCached = localStorage.getItem('madrasa_active_hifz_sabak');
    if (globalCached) {
      try {
        const parsed = JSON.parse(globalCached);
        if (parsed && (parsed.sabak || parsed.newSabak)) {
          const parsedSid = String(parsed.studentId || '').trim();
          const parsedRoll = String(parsed.rollNo || '').trim();
          const parsedAdm = String(parsed.admissionNo || '').trim();

          const isDirectMatch =
            candidateIds.includes(parsedSid) ||
            (parsedRoll && candidateIds.includes(parsedRoll)) ||
            (parsedAdm && candidateIds.includes(parsedAdm));

          // যদি সরাসরি ম্যাচ হয়, অথবা স্টুডেন্ট হিফজ বিভাগের হয়
          if (isDirectMatch || !parsedSid || isHifzStudent(student)) {
            return {
              ...parsed,
              studentId: student.id,
            };
          }
        }
      } catch (e) {}
    }
  }

  // ২. ক্লাউড আইডি রেজোলিউশন: candidateIds-এর সাহায্যে students টেবিল থেকে আসল id ও admission_no রিট্রিভ করা
  let allSearchIds = [...candidateIds];
  try {
    const { data: cloudStudents } = await supabase
      .from('students')
      .select('id, admission_no, roll, roll_no')
      .or(
        allSearchIds
          .map((id) => `id.eq.${id},admission_no.eq.${id},roll.eq.${id},roll_no.eq.${id}`)
          .join(',')
      )
      .limit(5);

    if (cloudStudents && cloudStudents.length > 0) {
      cloudStudents.forEach((std: any) => {
        if (std.id) allSearchIds.push(String(std.id));
        if (std.admission_no) allSearchIds.push(String(std.admission_no));
        if (std.roll) allSearchIds.push(String(std.roll));
        if (std.roll_no) allSearchIds.push(String(std.roll_no));
      });
      allSearchIds = Array.from(new Set(allSearchIds));
    }
  } catch (err) {}

  // ৩. সুপাবেস (Supabase Cloud) ডাটাবেস
  try {
    const { data, error } = await supabase
      .from('sabak_records')
      .select('*')
      .in('student_id', allSearchIds)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const r = data[0];
      const result: SabakData = {
        id: r.id,
        studentId: String(r.student_id || student.id),
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        date: r.date || new Date().toISOString().split('T')[0],
        sabak: r.sabak || r.new_sabak || r.newSabak || '',
        saatSabak: r.saat_sabak || r.saatSabak || r.sabki || '',
        alMukhta: r.al_mukhta || r.alMukhta || r.satpara || '',
        sabina: r.sabina || '',
        newSabak: r.sabak || r.new_sabak || r.newSabak || '',
        sabki: r.saat_sabak || r.saatSabak || r.sabki || '',
        satpara: r.al_mukhta || r.alMukhta || r.satpara || '',
        grade: r.grade || 'মুমতায',
        remark: r.remark || '',
      };

      if (typeof window !== 'undefined') {
        allSearchIds.forEach((sid) => {
          localStorage.setItem(`madrasa_sabak_${sid}`, JSON.stringify(result));
        });
        localStorage.setItem('madrasa_active_hifz_sabak', JSON.stringify(result));
      }
      return result;
    }
  } catch (cloudErr) {
    // Supabase টেবিল বা নেটওয়ার্ক সমস্যা হ্যান্ডলিং
  }

  // ৪. ডেক্সি (Dexie IndexedDB)
  try {
    if (localDb.sabakRecords) {
      const localRecords = await localDb.sabakRecords.toArray();
      const matched = localRecords
        .filter((s: any) => allSearchIds.includes(String(s.studentId).trim()))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (matched.length > 0) {
        const r = matched[0];
        const result: SabakData = {
          id: r.id,
          studentId: String(r.studentId || student.id),
          rollNo: student.rollNo,
          admissionNo: student.admissionNo,
          date: r.date,
          sabak: r.sabak || r.newSabak || '',
          saatSabak: r.saatSabak || r.sabki || '',
          alMukhta: r.alMukhta || r.satpara || '',
          sabina: r.sabina || '',
          newSabak: r.sabak || r.newSabak || '',
          sabki: r.saatSabak || r.sabki || '',
          satpara: r.alMukhta || r.satpara || '',
          grade: r.grade || 'মুমতায',
          remark: r.remark || '',
        };

        if (typeof window !== 'undefined') {
          allSearchIds.forEach((sid) => {
            localStorage.setItem(`madrasa_sabak_${sid}`, JSON.stringify(result));
          });
          localStorage.setItem('madrasa_active_hifz_sabak', JSON.stringify(result));
        }
        return result;
      }
    }
  } catch (localErr) {}

  // ৫. সেন্ট্রাল ফলব্যাক ডিফল্ট (যদি কোথাও কোনো ডাটা না থাকে)
  return {
    ...DEFAULT_HIFZ_SABAK,
    studentId: String(student.id),
  };
}

/**
 * সবক রেকর্ড সংরক্ষণ করা
 * - লোকালস্টোরেজে বহুবিধ কী-তে (studentId, rollNo, admissionNo) তৎক্ষণাৎ ক্যাশ
 * - রিয়েল-টাইম উইন্ডো ইভেন্ট ডিসপ্যাচ (সব কম্পোনেন্ট তৎক্ষণাৎ আপডেট হবে)
 * - ডেক্সি লোকালডিবিতে সংরক্ষণ
 * - সুপাবেস ক্লাউডে ইনসার্ট
 */
export async function saveSabakRecord(
  record: SabakData,
  sectionType: string = 'sabak'
): Promise<SabakData> {
  const nowIso = new Date().toISOString();
  const sabakId = record.id || `sbk_${Date.now()}`;

  const cleanRecord: SabakData = {
    ...record,
    id: sabakId,
    newSabak: record.sabak || record.newSabak || '',
    sabki: record.saatSabak || record.sabki || '',
    satpara: record.alMukhta || record.satpara || '',
  };

  // ১. লোকাল স্টোরেজে ইনস্ট্যান্ট সংরক্ষণ (সকল সম্ভাব্য আইডিতে যেন স্টুডেন্ট যেভাবেই লগইন করুক পায়)
  if (typeof window !== 'undefined') {
    const keys = new Set<string>();
    if (cleanRecord.studentId) {
      keys.add(`madrasa_sabak_${cleanRecord.studentId}`);
    }
    if (cleanRecord.rollNo) {
      const r = cleanRecord.rollNo.trim();
      keys.add(`madrasa_sabak_${r}`);
      const cleanDigits = r.replace(/\D/g, '');
      if (cleanDigits) {
        keys.add(`madrasa_sabak_${cleanDigits}`);
        keys.add(`madrasa_sabak_${cleanDigits.padStart(2, '0')}`);
        keys.add(`madrasa_sabak_${String(parseInt(cleanDigits, 10))}`);
      }
    }
    if (cleanRecord.admissionNo) {
      keys.add(`madrasa_sabak_${cleanRecord.admissionNo}`);
    }

    keys.forEach((key) => {
      localStorage.setItem(key, JSON.stringify(cleanRecord));
    });
    localStorage.setItem('madrasa_active_hifz_sabak', JSON.stringify(cleanRecord));

    // লাইভ রিফ্রেশ ইভেন্ট ফায়ার
    try {
      window.dispatchEvent(
        new CustomEvent('sabak_updated', {
          detail: { record: cleanRecord, sectionType },
        })
      );
    } catch (e) {}
  }

  // ২. ডেক্সি লোকালডিবিতে সেভ
  try {
    if (localDb.sabakRecords) {
      await localDb.sabakRecords.put({
        ...cleanRecord,
        synced: true,
        updatedAt: nowIso,
      });
    }
  } catch (e) {
    console.warn('Dexie save warning:', e);
  }

  // ৩. সুপাবেস ক্লাউড ডাটাবেসে সেভ
  try {
    await supabase.from('sabak_records').insert([
      {
        student_id: cleanRecord.studentId,
        date: cleanRecord.date,
        sabak: cleanRecord.sabak,
        saat_sabak: cleanRecord.saatSabak,
        al_mukhta: cleanRecord.alMukhta,
        sabina: cleanRecord.sabina || null,
        new_sabak: cleanRecord.sabak,
        sabki: cleanRecord.saatSabak,
        satpara: cleanRecord.alMukhta,
        grade: cleanRecord.grade,
        remark: cleanRecord.remark || null,
        created_at: nowIso,
      },
    ]);
  } catch (cloudErr) {
    console.warn('Supabase cloud insert warning:', cloudErr);
  }

  return cleanRecord;
}

