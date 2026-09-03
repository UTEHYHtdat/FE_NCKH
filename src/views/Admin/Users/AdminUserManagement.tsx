import { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter, FileSpreadsheet, RefreshCw, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { adminService } from '@/plugins/api';
import type { UserManagement } from '@/types/api';
import { toast } from 'sonner';
import { TablePagination } from '@/components/shared/TablePagination';

import { ModalCreateUser } from './ModalCreateUser';
import { ModalEditUser } from './ModalEditUser';
import { ModalImportStudentsExcel } from './ModalImportStudentsExcel';

export function AdminUserManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [filterRole, filterStatus, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await adminService.getUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.full_name} (${user.email})"?`)) {
      return;
    }
    try {
      await adminService.deleteUser(user.id);
      toast.success(`Đã xóa người dùng "${user.full_name}" thành công!`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Không thể xóa người dùng này');
    }
  };

  const getRoleBadge = (user: any) => {
    if (user.students) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Sinh viên</Badge>;
    }
    if (user.instructors) {
      return <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Giảng viên</Badge>;
    }
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Quản trị viên</Badge>;
  };

  const getDepartmentOrClass = (user: any) => {
    if (user.students) {
      return user.students.classes?.class_name || user.students.majors?.major_name || 'Chưa phân lớp';
    }
    if (user.instructors) {
      return user.instructors.departments_instructors_department_idTodepartments?.department_name || 'Bộ môn CNTT';
    }
    return 'Phòng Quản trị';
  };

  return (
    <PageLayout
      title="Quản lý Người dùng & Sinh viên"
      subtitle="Quản lý danh sách tài khoản, thêm mới, sửa, xóa và import Excel hàng loạt"
      actions={
        <div className="flex gap-2.5">
          <Button 
            variant="outline" 
            onClick={() => setIsExcelModalOpen(true)}
            className="border-emerald-600/40 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Nhập từ Excel
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Thêm người dùng mới
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold">Danh sách người dùng</CardTitle>
              <CardDescription>Tìm kiếm, lọc vai trò và quản lý tài khoản trong hệ thống</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchUsers} className="text-xs h-8 text-muted-foreground self-start">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm tên, email, mã SV/GV..."
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="student">Sinh viên</option>
              <option value="instructor">Giảng viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
            <select
              className="px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Hoạt động (Active)</option>
              <option value="false">Ngừng hoạt động (Inactive)</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => {
              setFilterRole('');
              setFilterStatus('');
              setSearchQuery('');
            }} className="text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Xóa bộ lọc
            </Button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Họ tên & Username</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Vai trò</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Mã SV / GV</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Đơn vị / Lớp</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Trạng thái</th>
                  <th className="text-left py-3 px-3.5 font-semibold text-muted-foreground">Ngày tạo</th>
                  <th className="text-right py-3 px-3.5 font-semibold text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span>Đang tải danh sách người dùng...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Không tìm thấy người dùng nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user: any) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-foreground">{user.full_name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">@{user.username}</div>
                      </td>
                      <td className="py-3 px-3.5 text-muted-foreground">
                        <div>{user.email}</div>
                        {user.phone && <div className="text-[11px] text-muted-foreground/80">{user.phone}</div>}
                      </td>
                      <td className="py-3 px-3.5">
                        {getRoleBadge(user)}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-medium">
                        {user.students?.student_code || user.instructors?.instructor_code || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-muted-foreground">
                        {getDepartmentOrClass(user)}
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge variant={user.status ? 'default' : 'secondary'} className={user.status ? 'bg-emerald-600 text-white' : ''}>
                          {user.status ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleOpenEdit(user)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Chỉnh sửa người dùng"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteUser(user)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Xóa người dùng"
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
            totalItems={users.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>
      
      {/* Modal Thêm người dùng */}
      <ModalCreateUser 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchUsers} 
      />

      {/* Modal Chỉnh sửa người dùng */}
      <ModalEditUser
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
        user={selectedUser}
      />

      {/* Modal Nhập danh sách sinh viên từ Excel */}
      <ModalImportStudentsExcel
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </PageLayout>
  );
}
