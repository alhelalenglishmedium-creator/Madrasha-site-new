'use client';

import React, { useState, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
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
  // কাস্টম ক্লাস লিস্টের জন্য স্টেট
  const [classes, setClasses] = useState(['নূরানী', 'নাজেরা', 'হিফজ']);
  
  const [formData, setFormData] = useState({
    fullName: '',
    className: 'নূরানী',
    rollNo: '',
    fatherName: '',
    phone: '',
    address: '',
    monthlyFee: 1000,
    status: 'active' as const,
    admissionNo: '', // ডাটাবেস রিকোয়ারমেন্ট থাকলে ব্যাকএন্ডে অটো জেনারেট হবে
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        className: initialData.className || 'নূরানী',
        rollNo: initialData.rollNo || '',
        fatherName: initialData.fatherName || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        monthlyFee: initialData.monthlyFee || 0,
        status: initialData.status || 'active',
        admissionNo: initialData.admissionNo || '',
      });
      // যদি আগে থেকে কিতাবখানা সিলেক্ট করা থাকে তবে লিস্টে যোগ হবে
      if (initialData.className === 'কিতাবখানা' && !classes.includes('কিতাবখানা')) {
        setClasses([...classes, 'কিতাবখানা']);
      }
    } else {
      setFormData({
        fullName: '',
        className: 'নূরানী',
        rollNo: '',
        fatherName: '',
        phone: '',
        address: '',
        monthlyFee: 1000,
        status: 'active',
        admissionNo: `ST-${Date.now()}`, // ইউনিক আইডি হিসেবে
      });
    }
  }, [initialData, isOpen]);

  // কিতাবখানা যোগ করার ফাংশন
  const addKitabkhana = () => {
    if (!classes.includes('কিতাবখানা')) {
      setClasses([...classes, 'কিতাবখানা']);
      setFormData({ ...formData, className: 'কিতাবখানা' });
    }
  };

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl max-h-[90vh] flex flex-col border border-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-5">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {initialData ? 'তথ্য পরিবর্তন করুন' : 'নতুন শিক্ষার্থী ভর্তি'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">সঠিক তথ্য দিয়ে ফর্মটি পূরণ করুন</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-8 space-y-5 flex-1">
          
          {/* ১. শিক্ষার্থীর নাম (English) */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">শিক্ষার্থীর নাম (English)*</label>
            <Input
              required
              placeholder="e.g. Mohammad Abdullah"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* ২. শ্রেণি নির্বাচন */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-slate-700">শ্রেণি নির্বাচন*</label>
                {!classes.includes('কিতাবখানা') && (
                   <button 
                    type="button" 
                    onClick={addKitabkhana}
                    className="text-[10px] text-emerald-600 flex items-center gap-0.5 hover:underline"
                   >
                    <PlusCircle className="h-3 w-3" /> কিতাবখানা
                   </button>
                )}
              </div>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              >
                {classes.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* ৩. রোল নং */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">রোল নং*</label>
              <Input
                required
                placeholder="রোল নম্বর দিন"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="h-12 rounded-xl border-slate-200"
              />
            </div>
          </div>

          {/* ৪. পিতার নাম (English) */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">পিতার নাম (English)*</label>
            <Input
              required
              placeholder="Father's Name in English"
              value={formData.fatherName}
              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              className="h-12 rounded-xl border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* ৫. মোবাইল নং */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">মোবাইল নং*</label>
              <Input
                label=""
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-12 rounded-xl border-slate-200"
              />
            </div>

            {/* ৬. মাসিক ফি */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">মাসিক ফি (৳)*</label>
              <Input
                label=""
                type="number"
                required
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                className="h-12 rounded-xl border-slate-200"
              />
            </div>
          </div>

          {/* ৭. ঠিকানা */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">ঠিকানা (ঐচ্ছিক)</label>
            <Input
              placeholder="গ্রাম, ডাকঘর, জেলা"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-12 rounded-xl border-slate-200"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6">
            <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              বাতিল
            </Button>
            <Button 
                type="submit" 
                isLoading={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
            >
              {initialData ? 'আপডেট করুন' : 'ভর্তি সম্পন্ন করুন'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}