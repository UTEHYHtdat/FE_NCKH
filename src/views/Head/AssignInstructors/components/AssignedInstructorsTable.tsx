import React from 'react';
import { CheckCircle2, Trash2, Search, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InstructorItem } from '../types';

interface AssignedInstructorsTableProps {
  instructors: InstructorItem[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  instructorQuotas: Record<number, number>;
  onChangeQuota: (id: number, value: number | null) => void;
  totalSupervisionQuota: number;
  onRemoveInstructor: (id: number) => void;
  onRemoveAll: () => void;
  onViewDetail: (instructor: InstructorItem) => void;
}

export function AssignedInstructorsTable({
  instructors,
  searchTerm,
  onSearchChange,
  instructorQuotas,
  onChangeQuota,
  totalSupervisionQuota,
  onRemoveInstructor,
  onRemoveAll,
  onViewDetail,
}: AssignedInstructorsTableProps) {
  const selfRegisterCount = instructors.filter(
    (ins) => !instructorQuotas[ins.id] || instructorQuotas[ins.id] <= 0
  ).length;
  const setQuotaCount = instructors.length - selfRegisterCount;

  return (
    <Card className="shadow-sm border border-emerald-500/30 bg-emerald-500/[0.02] flex flex-col h-[700px]">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header Bảng 2 */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Giáo viên đã thêm vào đợt
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Giảng viên chính thức được phép hướng dẫn & phản biện trong đợt này
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="emerald" className="text-xs font-semibold">
                {instructors.length} GV
              </Badge>
              {totalSupervisionQuota > 0 && (
                <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 font-medium">
                  {totalSupervisionQuota} chỉ tiêu ({setQuotaCount} GV)
                </Badge>
              )}
              {selfRegisterCount > 0 && (
                <Badge variant="outline" className="text-[11px] text-blue-600 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 font-medium">
                  {selfRegisterCount} GV tự đăng ký
                </Badge>
              )}
            </div>
            {instructors.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemoveAll}
                className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1 cursor-pointer"
                title="Gỡ toàn bộ giáo viên khỏi đợt"
              >
                <Trash2 className="w-3 h-3" />
                Gỡ tất cả
              </Button>
            )}
          </div>
        </div>

        {/* Bộ lọc Bảng 2 */}
        <div className="py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm trong danh sách giáo viên đã thêm..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        {/* Table Bảng 2 */}
        <div className="flex-1 overflow-y-auto border border-emerald-500/20 rounded-lg bg-card">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 sticky top-0 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider z-10">
              <tr>
                <th className="py-2.5 px-3 text-left w-20">Mã GV</th>
                <th className="py-2.5 px-3 text-left">Giáo viên & Bộ môn</th>
                <th className="py-2.5 px-3 text-center w-28">Hạn mức HD</th>
                <th className="py-2.5 px-3 text-right w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {instructors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-foreground">Chưa có giáo viên nào trong đợt</p>
                    <p className="text-[11px] mt-0.5">
                      Hãy chọn giáo viên từ bảng bên trái và bấm "Thêm vào"
                    </p>
                  </td>
                </tr>
              ) : (
                instructors.map((ins) => (
                  <tr key={ins.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {ins.instructor_code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="font-semibold text-foreground hover:underline cursor-pointer"
                          onClick={() => onViewDetail(ins)}
                        >
                          {ins.full_name}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {ins.degree}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
                        {ins.department?.department_name || 'Bộ môn'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={instructorQuotas[ins.id] !== undefined && instructorQuotas[ins.id] !== null && instructorQuotas[ins.id] > 0 ? instructorQuotas[ins.id] : ''}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              onChangeQuota(ins.id, val === '' ? null : Number(val));
                            }}
                            placeholder="GV tự set"
                            className="w-18 h-7 text-center border border-input rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary bg-background placeholder:text-[10px] placeholder:font-normal placeholder:text-muted-foreground"
                            title="Số lượng đề tài hướng dẫn tối đa. Để trống để giáo viên tự đăng ký hạn mức."
                          />
                          {instructorQuotas[ins.id] && instructorQuotas[ins.id] > 0 ? (
                            <span className="text-[10px] text-muted-foreground">đề tài</span>
                          ) : null}
                        </div>
                        {(!instructorQuotas[ins.id] || instructorQuotas[ins.id] <= 0) && (
                          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-normal">
                            GV tự đăng ký
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveInstructor(ins.id)}
                        className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1 ml-auto cursor-pointer"
                        title="Gỡ giáo viên khỏi đợt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Gỡ
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
