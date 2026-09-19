import React from 'react';
import { BookOpen, Calendar, RefreshCw, UserCheck, Sliders, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { translateStatus } from '@/helpers/constant';
import type { ThesisRound } from '@/types/api';

interface AssignInstructorsStatsProps {
  rounds: ThesisRound[];
  selectedRound: ThesisRound | null;
  onSelectRound: (round: ThesisRound) => void;
  isFetchingRounds: boolean;
  assignedCount: number;
  totalInstructorsCount: number;
  totalSupervisionQuota: number;
  unassignedCount: number;
}

export function AssignInstructorsStats({
  rounds,
  selectedRound,
  onSelectRound,
  isFetchingRounds,
  assignedCount,
  totalInstructorsCount,
  totalSupervisionQuota,
  unassignedCount,
}: AssignInstructorsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Thẻ 1: Bộ chọn đợt đề tài / khóa luận */}
      <Card className="md:col-span-1 shadow-sm border-primary/20 bg-primary/[0.01]">
        <CardContent className="p-4">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            1. Chọn Đợt Đề tài / Khóa luận:
          </label>
          {isFetchingRounds ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang tải danh sách đợt...
            </div>
          ) : (
            <Select
              value={selectedRound?.id.toString() || ''}
              onValueChange={(val) => {
                const r = rounds.find((item) => item.id === Number(val));
                if (r) onSelectRound(r);
              }}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Chọn đợt đề tài / khóa luận..." />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id.toString()}>
                    {round.round_name} ({round.academic_year || 'N/A'} - HK{round.semester || 1})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedRound && (
            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  {selectedRound.round_code || `ĐK${selectedRound.id}`}
                </span>
                <Badge
                  variant={getStatusBadgeVariant(selectedRound.status as any)}
                  className="text-[10px]"
                >
                  {translateStatus(selectedRound.status as string)}
                </Badge>
              </div>
              <span className="flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                Năm học: {selectedRound.academic_year} (HK{selectedRound.semester})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thẻ 2: Thống kê giáo viên đã gán */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Giáo viên đã thêm
            </p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {assignedCount}{' '}
              <span className="text-xs font-normal text-muted-foreground">/ {totalInstructorsCount}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Giảng viên tham gia đợt này
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Thẻ 3: Thống kê tổng chỉ tiêu hướng dẫn */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng chỉ tiêu hướng dẫn
            </p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {totalSupervisionQuota}{' '}
              <span className="text-xs font-normal text-muted-foreground">đề tài / nhóm</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Hạn mức nhận SV tối đa
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Thẻ 4: Giáo viên khả dụng (chưa thêm) */}
      <Card className="shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              GV sẵn sàng bổ sung
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">
              {unassignedCount}{' '}
              <span className="text-xs font-normal text-muted-foreground">giảng viên</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Thuộc các bộ môn trong khoa
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
