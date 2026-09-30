'use client';

import React, { useState } from 'react';
import {
  Bell,
  LogOut,
  ChevronDown,
  Check,
  BookOpen,
  School,
  Users,
  Building2,
} from 'lucide-react';
import { useInstitution } from '@/context/InstitutionContext';
import { useAuth } from '@/context/AuthContext';

interface DashboardHeaderProps {
  onNotificationClick?: () => void;
  hasNotification?: boolean;
  onLogoutClick?: () => void;
}

export function DashboardHeader({
  onNotificationClick,
  hasNotification = false,
  onLogoutClick,
}: DashboardHeaderProps) {
  const [logoError, setLogoError] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const { user } = useAuth?.() || { user: null };
  const { currentInstitution, setInstitution, allInstitutions } = useInstitution();

  // প্রতিষ্ঠান পরিবর্তন সুবিধা (অ্যাডমিন বা একাধিক প্রতিষ্ঠান উপলব্ধ থাকলে)
  const isAdmin = user?.role === 'admin';
  const canSwitch = isAdmin || allInstitutions.length > 1;

  const getInstitutionIcon = (type: string) => {
    if (type === 'school') return School;
    if (type === 'mohila_madrasa') return Users;
    return BookOpen;
  };

  const CurrentIcon = getInstitutionIcon(currentInstitution.type);

  return (
    <header className="shrink-0 bg-white/95 backdrop-blur-md px-4 pt-3.5 pb-3 border-b border-slate-200/70 z-30 shadow-2xs font-hind relative">
      <div className="flex items-center justify-between">

        {/* ১. লোগো ও প্রতিষ্ঠানের নাম */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#008955] via-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 overflow-hidden border border-emerald-100">
            {!logoError ? (
              <img
                src="/logo.png"
                alt="প্রতিষ্ঠান লোগো"
                className="w-full h-full object-cover rounded-full"
                onError={() => setLogoError(true)}
              />
            ) : (
              <CurrentIcon size={18} />
            )}
          </div>

          <div className="min-w-0 flex-1 relative">
            {canSwitch ? (
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 text-left w-full group focus:outline-none cursor-pointer"
              >
                <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate tracking-tight group-hover:text-[#008955] transition">
                  {currentInstitution.name}
                </h1>
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-slate-500 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-[#008955]' : ''
                  }`}
                />
              </button>
            ) : (
              <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate tracking-tight">
                {currentInstitution.name}
              </h1>
            )}

            <p className="text-[10px] text-[#008955] font-bold truncate leading-none mt-0.5">
              {currentInstitution.shortName} • {currentInstitution.tagline}
            </p>
          </div>
        </div>

        {/* ২. একশন বাটনসমূহ (নোটিফিকেশন ও লগআউট) */}
        <div className="flex items-center gap-2 shrink-0">
          {onNotificationClick && (
            <button
              type="button"
              onClick={onNotificationClick}
              className="relative h-9 w-9 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition flex items-center justify-center active:scale-90 shadow-2xs cursor-pointer"
              title="বিজ্ঞপ্তি"
            >
              <Bell className="w-4 h-4 text-slate-700 stroke-[2.2]" />
              {hasNotification && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white" />
                </span>
              )}
            </button>
          )}

          {onLogoutClick && (
            <button
              type="button"
              onClick={onLogoutClick}
              className="h-9 w-9 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 transition flex items-center justify-center active:scale-90 shadow-2xs cursor-pointer"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}
        </div>

      </div>

      {/* ৩. সুইচার ড্রপডাউন মেনু */}
      {canSwitch && isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute left-4 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 flex items-center gap-1">
              <Building2 size={12} className="text-[#008955]" />
              <span>প্রতিষ্ঠান নির্বাচন করুন</span>
            </div>

            <div className="mt-1 space-y-1">
              {allInstitutions.map((inst) => {
                const isSelected = currentInstitution.id === inst.id;
                const Icon = getInstitutionIcon(inst.type);

                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => {
                      setInstitution(inst);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition active:scale-98 ${
                      isSelected
                        ? 'bg-[#E7F6ED] text-[#008955] font-bold border border-[#BBE3D3]'
                        : 'hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#008955] text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight">{inst.name}</p>
                        <p className="text-[9px] opacity-75 truncate">{inst.tagline}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-[#008955] shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
