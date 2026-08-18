import { useState, useEffect } from 'react';
import { UserPlus, Search, Check, Users, FileText, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { topicRegistrationService, thesisRoundsService, instructorService, gradingService } from '@/plugins/api';
import type { ThesisRound, TopicRegistration, CreateReviewAssignmentRequest } from '@/types/api';

type TabType = 'individual' | 'group';

interface Instructor {
  id: number;
  instructor_code: string;
  users: {
    full_name: string;
    email: string;
  };
  degree?: string;
  academic_title?: string;
  specialization?: string;
}

export function HeadAssignReviewers() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRounds, setIsFetchingRounds] = useState(false);
  const [isFetchingRegistrations, setIsFetchingRegistrations] = useState(false);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [rounds, setRounds] = useState<ThesisRound[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedRound, setSelectedRound] = useState<ThesisRound | null>(null);
  const [selectedThesis, setSelectedThesis] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Form phân công 2 phản biện
  const [reviewer1Id, setReviewer1Id] = useState<number | null>(null);
  const [reviewer2Id, setReviewer2Id] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<string>('');

  // Fetch thesis rounds on component mount
  useEffect(() => {
    const fetchRounds = async () => {
      setIsFetchingRounds(true);
      setError(null);
      try {
        const data = await thesisRoundsService.getThesisRoundsForHead();

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

        const activeRounds = roundsArray.filter((round: any) =>
          round.status?.toUpperCase() === 'ACTIVE'
        );

        setRounds(activeRounds.length > 0 ? activeRounds : roundsArray);
        if (activeRounds.length > 0) {
          setSelectedRound(activeRounds[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách đợt khóa luận');
      } finally {
        setIsFetchingRounds(false);
      }
    };

    fetchRounds();
  }, []);

  // Fetch registrations when a round is selected
  const fetchRegistrations = async () => {
    if (!selectedRound) return;
    setIsFetchingRegistrations(true);
    setError(null);
    try {
      const data = await topicRegistrationService.getPendingRegistrationsForHead(user?.id || 0);

      const filteredData = (Array.isArray(data) ? data : []).filter((reg: any) => {
        const isApproved = reg.instructor_status === 'APPROVED' && reg.head_status === 'APPROVED';
        const isCorrectRound = reg.thesis_round_id === selectedRound.id;

        if (!isApproved || !isCorrectRound) return false;

        if (activeTab === 'individual') {
          return !reg.thesis_group_id || reg.thesis_groups?.group_type === 'INDIVIDUAL_ONLY';
        } else {
          return reg.thesis_group_id && reg.thesis_groups?.group_type === 'GROUP_ONLY';
        }
      });

      setRegistrations(filteredData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đề tài');
    } finally {
      setIsFetchingRegistrations(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [selectedRound, activeTab, user]);

  // Fetch instructors when modal opens
  useEffect(() => {
    if (isAssignModalOpen) {
      const fetchInstructors = async () => {
        setIsFetchingInstructors(true);
        try {
          const data = await instructorService.getInstructors();
          const instructorsArray = Array.isArray(data) ? data : (data as any)?.data || [];
          setInstructors(instructorsArray);
        } catch (err: any) {
          console.error('Error fetching instructors:', err);
        } finally {
          setIsFetchingInstructors(false);
        }
      };

      fetchInstructors();
    }
  }, [isAssignModalOpen]);

  const filteredRegistrations = registrations.filter((reg) => {
    const searchLower = searchTerm.toLowerCase();
    const title = reg.proposed_topics?.topic_title || reg.self_proposed_title || '';
    const studentName = reg.thesis_groups?.thesis_group_members?.[0]?.students?.users?.full_name || '';
    const studentCode = reg.thesis_groups?.thesis_group_members?.[0]?.students?.student_code || '';

    return (
      title.toLowerCase().includes(searchLower) ||
      studentName.toLowerCase().includes(searchLower) ||
      studentCode.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectRound = (roundId: string) => {
    const round = rounds.find((r) => r.id === Number(roundId));
    setSelectedRound(round || null);
    setRegistrations([]);
  };

  const handleOpenAssignModal = (thesis: any) => {
    setSelectedThesis(thesis);
    setReviewer1Id(null);
    setReviewer2Id(null);
    setDeadline('');
    setIsAssignModalOpen(true);
  };

  const handleAssignReviewers = async () => {
    if (!selectedThesis) return;

    if (!reviewer1Id || !reviewer2Id) {
      setError('Quy định phản biện bắt buộc phải có đủ 2 Cán bộ Phản biện (PB 1 và PB 2).');
      return;
    }

    if (reviewer1Id === reviewer2Id) {
      setError('Cán bộ Phản biện 1 và Phản biện 2 không được là cùng một người.');
      return;
    }

    const supervisorId = selectedThesis.instructors?.id || selectedThesis.instructor_id;
    if (reviewer1Id === supervisorId || reviewer2Id === supervisorId) {
      setError('Cán bộ phản biện không được trùng với Giảng viên hướng dẫn của đề tài.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Phân công Phản biện 1
      await gradingService.createReviewAssignment({
        thesis_id: selectedThesis.id,
        reviewer_id: reviewer1Id,
        review_order: 1,
        review_deadline: deadline || undefined,
      });

      // Phân công Phản biện 2
      await gradingService.createReviewAssignment({
        thesis_id: selectedThesis.id,
        reviewer_id: reviewer2Id,
        review_order: 2,
        review_deadline: deadline || undefined,
      });

      setSuccessMessage('Phân công thành công 2 cán bộ phản biện cho đề tài!');
      setIsAssignModalOpen(false);
      setSelectedThesis(null);
      fetchRegistrations();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi phân công giáo viên phản biện');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'Trưởng bộ môn'}
      title="Phân công giáo viên phản biện"
      subtitle="Phân công đủ 2 Cán bộ phản biện (PB 1 & PB 2) cho từng đề tài khóa luận"
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'individual' ? 'default' : 'outline'}
          onClick={() => setActiveTab('individual')}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Đề tài cá nhân
        </Button>
        <Button
          variant={activeTab === 'group' ? 'default' : 'outline'}
          onClick={() => setActiveTab('group')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Đề tài nhóm
        </Button>
      </div>

      {/* Select Thesis Round */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Chọn đợt khóa luận</CardTitle>
          <CardDescription>
            Chọn đợt khóa luận để phân công 2 cán bộ phản biện cho {activeTab === 'individual' ? 'đề tài cá nhân' : 'đề tài nhóm'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetchingRounds ? (
            <p className="text-xs text-muted-foreground">Đang tải danh sách đợt khóa luận...</p>
          ) : (
            <Select value={selectedRound?.id.toString() || ''} onValueChange={handleSelectRound}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn đợt khóa luận..." />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id.toString()}>
                    {round.round_name} ({round.round_code || 'ĐK' + round.id}) - {round.academic_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 text-green-800 dark:text-green-300 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-800 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thesis List */}
      {selectedRound && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {activeTab === 'individual' ? 'Danh sách đề tài cá nhân' : 'Danh sách đề tài nhóm'}
                </CardTitle>
                <CardDescription>
                  Đợt: {selectedRound.round_name} • Yêu cầu phân công 2 Cán bộ phản biện/đề tài
                </CardDescription>
              </div>
              <Badge variant="blue">{filteredRegistrations.length} đề tài</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên đề tài, sinh viên, MSSV..."
                  className="pl-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            {isFetchingRegistrations ? (
              <p className="text-center py-12 text-muted-foreground text-sm">Đang tải danh sách đề tài...</p>
            ) : filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Không tìm thấy đề tài nào phù hợp' : 'Không có đề tài nào cần phân công phản biện'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRegistrations.map((thesis) => {
                  const title = thesis.proposed_topics?.topic_title || thesis.self_proposed_title || '';
                  const members = thesis.thesis_groups?.thesis_group_members || [];
                  const studentNames = members.map((m: any) => `${m.students?.users?.full_name} (${m.students?.student_code})`).join(', ') || 'Sinh viên';
                  const supervisorName = thesis.instructors?.users?.full_name || 'Chưa phân công';

                  return (
                    <div
                      key={thesis.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/40 bg-card hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1 mb-1">{title}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs text-muted-foreground">
                          <p>
                            Sinh viên: <strong className="text-foreground font-medium">{studentNames}</strong>
                          </p>
                          <p>
                            GVHD: <strong className="text-foreground font-medium">{supervisorName}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Button size="sm" onClick={() => handleOpenAssignModal(thesis)} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <UserPlus className="w-4 h-4 mr-1.5" />
                          Phân công 2 Phản biện
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Phân công 2 Phản biện */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Phân công 2 Cán bộ phản biện cho đề tài"
        size="lg"
      >
        {selectedThesis && (
          <div className="space-y-4">
            <div className="p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-1">
              <p>
                <strong className="text-foreground">Đề tài:</strong> {selectedThesis.proposed_topics?.topic_title || selectedThesis.self_proposed_title}
              </p>
              <p>
                <strong className="text-foreground">GVHD:</strong> {selectedThesis.instructors?.users?.full_name || 'N/A'} (Không được trùng với cán bộ phản biện)
              </p>
            </div>

            {/* Chọn Cán bộ Phản biện 1 */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-blue-700 dark:text-blue-400">
                1. Cán bộ Phản biện 1 <span className="text-destructive">*</span>
              </label>
              <Select
                value={reviewer1Id ? reviewer1Id.toString() : undefined}
                onValueChange={(val) => setReviewer1Id(Number(val))}
                disabled={isFetchingInstructors}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isFetchingInstructors ? 'Đang tải...' : 'Chọn Cán bộ Phản biện 1'} />
                </SelectTrigger>
                <SelectContent>
                  {instructors
                    .filter((inst) => inst.id !== selectedThesis.instructors?.id && inst.id !== reviewer2Id)
                    .map((inst) => (
                      <SelectItem key={inst.id} value={inst.id.toString()}>
                        {inst.users.full_name} ({inst.instructor_code}) {inst.specialization ? ` - ${inst.specialization}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chọn Cán bộ Phản biện 2 */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-purple-700 dark:text-purple-400">
                2. Cán bộ Phản biện 2 <span className="text-destructive">*</span>
              </label>
              <Select
                value={reviewer2Id ? reviewer2Id.toString() : undefined}
                onValueChange={(val) => setReviewer2Id(Number(val))}
                disabled={isFetchingInstructors}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isFetchingInstructors ? 'Đang tải...' : 'Chọn Cán bộ Phản biện 2'} />
                </SelectTrigger>
                <SelectContent>
                  {instructors
                    .filter((inst) => inst.id !== selectedThesis.instructors?.id && inst.id !== reviewer1Id)
                    .map((inst) => (
                      <SelectItem key={inst.id} value={inst.id.toString()}>
                        {inst.users.full_name} ({inst.instructor_code}) {inst.specialization ? ` - ${inst.specialization}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hạn chót phản biện */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Hạn chót nộp phiếu phản biện</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} disabled={isLoading}>
                Hủy
              </Button>
              <Button
                onClick={handleAssignReviewers}
                disabled={isLoading || !reviewer1Id || !reviewer2Id}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Đang phân công...' : 'Xác nhận phân công 2 Phản biện'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
