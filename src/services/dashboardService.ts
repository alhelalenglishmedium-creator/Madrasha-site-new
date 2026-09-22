import { localDb } from '@/db/localDb';

export interface DashboardMetrics {
  totalStudents: number;
  totalStaff: number;
  todayPresentCount: number;
  todayCollection: number;
  totalPendingDue: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = new Date().toISOString().split('T')[0];

  // 1. Total Active Students
  const totalStudents = await localDb.students
    .where('status')
    .equals('active')
    .count();

  // 2. Total Active Staff
  const totalStaff = await localDb.staff
    .where('status')
    .equals('active')
    .count();

  // 3. Today's Attendance (Present count)
  const todayPresentCount = await localDb.attendance
    .where({ date: today, status: 'present' })
    .count();

  // 4. Today's Fee Collection
  const todayPayments = await localDb.feePayments
    .filter((payment) => payment.paymentDate.startsWith(today))
    .toArray();
  const todayCollection = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // 5. Rough Pending Due calculation
  const allStudents = await localDb.students.where('status').equals('active').toArray();
  const allPayments = await localDb.feePayments.toArray();
  
  const totalExpectedMonthly = allStudents.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
  const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPendingDue = Math.max(0, totalExpectedMonthly - totalPaid);

  return {
    totalStudents,
    totalStaff,
    todayPresentCount,
    todayCollection,
    totalPendingDue,
  };
}