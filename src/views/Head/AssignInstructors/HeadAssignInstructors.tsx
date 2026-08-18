import { useState, useEffect } from 'react';
import { UserPlus, Search, Check, Users, FileText, AlertCircle, Sparkles, BookOpen, GraduationCap, CheckCircle2, RefreshCw } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { thesisRoundsService, instructorService, topicRegistrationService, apiClient } from '@/plugins/api';
import type { ThesisRound } from '@/types/api';

type TopicCategory = 'KLTN' | 'NCKH';

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

export function HeadAssignInstructors() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';

  const [activeCategory, setActiveCategory] = useState<TopicCategory>('KLTN');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRounds, setIsFetchingRounds] = useState(false);
  const [isFetchingTopics, setIsFetchingTopics] = useState(false);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [rounds, setRounds] = useState<ThesisRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<ThesisRound | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);

  // 1. Tải danh sách đợt
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

        const activeRounds = roundsArray.filter((r: any) => r.status?.toUpperCase() === 'ACTIVE');
        setRounds(activeRounds.length > 0 ? activeRounds : roundsArray);
        if (activeRounds.length > 0) {
          setSelectedRound(activeRounds[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách đợt');
      } finally {
        setIsFetchingRounds(false);
      }
    };

    fetchRounds();
  }, []);

  // 2. Tải danh sách đề tài & nhóm sinh viên
  const fetchTopics = async () => {
    if (!selectedRound) return;
    setIsFetchingTopics(true);
    setError(null);
    try {
      const data = await topicRegistrationService.getRegistrationsForHead();
      const rawTopics = Array.isArray(data) ? data : (data as any)?.data || [];

      // Lọc theo round và loại hình (KLTN vs NCKH)
      const filtered = rawTopics.filter((t: any) => {
        const isSameRound = t.thesis_round_id === selectedRound.id;
        const typeCode = (t.thesis_groups?.thesis_rounds?.thesis_types?.type_code || t.thesis_types?.type_code || 'KLTN').toUpperCase();
        
        if (!isSameRound) return false;
        if (activeCategory === 'KLTN') {
          return typeCode === 'KLTN' || typeCode.includes('THESIS') || typeCode.includes('KHOA_LUAN');
        } else {
          return typeCode !== 'KLTN' && !typeCode.includes('KHOA_LUAN');
        }
      });

      setTopics(filtered.length > 0 ? filtered : rawTopics.filter((t: any) => t.thesis_round_id === selectedRound.id));
    } catch (err: any) {
      console.error('Error fetching registrations:', err);
      // Fallback: Thử tải qua API đề tài
      try {
        const res = await apiClient.get<any>(`/api/v1/thesis/admin/theses?thesisRoundId=${selectedRound.id}`);
        setTopics(Array.isArray(res) ? res : res.data || []);
      } catch {
        setTopics([]);
      }
    } finally {
      setIsFetchingTopics(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [selectedRound, activeCategory]);

  // 3. Tải danh sách giảng viên khi mở modal
  useEffect(() => {
    if (isAssignModalOpen) {
      const fetchInstructors = async () => {
        setIsFetchingInstructors(true);
        try {
          const data = await instructorService.getInstructors();
          const list = Array.isArray(data) ? data : (data as any)?.data || [];
          setInstructors(list);
        } catch (err) {
          console.error('Error fetching instructors:', err);
        } finally {
          setIsFetchingInstructors(false);
        }
      };

      fetchInstructors();
    }
  }, [isAssignModalOpen]);

  const handleOpenAssignModal = (topic: any) => {
    setSelectedTopic(topic);
    setSelectedInstructorId(topic.instructor_id || topic.instructors?.id || null);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedTopic || !selectedInstructorId) {
      setError('Vui lòng chọn một Giảng viên hướng dẫn');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Cập nhật GVHD cho đề tài đăng ký
      await apiClient.put(`/api/admin/topic-registrations/${selectedTopic.id}`, {
        instructor_id: selectedInstructorId,
      });

      setSuccessMessage('Phân công Giảng viên hướng dẫn thành công!');
      setIsAssignModalOpen(false);
      setSelectedTopic(null);
      fetchTopics();
    } catch (err: any) {
      // Thử endpoint fallback
      try {
        await apiClient.put(`/api/v1/thesis/admin/theses/${selectedTopic.id || selectedTopic.thesis_id}/assign-supervisor`, {
          supervisorId: selectedInstructorId,
        });
        setSuccessMessage('Phân công Giảng viên hướng dẫn thành công!');
        setIsAssignModalOpen(false);
        setSelectedTopic(null);
        fetchTopics();
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || err.message || 'Lỗi khi phân công GVHD');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTopics = topics.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    const title = (t.proposed_topics?.topic_title || t.topic_title || t.self_proposed_title || '').toLowerCase();
    const groupName = (t.thesis_groups?.group_name || '').toLowerCase();
    const members = (t.thesis_groups?.thesis_group_members || t.thesis_members || [])
      .map((m: any) => `${m.students?.users?.full_name} ${m.students?.student_code}`)
      .join(' ')
      .toLowerCase();

    return title.includes(searchLower) || groupName.includes(searchLower) || members.includes(searchLower);
  });

  const assignedCount = topics.filter((t) => !!(t.instructor_id || t.instructors?.id || t.supervisor_id)).length;
  const unassignedCount = topics.length - assignedCount;

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'Trưởng bộ môn'}
      title="Phân công Giảng viên Hướng dẫn"
      subtitle="Phân công GVHD cho từng Nhóm sinh viên ứng với Đề tài Khóa luận và NCKH"
    >
      {/* 2 Tab: Khóa luận tốt nghiệp & NCKH */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeCategory === 'KLTN' ? 'default' : 'outline'}
          onClick={() => setActiveCategory('KLTN')}
          className="flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4" />
          Khóa luận tốt nghiệp
        </Button>
        <Button
          variant={activeCategory === 'NCKH' ? 'default' : 'outline'}
          onClick={() => setActiveCategory('NCKH')}
          className="flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Nghiên cứu khoa học (NCKH) & Đồ án
        </Button>
      </div>

      {/* Thống kê nhanh & Đợt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Chọn đợt:
            </label>
            {isFetchingRounds ? (
              <p className="text-xs text-muted-foreground">Đang tải đợt...</p>
            ) : (
              <Select
                value={selectedRound?.id.toString() || ''}
                onValueChange={(val) => setSelectedRound(rounds.find((r) => r.id === Number(val)) || null)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Chọn đợt..." />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id.toString()}>
                      {round.round_name} ({round.round_code || 'ĐK' + round.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Đã phân công GVHD</p>
              <p className="text-2xl font-bold text-green-600">{assignedCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-950/40 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Chưa phân công GVHD</p>
              <p className="text-2xl font-bold text-amber-600">{unassignedCount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/40 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-3.5 bg-green-50 dark:bg-green-950/30 border border-green-200 text-green-800 dark:text-green-300 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-800 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Danh sách đề tài & nhóm sinh viên */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Danh sách đề tài & Nhóm sinh viên ({activeCategory === 'KLTN' ? 'Khóa luận' : 'NCKH'})
              </CardTitle>
              <CardDescription>
                Đợt: {selectedRound?.round_name || 'Chưa chọn'} • Tổng số: {filteredTopics.length} đề tài
              </CardDescription>
            </div>
            <div className="w-full sm:w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm đề tài, sinh viên, nhóm..."
                  className="pl-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isFetchingTopics ? (
            <p className="text-center py-12 text-muted-foreground text-xs">Đang tải danh sách đề tài...</p>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-foreground text-sm">Chưa có đề tài nào trong danh mục này</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTopics.map((topic, idx) => {
                const title = topic.proposed_topics?.topic_title || topic.topic_title || topic.self_proposed_title || 'Đề tài chưa đặt tên';
                const group = topic.thesis_groups;
                const members = group?.thesis_group_members || topic.thesis_members || [];
                const supervisor = topic.instructors || topic.supervisor;
                const hasSupervisor = !!supervisor;

                return (
                  <div
                    key={topic.id || idx}
                    className="p-4 rounded-lg border border-border hover:border-primary/40 bg-card hover:bg-muted/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">{title}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {activeCategory === 'KLTN' ? 'Khóa luận' : 'NCKH'}
                        </Badge>
                        <Badge variant={hasSupervisor ? 'default' : 'secondary'} className="text-[10px]">
                          {hasSupervisor ? 'Đã có GVHD' : 'Chưa phân công'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">Nhóm / Sinh viên: </span>
                          <span>
                            {members.map((m: any) => `${m.students?.users?.full_name || 'SV'} (${m.students?.student_code || 'N/A'})`).join(', ') || 'Chưa rõ'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">GVHD: </span>
                          <span className={hasSupervisor ? 'text-primary font-semibold' : 'italic text-amber-600'}>
                            {hasSupervisor ? `${supervisor.users?.full_name || supervisor.full_name} (${supervisor.instructor_code})` : 'Chưa có GVHD'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenAssignModal(topic)}
                        variant={hasSupervisor ? 'outline' : 'default'}
                        className={!hasSupervisor ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                      >
                        <UserPlus className="w-4 h-4 mr-1.5" />
                        {hasSupervisor ? 'Đổi GVHD' : 'Phân công GVHD'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Phân công GVHD */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Phân công Giảng viên hướng dẫn"
        size="lg"
      >
        {selectedTopic && (
          <div className="space-y-4">
            <div className="p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-1.5">
              <p>
                <strong className="text-foreground">Đề tài:</strong> {selectedTopic.proposed_topics?.topic_title || selectedTopic.topic_title || selectedTopic.self_proposed_title}
              </p>
              <p>
                <strong className="text-foreground">Nhóm SV:</strong>{' '}
                {(selectedTopic.thesis_groups?.thesis_group_members || []).map((m: any) => `${m.students?.users?.full_name} (${m.students?.student_code})`).join(', ') || 'Sinh viên'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Chọn Giảng viên hướng dẫn trong bộ môn <span className="text-destructive">*</span>
              </label>

              {isFetchingInstructors ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Đang tải danh sách giảng viên...</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {instructors.map((inst) => {
                    const isSelected = selectedInstructorId === inst.id;
                    return (
                      <div
                        key={inst.id}
                        onClick={() => setSelectedInstructorId(inst.id)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 font-semibold'
                            : 'border-border hover:bg-muted/40'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{inst.users?.full_name}</p>
                          <p className="text-muted-foreground font-mono mt-0.5">
                            Mã GV: {inst.instructor_code} • {inst.degree || 'Giảng viên'}
                            {inst.specialization ? ` • Chuyên ngành: ${inst.specialization}` : ''}
                          </p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} disabled={isLoading}>
                Hủy
              </Button>
              <Button
                onClick={handleConfirmAssign}
                disabled={isLoading || !selectedInstructorId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Đang lưu...' : 'Xác nhận phân công GVHD'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
