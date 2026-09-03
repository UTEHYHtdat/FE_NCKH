import { useEffect, useState } from 'react';
import { 
  Users, Plus, Edit, Trash2, Search, Filter, 
  RefreshCw, Loader2, Award, Mail, Phone, BookOpen, GraduationCap 
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { adminService } from '@/plugins/api';
import { toast } from 'sonner';
import { TablePagination } from '@/components/shared/TablePagination';

export function AcademicInstructorManagement() {
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    instructor_code: '',
    username: '',
    password: '',
    department_id: '1',
    degree: 'Thạc sĩ',
    academic_title: 'Giảng viên',
    specialization: 'Công nghệ phần mềm',
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    instructor_code: '',
    department_id: '1',
    degree: 'Thạc sĩ',
    academic_title: 'Giảng viên',
    specialization: '',
    password: '',
    status: true,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInstructors();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterDept, filterStatus, searchQuery]);

  const fetchDepartments = async () => {
    try {
      const data = await adminService.getDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const params: any = { role: 'instructor' };
      if (filterStatus) params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await adminService.getUsers(params);
      let userList = Array.isArray(data) ? data : [];
      
      // Filter by department if selected
      if (filterDept) {
        userList = userList.filter((u: any) => u.instructors?.department_id === parseInt(filterDept));
      }

      setInstructors(userList);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast.error('Không thể tải danh sách giảng viên');
    } finally {
      setLoading(false);
    }
  };

  const paginatedInstructors = instructors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setAddForm({
      full_name: '',
      email: '',
      phone: '',
      instructor_code: '',
      username: '',
      password: '',
      department_id: departments[0]?.id?.toString() || '1',
      degree: 'Thạc sĩ',
      academic_title: 'Giảng viên',
      specialization: 'Công nghệ thông tin',
    });
    setIsAddModalOpen(true);
  };

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      toast.error('Vui lòng điền Họ tên, Email và Mật khẩu');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.createInstructor({
        full_name: addForm.full_name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        instructor_code: addForm.instructor_code.trim(),
        username: addForm.username.trim() || addForm.instructor_code.trim() || addForm.email.split('@')[0],
        password: addForm.password,
        department_id: parseInt(addForm.department_id) || 1,
        degree: addForm.degree,
        academic_title: addForm.academic_title,
        specialization: addForm.specialization,
      });

      toast.success('Thêm giảng viên mới thành công!');
      setIsAddModalOpen(false);
      fetchInstructors();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tạo giảng viên');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setSelectedInstructor(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      instructor_code: user.instructors?.instructor_code || '',
      department_id: user.instructors?.department_id?.toString() || '1',
      degree: user.instructors?.degree || 'Thạc sĩ',
      academic_title: user.instructors?.academic_title || 'Giảng viên',
      specialization: user.instructors?.specialization || '',
      password: '',
      status: user.status !== undefined ? user.status : true,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructor) return;

    setActionLoading(true);
    try {
      const payload: any = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        instructor_code: editForm.instructor_code.trim(),
        department_id: parseInt(editForm.department_id),
        status: editForm.status,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      await adminService.updateUser(selectedInstructor.id, payload);
      toast.success('Cập nhật thông tin giảng viên thành công!');
      setIsEditModalOpen(false);
      setSelectedInstructor(null);
      fetchInstructors();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật giảng viên');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInstructor = async (user: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa giảng viên "${user.full_name}" (${user.instructors?.instructor_code || user.email})?`)) {
      return;
    }

    try {
      await adminService.deleteUser(user.id);
      toast.success(`Đã xóa giảng viên "${user.full_name}" thành công!`);
      fetchInstructors();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa giảng viên này');
    }
  };

  return (
    <PageLayout
      title="Quản lý Giảng viên"
      subtitle="Quản lý danh sách giảng viên, bộ môn trực thuộc, học vị và hướng nghiên cứu"
      actions={
        <Button size="sm" onClick={handleOpenAdd} className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs h-8 sm:h-9">
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm giảng viên</span>
        </Button>
      }
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Danh sách Giảng viên
              </CardTitle>
              <CardDescription>Tra cứu theo bộ môn, học vị và phân công nhiệm vụ hướng dẫn, phản biện</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchInstructors} className="text-xs h-8 text-muted-foreground self-start">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bộ lọc */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm tên, mã GV, email..."
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">Tất cả bộ môn</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name} ({dept.department_code})
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang công tác (Active)</option>
              <option value="false">Ngừng công tác (Inactive)</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => {
              setFilterDept('');
              setFilterStatus('');
              setSearchQuery('');
            }} className="text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Xóa bộ lọc
            </Button>
          </div>

          {/* Bảng Giảng viên */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Họ và tên & Username</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Mã giảng viên</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Bộ môn trực thuộc</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Học vị / Học hàm</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Chuyên môn</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Email & SĐT</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Trạng thái</th>
                  <th className="text-right py-3 px-3.5 font-semibold text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        <span>Đang tải danh sách giảng viên...</span>
                      </div>
                    </td>
                  </tr>
                ) : instructors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Không tìm thấy giảng viên nào phù hợp
                    </td>
                  </tr>
                ) : (
                  paginatedInstructors.map((user: any) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-foreground">{user.full_name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">@{user.username}</div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {user.instructors?.instructor_code || '-'}
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge variant="outline" className="font-normal text-xs bg-slate-50 dark:bg-slate-900">
                          {user.instructors?.departments_instructors_department_idTodepartments?.department_name || 'Bộ môn CNTT'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-medium text-foreground">
                          {user.instructors?.academic_title || 'Giảng viên'}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({user.instructors?.degree || 'ThS'})
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-muted-foreground">
                        {user.instructors?.specialization || 'Công nghệ thông tin'}
                      </td>
                      <td className="py-3 px-3.5 text-muted-foreground">
                        <div>{user.email}</div>
                        {user.phone && <div className="text-[11px] text-muted-foreground/80">{user.phone}</div>}
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge variant={user.status ? 'default' : 'secondary'} className={user.status ? 'bg-emerald-600 text-white' : ''}>
                          {user.status ? 'Đang công tác' : 'Ngừng công tác'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleOpenEdit(user)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Sửa hồ sơ giảng viên"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteInstructor(user)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Xóa giảng viên"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={instructors.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Modal Thêm Giảng viên mới */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm giảng viên mới">
        <form onSubmit={handleCreateInstructor} className="space-y-4 py-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Họ và tên</Label>
            <Input
              value={addForm.full_name}
              onChange={(e) => setAddForm(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="VD: TS. Trần Văn Bình"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mã giảng viên</Label>
              <Input
                value={addForm.instructor_code}
                onChange={(e) => setAddForm(prev => ({ ...prev, instructor_code: e.target.value }))}
                placeholder="VD: GV2026001"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Bộ môn trực thuộc</Label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={addForm.department_id}
                onChange={(e) => setAddForm(prev => ({ ...prev, department_id: e.target.value }))}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Học vị</Label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={addForm.degree}
                onChange={(e) => setAddForm(prev => ({ ...prev, degree: e.target.value }))}
              >
                <option value="Thạc sĩ">Thạc sĩ</option>
                <option value="Tiến sĩ">Tiến sĩ</option>
                <option value="Cử nhân / Kỹ sư">Cử nhân / Kỹ sư</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Học hàm / Chức danh</Label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={addForm.academic_title}
                onChange={(e) => setAddForm(prev => ({ ...prev, academic_title: e.target.value }))}
              >
                <option value="Giảng viên">Giảng viên</option>
                <option value="Giảng viên chính">Giảng viên chính</option>
                <option value="Phó Giáo sư">Phó Giáo sư</option>
                <option value="Giáo sư">Giáo sư</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Chuyên môn / Hướng nghiên cứu</Label>
            <Input
              value={addForm.specialization}
              onChange={(e) => setAddForm(prev => ({ ...prev, specialization: e.target.value }))}
              placeholder="VD: Trí tuệ nhân tạo, Công nghệ phần mềm..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="gv@fit.edu.vn"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mật khẩu</Label>
              <Input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Nhập mật khẩu..."
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Số điện thoại</Label>
            <Input
              value={addForm.phone}
              onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="0987xxxxxx"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
              Tạo giảng viên
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Chỉnh sửa Giảng viên */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa hồ sơ Giảng viên">
        <form onSubmit={handleUpdateInstructor} className="space-y-4 py-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Họ và tên</Label>
            <Input
              value={editForm.full_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mã giảng viên</Label>
              <Input
                value={editForm.instructor_code}
                onChange={(e) => setEditForm(prev => ({ ...prev, instructor_code: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Bộ môn trực thuộc</Label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={editForm.department_id}
                onChange={(e) => setEditForm(prev => ({ ...prev, department_id: e.target.value }))}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Số điện thoại</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Trạng thái công tác</Label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              value={editForm.status ? 'true' : 'false'}
              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value === 'true' }))}
            >
              <option value="true">Đang công tác (Active)</option>
              <option value="false">Ngừng công tác (Inactive)</option>
            </select>
          </div>

          <div className="space-y-1 pt-2 border-t">
            <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400">Đổi mật khẩu mới (Bỏ trống nếu không đổi)</Label>
            <Input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Nhập mật khẩu mới..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
