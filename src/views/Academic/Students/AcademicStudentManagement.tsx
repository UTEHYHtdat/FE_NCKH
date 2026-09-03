import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { 
  GraduationCap, Plus, Edit, Trash2, Search, Filter, 
  FileSpreadsheet, RefreshCw, Loader2, Award, Mail, Phone, BookOpen, School 
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

import { ModalImportStudentsExcel } from '@/views/Admin/Users/ModalImportStudentsExcel';
import { TablePagination } from '@/components/shared/TablePagination';

export function AcademicStudentManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const classIdFromUrl = searchParams.get('class_id') || searchParams.get('classId') || '';

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState<string>(classIdFromUrl);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    student_code: '',
    username: '',
    password: '',
    class_id: '1',
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    student_code: '',
    class_id: '1',
    password: '',
    status: true,
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  // Đồng bộ filterClass khi query param trên URL thay đổi
  useEffect(() => {
    const urlClassId = searchParams.get('class_id') || searchParams.get('classId') || '';
    if (urlClassId !== filterClass) {
      setFilterClass(urlClassId);
    }
  }, [searchParams]);

  const handleFilterClassChange = (newClassId: string) => {
    setFilterClass(newClassId);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newClassId) {
        next.set('class_id', newClassId);
      } else {
        next.delete('class_id');
        next.delete('classId');
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilterClass('');
    setFilterStatus('');
    setSearchQuery('');
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('class_id');
      next.delete('classId');
      return next;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterClass, filterStatus, searchQuery]);

  const fetchClasses = async () => {
    try {
      const data = await adminService.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = { role: 'student' };
      if (filterStatus) params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterClass) params.class_id = filterClass;

      const data = await adminService.getUsers(params);
      let userList = Array.isArray(data) ? data : [];
      
      // Filter by class if selected
      if (filterClass) {
        userList = userList.filter((u: any) => u.students?.class_id === parseInt(filterClass));
      }

      setStudents(userList);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Không thể tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setAddForm({
      full_name: '',
      email: '',
      phone: '',
      student_code: '',
      username: '',
      password: '',
      class_id: filterClass || classes[0]?.id?.toString() || '1',
    });
    setIsAddModalOpen(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      toast.error('Vui lòng điền Họ tên, Email và Mật khẩu');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.createStudent({
        full_name: addForm.full_name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        student_code: addForm.student_code.trim(),
        username: addForm.username.trim() || addForm.student_code.trim() || addForm.email.split('@')[0],
        password: addForm.password,
        class_id: parseInt(addForm.class_id) || 1,
      });

      toast.success('Thêm sinh viên mới thành công!');
      setIsAddModalOpen(false);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tạo sinh viên');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setSelectedStudent(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      student_code: user.students?.student_code || '',
      class_id: user.students?.class_id?.toString() || '1',
      password: '',
      status: user.status !== undefined ? user.status : true,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setActionLoading(true);
    try {
      const payload: any = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        student_code: editForm.student_code.trim(),
        class_id: parseInt(editForm.class_id),
        status: editForm.status,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      await adminService.updateUser(selectedStudent.id, payload);
      toast.success('Cập nhật hồ sơ sinh viên thành công!');
      setIsEditModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật sinh viên');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (user: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ sinh viên "${user.full_name}" (${user.students?.student_code || user.email})?`)) {
      return;
    }

    try {
      await adminService.deleteUser(user.id);
      toast.success(`Đã xóa sinh viên "${user.full_name}" thành công!`);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa sinh viên này');
    }
  };

  const selectedClassInfo = classes.find((c) => c.id?.toString() === filterClass);

  return (
    <PageLayout
      title="Quản lý Sinh viên"
      subtitle="Quản lý hồ sơ, lớp học, thông tin học vụ và nhập sinh viên hàng loạt từ Excel"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/academic/classes')}
            className="text-xs h-8 sm:h-9 gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"
          >
            <School className="w-3.5 h-3.5 text-blue-600" />
            <span>Quản lý Lớp học</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExcelModalOpen(true)}
            className="border-emerald-600/40 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 gap-1.5 text-xs h-8 sm:h-9"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nhập từ Excel</span>
          </Button>
          <Button 
            size="sm"
            onClick={handleOpenAdd} 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-8 sm:h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sinh viên</span>
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Danh sách sinh viên
              </CardTitle>
              <CardDescription>Tra cứu theo lớp học, trạng thái và chỉnh sửa thông tin học vụ</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchStudents} className="text-xs h-8 text-muted-foreground self-start">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Banner thông tin lớp khi đang lọc */}
          {selectedClassInfo && (
            <div className="mb-4 p-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">
                      Lớp {selectedClassInfo.class_name}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs bg-white dark:bg-background border-blue-200 text-blue-700 dark:text-blue-300">
                      {selectedClassInfo.class_code}
                    </Badge>
                    {selectedClassInfo.academic_year && (
                      <span className="text-xs text-muted-foreground">
                        • Niên khóa: {selectedClassInfo.academic_year}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Đang hiển thị {students.length} sinh viên thuộc lớp này
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleFilterClassChange('')}
                >
                  Xem tất cả lớp
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
                  onClick={() => navigate('/academic/classes')}
                >
                  ← Quay lại Quản lý Lớp
                </Button>
              </div>
            </div>
          )}

          {/* Bộ lọc */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm tên, mã SV, email..."
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterClass}
              onChange={(e) => handleFilterClassChange(e.target.value)}
            >
              <option value="">Tất cả lớp học</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.class_code})
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang học (Active)</option>
              <option value="false">Ngừng học (Inactive)</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Xóa bộ lọc
            </Button>
          </div>

          {/* Bảng Sinh viên */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Họ và tên & Username</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Mã sinh viên</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Lớp học</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Email & SĐT</th>
                  <th className="text-center py-3 px-3.5 font-semibold text-muted-foreground">GPA</th>
                  <th className="text-center py-3 px-3.5 font-semibold text-muted-foreground">Tín chỉ</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Trạng thái</th>
                  <th className="text-right py-3 px-3.5 font-semibold text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span>Đang tải danh sách sinh viên...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Không tìm thấy sinh viên nào phù hợp
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((user: any) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-foreground">{user.full_name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">@{user.username}</div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {user.students?.student_code || '-'}
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge variant="outline" className="font-normal text-xs bg-slate-50 dark:bg-slate-900">
                          {user.students?.classes?.class_name || 'Chưa phân lớp'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-muted-foreground">
                        <div>{user.email}</div>
                        {user.phone && <div className="text-[11px] text-muted-foreground/80">{user.phone}</div>}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold">
                        {user.students?.gpa ? Number(user.students.gpa).toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-medium">
                        {user.students?.credits_earned ?? 0}
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge variant={user.status ? 'default' : 'secondary'} className={user.status ? 'bg-emerald-600 text-white' : ''}>
                          {user.status ? 'Đang học' : 'Ngừng học'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleOpenEdit(user)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Sửa hồ sơ sinh viên"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteStudent(user)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Xóa sinh viên"
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
            totalItems={students.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Modal Thêm Sinh viên mới */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm sinh viên mới">
        <form onSubmit={handleCreateStudent} className="space-y-4 py-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Họ và tên</Label>
            <Input
              value={addForm.full_name}
              onChange={(e) => setAddForm(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="VD: Nguyễn Văn An"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mã sinh viên</Label>
              <Input
                value={addForm.student_code}
                onChange={(e) => setAddForm(prev => ({ ...prev, student_code: e.target.value }))}
                placeholder="VD: 10124001"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Lớp học</Label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={addForm.class_id}
                onChange={(e) => setAddForm(prev => ({ ...prev, class_id: e.target.value }))}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="sv@student.edu.vn"
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
            <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
              Tạo sinh viên
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Chỉnh sửa Sinh viên */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa hồ sơ Sinh viên">
        <form onSubmit={handleUpdateStudent} className="space-y-4 py-1">
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
              <Label className="text-xs font-semibold">Mã sinh viên</Label>
              <Input
                value={editForm.student_code}
                onChange={(e) => setEditForm(prev => ({ ...prev, student_code: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Lớp học</Label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={editForm.class_id}
                onChange={(e) => setEditForm(prev => ({ ...prev, class_id: e.target.value }))}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
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
            <Label className="text-xs font-semibold">Trạng thái học vụ</Label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              value={editForm.status ? 'true' : 'false'}
              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value === 'true' }))}
            >
              <option value="true">Đang học (Active)</option>
              <option value="false">Ngừng học (Inactive)</option>
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
            <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Nhập từ Excel */}
      <ModalImportStudentsExcel
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={fetchStudents}
      />
    </PageLayout>
  );
}
