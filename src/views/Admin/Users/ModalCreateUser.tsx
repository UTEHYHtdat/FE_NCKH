import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/plugins/api';
import { toast } from 'sonner';
import { Loader2, Plus, User, Mail, Lock, Phone } from 'lucide-react';

interface ModalCreateUserProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalCreateUser({ isOpen, onClose, onSuccess }: ModalCreateUserProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'student' as 'student' | 'instructor' | 'admin',
    student_code: '',
    username: '',
    instructor_code: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'student',
      student_code: '',
      username: '',
      instructor_code: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu');
      return;
    }

    setLoading(true);
    try {
      if (formData.role === 'student') {
        await adminService.createStudent({
          student_code: formData.student_code.trim(),
          username: formData.username.trim() || formData.email.split('@')[0],
          email: formData.email.trim(),
          password: formData.password,
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          class_id: 1,
          major_id: 1,
        });
      } else if (formData.role === 'instructor') {
        await adminService.createInstructor({
          instructor_code: formData.instructor_code.trim(),
          department_id: 1,
          degree: 'Thạc sĩ',
          academic_title: 'Giảng viên',
          specialization: 'CNTT',
          username: formData.username.trim() || formData.email.split('@')[0],
          password: formData.password,
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
        });
      } else {
        await adminService.createUser({
          email: formData.email.trim(),
          password: formData.password,
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          role: 'admin',
          status: true,
        });
      }
      
      toast.success('Thêm người dùng mới thành công!');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo người dùng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm người dùng mới">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Vai trò hệ thống</Label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="student">Sinh viên</option>
            <option value="instructor">Giảng viên</option>
            <option value="admin">Quản trị viên / Giáo vụ</option>
          </select>
        </div>

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
              <Lock className="w-3.5 h-3.5 text-blue-600" /> Mật khẩu
            </Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu..."
              required
            />
          </div>
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

        {formData.role === 'student' && (
          <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mã sinh viên (Tùy chọn)</Label>
              <Input
                name="student_code"
                value={formData.student_code}
                onChange={handleChange}
                placeholder="Để trống để tự động tạo (VD: SV2026xxxx)"
                className="bg-background text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Username (Tùy chọn)</Label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Mặc định lấy theo email nếu để trống"
                className="bg-background text-xs"
              />
            </div>
          </div>
        )}

        {formData.role === 'instructor' && (
          <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mã giảng viên (Tùy chọn)</Label>
              <Input
                name="instructor_code"
                value={formData.instructor_code}
                onChange={handleChange}
                placeholder="Để trống để tự động tạo (VD: GV2026xxxx)"
                className="bg-background text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Username (Tùy chọn)</Label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Mặc định lấy theo email nếu để trống"
                className="bg-background text-xs"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
            Tạo người dùng
          </Button>
        </div>
      </form>
    </Modal>
  );
}
