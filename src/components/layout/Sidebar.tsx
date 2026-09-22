'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CircleDollarSign,
  FileSpreadsheet,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { name: 'ড্যাশবোর্ড', href: '/dashboard', icon: LayoutDashboard },
  { name: 'শিক্ষার্থী', href: '/students', icon: GraduationCap },
  { name: 'শিক্ষক ও স্টাফ', href: '/staff', icon: Users },
  { name: 'হাজিরা', href: '/attendance', icon: CalendarCheck },
  { name: 'ফি ও হিসাব', href: '/fees', icon: CircleDollarSign },
  { name: 'রিপোর্ট ও PDF', href: '/reports', icon: FileSpreadsheet },
  { name: 'সেটিংস', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-sm">
              ম
            </div>
            <span className="font-bold text-base text-slate-800 tracking-tight">
              মাদ্রাসা ম্যানেজমেন্ট
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all select-none',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-emerald-600' : 'text-slate-400'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">এডমিন প্যানেল</p>
            <p className="mt-0.5">ভার্সন ১.০ (অফলাইন সক্রিয়)</p>
          </div>
        </div>
      </aside>
    </>
  );
}