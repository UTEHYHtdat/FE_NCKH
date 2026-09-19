import React, { useState } from 'react';
import { Search, Check, ChevronRight, ArrowLeft, Loader2, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface StepSelectInstructorProps {
  round: any;
  instructors: any[];
  selectedInstructor: number | null;
  loading: boolean;
  onSelectInstructor: (instructorId: number) => void;
  onNext: () => void;
  onBackToRounds: () => void;
}

export function StepSelectInstructor({
  round,
  instructors,
  selectedInstructor,
  loading,
  onSelectInstructor,
  onNext,
  onBackToRounds,
}: StepSelectInstructorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInstructors = instructors.filter((inst) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (inst.name || inst.full_name || '').toLowerCase();
    const code = (inst.instructorCode || inst.code || '').toLowerCase();
    const spec = (inst.specialization || '').toLowerCase();
    const dept = (inst.department || '').toLowerCase();
    return name.includes(term) || code.includes(term) || spec.includes(term) || dept.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <Button variant="ghost" onClick={onBackToRounds} className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách đợt
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Đang đăng ký cho:</span>
          <Badge variant="secondary" className="text-xs font-semibold">
            {round.round_name}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {round.thesis_types?.type_name || 'Đợt đồ án'}
          </Badge>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Bước 1: Chọn Giảng viên hướng dẫn
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vui lòng chọn 01 giảng viên hướng dẫn trong danh sách được phân công cho đợt này để hướng dẫn đề tài của bạn.
        </p>
      </div>

      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên giảng viên, mã GV, hướng nghiên cứu..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Instructor list */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-sm">Đang tải danh sách giảng viên của đợt...</span>
          </CardContent>
        </Card>
      ) : filteredInstructors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <UserX className="w-10 h-10 mx-auto mb-3 opacity-30 text-primary" />
            <p className="font-medium text-foreground mb-1">
              {instructors.length === 0
                ? 'Chưa có giảng viên nào được phân công cho đợt đồ án này'
                : 'Không tìm thấy giảng viên phù hợp với từ khóa'}
            </p>
            <p className="text-xs">
              Vui lòng liên hệ Trưởng bộ môn nếu đợt chưa có giảng viên hướng dẫn.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
          {filteredInstructors.map((instructor) => {
            const isSelected = selectedInstructor === instructor.id;
            const quota = instructor.quota || 10;
            const currentLoad = instructor.currentLoad || 0;
            const isFull = currentLoad >= quota && quota > 0;

            return (
              <Card
                key={instructor.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/5 border-primary'
                    : 'hover:shadow-md'
                } ${isFull ? 'opacity-70' : ''}`}
                onClick={() => !isFull && onSelectInstructor(instructor.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={instructor.name || 'GV'} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm truncate">{instructor.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {instructor.degree || 'Giảng viên'}
                            {instructor.instructorCode && ` • Mã: ${instructor.instructorCode}`}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      {instructor.specialization && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          <span className="font-medium text-foreground">Hướng NC:</span> {instructor.specialization}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Khoa: {instructor.department || 'CNTT'}</span>
                        {instructor.yearsOfExperience ? (
                          <span>Kinh nghiệm: {instructor.yearsOfExperience} năm</span>
                        ) : null}
                      </div>

                      {/* Quota bar */}
                      <div className="mt-3 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Số lượng đã nhận:</span>
                          <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-emerald-600'}`}>
                            {currentLoad}/{quota} {isFull ? '(Đã hết chỉ tiêu)' : ''}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isFull ? 'bg-red-600' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, (currentLoad / quota) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={onNext} disabled={!selectedInstructor}>
          Tiếp tục: Chọn đề tài
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
