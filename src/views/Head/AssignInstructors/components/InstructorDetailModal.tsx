import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InstructorItem } from '../types';

interface InstructorDetailModalProps {
  instructor: InstructorItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InstructorDetailModal({
  instructor,
  isOpen,
  onClose,
}: InstructorDetailModalProps) {
  if (!instructor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thông tin chi tiết Giảng viên"
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
            {instructor.full_name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">
              {instructor.full_name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px]">
                {instructor.degree}
              </Badge>
              <span className="text-muted-foreground text-[11px]">
                Mã GV: <strong>{instructor.instructor_code}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 border border-border rounded-lg bg-card">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Bộ môn quản lý</span>
            <span className="font-medium text-foreground text-xs mt-0.5 block">
              {instructor.department?.department_name || 'Bộ môn CNTT'}
            </span>
          </div>
          <div className="p-2.5 border border-border rounded-lg bg-card">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Kinh nghiệm công tác</span>
            <span className="font-medium text-foreground text-xs mt-0.5 block">
              {instructor.years_of_experience} năm
            </span>
          </div>
        </div>

        <div className="p-2.5 border border-border rounded-lg bg-card">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Hướng nghiên cứu & Chuyên môn</span>
          <p className="font-medium text-foreground text-xs mt-1">
            {instructor.specialization}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{instructor.email || 'Chưa có'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>{instructor.phone || 'Chưa có'}</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose} className="cursor-pointer">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
