import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { adminService } from '@/plugins/api';
import type { Faculty } from '@/types/api';

interface FacultyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFaculty: Faculty | null;
  onSuccess: () => void;
}

export default function FacultyFormDialog({
  open,
  onOpenChange,
  editingFaculty,
  onSuccess,
}: FacultyFormDialogProps) {
  const [formData, setFormData] = useState({
    faculty_code: '',
    faculty_name: '',
    address: '',
    email: '',
    status: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Khi mở form hoặc chuyển giữa thêm / sửa
  useEffect(() => {
    setFormData({
      faculty_code: editingFaculty?.faculty_code || '',
      faculty_name: editingFaculty?.faculty_name || '',
      address: editingFaculty?.address || '',
      email: editingFaculty?.email || '',
      status: editingFaculty?.status ?? true,
    });

    setError('');
  }, [editingFaculty, open]);

  // Xử lý submit
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate
    if (!formData.faculty_code.trim()) {
      setError('Vui lòng nhập mã khoa');
      return;
    }

    if (!formData.faculty_name.trim()) {
      setError('Vui lòng nhập tên khoa');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = {
        faculty_code: formData.faculty_code.trim(),
        faculty_name: formData.faculty_name.trim(),
        address: formData.address.trim() || undefined,
        email: formData.email.trim() || undefined,
        status: formData.status,
      };

      if (editingFaculty) {
        // Sửa khoa
        await adminService.updateFaculty(editingFaculty.id, data);
      } else {
        // Thêm khoa
        await adminService.createFaculty(data);
      }

      // Load lại danh sách
      await onSuccess();

      // Đóng form
      onOpenChange(false);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Có lỗi xảy ra khi lưu khoa',
      );
    } finally {
      setLoading(false);
    }
  };

  // Không render khi đóng
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!loading) {
            onOpenChange(false);
          }
        }}
      />

      {/* Form */}
      <div className="relative z-10 w-full max-w-[500px] rounded-lg bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            {editingFaculty ? 'Sửa khoa' : 'Thêm khoa mới'}
          </h2>

          <p className="text-sm text-gray-500">
            {editingFaculty
              ? 'Cập nhật thông tin khoa'
              : 'Nhập thông tin khoa mới'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Mã khoa */}
          <div className="grid gap-2">
            <Label htmlFor="faculty-code">Mã khoa *</Label>

            <Input
              id="faculty-code"
              value={formData.faculty_code}
              placeholder="VD: CNTT"
              disabled={loading}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  faculty_code: event.target.value,
                })
              }
            />
          </div>

          {/* Tên khoa */}
          <div className="grid gap-2">
            <Label htmlFor="faculty-name">Tên khoa *</Label>

            <Input
              id="faculty-name"
              value={formData.faculty_name}
              placeholder="VD: Công nghệ thông tin"
              disabled={loading}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  faculty_name: event.target.value,
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="faculty-address">Địa chỉ</Label>
            <Input
              id="faculty-address"
              value={formData.address}
              placeholder="VD: Tòa A, cơ sở 1"
              disabled={loading}
              onChange={(event) =>
                setFormData({ ...formData, address: event.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="faculty-email">Email</Label>
            <Input
              id="faculty-email"
              type="email"
              value={formData.email}
              placeholder="khoa@example.edu.vn"
              disabled={loading}
              onChange={(event) =>
                setFormData({ ...formData, email: event.target.value })
              }
            />
          </div>

          {/* Trạng thái */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.status}
              disabled={loading}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  status: event.target.checked,
                })
              }
            />
            Hoạt động
          </label>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Buttons */}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

              {editingFaculty ? 'Lưu thay đổi' : 'Thêm khoa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
