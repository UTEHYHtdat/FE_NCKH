import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { thesisGroupsService, thesisRoundsService } from '@/plugins/api';
import type { ThesisGroup, GroupInvitation, ThesisRound } from '@/types/api';
import {
  MyGroupTab,
  InvitationsTab,
  FindGroupTab,
  ModalCreateGroup,
  ModalInviteMember,
  type CreateGroupFormData,
} from './components';

export function GroupManagement() {
  const { user, profile } = useAuth();
  const userRole = user?.role || 'student';

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>('my-group');

  // Modals state
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myGroup, setMyGroup] = useState<ThesisGroup | null>(null);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [availableGroups, setAvailableGroups] = useState<ThesisGroup[]>([]);
  const [thesisRounds, setThesisRounds] = useState<ThesisRound[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Profile info for class-scoped invitation
  const studentInfo = (profile as any)?.student || (user as any)?.student;
  const studentClassId = studentInfo?.class_id || (user as any)?.class_id;
  const studentClassName = studentInfo?.classes?.class_name || profile?.className || (user as any)?.className;
  const studentClassCode = studentInfo?.classes?.class_code;
  const currentStudentId = studentInfo?.id || profile?.id || user?.id;

  // Existing member student IDs in my group
  const existingMemberStudentIds = (myGroup?.thesis_group_members || []).map(
    (m: any) => m.student_id || m.students?.id
  ).filter(Boolean);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Fetch thesis rounds when create modal is opened
  useEffect(() => {
    if (isCreateGroupModalOpen && thesisRounds.length === 0) {
      fetchThesisRounds();
    }
  }, [isCreateGroupModalOpen]);

  const fetchThesisRounds = async () => {
    try {
      const response = await thesisRoundsService.getThesisRoundsForStudent();
      setThesisRounds(response.data || []);
    } catch (e) {
      console.error('Error fetching thesis rounds:', e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('Không tìm thấy thông tin sinh viên');
        return;
      }

      // 1. Fetch my group
      try {
        const groups = await thesisGroupsService.getThesisGroups(user.id);
        if (groups && groups.length > 0) {
          setMyGroup(groups[0]);
        } else {
          setMyGroup(null);
        }
      } catch (e) {
        console.error('Error fetching my group:', e);
      }

      // 2. Fetch invitations
      try {
        const invs = await thesisGroupsService.getInvitations(user.id);
        setInvitations(invs.filter((inv) => inv.status === 'PENDING'));
      } catch (e) {
        console.error('Error fetching invitations:', e);
      }

      // 3. Fetch available groups
      try {
        const allGroups = await thesisGroupsService.getThesisGroups();
        setAvailableGroups(
          allGroups.filter(
            (g) =>
              g.status === 'FORMING' &&
              g.thesis_group_members &&
              g.thesis_group_members.length < g.max_members
          )
        );
      } catch (e) {
        console.error('Error fetching available groups:', e);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Create Group
  const handleCreateGroup = async (formData: CreateGroupFormData) => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await thesisGroupsService.createThesisGroup({
        group_name: formData.group_name,
        thesis_round_id: parseInt(formData.thesis_round_id),
        group_type: formData.group_type as any,
        min_members: formData.min_members,
        max_members: formData.max_members,
        student_id: user.id,
      });

      setIsCreateGroupModalOpen(false);
      await fetchData();
    } catch (e: any) {
      console.error('Error creating group:', e);
      setError(e.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Send Class-scoped Invitations
  const handleSendInvitation = async (invitedStudentIds: string[], message: string) => {
    if (!user?.id || !myGroup || invitedStudentIds.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);

      for (const studentId of invitedStudentIds) {
        await thesisGroupsService.createGroupInvitation({
          thesis_group_id: myGroup.id,
          invited_student_id: parseInt(studentId),
          invitation_message: message,
          student_id: user.id,
        });
      }

      setIsInviteMemberModalOpen(false);
      await fetchData();
    } catch (e: any) {
      console.error('Error sending invitation:', e);
      setError(e.message || 'Không thể gửi lời mời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Accept Invitation
  const handleAcceptInvitation = async (invitationId: number) => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await thesisGroupsService.acceptInvitation(invitationId, user.id);
      await fetchData();
    } catch (e: any) {
      console.error('Error accepting invitation:', e);
      setError(e.message || 'Không thể chấp nhận lời mời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Reject Invitation
  const handleRejectInvitation = async (invitationId: number) => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await thesisGroupsService.rejectInvitation(invitationId, user.id);
      await fetchData();
    } catch (e: any) {
      console.error('Error rejecting invitation:', e);
      setError(e.message || 'Không thể từ chối lời mời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Leave Group
  const handleLeaveGroup = async () => {
    if (!user?.id || !myGroup) return;

    if (!window.confirm('Bạn có chắc chắn muốn rời nhóm này?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await thesisGroupsService.leaveGroup(user.id, myGroup.id);
      await fetchData();
    } catch (e: any) {
      console.error('Error leaving group:', e);
      setError(e.message || 'Không thể rời nhóm. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Dissolve Group
  const handleDissolveGroup = async () => {
    if (!user?.id || !myGroup) return;

    if (!window.confirm('Bạn có chắc chắn muốn giải tán nhóm này? Toàn bộ thành viên sẽ rời nhóm và hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await thesisGroupsService.dissolveThesisGroup(myGroup.id, user.id);
      await fetchData();
    } catch (e: any) {
      console.error('Error dissolving group:', e);
      setError(e.message || 'Không thể giải tán nhóm. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout
        userRole={userRole as any}
        userName={user?.fullName || 'Sinh viên'}
        title="Quản lý nhóm"
        subtitle={userRole === 'admin' ? 'Quản lý tổ chức và nhóm trong hệ thống' : 'Quản lý nhóm khóa luận của bạn'}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'Sinh viên'}
      title="Quản lý nhóm"
      subtitle={userRole === 'admin' ? 'Quản lý tổ chức và nhóm trong hệ thống' : 'Quản lý nhóm khóa luận của bạn'}
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Đóng
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="my-group">Nhóm của tôi</TabsTrigger>
            <TabsTrigger value="invitations">
              Lời mời
              {invitations.length > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                  {invitations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="find-group">Tìm nhóm</TabsTrigger>
          </TabsList>

          {!myGroup && (
            <Button onClick={() => setIsCreateGroupModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Tạo nhóm mới
            </Button>
          )}
        </div>

        {/* Tab 1: Nhóm của tôi */}
        <TabsContent value="my-group" className="mt-0">
          <MyGroupTab
            myGroup={myGroup}
            currentUserId={user?.id}
            isSubmitting={isSubmitting}
            onOpenCreateModal={() => setIsCreateGroupModalOpen(true)}
            onOpenInviteModal={() => setIsInviteMemberModalOpen(true)}
            onLeaveGroup={handleLeaveGroup}
            onDissolveGroup={handleDissolveGroup}
            onSwitchToFindGroup={() => setActiveTab('find-group')}
          />
        </TabsContent>

        {/* Tab 2: Lời mời tham gia */}
        <TabsContent value="invitations" className="mt-0">
          <InvitationsTab
            invitations={invitations}
            isSubmitting={isSubmitting}
            onAccept={handleAcceptInvitation}
            onReject={handleRejectInvitation}
          />
        </TabsContent>

        {/* Tab 3: Tìm kiếm nhóm */}
        <TabsContent value="find-group" className="mt-0">
          <FindGroupTab
            availableGroups={availableGroups}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Tạo nhóm mới */}
      <ModalCreateGroup
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSubmit={handleCreateGroup}
        thesisRounds={thesisRounds}
        isSubmitting={isSubmitting}
      />

      {/* Modal Mời thành viên (Chỉ trong lớp) */}
      <ModalInviteMember
        isOpen={isInviteMemberModalOpen}
        onClose={() => setIsInviteMemberModalOpen(false)}
        onSendInvitation={handleSendInvitation}
        isSubmitting={isSubmitting}
        currentStudentId={currentStudentId}
        currentUserId={user?.id}
        existingMemberStudentIds={existingMemberStudentIds}
        studentClassId={studentClassId}
        studentClassName={studentClassName}
        studentClassCode={studentClassCode}
      />
    </PageLayout>
  );
}
