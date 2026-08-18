import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, Loader2, Download } from 'lucide-react';
import { gradeReviewService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { GradeReview } from '@/types/api';

export function InstructorGradeReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<GradeReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal reassess
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GradeReview | null>(null);
  const [reassessedScore, setReassessedScore] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await gradeReviewService.getInstructorReviews();
      setReviews(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách bài chấm phúc khảo');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReassess = async () => {
    if (!selectedReview) return;
    const scoreNum = parseFloat(reassessedScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      toast.error('Vui lòng nhập điểm chấm lại hợp lệ (0 - 10)');
      return;
    }

    try {
      setSaving(true);
      await gradeReviewService.reassessReview(selectedReview.id, {
        reassessed_score: scoreNum,
        reassessment_notes: notes
      });
      toast.success('Đã lưu kết quả chấm phúc khảo!');
      setModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu điểm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout
      userRole="instructor"
      userName={user?.fullName || 'Giảng viên'}
      title="Nhiệm vụ Chấm Phúc khảo"
      subtitle="Danh sách các đề tài khóa luận bạn được phân công chấm lại độc lập"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Danh sách Đơn Chấm Phúc khảo ({reviews.length})</CardTitle>
          <CardDescription>Vui lòng đọc kỹ báo cáo và giải trình của sinh viên trước khi nhập điểm chấm lại</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Bạn hiện không có đơn phúc khảo nào cần chấm lại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Sinh viên</th>
                    <th className="p-3">Đề tài khóa luận</th>
                    <th className="p-3">Loại điểm</th>
                    <th className="p-3">Điểm gốc</th>
                    <th className="p-3">Điểm chấm lại</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">
                        <div className="font-semibold text-foreground">{rev.students?.users?.full_name}</div>
                        <div className="text-muted-foreground">{rev.students?.classes?.class_name}</div>
                      </td>
                      <td className="p-3 max-w-sm">
                        <div className="font-medium text-foreground">{rev.theses?.topic_title}</div>
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
                        {rev.status === 'ASSIGNED' ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">Chờ chấm lại</Badge>
                        ) : rev.status === 'IN_REVIEW' ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">Đã gửi điểm</Badge>
                        ) : (
                          <Badge variant="outline">{rev.status}</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {rev.theses?.final_report_file && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(rev.theses?.final_report_file, '_blank')}
                            className="h-7 text-xs gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Báo cáo
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedReview(rev);
                            setReassessedScore(rev.reassessed_score?.toString() || '');
                            setNotes(rev.reassessment_notes || '');
                            setModalOpen(true);
                          }}
                          className="h-7 text-xs"
                        >
                          Chấm điểm lại
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

      {/* Modal Chấm lại */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nhập Kết quả Chấm Phúc khảo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Đề tài: <strong className="text-foreground">{selectedReview?.theses?.topic_title}</strong>
            </p>
            <div className="p-2.5 rounded bg-muted/40 text-xs text-muted-foreground">
              <strong>Lý do giải trình của SV:</strong> {selectedReview?.reason}
            </div>
            <div>
              <Label className="text-xs font-semibold">Điểm chấm lại (thang 10) *</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="VD: 8.5"
                value={reassessedScore}
                onChange={(e) => setReassessedScore(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Nhận xét & Đánh giá của cán bộ chấm lại</Label>
              <Textarea
                rows={3}
                placeholder="Nêu rõ lý do thay đổi hoặc giữ nguyên điểm so với kết quả ban đầu..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveReassess} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Lưu kết quả chấm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
