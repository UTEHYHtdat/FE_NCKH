import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { gradingService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Calculator, CheckCircle2, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface CriteriaItem {
  id: string | number;
  name: string;
  maxScore: number;
  score: number;
  comment?: string;
}

interface InstructorGradingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  studentData?: {
    name?: string;
    studentName?: string;
    studentId?: string;
    className?: string;
    major?: string;
    topicName?: string;
    topicTitle?: string;
    topic_title?: string;
    thesisCode?: string;
    thesis_code?: string;
    thesisId?: number;
    thesis_id?: number;
    gradingType?: 'supervision' | 'review' | 'defense';
    reviewAssignmentId?: number;
    assignment_id?: number;
    assignmentId?: number;
    council_name?: string;
    venue?: string;
    role_in_council?: string;
    members?: any[];
    supervisor_name?: string;
    my_score?: number;
    my_comments?: string;
  };
  instructorData?: {
    name?: string;
    academicTitle?: string;
    degree?: string;
    unit?: string;
  };
}

export function InstructorGradingForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  studentData, 
  instructorData 
}: InstructorGradingFormProps) {
  const { user } = useAuth();
  const gradingType = studentData?.gradingType || 'supervision';

  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [criteriaList, setCriteriaList] = useState<CriteriaItem[]>([]);
  const [generalComment, setGeneralComment] = useState('');
  const [defenseApproval, setDefenseApproval] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  // Tự động tải mẫu phiếu do Trưởng bộ môn thiết lập
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    const fetchTemplate = async () => {
      try {
        setTemplateLoading(true);
        const typeParam = gradingType === 'supervision' ? 'SUPERVISION' : gradingType === 'review' ? 'REVIEW' : 'DEFENSE';
        const templates = await gradingService.getGradingTemplates(typeParam);

        if (Array.isArray(templates) && templates.length > 0) {
          const tpl = templates[0];
          setTemplateName(tpl.name || 'Phiếu chấm điểm Bộ môn');
          
          if (tpl.criteria_config && Array.isArray(tpl.criteria_config) && tpl.criteria_config.length > 0) {
            setCriteriaList(
              tpl.criteria_config.map((c: any, idx: number) => ({
                id: c.id || idx + 1,
                name: c.name || c.title || `Tiêu chí ${idx + 1}`,
                maxScore: Number(c.maxScore || c.weight || 2.5),
                score: 0,
                comment: '',
              }))
            );
            return;
          }
        }

        // Mẫu phiếu chuẩn mặc định nếu Trưởng bộ môn chưa tạo tiêu chí JSON
        if (gradingType === 'supervision') {
          setTemplateName('Phiếu đánh giá Hướng dẫn chuẩn');
          setCriteriaList([
            { id: 1, name: 'Tinh thần thái độ và sự chủ động trong quá trình thực hiện', maxScore: 2.0, score: 0 },
            { id: 2, name: 'Khả năng tìm hiểu tài liệu và áp dụng kiến thức chuyên môn', maxScore: 3.0, score: 0 },
            { id: 3, name: 'Khối lượng và tiến độ hoàn thành các nội dung công việc', maxScore: 2.5, score: 0 },
            { id: 4, name: 'Chất lượng báo cáo quyển khóa luận và sản phẩm demo', maxScore: 2.5, score: 0 },
          ]);
        } else if (gradingType === 'review') {
          setTemplateName('Phiếu đánh giá Phản biện chuẩn');
          setCriteriaList([
            { id: 1, name: 'Tính cấp thiết và ý nghĩa thực tiễn của đề tài', maxScore: 2.0, score: 0 },
            { id: 2, name: 'Độ sâu và chất lượng giải pháp kỹ thuật đề xuất', maxScore: 4.0, score: 0 },
            { id: 3, name: 'Hình thức trình bày báo cáo và tài liệu đính kèm', maxScore: 2.0, score: 0 },
            { id: 4, name: 'Kết quả đạt được so với mục tiêu đề ra', maxScore: 2.0, score: 0 },
          ]);
        } else {
          setTemplateName('Phiếu đánh giá Hội đồng bảo vệ');
          setCriteriaList([
            { id: 1, name: 'Chất lượng báo cáo và tài liệu luận văn', maxScore: 2.0, score: 0 },
            { id: 2, name: 'Kỹ năng thuyết trình và trình bày sản phẩm', maxScore: 3.0, score: 0 },
            { id: 3, name: 'Khả năng trả lời các câu hỏi chất vấn của Hội đồng', maxScore: 3.0, score: 0 },
            { id: 4, name: 'Đóng góp và mức độ hoàn thiện sản phẩm thực tế', maxScore: 2.0, score: 0 },
          ]);
        }
      } catch (err) {
        console.error('Error loading grading template:', err);
      } finally {
        setTemplateLoading(false);
      }
    };

    fetchTemplate();
  }, [isOpen, gradingType]);

  // Cập nhật điểm từng tiêu chí
  const handleCriteriaScoreChange = (index: number, val: number) => {
    const updated = [...criteriaList];
    const max = updated[index].maxScore;
    updated[index].score = Math.min(max, Math.max(0, val));
    setCriteriaList(updated);
  };

  // Tự động tính tổng điểm từ các tiêu chí
  const totalCalculatedScore = Number(
    criteriaList.reduce((sum, c) => sum + (Number(c.score) || 0), 0).toFixed(2)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const topicId = studentData?.thesisId || studentData?.thesis_id || 0;
      const reviewAssignId = studentData?.reviewAssignmentId || 0;
      const defenseAssignId = studentData?.assignmentId || studentData?.assignment_id || 0;

      const payload = {
        gradingDetails: {
          templateName,
          criteria: criteriaList,
          generalComment,
          totalScore: totalCalculatedScore,
        },
      };

      if (gradingType === 'supervision') {
        await gradingService.submitSupervisionComment({
          thesisId: topicId,
          supervisionScore: totalCalculatedScore,
          commentContent: generalComment,
          defenseApproval,
          rejectionReason: !defenseApproval ? rejectionReason : null,
          ...payload,
        });
      } else if (gradingType === 'review') {
        await gradingService.submitReviewResult({
          reviewAssignmentId: reviewAssignId,
          reviewScore: totalCalculatedScore,
          reviewContent: generalComment,
          defenseApproval,
          rejectionReason: !defenseApproval ? rejectionReason : null,
          ...payload,
        });
      } else if (gradingType === 'defense') {
        await gradingService.submitDefenseResult({
          defenseAssignmentId: defenseAssignId,
          defenseScore: totalCalculatedScore,
          comments: generalComment,
          ...payload,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi nộp phiếu chấm điểm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const currentTitle =
    studentData?.topicTitle ||
    studentData?.topic_title ||
    studentData?.topicName ||
    'Đề tài khóa luận';

  const currentCode = studentData?.thesisCode || studentData?.thesis_code || 'N/A';
  const studentNames =
    studentData?.members?.map((m: any) => m.full_name).join(', ') ||
    studentData?.studentName ||
    studentData?.name ||
    'Sinh viên thực hiện';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        gradingType === 'supervision'
          ? 'Phiếu chấm điểm Hướng dẫn'
          : gradingType === 'review'
          ? 'Phiếu chấm điểm Phản biện'
          : 'Phiếu chấm điểm Hội đồng bảo vệ'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Banner thông tin đề tài & Mẫu phiếu */}
        <div className="p-4 bg-muted/40 rounded-lg border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <h4 className="font-semibold text-sm line-clamp-1">{currentTitle}</h4>
            <Badge variant="blue" className="flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3" />
              {templateLoading ? 'Đang tải mẫu phiếu...' : templateName}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Mã đề tài: {currentCode} • Sinh viên: {studentNames}
          </p>
          {gradingType === 'defense' && studentData?.council_name && (
            <p className="text-xs text-muted-foreground mt-1">
              🏛️ {studentData.council_name} • 📍 {studentData.venue || 'Phòng hội đồng'}
            </p>
          )}
        </div>

        {/* Bảng điền điểm theo từng tiêu chí của Trưởng bộ môn */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            Các tiêu chí đánh giá theo mẫu của Bộ môn
          </h4>

          {templateLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Đang tải tiêu chí chấm điểm...
            </div>
          ) : (
            <div className="space-y-3">
              {criteriaList.map((item, idx) => (
                <div key={item.id} className="p-3.5 rounded-lg border border-border/80 bg-background space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium flex-1">
                      {idx + 1}. {item.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={item.maxScore}
                        step={0.1}
                        value={item.score || ''}
                        onChange={(e) => handleCriteriaScoreChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-20 text-center font-bold"
                        placeholder="0.0"
                        required
                      />
                      <span className="text-xs text-muted-foreground font-medium">/ {item.maxScore} đ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tổng điểm tự động */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div>
            <span className="font-semibold text-sm block">TỔNG ĐIỂM ĐÁNH GIÁ (Thang điểm 10):</span>
            <span className="text-xs text-muted-foreground">Điểm được tự động tính dựa trên các tiêu chí ở trên</span>
          </div>
          <div className="text-2xl font-bold text-primary">{totalCalculatedScore} / 10.0</div>
        </div>

        {/* Nhận xét chung */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Nhận xét & Đánh giá tổng quát:</label>
          <textarea
            className="w-full min-h-[90px] px-3 py-2 border border-input rounded-lg text-sm bg-background resize-y"
            placeholder="Nhập nội dung nhận xét chi tiết..."
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            required
          />
        </div>

        {/* Đồng ý cho bảo vệ (Dành cho Hướng dẫn & Phản biện) */}
        {gradingType !== 'defense' && (
          <div className="space-y-2 p-3.5 bg-muted/20 rounded-lg border border-border/70">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={defenseApproval}
                onChange={(e) => setDefenseApproval(e.target.checked)}
                className="w-4 h-4 rounded text-primary"
              />
              <span className="text-sm font-medium">Đồng ý cho sinh viên bảo vệ khóa luận</span>
            </label>
            {!defenseApproval && (
              <Input
                placeholder="Nhập lý do không đồng ý cho bảo vệ..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                className="mt-2"
              />
            )}
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading || templateLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Đang nộp...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Xác nhận nộp đánh giá
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
