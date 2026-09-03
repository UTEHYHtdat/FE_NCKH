import { useEffect, useState } from 'react';
import { 
  School, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCw, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/Modal';
import { TablePagination } from '@/components/shared/TablePagination';
import { adminService } from '@/plugins/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
interface ClassItem {
  id: number;
  class_code: string;
  class_name: string;
  major_id: number;
  academic_year?: string;
  student_count?: number;
  status: boolean;
  major?: {
    id: number;
    major_code: string;
    major_name: string;
    department?: {
      id: number;
      department_name: string;
      faculty?: {
        id: number;
        faculty_name: string;
      };
    };
  };
}

export function AcademicClassManagement() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMajor, setFilterMajor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState({
    class_code: '',
    class_name: '',
    major_id: '',
    academic_year: '2026-2027',
    status: true,
  });
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();

  

  useEffect(() => {
    fetchClasses();
    fetchMajors();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await adminService.getClasses();
      setClasses(Array.isArray(data) ? (data as any) : []);
    } catch (error: any) {
      console.error('Lỗi tải danh sách lớp học:', error);
      toast.error('Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  const fetchMajors = async () => {
    try {
      const data = await adminService.getMajors();
      setMajors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi tải danh mục chuyên ngành:', error);
    }
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      class_code: '',
      class_name: '',
      major_id: majors[0]?.id?.toString() || '',
      academic_year: '2026-2027',
      status: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormData({
      class_code: cls.class_code,
      class_name: cls.class_name,
      major_id: cls.major_id?.toString() || majors[0]?.id?.toString() || '',
      academic_year: cls.academic_year || '2026-2027',
      status: cls.status !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_code.trim() || !formData.class_name.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã lớp và Tên lớp');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        class_code: formData.class_code.trim(),
        class_name: formData.class_name.trim(),
        academic_year: formData.academic_year.trim(),
        status: formData.status,
      };

      if (formData.major_id) {
        payload.major_id = parseInt(formData.major_id);
      }

      if (editingClass) {
        await adminService.updateClass(editingClass.id, payload);
        toast.success(`Đã cập nhật lớp "${formData.class_name}" thành công!`);
      } else {
        await adminService.createClass(payload);
        toast.success(`Đã thêm lớp học "${formData.class_name}" mới thành công!`);
      }

      setIsModalOpen(false);
      fetchClasses();
    } catch (error: any) {
      console.error('Lỗi lưu lớp học:', error);
      toast.error(error.message || 'Không thể lưu thông tin lớp học');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lớp học "${cls.class_name}" (${cls.class_code})?`)) {
      return;
    }

    try {
      await adminService.deleteClass(cls.id);
      toast.success(`Đã xóa lớp "${cls.class_name}" thành công!`);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa lớp học này');
    }
  };

  // Lọc dữ liệu
  const filteredClasses = classes.filter((c) => {
    const matchSearch =
      searchQuery === '' ||
      c.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.class_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.major?.major_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchMajor = filterMajor === '' || c.major_id?.toString() === filterMajor;
    const matchStatus =
      filterStatus === '' || (filterStatus === 'true' ? c.status : !c.status);

    return matchSearch && matchMajor && matchStatus;
  });

  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const activeClassesCount = classes.filter(c => c.status).length;

  return (
    <PageLayout
      title="Quản lý Lớp học"
      subtitle="Quản lý danh sách lớp sinh viên, mã lớp, chuyên ngành, niên khóa và thống kê sinh viên"
      actions={
        <Button 
          size="sm"
          onClick={handleOpenAdd} 
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-8 sm:h-9"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm lớp mới</span>
        </Button>
      }
    >
      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/60 dark:border-blue-800/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tổng số lớp học</p>
              <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{classes.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
              <School className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Lớp đang hoạt động</p>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{activeClassesCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/60 dark:border-purple-800/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tổng sinh viên các lớp</p>
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">{totalStudents}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <School className="w-4 h-4 text-blue-600" />
                Danh sách Lớp học ({filteredClasses.length})
              </CardTitle>
              <CardDescription className="text-xs">Tra cứu, chỉnh sửa thông tin lớp và số lượng sinh viên</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchClasses} className="text-xs h-8 text-muted-foreground self-start sm:self-auto">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Bộ lọc */}
          <div className="p-4 border-b border-border grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm tên lớp, mã lớp..."
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Tạm khóa</option>
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setFilterMajor('');
                setFilterStatus('');
                setSearchQuery('');
              }} 
              className="text-xs h-9"
            >
              Xóa bộ lọc
            </Button>
          </div>

          {/* Bảng danh sách */}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs">Đang tải dữ liệu lớp học...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <School className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm text-foreground">Không tìm thấy lớp học nào</p>
              <p className="text-xs mt-1">Bấm "Thêm lớp mới" hoặc kiểm tra lại từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Mã lớp</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tên lớp học</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Chuyên ngành / Khoa</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Niên khóa</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Số sinh viên</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Trạng thái</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((cls) => (
                      <tr key={cls.id} className="border-b border-border hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors group">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/academic/students?class_id=${cls.id}`)}
                            className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 text-left cursor-pointer transition-colors"
                            title="Bấm để xem danh sách sinh viên lớp này"
                          >
                            {cls.class_code}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/academic/students?class_id=${cls.id}`)}
                            className="font-bold text-foreground text-xs hover:text-blue-600 transition-colors text-left cursor-pointer"
                            title="Bấm để xem danh sách sinh viên lớp này"
                          >
                            {cls.class_name}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div className="font-medium text-foreground">
                            {cls.major?.major_name || 'Kỹ thuật phần mềm'}
                          </div>
                          {cls.major?.department?.faculty?.faculty_name && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {cls.major.department.faculty.faculty_name}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{cls.academic_year || '2026-2027'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            onClick={() => navigate(`/academic/students?class_id=${cls.id}`)}
                            className="bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all"
                            title="Bấm để xem danh sách sinh viên lớp này"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {cls.student_count || 0} SV
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {cls.status ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-0">
                              Đang hoạt động
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-0">
                              Tạm khóa
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[11px] gap-1"
                              onClick={() => navigate(`/academic/students?class_id=${cls.id}`)}
                              title="Xem danh sách sinh viên lớp này"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Sinh viên</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenEdit(cls)}
                              title="Sửa lớp học"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClass(cls)}
                              title="Xóa lớp học"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {filteredClasses.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredClasses.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal Thêm/Sửa lớp học */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Chỉnh sửa Lớp học' : 'Thêm Lớp học mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Mã lớp học <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="VD: 12524T.1, KTPM01..."
              value={formData.class_code}
              onChange={(e) => setFormData({ ...formData, class_code: e.target.value })}
              className="text-xs"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">Mã lớp định danh duy nhất trong toàn trường</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Tên lớp học <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="VD: 12524T.1, Kỹ thuật phần mềm 1..."
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              className="text-xs"
              required
            />
          </div>

          {majors.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Chuyên ngành <span className="text-destructive">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.major_id}
                onChange={(e) => setFormData({ ...formData, major_id: e.target.value })}
                required
              >
                {majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.major_name} ({m.major_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Niên khóa
            </label>
            <Input
              type="text"
              placeholder="VD: 2026-2027, 2023-2027..."
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Trạng thái
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.status ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value === 'true' })}
            >
              <option value="true">Đang hoạt động</option>
              <option value="false">Tạm khóa</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
              {submitting ? 'Đang lưu...' : editingClass ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
