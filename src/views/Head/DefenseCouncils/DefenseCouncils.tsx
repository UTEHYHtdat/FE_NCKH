import { useEffect, useState } from 'react';
import {
  Shield,
  Calendar,
  Users,
  Plus,
  Search,
  Crown,
  FileText,
  BookOpen,
  Eye,
} from 'lucide-react';
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
      const councilsArray = Array.isArray(data)
        ? data
        : (data as any)?.data || [];
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
      const roundsArray = Array.isArray(data)
        ? data
        : (data as any)?.data || [];
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
      (
        council.instructors_defense_councils_chairman_idToinstructors?.users
          ?.full_name || ''
      )
        .toLowerCase()
        .includes(searchLower) ||
      (council.venue || '').toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || council.status === statusFilter;

    // Round filter
    const matchesRound =
      roundFilter === 'all' ||
      council.thesis_round_id?.toString() === roundFilter;

    return matchesSearch && matchesStatus && matchesRound;
  });
  const Header = [
    { text: 'STT', value: '' },
    { text: 'Tên hội đồng', value: 'council.council_name' },
    { text: 'Mã hội đồng', value: 'council.council_code' },
    { text: 'Ngày bảo vệ', value: 'council.defense_date' },
    {
      text: 'Chủ tịch',
      value:
        'council.instructors_defense_councils_chairman_idToinstructors.users.full_name',
      width: 'w-1/6',
    },
    {
      text: 'Thư ký',
      value:
        'council.instructors_defense_councils_secretary_idToinstructors.users.full_name',
    },
    { text: 'Luận văn', value: 'council.defense_assignments.length' },
    { text: 'Thành viên', value: 'council.council_members.length' },

    { text: 'Thao tác', value: '' },
    { text: 'Trạng thái', value: 'council.status' },
  ];

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'PGS. TS. Nguyễn Văn A'}
      title="Hội đồng bảo vệ"
      subtitle="Quản lý các hội đồng bảo vệ khóa luận"
      actions={
        <div className="flex items-center gap-2">
          <ExcelBatchActions
            exportUrl={excelBatchService.getDefenseScheduleExportUrl(
              roundFilter,
            )}
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
        <div className="p-12 text-center text-muted-foreground">
          <p className="text-muted-foreground">
            Đang tải danh sách hội đồng...
          </p>
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
              <Button onClick={() => setIsModalOpen(true)}>
                Tạo hội đồng đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr className="border-b border-border bg-muted/40">
                {Header.map((header) => (
                  <th
                    key={header.text}
                    className="text-left py-4 px-4 font-semibold text-muted-foreground"
                  >
                    {header.text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCouncils.map((council, index) => {
                const memberCount =
                  (council.council_members?.length || 0) +
                  (council.instructors_defense_councils_chairman_idToinstructors
                    ? 1
                    : 0) +
                  (council.instructors_defense_councils_secretary_idToinstructors
                    ? 1
                    : 0);
                const thesisCount = council.defense_assignments?.length || 0;
                return (
                  <tr
                    key={council.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    {/* STT */}{' '}
                    <td className="p-2 w-[30px] text-center">{index + 1}</td>
                    {/* Tên hội đồng */}
                    <td className="p-3 font-medium min-w-[220px]">
                      <div className="whitespace-normal break-words">
                        {council.council_name}
                      </div>
                    </td>
                    {/* Mã hội đồng */}
                    <td className="p-2 min-w-[70px]">
                      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {council.council_code}
                      </span>
                    </td>
                    {/* Ngày bảo vệ */}
                    <td className="p-2 min-w-[80px] whitespace-nowrap">
                      {council.defense_date
                        ? new Date(council.defense_date).toLocaleDateString(
                            'vi-VN',
                          )
                        : 'Chưa xác định'}
                    </td>
                    {/* Chủ tịch */}
                    <td className="p-2 min-w-[100px] truncate">
                      {council
                        .instructors_defense_councils_chairman_idToinstructors
                        ?.users?.full_name || 'Chưa phân công'}
                    </td>
                    {/* Thư ký */}
                    <td className="p-2 min-w-[100px] truncate">
                      {council
                        .instructors_defense_councils_secretary_idToinstructors
                        ?.users?.full_name || 'Chưa phân công'}
                    </td>
                    {/* Luận văn */}
                    <td className="p-2 text-center"> {thesisCount} </td>
                    {/* Thành viên */}
                    <td className="p-2 min-w-[50px] text-center">
                      {' '}
                      {memberCount}{' '}
                    </td>
                    {/* Trạng thái */}
                    <td className="p-1">
                      <Badge variant={getStatusBadgeVariant(council.status)}>
                        {translateStatus(council.status)}
                      </Badge>
                    </td>
                    {/* Thao tác */}
                    <td className="p-1 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Xem chi tiết"
                        onClick={() => handleViewDetail(council)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
