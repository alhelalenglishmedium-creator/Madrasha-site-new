'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'admin' | 'teacher' | 'student' | null;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  identifier?: string;
  avatarUrl?: string;
  extraData?: any; // ক্লাস বা ফোন নম্বর রাখার জন্য
}

interface AuthContextType {
  user: AuthUser | null;
  loginWithGoogle: () => Promise<void>;
  updateUserRole: (role: 'teacher' | 'student', identifier: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ADMIN_EMAIL = 'alhelalenglishmedium@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile(userId: string, email: string, rawName?: string, rawAvatar?: string) {
    try {
      const isMaster = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (isMaster) {
        setUser({
          id: userId,
          email,
          name: 'মুহতামিম / প্রধান প্রশাসক',
          role: 'admin',
          avatarUrl: rawAvatar,
        });
        return;
      }

      // ডাটাবেজ থেকে ইউজারের রোল ও প্রোফাইল চেক
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile && profile.role) {
        setUser({
          id: profile.id,
          email: profile.email || email,
          name: profile.full_name || rawName || 'ব্যবহারকারী',
          role: profile.role as UserRole,
          identifier: profile.identifier,
          avatarUrl: profile.avatar_url || rawAvatar,
        });
      } else {
        // নতুন ইউজার (এখনো রোল বা UID ভেরিফাই করেনি)
        setUser({
          id: userId,
          email,
          name: rawName || 'ব্যবহারকারী',
          role: null, // এটি রোল সিলেকশন মডাল ট্রিগার করবে
          avatarUrl: rawAvatar,
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.full_name,
          session.user.user_metadata?.avatar_url
        );
      } else {
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        loadProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.full_name,
          session.user.user_metadata?.avatar_url
        );
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  // রোল এবং UID যাচাইকরণ লজিক
  const updateUserRole = async (role: 'teacher' | 'student', identifier: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'ইউজার লগইন করা নেই।' };

    const cleanId = identifier.trim().toUpperCase();
    const targetTable = role === 'teacher' ? 'teachers' : 'students';

    try {
      // ১. রেডিমেড টেবিলে UID চেক
      const { data: record, error: verifyError } = await supabase
        .from(targetTable)
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (verifyError || !record) {
        return {
          success: false,
          message: `প্রদত্ত ${role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'} ইউআইডি (${cleanId}) পাওয়া যায়নি! সঠিক আইডি দিন।`,
        };
      }

      const verifiedName = record.name || user.name;
      const verifiedPhoto = record.photo_url || user.avatarUrl || '';

      // ২. profiles টেবিলে ডাটা সংরক্ষণ
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: verifiedName,
        role: role,
        identifier: cleanId,
        avatar_url: verifiedPhoto,
      });

      if (upsertError) {
        return { success: false, message: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' };
      }

      // ৩. স্টেট আপডেট
      setUser({
        ...user,
        name: verifiedName,
        role: role,
        identifier: cleanId,
        avatarUrl: verifiedPhoto,
      });

      return { success: true };
    } catch (err) {
      return { success: false, message: 'সার্ভার সমস্যা! কিছুক্ষণ পর আবার চেষ্টা করুন।' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, updateUserRole, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}