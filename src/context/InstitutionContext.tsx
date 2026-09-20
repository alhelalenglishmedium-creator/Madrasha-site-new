'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { INSTITUTIONS, type Institution } from '@/lib/constants';
import type { InstitutionType } from '@/types/database.types';

interface InstitutionContextType {
  currentInstitution: Institution;
  setInstitution: (inst: Institution) => void;
  setInstitutionById: (id: string) => void;
  setInstitutionByType: (type: InstitutionType) => void;
  allInstitutions: Institution[];
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

const STORAGE_KEY = 'selected_institution';

export function InstitutionProvider({ children }: { children: React.ReactNode }) {
  const [currentInstitution, setCurrentInstitution] = useState<Institution>(INSTITUTIONS[0]);

  // Mount এ লোকালস্টোরেজ থেকে সংরক্ষিত প্রতিষ্ঠান লোড
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.id || parsed.type)) {
            const match = INSTITUTIONS.find(
              (inst) => inst.id === parsed.id || inst.type === parsed.type
            );
            if (match) {
              setCurrentInstitution(match);
            }
          }
        }
      } catch (e) {
        console.warn('Institution session load warning:', e);
      }
    }
  }, []);

  const setInstitution = (inst: Institution) => {
    setCurrentInstitution(inst);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inst));
      } catch (e) {}
    }
  };

  const setInstitutionById = (id: string) => {
    const found = INSTITUTIONS.find((inst) => inst.id === id);
    if (found) {
      setInstitution(found);
    }
  };

  const setInstitutionByType = (type: InstitutionType) => {
    const found = INSTITUTIONS.find((inst) => inst.type === type);
    if (found) {
      setInstitution(found);
    }
  };

  return (
    <InstitutionContext.Provider
      value={{
        currentInstitution,
        setInstitution,
        setInstitutionById,
        setInstitutionByType,
        allInstitutions: INSTITUTIONS,
      }}
    >
      {children}
    </InstitutionContext.Provider>
  );
}

export function useInstitution() {
  const context = useContext(InstitutionContext);
  if (!context) {
    // সেফ ফলব্যাক যদি প্রোভাইডারের বাইরে থেকে কল হয়
    return {
      currentInstitution: INSTITUTIONS[0],
      setInstitution: () => {},
      setInstitutionById: () => {},
      setInstitutionByType: () => {},
      allInstitutions: INSTITUTIONS,
    };
  }
  return context;
}
