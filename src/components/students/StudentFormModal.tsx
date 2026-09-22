'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Student } from '@/types/database.types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Student | null;
}

export function StudentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: StudentFormModalProps) {
  const [formData, setFormData] = useState({
    admissionNo: '',
    fullName: '',
    fullNameBangla: '',
    className: 'হিফজ',
    section: 'ক',
    rollNo: '',
    fatherName: '',
    motherName: '',
    phone: '',
    address: '',
    dob: '',
    monthlyFee: 1000,
    status: 'active' as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        admissionNo: initialData.admissionNo || '',
        fullName: initialData.fullName || '',
        fullNameBangla: initialData.fullNameBangla || '',
        className: initialData.className || 'হিফজ',
        section: initialData.section || 'ক',
        rollNo: initialData.rollNo || '',
        fatherName: initialData.fatherName || '',
        motherName: initialData.motherName || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        dob: initialData.dob || '',
        monthlyFee: initialData.monthlyFee || 0,
        status: initialData.status || 'active',
      });
    } else {
      setFormData({
        admissionNo: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: '',
        fullNameBangla: '',
        className: 'হিফজ',
        section: 'ক',
        rollNo: '',
        fatherName: '',
        motherName: '',
        phone: '',
        address: '',
        dob: '',
        monthlyFee: 1000,
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
      console.error('Error saving student:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">
            {initialData ? 'শিক্ষার্থীর তথ্য সংশোধন' : 'নতুন শিক্ষার্থী ভর্তি'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="ভর্তি নং (Admission No)*"
              required
              value={formData.admissionNo}
              onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
            />
            <Input
              label="রোল নং (Roll No)*"
              required
              value={formData.rollNo}
              onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="শিক্ষার্থীর নাম (ইংরেজি)*"
              required
              placeholder="e.g. Abdullah"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <Input
              label="শিক্ষার্থীর নাম (বাংলা)"
              placeholder="যেমন: আব্দুল্লাহ"
              value={formData.fullNameBangla}
              onChange={(e) => setFormData({ ...formData, fullNameBangla: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                শ্রেণি/বিভাগ*
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              >
                <option value="নূরানী">নূরানী</option>
                <option value="নাজেরা">নাজেরা</option>
                <option value="হিফজ">হিফজ</option>
                <option value="কিতাবখানা">কিতাবখানা</option>
              </select>
            </div>
            <Input
              label="শাখা / সেকশন"
              placeholder="যেমন: ক, খ"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="পিতার নাম*"
              required
              value={formData.fatherName}
              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
            />
            <Input
              label="মাতার নাম"
              value={formData.motherName}
              onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="অভিভাবকের মোবাইল নং*"
              type="tel"
              required
              placeholder="017xxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="মাসিক প্রদেয় ফি (৳)*"
              type="number"
              required
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
            />
          </div>

          <Input
            label="ঠিকানা"
            placeholder="গ্রাম/রোড, ডাকঘর, থানা, জেলা"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

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