import { useEffect, useState } from 'react';
import { Building2, Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/plugins/api';
import type { Faculty, Department, Class } from '@/types/api';
import ClassFormDialog from './ModalCreateClass';
import FacultyFormDialog from './ModalCreateFaculty';
import DepartmentFormDialog from './ModalCreateDepartment';

interface Major {
  id: number;
  major_name: string;
}

export function AdminOrganizationManagement() {
  const [activeTab, setActiveTab] = useState<
    'faculties' | 'departments' | 'classes'
  >('faculties');
  const [loading, setLoading] = useState(true);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
    null,
  );
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isFacultyFormOpen, setIsFacultyFormOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [majors, setMajors] = useState<Major[]>([]);

  // Mở form tạo
  const handleAddClass = () => {
    setEditingClass(null);
    setIsClassFormOpen(true);
  };

  // Mở form sửa
  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setIsClassFormOpen(true);
  };

  const handleAddFaculty = () => {
    setEditingFaculty(null);
    setIsFacultyFormOpen(true);
  };

  const handleEditFaculty = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setIsFacultyFormOpen(true);
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setIsDepartmentFormOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsDepartmentFormOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedFaculty, selectedDepartment]);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const majorsData = await adminService.getMajors();
        setMajors(Array.isArray(majorsData) ? majorsData : []);
      } catch (error) {
        console.error('Error fetching majors:', error);
      }
    };

    fetchMajors();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 'faculties':
          const facultiesData = await adminService.getFaculties();
          setFaculties(facultiesData);
          break;
        case 'departments':
          const departmentsData = await adminService.getDepartments(
            selectedFaculty ? { faculty_id: selectedFaculty } : undefined,
          );
          setDepartments(departmentsData);
          break;
        case 'classes':
          const classesData = await adminService.getClasses(
            selectedDepartment
              ? { department_id: selectedDepartment }
              : undefined,
          );
          setClasses(classesData);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaculty = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khoa này?')) return;
    try {
      await adminService.deleteFaculty(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting faculty:', error);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bộ môn này?')) return;
    try {
      await adminService.deleteDepartment(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lớp học này?')) return;
    try {
      await adminService.deleteClass(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const renderFaculties = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý Khoa</CardTitle>
            <CardDescription>Danh sách các khoa trong hệ thống</CardDescription>
          </div>
          <Button onClick={handleAddFaculty}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm khoa mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Mã khoa
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Tên khoa
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Địa chỉ
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Số bộ môn
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {faculties.map((faculty) => (
                <tr
                  key={faculty.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">
                    {faculty.faculty_code}
                  </td>
                  <td className="py-3 px-4">{faculty.faculty_name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {faculty.address || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {faculty.email || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">
                      {faculty.departments?.length || 0}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={faculty.status ? 'default' : 'secondary'}>
                      {faculty.status ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mr-2"
                      onClick={() => handleEditFaculty(faculty)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteFaculty(faculty.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderDepartments = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý Bộ môn</CardTitle>
            <CardDescription>
              Danh sách các bộ môn trong hệ thống
            </CardDescription>
          </div>
          <Button onClick={handleAddDepartment}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm bộ môn mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Lọc theo khoa:
          </label>
          <select
            className="w-full max-w-xs px-3 py-2 border border-border rounded-md"
            value={selectedFaculty || ''}
            onChange={(e) =>
              setSelectedFaculty(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Tất cả các khoa</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.faculty_name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Mã bộ môn
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Tên bộ môn
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Khoa
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Số giảng viên
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr
                  key={dept.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">
                    {dept.department_code}
                  </td>
                  <td className="py-3 px-4">{dept.department_name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {dept.faculties?.faculty_name || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">
                      {dept.instructors?.length || 0}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={dept.status ? 'default' : 'secondary'}>
                      {dept.status ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mr-2"
                      onClick={() => handleEditDepartment(dept)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDepartment(dept.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderClasses = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý Lớp học</CardTitle>
            <CardDescription>
              Danh sách các lớp học trong hệ thống
            </CardDescription>
          </div>
          <Button onClick={handleAddClass}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm lớp mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Lọc theo bộ môn:
          </label>
          <select
            className="w-full max-w-xs px-3 py-2 border border-border rounded-md"
            value={selectedDepartment || ''}
            onChange={(e) =>
              setSelectedDepartment(
                e.target.value ? Number(e.target.value) : null,
              )
            }
          >
            <option value="">Tất cả các bộ môn</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Mã lớp
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Tên lớp
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Chuyên ngành
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Năm học
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Số sinh viên
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr
                  key={cls.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{cls.class_code}</td>
                  <td className="py-3 px-4">{cls.class_name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {cls.majors?.major_name || '-'}
                  </td>
                  <td className="py-3 px-4">{cls.academic_year || '-'}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{cls.student_count}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={cls.status ? 'default' : 'secondary'}>
                      {cls.status ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mr-2"
                      onClick={() => handleEditClass(cls)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClass(cls.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageLayout
      title="Quản lý Tổ chức & Đào tạo"
      subtitle="Quản lý khoa, bộ môn và lớp học"
    >
      <div className="mb-6">
        <div className="flex space-x-2 border-b border-border">
          <button
            onClick={() => {
              setActiveTab('faculties');
              setSelectedFaculty(null);
              setSelectedDepartment(null);
            }}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'faculties'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Khoa
          </button>
          <button
            onClick={() => {
              setActiveTab('departments');
              setSelectedDepartment(null);
            }}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'departments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Bộ môn
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'classes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Lớp học
          </button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Đang tải...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeTab === 'faculties' && renderFaculties()}
          {activeTab === 'departments' && renderDepartments()}
          {activeTab === 'classes' && renderClasses()}
        </>
      )}
      <ClassFormDialog
        open={isClassFormOpen}
        onOpenChange={setIsClassFormOpen}
        editingClass={editingClass}
        majors={majors}
        onSuccess={fetchData}
      />
      <FacultyFormDialog
        open={isFacultyFormOpen}
        onOpenChange={setIsFacultyFormOpen}
        editingFaculty={editingFaculty}
        onSuccess={fetchData}
      />
      <DepartmentFormDialog
        open={isDepartmentFormOpen}
        onOpenChange={setIsDepartmentFormOpen}
        editingDepartment={editingDepartment}
        faculties={faculties}
        onSuccess={fetchData}
      />
    </PageLayout>
  );
}
