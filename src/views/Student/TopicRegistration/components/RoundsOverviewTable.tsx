import React, { useState } from 'react';
import { Search, School, ArrowRight, Eye, Calendar, Clock, BookOpen, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RoundsOverviewTableProps {
  thesisRounds: any[];
  registrations: any[];
  loading: boolean;
  onSelectRoundForRegistration: (round: any) => void;
  onViewRegisteredTopic: (round: any, registration: any) => void;
}

export function RoundsOverviewTable({
  thesisRounds,
  registrations,
  loading,
  onSelectRoundForRegistration,
  onViewRegisteredTopic,
}: RoundsOverviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Find student's registration for a specific round
  const getRegistrationForRound = (roundId: number) => {
    return registrations.find((r) => {
      // Direct thesis_round_id match or via thesis_group's round
      return r.thesis_round_id === roundId || r.thesis_groups?.thesis_round_id === roundId;
    });
  };

  // Helper format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định';
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  // Extract unique thesis type names for filtering
  const availableTypes = Array.from(
    new Set(
      thesisRounds
        .map((r) => r.thesis_types?.type_name || r.thesis_types?.type_code)
        .filter(Boolean)
    )
  );

  // Filtered rounds
  const filteredRounds = thesisRounds.filter((round) => {
    const roundName = (round.round_name || round.roundName || '').toLowerCase();
    const roundCode = (round.round_code || round.roundCode || '').toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      roundName.includes(searchTerm.toLowerCase()) ||
      roundCode.includes(searchTerm.toLowerCase());

    const roundType = round.thesis_types?.type_name || round.thesis_types?.type_code || '';
    const matchesType = typeFilter === 'all' || roundType === typeFilter;

    const registration = getRegistrationForRound(round.id);
    let regStatus = 'NOT_REGISTERED';
    if (registration) {
      if (registration.instructor_status === 'APPROVED' && registration.head_status === 'APPROVED') {
        regStatus = 'APPROVED';
      } else if (registration.instructor_status === 'REJECTED' || registration.head_status === 'REJECTED') {
        regStatus = 'REJECTED';
      } else {
        regStatus = 'PENDING';
      }
    }

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'REGISTERED' && !!registration) ||
      statusFilter === regStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Danh sách Đợt Đồ án & Bài tập lớn
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Hệ thống hỗ trợ nhiều đợt làm việc đồng thời (Bài tập lớn, Đồ án 1, 2, 3, Khóa luận tốt nghiệp). Hãy chọn đợt tương ứng để đăng ký đề tài hoặc xem tiến độ phê duyệt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-background px-3 py-1 font-medium">
              Tổng số đợt mở: {thesisRounds.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên đợt hoặc mã đợt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả loại hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại hình (BTL / Đồ án / KLTN)</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái đề tài" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái của bạn</SelectItem>
                <SelectItem value="APPROVED">Đã phê duyệt đề tài</SelectItem>
                <SelectItem value="PENDING">Đang chờ phê duyệt</SelectItem>
                <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                <SelectItem value="NOT_REGISTERED">Chưa đăng ký đề tài</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rounds Table */}
      <Card>
        <CardHeader className="py-4 px-6 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Các đợt được phân công cho lớp của bạn ({filteredRounds.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Bấm vào hành động tương ứng của từng đợt để tiếp tục
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Đang tải danh sách các đợt đồ án...
            </div>
          ) : filteredRounds.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <School className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
              <p className="font-medium text-foreground mb-1">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Không tìm thấy đợt nào phù hợp với bộ lọc'
                  : 'Chưa có đợt đồ án / bài tập lớn nào mở cho lớp của bạn'}
              </p>
              <p className="text-xs max-w-md mx-auto">
                Vui lòng liên hệ Trưởng bộ môn hoặc Giảng viên phụ trách để phân công lớp tham gia đợt đồ án.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[30%]">Đợt đồ án / Khóa luận</TableHead>
                  <TableHead className="w-[18%]">Loại hình</TableHead>
                  <TableHead className="w-[18%]">Hạn đăng ký</TableHead>
                  <TableHead className="w-[14%]">Trạng thái đợt</TableHead>
                  <TableHead className="w-[20%]">Trạng thái của bạn</TableHead>
                  <TableHead className="text-right w-[15%]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRounds.map((round) => {
                  const registration = getRegistrationForRound(round.id);
                  const isRoundActive =
                    round.status?.toUpperCase() === 'ACTIVE' || round.status?.toUpperCase() === 'ONGOING';
                  const isUpcoming =
                    round.status?.toUpperCase() === 'UPCOMING' || round.status?.toUpperCase() === 'PREPARING';

                  const typeName =
                    round.thesis_types?.type_name || round.thesis_types?.type_code || 'Khóa luận';

                  const topicTitle =
                    registration?.proposed_topics?.topic_title ||
                    registration?.self_proposed_title ||
                    registration?.theses?.title;

                  const isApproved =
                    registration &&
                    registration.instructor_status === 'APPROVED' &&
                    registration.head_status === 'APPROVED';

                  const isRejected =
                    registration &&
                    (registration.instructor_status === 'REJECTED' || registration.head_status === 'REJECTED');

                  const isPending = registration && !isApproved && !isRejected;

                  return (
                    <TableRow key={round.id} className="hover:bg-muted/30">
                      {/* Đợt đồ án */}
                      <TableCell className="align-middle">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground text-sm">
                            {round.round_name || round.roundName || `Đợt ${round.id}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                              {round.round_code || round.roundCode || `RD-${round.id}`}
                            </span>
                            {(round.academic_year || round.semester) && (
                              <span>
                                {round.academic_year} {round.semester ? `• Kỳ ${round.semester}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Loại hình */}
                      <TableCell className="align-middle">
                        <Badge
                          variant="secondary"
                          className="font-normal text-xs bg-primary/10 text-primary border-primary/20"
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          {typeName}
                        </Badge>
                      </TableCell>

                      {/* Hạn đăng ký */}
                      <TableCell className="align-middle">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Hạn ĐK:</span>
                            <span className="font-medium text-foreground">
                              {formatDate(round.registration_deadline)}
                            </span>
                          </div>
                          {round.report_submission_deadline && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Hạn nộp:</span>
                              <span>{formatDate(round.report_submission_deadline)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Trạng thái đợt */}
                      <TableCell className="align-middle">
                        <Badge
                          variant={isRoundActive ? 'default' : isUpcoming ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {isRoundActive ? 'Đang mở' : isUpcoming ? 'Sắp mở' : 'Đã đóng'}
                        </Badge>
                      </TableCell>

                      {/* Trạng thái sinh viên */}
                      <TableCell className="align-middle">
                        {isApproved ? (
                          <div className="space-y-1 max-w-[200px]">
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                              ✓ Đã phê duyệt đề tài
                            </Badge>
                            {topicTitle && (
                              <p className="text-xs text-muted-foreground truncate font-medium" title={topicTitle}>
                                {topicTitle}
                              </p>
                            )}
                          </div>
                        ) : isPending ? (
                          <div className="space-y-1 max-w-[200px]">
                            <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30 text-xs">
                              ⏳ Chờ phê duyệt
                            </Badge>
                            {topicTitle && (
                              <p className="text-xs text-muted-foreground truncate" title={topicTitle}>
                                {topicTitle}
                              </p>
                            )}
                          </div>
                        ) : isRejected ? (
                          <div className="space-y-1 max-w-[200px]">
                            <Badge variant="destructive" className="text-xs">
                              ✕ Bị từ chối
                            </Badge>
                            <p className="text-xs text-muted-foreground">Có thể nộp lại</p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            Chưa đăng ký
                          </Badge>
                        )}
                      </TableCell>

                      {/* Nút hành động */}
                      <TableCell className="text-right align-middle">
                        {registration ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => onViewRegisteredTopic(round, registration)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-primary" />
                            Xem đề tài
                          </Button>
                        ) : isRoundActive ? (
                          <Button
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => onSelectRoundForRegistration(round)}
                          >
                            Đăng ký
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" disabled className="text-xs h-8 opacity-50">
                            Không khả dụng
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
