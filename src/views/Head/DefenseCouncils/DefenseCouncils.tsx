import { useEffect, useState } from 'react';
import { Shield, Calendar, Users, Plus, Search, Filter, Crown, FileText } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ModalCreateBoard } from '@/components/ModalCreateBoard';
import { ModalCouncilDetail } from '@/components/ModalCouncilDetail';
import { councilService } from '@/plugins/api';
import type { Council } from '@/types/api';

export function DefenseCouncils() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [loading, setLoading] = useState(true);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchCouncils = async () => {
    try {
      setLoading(true);
      const data = await councilService.getCouncils();
      const councilsArray = Array.isArray(data) ? data : (data as any)?.data || [];
      setCouncils(councilsArray);
    } catch (error) {
      console.error('Error fetching councils:', error);
      setCouncils([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouncils();
  }, []);

  const handleViewDetail = (council: Council) => {
    setSelectedCouncil(council);
    setIsDetailModalOpen(true);
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'PGS. TS. Nguyễn Văn A'}
      title="Hội đồng bảo vệ"
      subtitle="Quản lý các hội đồng bảo vệ khóa luận"
      actions={
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo hội đồng mới
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm hội đồng..." className="pl-10" />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'PREPARING', label: 'Chuẩn bị' },
                { value: 'SCHEDULED', label: 'Đã lên lịch' },
                { value: 'COMPLETED', label: 'Hoàn thành' },
                { value: 'CANCELLED', label: 'Đã hủy' },
              ]}
            />
            <Select
              options={[
                { value: 'all', label: 'Tất cả đợt' },
                { value: '2024-1', label: 'HK1 2024' },
                { value: '2024-2', label: 'HK2 2024' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Councils Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : councils.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Chưa có hội đồng nào</p>
            <Button onClick={() => setIsModalOpen(true)}>Tạo hội đồng đầu tiên</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {councils.map((council) => (
            <Card key={council.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <CardTitle className="text-lg">{council.council_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{council.council_code}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(council.status)}>
                    {council.status === 'PREPARING' && 'Chuẩn bị'}
                    {council.status === 'SCHEDULED' && 'Đã lên lịch'}
                    {council.status === 'COMPLETED' && 'Hoàn thành'}
                    {council.status === 'CANCELLED' && 'Đã hủy'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{council.defense_date ? new Date(council.defense_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-yellow-600 shrink-0" />
                    <span className="truncate">Chủ tịch: {council.instructors_defense_councils_chairman_idToinstructors?.users?.full_name || 'Chưa phân công'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">Thư ký: {council.instructors_defense_councils_secretary_idToinstructors?.users?.full_name || 'Chưa phân công'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{council.defense_assignments?.length || 0} luận văn</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{council.council_members?.length || 0} thành viên</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleViewDetail(council)}
                >
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <ModalCreateBoard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchCouncils();
        }}
      />
      
      <ModalCouncilDetail
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        council={selectedCouncil}
      />
    </PageLayout>
  );
}
