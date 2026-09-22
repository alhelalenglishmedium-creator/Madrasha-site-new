'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, GraduationCap, CalendarCheck, CircleDollarSign, Users } from 'lucide-react';

export function AdminBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'হোম', icon: House, path: '/dashboard' },
    { label: 'শিক্ষার্থী', icon: GraduationCap, path: '/students' },
    { label: 'হাজিরা', icon: CalendarCheck, path: '/attendance' },
    { label: 'ফি', icon: CircleDollarSign, path: '/fees' },
    { label: 'স্টাফ', icon: Users, path: '/staff' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] font-['Hind_Siliguri',sans-serif]">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 ${
                isActive
                  ? 'text-[#065F46] font-bold scale-105'
                  : 'text-[#64748B] font-medium hover:text-[#1E293B]'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="mt-1 h-1 w-1 rounded-full bg-[#065F46]"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}