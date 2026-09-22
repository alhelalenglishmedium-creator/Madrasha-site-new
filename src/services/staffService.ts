import { localDb } from '@/db/localDb';
import type { Staff, StaffRole } from '@/types/database.types';

export interface StaffFilterOptions {
  searchQuery?: string;
  role?: StaffRole | 'all';
  status?: 'active' | 'archived';
}

export async function getStaffList(options?: StaffFilterOptions): Promise<Staff[]> {
  let collection = localDb.staff.toCollection();
  let staffList = await collection.toArray();

  if (options?.status) {
    staffList = staffList.filter((s) => s.status === options.status);
  } else {
    staffList = staffList.filter((s) => s.status === 'active');
  }

  if (options?.role && options.role !== 'all') {
    staffList = staffList.filter((s) => s.role === options.role);
  }

  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase().trim();
    staffList = staffList.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }

  return staffList.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function addStaff(
  staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Staff> {
  const newStaff: Staff = {
    ...staffData,
    id: `stf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await localDb.staff.add(newStaff);
  return newStaff;
}

export async function updateStaff(
  id: string,
  updatedFields: Partial<Omit<Staff, 'id' | 'createdAt'>>
): Promise<void> {
  await localDb.staff.update(id, {
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  });
}

export async function archiveStaff(id: string): Promise<void> {
  await localDb.staff.update(id, {
    status: 'archived',
    updatedAt: new Date().toISOString(),
  });
}