import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Sliders, Settings, CheckCircle2, FileSpreadsheet, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Modal } from '@/components/ui/Modal';
import { topicRegistrationService, thesisRoundsService, instructorService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ProposedTopic, CreateProposedTopicRequest, ThesisRound } from '@/types/api';
import { ModalImportTopicsExcel } from './components/ModalImportTopicsExcel';

export function MyTopics() {
  const { user } = useAuth();
  const userRole = user?.role || 'instructor';
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<ProposedTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thesisRounds, setThesisRounds] = useState<ThesisRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'rounds' | 'topics'>('rounds');
  const [selectedRound, setSelectedRound] = useState<ThesisRound | null>(null);
  const [roundsLoading, setRoundsLoading] = useState(true);
  
  // Instructor profile & self-set quota states
  const [instructorProfile, setInstructorProfile] = useState<any>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaRound, setQuotaRound] = useState<ThesisRound | null>(null);
  const [myQuotaValue, setMyQuotaValue] = useState<number>(5);
  const [isSavingQuota, setIsSavingQuota] = useState(false);
  const [formData, setFormData] = useState<CreateProposedTopicRequest>({
    topic_code: '',
    topic_title: '',
    topic_description: '',
    objectives: '',
    student_requirements: '',
    technologies_used: '',
    topic_references: '',
    thesis_round_id: 1,
    group_mode: 'GROUP_ONLY',
    min_members: 2,
    max_members: 4,
    instructor_id: 0,
  });

  useEffect(() => {
    fetchThesisRounds();
    fetchInstructorProfile();
  }, []);

  const fetchInstructorProfile = async () => {
    try {
      const inst = await instructorService.getInstructorByUserId(user?.id || 0);
      setInstructorProfile(inst);
    } catch (e) {
      console.error('Lỗi khi lấy thông tin giảng viên:', e);
    }
  };

  const getMyAssignmentForRound = (roundId: number) => {
    if (!instructorProfile) return null;
    const assignments = instructorProfile.instructor_assignments || [];
    return assignments.find((a: any) => a.thesis_round_id === roundId);
  };

  const handleOpenQuotaModal = (round: ThesisRound) => {
    setQuotaRound(round);
    const currentAssign = getMyAssignmentForRound(round.id);
    setMyQuotaValue(currentAssign?.supervision_quota && currentAssign.supervision_quota > 0 ? currentAssign.supervision_quota : 5);
    setIsQuotaModalOpen(true);
  };

  const handleSaveMyQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaRound) return;
    try {
      setIsSavingQuota(true);
      await thesisRoundsService.updateMySupervisionQuota(quotaRound.id, myQuotaValue);
      toast.success(`Đã cập nhật hạn mức hướng dẫn cho đợt "${quotaRound.round_name}" thành công!`);
      setIsQuotaModalOpen(false);
      const [updatedInst] = await Promise.all([
        instructorService.getInstructorByUserId(user?.id || 0),
        fetchThesisRounds(),
      ]);
      setInstructorProfile(updatedInst);
    } catch (err: any) {
      console.error('Lỗi cập nhật hạn mức:', err);
      toast.error(err.message || 'Không thể cập nhật hạn mức hướng dẫn');
    } finally {
      setIsSavingQuota(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [selectedRoundId]);

  useEffect(() => {
    if (isCreateModalOpen && selectedRoundId) {
      setFormData(prev => ({ ...prev, thesis_round_id: selectedRoundId }));
    } else if (isCreateModalOpen && thesisRounds.length > 0) {
      setFormData(prev => ({ ...prev, thesis_round_id: thesisRounds[0].id }));
    }
  }, [isCreateModalOpen, selectedRoundId, thesisRounds]);

  const fetchThesisRounds = async () => {
    console.log('Calling API: /api/instructor/thesis-rounds');
    try {
      setRoundsLoading(true);
      const data = await thesisRoundsService.getThesisRoundsForInstructor();
      console.log('API Response:', data);
      console.log('Response type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      console.log('Keys:', Object.keys(data || {}));
      console.log('First item structure:', Array.isArray(data) && data[0] ? JSON.stringify(data[0], null, 2) : 'Not an array or empty');
      
      // Handle different response formats
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
      
      const activeRounds = roundsArray.filter((r: any) => r.status?.toUpperCase() === 'ACTIVE');
      console.log('Final rounds array:', activeRounds);
      setThesisRounds(activeRounds);
      
      // Auto-select the first round if available
      if (roundsArray.length > 0 && !selectedRoundId) {
        setSelectedRoundId(roundsArray[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching thesis rounds:', err);
      setError('Không thể tải danh sách đợt khóa luận');
    } finally {
      setRoundsLoading(false);
    }
  };

  const handleSelectRound = (round: ThesisRound) => {
    setSelectedRound(round);
    setSelectedRoundId(round.id);
    setViewMode('topics');
  };

  const handleBackToRounds = () => {
    setViewMode('rounds');
    setSelectedRound(null);
    setSelectedRoundId(null);
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const instructorId = user?.instructorId || user?.id;
      if (instructorId) {
        const data = await topicRegistrationService.getProposedTopicsByInstructor(instructorId, selectedRoundId || undefined);
        setTopics(data);
      }
    } catch (err) {
      setError('Không thể tải danh sách đề tài');
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const instructorId = user?.instructorId || user?.id;
      if (!instructorId) {
        setError('Không tìm thấy thông tin giảng viên');
        return;
      }

      const autoTopicCode = `DT-${Date.now().toString().slice(-6)}`;

      const topicData: CreateProposedTopicRequest = {
        ...formData,
        topic_code: autoTopicCode,
        instructor_id: instructorId,
        thesis_round_id: selectedRoundId || formData.thesis_round_id,
      };

      await topicRegistrationService.createProposedTopic(topicData);
      setIsCreateModalOpen(false);
      setFormData({
        topic_code: '',
        topic_title: '',
        topic_description: '',
        objectives: '',
        student_requirements: '',
        technologies_used: '',
        topic_references: '',
        thesis_round_id: selectedRoundId || 1,
        group_mode: 'GROUP_ONLY',
        min_members: 2,
        max_members: 4,
        instructor_id: 0,
      });
      fetchTopics();
    } catch (err) {
      setError('Không thể tạo đề tài');
      console.error('Error creating topic:', err);
    }
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'Giảng viên'}
      title={viewMode === 'rounds' ? 'Đợt khóa luận' : selectedRound?.round_name || 'Đề tài của tôi'}
      subtitle={viewMode === 'rounds' ? 'Chọn đợt khóa luận để xem đề tài' : 'Quản lý các đề tài đã đề xuất'}
      actions={
        viewMode === 'topics' ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleBackToRounds}>
              ← Quay lại
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsImportExcelModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Nhập từ Excel
            </Button>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Đề xuất đề tài mới
            </Button>
          </div>
        ) : null
      }
    >
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Thesis Round Filter */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Đợt khóa luận:</label>
        {roundsLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải đợt khóa luận...</p>
        ) : thesisRounds.length > 0 ? (
          <select
            className="w-full max-w-xs px-3 py-2 border border-border rounded-md bg-background"
            value={selectedRoundId || ''}
            onChange={(e) => {
              const roundId = e.target.value ? Number(e.target.value) : null;
              setSelectedRoundId(roundId);
              if (roundId) {
                const round = thesisRounds.find(r => r.id === roundId);
                if (round) {
                  setSelectedRound(round);
                  setViewMode('topics');
                }
              }
            }}
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

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : (
        <>
          {viewMode === 'rounds' ? (
            /* Rounds List */
            <>
              {thesisRounds.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Không có đợt khóa luận nào đang mở</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {thesisRounds.map((round) => {
                    const roundData = round as any;
                    return (
                    <Card
                      key={round.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleSelectRound(round)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {roundData.round_name || roundData.roundName || `Đợt ${round.id}`}
                        </CardTitle>
                        <CardDescription>
                          {roundData.academic_year || roundData.academicYear || 'N/A'} - HK{roundData.semester || 'N/A'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bắt đầu:</span>
                            <span className="font-medium">
                              {roundData.start_date ? new Date(roundData.start_date).toLocaleDateString('vi-VN') : 
                               roundData.startDate ? new Date(roundData.startDate).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kết thúc:</span>
                            <span className="font-medium">
                              {roundData.end_date ? new Date(roundData.end_date).toLocaleDateString('vi-VN') : 
                               roundData.endDate ? new Date(roundData.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hạn đăng ký:</span>
                            <span className="font-medium">
                              {roundData.registration_deadline ? new Date(roundData.registration_deadline).toLocaleDateString('vi-VN') : 
                               roundData.registrationDeadline ? new Date(roundData.registrationDeadline).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                          </div>
                          <div className="pt-2 flex items-center justify-between border-t border-border/50">
                            <Badge variant={roundData.status === 'Active' ? 'default' : 'secondary'}>
                              {roundData.status || 'Unknown'}
                            </Badge>
                            {(() => {
                              const myAssign = getMyAssignmentForRound(round.id);
                              if (!myAssign) {
                                return (
                                  <span className="text-[11px] text-muted-foreground">
                                    Chưa tham gia đợt
                                  </span>
                                );
                              }
                              const quota = myAssign.supervision_quota;
                              return (
                                <div className="flex items-center gap-1.5">
                                  {quota && quota > 0 ? (
                                    <Badge variant="outline" className="text-[11px] text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                                      Hạn mức: {quota} đề tài
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-300 dark:border-amber-700">
                                      Chưa set hạn mức
                                    </Badge>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[11px] px-1.5 text-primary hover:bg-primary/10 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenQuotaModal(round);
                                    }}
                                    title="Tự thiết lập hạn mức hướng dẫn"
                                  >
                                    <Sliders className="w-3 h-3" />
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Topics List */
            <>
              {/* Quota Banner */}
              {selectedRound && (
                <Card className="mb-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-primary/5 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-primary/10 border-blue-200 dark:border-blue-800/40 shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            Hạn mức hướng dẫn của bạn trong đợt này
                          </h4>
                          {(() => {
                            const assign = getMyAssignmentForRound(selectedRound.id);
                            if (assign && assign.supervision_quota && assign.supervision_quota > 0) {
                              return (
                                <Badge variant="emerald" className="text-xs font-semibold">
                                  {assign.supervision_quota} đề tài tối đa
                                </Badge>
                              );
                            }
                            return (
                              <Badge variant="amber" className="text-xs font-medium">
                                Chưa đăng ký hạn mức
                              </Badge>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(() => {
                            const assign = getMyAssignmentForRound(selectedRound.id);
                            if (assign && assign.supervision_quota && assign.supervision_quota > 0) {
                              return `Bạn đang hướng dẫn: ${assign.current_load || 0} / ${assign.supervision_quota} đề tài. Sinh viên chỉ có thể đăng ký trong giới hạn này.`;
                            }
                            return 'Bạn chưa đặt hạn mức hướng dẫn. Hãy tự chủ động thiết lập số lượng đề tài bạn có thể nhận hướng dẫn.';
                          })()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenQuotaModal(selectedRound)}
                      className="shrink-0 flex items-center gap-1.5 font-medium border-blue-300 dark:border-blue-700 hover:bg-blue-100/50 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-primary" />
                      {getMyAssignmentForRound(selectedRound.id)?.supervision_quota ? 'Thay đổi hạn mức' : 'Tự đặt hạn mức'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Search */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm đề tài..." className="pl-10" />
                  </div>
                </CardContent>
              </Card>

              {/* Topics Grid */}
              {topics.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-base text-foreground">Chưa có đề tài nào trong đợt này</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                      Bạn có thể đề xuất đề tài mới từng đề tài một hoặc tải lên danh sách nhiều đề tài cùng lúc bằng file Excel.
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImportExcelModalOpen(true)}
                        className="gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Nhập danh sách từ Excel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Đề xuất đề tài mới
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {topics.map((topic) => (
                    <Card key={topic.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-base">{topic.topic_title}</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground">Mã: {topic.topic_code}</p>
                          </div>
                          <Badge variant={topic.is_taken ? 'secondary' : 'outline'}>
                            {topic.is_taken ? 'Đã có nhóm' : 'Còn trống'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {topic.topic_description}
                        </p>

                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-2">Công nghệ</p>
                          <div className="flex flex-wrap gap-2">
                            {topic.technologies_used && topic.technologies_used.split(',').map((tech, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tech.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Chế độ: </span>
                            <span className="font-medium">
                              {topic.proposed_topic_rules?.group_mode === 'INDIVIDUAL_ONLY' ? 'Cá nhân' :
                               topic.proposed_topic_rules?.group_mode === 'GROUP_ONLY' ? 'Nhóm' : 'Cả hai'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Thành viên: </span>
                            <span className="font-medium">
                              {topic.proposed_topic_rules?.min_members}-{topic.proposed_topic_rules?.max_members}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="flex-1">
                            <Eye className="w-4 h-4" />
                            Xem
                          </Button>
                          <Button size="sm" variant="ghost" className="flex-1">
                            <Edit className="w-4 h-4" />
                            Sửa
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create Topic Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Đề xuất đề tài mới"
        size="lg"
      >
        <form onSubmit={handleCreateTopic} className="space-y-6">
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium mb-2">Tên đề tài</label>
              <Input
                placeholder="Nhập tên đề tài..."
                required
                value={formData.topic_title}
                onChange={(e) => setFormData({ ...formData, topic_title: e.target.value })}
              />
            </div>
            {!selectedRoundId && (
              <div>
                <label className="block text-sm font-medium mb-2">Đợt khóa luận</label>
                <Select
                  value={formData.thesis_round_id?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, thesis_round_id: parseInt(value) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn đợt khóa luận..." />
                  </SelectTrigger>
                  <SelectContent>
                    {thesisRounds.map((round) => (
                      <SelectItem key={round.id} value={round.id.toString()}>
                        {round.round_name} ({round.round_code || `DK${round.id}`}) - {round.academic_year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mô tả đề tài</label>
            <textarea
              className="w-full px-3 py-2 bg-input-background border border-input rounded-lg min-h-32 resize-y"
              placeholder="Mô tả chi tiết về đề tài, mục tiêu, yêu cầu..."
              required
              value={formData.topic_description}
              onChange={(e) => setFormData({ ...formData, topic_description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mục tiêu</label>
            <textarea
              className="w-full px-3 py-2 bg-input-background border border-input rounded-lg min-h-24 resize-y"
              placeholder="Các mục tiêu cần đạt được..."
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Yêu cầu sinh viên</label>
            <textarea
              className="w-full px-3 py-2 bg-input-background border border-input rounded-lg min-h-24 resize-y"
              placeholder="Kiến thức, kỹ năng cần có..."
              value={formData.student_requirements}
              onChange={(e) => setFormData({ ...formData, student_requirements: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Công nghệ sử dụng</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-input-background border border-input rounded-lg"
              placeholder="VD: Python, React, MongoDB (cách nhau bởi dấu phẩy)"
              value={formData.technologies_used}
              onChange={(e) => setFormData({ ...formData, technologies_used: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tài liệu tham khảo</label>
            <textarea
              className="w-full px-3 py-2 bg-input-background border border-input rounded-lg min-h-24 resize-y"
              placeholder="Các tài liệu tham khảo..."
              value={formData.topic_references}
              onChange={(e) => setFormData({ ...formData, topic_references: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Quy tắc nhóm</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Chế độ nhóm</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="groupMode"
                    value="INDIVIDUAL_ONLY"
                    checked={formData.group_mode === 'INDIVIDUAL_ONLY'}
                    onChange={(e) => setFormData({ ...formData, group_mode: e.target.value as any })}
                  />
                  <span className="text-sm">Cá nhân</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="groupMode"
                    value="GROUP_ONLY"
                    checked={formData.group_mode === 'GROUP_ONLY'}
                    onChange={(e) => setFormData({ ...formData, group_mode: e.target.value as any })}
                  />
                  <span className="text-sm">Nhóm</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="groupMode"
                    value="BOTH"
                    checked={formData.group_mode === 'BOTH'}
                    onChange={(e) => setFormData({ ...formData, group_mode: e.target.value as any })}
                  />
                  <span className="text-sm">Cả hai</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Số thành viên tối thiểu</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.min_members}
                  onChange={(e) => setFormData({ ...formData, min_members: Math.max(1, parseInt(e.target.value) || 1) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Số thành viên tối đa</label>
                <Input
                  type="number"
                  min={formData.min_members || 1}
                  step="1"
                  value={formData.max_members}
                  onChange={(e) => setFormData({ ...formData, max_members: Math.max(formData.min_members || 1, parseInt(e.target.value) || 1) })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Tạo đề tài</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Giảng viên tự thiết lập Hạn mức Hướng dẫn */}
      <Modal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        title={`Thiết lập Hạn mức Hướng dẫn — ${quotaRound?.round_name || 'Đợt đề tài'}`}
      >
        <form onSubmit={handleSaveMyQuota} className="space-y-4">
          <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">
              Thông tin đăng ký hạn mức hướng dẫn:
            </p>
            <p>
              Hạn mức này đại diện cho số lượng đề tài / nhóm sinh viên tối đa mà bạn có thể đảm nhận hướng dẫn trong đợt khóa luận này.
            </p>
            <p>
              Sinh viên đăng ký vào đề tài của bạn sẽ bị giới hạn bởi chỉ tiêu này. Bạn có thể chủ động cập nhật bất cứ lúc nào trước khi chốt danh sách.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Số lượng đề tài / nhóm hướng dẫn tối đa <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={30}
                value={myQuotaValue}
                onChange={(e) => setMyQuotaValue(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                className="w-32 text-center text-base font-bold"
                required
              />
              <span className="text-sm text-muted-foreground">đề tài / nhóm sinh viên</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Khuyến nghị: từ 3 đến 10 đề tài tùy theo thời gian và kế hoạch giảng dạy của bạn.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsQuotaModalOpen(false)}
              disabled={isSavingQuota}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSavingQuota} className="gap-2">
              {isSavingQuota ? 'Đang lưu...' : 'Lưu hạn mức'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tải lên danh sách Đề tài từ file Excel */}
      <ModalImportTopicsExcel
        isOpen={isImportExcelModalOpen}
        onClose={() => setIsImportExcelModalOpen(false)}
        onSuccess={() => {
          fetchTopics();
          fetchInstructorProfile();
        }}
        selectedRound={selectedRound}
        quotaInfo={(() => {
          if (!selectedRound) return null;
          const assign = getMyAssignmentForRound(selectedRound.id);
          return {
            quota: assign?.supervision_quota || 0,
            currentLoad: assign?.current_load || topics.length,
          };
        })()}
      />
    </PageLayout>
  );
}
