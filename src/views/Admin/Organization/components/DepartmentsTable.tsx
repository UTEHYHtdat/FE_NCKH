import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Faculty, Department } from '@/types/api';

interface DepartmentsTableProps {
  departments: Department[];
  faculties: Faculty[];
  selectedFaculty: number | null;
  onSelectFaculty: (id: number | null) => void;
  onAdd: () => void;
  onEdit: (dept: Department) => void;
  onDelete: (id: number) => void;
}

export function DepartmentsTable({
  departments,
  faculties,
  selectedFaculty,
  onSelectFaculty,
  onAdd,
  onEdit,
  onDelete,
}: DepartmentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý Bộ môn</CardTitle>
            <CardDescription>Danh sách các bộ môn trong hệ thống</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm bộ môn mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Lọc theo khoa:</label>
          <select
            className="w-full max-w-xs px-3 py-2 border border-border rounded-md bg-background text-sm"
            value={selectedFaculty || ''}
            onChange={(e) => onSelectFaculty(e.target.value ? Number(e.target.value) : null)}
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
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mã bộ môn</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tên bộ môn</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Khoa</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Số giảng viên</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                    Chưa có bộ môn nào trong hệ thống. Hãy bấm <strong>"Thêm bộ môn mới"</strong> để tạo.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{dept.department_code}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{dept.department_name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{dept.faculties?.faculty_name || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{dept.instructors?.length || 0}</Badge>
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
                        onClick={() => onEdit(dept)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(dept.id)}
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
