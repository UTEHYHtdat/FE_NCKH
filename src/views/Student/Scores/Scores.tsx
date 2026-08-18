import { useEffect, useState } from 'react';
import { TrendingUp, Award, BookOpen, GraduationCap } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { gradingService } from '@/plugins/api';

export function Scores() {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<any>({
    supervision_score: '-',
    review_scores: [],
    defense_score: '-',
    final_score: '-',
  });

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        // Fetch scores from API
        const data = await gradingService.getThesisScores(thesisId);
        setScores(data);

        // Placeholder data
        // setScores({
        //   supervision_score: 8.5,
        //   review_scores: [
        //     { reviewer: 'GV Phản biện 1', score: 8.0 },
        //     { reviewer: 'GV Phản biện 2', score: 8.5 },
        //   ],
        //   defense_score: '-',
        //   final_score: '-',
        // });
      } catch (error) {
        console.error('Error fetching scores:', error);
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
        userName="Nguyễn Văn A"
        title="Điểm số"
        subtitle="Xem chi tiết điểm số khóa luận"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      </PageLayout>
    );
  }

  const averageReviewScore =
    scores.review_scores.length > 0
      ? (
          scores.review_scores.reduce(
            (sum: number, r: any) => sum + r.score,
            0,
          ) / scores.review_scores.length
        ).toFixed(1)
      : '-';

  return (
    <PageLayout
      userRole="student"
      userName="Nguyễn Văn A"
      title="Điểm số"
      subtitle="Xem chi tiết điểm số khóa luận"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Supervision Score Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Điểm hướng dẫn</CardTitle>
                <CardDescription>Giảng viên hướng dẫn</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {scores.supervision_score}
              </div>
              <Badge variant="secondary">Đã chấm</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Review Score Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Điểm phản biện</CardTitle>
                <CardDescription>Giảng viên phản biện</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {averageReviewScore}
              </div>
              <Badge variant="secondary">
                {scores.review_scores.length} phản biện
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Defense Score Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <CardTitle>Điểm bảo vệ</CardTitle>
                <CardDescription>Hội đồng bảo vệ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-violet-600 mb-2">
                {scores.defense_score}
              </div>
              <Badge
                variant={scores.defense_score === '-' ? 'outline' : 'secondary'}
              >
                {scores.defense_score === '-' ? 'Chưa chấm' : 'Đã chấm'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final Score Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <CardTitle>Điểm tổng kết</CardTitle>
              <CardDescription>Điểm cuối cùng của khóa luận</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-7xl font-bold text-primary mb-4">
              {scores.final_score}
            </div>
            {scores.final_score === '-' ? (
              <p className="text-muted-foreground">
                Điểm tổng kết sẽ được tính sau khi hoàn thành tất cả các phần
                đánh giá
              </p>
            ) : (
              <Badge variant="default" className="text-lg px-4 py-2">
                Hoàn thành
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Review Scores */}
      {scores.review_scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết điểm phản biện</CardTitle>
            <CardDescription>Điểm từ các giảng viên phản biện</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scores.review_scores.map((review: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{review.reviewer}</p>
                    <p className="text-sm text-muted-foreground">
                      Giảng viên phản biện #{index + 1}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {review.score}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
