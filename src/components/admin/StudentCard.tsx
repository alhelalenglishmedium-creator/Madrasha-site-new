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
  Droplet,
  IdCard
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
    <div className="min-h-screen bg-gray-50 pb-24 pt-8 px-4">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">শিক্ষার্থী প্রোফাইল তালিকা</h1>
        <p className="text-gray-500">মাদরাসার সকল ছাত্রের তথ্য এখান থেকে পরিচালনা করুন</p>
      </div>

      {/* Filters Area */}
      <div className="max-w-4xl mx-auto mb-10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="নাম বা রোল দিয়ে খুঁজুন..."
              className="pl-10 h-12 bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              className="w-full h-12 pl-10 pr-4 rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">সকল বিভাগ</option>
              <option value="নূরানী">নূরানী</option>
              <option value="নাজেরা">নাজেরা</option>
              <option value="হিফজ">হিফজ</option>
              <option value="কিতাবখানা">কিতাবখানা</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="col-span-full text-center py-20 text-gray-400">তথ্য লোড হচ্ছে...</div>
        ) : (
          students.map((student) => (
            <Card key={student.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
              
              {/* Top Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingStudent(student); setIsModalOpen(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleArchive(student.id, student.fullNameBangla)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100">
                  <Archive size={16} />
                </button>
              </div>

              <CardContent className="pt-8 pb-6 px-6">
                {/* Section Name - Top Centered */}
                <div className="text-center mb-4">
                  <span className="px-4 py-1 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-full border border-indigo-100">
                    {student.className} {student.section ? `(${student.section})` : ''}
                  </span>
                </div>

                {/* Big Middle Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-white shadow-inner">
                      <User size={48} className="text-gray-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                      রোল: {student.rollNo}
                    </div>
                  </div>
                </div>

                {/* Student Name */}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-gray-900 leading-tight">
                    {student.fullNameBangla || student.fullName}
                  </h3>
                </div>

                {/* Professional Data List (Label - Value) */}
                <div className="space-y-3 border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">পিতার নাম</span>
                    <span className="text-gray-900 font-bold">{student.fatherName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">মোবাইল নম্বর</span>
                    <span className="text-indigo-600 font-bold flex items-center gap-1">
                      <Phone size={14} /> {student.phone}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">মাসিক ফি</span>
                    <span className="text-gray-900 font-black text-base">৳ {student.monthlyFee}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">রক্তের গ্রুপ</span>
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <Droplet size={14} className="fill-red-50" /> {student.bloodGroup || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-transform active:scale-90 z-50"
      >
        <UserPlus size={28} />
      </button>

      {/* Form Modal */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveStudent}
        initialData={editingStudent}
      />
    </div>
  );
}