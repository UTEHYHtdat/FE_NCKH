import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Filter, Clock, UserCheck, CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react';
import { gradeReviewService, instructorService, thesisRoundService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { GradeReview } from '@/types/api';

export function HeadGradeReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<GradeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRound, setSelectedRound] = useState('all');
  const [instructors, setInstructors] = useState<any[]>([]);

  // Modal assign instructor
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GradeReview | null>(null);
  const [assignedInstructorId, setAssignedInstructorId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Modal resolve review
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveStatus, setResolveStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [headFeedback, setHeadFeedback] = useState('');
  const [applyScore, setApplyScore] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, selectedRound, search]);

  const fetchInitialData = async () => {
    try {
      const [roundsData, instData] = await Promise.all([
        thesisRoundService.getThesisRounds().catch(() => []),
        instructorService.getInstructors().catch(() => [])
      ]);
      const rList = Array.isArray(roundsData) ? roundsData : (roundsData as any)?.data || [];
      const iList = Array.isArray(instData) ? instData : (instData as any)?.data || [];
      setRounds(Array.isArray(rList) ? rList : []);
      setInstructors(Array.isArray(iList) ? iList : []);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setRounds([]);
      setInstructors([]);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (selectedRound !== 'all') params.thesis_round_id = selectedRound;
      if (search) params.search = search;

      const data = await gradeReviewService.getAdminReviews(params);
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
      setReviews(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách phúc khảo');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedReview || !assignedInstructorId) {
      toast.error('Vui lòng chọn giảng viên chấm lại');
      return;
    }
    try {
      setAssigning(true);
      await gradeReviewService.assignInstructor(selectedReview.id, parseInt(assignedInstructorId));
      toast.success('Đã phân công giảng viên chấm lại thành công!');
      setAssignModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi phân công');
    } finally {
      setAssigning(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedReview) return;
    try {
      setResolving(true);
      await gradeReviewService.resolveReview(selectedReview.id, {
        status: resolveStatus,
        head_feedback: headFeedback,
        apply_score: applyScore
      });
      toast.success('Đã hoàn tất xử lý đơn phúc khảo!');
      setResolveModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xử lý đơn');
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Chờ tiếp nhận</Badge>;
      case 'ASSIGNED':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Đã gán GV</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Đã có điểm chấm lại</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Đã đổi điểm</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Giữ nguyên điểm</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageLayout
      userRole="head"
      userName={user?.fullName || 'Trưởng bộ môn'}
      title="Quản lý Phúc khảo Điểm"
      subtitle="Tiếp nhận, phân công cán bộ chấm lại và phê duyệt kết quả phúc khảo"
    >
      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Tìm mã SV, họ tên, tên đề tài..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="PENDING">Chờ tiếp nhận</option>
              <option value="ASSIGNED">Đã phân công GV</option>
              <option value="IN_REVIEW">Đã có điểm chấm lại</option>
              <option value="APPROVED">Đã cập nhật điểm</option>
              <option value="REJECTED">Giữ nguyên điểm</option>
            </select>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả đợt khóa luận</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>{r.round_name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Danh sách Đơn Phúc khảo ({reviews.length})</CardTitle>
          <CardDescription>Các yêu cầu phúc khảo điểm từ sinh viên trong đợt</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải danh sách...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Không có đơn phúc khảo nào phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Sinh viên</th>
                    <th className="p-3">Đề tài</th>
                    <th className="p-3">Loại điểm</th>
                    <th className="p-3">Điểm gốc</th>
                    <th className="p-3">Điểm chấm lại</th>
                    <th className="p-3">GV chấm lại</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">
                        <div className="font-semibold text-foreground">{rev.students?.users?.full_name}</div>
                        <div className="text-muted-foreground">{rev.students?.student_code} - {rev.students?.classes?.class_name}</div>
                      </td>
                      <td className="p-3 max-w-xs truncate" title={rev.theses?.topic_title}>
                        <div className="font-medium text-foreground truncate">{rev.theses?.topic_title}</div>
                        <div className="text-muted-foreground font-mono">{rev.theses?.thesis_code}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{rev.review_type}</Badge>
                      </td>
                      <td className="p-3 font-bold text-foreground">{rev.original_score}</td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                        {rev.reassessed_score !== null && rev.reassessed_score !== undefined ? rev.reassessed_score : '-'}
                      </td>
                      <td className="p-3">
                        {rev.instructors?.users?.full_name || <span className="text-muted-foreground italic">Chưa gán</span>}
                      </td>
                      <td className="p-3">{getStatusBadge(rev.status)}</td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {rev.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReview(rev);
                              setAssignedInstructorId(rev.reassigned_instructor_id?.toString() || '');
                              setAssignModalOpen(true);
                            }}
                            className="h-7 text-xs"
                          >
                            Phân công GV
                          </Button>
                        )}
                        {(rev.status === 'ASSIGNED' || rev.status === 'IN_REVIEW') && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedReview(rev);
                              setResolveStatus('APPROVED');
                              setHeadFeedback('');
                              setResolveModalOpen(true);
                            }}
                            className="h-7 text-xs"
                          >
                            Phê duyệt
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Assign Instructor */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Phân công Cán bộ Chấm lại</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Đề tài: <strong className="text-foreground">{selectedReview?.theses?.topic_title}</strong>
            </p>
            <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded">
              <strong>Lý do xin phúc khảo của SV:</strong> {selectedReview?.reason}
            </p>
            <div>
              <Label className="text-xs font-semibold">Chọn Giảng viên chấm lại *</Label>
              <select
                value={assignedInstructorId}
                onChange={(e) => setAssignedInstructorId(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Chọn giảng viên --</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.users?.full_name} ({ins.instructor_code}) - {ins.degree || 'GV'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>Hủy</Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Xác nhận phân công
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Resolve Review */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quyết định Phúc khảo Điểm</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded">
              <div>Điểm ban đầu: <strong>{selectedReview?.original_score}</strong></div>
              <div>Điểm chấm lại: <strong className="text-blue-600">{selectedReview?.reassessed_score !== null ? selectedReview?.reassessed_score : 'Chưa có'}</strong></div>
            </div>
            {selectedReview?.reassessment_notes && (
              <p className="text-xs text-muted-foreground bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded border border-blue-200/40">
                <strong>Ý kiến GV chấm lại:</strong> {selectedReview.reassessment_notes}
              </p>
            )}
            <div>
              <Label className="text-xs font-semibold">Quyết định của Trưởng BM *</Label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value as any)}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="APPROVED">Chấp thuận (Cập nhật điểm mới)</option>
                <option value="REJECTED">Bác bỏ (Giữ nguyên điểm gốc)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Nhận xét / Kết luận của Trưởng BM</Label>
              <Textarea
                rows={3}
                placeholder="Ghi nhận kết quả chấm lại và thông báo tới sinh viên..."
                value={headFeedback}
                onChange={(e) => setHeadFeedback(e.target.value)}
                className="mt-1.5 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolveModalOpen(false)}>Hủy</Button>
            <Button onClick={handleResolve} disabled={resolving}>
              {resolving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Lưu quyết định
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
