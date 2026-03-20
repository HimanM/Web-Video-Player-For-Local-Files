'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              type === 'danger' ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
            )}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-lg font-bold text-foreground leading-tight">{title}</h3>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex flex-col gap-2">
            <button 
              onClick={onConfirm}
              className={cn(
                "w-full py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm",
                type === 'danger' ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {confirmText}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold transition-all text-sm border border-border"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
