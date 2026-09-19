import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Department, Class } from '@/types/api';

interface ClassesTableProps {
  classes: Class[];
  departments: Department[];
  selectedDepartment: number | null;
  onSelectDepartment: (id: number | null) => void;
  onAdd: () => void;
  onEdit: (cls: Class) => void;
  onDelete: (id: number) => void;
}

export function ClassesTable({
  classes,
  departments,
  selectedDepartment,
  onSelectDepartment,
  onAdd,
  onEdit,
  onDelete,
}: ClassesTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý Lớp học</CardTitle>
            <CardDescription>Danh sách các lớp học trong hệ thống</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm lớp mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Lọc theo bộ môn:</label>
          <select
            className="w-full max-w-xs px-3 py-2 border border-border rounded-md bg-background text-sm"
            value={selectedDepartment || ''}
            onChange={(e) => onSelectDepartment(e.target.value ? Number(e.target.value) : null)}
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
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mã lớp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tên lớp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Chuyên ngành</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Năm học</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Số sinh viên</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                    Chưa có lớp học nào trong hệ thống. Hãy bấm <strong>"Thêm lớp mới"</strong> để tạo.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{cls.class_code}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{cls.class_name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{cls.majors?.major_name || '-'}</td>
                    <td className="py-3 px-4 text-sm">{cls.academic_year || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{cls.student_count || 0}</Badge>
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
                        onClick={() => onEdit(cls)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(cls.id)}
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
