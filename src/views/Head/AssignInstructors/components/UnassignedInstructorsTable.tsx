import React from 'react';
import { GraduationCap, ArrowRight, Search, RefreshCw, CheckCircle2, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InstructorItem } from '../types';

interface UnassignedInstructorsTableProps {
  instructors: InstructorItem[];
  departments: any[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterDepartment: string;
  onFilterDepartmentChange: (val: string) => void;
  filterDegree: string;
  onFilterDegreeChange: (val: string) => void;
  isLoading: boolean;
  onAddInstructor: (id: number) => void;
  onAddAll: () => void;
  onViewDetail: (instructor: InstructorItem) => void;
}

export function UnassignedInstructorsTable({
  instructors,
  departments,
  searchTerm,
  onSearchChange,
  filterDepartment,
  onFilterDepartmentChange,
  filterDegree,
  onFilterDegreeChange,
  isLoading,
  onAddInstructor,
  onAddAll,
  onViewDetail,
}: UnassignedInstructorsTableProps) {
  return (
    <Card className="shadow-sm border border-border flex flex-col h-[700px]">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header Bảng 1 */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Giáo viên chưa thêm vào đợt
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Danh sách giảng viên khả dụng có thể gán vào đợt đề tài này
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {instructors.length} GV
            </Badge>
            {instructors.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddAll}
                className="text-xs h-7 px-2.5 flex items-center gap-1 text-primary border-primary/30 hover:bg-primary/5 cursor-pointer"
                title="Thêm tất cả giáo viên đang hiển thị sang đợt"
              >
                <ArrowRight className="w-3 h-3" />
                Thêm tất cả
              </Button>
            )}
          </div>
        </div>

        {/* Bộ lọc Bảng 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-3">
          <div className="relative sm:col-span-6">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm mã GV, họ tên, email, chuyên môn..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
          <div className="sm:col-span-3">
            <select
              value={filterDepartment}
              onChange={(e) => onFilterDepartmentChange(e.target.value)}
              className="w-full px-2 py-1 border border-input rounded-md bg-background text-xs h-8 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả Bộ môn</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.department_code} - {d.department_name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <select
              value={filterDegree}
              onChange={(e) => onFilterDegreeChange(e.target.value)}
              className="w-full px-2 py-1 border border-input rounded-md bg-background text-xs h-8 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả Học vị</option>
              <option value="Tiến sĩ">Tiến sĩ</option>
              <option value="Thạc sĩ">Thạc sĩ</option>
              <option value="Phó Giáo sư">Phó Giáo sư</option>
              <option value="Giáo sư">Giáo sư</option>
            </select>
          </div>
        </div>

        {/* Table Bảng 1 */}
        <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 sticky top-0 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider z-10">
              <tr>
                <th className="py-2.5 px-3 text-left w-20">Mã GV</th>
                <th className="py-2.5 px-3 text-left">Giáo viên & Học vị</th>
                <th className="py-2.5 px-3 text-left">Bộ môn & Hướng NC</th>
                <th className="py-2.5 px-3 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5" />
                    Đang tải danh sách giáo viên...
                  </td>
                </tr>
              ) : instructors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="font-medium text-foreground">Không còn giáo viên nào chưa gán</p>
                    <p className="text-[11px] mt-0.5">
                      Tất cả giáo viên phù hợp đã được gán vào đợt đề tài này
                    </p>
                  </td>
                </tr>
              ) : (
                instructors.map((ins) => (
                  <tr key={ins.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-primary whitespace-nowrap">
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
                        {ins.email || 'Chưa có email'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 font-medium">
                          {ins.department?.department_code || 'BM'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {ins.years_of_experience ? `${ins.years_of_experience} năm KN` : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={ins.specialization}>
                        {ins.specialization}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => onAddInstructor(ins.id)}
                        className="text-xs h-7 px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Thêm vào
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
