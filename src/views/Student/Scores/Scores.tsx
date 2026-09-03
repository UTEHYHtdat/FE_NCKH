import { useEffect, useState } from 'react';
import { Award, BookOpen, GraduationCap, TrendingUp, Calendar, MapPin, CheckCircle2, FileText, Sparkles, User, Shield } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { gradingService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ModalGradeReview } from './ModalGradeReview';

export function Scores() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState<any>('DEFENSE');
  const [originalScore, setOriginalScore] = useState(0);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const data = await gradingService.getStudentMyScores();
        setScoreData(data);
      } catch (error) {
        console.error('Error fetching student scores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  if (loading) {
    return (
      <PageLayout
        userRole="student"
        userName={user?.fullName || 'Sinh viên'}
        title="Bảng điểm khóa luận"
        subtitle="Xem chi tiết điểm số và nhận xét đánh giá"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Đang tải bảng điểm...</div>
        </div>
      </PageLayout>
    );
  }

  if (!scoreData || !scoreData.hasThesis) {
    return (
      <PageLayout
        userRole="student"
        userName={user?.fullName || 'Sinh viên'}
        title="Bảng điểm khóa luận"
        subtitle="Xem chi tiết điểm số và nhận xét đánh giá"
      >
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-foreground text-base">Bạn chưa tham gia đề tài khóa luận nào</p>
            <p className="text-xs mt-1">Khi bạn tham gia vào đề tài và được chấm điểm, bảng điểm sẽ hiển thị tại đây.</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const supervision = scoreData.supervision;
  const reviews = scoreData.reviews || [];
  const defense = scoreData.defense;
  const finalScore = scoreData.final_score;

  // Tính điểm TB phản biện
  const validReviews = reviews.filter((r: any) => r.score !== null);
  const avgReviewScore = validReviews.length > 0
    ? Number((validReviews.reduce((sum: number, r: any) => sum + r.score, 0) / validReviews.length).toFixed(2))
    : null;

  const getAcademicRank = (score?: number | null) => {
    if (!score) return null;
    if (score >= 9.0) return { label: 'Xuất sắc', variant: 'default' as const, bg: 'bg-emerald-600' };
    if (score >= 8.0) return { label: 'Giỏi', variant: 'default' as const, bg: 'bg-blue-600' };
    if (score >= 7.0) return { label: 'Khá', variant: 'secondary' as const, bg: 'bg-amber-600' };
    if (score >= 5.0) return { label: 'Trung bình', variant: 'outline' as const, bg: 'bg-gray-600' };
    return { label: 'Không đạt', variant: 'destructive' as const, bg: 'bg-red-600' };
  };

  const rank = getAcademicRank(finalScore);

  return (
    <PageLayout
      userRole="student"
      userName={user?.fullName || 'Sinh viên'}
      title="Bảng điểm khóa luận"
      subtitle="Xem chi tiết điểm số và nhận xét từ Hội đồng & Giảng viên"
    >
      {/* Banner thông tin đề tài */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200/50">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h3 className="text-base font-bold text-foreground">{scoreData.topic_title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="blue">{scoreData.round_name || 'Đợt khóa luận'}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReviewType('DEFENSE');
                  setOriginalScore(defense?.score || finalScore || 0);
                  setReviewModalOpen(true);
                }}
                className="text-xs h-7 gap-1 border-amber-500/40 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300"
              >
                Xin phúc khảo điểm
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Mã đề tài: {scoreData.thesis_code}
          </p>
        </CardContent>
      </Card>

      {/* 4 Thẻ điểm tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Điểm Hướng dẫn */}
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điểm Hướng dẫn (20%)</span>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {supervision?.score !== undefined && supervision?.score !== null ? supervision.score : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {supervision?.instructor_name ? `GVHD: ${supervision.instructor_name}` : 'Chưa có điểm'}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Điểm Phản biện */}
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điểm Phản biện (30%)</span>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {avgReviewScore !== null ? avgReviewScore : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {validReviews.length > 0 ? `${validReviews.length} cán bộ phản biện` : 'Chờ phản biện'}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Điểm Hội đồng */}
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điểm Hội đồng (50%)</span>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {defense?.average_score !== null && defense?.average_score !== undefined ? defense.average_score : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {defense?.council_name || 'Chưa bảo vệ'}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Điểm Tổng kết */}
        <Card className="hover:shadow-sm transition-shadow border-amber-200/60 bg-amber-50/20 dark:bg-amber-950/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Điểm Tổng kết</span>
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-600 mb-1">
              {finalScore !== null && finalScore !== undefined ? finalScore : '-'}
            </div>
            {rank ? (
              <Badge className={`${rank.bg} text-white text-[11px]`}>{rank.label}</Badge>
            ) : (
              <p className="text-xs text-muted-foreground">Chưa hoàn thành đủ 3 cột điểm</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chi tiết từng phần điểm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 1. Chi tiết Điểm Hướng dẫn */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base">Đánh giá của Giảng viên hướng dẫn</CardTitle>
              </div>
              <Badge variant={supervision ? 'default' : 'outline'}>
                {supervision ? 'Đã đánh giá' : 'Chưa đánh giá'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {supervision ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{supervision.instructor_name}</p>
                    <p className="text-xs text-muted-foreground">Giảng viên hướng dẫn</p>
                  </div>
                  <div className="text-xl font-bold text-green-600">{supervision.score} / 10.0</div>
                </div>

                {supervision.grading_details?.criteria && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Chi tiết theo tiêu chí:</p>
                    <div className="space-y-1.5">
                      {supervision.grading_details.criteria.map((c: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-background border border-border/60">
                          <span>{c.name}</span>
                          <span className="font-bold text-primary">{c.score} / {c.maxScore} đ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Nhận xét của GVHD:</p>
                  <div className="p-3 bg-muted/30 rounded-lg text-xs leading-relaxed">
                    {supervision.comment_content || 'Không có nhận xét chi tiết.'}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${supervision.defense_approval ? 'text-green-600' : 'text-red-500'}`} />
                  <span className="font-medium">
                    {supervision.defense_approval ? 'Đồng ý cho bảo vệ khóa luận' : 'Không đồng ý cho bảo vệ'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Giảng viên hướng dẫn chưa nộp phiếu đánh giá.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 2. Chi tiết Điểm Phản biện */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Đánh giá của Giảng viên phản biện</CardTitle>
              </div>
              <Badge variant={validReviews.length > 0 ? 'default' : 'outline'}>
                {validReviews.length}/{reviews.length} cán bộ đã chấm
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Chưa có cán bộ phản biện nào được phân công.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-border/80 bg-muted/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{r.reviewer_name || `Cán bộ phản biện ${idx + 1}`}</p>
                        <p className="text-xs text-muted-foreground">Phản biện #{r.review_order || idx + 1}</p>
                      </div>
                      {r.score !== null ? (
                        <div className="text-xl font-bold text-blue-600">{r.score} / 10.0</div>
                      ) : (
                        <Badge variant="outline" className="text-xs">Chờ phản biện</Badge>
                      )}
                    </div>

                    {r.comments && (
                      <div className="p-2.5 bg-background rounded border border-border/60 text-xs text-foreground">
                        <span className="font-medium text-muted-foreground block mb-0.5">Nhận xét:</span>
                        {r.comments}
                      </div>
                    )}

                    {r.defense_approval !== null && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${r.defense_approval ? 'text-green-600' : 'text-red-500'}`} />
                        <span>{r.defense_approval ? 'Đồng ý cho bảo vệ' : 'Chưa đồng ý cho bảo vệ'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Chi tiết Hội đồng bảo vệ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Thông tin & Kết quả Hội đồng bảo vệ</CardTitle>
            </div>
            {defense?.average_score !== null && (
              <Badge variant="default" className="bg-purple-600">
                Điểm TB Hội đồng: {defense.average_score}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {defense?.council_name ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-purple-50/40 dark:bg-purple-950/20 rounded-lg border border-purple-200/40 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Tên Hội đồng:</span>
                  <span className="font-semibold text-foreground">{defense.council_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Địa điểm & Phòng:</span>
                  <span className="font-semibold text-foreground">📍 {defense.venue || 'Chưa cập nhật'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Thời gian bảo vệ:</span>
                  <span className="font-semibold text-foreground">
                    📅 {defense.date ? new Date(defense.date).toLocaleDateString('vi-VN') : 'Theo thông báo'}
                  </span>
                </div>
              </div>

              {/* Danh sách điểm của từng thành viên hội đồng */}
              {defense.members && defense.members.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Điểm chấm từ các thành viên Hội đồng:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {defense.members.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border border-border/80 bg-background space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-foreground">{m.member_name}</span>
                          <span className="font-bold text-sm text-purple-600">{m.score} đ</span>
                        </div>
                        {m.comments && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">"{m.comments}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Hội đồng đang chuẩn bị diễn ra hoặc chưa hoàn tất chấm điểm.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              Chưa có thông tin lịch bảo vệ Hội đồng cho đề tài này.
            </p>
          )}
        </CardContent>
      </Card>

      {scoreData?.thesis_id && (
        <ModalGradeReview
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          thesisId={scoreData.thesis_id}
          topicTitle={scoreData.topic_title}
          defaultReviewType={reviewType}
          defaultOriginalScore={originalScore}
        />
      )}
    </PageLayout>
  );
}
