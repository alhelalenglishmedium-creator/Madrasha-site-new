import { localDb } from '@/db/localDb';
import type { Student, FeePayment, AttendanceRecord } from '@/types/database.types';

export interface ClassSummaryReport {
  className: string;
  totalStudents: number;
  totalCollected: number;
  totalExpectedFee: number;
}

export async function getClassSummaryReport(): Promise<ClassSummaryReport[]> {
  const classes = ['নূরানী', 'নাজেরা', 'হিফজ', 'কিতাবখানা'];
  const students = await localDb.students.where('status').equals('active').toArray();
  const payments = await localDb.feePayments.toArray();

  return classes.map((cls) => {
    const classStudents = students.filter((s) => s.className === cls);
    const studentIds = new Set(classStudents.map((s) => s.id));
    
    const classPayments = payments.filter((p) => studentIds.has(p.studentId));
    const totalCollected = classPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpectedFee = classStudents.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);

    return {
      className: cls,
      totalStudents: classStudents.length,
      totalCollected,
      totalExpectedFee,
    };
  });
}