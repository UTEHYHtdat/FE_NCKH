import { Users, UserPlus, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import type { ThesisGroup } from '@/types/api';

interface MyGroupTabProps {
  myGroup: ThesisGroup | null;
  currentUserId?: number;
  isSubmitting: boolean;
  onOpenCreateModal: () => void;
  onOpenInviteModal: () => void;
  onLeaveGroup: () => Promise<void>;
  onDissolveGroup: () => Promise<void>;
  onSwitchToFindGroup?: () => void;
}

export function MyGroupTab({
  myGroup,
  currentUserId,
  isSubmitting,
  onOpenCreateModal,
  onOpenInviteModal,
  onLeaveGroup,
  onDissolveGroup,
  onSwitchToFindGroup,
}: MyGroupTabProps) {
  if (!myGroup) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Chưa có nhóm</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Bạn chưa tham gia nhóm nào. Hãy tạo nhóm mới hoặc tìm kiếm nhóm đang hình thành để cùng tham gia làm đồ án.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onOpenCreateModal}>
              <Plus className="w-4 h-4 mr-1.5" />
              Tạo nhóm mới
            </Button>
            {onSwitchToFindGroup && (
              <Button variant="outline" onClick={onSwitchToFindGroup}>
                Tìm nhóm để tham gia
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const memberCount = myGroup.thesis_group_members?.length || 0;
  const maxMembers = myGroup.max_members || 1;
  const percentFull = Math.min(100, Math.round((memberCount / maxMembers) * 100));
  const isLeader = myGroup.thesis_group_members?.find(
    (m: any) => m.students?.users?.id === currentUserId || m.student_id === currentUserId
  )?.role === 'LEADER';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{myGroup.group_name}</CardTitle>
              <CardDescription className="mt-1">
                Mã nhóm: <span className="font-mono text-foreground font-medium">{myGroup.group_code || myGroup.id}</span>
              </CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(myGroup.status)}>
              {myGroup.status === 'FORMING' ? 'Đang hình thành' : myGroup.status === 'ACTIVE' ? 'Đã chốt danh sách' : myGroup.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar of members */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Số lượng thành viên</span>
              <span className="text-sm font-medium">
                {memberCount}/{maxMembers} thành viên
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${percentFull}%` }}
              />
            </div>
          </div>

          {/* Member list */}
          <div className="space-y-3 mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Thành viên trong nhóm
            </div>
            {myGroup.thesis_group_members?.map((member: any) => {
              const fullName = member.students?.users?.full_name || member.students?.full_name || 'Không rõ tên';
              const studentCode = member.students?.student_code || '';
              const isMemberLeader = member.role === 'LEADER';

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <Avatar name={fullName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{fullName}</p>
                    {studentCode && (
                      <p className="text-xs text-muted-foreground">MSSV: {studentCode}</p>
                    )}
                  </div>
                  {isMemberLeader ? (
                    <Badge variant="default" className="text-xs">
                      Trưởng nhóm
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Thành viên
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            {memberCount < maxMembers && (
              <Button
                className="flex-1 min-w-[160px]"
                onClick={onOpenInviteModal}
                disabled={isSubmitting}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Mời thành viên
              </Button>
            )}

            {isLeader ? (
              <Button
                variant="destructive"
                className="flex-1 min-w-[160px]"
                onClick={onDissolveGroup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Giải tán nhóm'
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="flex-1 min-w-[160px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onLeaveGroup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Rời nhóm'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
