import { localDb } from '@/db/localDb';
import type { AttendanceRecord, AttendanceStatus, Student } from '@/types/database.types';

export interface StudentAttendanceView {
  student: Student;
  status: AttendanceStatus;
  remark?: string;
  recordId?: string;
}

export async function getAttendanceSheet(
  className: string,
  date: string
): Promise<StudentAttendanceView[]> {
  // 1. Get all active students for this class
  const students = await localDb.students
    .filter((s) => s.status === 'active' && s.className === className)
    .toArray();

  // Sort students by roll number
  students.sort((a, b) => Number(a.rollNo || 0) - Number(b.rollNo || 0));

  // 2. Get existing attendance records for this class & date
  const records = await localDb.attendance
    .filter((r) => r.date === date && r.className === className)
    .toArray();

  const recordMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => recordMap.set(r.studentId, r));

  // 3. Map students to attendance view (default to 'present' if not marked yet)
  return students.map((student) => {
    const existing = recordMap.get(student.id);
    return {
      student,
      status: existing ? existing.status : 'present',
      remark: existing?.remark || '',
      recordId: existing?.id,
    };
  });
}

export async function saveBulkAttendance(
  className: string,
  date: string,
  entries: { studentId: string; status: AttendanceStatus; remark?: string; recordId?: string }[]
): Promise<void> {
  const now = new Date().toISOString();

  await localDb.transaction('rw', localDb.attendance, async () => {
    for (const entry of entries) {
      if (entry.recordId) {
        // Update existing record
        await localDb.attendance.update(entry.recordId, {
          status: entry.status,
          remark: entry.remark,
          synced: false,
        });
      } else {
        // Create new record
        const newRecord: AttendanceRecord = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          date,
          className,
          studentId: entry.studentId,
          status: entry.status,
          remark: entry.remark,
          synced: false,
          createdAt: now,
        };
        await localDb.attendance.add(newRecord);
      }
    }
  });
}