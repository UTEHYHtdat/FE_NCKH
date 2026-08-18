import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Clock, 
  Users, 
  X, 
  MapPin, 
  BookOpen, 
  ArrowLeft, 
  Check, 
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';
import { translateStatus, getStatusBadgeVariant } from '@/helpers/constant';
import { toast } from 'sonner';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { thesisRoundsService, instructorService, reviewScheduleService, topicRegistrationService } from '@/plugins/api';
import type { ThesisRound, ReviewScheduleItemData } from '@/types/api';

interface ScheduleFormItem {
  thesisId?: number;
  reviewer1Id?: number;
  reviewer2Id?: number;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
}

interface PreviewScheduleItem {
  thesisId: number;
  thesisTitle: string;
  thesisCode: string;
  groupName: string;
  students: string[];
  supervisor: string;
  supervisorId?: number;
  reviewer1Id?: number;
  reviewer2Id?: number;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
}

export function HeadReviewSchedule() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';

  const [rounds, setRounds] = useState<ThesisRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<ThesisRound | null>(null);
  const [schedules, setSchedules] = useState<ReviewScheduleItemData[]>([]);
  const [theses, setTheses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAutoScheduleModalOpen, setIsAutoScheduleModalOpen] = useState(false);
  const [autoScheduleStep, setAutoScheduleStep] = useState<'config' | 'preview'>('config');

  const [editingSchedule, setEditingSchedule] = useState<ReviewScheduleItemData | null>(null);
  const [editFormData, setEditFormData] = useState({
    reviewer1Id: 0,
    reviewer2Id: 0,
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    status: 'SCHEDULED' as any,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [autoScheduleForm, setAutoScheduleForm] = useState({
    date: '',
    room: '',
    startHour: 8,
    durationMinutes: 45,
  });

  const [previewSchedules, setPreviewSchedules] = useState<PreviewScheduleItem[]>([]);

  const [scheduleForms, setScheduleForms] = useState<ScheduleFormItem[]>([
    {
      scheduledDate: '',
      scheduledTime: '08:00',
      location: '',
    },
  ]);

  // Fetch rounds and instructors on mount
  useEffect(() => {
    fetchRounds();
    fetchInstructors();
  }, []);

  // Fetch schedules and theses when selectedRound changes
  useEffect(() => {
    if (selectedRound?.id) {
      fetchSchedules(selectedRound.id);
      fetchThesesForRound(selectedRound.id);
    }
  }, [selectedRound]);

  const fetchRounds = async () => {
    try {
      setIsLoading(true);
      const data = await thesisRoundsService.getThesisRoundsForHead();
      const roundsArray = Array.isArray(data) ? data : (data as any)?.data || [];
      const activeRounds = roundsArray.filter((r: any) => r.status?.toUpperCase() === 'ACTIVE');
      setRounds(activeRounds);
      if (activeRounds.length > 0 && !selectedRound) {
        setSelectedRound(activeRounds[0]);
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
      toast.error('Không thể tải danh sách đợt đồ án');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const data = await instructorService.getInstructors();
      const instructorsArray = Array.isArray(data) ? data : (data as any)?.data || [];
      setInstructors(instructorsArray);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchThesesForRound = async (roundId: number) => {
    try {
      const data = await reviewScheduleService.getThesesByRound(roundId);
      const thesesArray = Array.isArray(data) ? data : (data as any)?.data || [];
      setTheses(thesesArray);
    } catch (error) {
      console.error('Error fetching theses for round:', error);
    }
  };

  const fetchSchedules = async (roundId: number) => {
    try {
      setIsLoading(true);
      const data = await reviewScheduleService.getReviewSchedules({ thesis_round_id: roundId });
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Lỗi khi tải danh sách lịch phản biện');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      schedule.thesisTitle.toLowerCase().includes(searchLower) ||
      schedule.thesisCode.toLowerCase().includes(searchLower) ||
      schedule.groupName.toLowerCase().includes(searchLower) ||
      schedule.supervisor.toLowerCase().includes(searchLower) ||
      schedule.reviewer1.toLowerCase().includes(searchLower) ||
      (schedule.reviewer2 && schedule.reviewer2.toLowerCase().includes(searchLower)) ||
      schedule.students.some((s) => s.toLowerCase().includes(searchLower));

    const matchesStatus = filterStatus === 'all' || !filterStatus || schedule.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = scheduleForms.map((f) => ({
        thesisId: f.thesisId,
        reviewer1Id: f.reviewer1Id,
        reviewer2Id: f.reviewer2Id,
        scheduledDate: f.scheduledDate,
        scheduledTime: f.scheduledTime,
        location: f.location,
        status: 'SCHEDULED',
      }));

      await reviewScheduleService.createReviewSchedules(payload);
      toast.success(`Đã tạo ${scheduleForms.length} lịch phản biện thành công!`);
      setIsCreateModalOpen(false);
      setScheduleForms([{ scheduledDate: '', scheduledTime: '08:00', location: '' }]);
      if (selectedRound) {
        fetchSchedules(selectedRound.id);
        fetchThesesForRound(selectedRound.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tạo lịch phản biện');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (schedule: ReviewScheduleItemData) => {
    setEditingSchedule(schedule);
    setEditFormData({
      reviewer1Id: schedule.reviewer1Id || 0,
      reviewer2Id: schedule.reviewer2Id || 0,
      scheduledDate: schedule.scheduledDate || '',
      scheduledTime: schedule.scheduledTime || '08:00',
      location: schedule.location || '',
      status: schedule.status === 'NOT_SCHEDULED' ? 'SCHEDULED' : (schedule.status || 'SCHEDULED'),
    });
    setIsEditModalOpen(true);
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      setIsSaving(true);
      await reviewScheduleService.updateReviewSchedule(editingSchedule.thesisId, editFormData);
      toast.success('Cập nhật lịch phản biện thành công!');
      setIsEditModalOpen(false);
      setEditingSchedule(null);
      if (selectedRound) {
        fetchSchedules(selectedRound.id);
        fetchThesesForRound(selectedRound.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật lịch phản biện');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async (thesisId: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch phản biện của đề tài này?')) return;

    try {
      await reviewScheduleService.deleteReviewSchedule(thesisId);
      toast.success('Đã hủy lịch phản biện thành công!');
      if (selectedRound) {
        fetchSchedules(selectedRound.id);
        fetchThesesForRound(selectedRound.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi hủy lịch phản biện');
    }
  };

  // --- AUTO SCHEDULE WORKFLOW WITH PREVIEW & EDIT ---
  const handleOpenAutoSchedule = () => {
    setAutoScheduleStep('config');
    setIsAutoScheduleModalOpen(true);
  };

  const handleGeneratePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound) {
      toast.error('Vui lòng chọn đợt khóa luận!');
      return;
    }
    if (!autoScheduleForm.date || !autoScheduleForm.room) {
      toast.error('Vui lòng nhập đầy đủ ngày và phòng!');
      return;
    }

    // Lấy danh sách đề tài cần xếp lịch từ theses hoặc schedules
    const targetTheses = theses.length > 0 ? theses : schedules;
    if (targetTheses.length === 0) {
      toast.error('Không tìm thấy đề tài nào trong đợt này để xếp lịch!');
      return;
    }

    if (instructors.length < 2) {
      toast.error('Cần ít nhất 2 giảng viên trong hệ thống để xếp lịch phản biện!');
      return;
    }

    let currentHour = parseInt(autoScheduleForm.startHour.toString()) || 8;
    let currentMinute = 0;
    const duration = parseInt(autoScheduleForm.durationMinutes.toString()) || 45;

    const generatedList: PreviewScheduleItem[] = targetTheses.map((thesis: any, index: number) => {
      const thesisId = thesis.thesisId || thesis.id || thesis.thesis_id;
      const thesisTitle = thesis.thesisTitle || thesis.topic_title || thesis.topic_name;
      const thesisCode = thesis.thesisCode || thesis.thesis_code || `KL-${thesisId}`;
      const groupName = thesis.groupName || (thesis.thesis_groups?.group_name ? thesis.thesis_groups.group_name : `Nhóm #${thesisId}`);
      const supervisor = thesis.supervisor || thesis.instructors?.users?.full_name || 'GVHD';
      const supervisorId = thesis.supervisorId || thesis.supervisor_id || thesis.instructors?.id;
      const students = thesis.students || (thesis.thesis_members ? thesis.thesis_members.map((m: any) => m.students?.users?.full_name || 'Sinh viên') : ['Sinh viên']);

      // Lọc bỏ GVHD
      const availableReviewers = instructors.filter((inst) => inst.id !== supervisorId);
      const reviewer1 = availableReviewers[index % availableReviewers.length];
      const reviewer2 = availableReviewers[(index + 1) % availableReviewers.length];

      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      // Tính giờ cho ca tiếp theo
      currentMinute += duration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }

      return {
        thesisId,
        thesisTitle,
        thesisCode,
        groupName,
        students,
        supervisor,
        supervisorId,
        reviewer1Id: reviewer1?.id,
        reviewer2Id: reviewer2?.id,
        scheduledDate: autoScheduleForm.date,
        scheduledTime: timeStr,
        location: autoScheduleForm.room,
      };
    });

    setPreviewSchedules(generatedList);
    setAutoScheduleStep('preview');
  };

  const updatePreviewItem = (index: number, field: keyof PreviewScheduleItem, value: any) => {
    const updated = [...previewSchedules];
    updated[index] = { ...updated[index], [field]: value };
    setPreviewSchedules(updated);
  };

  const removePreviewItem = (index: number) => {
    setPreviewSchedules(previewSchedules.filter((_, i) => i !== index));
  };

  const handleSavePreview = async () => {
    if (previewSchedules.length === 0) {
      toast.error('Không có ca phản biện nào để lưu!');
      return;
    }

    try {
      setIsSaving(true);
      const payload = previewSchedules.map((item) => ({
        thesisId: item.thesisId,
        reviewer1Id: item.reviewer1Id,
        reviewer2Id: item.reviewer2Id,
        scheduledDate: item.scheduledDate,
        scheduledTime: item.scheduledTime,
        location: item.location,
        status: 'SCHEDULED',
      }));

      await reviewScheduleService.createReviewSchedules(payload);
      toast.success(`Đã lưu và áp dụng thành công ${previewSchedules.length} lịch phản biện!`);
      setIsAutoScheduleModalOpen(false);
      setAutoScheduleStep('config');
      if (selectedRound) fetchSchedules(selectedRound.id);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu lịch phản biện');
    } finally {
      setIsSaving(false);
    }
  };

  const addScheduleForm = () => {
    setScheduleForms([...scheduleForms, { scheduledDate: '', scheduledTime: '08:00', location: '' }]);
  };

  const removeScheduleForm = (index: number) => {
    if (scheduleForms.length > 1) {
      setScheduleForms(scheduleForms.filter((_, i) => i !== index));
    }
  };

  const updateScheduleForm = (index: number, field: keyof ScheduleFormItem, value: any) => {
    const updated = [...scheduleForms];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleForms(updated);
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'PGS. TS. Nguyễn Văn A'}
      title="Quản lý lịch phản biện"
      subtitle="Lên lịch, phân công giảng viên và quản lý các buổi phản biện khóa luận"
    >
      {/* Select Round */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Chọn đợt khóa luận</CardTitle>
          <CardDescription>Chọn đợt để xem và quản lý lịch phản biện của các nhóm sinh viên</CardDescription>
        </CardHeader>
        <CardContent>
          {rounds.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có đợt khóa luận nào đang hoạt động</p>
          ) : (
            <Select
              value={selectedRound?.id.toString() || ''}
              onValueChange={(value) => {
                const round = rounds.find((r) => r.id === Number(value));
                setSelectedRound(round || null);
              }}
            >
              <SelectTrigger className="w-full md:w-96">
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

      {/* Filters & Actions */}
      {selectedRound && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã đề tài, tên đề tài, sinh viên, GVHD, phản biện..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="NOT_SCHEDULED">Chưa xếp lịch</SelectItem>
                  <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang diễn ra</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleOpenAutoSchedule}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Xếp lịch tự động
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Tạo lịch mới
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      {selectedRound && (
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                <p>Đang tải danh sách lịch phản biện từ hệ thống...</p>
              </CardContent>
            </Card>
          ) : filteredSchedules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-foreground">
                  {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy lịch nào phù hợp' : 'Chưa có lịch phản biện nào'}
                </p>
                <p className="text-sm mt-1">
                  Bạn có thể bấm <strong>"Xếp lịch tự động"</strong> hoặc <strong>"Tạo lịch mới"</strong> để thiết lập lịch cho các đề tài.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="font-semibold text-lg text-foreground">{schedule.thesisTitle}</h3>
                        <Badge variant={getStatusBadgeVariant(schedule.status)}>
                          {translateStatus(schedule.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
                        <span>Mã: {schedule.thesisCode}</span>
                        <span>•</span>
                        <span>{schedule.groupName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/40 border border-border/50 text-sm">
                    {/* Sinh viên */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Sinh viên thực hiện
                      </p>
                      <div className="space-y-0.5">
                        {schedule.students.map((student, idx) => (
                          <p key={idx} className="font-medium text-foreground">• {student}</p>
                        ))}
                      </div>
                    </div>

                    {/* Giảng viên */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                        GV Hướng dẫn
                      </p>
                      <p className="font-medium text-foreground">{schedule.supervisor}</p>

                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-2 mb-1">
                        GV Phản biện
                      </p>
                      <p className="font-medium text-foreground">1. {schedule.reviewer1 || 'Chưa phân công'}</p>
                      {schedule.reviewer2 && (
                        <p className="font-medium text-foreground">2. {schedule.reviewer2}</p>
                      )}
                    </div>

                    {/* Thời gian */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Thời gian phản biện
                      </p>
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <span>{schedule.scheduledDate ? new Date(schedule.scheduledDate).toLocaleDateString('vi-VN') : 'Chưa xếp ngày'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{schedule.scheduledTime || '--:--'}</span>
                      </div>
                    </div>

                    {/* Địa điểm */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Địa điểm / Phòng
                      </p>
                      <p className="font-medium text-foreground">{schedule.location || 'Chưa chỉ định'}</p>
                      {schedule.reviewScore1 !== null && schedule.reviewScore1 !== undefined && (
                        <div className="mt-2 text-xs font-semibold text-emerald-600">
                          Điểm PB: {schedule.reviewScore1} {schedule.reviewScore2 ? ` / ${schedule.reviewScore2}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border">
                    <Button
                      size="sm"
                      variant={schedule.status === 'NOT_SCHEDULED' ? 'outline' : 'ghost'}
                      className={schedule.status === 'NOT_SCHEDULED' ? 'border-primary text-primary hover:bg-primary/5' : ''}
                      onClick={() => openEditModal(schedule)}
                    >
                      {schedule.status === 'NOT_SCHEDULED' ? (
                        <>
                          <Calendar className="w-4 h-4 mr-1.5" />
                          Xếp lịch
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-1.5" />
                          Chỉnh sửa
                        </>
                      )}
                    </Button>
                    {schedule.status !== 'NOT_SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteSchedule(schedule.thesisId)}
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Hủy lịch
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* MODAL: Tạo lịch phản biện mới */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo lịch phản biện mới"
        size="xl"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Danh sách đề tài cần xếp lịch</h3>
              <Button type="button" size="sm" variant="outline" onClick={addScheduleForm}>
                <Plus className="w-4 h-4 mr-1.5" />
                Thêm ca lịch
              </Button>
            </div>

            {scheduleForms.map((form, index) => (
              <div key={index} className="border border-border rounded-xl p-4 bg-muted/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-primary">Ca phản biện #{index + 1}</h4>
                  {scheduleForms.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeScheduleForm(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Chọn đề tài */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                      Chọn đề tài khóa luận <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={form.thesisId?.toString() || ''}
                      onValueChange={(val) => updateScheduleForm(index, 'thesisId', Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đề tài..." />
                      </SelectTrigger>
                      <SelectContent>
                        {theses.map((t: any) => (
                          <SelectItem key={t.id || t.thesis_id} value={(t.id || t.thesis_id).toString()}>
                            {t.topic_title || t.topic_name} ({t.thesis_code || 'Đề tài #' + (t.id || t.thesis_id)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* GV Phản biện 1 */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                      GV Phản biện 1 <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={form.reviewer1Id?.toString() || ''}
                      onValueChange={(val) => updateScheduleForm(index, 'reviewer1Id', Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn GV phản biện 1..." />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((inst: any) => (
                          <SelectItem key={inst.id} value={inst.id.toString()}>
                            {inst.users?.full_name || inst.instructor_code} ({inst.instructor_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* GV Phản biện 2 */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                      GV Phản biện 2 (Tùy chọn)
                    </label>
                    <Select
                      value={form.reviewer2Id?.toString() || ''}
                      onValueChange={(val) => updateScheduleForm(index, 'reviewer2Id', Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn GV phản biện 2..." />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((inst: any) => (
                          <SelectItem key={inst.id} value={inst.id.toString()}>
                            {inst.users?.full_name || inst.instructor_code} ({inst.instructor_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ngày phản biện */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                      Ngày phản biện <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="date"
                      value={form.scheduledDate}
                      onChange={(e) => updateScheduleForm(index, 'scheduledDate', e.target.value)}
                      required
                    />
                  </div>

                  {/* Giờ bắt đầu */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                      Giờ bắt đầu
                    </label>
                    <Input
                      type="time"
                      value={form.scheduledTime}
                      onChange={(e) => updateScheduleForm(index, 'scheduledTime', e.target.value)}
                    />
                  </div>

                  {/* Địa điểm */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                      Địa điểm / Phòng họp <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="VD: Phòng Hội thảo A.204"
                      value={form.location}
                      onChange={(e) => updateScheduleForm(index, 'location', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : `Tạo ${scheduleForms.length} lịch phản biện`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Chỉnh sửa lịch phản biện */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa lịch phản biện"
        size="lg"
      >
        <form onSubmit={handleEditSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Đề tài</label>
            <Input value={editingSchedule?.thesisTitle || ''} disabled className="font-medium bg-muted" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">Mã đề tài: {editingSchedule?.thesisCode}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                GV Phản biện 1
              </label>
              <Select
                value={editFormData.reviewer1Id ? editFormData.reviewer1Id.toString() : undefined}
                onValueChange={(val) => setEditFormData({ ...editFormData, reviewer1Id: Number(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn GV phản biện 1..." />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id.toString()}>
                      {inst.users?.full_name || inst.instructor_code} ({inst.instructor_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                GV Phản biện 2
              </label>
              <Select
                value={editFormData.reviewer2Id ? editFormData.reviewer2Id.toString() : undefined}
                onValueChange={(val) => setEditFormData({ ...editFormData, reviewer2Id: Number(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn GV phản biện 2..." />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id.toString()}>
                      {inst.users?.full_name || inst.instructor_code} ({inst.instructor_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Ngày phản biện</label>
              <Input
                type="date"
                value={editFormData.scheduledDate}
                onChange={(e) => setEditFormData({ ...editFormData, scheduledDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Giờ bắt đầu</label>
              <Input
                type="time"
                value={editFormData.scheduledTime}
                onChange={(e) => setEditFormData({ ...editFormData, scheduledTime: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Địa điểm</label>
              <Input
                placeholder="VD: Phòng Hội thảo A.204"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Trạng thái</label>
              <Select
                value={editFormData.status}
                onValueChange={(val: any) => setEditFormData({ ...editFormData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang diễn ra</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Xếp lịch tự động (Cấu hình & Xem trước / Chỉnh sửa) */}
      <Modal
        isOpen={isAutoScheduleModalOpen}
        onClose={() => setIsAutoScheduleModalOpen(false)}
        title={
          autoScheduleStep === 'config'
            ? 'Xếp lịch phản biện tự động'
            : `Xem trước & Chỉnh sửa phân bổ (${previewSchedules.length} ca phản biện)`
        }
        size={autoScheduleStep === 'config' ? 'md' : 'xl'}
      >
        {autoScheduleStep === 'config' ? (
          /* BƯỚC 1: CẤU HÌNH THÔNG SỐ XẾP LỊCH */
          <form onSubmit={handleGeneratePreview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Đợt khóa luận</label>
              <Input
                value={
                  selectedRound
                    ? `${selectedRound.round_name} (${selectedRound.round_code || 'ĐK' + selectedRound.id}) - ${selectedRound.academic_year}`
                    : 'Chưa chọn đợt khóa luận'
                }
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Ngày phản biện <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={autoScheduleForm.date}
                onChange={(e) => setAutoScheduleForm({ ...autoScheduleForm, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Phòng / Địa điểm tổ chức <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: Phòng Hội thảo A.204"
                value={autoScheduleForm.room}
                onChange={(e) => setAutoScheduleForm({ ...autoScheduleForm, room: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Giờ bắt đầu ca đầu tiên (Giờ)
                </label>
                <Input
                  type="number"
                  min="6"
                  max="20"
                  value={autoScheduleForm.startHour}
                  onChange={(e) => setAutoScheduleForm({ ...autoScheduleForm, startHour: parseInt(e.target.value) || 8 })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Thời lượng mỗi ca (Phút)
                </label>
                <Input
                  type="number"
                  min="15"
                  max="120"
                  value={autoScheduleForm.durationMinutes}
                  onChange={(e) => setAutoScheduleForm({ ...autoScheduleForm, durationMinutes: parseInt(e.target.value) || 45 })}
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg text-xs text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                Hệ thống sẽ tự động gán giảng viên phản biện (tránh GVHD) và chia ca theo khung giờ. Sau đó, bạn có thể <strong>xem trước và trực tiếp chỉnh sửa</strong> từng ca trước khi lưu.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button variant="ghost" type="button" onClick={() => setIsAutoScheduleModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Tạo bản xếp lịch xem trước
              </Button>
            </div>
          </form>
        ) : (
          /* BƯỚC 2: XEM TRƯỚC VÀ CHỈNH SỬA TOÀN BỘ DANH SÁCH */
          <div className="space-y-5">
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl text-xs text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Bản xem trước lịch phản biện tự động</p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-400">
                  Dưới đây là danh sách {previewSchedules.length} ca phản biện đã được xếp. Bạn có thể thay đổi Giảng viên phản biện, Khung giờ hoặc Phòng của từng đề tài dưới đây trước khi nhấn Xác nhận & Lưu.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {previewSchedules.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border rounded-xl">
                  Không còn ca phản biện nào trong danh sách.
                </div>
              ) : (
                previewSchedules.map((item, index) => (
                  <Card key={item.thesisId || index} className="p-4 border border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
                    <div className="space-y-3">
                      {/* Tiêu đề đề tài & ca */}
                      <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs">
                            #{index + 1}
                          </span>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{item.thesisTitle}</h4>
                            <p className="text-xs text-muted-foreground font-mono">
                              Mã: {item.thesisCode} • {item.groupName} • GVHD: <strong className="text-foreground">{item.supervisor}</strong>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-7 px-2 hover:bg-destructive/10"
                          onClick={() => removePreviewItem(index)}
                          title="Bỏ đề tài này khỏi lịch"
                        >
                          <X className="w-4 h-4 mr-1" /> Bỏ ca
                        </Button>
                      </div>

                      {/* Các trường có thể chỉnh sửa trực tiếp */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        {/* GV Phản biện 1 */}
                        <div className="md:col-span-1">
                          <label className="block font-semibold uppercase text-muted-foreground mb-1">
                            GV Phản biện 1 <span className="text-destructive">*</span>
                          </label>
                          <Select
                            value={item.reviewer1Id ? item.reviewer1Id.toString() : undefined}
                            onValueChange={(val) => updatePreviewItem(index, 'reviewer1Id', Number(val))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Chọn GV 1..." />
                            </SelectTrigger>
                            <SelectContent>
                              {instructors.map((inst: any) => (
                                <SelectItem key={inst.id} value={inst.id.toString()}>
                                  {inst.users?.full_name || inst.instructor_code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* GV Phản biện 2 */}
                        <div className="md:col-span-1">
                          <label className="block font-semibold uppercase text-muted-foreground mb-1">
                            GV Phản biện 2
                          </label>
                          <Select
                            value={item.reviewer2Id ? item.reviewer2Id.toString() : undefined}
                            onValueChange={(val) => updatePreviewItem(index, 'reviewer2Id', Number(val))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Chọn GV 2 (tùy chọn)..." />
                            </SelectTrigger>
                            <SelectContent>
                              {instructors.map((inst: any) => (
                                <SelectItem key={inst.id} value={inst.id.toString()}>
                                  {inst.users?.full_name || inst.instructor_code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Ngày */}
                        <div className="md:col-span-1">
                          <label className="block font-semibold uppercase text-muted-foreground mb-1">
                            Ngày phản biện
                          </label>
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            value={item.scheduledDate}
                            onChange={(e) => updatePreviewItem(index, 'scheduledDate', e.target.value)}
                          />
                        </div>

                        {/* Giờ */}
                        <div className="md:col-span-1">
                          <label className="block font-semibold uppercase text-muted-foreground mb-1">
                            Giờ ca
                          </label>
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={item.scheduledTime}
                            onChange={(e) => updatePreviewItem(index, 'scheduledTime', e.target.value)}
                          />
                        </div>

                        {/* Phòng */}
                        <div className="md:col-span-1">
                          <label className="block font-semibold uppercase text-muted-foreground mb-1">
                            Phòng
                          </label>
                          <Input
                            className="h-8 text-xs"
                            placeholder="Phòng..."
                            value={item.location}
                            onChange={(e) => updatePreviewItem(index, 'location', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setAutoScheduleStep('config')}
                disabled={isSaving}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại cấu hình
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsAutoScheduleModalOpen(false)}
                  disabled={isSaving}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSavePreview}
                  disabled={isSaving || previewSchedules.length === 0}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {isSaving ? 'Đang lưu...' : `Xác nhận & Lưu ${previewSchedules.length} ca lịch`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
