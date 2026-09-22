import { localDb } from '@/db/localDb';
import type { Student } from '@/types/database.types';

export interface StudentFilterOptions {
  searchQuery?: string;
  className?: string;
  section?: string;
  status?: 'active' | 'archived';
}

export async function getStudents(options?: StudentFilterOptions): Promise<Student[]> {
  let collection = localDb.students.toCollection();

  let students = await collection.toArray();

  if (options?.status) {
    students = students.filter((s) => s.status === options.status);
  } else {
    students = students.filter((s) => s.status === 'active');
  }

  if (options?.className && options.className !== 'all') {
    students = students.filter((s) => s.className === options.className);
  }

  if (options?.section && options.section !== 'all') {
    students = students.filter((s) => s.section === options.section);
  }

  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase().trim();
    students = students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.fullNameBangla && s.fullNameBangla.toLowerCase().includes(q)) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }

  return students.sort((a, b) => Number(a.rollNo || 0) - Number(b.rollNo || 0));
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  return await localDb.students.get(id);
}

export async function addStudent(
  studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Student> {
  const newStudent: Student = {
    ...studentData,
    id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await localDb.students.add(newStudent);
  return newStudent;
}

export async function updateStudent(
  id: string,
  updatedFields: Partial<Omit<Student, 'id' | 'createdAt'>>
): Promise<void> {
  await localDb.students.update(id, {
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  });
}

export async function archiveStudent(id: string): Promise<void> {
  await localDb.students.update(id, {
    status: 'archived',
    updatedAt: new Date().toISOString(),
  });
}