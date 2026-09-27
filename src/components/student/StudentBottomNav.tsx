'use client';

import React from 'react';
import {
  Home,
  Receipt,
  Award,
  Bell,
  User,
} from 'lucide-react';
import type { StudentTab } from './StudentDashboard';

interface StudentBottomNavProps {
  activeTab: StudentTab;
  setActiveTab: (tab: StudentTab) => void;
  isSchool?: boolean;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({
  activeTab,
  setActiveTab,
  isSchool = false,
}) => {
  const navItems = [
    {
      id: 'home' as StudentTab,
      label: 'হোম',
      icon: Home,
      color: isSchool ? 'from-blue-600 to-indigo-700' : 'from-emerald-500 to-teal-600',
      activeText: isSchool ? 'text-blue-700' : 'text-emerald-700',
    },
    {
      id: 'fees' as StudentTab,
      label: isSchool ? 'টিউশন ফি' : 'ফি ও রসিদ',
      icon: Receipt,
      color: 'from-sky-500 to-blue-600',
      activeText: 'text-sky-700',
    },
    {
      id: 'results' as StudentTab,
      label: isSchool ? 'টার্ম রেজাল্ট' : 'ফলাফল',
      icon: Award,
      color: 'from-amber-500 to-orange-500',
      activeText: 'text-amber-700',
    },
    {
      id: 'notices' as StudentTab,
      label: isSchool ? 'সার্কুলার' : 'বিজ্ঞপ্তি',
      icon: Bell,
      color: 'from-rose-500 to-pink-600',
      activeText: 'text-rose-700',
    },
    {
      id: 'profile' as StudentTab,
      label: isSchool ? 'আইডি কার্ড' : 'প্রোফাইল',
      icon: User,
      color: 'from-purple-500 to-indigo-600',
      activeText: 'text-purple-700',
    },
  ];

  return (
    <nav className="shrink-0 w-full bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-3 pt-2 pb-5 sm:pb-3.5 flex items-center justify-around z-40 shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center group transition active:scale-90"
          >
            <div
              className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${item.color} text-white shadow-md scale-105`
                  : 'text-slate-400 group-hover:text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <IconComponent
                className={`w-4.5 h-4.5 transition-transform duration-200 ${
                  isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'
                }`}
              />
            </div>

            <span
              className={`text-[10px] mt-1 transition-colors ${
                isActive ? `font-bold ${item.activeText}` : 'font-medium text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};