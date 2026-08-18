import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminService } from '@/plugins/api';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.role === 'student') {
        await adminService.createStudent({
          student_code: formData.student_code,
          username: formData.username || formData.email.split('@')[0],
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          class_id: 1, // Default class
          major_id: 1, // Default major
        });
      } else if (formData.role === 'instructor') {
        await adminService.createInstructor({
          instructor_code: formData.instructor_code,
          department_id: 1, // Default dept
          degree: 'Thạc sĩ',
          academic_title: 'Giảng viên',
          specialization: 'CNTT',
          username: formData.username || formData.email.split('@')[0],
          password: formData.password,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
        });
      } else {
        await adminService.createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          role: 'admin',
          status: true,
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi tạo người dùng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm người dùng mới">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Vai trò</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="student">Sinh viên</option>
            <option value="instructor">Giảng viên</option>
            <option value="admin">Quản trị viên / Giáo vụ</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Họ và tên</label>
          <Input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
          />
        </div>

        {formData.role === 'student' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Mã sinh viên (Tùy chọn)</label>
              <Input
                name="student_code"
                value={formData.student_code}
                onChange={handleChange}
                placeholder="Để trống để hệ thống tự động tạo (VD: SV2026xxxx)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username (Tùy chọn)</label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Mặc định lấy từ email nếu để trống"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Lưu ý: Sinh viên sẽ được gán vào lớp mặc định. Vui lòng cập nhật lớp sau trong phần chi tiết.</p>
          </>
        )}

        {formData.role === 'instructor' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Mã giảng viên (Tùy chọn)</label>
              <Input
                name="instructor_code"
                value={formData.instructor_code}
                onChange={handleChange}
                placeholder="Để trống để hệ thống tự động tạo (VD: GV2026xxxx)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username (Tùy chọn)</label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Mặc định lấy từ email nếu để trống"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Lưu ý: Giảng viên sẽ được gán vào bộ môn mặc định. Vui lòng cập nhật sau trong phần chi tiết.</p>
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo người dùng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
