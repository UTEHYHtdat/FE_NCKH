import React from 'react';
import { ArrowLeft, Check, Clock, AlertTriangle, User, Calendar, BookOpen, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

interface RegisteredTopicCardProps {
  round: any;
  registration: any;
  onBack: () => void;
}

export function RegisteredTopicCard({
  round,
  registration,
  onBack,
}: RegisteredTopicCardProps) {
  const isApproved =
    registration.instructor_status === 'APPROVED' && registration.head_status === 'APPROVED';

  const isRejected =
    registration.instructor_status === 'REJECTED' || registration.head_status === 'REJECTED';

  const isPending = !isApproved && !isRejected;

  const topicTitle =
    registration.proposed_topics?.topic_title ||
    registration.self_proposed_title ||
    registration.theses?.title ||
    'Đề tài chưa đặt tên';

  const topicCode =
    registration.proposed_topics?.topic_code ||
    registration.theses?.thesis_code ||
    `REG-${registration.id}`;

  const topicDescription =
    registration.proposed_topics?.topic_description ||
    registration.self_proposed_description ||
    registration.theses?.description ||
    'Chưa có mô tả chi tiết';

  const instructorName =
    registration.instructors?.users?.full_name ||
    registration.instructors?.full_name ||
    'Giảng viên hướng dẫn';

  const instructorEmail = registration.instructors?.users?.email || '';

  const groupMembers = registration.thesis_groups?.thesis_group_members || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có';
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button & Round header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách đợt
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {round.thesis_types?.type_name || 'Đợt đồ án'}
          </Badge>
          <span className="text-sm font-medium text-foreground">{round.round_name}</span>
        </div>
      </div>

      {/* Main Status Banner */}
      {isApproved ? (
        <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
                  Đề tài của bạn đã được phê duyệt!
                </h2>
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  Chính thức
                </Badge>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Đề tài đã hoàn tất quy trình phê duyệt từ Giảng viên hướng dẫn và Trưởng bộ môn. Bạn không cần đăng ký thêm đề tài nào cho đợt này.
              </p>
              {registration.head_approval_date && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400/80">
                  Ngày phê duyệt: <span className="font-semibold">{formatDate(registration.head_approval_date)}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : isPending ? (
        <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300">
                  Đơn đăng ký đề tài đang chờ phê duyệt
                </h2>
                <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300 text-xs">
                  Đang xử lý
                </Badge>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Hồ sơ đăng ký đề tài đã được gửi lên hệ thống và đang trong quá trình xét duyệt 2 cấp.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-background/80 rounded-lg border border-amber-200 dark:border-amber-900/40 text-xs">
                  <span className="text-muted-foreground block mb-1">1. Giảng viên hướng dẫn:</span>
                  <Badge
                    variant={registration.instructor_status === 'APPROVED' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {registration.instructor_status === 'APPROVED' ? '✓ Đã duyệt' : '⏳ Đang chờ duyệt'}
                  </Badge>
                </div>
                <div className="p-3 bg-background/80 rounded-lg border border-amber-200 dark:border-amber-900/40 text-xs">
                  <span className="text-muted-foreground block mb-1">2. Trưởng bộ môn:</span>
                  <Badge
                    variant={registration.head_status === 'APPROVED' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {registration.head_status === 'APPROVED' ? '✓ Đã duyệt' : '⏳ Đang chờ duyệt'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 text-destructive">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-xl font-bold text-destructive">
                Đơn đăng ký đề tài bị từ chối
              </h2>
              <p className="text-sm text-muted-foreground">
                Đề tài của bạn chưa đạt yêu cầu hoặc cần chỉnh sửa. Bạn có thể liên hệ giảng viên hướng dẫn hoặc nộp lại đề tài mới.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Information Details */}
      <Card>
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Thông tin chi tiết đề tài</CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              Mã: {topicCode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">{topicTitle}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {topicDescription}
            </p>
          </div>

          {registration.selection_reason && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border/50 text-sm">
              <span className="font-semibold block mb-1">Lý do chọn đề tài / Mục tiêu nghiên cứu:</span>
              <p className="text-muted-foreground italic">"{registration.selection_reason}"</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Instructor Info */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <User className="w-4 h-4 text-primary" />
                Giảng viên hướng dẫn
              </div>
              <div className="flex items-center gap-3">
                <Avatar name={instructorName} size="lg" />
                <div>
                  <p className="font-semibold text-sm">{instructorName}</p>
                  {instructorEmail && (
                    <p className="text-xs text-muted-foreground">{instructorEmail}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Khoa / Bộ môn: {registration.instructors?.department?.department_name || 'Bộ môn CNTT'}
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Metadata */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                Thông tin đăng ký
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Ngày đăng ký:</span>
                  <span className="font-medium text-xs">{formatDate(registration.registration_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Hình thức:</span>
                  <span className="font-medium text-xs">
                    {registration.applied_group_mode === 'GROUP_ONLY' || registration.thesis_group_id ? 'Theo nhóm' : 'Cá nhân'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Đợt đồ án:</span>
                  <span className="font-medium text-xs">{round.round_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Group members if applicable */}
          {groupMembers.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                <Users className="w-4 h-4 text-primary" />
                Thành viên nhóm thực hiện ({groupMembers.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupMembers.map((m: any) => (
                  <div key={m.id} className="p-3 rounded-lg border border-border flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium block text-sm">
                        {m.students?.users?.full_name || 'Thành viên'}
                      </span>
                      <span className="text-muted-foreground">MSSV: {m.students?.student_code || 'N/A'}</span>
                    </div>
                    {m.role === 'LEADER' && (
                      <Badge variant="default" className="text-[10px]">
                        Trưởng nhóm
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
