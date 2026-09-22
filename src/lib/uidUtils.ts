import { localDb } from '@/db/localDb';
import { supabase, supabaseAnon } from '@/lib/supabaseClient';

export interface UidCheckResult {
  isTaken: boolean;
  ownerName?: string;
  role?: 'student' | 'teacher';
  message?: string;
}

/**
 * Checks if a given target UID is already taken by any student or teacher
 * in either LocalDb or Supabase Cloud database.
 * @param targetUid The UID string to check.
 * @param currentEditingId (Optional) The ID of the student or teacher currently being edited (to exclude self-match).
 */
export async function checkUidAvailability(
  targetUid: string,
  currentEditingId?: string
): Promise<UidCheckResult> {
  const cleanUid = targetUid.trim();
  if (!cleanUid) {
    return { isTaken: false };
  }

  const cleanLower = cleanUid.toLowerCase();
  const cleanCurrentEditingId = currentEditingId ? currentEditingId.trim().toLowerCase() : '';

  // ১. LocalDb Students চেক
  try {
    const localStudents = await localDb.students.toArray();
    const dupStudent = localStudents.find((s) => {
      const sid = String(s.id || '').trim().toLowerCase();
      const sadm = String(s.admissionNo || '').trim().toLowerCase();
      const isSelf = Boolean(
        cleanCurrentEditingId &&
        (sid === cleanCurrentEditingId || sadm === cleanCurrentEditingId)
      );
      if (isSelf) return false;
      return sid === cleanLower || sadm === cleanLower;
    });

    if (dupStudent) {
      const name = dupStudent.fullNameBangla || dupStudent.fullName || 'শিক্ষার্থী';
      return {
        isTaken: true,
        ownerName: name,
        role: 'student',
        message: `এই ইউআইডিটি (${cleanUid}) আগে ব্যবহার করা হয়েছে! "${name}" (শিক্ষার্থী)-এর জন্য এটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন একটি ইউআইডি ব্যবহার করুন।`,
      };
    }
  } catch (e) {
    console.warn('LocalDb student UID check warning:', e);
  }

  // ২. LocalDb Staff/Teachers চেক
  try {
    const localStaff = await localDb.staff.toArray();
    const dupStaff = localStaff.find((st) => {
      const stid = String(st.id || '').trim().toLowerCase();
      const stuid = String(st.teacher_uid || '').trim().toLowerCase();
      const isSelf = Boolean(
        cleanCurrentEditingId &&
        (stid === cleanCurrentEditingId || stuid === cleanCurrentEditingId)
      );
      if (isSelf) return false;
      return stid === cleanLower || stuid === cleanLower;
    });

    if (dupStaff) {
      const name = dupStaff.fullName || 'শিক্ষক';
      return {
        isTaken: true,
        ownerName: name,
        role: 'teacher',
        message: `এই ইউআইডিটি (${cleanUid}) আগে ব্যবহার করা হয়েছে! "${name}" (শিক্ষক/স্টাফ)-এর জন্য এটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন একটি ইউআইডি ব্যবহার করুন।`,
      };
    }
  } catch (e) {
    console.warn('LocalDb staff UID check warning:', e);
  }

  const fetchClient = supabaseAnon || supabase;

  // ৩. Supabase Cloud Students চেক
  try {
    // Exact ID check
    const { data: stdById } = await fetchClient
      .from('students')
      .select('id, admission_no, full_name, name, full_name_bangla')
      .eq('id', cleanUid)
      .maybeSingle();

    if (stdById) {
      const stdId = String(stdById.id || '').trim().toLowerCase();
      const isSelf = Boolean(cleanCurrentEditingId && stdId === cleanCurrentEditingId);
      if (!isSelf) {
        const name = stdById.full_name_bangla || stdById.full_name || stdById.name || 'শিক্ষার্থী';
        return {
          isTaken: true,
          ownerName: name,
          role: 'student',
          message: `এই ইউআইডিটি (${cleanUid}) আগে ব্যবহার করা হয়েছে! "${name}" (শিক্ষার্থী)-এর জন্য এটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন একটি ইউআইডি ব্যবহার করুন।`,
        };
      }
    }

    // Exact admission_no check
    const { data: stdByAdm } = await fetchClient
      .from('students')
      .select('id, admission_no, full_name, name, full_name_bangla')
      .eq('admission_no', cleanUid)
      .maybeSingle();

    if (stdByAdm) {
      const stdId = String(stdByAdm.id || '').trim().toLowerCase();
      const stdAdm = String(stdByAdm.admission_no || '').trim().toLowerCase();
      const isSelf = Boolean(
        cleanCurrentEditingId &&
        (stdId === cleanCurrentEditingId || stdAdm === cleanCurrentEditingId)
      );
      if (!isSelf) {
        const name = stdByAdm.full_name_bangla || stdByAdm.full_name || stdByAdm.name || 'শিক্ষার্থী';
        return {
          isTaken: true,
          ownerName: name,
          role: 'student',
          message: `এই ইউআইডিটি (${cleanUid}) আগে ব্যবহার করা হয়েছে! "${name}" (শিক্ষার্থী)-এর জন্য এটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন একটি ইউআইডি ব্যবহার করুন।`,
        };
      }
    }
  } catch (e) {
    console.warn('Supabase student UID check warning:', e);
  }

  // ৪. Supabase Cloud Staff / Teachers চেক
  try {
    // Exact ID check on staff
    const { data: staffById } = await fetchClient
      .from('staff')
      .select('id, teacher_uid, full_name, name')
      .eq('id', cleanUid)
      .maybeSingle();

    if (staffById) {
      const staffId = String(staffById.id || '').trim().toLowerCase();
      const isSelf = Boolean(cleanCurrentEditingId && staffId === cleanCurrentEditingId);
      if (!isSelf) {
        const name = staffById.full_name || staffById.name || 'শিক্ষক';
        return {
          isTaken: true,
          ownerName: name,
          role: 'teacher',
          message: `এই ইউআইডিটি (${cleanUid}) আগে ব্যবহার করা হয়েছে! "${name}" (শিক্ষক/স্টাফ)-এর জন্য এটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন একটি ইউআইডি ব্যবহার করুন।`,
        };
      }
    }

    // Exact teacher_uid check on staff
    const { data: staffByUid } = await fetchClient
      .from('staff')
      .select('id, teacher_uid, full_name, name')
      .eq('teacher_uid', cleanUid)
      .maybeSingle();

    if (staffByUid) {
      const staffId = String(staffByUid.id || '').trim().toLowerCase();
      const staffUid = String(staffByUid.teacher_uid || '').trim().toLowerCase();
      const isSelf = Boolean(
        cleanCurrentEditingId &&
        (staffId === cleanCurrentEditingId || staffUid === cleanCurrentEditingId)
      );
      if (!isSelf) {
        const name = staffByUid.full_name || staffByUid.name || 'শিক্ষক';
        return {
          isTaken: true,
          ownerName: name,
          role: 'teacher',
          message: `এই ইউআইডিটি (${cleanUid}) আগে ব্যবহার করা হয়েছে! "${name}" (শিক্ষক/স্টাফ)-এর জন্য এটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন একটি ইউআইডি ব্যবহার করুন।`,
        };
      }
    }

    // Exact ID check on teachers table
    const { data: tcById } = await fetchClient
      .from('teachers')
      .select('id, name')
      .eq('id', cleanUid)
      .maybeSingle();

    if (tcById) {
      const tcId = String(tcById.id || '').trim().toLowerCase();
      const isSelf = Boolean(cleanCurrentEditingId && tcId === cleanCurrentEditingId);
      if (!isSelf) {
        const name = tcById.name || 'শিক্ষক';
        return {
          isTaken: true,
          ownerName: name,
          role: 'teacher',
          message: `এই ইউআইডিটি (${cleanUid}) আগে ব্যবহার করা হয়েছে! "${name}" (শিক্ষক)-এর জন্য এটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন একটি ইউআইডি ব্যবহার করুন।`,
        };
      }
    }
  } catch (e) {
    console.warn('Supabase staff UID check warning:', e);
  }

  // ৫. Supabase Cloud Profiles (ইউজার প্রোফাইল) চেক
  try {
    const { data: profileByUid } = await fetchClient
      .from('profiles')
      .select('id, identifier, full_name, role')
      .eq('identifier', cleanUid)
      .maybeSingle();

    if (profileByUid) {
      const pId = String(profileByUid.id || '').trim().toLowerCase();
      const pUid = String(profileByUid.identifier || '').trim().toLowerCase();
      const isSelf = Boolean(
        cleanCurrentEditingId &&
        (pId === cleanCurrentEditingId || pUid === cleanCurrentEditingId)
      );
      if (!isSelf) {
        const name = profileByUid.full_name || 'ব্যবহারকারী';
        const roleStr = profileByUid.role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী';
        return {
          isTaken: true,
          ownerName: name,
          role: profileByUid.role === 'teacher' ? 'teacher' : 'student',
          message: `এই ইউআইডিটি (${cleanUid}) আগে ব্যবহার করা হয়েছে! "${name}" (${roleStr})-এর জন্য এটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন একটি ইউআইডি ব্যবহার করুন।`,
        };
      }
    }
  } catch (e) {
    console.warn('Supabase profile UID check warning:', e);
  }

  return { isTaken: false };
}
