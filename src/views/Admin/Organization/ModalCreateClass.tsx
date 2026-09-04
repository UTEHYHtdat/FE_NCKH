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

import type { Class } from '@/types/api';

interface Major {
  id: number;
  major_name: string;
}

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // null = tạo mới
  // object = sửa
  editingClass: Class | null;

  majors: Major[];

  onSuccess: () => void;
}

export default function ClassFormDialog({
  open,
  onOpenChange,
  editingClass,
  majors,
  onSuccess,
}: ClassFormDialogProps) {
  const [formData, setFormData] = useState({
    class_code: '',
    class_name: '',
    major_id: '',
    academic_year: '',
    advisor_id: '',
    status: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Khi mở dialog hoặc chọn lớp sửa
  useEffect(() => {
    if (editingClass) {
      setFormData({
        class_code: editingClass.class_code,
        class_name: editingClass.class_name,
        major_id: editingClass.major_id ? String(editingClass.major_id) : '',
        academic_year: editingClass.academic_year || '',
        advisor_id: editingClass.advisor_id
          ? String(editingClass.advisor_id)
          : '',
        status: editingClass.status,
      });
    } else {
      setFormData({
        class_code: '',
        class_name: '',
        major_id: '',
        academic_year: '',
        advisor_id: '',
        status: true,
      });
    }

    setError('');
  }, [editingClass, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.class_code.trim()) {
      setError('Vui lòng nhập mã lớp');
      return;
    }

    if (!formData.class_name.trim()) {
      setError('Vui lòng nhập tên lớp');
      return;
    }

    if (!formData.major_id) {
      setError('Vui lòng chọn chuyên ngành');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = {
        class_code: formData.class_code.trim(),
        class_name: formData.class_name.trim(),
        major_id: Number(formData.major_id),
        academic_year: formData.academic_year.trim() || undefined,
        advisor_id: formData.advisor_id ? Number(formData.advisor_id) : null,
        status: formData.status,
      };

      if (editingClass) {
        // Sửa
        await adminService.updateClass(editingClass.id, data);
      } else {
        // Tạo
        await adminService.createClass(data);
      }

      await onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);

      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu lớp học');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-[500px] rounded-lg bg-white p-6 shadow-lg">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                {editingClass ? 'Sửa lớp học' : 'Thêm lớp học mới'}
              </h2>

              <p className="text-sm text-gray-500">
                {editingClass
                  ? 'Cập nhật thông tin lớp học'
                  : 'Nhập thông tin lớp học mới'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                {/* Mã lớp */}
                <div className="grid gap-2">
                  <Label>Mã lớp *</Label>

                  <Input
                    value={formData.class_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        class_code: e.target.value,
                      })
                    }
                    placeholder="VD: CNTT01"
                  />
                </div>

                {/* Tên lớp */}
                <div className="grid gap-2">
                  <Label>Tên lớp *</Label>

                  <Input
                    value={formData.class_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        class_name: e.target.value,
                      })
                    }
                    placeholder="VD: Công nghệ thông tin 01"
                  />
                </div>

                {/* Chuyên ngành */}
                <div className="grid gap-2">
                  <Label>Chuyên ngành *</Label>

                  <Select
                    value={formData.major_id}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        major_id: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chuyên ngành" />
                    </SelectTrigger>

                    <SelectContent>
                      {majors.map((major) => (
                        <SelectItem key={major.id} value={String(major.id)}>
                          {major.major_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Năm học */}
                <div className="grid gap-2">
                  <Label>Năm học</Label>

                  <Input
                    value={formData.academic_year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        academic_year: e.target.value,
                      })
                    }
                    placeholder="VD: 2025-2026"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="class-advisor">Mã giảng viên cố vấn</Label>
                  <Input
                    id="class-advisor"
                    type="number"
                    value={formData.advisor_id}
                    onChange={(e) =>
                      setFormData({ ...formData, advisor_id: e.target.value })
                    }
                    placeholder="VD: 12"
                  />
                </div>

                {/* Trạng thái */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked,
                      })
                    }
                  />

                  <Label>Hoạt động</Label>
                </div>

                {/* Lỗi */}
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Hủy
                </Button>

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                  {editingClass ? 'Lưu thay đổi' : 'Thêm lớp'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
