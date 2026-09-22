'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Archive,
  Phone,
  User,
  Droplet
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { StudentFormModal } from '@/app/students/StudentFormModal';
import {
  getStudents,
  addStudent,
  updateStudent,
  archiveStudent,
} from '@/services/studentsService';
import type { Student } from '@/types/database.types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStudents({
        searchQuery,
        className: selectedClass,
        status: 'active',
      });
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedClass]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleSaveStudent = async (data: any) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, data);
    } else {
      await addStudent(data);
    }
    await loadStudents();
  };

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${name}"-কে আর্কাইভ করতে চান?`)) {
      await archiveStudent(id);
      await loadStudents();
    }
  };

  return (
    <div className="relative min-h-screen pb-32 pt-10 px-4 space-y-8 bg-slate-50/50">
      
      {/* Header Section - Exactly as requested */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">শিক্ষার্থী তালিকা</h2>
        <div className="inline-flex items-center gap-2 px-6 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">
            {selectedClass === 'all' ? 'সর্বমোট শিক্ষার্থী' : `${selectedClass} বিভাগে`} : 
            <span className="ml-1 font-bold text-lg text-emerald-600">{students.length} জন</span>
          </p>
        </div>
      </div>

      {/* Filter & Search Bar - Minimal Style */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative group">
          <Input
            placeholder="নাম, রোল বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />}
            className="bg-white shadow-sm border-slate-200 h-12 text-base rounded-xl"
          />
        </div>
        
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">সকল বিভাগ/শ্রেণি</option>
            <option value="নূরানী">নূরানী</option>
            <option value="নাজেরা">নাজেরা</option>
            <option value="হিফজ">হিফজ</option>
            <option value="কিতাবখানা">কিতাবখানা</option>
          </select>
          <Filter className="absolute right-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Student Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-2">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-slate-400 animate-pulse font-medium">লোড হচ্ছে...</div>
        ) : (
          students.map((student) => (
            <Card key={student.id} className="bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
              
              {/* Top-Right Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => { setEditingStudent(student); setIsModalOpen(true); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleArchive(student.id, student.fullNameBangla)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">
                  <Archive size={18} />
                </button>
              </div>

              <CardContent className="p-8">
                {/* Department Badge */}
                <div className="text-center mb-6">
                  <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-wide">
                    {student.className} {student.section ? `(${student.section})` : ''}
                  </span>
                </div>

                {/* Big Centered Avatar & Roll */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-inner group-hover:scale-105 transition-transform duration-300">
                      <User size={48} className="text-slate-300" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-lg border-2 border-white">
                      রোল: {student.rollNo}
                    </div>
                  </div>
                </div>

                {/* Student Name */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    {student.fullNameBangla || student.fullName}
                  </h3>
                </div>

                {/* Info List (Label - Value) */}
                <div className="space-y-4 border-t border-slate-50 pt-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">পিতার নাম</span>
                    <span className="text-slate-900 font-bold">{student.fatherName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">মোবাইল নম্বর</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                      <Phone size={14} strokeWidth={3} /> {student.phone}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">মাসিক ফি</span>
                    <span className="text-slate-900 font-black text-lg">৳ {student.monthlyFee}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">রক্তের গ্রুপ</span>
                    <span className="text-rose-600 font-bold flex items-center gap-1.5">
                      <Droplet size={14} className="fill-rose-600/10" /> {student.bloodGroup || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Action Button (FAB) - Moved Higher up */}
      <div className="fixed bottom-28 right-8 z-50">
        <button
          onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
          className="w-16 h-16 bg-emerald-600 text-white rounded-[1.8rem] shadow-2xl shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 hover:rotate-90 active:scale-90 transition-all duration-500 group relative"
        >
          <UserPlus size={28} />
          {/* Tooltip for desktop */}
          <span className="absolute right-20 bg-slate-800 text-white text-[10px] px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block shadow-lg">
            নতুন শিক্ষার্থী ভর্তি করুন
          </span>
        </button>
      </div>

      {/* Student Form Modal */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveStudent}
        initialData={editingStudent}
      />
    </div>
  );
}