import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  X, 
  Eye, 
  Bell, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { topicRegistrationService, reviewScheduleService, thesisRoundsService } from '@/plugins/api';
import { translateStatus, getStatusBadgeVariant } from '@/helpers/constant';
import { useAuth } from '@/contexts/AuthContext';
import type { TopicRegistration } from '@/types/api';

export function HeadDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTopics: 0,
    inProgress: 0,
    completed: 0,
    passRate: 0,
  });
  const [pendingTopics, setPendingTopics] = useState<any[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<TopicRegistration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Get topic registrations pending head approval
      try {
        const registrations = await topicRegistrationService.getPendingRegistrationsForHead(user?.departmentId || user?.id || 0);
        setPendingTopics(registrations.map((reg: any) => ({
          id: reg.id,
          code: reg.thesis_rounds?.round_name || 'N/A',
          title: reg.proposed_topics?.topic_title || reg.self_proposed_title,
          supervisor: reg.instructors?.users?.full_name || '',
          student: reg.thesis_groups?.thesis_group_members?.[0]?.students?.users?.full_name || 'Unknown',
          studentCode: reg.thesis_groups?.thesis_group_members?.[0]?.students?.student_code || '',
          className: reg.thesis_groups?.thesis_group_members?.[0]?.students?.classes?.class_name || '',
          topicCode: reg.proposed_topics?.topic_code || '',
          topicDescription: reg.proposed_topics?.topic_description || reg.self_proposed_description || '',
          fullData: reg,
        })));
      } catch (err) {
        console.error('Error fetching pending topics:', err);
      }

      // 2. Get thesis rounds & scheduled reviews
      try {
        const roundsResponse = await thesisRoundsService.getThesisRoundsForHead();
        const rounds = Array.isArray(roundsResponse) ? roundsResponse : (roundsResponse as any).data || [];
        const activeRounds = rounds.filter((r: any) => r.status?.toUpperCase() === 'ACTIVE');
        const targetRounds = activeRounds.length > 0 ? activeRounds : rounds.slice(0, 1);

        let allScheduledList: any[] = [];
        let totalThesesCount = 0;
        let scheduledCount = 0;

        for (const round of targetRounds) {
          try {
            const [theses, schedules] = await Promise.all([
              reviewScheduleService.getThesesByRound(round.id),
              reviewScheduleService.getReviewSchedules({ thesis_round_id: round.id }),
            ]);

            totalThesesCount += theses.length;

            const validSchedules = schedules.filter(
              (s: any) => s.hasSchedule || (s.scheduledDate && s.scheduledDate !== '') || s.reviewer1
            );
            scheduledCount += validSchedules.length;

            validSchedules.forEach((s: any) => {
              allScheduledList.push({
                ...s,
                roundName: round.round_name,
              });
            });
          } catch (err) {
            console.error('Error fetching round schedules for dashboard:', err);
          }
        }

        // Sort upcoming schedules by scheduledDate
        allScheduledList.sort((a, b) => {
          if (!a.scheduledDate) return 1;
          if (!b.scheduledDate) return -1;
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        });

        setUpcomingSchedules(allScheduledList);

        const inProgressCount = Math.max(0, totalThesesCount - scheduledCount);
        const rate = totalThesesCount > 0 ? Math.round((scheduledCount / totalThesesCount) * 100) : 0;

        setStats({
          totalTopics: totalThesesCount,
          inProgress: inProgressCount,
          completed: scheduledCount,
          passRate: rate,
        });
      } catch (err) {
        console.error('Error fetching thesis rounds:', err);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAndApprove = (item: any) => {
    setSelectedRegistration(item.fullData);
    setApprovalStatus('APPROVED');
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRegistration(null);
    setApprovalStatus('APPROVED');
    setRejectionReason('');
  };

  const handleSubmitApproval = async () => {
    if (!selectedRegistration) return;

    try {
      setIsSubmitting(true);
      await topicRegistrationService.headApproveRegistration(selectedRegistration.id, {
        status: approvalStatus,
        rejection_reason: rejectionReason,
      });

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Có lỗi xảy ra khi duyệt đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'PGS. TS. Nguyễn Văn A'}
      title="Dashboard Trưởng Bộ Môn"
      subtitle="Tổng quan quản lý đợt khóa luận và lịch phản biện"
      actions={
        <Button variant="outline" size="icon" className="relative" title="Thông báo">
          <Bell className="w-4 h-4" />
          {pendingTopics.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {pendingTopics.length}
            </span>
          )}
        </Button>
      }
    >
      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.totalTopics}</h3>
            <p className="text-sm text-muted-foreground">Tổng đề tài</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.inProgress}</h3>
            <p className="text-sm text-muted-foreground">Chưa xếp lịch</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.completed}</h3>
            <p className="text-sm text-muted-foreground">Đã xếp lịch phản biện</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.passRate}%</h3>
            <p className="text-sm text-muted-foreground">Tỷ lệ đã xếp lịch</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Đề tài chờ duyệt */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Đề tài chờ duyệt</CardTitle>
                <CardDescription>Đề tài cần phê duyệt cuối cùng</CardDescription>
              </div>
              <Badge variant="amber">{pendingTopics.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {pendingTopics.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-60" />
                <p className="font-medium text-foreground">Không có đề tài nào cần duyệt</p>
                <p className="text-xs mt-1">Tất cả đề tài đăng ký đã được xử lý.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mã</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Đề tài</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">GVHD</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTopics.map((topic, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium">{topic.code}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-sm line-clamp-1">{topic.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{topic.student}</p>
                        </td>
                        <td className="py-3 px-4 text-sm">{topic.supervisor}</td>
                        <td className="py-3 px-4 text-right">
                          <Button size="icon" variant="ghost" onClick={() => handleViewAndApprove(topic)} title="Xem chi tiết">
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Card: Lịch phản biện đã sắp xếp */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lịch phản biện đã sắp xếp</CardTitle>
                <CardDescription>Các ca phản biện khóa luận trong đợt</CardDescription>
              </div>
              <Badge variant="blue">{upcomingSchedules.length} ca lịch</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            {upcomingSchedules.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground my-auto">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-foreground">Chưa có lịch phản biện nào được xếp</p>
                <p className="text-xs mt-1 mb-4">Các ca phản biện sau khi được xếp sẽ tự động hiển thị ở đây.</p>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/review-schedule')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Xếp lịch phản biện ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.slice(0, 5).map((item, index) => (
                  <div 
                    key={index} 
                    className="p-3.5 rounded-lg border border-border/70 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">{item.thesisTitle}</h4>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.thesisCode} • {item.groupName}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(item.status)} className="shrink-0 text-[11px]">
                        {translateStatus(item.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium text-foreground">
                          {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('vi-VN') : 'Chưa xếp ngày'}
                        </span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{item.scheduledTime || '08:00'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{item.location || 'Phòng phản biện A'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground mt-1.5 pt-1">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>GV phản biện: <strong className="text-foreground font-medium">{item.reviewer1 || 'Chưa phân công'}</strong></span>
                      </div>
                      {item.students && item.students.length > 0 && (
                        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {item.students.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2 text-blue-600 border-blue-600/30 hover:bg-blue-50"
                  onClick={() => navigate('/review-schedule')}
                >
                  Xem tất cả và quản lý lịch
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Modal */}
      {isModalOpen && selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Duyệt Đăng ký Đề tài</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Thông tin sinh viên</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  {selectedRegistration.thesis_groups?.thesis_group_members?.map((member: any, index: number) => (
                    <div key={index} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p><span className="font-medium">Họ tên:</span> {member.students?.users?.full_name}</p>
                        <p><span className="font-medium">Mã SV:</span> {member.students?.student_code}</p>
                        <p><span className="font-medium">Lớp:</span> {member.students?.classes?.class_name}</p>
                        <p><span className="font-medium">Vai trò:</span> {member.role === 'LEADER' ? 'Nhóm trưởng' : 'Thành viên'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Thông tin đề tài</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Mã đề tài:</span> {selectedRegistration.proposed_topics?.topic_code || 'N/A'}</p>
                  <p><span className="font-medium">Tên đề tài:</span> {selectedRegistration.proposed_topics?.topic_title || selectedRegistration.self_proposed_title}</p>
                  <p><span className="font-medium">Mô tả:</span> {selectedRegistration.proposed_topics?.topic_description || selectedRegistration.self_proposed_description || 'N/A'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Thông tin giảng viên hướng dẫn</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Họ tên:</span> {selectedRegistration.instructors?.users?.full_name}</p>
                  <p><span className="font-medium">Mã GV:</span> {selectedRegistration.instructors?.instructor_code}</p>
                  <p><span className="font-medium">Email:</span> {selectedRegistration.instructors?.users?.email}</p>
                  <p><span className="font-medium">Bộ môn:</span> {selectedRegistration.instructors?.departments?.department_name}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Quyết định</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="approvalStatus"
                        value="APPROVED"
                        checked={approvalStatus === 'APPROVED'}
                        onChange={(e) => setApprovalStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                        className="w-4 h-4"
                      />
                      <span>Duyệt</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="approvalStatus"
                        value="REJECTED"
                        checked={approvalStatus === 'REJECTED'}
                        onChange={(e) => setApprovalStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                        className="w-4 h-4"
                      />
                      <span>Từ chối</span>
                    </label>
                  </div>
                  {approvalStatus === 'REJECTED' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Lý do từ chối:</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Nhập lý do từ chối..."
                        className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button onClick={handleSubmitApproval} disabled={isSubmitting || (approvalStatus === 'REJECTED' && !rejectionReason.trim())}>
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
