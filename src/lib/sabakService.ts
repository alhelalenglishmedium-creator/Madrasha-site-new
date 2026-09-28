import { supabase } from '@/lib/supabaseClient';
import { localDb } from '@/db/localDb';
import type { Student } from '@/types/database.types';

export interface SabakData {
  id?: string;
  studentId: string;
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

// স্টুডেন্টের সম্ভাব্য আইডিগুলো পাওয়ার হেল্পার
export function getStudentCandidateIds(student: Student | null | undefined): string[] {
  if (!student) return [];
  return Array.from(
    new Set(
      [
        String(student.id || '').trim(),
        String(student.admissionNo || '').trim(),
        String((student as any).identifier || '').trim(),
        String(student.rollNo || '').trim(),
      ].filter(Boolean)
    )
  );
}

/**
 * শিক্ষার্থীর সর্বশেষ সবক রেকর্ড লোড করা
 * ১. প্রথমে ক্যাশ / লোকাল স্টোরেজ চেক
 * ২. এরপর সুপাবেস ক্লাউড ডাটাবেস
 * ৩. এরপর ডেক্সি লোকালডিবি
 * ৪. সবশেষে সেন্ট্রাল ফলব্যাক ডিফল্ট
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

    // গ্লোবাল অ্যাক্টিভ সবক ব্যাকআপ
    const globalCached = localStorage.getItem('madrasa_active_hifz_sabak');
    if (globalCached) {
      try {
        const parsed = JSON.parse(globalCached);
        if (parsed && (candidateIds.includes(String(parsed.studentId)) || !parsed.studentId)) {
          return {
            ...parsed,
            studentId: student.id,
          };
        }
      } catch (e) {}
    }
  }

  // ২. সুপাবেস (Supabase Cloud) ডাটাবেস
  try {
    const { data, error } = await supabase
      .from('sabak_records')
      .select('*')
      .in('student_id', candidateIds)
      .order('date', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const r = data[0];
      const result: SabakData = {
        id: r.id,
        studentId: String(r.student_id || student.id),
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
        localStorage.setItem(`madrasa_sabak_${student.id}`, JSON.stringify(result));
        localStorage.setItem('madrasa_active_hifz_sabak', JSON.stringify(result));
      }
      return result;
    }
  } catch (cloudErr) {
    // Supabase টেবিল তৈরি না থাকলে বা নেটওয়ার্ক সমস্যা হলে
  }

  // ৩. ডেক্সি (Dexie IndexedDB)
  try {
    if (localDb.sabakRecords) {
      const localRecords = await localDb.sabakRecords.toArray();
      const matched = localRecords
        .filter((s: any) => candidateIds.includes(String(s.studentId).trim()))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (matched.length > 0) {
        const r = matched[0];
        const result: SabakData = {
          id: r.id,
          studentId: String(r.studentId || student.id),
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
          localStorage.setItem(`madrasa_sabak_${student.id}`, JSON.stringify(result));
          localStorage.setItem('madrasa_active_hifz_sabak', JSON.stringify(result));
        }
        return result;
      }
    }
  } catch (localErr) {}

  // ৪. সেন্ট্রাল ফলব্যাক ডিফল্ট (যদি কোথাও কোনো ডাটা না থাকে)
  return {
    ...DEFAULT_HIFZ_SABAK,
    studentId: String(student.id),
  };
}

/**
 * সবক রেকর্ড সংরক্ষণ করা
 * - লোকালস্টোরেজে তৎক্ষণাৎ ক্যাশ
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

  // ১. লোকাল স্টোরেজে ইনস্ট্যান্ট সংরক্ষণ (সকল ট্যাব ও উইন্ডোতে শেয়ারের জন্য)
  if (typeof window !== 'undefined') {
    localStorage.setItem(`madrasa_sabak_${cleanRecord.studentId}`, JSON.stringify(cleanRecord));
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

  // ৩. সুপাবেস ক্লাউড ডাটাবেসে সেভ (যদি টেবিল থাকে)
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
    console.warn('Supabase cloud insert warning (table may not exist yet):', cloudErr);
  }

  return cleanRecord;
}
