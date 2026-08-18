import { useState, useEffect } from 'react';
import { Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstructorGradingForm } from '@/components/InstructorGradingForm';
import { gradingService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';

export function ReviewSchedule() {
  const { user } = useAuth();
  const userRole = user?.role || 'instructor';
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const instructorId = user?.instructorId || user?.id;
      const data = await gradingService.getReviewStudents(instructorId);
      
      const mapped = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.review_assignment_id || item.thesis_id,
        reviewAssignmentId: item.review_assignment_id,
        thesisId: item.thesis_id,
        thesisTitle: item.topic_title,
        thesisCode: item.thesis_code,
        groupName: item.thesis_round_name || 'Đợt khóa luận',
        status: item.is_graded ? 'REVIEWED' : 'PENDING_REVIEW',
        reviewScore: item.review_score,
        reviewDate: item.graded_date ? new Date(item.graded_date).toLocaleDateString('vi-VN') : null,
        deadline: item.review_deadline ? new Date(item.review_deadline).toLocaleDateString('vi-VN') : 'Theo lịch đợt',
        students: (item.members || []).map((m: any) => `${m.full_name} (${m.student_code})`),
        supervisor: item.supervisor ? `${item.supervisor.full_name}` : 'Chưa phân công',
        rawItem: item,
      }));

      setReviews(mapped);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const handleOpenReviewModal = (review: any) => {
    setSelectedReview(review);
    setIsGradingModalOpen(true);
  };

  const handleGradingSuccess = () => {
    fetchReviews();
    setIsGradingModalOpen(false);
    setSelectedReview(null);
  };

  // Calculate stats dynamically
  const pendingCount = reviews.filter(r => r.status === 'PENDING_REVIEW').length;
  const completedCount = reviews.filter(r => r.status === 'REVIEWED').length;
  const reviewedItems = reviews.filter(r => r.status === 'REVIEWED' && r.reviewScore);
  const averageScore = reviewedItems.length > 0 
    ? (reviewedItems.reduce((sum, r) => sum + parseFloat(r.reviewScore), 0) / reviewedItems.length).toFixed(1)
    : '0';

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'TS. Giảng viên'}
      title="Lịch phản biện"
      subtitle="Danh sách khóa luận bạn được phân công phản biện"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Chờ phản biện</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-amber-600 mb-1">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Khóa luận cần chấm điểm phản biện</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Đã hoàn thành</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Khóa luận đã nộp phiếu đánh giá</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Điểm TB đã chấm</span>
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{averageScore}</div>
            <p className="text-xs text-muted-foreground">Thang điểm 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Đang tải danh sách phản biện...
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground">Chưa có đề tài nào được phân công phản biện</p>
              <p className="text-xs mt-1">Khi Trưởng bộ môn phân công, danh sách sẽ hiển thị tại đây.</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-base text-foreground line-clamp-1">{review.thesisTitle}</h3>
                      <Badge variant={review.status === 'REVIEWED' ? 'default' : 'secondary'} className="shrink-0">
                        {review.status === 'PENDING_REVIEW' && 'Chờ phản biện'}
                        {review.status === 'REVIEWED' && 'Đã phản biện'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mb-1">Mã đề tài: {review.thesisCode}</p>
                  </div>

                  {review.status === 'REVIEWED' && review.reviewScore && (
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-green-600">{review.reviewScore}</div>
                      <p className="text-xs text-muted-foreground">Điểm phản biện</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-muted/20 rounded-lg text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">Sinh viên thực hiện</p>
                    <p className="font-medium text-foreground">{review.students.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Giảng viên hướng dẫn</p>
                    <p className="font-medium text-foreground">{review.supervisor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">
                      {review.status === 'REVIEWED' ? 'Ngày phản biện' : 'Hạn phản biện'}
                    </p>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{review.status === 'REVIEWED' ? review.reviewDate : review.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenReviewModal(review)}
                    variant={review.status === 'REVIEWED' ? 'outline' : 'default'}
                    className={review.status === 'PENDING_REVIEW' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                  >
                    <FileText className="w-4 h-4 mr-1.5" />
                    {review.status === 'PENDING_REVIEW' ? 'Chấm điểm & Viết nhận xét' : 'Xem lại / Sửa nhận xét'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Chấm điểm theo Mẫu phiếu */}
      {selectedReview && (
        <InstructorGradingForm
          isOpen={isGradingModalOpen}
          onClose={() => {
            setIsGradingModalOpen(false);
            setSelectedReview(null);
          }}
          onSuccess={handleGradingSuccess}
          studentData={{
            name: selectedReview.students?.[0] || '',
            topicName: selectedReview.thesisTitle,
            topicTitle: selectedReview.thesisTitle,
            thesisCode: selectedReview.thesisCode,
            thesisId: selectedReview.thesisId,
            reviewAssignmentId: selectedReview.reviewAssignmentId,
            gradingType: 'review',
            members: selectedReview.rawItem?.members || [],
          }}
          instructorData={{
            name: user?.fullName,
            academicTitle: user?.academicTitle,
            degree: user?.degree,
            unit: user?.departmentName,
          }}
        />
      )}
    </PageLayout>
  );
}
