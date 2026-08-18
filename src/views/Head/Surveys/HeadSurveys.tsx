import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, BarChart3, Users, Star, ClipboardCheck, Trash2, Loader2, Sparkles } from 'lucide-react';
import { surveyService, thesisRoundService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Survey, SurveyAnalyticsData } from '@/types/api';

export function HeadSurveys() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create Survey
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roundId, setRoundId] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [questions, setQuestions] = useState<Array<{ question_text: string; question_type: string }>>([
    { question_text: 'Đánh giá tinh thần trách nhiệm và sự hỗ trợ của Giảng viên hướng dẫn', question_type: 'RATING_1_5' },
    { question_text: 'Đánh giá tính công bằng và chuyên môn của Hội đồng bảo vệ', question_type: 'RATING_1_5' },
    { question_text: 'Đóng góp ý kiến hoặc đề xuất cải tiến cho các khóa tiếp theo', question_type: 'TEXT' }
  ]);
  const [creating, setCreating] = useState(false);

  // Modal View Analytics
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<SurveyAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [surveysData, roundsData] = await Promise.all([
        surveyService.getAdminSurveys().catch(() => []),
        thesisRoundService.getThesisRounds().catch(() => [])
      ]);
      const sList = Array.isArray(surveysData) ? surveysData : (surveysData as any)?.data || [];
      const rList = Array.isArray(roundsData) ? roundsData : (roundsData as any)?.data || [];
      setSurveys(Array.isArray(sList) ? sList : []);
      setRounds(Array.isArray(rList) ? rList : []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách khảo sát');
      setSurveys([]);
      setRounds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, { question_text: '', question_type: 'RATING_1_5' }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: string, val: string) => {
    setQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên đợt khảo sát');
      return;
    }
    const validQuestions = questions.filter(q => q.question_text.trim());
    if (validQuestions.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 câu hỏi');
      return;
    }

    try {
      setCreating(true);
      await surveyService.createSurvey({
        title,
        description,
        thesis_round_id: roundId ? parseInt(roundId) : null,
        target_role: targetRole,
        is_anonymous: isAnonymous,
        questions: validQuestions
      });

      toast.success('Đã tạo đợt khảo sát chất lượng thành công!');
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo khảo sát');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenAnalytics = async (surveyId: number) => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsModalOpen(true);
      const data = await surveyService.getSurveyAnalytics(surveyId);
      setAnalyticsData(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải kết quả thống kê');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <PageLayout
      userRole="head"
      userName={user?.fullName || 'Trưởng bộ môn'}
      title="Khảo sát & Đánh giá Chất lượng"
      subtitle="Thiết lập phiếu khảo sát và phân tích mức độ hài lòng của Sinh viên & Giảng viên"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="text-xs text-muted-foreground">
          Tổng cộng: <strong>{surveys.length}</strong> phiếu khảo sát
        </div>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 text-xs h-9"
        >
          <Plus className="w-4 h-4" /> Tạo phiếu khảo sát mới
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải danh sách khảo sát...
        </div>
      ) : surveys.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-foreground text-sm">Chưa có phiếu khảo sát nào</p>
            <p className="text-xs mt-1">Nhấn "Tạo phiếu khảo sát mới" để thu thập ý kiến đánh giá sau bảo vệ.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((sv) => (
            <Card key={sv.id} className="hover:shadow-md transition-shadow border-border/80 flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="blue" className="text-xs">
                    {sv.thesis_rounds?.round_name || 'Khảo sát chung'}
                  </Badge>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Đối tượng: {sv.target_role}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-2">{sv.title}</h4>
                  {sv.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sv.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1">
                    <ClipboardCheck className="w-3.5 h-3.5 text-primary" /> {sv._count?.survey_questions || 0} câu hỏi
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Users className="w-3.5 h-3.5 text-emerald-600" /> {sv._count?.survey_responses || 0} phản hồi
                  </span>
                </div>
              </CardContent>

              <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAnalytics(sv.id)}
                  className="w-full text-xs gap-1.5 h-8"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-primary" /> Xem Báo cáo & Thống kê
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Create Survey */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Phiếu Khảo sát / Đánh giá Mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSurvey} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Tên phiếu khảo sát *</Label>
              <Input
                placeholder="VD: Khảo sát chất lượng hướng dẫn đồ án tốt nghiệp HK1 2024-2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Đợt khóa luận áp dụng</Label>
                <select
                  value={roundId}
                  onChange={(e) => setRoundId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Tất cả các đợt --</option>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>{r.round_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Đối tượng khảo sát</Label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">Tất cả (Sinh viên & Giảng viên)</option>
                  <option value="STUDENT">Chỉ Sinh viên làm khóa luận</option>
                  <option value="INSTRUCTOR">Chỉ Giảng viên / Hội đồng</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Mô tả / Hướng dẫn điền</Label>
              <Textarea
                rows={2}
                placeholder="Mô tả mục tiêu khảo sát..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>

            {/* Questions List */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Danh sách câu hỏi ({questions.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="text-xs h-7 gap-1"
                >
                  <Plus className="w-3 h-3" /> Thêm câu hỏi
                </Button>
              </div>

              {questions.map((q, idx) => (
                <div key={idx} className="p-3 border border-border rounded-lg bg-card flex items-start gap-2">
                  <span className="text-xs font-bold text-muted-foreground mt-2 shrink-0">{idx + 1}.</span>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Nội dung câu hỏi..."
                      value={q.question_text}
                      onChange={(e) => handleQuestionChange(idx, 'question_text', e.target.value)}
                      className="text-xs"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground shrink-0">Dạng trả lời:</span>
                      <select
                        value={q.question_type}
                        onChange={(e) => handleQuestionChange(idx, 'question_type', e.target.value)}
                        className="px-2 py-1 text-xs bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="RATING_1_5">Thang điểm 1 - 5 Sao</option>
                        <option value="RATING_1_10">Thang điểm 1 - 10</option>
                        <option value="TEXT">Ý kiến đóng góp (Văn bản tự do)</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Phát hành khảo sát
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal View Analytics */}
      <Dialog open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Báo cáo Thống kê & Đánh giá: {analyticsData?.survey?.title}
            </DialogTitle>
            <DialogDescription>
              Tổng số lượt phản hồi đã ghi nhận: <strong>{analyticsData?.survey?.total_responses || 0}</strong>
            </DialogDescription>
          </DialogHeader>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tổng hợp dữ liệu phân tích...
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {analyticsData?.analytics?.map((item, idx) => (
                <Card key={item.id} className="border border-border/80">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xs font-semibold leading-normal">
                        Câu {idx + 1}: {item.question_text}
                      </CardTitle>
                      {item.avg_rating !== null && item.avg_rating !== undefined && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 text-xs shrink-0">
                          TB: {item.avg_rating} / 5 ⭐
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    {item.question_type.startsWith('RATING') ? (
                      <div className="h-40 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(item.rating_distribution || {}).map(([star, count]) => ({
                              label: `${star} sao`,
                              count
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Số lượt đánh giá" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          Các ý kiến đóng góp ({item.text_responses?.length || 0}):
                        </span>
                        {item.text_responses && item.text_responses.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {item.text_responses.map((txt, i) => (
                              <div key={i} className="p-2 text-xs bg-muted/40 rounded border border-border/50 text-foreground">
                                "{txt}"
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Chưa có câu trả lời văn bản nào.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
