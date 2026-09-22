'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Staff, StaffRole } from '@/types/database.types';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Staff | null;
}

export function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: StaffFormModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    designation: '',
    role: 'teacher' as StaffRole,
    phone: '',
    email: '',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: 15000,
    status: 'active' as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        designation: initialData.designation || '',
        role: initialData.role || 'teacher',
        phone: initialData.phone || '',
        email: initialData.email || '',
        joiningDate: initialData.joiningDate || new Date().toISOString().split('T')[0],
        monthlySalary: initialData.monthlySalary || 0,
        status: initialData.status || 'active',
      });
    } else {
      setFormData({
        fullName: '',
        designation: '',
        role: 'teacher',
        phone: '',
        email: '',
        joiningDate: new Date().toISOString().split('T')[0],
        monthlySalary: 15000,
        status: 'active',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('Error saving staff:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">
            {initialData ? 'স্টাফের তথ্য সংশোধন' : 'নতুন শিক্ষক / স্টাফ যোগ'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          <Input
            label="পূর্ণ নাম*"
            required
            placeholder="যেমন: মাওলানা আব্দুর রহমান"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ক্যাটেগরি / রোল*
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as StaffRole })
                }
              >
                <option value="teacher">শিক্ষক (Teacher)</option>
                <option value="staff">কর্মচারী (Staff)</option>
                <option value="admin">প্রশাসনিক (Admin)</option>
              </select>
            </div>

            <Input
              label="পদবী (Designation)*"
              required
              placeholder="যেমন: প্রধান শিক্ষক / হিফজ শিক্ষক"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="মোবাইল নম্বর*"
              type="tel"
              required
              placeholder="017xxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="ইমেইল (ঐচ্ছিক)"
              type="email"
              placeholder="example@mail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="যোগদানের তারিখ*"
              type="date"
              required
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            />
            <Input
              label="মাসিক বেতন (৳)*"
              type="number"
              required
              value={formData.monthlySalary}
              onChange={(e) =>
                setFormData({ ...formData, monthlySalary: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              বাতিল
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {initialData ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}