'use client';

import React, { useEffect } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 3; // Never show more than 3 at once

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => {
      // Deduplicate: if an identical message is already visible, skip
      const isDuplicate = state.toasts.some(
        (t) => t.message === message && t.type === type
      );
      if (isDuplicate) return state;

      // Keep only the latest MAX_TOASTS items (drop oldest if full)
      const next = [...state.toasts, { id, message, type }];
      return { toasts: next.slice(-MAX_TOASTS) };
    });
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
  error:   (msg: string) => useToastStore.getState().addToast(msg, 'error'),
  info:    (msg: string) => useToastStore.getState().addToast(msg, 'info'),
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-[90vw] w-80 pointer-events-none"
      aria-live="polite"
      aria-label="Bildirimler"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgStyles = {
    success: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200',
    error:   'bg-rose-950/90 border-rose-500/30 text-rose-200',
    info:    'bg-slate-900/90 border-purple-500/30 text-purple-200',
  };

  const icons = {
    success: (
      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`flex items-start gap-2.5 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl pointer-events-auto ${bgStyles[toast.type]}`}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-medium leading-5 break-words">{toast.message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors mt-0.5"
        aria-label="Kapat"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
