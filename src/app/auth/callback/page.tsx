'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      // যদি মোবাইল ডিভাইস হয়, তবে কাস্টম স্কিমে অ্যাপে রিডাইরেক্ট করবে
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = `madrashaapp://auth-callback${search}${hash}`;
      }

      // ওয়েব বা ফলোব্যাক সেশন প্রসেসিং
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-sm w-full">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">লগইন সম্পন্ন হচ্ছে...</h2>
        <p className="text-sm text-gray-600 mb-4">অনুগ্রহ করে অপেক্ষা করুন, আপনাকে অ্যাপে নিয়ে যাওয়া হচ্ছে।</p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              const hash = window.location.hash || '';
              const search = window.location.search || '';
              window.location.href = `madrashaapp://auth-callback${search}${hash}`;
            }
          }}
          className="text-xs text-emerald-600 underline cursor-pointer"
        >
          অ্যাপ না খুললে এখানে ক্লিক করুন
        </button>
      </div>
    </div>
  );
}
