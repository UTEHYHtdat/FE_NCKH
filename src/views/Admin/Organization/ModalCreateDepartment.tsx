import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminService } from '@/plugins/api';
import type { Department, Faculty } from '@/types/api';

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDepartment: Department | null;
  faculties: Faculty[];
  onSuccess: () => void;
}

export default function DepartmentFormDialog({
  open,
  onOpenChange,
  editingDepartment,
  faculties,
  onSuccess,
}: DepartmentFormDialogProps) {
  const [formData, setFormData] = useState({
    department_code: '',
    department_name: '',
    address: '',
    email: '',
    faculty_id: '',
    status: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      department_code: editingDepartment?.department_code || '',
      department_name: editingDepartment?.department_name || '',
      address: editingDepartment?.address || '',
      email: editingDepartment?.email || '',
      faculty_id: editingDepartment?.faculty_id?.toString() || '',
      status: editingDepartment?.status ?? true,
    });
    setError('');
  }, [editingDepartment, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.department_code.trim() || !formData.department_name.trim()) {
      setError('Vui lòng nhập đầy đủ mã bộ môn và tên bộ môn');
      return;
    }
    if (!formData.faculty_id) {
      setError('Vui lòng chọn khoa');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = {
        department_code: formData.department_code.trim(),
        department_name: formData.department_name.trim(),
        address: formData.address.trim() || undefined,
        email: formData.email.trim() || undefined,
        faculty_id: Number(formData.faculty_id),
        status: formData.status,
      };
      if (editingDepartment)
        await adminService.updateDepartment(editingDepartment.id, data);
      else await adminService.createDepartment(data);
      await onSuccess();
      onOpenChange(false);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Có lỗi xảy ra khi lưu bộ môn',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-[500px] rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            {editingDepartment ? 'Sửa bộ môn' : 'Thêm bộ môn mới'}
          </h2>
          <p className="text-sm text-gray-500">
            {editingDepartment
              ? 'Cập nhật thông tin bộ môn'
              : 'Nhập thông tin bộ môn mới'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="department-code">Mã bộ môn *</Label>
            <Input
              id="department-code"
              value={formData.department_code}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  department_code: event.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department-name">Tên bộ môn *</Label>
            <Input
              id="department-name"
              value={formData.department_name}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  department_name: event.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department-address">Địa chỉ</Label>
            <Input
              id="department-address"
              value={formData.address}
              onChange={(event) =>
                setFormData({ ...formData, address: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department-email">Email</Label>
            <Input
              id="department-email"
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData({ ...formData, email: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Khoa *</Label>
            <Select
              value={formData.faculty_id}
              onValueChange={(value) =>
                setFormData({ ...formData, faculty_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn khoa" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id.toString()}>
                    {faculty.faculty_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.status}
              onChange={(event) =>
                setFormData({ ...formData, status: event.target.checked })
              }
            />
            Hoạt động
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDepartment ? 'Lưu thay đổi' : 'Thêm bộ môn'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
