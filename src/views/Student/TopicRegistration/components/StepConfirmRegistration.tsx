import React from 'react';
import { ChevronLeft, Check, AlertTriangle, Users, User, BookOpen, Layers, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

interface StepConfirmRegistrationProps {
  round: any;
  selectedInstructorInfo?: any;
  selectedTopicInfo?: any;
  topicMode: 'proposed' | 'self';
  selfProposedTitle: string;
  selfProposedDescription: string;
  selectionReason: string;
  registrationMode: 'group' | 'individual';
  selectedGroupId: number | null;
  thesisGroups: any[];
  submitting: boolean;
  onSetRegistrationMode: (mode: 'group' | 'individual') => void;
  onSetSelectedGroupId: (groupId: number | null) => void;
  onSubmit: () => void;
  onPrev: () => void;
}

export function StepConfirmRegistration({
  round,
  selectedInstructorInfo,
  selectedTopicInfo,
  topicMode,
  selfProposedTitle,
  selfProposedDescription,
  selectionReason,
  registrationMode,
  selectedGroupId,
  thesisGroups,
  submitting,
  onSetRegistrationMode,
  onSetSelectedGroupId,
  onSubmit,
  onPrev,
}: StepConfirmRegistrationProps) {
  // Filter groups that match this round (or all available groups if not restricted by round)
  const availableGroupsForRound = thesisGroups.filter((g) => {
    return !g.thesis_round_id || g.thesis_round_id === round.id;
  });

  const selectedGroup = availableGroupsForRound.find((g) => g.id === selectedGroupId);

  const topicTitle =
    topicMode === 'proposed'
      ? selectedTopicInfo?.title || 'Đề tài đề xuất'
      : selfProposedTitle;

  const topicDescription =
    topicMode === 'proposed'
      ? selectedTopicInfo?.description
      : selfProposedDescription;

  const canSubmit =
    registrationMode === 'individual' ||
    (registrationMode === 'group' && !!selectedGroupId);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Step Header */}
      <div className="pb-2 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Bước 3: Xác nhận thông tin và nộp đơn đăng ký
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vui lòng rà soát lại toàn bộ thông tin đề tài, giảng viên hướng dẫn và hình thức thực hiện trước khi gửi.
        </p>
      </div>

      {/* Review Card */}
      <Card>
        <CardHeader className="py-4 border-b border-border">
          <CardTitle className="text-base font-semibold">Tóm tắt đơn đăng ký</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Round Info */}
          <div className="p-4 bg-muted/40 rounded-xl flex items-start gap-3">
            <Layers className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground block">Đợt đồ án:</span>
              <p className="font-semibold text-sm text-foreground">
                {round.round_name} ({round.round_code || `RD-${round.id}`})
              </p>
              <Badge variant="outline" className="text-[11px] mt-1">
                {round.thesis_types?.type_name || 'Khóa luận'}
              </Badge>
            </div>
          </div>

          {/* Instructor Info */}
          <div className="p-4 bg-muted/40 rounded-xl flex items-start gap-3">
            <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground block mb-1">Giảng viên hướng dẫn:</span>
              <div className="flex items-center gap-3">
                <Avatar name={selectedInstructorInfo?.name || 'GV'} size="md" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {selectedInstructorInfo?.name || 'Không rõ'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedInstructorInfo?.degree} • {selectedInstructorInfo?.department || 'Khoa CNTT'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Info */}
          <div className="p-4 bg-muted/40 rounded-xl flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-muted-foreground block">Đề tài đăng ký:</span>
                <Badge variant={topicMode === 'proposed' ? 'secondary' : 'outline'} className="text-[11px]">
                  {topicMode === 'proposed' ? 'Đề xuất từ GV' : 'Tự đề xuất'}
                </Badge>
              </div>
              <p className="font-semibold text-base text-foreground mb-1">{topicTitle}</p>
              {topicDescription && (
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {topicDescription}
                </p>
              )}
              {selectionReason && (
                <div className="mt-2 text-xs italic text-muted-foreground">
                  Lý do chọn: "{selectionReason}"
                </div>
              )}
            </div>
          </div>

          {/* Registration Mode Selection */}
          <div className="p-4 bg-card border border-border rounded-xl space-y-3">
            <span className="text-sm font-semibold text-foreground block">Hình thức thực hiện:</span>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="registrationMode"
                  value="individual"
                  checked={registrationMode === 'individual'}
                  onChange={() => onSetRegistrationMode('individual')}
                  className="text-primary focus:ring-primary"
                />
                <span>Cá nhân (1 sinh viên)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="registrationMode"
                  value="group"
                  checked={registrationMode === 'group'}
                  onChange={() => onSetRegistrationMode('group')}
                  className="text-primary focus:ring-primary"
                />
                <span>Theo nhóm sinh viên</span>
              </label>
            </div>

            {/* Select Group if Group Mode */}
            {registrationMode === 'group' && (
              <div className="pt-3 border-t border-border/60 space-y-2">
                <label className="text-xs font-medium text-foreground block">
                  Chọn nhóm đồ án của bạn: <span className="text-destructive">*</span>
                </label>
                {availableGroupsForRound.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                    Bạn chưa có nhóm nào trong đợt này. Vui lòng vào mục{' '}
                    <a href="/groups" className="underline font-semibold text-primary">
                      "Nhóm của tôi"
                    </a>{' '}
                    để tạo nhóm trước hoặc chuyển sang hình thức <strong>Cá nhân</strong>.
                  </div>
                ) : (
                  <select
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                    value={selectedGroupId || ''}
                    onChange={(e) => onSetSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Chọn nhóm đồ án --</option>
                    {availableGroupsForRound.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.group_name} ({grp.thesis_group_members?.length || 1} thành viên)
                      </option>
                    ))}
                  </select>
                )}

                {selectedGroup && (
                  <div className="p-2.5 bg-muted/60 rounded text-xs text-muted-foreground flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Nhóm: <strong>{selectedGroup.group_name}</strong> • Mã:{' '}
                      {selectedGroup.group_code || selectedGroup.id}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning Notice */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-semibold block mb-0.5">Lưu ý quan trọng:</span>
              Sau khi nộp đơn, thông tin đăng ký sẽ được gửi tới Giảng viên hướng dẫn thẩm định, sau đó trình Trưởng bộ môn phê duyệt. Bạn có thể theo dõi tiến độ xét duyệt trực tiếp tại bảng danh sách đợt đồ án.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={onPrev} disabled={submitting}>
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Quay lại bước 2
        </Button>
        <Button onClick={onSubmit} disabled={submitting || !canSubmit}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang gửi đơn đăng ký...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Xác nhận & Nộp đơn đăng ký
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
