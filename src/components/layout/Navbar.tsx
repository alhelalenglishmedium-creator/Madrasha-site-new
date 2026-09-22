'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'ড্যাশবোর্ড',
  '/students': 'শিক্ষার্থী ব্যবস্থাপনা',
  '/staff': 'শিক্ষক ও স্টাফ তালিকা',
  '/attendance': 'দৈনিক হাজিরা',
  '/fees': 'ফি ও হিসাব ব্যবস্থাপনা',
  '/reports': 'রিপোর্ট ও PDF এক্সপোর্ট',
  '/settings': 'মাদ্রাসা সেটিংস',
};

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTitle = () => {
    if (!pathname) return 'মাদ্রাসা ম্যানেজমেন্ট';
    const match = Object.keys(pageTitles).find((key) => pathname.startsWith(key));
    return match ? pageTitles[match] : 'মাদ্রাসা ম্যানেজমেন্ট';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 sm:text-xl">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Network Connectivity Status Indicator */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
          title={isOnline ? 'ইন্টারনেট সংযুক্ত' : 'অফলাইন মোড সক্রিয়'}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">অনলাইন</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              <span>অফলাইন</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}