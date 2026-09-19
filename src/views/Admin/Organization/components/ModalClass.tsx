import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCurrentAcademicYear } from '@/helpers/academicYear';
import type { Class } from '@/types/api';

interface ModalClassProps {
  isOpen: boolean;
  onClose: () => void;
  editingClass: Class | null;
  majors: any[];
  onSubmit: (data: {
    class_code: string;
    class_name: string;
    major_id?: number;
    academic_year: string;
    status: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function ModalClass({
  isOpen,
  onClose,
  editingClass,
  majors,
  onSubmit,
  isSubmitting,
}: ModalClassProps) {
  const [formData, setFormData] = useState({
    class_code: '',
    class_name: '',
    major_id: '' as string | number,
    academic_year: getCurrentAcademicYear(),
    status: true,
  });

  useEffect(() => {
    if (editingClass) {
      setFormData({
        class_code: editingClass.class_code || '',
        class_name: editingClass.class_name || '',
        major_id: editingClass.major_id || majors[0]?.id || '',
        academic_year: editingClass.academic_year || getCurrentAcademicYear(),
        status: editingClass.status !== false,
      });
    } else {
      setFormData({
        class_code: '',
        class_name: '',
        major_id: majors[0]?.id || '',
        academic_year: getCurrentAcademicYear(),
        status: true,
      });
    }
  }, [editingClass, majors, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_code.trim() || !formData.class_name.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã lớp và Tên lớp');
      return;
    }

    const payload: {
      class_code: string;
      class_name: string;
      major_id?: number;
      academic_year: string;
      status: boolean;
    } = {
      class_code: formData.class_code.trim(),
      class_name: formData.class_name.trim(),
      academic_year: formData.academic_year.trim(),
      status: formData.status,
    };

    if (formData.major_id) {
      payload.major_id = Number(formData.major_id);
    }

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingClass ? 'Chỉnh sửa Lớp học' : 'Thêm Lớp học mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Chuyên ngành / Bộ môn <span className="text-destructive">*</span>
          </Label>
          <select
            value={formData.major_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, major_id: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            {majors.length === 0 ? (
              <option value="">Chưa có chuyên ngành/bộ môn nào, hãy tạo bộ môn trước</option>
            ) : (
              majors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.major_name} ({m.major_code})
                </option>
              ))
            )}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              Mã lớp <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.class_code}
              onChange={(e) => setFormData((prev) => ({ ...prev, class_code: e.target.value }))}
              placeholder="VD: 124211"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              Niên khóa / Năm học <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.academic_year}
              onChange={(e) => setFormData((prev) => ({ ...prev, academic_year: e.target.value }))}
              placeholder={getCurrentAcademicYear()}
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Tên lớp học <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.class_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, class_name: e.target.value }))}
            placeholder="VD: 124211 - Kỹ thuật phần mềm 1 - K21"
            required
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="modal_class_status"
            checked={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.checked }))}
            className="rounded border-input text-primary focus:ring-primary w-4 h-4"
          />
          <Label htmlFor="modal_class_status" className="text-sm font-medium cursor-pointer">
            Đang hoạt động
          </Label>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            {editingClass ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
