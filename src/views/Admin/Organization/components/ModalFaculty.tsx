import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Faculty } from '@/types/api';

interface ModalFacultyProps {
  isOpen: boolean;
  onClose: () => void;
  editingFaculty: Faculty | null;
  onSubmit: (data: {
    faculty_code: string;
    faculty_name: string;
    address?: string;
    phone?: string;
    email?: string;
    status: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function ModalFaculty({
  isOpen,
  onClose,
  editingFaculty,
  onSubmit,
  isSubmitting,
}: ModalFacultyProps) {
  const [formData, setFormData] = useState({
    faculty_code: '',
    faculty_name: '',
    address: '',
    phone: '',
    email: '',
    status: true,
  });

  useEffect(() => {
    if (editingFaculty) {
      setFormData({
        faculty_code: editingFaculty.faculty_code || '',
        faculty_name: editingFaculty.faculty_name || '',
        address: editingFaculty.address || '',
        phone: editingFaculty.phone || '',
        email: editingFaculty.email || '',
        status: editingFaculty.status !== false,
      });
    } else {
      setFormData({
        faculty_code: '',
        faculty_name: '',
        address: '',
        phone: '',
        email: '',
        status: true,
      });
    }
  }, [editingFaculty, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.faculty_code.trim() || !formData.faculty_name.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã khoa và Tên khoa');
      return;
    }
    await onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingFaculty ? 'Chỉnh sửa Khoa' : 'Thêm Khoa mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Mã khoa <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.faculty_code}
            onChange={(e) => setFormData((prev) => ({ ...prev, faculty_code: e.target.value }))}
            placeholder="VD: CNTT, DĐT, CKT..."
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            Tên khoa <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.faculty_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, faculty_name: e.target.value }))}
            placeholder="VD: Khoa Công nghệ Thông tin"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Email liên hệ</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="fit@utehy.edu.vn"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Số điện thoại</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="02213xxxx"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Địa chỉ văn phòng</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="VD: Tòa nhà A1, cơ sở Khoái Châu"
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="modal_faculty_status"
            checked={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.checked }))}
            className="rounded border-input text-primary focus:ring-primary w-4 h-4"
          />
          <Label htmlFor="modal_faculty_status" className="text-sm font-medium cursor-pointer">
            Đang hoạt động
          </Label>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            {editingFaculty ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
