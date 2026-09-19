import React from 'react';
import { AlertCircle, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedChangesBannerProps {
  hasUnsavedChanges: boolean;
  assignedCount: number;
  isSaving: boolean;
  disabled: boolean;
  onSave: () => void;
}

export function UnsavedChangesBanner({
  hasUnsavedChanges,
  assignedCount,
  isSaving,
  disabled,
  onSave,
}: UnsavedChangesBannerProps) {
  if (!hasUnsavedChanges) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-sm shadow-sm mb-6">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <span>
          Bạn có thay đổi phân công giáo viên <strong>chưa lưu</strong> (Hiện chọn <strong>{assignedCount}</strong> giảng viên). Hãy bấm nút <strong>"Lưu phân công giáo viên"</strong> để áp dụng vào đợt đề tài.
        </span>
      </div>
      <Button
        size="sm"
        onClick={onSave}
        disabled={disabled || isSaving}
        className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
      >
        {isSaving ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        Lưu thay đổi ngay
      </Button>
    </div>
  );
}
