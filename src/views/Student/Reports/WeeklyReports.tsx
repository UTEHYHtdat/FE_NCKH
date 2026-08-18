import { useEffect, useState } from 'react';
import {
  Plus,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { reportService, thesisRoundsService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';

export function WeeklyReports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    weekNumber: '',
    workCompleted: '',
    resultsAchieved: '',
    difficultiesEncountered: '',
    nextWeekPlan: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thesisId, setThesisId] = useState<number | null>(null);
  const [thesisRounds, setThesisRounds] = useState<any[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [roundsRes, regsRes] = await Promise.all([
          thesisRoundsService.getThesisRoundsForStudent(),
          // Import topicRegistrationService at the top
          import('@/plugins/api').then((s) =>
            s.topicRegistrationService.getTopicRegistrations(),
          ),
        ]);

        const rounds = roundsRes.success ? roundsRes.data : [];
        const ongoingRounds = rounds.filter(
          (r: any) =>
            r.status?.toUpperCase() === 'ONGOING' ||
            r.status?.toUpperCase() === 'IN PROGRESS',
        );

        const approvedReg = (regsRes || []).find(
          (r: any) =>
            r.instructor_status === 'APPROVED' && r.head_status === 'APPROVED',
        );

        if (approvedReg) {
          const approvedRound = rounds.find(
            (r: any) => r.id === approvedReg.thesis_round_id,
          );
          if (approvedRound) {
            setThesisRounds([approvedRound]);
            setSelectedRound(approvedRound.id);
          } else {
            setThesisRounds(ongoingRounds);
            if (ongoingRounds.length > 0 && !selectedRound) {
              setSelectedRound(ongoingRounds[0].id);
            }
          }
        } else {
          setThesisRounds(ongoingRounds);
          if (ongoingRounds.length > 0 && !selectedRound) {
            setSelectedRound(ongoingRounds[0].id);
          }
        }

        setRegistrations(regsRes || []);
      } catch (error) {
        console.error('Error fetching init data:', error);
      }
    };

    fetchInitData();
  }, []);

  useEffect(() => {
    if (selectedRound && registrations.length > 0) {
      // Find the registration for the selected round
      const reg = registrations.find(
        (r) => r.thesis_round_id === selectedRound,
      );
      if (reg && reg.theses?.id) {
        setThesisId(reg.theses.id);
      } else {
        setThesisId(null);
      }
    }
  }, [selectedRound, registrations]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedRound || !thesisId) {
        setReports([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await reportService.getThesisWeeklyReports(thesisId);
        setReports(
          Array.isArray(response) ? response : (response as any)?.data || [],
        );
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [thesisId, selectedRound]);

  const handleSubmitReport = async () => {
    if (!thesisId) {
      console.error('Không tìm thấy đồ án để nộp báo cáo');
      return;
    }

    try {
      setIsSubmitting(true);

      let attachmentUrl = '';
      if (selectedFile) {
        const uploadRes = await reportService.uploadAttachment(selectedFile);
        attachmentUrl = uploadRes.url;
      }

      await reportService.submitWeeklyReport(thesisId, {
        weekNumber: parseInt(reportForm.weekNumber),
        workCompleted: reportForm.workCompleted,
        resultsAchieved: reportForm.resultsAchieved,
        difficultiesEncountered: reportForm.difficultiesEncountered,
        nextWeekPlan: reportForm.nextWeekPlan,
        attachmentFile: attachmentUrl,
        studentId: user?.id || 1,
        contributions: [],
      });

      // Refresh reports
      const response = await reportService.getThesisWeeklyReports(thesisId);
      setReports(
        Array.isArray(response) ? response : (response as any)?.data || [],
      );

      // Reset form and close dialog
      setReportForm({
        weekNumber: '',
        workCompleted: '',
        resultsAchieved: '',
        difficultiesEncountered: '',
        nextWeekPlan: '',
      });
      setSelectedFile(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout
        userRole="student"
        userName="Nguyễn Văn A"
        title="Báo cáo tuần"
        subtitle="Quản lý và theo dõi báo cáo tiến độ tuần"
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo báo cáo mới
          </Button>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      userRole="student"
      userName="Nguyễn Văn A"
      title="Báo cáo tuần"
      subtitle="Quản lý và theo dõi báo cáo tiến độ tuần"
    >
      <div className="grid grid-cols-1 gap-6">
        {!selectedRound ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Vui lòng chọn đợt khóa luận
              </h3>
              <p className="text-muted-foreground">
                Chọn một đợt khóa luận để xem báo cáo tuần
              </p>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Chưa có báo cáo nào
              </h3>
              <p className="text-muted-foreground mb-4">
                Bắt đầu tạo báo cáo tuần đầu tiên của bạn
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                disabled={!thesisId}
                title={
                  !thesisId ? 'Bạn chưa được phân công đồ án trong đợt này' : ''
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo báo cáo đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Báo cáo tuần {report.week_number}</CardTitle>
                    <CardDescription>
                      Nộp ngày:{' '}
                      {new Date(report.report_date).toLocaleDateString('vi-VN')}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(report.instructor_status)}
                  >
                    {report.instructor_status === 'APPROVED'
                      ? 'Đã duyệt'
                      : report.instructor_status === 'PENDING'
                        ? 'Chờ đánh giá'
                        : report.instructor_status === 'REJECTED'
                          ? 'Bị từ chối'
                          : 'Cần sửa đổi'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Công việc đã hoàn thành
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {report.work_completed}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        Kết quả đạt được
                      </h4>
                      <p className="text-sm text-green-700">
                        {report.results_achieved}
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-800">
                        <AlertCircle className="w-4 h-4" />
                        Khó khăn gặp phải
                      </h4>
                      <p className="text-sm text-amber-700">
                        {report.difficulties_encountered}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-blue-800">
                      <Calendar className="w-4 h-4" />
                      Kế hoạch tuần sau
                    </h4>
                    <p className="text-sm text-blue-700">
                      {report.next_week_plan}
                    </p>
                  </div>

                  {report.attachment_file && (
                    <div className="flex items-center gap-2 mt-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`http://localhost:8002${report.attachment_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Tải file đính kèm
                      </a>
                    </div>
                  )}

                  {(report.instructor_feedback ||
                    report.weekly_score != null) && (
                    <div className="p-4 bg-muted rounded-lg border mt-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Nhận xét của giảng viên
                      </h4>
                      {report.instructor_feedback && (
                        <p className="text-sm text-muted-foreground">
                          {report.instructor_feedback}
                        </p>
                      )}
                      {report.weekly_score != null && (
                        <p className="text-sm font-semibold mt-2">
                          Điểm: {report.weekly_score}/10
                        </p>
                      )}
                      {report.feedback_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Đánh giá ngày:{' '}
                          {new Date(report.feedback_date).toLocaleDateString(
                            'vi-VN',
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tạo báo cáo tuần mới</DialogTitle>
            <DialogDescription>
              Cập nhật tiến độ và kết quả làm việc trong tuần
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weekNumber" className="text-right">
                Tuần thứ
              </Label>
              <Input
                id="weekNumber"
                type="number"
                value={reportForm.weekNumber}
                onChange={(e) =>
                  setReportForm({ ...reportForm, weekNumber: e.target.value })
                }
                className="col-span-3"
                placeholder="1"
                min="1"
                max="15"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="workCompleted" className="text-right pt-2">
                Công việc đã hoàn thành
              </Label>
              <Textarea
                id="workCompleted"
                value={reportForm.workCompleted}
                onChange={(e) =>
                  setReportForm({
                    ...reportForm,
                    workCompleted: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Mô tả công việc đã thực hiện..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="resultsAchieved" className="text-right pt-2">
                Kết quả đạt được
              </Label>
              <Textarea
                id="resultsAchieved"
                value={reportForm.resultsAchieved}
                onChange={(e) =>
                  setReportForm({
                    ...reportForm,
                    resultsAchieved: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Các kết quả đã đạt được..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label
                htmlFor="difficultiesEncountered"
                className="text-right pt-2"
              >
                Khó khăn gặp phải
              </Label>
              <Textarea
                id="difficultiesEncountered"
                value={reportForm.difficultiesEncountered}
                onChange={(e) =>
                  setReportForm({
                    ...reportForm,
                    difficultiesEncountered: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Các vấn đề gặp phải..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="nextWeekPlan" className="text-right pt-2">
                Kế hoạch tuần sau
              </Label>
              <Textarea
                id="nextWeekPlan"
                value={reportForm.nextWeekPlan}
                onChange={(e) =>
                  setReportForm({ ...reportForm, nextWeekPlan: e.target.value })
                }
                className="col-span-3"
                placeholder="Kế hoạch cho tuần tới..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="attachmentFile" className="text-right">
                File đính kèm
              </Label>
              <Input
                id="attachmentFile"
                type="file"
                onChange={(e) =>
                  setSelectedFile(e.target.files ? e.target.files[0] : null)
                }
                className="col-span-3"
                accept=".pdf,.doc,.docx,.zip,.rar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmitReport} disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
