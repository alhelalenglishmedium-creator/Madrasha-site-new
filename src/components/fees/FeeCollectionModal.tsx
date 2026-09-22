'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { localDb } from '@/db/localDb';
import type { Student, PaymentMethod, FeeType } from '@/types/database.types';

interface FeeCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    studentId: string;
    amount: number;
    feeType: FeeType;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    month?: string;
    remarks?: string;
  }) => Promise<void>;
}

export function FeeCollectionModal({
  isOpen,
  onClose,
  onSubmit,
}: FeeCollectionModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [feeType, setFeeType] = useState<FeeType>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [month, setMonth] = useState('জানুয়ারি');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadActiveStudents() {
      const list = await localDb.students.where('status').equals('active').toArray();
      setStudents(list);
      if (list.length > 0 && !selectedStudentId) {
        setSelectedStudentId(list[0].id);
        setAmount(list[0].monthlyFee || 0);
      }
    }
    if (isOpen) {
      loadActiveStudents();
    }
  }, [isOpen, selectedStudentId]);

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    const target = students.find((s) => s.id === id);
    if (target && feeType === 'monthly') {
      setAmount(target.monthlyFee || 0);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || amount <= 0) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        studentId: selectedStudentId,
        amount,
        feeType,
        paymentMethod,
        paymentDate,
        month: feeType === 'monthly' ? month : undefined,
        remarks,
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit fee payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">ফি আদায় ও রশিদ তৈরি</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              শিক্ষার্থী নির্বাচন করুন*
            </label>
            <select
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  রোল: {s.rollNo} - {s.fullNameBangla || s.fullName} ({s.className})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ফি এর ধরন*
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={feeType}
                onChange={(e) => setFeeType(e.target.value as FeeType)}
              >
                <option value="monthly">মাসিক বেতন</option>
                <option value="admission">ভর্তি ফি</option>
                <option value="exam">পরীক্ষা ফি</option>
                <option value="books">বই/কিতাব ফি</option>
                <option value="donation">অনুদান / অন্যান্য</option>
              </select>
            </div>

            {feeType === 'monthly' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  মাসের নাম*
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <option value="মুহররম">মুহররম</option>
                  <option value="সফর">সফর</option>
                  <option value="রবিউল আউয়াল">রবিউল আউয়াল</option>
                  <option value="রমজান">রমজান</option>
                  <option value="জানুয়ারি">জানুয়ারি</option>
                  <option value="ফেব্রুয়ারি">ফেব্রুয়ারি</option>
                  <option value="মার্চ">মার্চ</option>
                  <option value="এপ্রিল">এপ্রিল</option>
                  <option value="মে">মে</option>
                  <option value="জুন">জুন</option>
                  <option value="জুলাই">জুলাই</option>
                  <option value="আগস্ট">আগস্ট</option>
                  <option value="সেপ্টেম্বর">সেপ্টেম্বর</option>
                  <option value="অক্টোবর">অক্টোবর</option>
                  <option value="নভেম্বর">নভেম্বর</option>
                  <option value="ডিসেম্বর">ডিসেম্বর</option>
                </select>
              </div>
            ) : (
              <Input
                label="তারিখ*"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="টাকার পরিমাণ (৳)*"
              type="number"
              required
              min="1"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                পেমেন্ট মাধ্যম*
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="cash">নগদ (Cash)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="bank">ব্যাংক ট্রান্সফার</option>
              </select>
            </div>
          </div>

          <Input
            label="মন্তব্য / নোট (ঐচ্ছিক)"
            placeholder="যেমন: আংশিক প্রদান বা বিশেষ ছাড়"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              বাতিল
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              জমা নিশ্চিত করুন
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}