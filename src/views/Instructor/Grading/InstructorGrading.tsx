import { useEffect, useState } from 'react';
import { Search, Users, GraduationCap, CheckSquare, Shield, Calendar, MapPin, Clock } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstructorGradingForm } from '@/components/InstructorGradingForm';
import { useAuth } from '@/contexts/AuthContext';
import { gradingService, thesisRoundsService } from '@/plugins/api';
import type { SupervisionStudent, ReviewStudent, ThesisRound } from '@/types/api';

import { ExcelBatchActions } from '@/components/shared/ExcelBatchActions';
import { excelBatchService } from '@/plugins/api';

export function InstructorGrading() {
  const { user } = useAuth();
  const userRole = user?.role || 'instructor';
  const [loading, setLoading] = useState(true);
  const [gradingType, setGradingType] = useState<'supervision' | 'review' | 'defense'>('supervision');
  const [searchTerm, setSearchTerm] = useState('');
  
  // API data
  const [supervisionStudents, setSupervisionStudents] = useState<SupervisionStudent[]>([]);
  const [reviewStudents, setReviewStudents] = useState<ReviewStudent[]>([]);
  const [defenseStudents, setDefenseStudents] = useState<any[]>([]);
  
  // Thesis rounds
  const [thesisRounds, setThesisRounds] = useState<ThesisRound[]>([]);
  const [selectedThesisRoundId, setSelectedThesisRoundId] = useState<number | undefined>(undefined);
  const [roundsLoading, setRoundsLoading] = useState(true);
  
  // Grading form
  const [isGradingFormOpen, setIsGradingFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Fetch active thesis rounds on component mount
  useEffect(() => {
    const fetchThesisRounds = async () => {
      try {
        setRoundsLoading(true);
        const data = await thesisRoundsService.getThesisRoundsForInstructor();
        let roundsArray: ThesisRound[] = [];
        if (Array.isArray(data)) {
          roundsArray = data;
        } else if (data && typeof data === 'object') {
          const dataObj = data as any;
          if (dataObj.data && Array.isArray(dataObj.data)) {
            roundsArray = dataObj.data;
          } else if (dataObj.success && dataObj.data && Array.isArray(dataObj.data)) {
            roundsArray = dataObj.data;
          }
        }
        
        setThesisRounds(roundsArray);
        if (roundsArray.length > 0) {
          setSelectedThesisRoundId(roundsArray[0].id);
        }
      } catch (error) {
        console.error('Error fetching thesis rounds:', error);
      } finally {
        setRoundsLoading(false);
      }
    };

    fetchThesisRounds();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const instructorId = user?.instructorId || user?.id;

      if (gradingType === 'supervision') {
        const data = await gradingService.getSupervisionStudents(instructorId, selectedThesisRoundId);
        setSupervisionStudents(Array.isArray(data) ? data : []);
      } else if (gradingType === 'review') {
        const data = await gradingService.getReviewStudents(instructorId, selectedThesisRoundId);
        setReviewStudents(Array.isArray(data) ? data : []);
      } else {
        const data = await gradingService.getDefenseStudents(selectedThesisRoundId);
        setDefenseStudents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching grading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gradingType, selectedThesisRoundId, user]);

  const handleOpenGradingForm = (student: any) => {
    setSelectedStudent(student);
    setIsGradingFormOpen(true);
  };

  const handleCloseGradingForm = () => {
    setIsGradingFormOpen(false);
    setSelectedStudent(null);
  };

  const handleGradingSuccess = () => {
    fetchData();
    handleCloseGradingForm();
  };

  // Get current data based on grading type
  const getCurrentData = () => {
    if (gradingType === 'supervision') return supervisionStudents;
    if (gradingType === 'review') return reviewStudents;
    return defenseStudents;
  };

  const currentData = getCurrentData();

  // Filter data based on search term
  const filteredData = currentData.filter((item: any) => {
    const searchLower = searchTerm.toLowerCase();
    const topic = (item.topic_title || item.topicTitle || '').toLowerCase();
    const code = (item.thesis_code || item.thesisCode || '').toLowerCase();
    const members = (item.members || []).map((m: any) => `${m.full_name} ${m.student_code}`).join(' ').toLowerCase();
    const council = (item.council_name || '').toLowerCase();
    
    return topic.includes(searchLower) || code.includes(searchLower) || members.includes(searchLower) || council.includes(searchLower);
  });

  const getRoleBadge = (role?: string) => {
    if (role === 'CHAIRMAN') return <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">Chủ tịch Hội đồng</Badge>;
    if (role === 'SECRETARY') return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Thư ký Hội đồng</Badge>;
    return <Badge variant="secondary">Ủy viên Hội đồng</Badge>;
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'TS. Giảng viên'}
      title={
        gradingType === 'supervision'
          ? 'Chấm điểm hướng dẫn'
          : gradingType === 'review'
          ? 'Chấm điểm phản biện'
          : 'Chấm điểm Hội đồng bảo vệ'
      }
      subtitle={
        gradingType === 'supervision'
          ? 'Đánh giá các sinh viên và nhóm bạn đang trực tiếp hướng dẫn'
          : gradingType === 'review'
          ? 'Đánh giá và nhận xét các đồ án bạn được phân công phản biện'
          : 'Chấm điểm bảo vệ cho các đồ án thuộc Hội đồng bạn tham gia'
      }
      actions={
        <ExcelBatchActions
          exportUrl={excelBatchService.getScoresExportUrl(selectedThesisRoundId)}
          exportLabel="Xuất Bảng Điểm (Excel)"
        />
      }
    >
      {/* 3 Tab chuyển đổi loại chấm điểm */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={gradingType === 'supervision' ? 'default' : 'outline'}
          onClick={() => setGradingType('supervision')}
          className="flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4" />
          Chấm điểm hướng dẫn
        </Button>
        <Button
          variant={gradingType === 'review' ? 'default' : 'outline'}
          onClick={() => setGradingType('review')}
          className="flex items-center gap-2"
        >
          <CheckSquare className="w-4 h-4" />
          Chấm điểm phản biện
        </Button>
        <Button
          variant={gradingType === 'defense' ? 'default' : 'outline'}
          onClick={() => setGradingType('defense')}
          className="flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Chấm điểm Hội đồng
        </Button>
      </div>

      {/* Bộ lọc đợt khóa luận & tìm kiếm */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Đợt khóa luận:</label>
          {roundsLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải đợt khóa luận...</p>
          ) : thesisRounds.length > 0 ? (
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              value={selectedThesisRoundId || ''}
              onChange={(e) => setSelectedThesisRoundId(e.target.value ? Number(e.target.value) : undefined)}
            >
              {thesisRounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.round_name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground">Không có đợt khóa luận nào</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1.5 block">Tìm kiếm:</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã đề tài, tên đề tài, sinh viên, hội đồng..."
              className="pl-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Danh sách đề tài */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải danh sách đề tài...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            {searchTerm ? 'Không tìm thấy kết quả nào phù hợp' : 'Chưa có đề tài nào cần chấm trong danh mục này'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {gradingType === 'supervision'
                    ? 'Danh sách đề tài Hướng dẫn'
                    : gradingType === 'review'
                    ? 'Danh sách đề tài Phản biện'
                    : 'Danh sách đề tài Hội đồng bảo vệ'}
                </CardTitle>
                <CardDescription>
                  {gradingType === 'supervision'
                    ? 'Các đồ án bạn đang hướng dẫn'
                    : gradingType === 'review'
                    ? 'Các đồ án bạn được phân công phản biện'
                    : 'Các đồ án được xếp lịch bảo vệ trong hội đồng của bạn'}
                </CardDescription>
              </div>
              <Badge variant="blue">{filteredData.length} đề tài</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredData.map((item: any, idx: number) => {
                const topicTitle = item.topic_title || item.topicTitle;
                const thesisCode = item.thesis_code || item.thesisCode;
                const members = item.members || [];
                const isGraded = item.is_graded;

                return (
                  <div
                    key={item.thesis_id || item.assignment_id || idx}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border hover:border-primary/40 bg-muted/10 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        {gradingType === 'supervision' ? (
                          <GraduationCap className="w-5 h-5 text-primary" />
                        ) : gradingType === 'review' ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Shield className="w-5 h-5 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-sm line-clamp-1">{topicTitle}</h4>
                          <Badge variant={isGraded ? 'default' : 'secondary'} className="shrink-0">
                            {isGraded ? 'Đã chấm' : 'Chờ chấm'}
                          </Badge>
                          {gradingType === 'defense' && getRoleBadge(item.role_in_council)}
                        </div>

                        <p className="text-xs text-muted-foreground font-mono mb-1">
                          Mã đề tài: {thesisCode}
                        </p>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground">
                          <span>
                            Sinh viên: <strong className="text-foreground font-medium">{members.map((m: any) => `${m.full_name} (${m.student_code})`).join(', ')}</strong>
                          </span>

                          {gradingType === 'defense' && item.council_name && (
                            <span>• 🏛️ {item.council_name}</span>
                          )}

                          {gradingType === 'defense' && item.venue && (
                            <span>• 📍 {item.venue}</span>
                          )}

                          {gradingType === 'defense' && item.defense_date && (
                            <span>• 📅 {new Date(item.defense_date).toLocaleDateString('vi-VN')}</span>
                          )}

                          {gradingType === 'review' && item.supervisor && (
                            <span>• GVHD: {item.supervisor.full_name}</span>
                          )}
                        </div>

                        {isGraded && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
                            <span>Điểm đã chấm:</span>
                            <span className="text-sm bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded border border-green-200">
                              {gradingType === 'supervision'
                                ? item.supervision_score
                                : gradingType === 'review'
                                ? item.review_score
                                : item.my_score} / 10.0
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleOpenGradingForm(item)}
                        variant={isGraded ? 'outline' : 'default'}
                        className={!isGraded ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                      >
                        {isGraded ? 'Chấm lại / Xem' : 'Chấm điểm ngay'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Chấm điểm */}
      {selectedStudent && (
        <InstructorGradingForm
          isOpen={isGradingFormOpen}
          onClose={handleCloseGradingForm}
          onSuccess={handleGradingSuccess}
          studentData={{
            name: selectedStudent.members?.[0]?.full_name || '',
            studentId: selectedStudent.members?.[0]?.student_code || '',
            className: selectedStudent.members?.[0]?.class_name || '',
            topicName: selectedStudent.topic_title || selectedStudent.topicTitle,
            topicTitle: selectedStudent.topic_title || selectedStudent.topicTitle,
            thesisCode: selectedStudent.thesis_code || selectedStudent.thesisCode,
            thesisId: selectedStudent.thesis_id || selectedStudent.thesisId,
            assignmentId: selectedStudent.assignment_id,
            council_name: selectedStudent.council_name,
            venue: selectedStudent.venue,
            role_in_council: selectedStudent.role_in_council,
            members: selectedStudent.members,
            gradingType: gradingType,
            reviewAssignmentId: gradingType === 'review' ? (selectedStudent as ReviewStudent).review_assignment_id : undefined,
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
