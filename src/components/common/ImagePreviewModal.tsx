'use client';

import React from 'react';
import { X, Download, User } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  title?: string;
  subtitle?: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'ছবি',
  subtitle,
}: ImagePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-sm sm:max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-4 shadow-2xl flex flex-col items-center justify-center space-y-3 font-hind"
      >
        {/* টপ বার */}
        <div className="w-full flex items-center justify-between text-white border-b border-slate-800 pb-2.5">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold truncate leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-[10px] text-emerald-400 font-medium truncate mt-0.5 font-sans">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-95 border border-slate-700 cursor-pointer"
                title="ডাউনলোড করুন"
              >
                <Download size={14} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition active:scale-95 border border-slate-700 cursor-pointer"
              title="বন্ধ করুন"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ফুল ইমেজ ভিউ */}
        <div className="w-full max-h-[70vh] aspect-square rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800/80">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600 space-y-1">
              <User size={48} />
              <p className="text-xs font-semibold">কোনো ছবি নেই</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
