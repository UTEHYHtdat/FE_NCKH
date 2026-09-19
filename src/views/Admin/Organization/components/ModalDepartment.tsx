import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Faculty, Department } from '@/types/api';

interface ModalDepartmentProps {
  isOpen: boolean;
  onClose: () => void;
  editingDepartment: Department | null;
  faculties: Faculty[];
  onSubmit: (data: {
    department_code: string;
    department_name: string;
    faculty_id: number;
    description?: string;
    status: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function ModalDepartment({
  isOpen,
  onClose,
  editingDepartment,
  faculties,
  onSubmit,
  isSubmitting,
}: ModalDepartmentProps) {
  const [formData, setFormData] = useState({
    department_code: '',
    department_name: '',
    faculty_id: '' as string | number,
    description: '',
    status: true,
  });

  useEffect(() => {
    if (editingDepartment) {
      setFormData({
        department_code: editingDepartment.department_code || '',
        department_name: editingDepartment.department_name || '',
        faculty_id: editingDepartment.faculty_id || faculties[0]?.id || '',
        description: (editingDepartment as any).description || '',
        status: editingDepartment.status !== false,
      });
    } else {
      setFormData({
        department_code: '',
        department_name: '',
        faculty_id: faculties[0]?.id || '',
        description: '',
        status: true,
      });
    }
  }, [editingDepartment, faculties, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_code.trim() || !formData.department_name.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã bộ môn và Tên bộ môn');
      return;
    }

    if (!formData.faculty_id) {
      toast.error('Vui lòng chọn Khoa trực thuộc');
      return;
    }

    await onSubmit({
      department_code: formData.department_code.trim(),
      department_name: formData.department_name.trim(),
      faculty_id: Number(formData.faculty_id),
      description: formData.description.trim(),
      status: formData.status,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingDepartment ? 'Chỉnh sửa Bộ môn' : 'Thêm Bộ môn mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Khoa trực thuộc <span className="text-destructive">*</span>
          </Label>
          <select
            value={formData.faculty_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, faculty_id: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            {faculties.length === 0 ? (
              <option value="">Chưa có khoa nào trong hệ thống, hãy tạo khoa trước</option>
            ) : (
              faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.faculty_name} ({f.faculty_code})
                </option>
              ))
            )}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Mã bộ môn <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.department_code}
            onChange={(e) => setFormData((prev) => ({ ...prev, department_code: e.target.value }))}
            placeholder="VD: KTPM, HTTT, MMT, KHMT..."
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Tên bộ môn <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.department_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, department_name: e.target.value }))}
            placeholder="VD: Bộ môn Kỹ thuật Phần mềm"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Mô tả giới thiệu</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Mô tả tóm tắt về chuyên môn bộ môn..."
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="modal_department_status"
            checked={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.checked }))}
            className="rounded border-input text-primary focus:ring-primary w-4 h-4"
          />
          <Label htmlFor="modal_department_status" className="text-sm font-medium cursor-pointer">
            Đang hoạt động
          </Label>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            {editingDepartment ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
