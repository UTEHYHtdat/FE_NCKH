import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ClipboardCheck, Calendar, Users, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { surveyService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import { TakeSurveyModal } from './TakeSurveyModal';
import type { Survey } from '@/types/api';

export function SurveysList() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const data = await surveyService.getActiveSurveys();
      setSurveys(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách khảo sát');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSurvey = (id: number) => {
    setSelectedSurveyId(id);
    setModalOpen(true);
  };

  return (
    <PageLayout
      userRole={user?.role as any || 'student'}
      userName={user?.fullName || 'Người dùng'}
      title="Khảo sát & Đánh giá Chất lượng"
      subtitle="Đóng góp ý kiến về công tác giảng dạy, hướng dẫn đồ án và tổ chức hội đồng"
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải các phiếu khảo sát...
        </div>
      ) : surveys.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-foreground text-sm">Hiện không có đợt khảo sát nào đang mở</p>
            <p className="text-xs mt-1">Khi Bộ môn mở phiếu khảo sát đánh giá cuối khóa luận, thông tin sẽ hiển thị tại đây.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surveys.map((sv) => (
            <Card key={sv.id} className="hover:shadow-md transition-shadow border-border/80 flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="blue" className="text-xs">
                    {sv.thesis_rounds?.round_name || 'Khảo sát chung'}
                  </Badge>
                  {sv.is_anonymous && (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 text-[10px]">
                      Ẩn danh
                    </Badge>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-base text-foreground leading-snug">{sv.title}</h4>
                  {sv.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{sv.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1">
                    <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                    {sv._count?.survey_questions || 0} câu hỏi
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    {sv._count?.survey_responses || 0} lượt hoàn thành
                  </span>
                </div>
              </CardContent>

              <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end">
                <Button
                  size="sm"
                  onClick={() => handleOpenSurvey(sv.id)}
                  className="text-xs gap-1.5"
                >
                  Làm bài khảo sát <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedSurveyId && (
        <TakeSurveyModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          surveyId={selectedSurveyId}
          onCompleted={fetchSurveys}
        />
      )}
    </PageLayout>
  );
}
