import { localDb } from '@/db/localDb';
import type { FeePayment, Student } from '@/types/database.types';

export interface FeePaymentWithStudent extends FeePayment {
  student?: Student;
}

export async function getFeePayments(limitCount = 50): Promise<FeePaymentWithStudent[]> {
  const payments = await localDb.feePayments.reverse().limit(limitCount).toArray();
  const students = await localDb.students.toArray();
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  return payments.map((p) => ({
    ...p,
    student: studentMap.get(p.studentId),
  }));
}

export async function addFeePayment(
  data: Omit<FeePayment, 'id' | 'receiptNo' | 'createdAt' | 'synced'>
): Promise<FeePayment> {
  const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
  const newPayment: FeePayment = {
    ...data,
    id: `fee_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    receiptNo,
    synced: false,
    createdAt: new Date().toISOString(),
  };

  await localDb.feePayments.add(newPayment);
  return newPayment;
}

export async function getStudentDue(studentId: string): Promise<number> {
  const student = await localDb.students.get(studentId);
  if (!student) return 0;

  const payments = await localDb.feePayments
    .filter((p) => p.studentId === studentId)
    .toArray();

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthlyFee = student.monthlyFee || 0;
  
  return Math.max(0, monthlyFee - (totalPaid % (monthlyFee || 1)));
}