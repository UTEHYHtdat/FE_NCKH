import { useEffect, useState } from 'react';
import { Shield, Calendar, Users, Plus, Search, Crown, FileText, BookOpen } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { ModalCreateBoard } from '@/components/ModalCreateBoard';
import { ModalCouncilDetail } from '@/components/ModalCouncilDetail';
import { councilService, thesisRoundsService } from '@/plugins/api';
import type { Council, ThesisRound } from '@/types/api';
import { translateStatus, getStatusBadgeVariant } from '@/helpers/constant';

import { ExcelBatchActions } from '@/components/shared/ExcelBatchActions';
import { excelBatchService } from '@/plugins/api';

export function DefenseCouncils() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [loading, setLoading] = useState(true);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [rounds, setRounds] = useState<ThesisRound[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');

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

  const fetchRounds = async () => {
    try {
      const data = await thesisRoundsService.getActiveThesisRoundsForHead();
      const roundsArray = Array.isArray(data) ? data : (data as any)?.data || [];
      setRounds(roundsArray);
    } catch (error) {
      console.error('Error fetching rounds:', error);
      setRounds([]);
    }
  };

  useEffect(() => {
    fetchCouncils();
    fetchRounds();
  }, []);

  const handleViewDetail = (council: Council) => {
    setSelectedCouncil(council);
    setIsDetailModalOpen(true);
  };

  const filteredCouncils = councils.filter((council) => {
    // Search query
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      council.council_name.toLowerCase().includes(searchLower) ||
      council.council_code.toLowerCase().includes(searchLower) ||
      (council.instructors_defense_councils_chairman_idToinstructors?.users?.full_name || '')
        .toLowerCase()
        .includes(searchLower) ||
      (council.venue || '').toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = statusFilter === 'all' || council.status === statusFilter;

    // Round filter
    const matchesRound = roundFilter === 'all' || council.thesis_round_id?.toString() === roundFilter;

    return matchesSearch && matchesStatus && matchesRound;
  });

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'PGS. TS. Nguyễn Văn A'}
      title="Hội đồng bảo vệ"
      subtitle="Quản lý các hội đồng bảo vệ khóa luận"
      actions={
        <div className="flex items-center gap-2">
          <ExcelBatchActions
            exportUrl={excelBatchService.getDefenseScheduleExportUrl(roundFilter)}
            exportLabel="Xuất Lịch Hội đồng (Excel)"
          />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo hội đồng mới
          </Button>
        </div>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên HĐ, mã, chủ tịch, phòng..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'PREPARING', label: 'Chuẩn bị' },
                { value: 'SCHEDULED', label: 'Đã lên lịch' },
                { value: 'COMPLETED', label: 'Hoàn thành' },
                { value: 'CANCELLED', label: 'Đã hủy' },
              ]}
            />
            <Select
              value={roundFilter}
              onValueChange={(val) => setRoundFilter(val)}
              options={[
                { value: 'all', label: 'Tất cả đợt đồ án' },
                ...rounds.map((r) => ({
                  value: r.id.toString(),
                  label: `${r.round_name} (${r.academic_year || ''})`,
                })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Councils Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải danh sách hội đồng...</p>
        </div>
      ) : filteredCouncils.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || roundFilter !== 'all'
                ? 'Không tìm thấy hội đồng phù hợp với bộ lọc'
                : 'Chưa có hội đồng nào'}
            </p>
            {councils.length === 0 && (
              <Button onClick={() => setIsModalOpen(true)}>Tạo hội đồng đầu tiên</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCouncils.map((council) => {
            const memberCount =
              (council.council_members?.length || 0) +
              (council.instructors_defense_councils_chairman_idToinstructors ? 1 : 0) +
              (council.instructors_defense_councils_secretary_idToinstructors ? 1 : 0);
            const thesisCount = council.defense_assignments?.length || 0;

            return (
              <Card
                key={council.id}
                className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
                onClick={() => handleViewDetail(council)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <CardTitle className="text-lg leading-tight">{council.council_name}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{council.council_code}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(council.status)}>
                      {translateStatus(council.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 shrink-0 text-primary" />
                      <span className="font-medium text-foreground">
                        {council.defense_date ? new Date(council.defense_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate">
                        Chủ tịch: <strong className="font-medium text-foreground">{council.instructors_defense_councils_chairman_idToinstructors?.users?.full_name || 'Chưa phân công'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">
                        Thư ký: <strong className="font-medium text-foreground">{council.instructors_defense_councils_secretary_idToinstructors?.users?.full_name || 'Chưa phân công'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{thesisCount} luận văn</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{memberCount} thành viên</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(council);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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
