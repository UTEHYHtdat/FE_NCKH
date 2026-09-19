import { Mail, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GroupInvitation } from '@/types/api';

interface InvitationsTabProps {
  invitations: GroupInvitation[];
  isSubmitting: boolean;
  onAccept: (invitationId: number) => Promise<void>;
  onReject: (invitationId: number) => Promise<void>;
}

export function InvitationsTab({
  invitations,
  isSubmitting,
  onAccept,
  onReject,
}: InvitationsTabProps) {
  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Không có lời mời nào</h3>
          <p className="text-muted-foreground text-sm">
            Hiện tại bạn chưa nhận được lời mời tham gia nhóm nào.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => {
        const groupName = invitation.thesis_groups?.group_name || 'Nhóm đồ án';
        const groupCode = invitation.thesis_groups?.group_code || invitation.thesis_group_id;
        const inviterName = invitation.students_invited_by?.users?.full_name || 'Một sinh viên';

        return (
          <Card key={invitation.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">{groupName}</h4>
                      <Badge variant="outline" className="text-xs">
                        Mã: {groupCode}
                      </Badge>
                    </div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Người mời:</span>{' '}
                      <span className="font-medium text-foreground">{inviterName}</span>
                    </p>
                    {invitation.invitation_message && (
                      <p className="text-sm italic text-muted-foreground bg-muted/40 p-2.5 rounded-md border border-border/50 mt-1">
                        "{invitation.invitation_message}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground pt-1">
                      Trạng thái: <span className="text-primary font-medium">Đang chờ bạn phản hồi</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                  <Button
                    size="sm"
                    onClick={() => onAccept(invitation.id)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Chấp nhận
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(invitation.id)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-1.5" />
                        Từ chối
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
