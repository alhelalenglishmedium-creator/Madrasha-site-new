'use client';

import React, { useEffect, useState } from 'react';
import { Printer, FileText, Download, BarChart3, Users, CircleDollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getClassSummaryReport, type ClassSummaryReport } from '@/services/reportService';

export default function ReportsPage() {
  const [summaries, setSummaries] = useState<ClassSummaryReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getClassSummaryReport();
        setSummaries(data);
        setCurrentDate(new Date().toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }));
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const totalStudents = summaries.reduce((sum, s) => sum + s.totalStudents, 0);
  const totalExpected = summaries.reduce((sum, s) => sum + s.totalExpectedFee, 0);
  const totalCollected = summaries.reduce((sum, s) => sum + s.totalCollected, 0);

  return (
    <div className="space-y-6">
      {/* Header with Print Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">রিপোর্ট ও পরিসংখ্যান</h2>
          <p className="text-xs text-slate-500 sm:text-sm">
            মাদ্রাসার সার্বিক শিক্ষার্থী ও আর্থিক সারসংক্ষেপ
          </p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          প্রিন্ট / PDF সংরক্ষণ
        </Button>
      </div>

      {/* Printable Sheet Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm print:border-none print:p-0 print:shadow-none">
        {/* Printable Institution Header */}
        <div className="border-b border-slate-200 pb-6 text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">মাদ্রাসাতুল কুরআন আল-ইসলামিয়া</h1>
          <p className="text-xs text-slate-500">প্রশাসনিক হিসাব ও শিক্ষার্থী রিপোর্ট</p>
          <p className="text-xs font-semibold text-slate-700">তারিখ: {currentDate}</p>
        </div>

        {/* Aggregate Overview Metrics */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-medium text-slate-500">মোট সক্রিয় শিক্ষার্থী</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {isLoading ? '...' : `${totalStudents} জন`}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-xs font-medium text-emerald-700">মাসিক সম্ভাব্য ফি</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              ৳ {isLoading ? '...' : totalExpected.toLocaleString('bn-BD')}
            </p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4">
            <p className="text-xs font-medium text-sky-700">সর্বমোট আদায়কৃত ফি</p>
            <p className="mt-1 text-2xl font-bold text-sky-900">
              ৳ {isLoading ? '...' : totalCollected.toLocaleString('bn-BD')}
            </p>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-800 mb-3">শ্রেণিভিত্তিক আর্থিক ও শিক্ষার্থী বিবরণী</h3>
          <table className="w-full text-left text-sm text-slate-600 border border-slate-200">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200">ক্রম</th>
                <th className="px-4 py-3 border-r border-slate-200">শ্রেণি / বিভাগ</th>
                <th className="px-4 py-3 border-r border-slate-200 text-center">শিক্ষার্থী সংখ্যা</th>
                <th className="px-4 py-3 border-r border-slate-200 text-right">মাসিক ধার্যকৃত ফি</th>
                <th className="px-4 py-3 text-right">মোট আদায়কৃত ফি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : (
                summaries.map((item, index) => (
                  <tr key={item.className}>
                    <td className="px-4 py-3 border-r border-slate-200 text-center font-mono">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-200">
                      {item.className}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-200">
                      {item.totalStudents} জন
                    </td>
                    <td className="px-4 py-3 text-right border-r border-slate-200">
                      ৳ {item.totalExpectedFee.toLocaleString('bn-BD')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">
                      ৳ {item.totalCollected.toLocaleString('bn-BD')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-center border-r border-slate-200">
                  সর্বমোট
                </td>
                <td className="px-4 py-3 text-center border-r border-slate-200">
                  {totalStudents} জন
                </td>
                <td className="px-4 py-3 text-right border-r border-slate-200">
                  ৳ {totalExpected.toLocaleString('bn-BD')}
                </td>
                <td className="px-4 py-3 text-right text-emerald-700">
                  ৳ {totalCollected.toLocaleString('bn-BD')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature Area for Printing */}
        <div className="mt-16 hidden print:grid grid-cols-3 gap-8 pt-8 text-center text-xs text-slate-600">
          <div>
            <div className="border-t border-slate-400 pt-2 font-medium">হিসাবরক্ষক</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-medium">নাজেমে তা'লীমাত</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-medium">মুহতামিম / প্রিন্সিপাল</div>
          </div>
        </div>
      </div>
    </div>
  );
}