import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Star, CheckCircle2 } from 'lucide-react';
import { surveyService } from '@/plugins/api';
import type { Survey, SurveyQuestion } from '@/types/api';

interface TakeSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  onCompleted?: () => void;
}

export const TakeSurveyModal: React.FC<TakeSurveyModalProps> = ({
  open,
  onOpenChange,
  surveyId,
  onCompleted
}) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && surveyId) {
      fetchSurvey();
    }
  }, [open, surveyId]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const data = await surveyService.getSurveyById(surveyId);
      setSurvey(data);
      // Init default answers
      const initial: Record<number, any> = {};
      data.survey_questions?.forEach((q: SurveyQuestion) => {
        if (q.question_type === 'RATING_1_5') initial[q.id] = 5;
        else if (q.question_type === 'RATING_1_10') initial[q.id] = 10;
        else initial[q.id] = '';
      });
      setAnswers(initial);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải khảo sát');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (questionId: number, val: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleTextChange = (questionId: number, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey?.survey_questions) return;

    // Validate required questions
    for (const q of survey.survey_questions) {
      if (q.is_required && (!answers[q.id] || (typeof answers[q.id] === 'string' && !answers[q.id].trim()))) {
        toast.error(`Vui lòng trả lời câu hỏi: "${q.question_text}"`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        answers: survey.survey_questions.map(q => ({
          question_id: q.id,
          rating_value: typeof answers[q.id] === 'number' ? answers[q.id] : null,
          text_value: typeof answers[q.id] === 'string' ? answers[q.id] : null
        }))
      };

      await surveyService.submitSurvey(survey.id, payload);
      toast.success('Cảm ơn bạn đã đóng góp ý kiến đánh giá!');
      onOpenChange(false);
      if (onCompleted) onCompleted();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi nộp bài khảo sát');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{survey?.title || 'Phiếu Khảo sát Đánh giá'}</DialogTitle>
          <DialogDescription className="text-xs">
            {survey?.description || 'Ý kiến của bạn là cơ sở quan trọng để nâng cao chất lượng hướng dẫn và tổ chức đồ án.'}
            {survey?.is_anonymous && ' (Phiếu đánh giá này được bảo mật danh tính)'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải câu hỏi khảo sát...
          </div>
        ) : survey?.hasSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-foreground">Bạn đã hoàn thành khảo sát này</h4>
            <p className="text-xs text-muted-foreground">Mỗi tài khoản chỉ cần thực hiện khảo sát 1 lần cho đợt khóa luận này.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            {survey?.survey_questions?.map((q, idx) => (
              <div key={q.id} className="p-3.5 border border-border rounded-lg bg-card space-y-2.5">
                <Label className="text-xs font-semibold leading-normal block text-foreground">
                  Câu {idx + 1}: {q.question_text} {q.is_required && <span className="text-destructive">*</span>}
                </Label>

                {/* Rating 1-5 Stars */}
                {q.question_type === 'RATING_1_5' && (
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(q.id, star)}
                        className="p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            (answers[q.id] || 0) >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-medium text-muted-foreground ml-2">
                      ({answers[q.id] || 0}/5 sao)
                    </span>
                  </div>
                )}

                {/* Rating 1-10 Scale */}
                {q.question_type === 'RATING_1_10' && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleRatingChange(q.id, num)}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                          answers[q.id] === num
                            ? 'bg-primary text-primary-foreground shadow'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}

                {/* Text Response */}
                {q.question_type === 'TEXT' && (
                  <Textarea
                    rows={3}
                    placeholder="Nhập ý kiến đóng góp của bạn..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    className="text-xs"
                  />
                )}
              </div>
            ))}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Gửi câu trả lời
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
