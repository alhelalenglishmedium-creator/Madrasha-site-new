export type StudentStatus = 'active' | 'archived' | 'graduated';
export type StaffRole = 'teacher' | 'staff' | 'admin';
export type AttendanceStatus = 'present' | 'absent' | 'leave';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank';

export interface MadrasaSettings {
  id: string;
  name: string;
  nameBangla: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  academicYear: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  fullName: string;
  fullNameBangla?: string;
  className: string;
  section?: string;
  rollNo: string;
  fatherName: string;
  motherName?: string;
  phone: string;
  address?: string;
  dob?: string;
  monthlyFee: number;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  fullName: string;
  designation: string;
  role: StaffRole;
  phone: string;
  email?: string;
  joiningDate: string;
  monthlySalary: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  className: string;
  status: AttendanceStatus;
  remark?: string;
  synced: boolean;
  createdAt: string;
}

export interface FeeType {
  id: string;
  name: string;
  description?: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  feeTypeId: string;
  amount: number;
  month?: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  synced: boolean;
  createdAt: string;
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  amount: number;
  month: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  synced: boolean;
  createdAt: string;
}