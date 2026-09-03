import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/plugins/api';
import { toast } from 'sonner';
import { Loader2, KeyRound, User, Mail, Phone, Shield } from 'lucide-react';

interface ModalEditUserProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any | null;
}

export function ModalEditUser({ isOpen, onClose, onSuccess, user }: ModalEditUserProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    status: true,
    password: '',
    student_code: '',
    instructor_code: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        status: user.status !== undefined ? user.status : true,
        password: '',
        student_code: user.students?.student_code || '',
        instructor_code: user.instructors?.instructor_code || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'status') {
      setFormData(prev => ({ ...prev, status: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const payload: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (user.students && formData.student_code) {
        payload.student_code = formData.student_code.trim();
      }

      if (user.instructors && formData.instructor_code) {
        payload.instructor_code = formData.instructor_code.trim();
      }

      await adminService.updateUser(user.id, payload);
      toast.success('Cập nhật thông tin người dùng thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Update user error:', error);
      toast.error(error.message || 'Lỗi khi cập nhật người dùng');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isStudent = !!user.students;
  const isInstructor = !!user.instructors;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa thông tin Người dùng">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="space-y-1">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" /> Họ và tên
          </Label>
          <Input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nhập họ và tên..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" /> Email
            </Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" /> Số điện thoại
            </Label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0987xxxxxx"
            />
          </div>
        </div>

        {isStudent && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Mã sinh viên</Label>
            <Input
              name="student_code"
              value={formData.student_code}
              onChange={handleChange}
              placeholder="VD: SV202612345"
            />
          </div>
        )}

        {isInstructor && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Mã giảng viên</Label>
            <Input
              name="instructor_code"
              value={formData.instructor_code}
              onChange={handleChange}
              placeholder="VD: GV2026001"
            />
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" /> Trạng thái tài khoản
          </Label>
          <select
            name="status"
            value={formData.status ? 'true' : 'false'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="true">Hoạt động (Active)</option>
            <option value="false">Ngừng hoạt động (Inactive)</option>
          </select>
        </div>

        <div className="space-y-1 pt-2 border-t">
          <Label className="text-xs font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <KeyRound className="w-3.5 h-3.5" /> Đổi mật khẩu mới (Bỏ trống nếu không đổi)
          </Label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu mới nếu muốn thay đổi..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
