'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Calendar,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  getAttendanceSheet,
  saveBulkAttendance,
  type StudentAttendanceView,
} from '@/services/attendanceService';
import type { AttendanceStatus } from '@/types/database.types';

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState('হিফজ');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceList, setAttendanceList] = useState<StudentAttendanceView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadSheet = useCallback(async () => {
    setIsLoading(true);
    setSaveSuccess(false);
    try {
      const list = await getAttendanceSheet(selectedClass, selectedDate);
      setAttendanceList(list);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const handleStatusChange = (index: number, status: AttendanceStatus) => {
    setAttendanceList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status };
      return updated;
    });
  };

  const handleRemarkChange = (index: number, remark: string) => {
    setAttendanceList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], remark };
      return updated;
    });
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendanceList((prev) =>
      prev.map((item) => ({ ...item, status }))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const entries = attendanceList.map((item) => ({
        studentId: item.student.id,
        status: item.status,
        remark: item.remark,
        recordId: item.recordId,
      }));
      await saveBulkAttendance(selectedClass, selectedDate, entries);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadSheet();
    } catch (err) {
      console.error('Failed to save attendance:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Summary counts
  const presentCount = attendanceList.filter((item) => item.status === 'present').length;
  const absentCount = attendanceList.filter((item) => item.status === 'absent').length;
  const leaveCount = attendanceList.filter((item) => item.status === 'late' || item.status === 'excused').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">দৈনিক হাজিরা</h2>
          <p className="text-xs text-slate-500 sm:text-sm">
            শ্রেণি নির্বাচন করে উপস্থিতি নিশ্চিত করুন
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" /> হাজিরা সংরক্ষিত হয়েছে!
            </span>
          )}
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isLoading || attendanceList.length === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            হাজিরা সংরক্ষণ করুন
          </Button>
        </div>
      </div>

      {/* Class & Date Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                শ্রেণি/বিভাগ নির্বাচন
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="হিফজ">হিফজ</option>
                <option value="নাজেরা">নাজেরা</option>
                <option value="নূরানী">নূরানী</option>
                <option value="কিতাবখানা">কিতাবখানা</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                তারিখ নির্বাচন
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Quick Bulk Action */}
            <div className="sm:col-span-2 flex items-end gap-2">
              <span className="text-xs font-medium text-slate-500 pb-2.5">সকলকে একসাথে:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-emerald-700 hover:bg-emerald-50"
                onClick={() => markAll('present')}
                disabled={attendanceList.length === 0}
              >
                উপস্থিত
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-rose-700 hover:bg-rose-50"
                onClick={() => markAll('absent')}
                disabled={attendanceList.length === 0}
              >
                অনুপস্থিত
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
          <p className="text-xs font-semibold text-emerald-700">উপস্থিত</p>
          <p className="text-xl font-bold text-emerald-900">{presentCount} জন</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-center">
          <p className="text-xs font-semibold text-rose-700">অনুপস্থিত</p>
          <p className="text-xl font-bold text-rose-900">{absentCount} জন</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-center">
          <p className="text-xs font-semibold text-amber-700">ছুটি / বিলম্ব</p>
          <p className="text-xl font-bold text-amber-900">{leaveCount} জন</p>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 w-16">রোল</th>
                <th className="px-5 py-3.5">শিক্ষার্থীর নাম</th>
                <th className="px-5 py-3.5">ভর্তি নং</th>
                <th className="px-5 py-3.5 text-center w-64">হাজিরা স্ট্যাটাস</th>
                <th className="px-5 py-3.5">মন্তব্য (ঐচ্ছিক)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    এই শ্রেণিতে কোনো সক্রিয় শিক্ষার্থী নেই।
                  </td>
                </tr>
              ) : (
                attendanceList.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {item.student.rollNo}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">
                        {item.student.fullNameBangla || item.student.fullName}
                      </p>
                      <p className="text-xs text-slate-400">{item.student.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                      {item.student.admissionNo}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'present')}
                          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                            item.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          উপস্থিত
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'absent')}
                          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                            item.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          অনুপস্থিত
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'excused')}
                          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                            item.status === 'excused'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ছুটি
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        placeholder="মন্তব্য..."
                        value={item.remark || ''}
                        onChange={(e) => handleRemarkChange(idx, e.target.value)}
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}