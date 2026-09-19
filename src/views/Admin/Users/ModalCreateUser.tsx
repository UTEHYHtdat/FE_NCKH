import { useState, useEffect } from 'react';
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'student' as 'student' | 'instructor' | 'head' | 'admin',
    student_code: '',
    username: '',
    instructor_code: '',
    class_id: '' as string | number,
    department_id: '' as string | number,
  });

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      try {
        const [deptsData, classesData] = await Promise.allSettled([
          adminService.getDepartments(),
          adminService.getClasses(),
        ]);
        if (deptsData.status === 'fulfilled') {
          const list = Array.isArray(deptsData.value) ? deptsData.value : (deptsData.value as any)?.data || [];
          setDepartments(list);
          if (list.length > 0) {
            setFormData(prev => ({ ...prev, department_id: prev.department_id || list[0].id }));
          }
        }
        if (classesData.status === 'fulfilled') {
          const list = Array.isArray(classesData.value) ? classesData.value : (classesData.value as any)?.data || [];
          setClasses(list);
          if (list.length > 0) {
            setFormData(prev => ({ ...prev, class_id: prev.class_id || list[0].id }));
          }
        }
      } catch (err) {
        console.error('Error loading departments/classes:', err);
      }
    };
    loadData();
  }, [isOpen]);

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
      class_id: classes[0]?.id || '',
      department_id: departments[0]?.id || '',
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
          class_id: Number(formData.class_id) || classes[0]?.id || 1,
          major_id: 1,
        });
      } else if (formData.role === 'instructor' || formData.role === 'head') {
        await adminService.createInstructor({
          instructor_code: formData.instructor_code?.trim() || `GV_${Date.now().toString().slice(-4)}`,
          department_id: Number(formData.department_id) || departments[0]?.id || 1,
          degree: formData.role === 'head' ? 'Tiến sĩ' : 'Thạc sĩ',
          academic_title: formData.role === 'head' ? 'Trưởng bộ môn' : 'Giảng viên',
          specialization: 'CNTT',
          username: formData.username.trim() || formData.email.split('@')[0],
          password: formData.password,
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
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
            <option value="head">Trưởng bộ môn</option>
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
              <Label className="text-xs font-semibold">Lớp sinh hoạt</Label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {classes.length > 0 ? (
                  classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} {c.class_code ? `(${c.class_code})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="1">Lớp mặc định (1)</option>
                )}
              </select>
            </div>
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

        {(formData.role === 'instructor' || formData.role === 'head') && (
          <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Bộ môn trực thuộc</Label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {departments.length > 0 ? (
                  departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.department_name}
                    </option>
                  ))
                ) : (
                  <option value="1">Bộ môn mặc định (1)</option>
                )}
              </select>
            </div>
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
