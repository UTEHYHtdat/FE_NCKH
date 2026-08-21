import { Search, Eye, MessageSquare, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { thesisRoundsService, instructorService } from '@/plugins/api';
import type { ThesisRound } from '@/types/api';

export function MyStudents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || 'instructor';

  // Thesis rounds
  const [thesisRounds, setThesisRounds] = useState<ThesisRound[]>([]);
  const [selectedThesisRoundId, setSelectedThesisRoundId] = useState<
    number | undefined
  >(undefined);
  const [roundsLoading, setRoundsLoading] = useState(true);

  // Supervised students
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Fetch active thesis rounds on component mount
  useEffect(() => {
    const fetchThesisRounds = async () => {
      try {
        setRoundsLoading(true);
        const data = await thesisRoundsService.getThesisRoundsForInstructor();

        // Handle different response formats
        let roundsArray: ThesisRound[] = [];
        if (Array.isArray(data)) {
          roundsArray = data;
        } else if (data && typeof data === 'object') {
          const dataObj = data as any;
          if (dataObj.data && Array.isArray(dataObj.data)) {
            roundsArray = dataObj.data;
          } else if (
            dataObj.success &&
            dataObj.data &&
            Array.isArray(dataObj.data)
          ) {
            roundsArray = dataObj.data;
          }
        }

        setThesisRounds(roundsArray);
        // Auto-select the first round if available
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

  // Fetch supervised students when thesis round changes or on mount
  useEffect(() => {
    const fetchSupervisedStudents = async () => {
      try {
        setStudentsLoading(true);
        const instructorId = user?.instructorId || user?.id || 0;

        if (!instructorId) {
          console.warn('No instructor ID found');
          setStudents([]);
          return;
        }

        const params: any = {};
        if (selectedThesisRoundId) {
          params.thesis_round_id = selectedThesisRoundId;
        }

        const data = await instructorService.getSupervisedStudents(
          instructorId,
          params,
        );

        // Transform API data to match UI format
        const transformedStudents = data.map((item: any) => ({
          id: item.thesis.id,
          groupCode: item.thesis_group?.group_code || 'N/A',
          groupName: item.thesis_group?.group_name || 'Nhóm cá nhân',
          topic: item.thesis.topic_title,
          status: item.thesis.status,
          studentId: item.student.id,
          studentName: item.student.users?.full_name || 'Unknown',
          studentCode: item.student.student_code,
          className: item.student.classes?.class_name || 'N/A',
          role: item.thesis.role,
          supervisionScore: item.thesis.supervision_score || 0,
          finalScore: item.thesis.final_score || 0,
          thesisRoundName: item.thesis_round?.round_name || 'N/A',
        }));

        setStudents(transformedStudents);
      } catch (error) {
        console.error('Error fetching supervised students:', error);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchSupervisedStudents();
  }, [selectedThesisRoundId, user]);

  const getReportStatusText = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: 'Đã duyệt',
      NEED_CHANGES: 'Cần sửa',
      PENDING: 'Chờ duyệt',
    };
    return map[status] || status;
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'TS. Nguyễn Văn A'}
      title="Sinh viên hướng dẫn"
      subtitle="Quản lý sinh viên đang hướng dẫn"
    >
      {/* Thesis Round Filter */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Đợt khóa luận:</label>
        {roundsLoading ? (
          <p className="text-sm text-muted-foreground">
            Đang tải đợt khóa luận...
          </p>
        ) : thesisRounds.length > 0 ? (
          <select
            className="w-full max-w-xs px-3 py-2 border border-border rounded-md bg-background"
            value={selectedThesisRoundId || ''}
            onChange={(e) =>
              setSelectedThesisRoundId(
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          >
            {thesisRounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.round_name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-muted-foreground">
            Không có đợt khóa luận nào
          </p>
        )}
      </div>

      {/* Loading state */}
      {studentsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">
            Đang tải danh sách sinh viên...
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-1">
                  {students.length}/12
                </div>
                <p className="text-sm text-muted-foreground">
                  Sinh viên đang HD
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {students.filter((s) => s.status === 'IN_PROGRESS').length}
                </div>
                <p className="text-sm text-muted-foreground">Đang thực hiện</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {students.filter((s) => s.status === 'COMPLETED').length}
                </div>
                <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {students.length > 0
                    ? (
                        students.reduce(
                          (sum, s) => sum + (s.supervisionScore || 0),
                          0,
                        ) / students.length
                      ).toFixed(1)
                    : '0.0'}
                </div>
                <p className="text-sm text-muted-foreground">
                  Điểm TB hướng dẫn
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm nhóm hoặc sinh viên..."
                    className="pl-10"
                  />
                </div>
                <select
                  className="px-3 py-2 bg-background border border-input rounded-lg"
                  defaultValue="all"
                >
                  <option value="all">Tất cả đợt khóa luận</option>
                  {thesisRounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.round_name}
                    </option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 bg-background border border-input rounded-lg"
                  defaultValue="all"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="IN_PROGRESS">Đang thực hiện</option>
                  <option value="COMPLETED">Hoàn thành</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Students List Table */}
          <div className="w-full">
            {students.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Không tìm thấy sinh viên nào
                  </h3>
                  <p className="text-muted-foreground">
                    Thử thay đổi đợt khóa luận hoặc liên hệ quản trị viên
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                      <tr>
                        <th className="py-3.5 px-4">Sinh viên</th>
                        <th className="py-3.5 px-4">Lớp</th>
                        <th className="py-3.5 px-4">Đề tài & Đợt</th>
                        <th className="py-3.5 px-4 text-center">Trạng thái</th>
                        <th className="py-3.5 px-4 text-center">Điểm HD</th>
                        <th className="py-3.5 px-4 text-center">Điểm TK</th>
                        <th className="py-3.5 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student) => (
                        <tr
                          key={student.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {/* Sinh viên */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={student.studentName} size="sm" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {student.studentName}
                                  </span>
                                  {student.role === 'LEADER' && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      Trưởng nhóm
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {student.studentCode}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Lớp */}
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                            {student.className}
                          </td>

                          {/* Đề tài & Đợt */}
                          <td className="py-3 px-4 max-w-xs">
                            <p
                              className="font-medium text-foreground line-clamp-1"
                              title={student.topic}
                            >
                              {student.topic}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {student.thesisRoundName}
                            </p>
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <Badge
                              variant={getStatusBadgeVariant(student.status)}
                            >
                              {student.status === 'IN_PROGRESS'
                                ? 'Đang thực hiện'
                                : 'Đã hoàn thành'}
                            </Badge>
                          </td>

                          {/* Điểm hướng dẫn */}
                          <td className="py-3 px-4 text-center font-semibold text-green-600">
                            {student.supervisionScore ?? 0}
                          </td>

                          {/* Điểm tổng kết */}
                          <td className="py-3 px-4 text-center font-semibold text-blue-600">
                            {student.finalScore ?? '-'}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(
                                    `/students/${student.studentId}/reports`,
                                  )
                                }
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Báo cáo
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
}
