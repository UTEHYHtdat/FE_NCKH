import { useEffect, useState } from 'react';
import { Users, Building2, GraduationCap, Settings, Edit } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { thesisRoundsService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';

export function AdminDashboard() {
  const { user } = useAuth();
  const isAcademicAffairs = user?.role === 'academic_affairs';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    faculties: 0,
    departments: 0,
    classes: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [thesisRounds, setThesisRounds] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get thesis rounds for admin
        const rounds = await thesisRoundsService.getThesisRounds();
        setThesisRounds(rounds);

        // Stats would need to be fetched from admin-specific endpoints
        setStats({
          totalUsers: 0,
          faculties: 0,
          departments: 0,
          classes: 0,
        });

        // Recent users would need a user management API
        setRecentUsers([]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PageLayout
      title={isAcademicAffairs ? "Dashboard Giáo Vụ & Đào Tạo" : "Dashboard Quản Trị Hệ Thống"}
      subtitle={isAcademicAffairs ? "Tổng quan dữ liệu sinh viên, giảng viên và các lớp học" : "Cấu hình, phân quyền và quản lý hệ thống ThesisHub"}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.totalUsers}</h3>
            <p className="text-sm text-muted-foreground">Tổng người dùng</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.faculties}</h3>
            <p className="text-sm text-muted-foreground">Khoa</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.departments}</h3>
            <p className="text-sm text-muted-foreground">Bộ môn</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.classes}</h3>
            <p className="text-sm text-muted-foreground">Lớp học</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Người dùng mới nhất</CardTitle>
              <CardDescription>Người dùng được tạo gần đây</CardDescription>
            </div>
            <Button variant="ghost" size="sm">Xem tất cả</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Họ tên</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vai trò</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === 'instructor' ? 'violet' : 'blue'}>
                        {user.role === 'student' ? 'Sinh viên' : 'Giảng viên'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.status === 'active' ? 'green' : 'amber'}>
                        {user.status === 'active' ? 'Hoạt động' : 'Chờ kích hoạt'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="icon" variant="ghost" title="Sửa">
                        <Edit className="w-4 h-4 text-amber-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Cấu hình hệ thống</CardTitle>
            <CardDescription>Quản lý các thiết lập</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Cài đặt chung
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Building2 className="w-4 h-4 mr-2" />
                Quản lý tổ chức
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Phân quyền người dùng
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê hệ thống</CardTitle>
            <CardDescription>Hoạt động trong 30 ngày qua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đăng nhập mới</span>
                <span className="font-semibold">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đề tài đăng ký</span>
                <span className="font-semibold">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Báo cáo nộp</span>
                <span className="font-semibold">456</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
