import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, UploadCloud, Clock, CheckCircle, XCircle } from 'lucide-react';
import { gradeReviewService } from '@/plugins/api';
import type { GradeReview, GradeReviewType } from '@/types/api';

interface ModalGradeReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thesisId: number;
  topicTitle: string;
  defaultReviewType?: GradeReviewType;
  defaultOriginalScore?: number;
}

export const ModalGradeReview: React.FC<ModalGradeReviewProps> = ({
  open,
  onOpenChange,
  thesisId,
  topicTitle,
  defaultReviewType = 'DEFENSE',
  defaultOriginalScore = 0
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [reviewType, setReviewType] = useState<GradeReviewType>(defaultReviewType);
  const [originalScore, setOriginalScore] = useState<number>(defaultOriginalScore);
  const [desiredScore, setDesiredScore] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<GradeReview[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    setReviewType(defaultReviewType);
    setOriginalScore(defaultOriginalScore);
  }, [defaultReviewType, defaultOriginalScore]);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await gradeReviewService.getStudentReviews();
      setHistory(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do xin phúc khảo');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('thesis_id', thesisId.toString());
      formData.append('review_type', reviewType);
      formData.append('original_score', originalScore.toString());
      if (desiredScore) formData.append('desired_score', desiredScore);
      formData.append('reason', reason);
      if (file) formData.append('attachment_file', file);

      await gradeReviewService.createReview(formData);
      toast.success('Đã gửi đơn phúc khảo điểm thành công!');
      setReason('');
      setDesiredScore('');
      setFile(null);
      setActiveTab('history');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gửi đơn phúc khảo');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Chờ tiếp nhận</Badge>;
      case 'ASSIGNED':
      case 'IN_REVIEW':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Đang chấm lại</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Đã cập nhật điểm</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Giữ nguyên điểm</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đơn Phúc khảo Điểm Khóa luận</DialogTitle>
          <DialogDescription className="truncate">
            Đề tài: {topicTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Nộp đơn mới
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Lịch sử đơn ({history.length})
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold">Loại điểm xin phúc khảo</Label>
              <select
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value as GradeReviewType)}
                className="w-full mt-1.5 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="DEFENSE">Điểm Hội đồng Bảo vệ</option>
                <option value="REVIEWER">Điểm Giảng viên Phản biện</option>
                <option value="SUPERVISION">Điểm Giảng viên Hướng dẫn</option>
                <option value="FINAL">Điểm Tổng kết cuối kỳ</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Điểm hiện tại</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={originalScore}
                  onChange={(e) => setOriginalScore(parseFloat(e.target.value) || 0)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Điểm kỳ vọng (tùy chọn)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="VD: 8.5"
                  value={desiredScore}
                  onChange={(e) => setDesiredScore(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Lý do xin phúc khảo & Giải trình chi tiết *</Label>
              <Textarea
                rows={4}
                placeholder="Trình bày rõ các căn cứ, phần nội dung hoặc tiêu chí mà bạn cho rằng có sự chênh lệch điểm..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1.5 text-sm"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">File đính kèm / Minh chứng (PDF, DOCX, ZIP)</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  type="file"
                  id="grade-review-file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('grade-review-file')?.click()}
                  className="text-xs gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {file ? file.name : 'Chọn tệp đính kèm'}
                </Button>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Gửi đơn phúc khảo
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-3">
            {loadingHistory ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Đang tải lịch sử...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Bạn chưa có đơn phúc khảo nào</div>
            ) : (
              history.map((rev) => (
                <div key={rev.id} className="p-3.5 border border-border rounded-lg bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      Loại điểm: {rev.review_type} (Điểm gốc: {rev.original_score})
                    </span>
                    {getStatusBadge(rev.status)}
                  </div>
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                    <strong>Lý do:</strong> {rev.reason}
                  </p>
                  {rev.reassessed_score !== null && rev.reassessed_score !== undefined && (
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Điểm chấm lại: <strong>{rev.reassessed_score}</strong>
                      {rev.reassessment_notes && <span className="text-muted-foreground ml-1">({rev.reassessment_notes})</span>}
                    </div>
                  )}
                  {rev.head_feedback && (
                    <div className="text-xs text-emerald-700 dark:text-emerald-300">
                      <strong>Ý kiến Trưởng BM:</strong> {rev.head_feedback}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(rev.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
