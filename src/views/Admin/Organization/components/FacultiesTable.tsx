import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Faculty } from '@/types/api';

interface FacultiesTableProps {
  faculties: Faculty[];
  onAdd: () => void;
  onEdit: (faculty: Faculty) => void;
  onDelete: (id: number) => void;
}

export function FacultiesTable({ faculties, onAdd, onEdit, onDelete }: FacultiesTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý Khoa</CardTitle>
            <CardDescription>Danh sách các khoa trong hệ thống</CardDescription>
          </div>
          <Button onClick={onAdd}>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mã khoa</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tên khoa</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Địa chỉ</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Số bộ môn</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {faculties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                    Chưa có khoa nào trong hệ thống. Hãy bấm <strong>"Thêm khoa mới"</strong> để tạo.
                  </td>
                </tr>
              ) : (
                faculties.map((faculty) => (
                  <tr key={faculty.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{faculty.faculty_code}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{faculty.faculty_name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{faculty.address || '-'}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{faculty.email || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{faculty.departments?.length || 0}</Badge>
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
                        onClick={() => onEdit(faculty)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(faculty.id)}
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
