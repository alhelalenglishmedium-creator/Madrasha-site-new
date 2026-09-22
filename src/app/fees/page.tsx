'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FeeCollectionModal } from '@/components/fees/FeeCollectionModal';
import { getFeePayments, addFeePayment, type FeePaymentWithStudent } from '@/services/feeService';

export default function FeesPage() {
  const [payments, setPayments] = useState<FeePaymentWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFeePayments(100);
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleAddPayment = async (data: any) => {
    await addFeePayment(data);
    await loadPayments();
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const studentName = (p.student?.fullNameBangla || p.student?.fullName || '').toLowerCase();
    const roll = p.student?.rollNo || '';
    const receipt = p.receiptNo.toLowerCase();
    return studentName.includes(q) || roll.includes(q) || receipt.includes(q);
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const getFeeTypeBadge = (type: string) => {
    switch (type) {
      case 'monthly':
        return <Badge variant="emerald" size="sm">মাসিক বেতন</Badge>;
      case 'admission':
        return <Badge variant="blue" size="sm">ভর্তি ফি</Badge>;
      case 'exam':
        return <Badge variant="amber" size="sm">পরীক্ষা ফি</Badge>;
      default:
        return <Badge variant="slate" size="sm">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">ফি ও হিসাব ব্যবস্থাপনা</h2>
          <p className="text-xs text-slate-500 sm:text-sm">
            মোট সংগৃহীত ফি: <span className="font-semibold text-emerald-700">৳ {totalCollected.toLocaleString('bn-BD')}</span>
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          ফি আদায় এন্ট্রি
        </Button>
      </div>

      {/* Filter / Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="রশিদ নং, শিক্ষার্থীর নাম অথবা রোল দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">রশিদ নং</th>
                <th className="px-5 py-3.5">শিক্ষার্থীর নাম ও শ্রেণি</th>
                <th className="px-5 py-3.5">ফি বিবরণ / মাস</th>
                <th className="px-5 py-3.5">তারিখ</th>
                <th className="px-5 py-3.5">মাধ্যম</th>
                <th className="px-5 py-3.5 text-right">আদায়ের পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    কোনো ফি আদায়ের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-900">
                      {p.receiptNo}
                    </td>
                    <td className="px-5 py-4">
                      {p.student ? (
                        <div>
                          <p className="font-semibold text-slate-900">
                            {p.student.fullNameBangla || p.student.fullName}
                          </p>
                          <p className="text-xs text-slate-400">
                            রোল: {p.student.rollNo} • {p.student.className}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">শিক্ষার্থীর তথ্য অপ্রাপ্য</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {getFeeTypeBadge(p.feeType)}
                        {p.month && (
                          <span className="text-xs font-medium text-slate-600">({p.month})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{p.paymentDate}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-700">
                      ৳ {p.amount.toLocaleString('bn-BD')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal */}
      <FeeCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPayment}
      />
    </div>
  );
}