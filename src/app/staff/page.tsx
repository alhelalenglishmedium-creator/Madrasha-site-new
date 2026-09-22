'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Archive,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StaffFormModal } from '@/components/staff/StaffFormModal';
import {
  getStaffList,
  addStaff,
  updateStaff,
  archiveStaff,
} from '@/services/staffService';
import type { Staff, StaffRole } from '@/types/database.types';

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStaffList({
        searchQuery,
        role: selectedRole,
        status: 'active',
      });
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRole]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleSaveStaff = async (
    data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingStaff) {
      await updateStaff(editingStaff.id, data);
    } else {
      await addStaff(data);
    }
    await loadStaff();
  };

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${name}"-কে আর্কাইভ/নিষ্ক্রিয় করতে চান?`)) {
      await archiveStaff(id);
      await loadStaff();
    }
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'teacher':
        return <Badge variant="success" size="sm">শিক্ষক</Badge>;
      case 'staff':
        return <Badge variant="info" size="sm">কর্মচারী</Badge>;
      case 'admin':
        return <Badge variant="warning" size="sm">এডমিন</Badge>;
      default:
        return <Badge size="sm">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">শিক্ষক ও স্টাফ তালিকা</h2>
          <p className="text-xs text-slate-500 sm:text-sm">
            সর্বমোট কর্মরত: <span className="font-semibold text-emerald-700">{staffList.length} জন</span>
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <UserPlus className="h-4 w-4" />
          নতুন স্টাফ যোগ করুন
        </Button>
      </div>

      {/* Filter & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="নাম, পদবী বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as StaffRole | 'all')}
              >
                <option value="all">সকল পদবী/ক্যাটেগরি</option>
                <option value="teacher">শিক্ষক (Teacher)</option>
                <option value="staff">কর্মচারী (Staff)</option>
                <option value="admin">প্রশাসনিক (Admin)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">নাম ও পদবী</th>
                <th className="px-5 py-3.5">ক্যাটেগরি</th>
                <th className="px-5 py-3.5">যোগাযোগ</th>
                <th className="px-5 py-3.5">যোগদানের তারিখ</th>
                <th className="px-5 py-3.5">মাসিক বেতন</th>
                <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    কোনো শিক্ষক বা স্টাফের তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{staff.fullName}</p>
                        <p className="text-xs text-slate-500">{staff.designation}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">{getRoleBadge(staff.role)}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5 text-xs text-slate-700">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{staff.phone}</span>
                        </div>
                        {staff.email && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{staff.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{staff.joiningDate}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-emerald-700">
                      ৳ {staff.monthlySalary.toLocaleString('bn-BD')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(staff)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="এডিট করুন"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(staff.id, staff.fullName)}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          title="আর্কাইভ / নিষ্ক্রিয়"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal */}
      <StaffFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveStaff}
        initialData={editingStaff}
      />
    </div>
  );
}