import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { adminService } from '@/plugins/api';
import { toast } from 'sonner';
import type { Faculty, Department, Class } from '@/types/api';
import {
  FacultiesTable,
  DepartmentsTable,
  ClassesTable,
  ModalFaculty,
  ModalDepartment,
  ModalClass,
} from './components';

export function AdminOrganizationManagement() {
  const [activeTab, setActiveTab] = useState<'faculties' | 'departments' | 'classes'>('faculties');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Dữ liệu ────────────────────────────────────────────────────────────────
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [majors, setMajors] = useState<any[]>([]);

  // ── Bộ lọc ─────────────────────────────────────────────────────────────────
  const [selectedFaculty, setSelectedFaculty] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);

  // ── Quản lý Modal & Item đang sửa ──────────────────────────────────────────
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedFaculty, selectedDepartment]);

  useEffect(() => {
    adminService.getFaculties().then((data) => setFaculties(Array.isArray(data) ? data : [])).catch(() => {});
    adminService.getMajors().then((data) => setMajors(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 'faculties': {
          const data = await adminService.getFaculties();
          setFaculties(Array.isArray(data) ? data : []);
          break;
        }
        case 'departments': {
          const data = await adminService.getDepartments(
            selectedFaculty ? { faculty_id: selectedFaculty } : undefined
          );
          setDepartments(Array.isArray(data) ? data : []);
          break;
        }
        case 'classes': {
          const data = await adminService.getClasses(
            selectedDepartment ? { major_id: selectedDepartment } : undefined
          );
          setClasses(Array.isArray(data) ? data : []);
          break;
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Lỗi khi tải dữ liệu tổ chức');
    } finally {
      setLoading(false);
    }
  };

  // ── Xử lý Khoa ─────────────────────────────────────────────────────────────
  const handleOpenAddFaculty = () => {
    setEditingFaculty(null);
    setIsFacultyModalOpen(true);
  };

  const handleOpenEditFaculty = (f: Faculty) => {
    setEditingFaculty(f);
    setIsFacultyModalOpen(true);
  };

  const handleSubmitFaculty = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingFaculty) {
        await adminService.updateFaculty(editingFaculty.id, data);
        toast.success('Cập nhật khoa thành công!');
      } else {
        await adminService.createFaculty(data);
        toast.success('Thêm khoa mới thành công!');
      }
      setIsFacultyModalOpen(false);
      fetchData();
      adminService.getFaculties().then((res) => setFaculties(Array.isArray(res) ? res : [])).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Lỗi khi lưu khoa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaculty = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khoa này?')) return;
    try {
      await adminService.deleteFaculty(id);
      toast.success('Xóa khoa thành công!');
      fetchData();
      adminService.getFaculties().then((res) => setFaculties(Array.isArray(res) ? res : [])).catch(() => {});
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Không thể xóa khoa');
    }
  };

  // ── Xử lý Bộ môn ───────────────────────────────────────────────────────────
  const handleOpenAddDepartment = () => {
    setEditingDepartment(null);
    setIsDepartmentModalOpen(true);
  };

  const handleOpenEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setIsDepartmentModalOpen(true);
  };

  const handleSubmitDepartment = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingDepartment) {
        await adminService.updateDepartment(editingDepartment.id, data);
        toast.success('Cập nhật bộ môn thành công!');
      } else {
        await adminService.createDepartment(data);
        toast.success('Thêm bộ môn mới thành công!');
      }
      setIsDepartmentModalOpen(false);
      fetchData();
      adminService.getMajors().then((res) => setMajors(Array.isArray(res) ? res : [])).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Lỗi khi lưu bộ môn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bộ môn này?')) return;
    try {
      await adminService.deleteDepartment(id);
      toast.success('Xóa bộ môn thành công!');
      fetchData();
      adminService.getMajors().then((res) => setMajors(Array.isArray(res) ? res : [])).catch(() => {});
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Không thể xóa bộ môn');
    }
  };

  // ── Xử lý Lớp học ──────────────────────────────────────────────────────────
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: Class) => {
    setEditingClass(cls);
    setIsClassModalOpen(true);
  };

  const handleSubmitClass = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingClass) {
        await adminService.updateClass(editingClass.id, data);
        toast.success('Cập nhật lớp học thành công!');
      } else {
        await adminService.createClass(data);
        toast.success('Thêm lớp học mới thành công!');
      }
      setIsClassModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Lỗi khi lưu lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lớp học này?')) return;
    try {
      await adminService.deleteClass(id);
      toast.success('Xóa lớp học thành công!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Không thể xóa lớp học');
    }
  };

  return (
    <PageLayout
      title="Quản lý Tổ chức & Đào tạo"
      subtitle="Quản lý khoa, bộ môn và lớp học"
    >
      {/* ── Tabs Navigation ─────────────────────────────────────────────────── */}
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

      {/* ── Content Area ────────────────────────────────────────────────────── */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" /> Đang tải danh sách...
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeTab === 'faculties' && (
            <FacultiesTable
              faculties={faculties}
              onAdd={handleOpenAddFaculty}
              onEdit={handleOpenEditFaculty}
              onDelete={handleDeleteFaculty}
            />
          )}
          {activeTab === 'departments' && (
            <DepartmentsTable
              departments={departments}
              faculties={faculties}
              selectedFaculty={selectedFaculty}
              onSelectFaculty={setSelectedFaculty}
              onAdd={handleOpenAddDepartment}
              onEdit={handleOpenEditDepartment}
              onDelete={handleDeleteDepartment}
            />
          )}
          {activeTab === 'classes' && (
            <ClassesTable
              classes={classes}
              departments={departments}
              selectedDepartment={selectedDepartment}
              onSelectDepartment={setSelectedDepartment}
              onAdd={handleOpenAddClass}
              onEdit={handleOpenEditClass}
              onDelete={handleDeleteClass}
            />
          )}
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <ModalFaculty
        isOpen={isFacultyModalOpen}
        onClose={() => setIsFacultyModalOpen(false)}
        editingFaculty={editingFaculty}
        onSubmit={handleSubmitFaculty}
        isSubmitting={isSubmitting}
      />

      <ModalDepartment
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        editingDepartment={editingDepartment}
        faculties={faculties}
        onSubmit={handleSubmitDepartment}
        isSubmitting={isSubmitting}
      />

      <ModalClass
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        editingClass={editingClass}
        majors={majors}
        onSubmit={handleSubmitClass}
        isSubmitting={isSubmitting}
      />
    </PageLayout>
  );
}
