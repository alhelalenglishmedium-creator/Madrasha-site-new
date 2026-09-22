'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  GraduationCap,
  CalendarDays,
  CircleDollarSign,
  UserRound,
  BookOpen,
  ClipboardCheck,
  Bell,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pupleaopydtjqlcplaha.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cGxlYW9weWR0anFsY3BsYWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDE0ODcsImV4cCI6MjEwMzgxNzQ4N30.amZEKNxP1xpo8BLs8t0MdbNIwu9CCdwE252iMTn78mU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const roleNavItems = {
  admin: [
    { label: 'হোম', href: '/dashboard', icon: House },
    { label: 'শিক্ষার্থী', href: '/students', icon: GraduationCap },
    { label: 'হাজিরা', href: '/attendance', icon: CalendarDays },
    { label: 'ফি', href: '/fees', icon: CircleDollarSign },
    { label: 'স্টাফ', href: '/staff', icon: UserRound },
  ],
  teacher: [
    { label: 'হোম', href: '/teacher/dashboard', icon: House },
    { label: 'হাজিরা', href: '/teacher/attendance', icon: ClipboardCheck },
    { label: 'ক্লাস', href: '/teacher/classes', icon: BookOpen },
    { label: 'নোটিশ', href: '/notices', icon: Bell },
    { label: 'প্রোফাইল', href: '/profile', icon: UserRound },
  ],
  student: [
    { label: 'হোম', href: '/student/dashboard', icon: House },
    { label: 'হাজিরা', href: '/student/attendance', icon: CalendarDays },
    { label: 'ফি', href: '/student/fees', icon: CircleDollarSign },
    { label: 'নোটিশ', href: '/notices', icon: Bell },
    { label: 'প্রোফাইল', href: '/profile', icon: UserRound },
  ],
};

export function BottomNav() {
  const pathname = usePathname();
  // ডিফল্টভাবে 'admin' সেট করে রাখা হয়েছে যাতে ফাঁকা না দেখায়
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('admin');

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // ইউজার না পেলেও পাথনেম অনুযায়ী রোল নির্ধারণ
          if (pathname.startsWith('/teacher')) setRole('teacher');
          else if (pathname.startsWith('/student')) setRole('student');
          else setRole('admin');
          return;
        }

        // profiles টেবিল থেকে রোল আনা
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role) {
          setRole(profile.role.toLowerCase());
        } else {
          // প্রোফাইলে ডাটা না পেলে বর্তমান URL দেখে রোল ঠিক হবে
          if (pathname.startsWith('/teacher')) setRole('teacher');
          else if (pathname.startsWith('/student')) setRole('student');
          else setRole('admin');
        }
      } catch (error) {
        console.error('Error fetching role:', error);
      }
    }

    fetchUserRole();
  }, [pathname]);

  const currentNavItems = roleNavItems[role] || roleNavItems.admin;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 block border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.04)] lg:hidden">
      <div 
        className="mx-auto grid h-16 max-w-lg items-center px-1"
        style={{ gridTemplateColumns: `repeat(${currentNavItems.length}, minmax(0, 1fr))` }}
      >
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-1 transition-colors"
            >
              <Icon
                className={`h-5 w-5 transition-transform ${
                  isActive
                    ? 'scale-110 text-[#064e3b] stroke-[2.2]'
                    : 'text-slate-400 stroke-[1.7]'
                }`}
              />
              <span
                className={`text-[10.5px] tracking-tight ${
                  isActive
                    ? 'font-bold text-[#064e3b]'
                    : 'font-medium text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}