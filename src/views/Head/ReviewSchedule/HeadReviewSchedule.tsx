import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Search, Clock, Users, X } from 'lucide-react';
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
import { thesisRoundsService, councilService, apiClient } from '@/plugins/api';
import type { ThesisRound } from '@/types/api';

interface ReviewScheduleItem {
  id: number;
  thesisCode: string;
  thesisTitle: string;
  groupName: string;
  students: string[];
  supervisor: string;
  reviewer: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

interface CommitteeMember {
  id: number;
  name: string;
  role: 'chairman' | 'secretary' | 'reviewer';
}

interface Committee {
  id: number;
  name: string;
  members: CommitteeMember[];
}

interface ScheduleForm {
  thesisId?: number;
  thesisCode?: string;
  thesisTitle?: string;
  committeeId?: number;
  reviewer1?: string;
  reviewer2?: string;
  gradingTemplateId?: number;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
}

export function HeadReviewSchedule() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [rounds, setRounds] = useState<ThesisRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<ThesisRound | null>(null);
  const [schedules, setSchedules] = useState<ReviewScheduleItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReviewScheduleItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [gradingTemplates, setGradingTemplates] = useState<any[]>([]);

  // Multi-schedule creation state
  const [scheduleForms, setScheduleForms] = useState<ScheduleForm[]>([
    {
      scheduledDate: '',
      scheduledTime: '',
      location: '',
    }
  ]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isCreatingCommittee, setIsCreatingCommittee] = useState(false);
  const [newCommittee, setNewCommittee] = useState({ name: '', members: [] as CommitteeMember[] });

  useEffect(() => {
    fetchRounds();
    fetchCouncils();
    fetchGradingTemplates();
    // Load schedules from localStorage
    const savedSchedules = localStorage.getItem('reviewSchedules');
    if (savedSchedules) {
      try {
        setSchedules(JSON.parse(savedSchedules));
      } catch (e) {
        setSchedules([]);
      }
    }
  }, []);

  const fetchRounds = async () => {
    try {
      setIsLoading(true);
      const data = await thesisRoundsService.getThesisRoundsForHead();
      let roundsArray: ThesisRound[] = [];
      if (Array.isArray(data)) {
        roundsArray = data;
      } else if (data && typeof data === 'object') {
        const dataObj = data as any;
        if (dataObj.data && Array.isArray(dataObj.data)) {
          roundsArray = dataObj.data;
        }
      }
      const activeRounds = roundsArray.filter((round: any) => 
        round.status?.toUpperCase() === 'ACTIVE'
      );
      setRounds(activeRounds);
      if (activeRounds.length > 0) {
        setSelectedRound(activeRounds[0]);
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCouncils = async () => {
    try {
      const data = await councilService.getCouncils();
      const councilsArray = Array.isArray(data) ? data : (data as any)?.data || [];
      const mappedCommittees: Committee[] = councilsArray.map((c: any) => {
        const members = [];
        if (c.instructors_defense_councils_chairman_idToinstructors) {
          members.push({
            id: c.chairman_id,
            name: c.instructors_defense_councils_chairman_idToinstructors.users?.full_name || 'Chủ tịch',
            role: 'chairman'
          });
        }
        if (c.instructors_defense_councils_secretary_idToinstructors) {
          members.push({
            id: c.secretary_id,
            name: c.instructors_defense_councils_secretary_idToinstructors.users?.full_name || 'Thư ký',
            role: 'secretary'
          });
        }
        if (c.council_members) {
          c.council_members.forEach((m: any) => {
            members.push({
              id: m.id,
              name: m.instructors?.users?.full_name || m.instructors?.instructor_code || '',
              role: m.role ? m.role.toLowerCase() : 'reviewer'
            });
          });
        }
        return {
          id: c.id,
          name: c.council_name,
          members: members
        };
      });
      setCommittees(mappedCommittees);
    } catch (error) {
      console.error('Error fetching councils:', error);
    }
  };

  const fetchGradingTemplates = async () => {
    try {
      const response = await apiClient.get<any[]>('/api/v1/thesis/admin/grading-templates');
      setGradingTemplates(response);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      schedule.thesisTitle.toLowerCase().includes(searchLower) ||
      schedule.thesisCode.toLowerCase().includes(searchLower) ||
      schedule.groupName.toLowerCase().includes(searchLower) ||
      schedule.students.some(s => s.toLowerCase().includes(searchLower));
    
    const matchesStatus = filterStatus === 'all' || !filterStatus || schedule.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });


  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call API to create multiple schedules
    console.log('Creating schedules:', scheduleForms);
    toast.success(`Đã tạo ${scheduleForms.length} lịch phản biện thành công!`);
    setIsCreateModalOpen(false);
    // Reset forms
    setScheduleForms([{ scheduledDate: '', scheduledTime: '', location: '' }]);
  };

  const addScheduleForm = () => {
    setScheduleForms([...scheduleForms, { scheduledDate: '', scheduledTime: '', location: '' }]);
  };

  const removeScheduleForm = (index: number) => {
    if (scheduleForms.length > 1) {
      setScheduleForms(scheduleForms.filter((_, i) => i !== index));
    }
  };

  const updateScheduleForm = (index: number, field: keyof ScheduleForm, value: any) => {
    const updated = [...scheduleForms];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleForms(updated);
  };

  const handleCreateCommittee = () => {
    if (newCommittee.name) {
      const committee: Committee = {
        id: Date.now(),
        name: newCommittee.name,
        members: newCommittee.members,
      };
      setCommittees([...committees, committee]);
      setNewCommittee({ name: '', members: [] });
      setIsCreatingCommittee(false);
      toast.success('Đã tạo hội đồng mới!');
    }
  };

  const addCommitteeMember = () => {
    setNewCommittee({
      ...newCommittee,
      members: [...newCommittee.members, { id: Date.now(), name: '', role: 'reviewer' }],
    });
  };

  const removeCommitteeMember = (index: number) => {
    setNewCommittee({
      ...newCommittee,
      members: newCommittee.members.filter((_, i) => i !== index),
    });
  };

  const updateCommitteeMember = (index: number, field: keyof CommitteeMember, value: any) => {
    const updated = [...newCommittee.members];
    updated[index] = { ...updated[index], [field]: value };
    setNewCommittee({ ...newCommittee, members: updated });
  };

  const handleEditSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call API to update schedule
    toast.success('Cập nhật lịch phản biện thành công!');
    setIsEditModalOpen(false);
    setEditingSchedule(null);
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'PGS. TS. Nguyễn Văn A'}
      title="Quản lý lịch phản biện"
      subtitle="Lên lịch và quản lý các buổi phản biện khóa luận"
    >
      {/* Select Round */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chọn đợt khóa luận</CardTitle>
          <CardDescription>Chọn đợt để xem và quản lý lịch phản biện</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Đang tải...</p>
          ) : rounds.length === 0 ? (
            <p className="text-muted-foreground">Không có đợt nào</p>
          ) : (
            <Select
              value={selectedRound?.id.toString() || ''}
              onValueChange={(value) => {
                const round = rounds.find(r => r.id === Number(value));
                setSelectedRound(round || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn đợt khóa luận..." />
              </SelectTrigger>
              <SelectContent>
                {rounds.map(round => (
                  <SelectItem key={round.id} value={round.id.toString()}>
                    {round.round_name} ({round.round_code || 'ĐK' + round.id}) - {round.academic_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      {selectedRound && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã đề tài, tên đề tài, sinh viên..."
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
                  <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang diễn ra</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
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
          {filteredSchedules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {searchTerm || filterStatus ? 'Không tìm thấy lịch nào' : 'Chưa có lịch phản biện nào'}
              </CardContent>
            </Card>
          ) : (
            filteredSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{schedule.thesisTitle}</h3>
                        <Badge variant={getStatusBadgeVariant(schedule.status)} className={schedule.status === 'COMPLETED' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {translateStatus(schedule.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Mã: {schedule.thesisCode}</p>
                      <p className="text-sm text-muted-foreground">{schedule.groupName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sinh viên</p>
                      <div className="space-y-1">
                        {schedule.students.map((student, idx) => (
                          <p key={idx} className="text-sm font-medium">{student}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">GV Hướng dẫn</p>
                      <p className="text-sm font-medium">{schedule.supervisor}</p>
                      <p className="text-sm text-muted-foreground mt-2">GV Phản biện</p>
                      <p className="text-sm font-medium">{schedule.reviewer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Thời gian</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{schedule.scheduledDate}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{schedule.scheduledTime}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Địa điểm</p>
                      <p className="text-sm font-medium">{schedule.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditingSchedule(schedule);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hủy lịch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Schedule Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo lịch phản biện mới"
        size="xl"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-6">
          {/* Committee Management */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Quản lý hội đồng phản biện
              </h3>
              <Button type="button" size="sm" onClick={() => setIsCreatingCommittee(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo hội đồng mới
              </Button>
            </div>

            {isCreatingCommittee && (
              <div className="bg-muted p-4 rounded-lg mb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tên hội đồng</label>
                  <Input
                    value={newCommittee.name}
                    onChange={(e) => setNewCommittee({ ...newCommittee, name: e.target.value })}
                    placeholder="VD: Hội đồng 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Thành viên</label>
                  {newCommittee.members.map((member, index) => (
                    <div key={member.id} className="flex gap-2 mb-2">
                      <Input
                        value={member.name}
                        onChange={(e) => updateCommitteeMember(index, 'name', e.target.value)}
                        placeholder="Tên giáo viên"
                        className="flex-1"
                      />
                      <select
                        value={member.role}
                        onChange={(e) => updateCommitteeMember(index, 'role', e.target.value)}
                        className="px-3 py-2 border border-input rounded-md"
                      >
                        <option value="reviewer">Phản biện</option>
                        <option value="chairman">Chủ tịch</option>
                        <option value="secretary">Thư ký</option>
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCommitteeMember(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={addCommitteeMember}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm thành viên
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleCreateCommittee}>
                    Lưu hội đồng
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setIsCreatingCommittee(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {committees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có hội đồng nào</p>
              ) : (
                committees.map((committee) => (
                  <div key={committee.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">{committee.name}</p>
                      <p className="text-xs text-muted-foreground">{committee.members.length} thành viên</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schedule Forms */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Lịch phản biện</h3>
              <Button type="button" size="sm" onClick={addScheduleForm}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm lịch
              </Button>
            </div>

            {scheduleForms.map((form, index) => (
              <div key={index} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Lịch #{index + 1}</h4>
                  {scheduleForms.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScheduleForm(index)}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Chọn đề tài</label>
                    <Select
                      value={form.thesisId?.toString() || ''}
                      onValueChange={(value) => updateScheduleForm(index, 'thesisId', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đề tài khóa luận..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Load from API */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Chọn hội đồng</label>
                    <Select
                      value={form.committeeId?.toString() || ''}
                      onValueChange={(value) => updateScheduleForm(index, 'committeeId', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn hội đồng phản biện..." />
                      </SelectTrigger>
                      <SelectContent>
                        {committees.map((committee) => (
                          <SelectItem key={committee.id} value={committee.id.toString()}>
                            {committee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Giảng viên phản biện 1</label>
                    <Select
                      value={form.reviewer1 || ''}
                      onValueChange={(value) => updateScheduleForm(index, 'reviewer1', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giáo viên phản biện 1..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Load from API */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Giảng viên phản biện 2</label>
                    <Select
                      value={form.reviewer2 || ''}
                      onValueChange={(value) => updateScheduleForm(index, 'reviewer2', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giáo viên phản biện 2..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Load from API */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Form chấm điểm</label>
                    <Select
                      value={form.gradingTemplateId?.toString() || ''}
                      onValueChange={(value) => updateScheduleForm(index, 'gradingTemplateId', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn form chấm điểm..." />
                      </SelectTrigger>
                      <SelectContent>
                        {gradingTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ngày phản biện</label>
                    <Input
                      type="date"
                      value={form.scheduledDate}
                      onChange={(e) => updateScheduleForm(index, 'scheduledDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Giờ bắt đầu</label>
                    <Input
                      type="time"
                      value={form.scheduledTime}
                      onChange={(e) => updateScheduleForm(index, 'scheduledTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Địa điểm</label>
                    <Input
                      placeholder="VD: Phòng họp A - Tầng 3"
                      value={form.location}
                      onChange={(e) => updateScheduleForm(index, 'location', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Tạo {scheduleForms.length} lịch</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa lịch phản biện"
        size="lg"
      >
        <form onSubmit={handleEditSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Đề tài</label>
            <Input value={editingSchedule?.thesisTitle || ''} disabled />
            <p className="text-sm text-muted-foreground mt-1">Mã: {editingSchedule?.thesisCode || ''}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Giảng viên phản biện 1</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={editingSchedule?.reviewer || "Chọn giáo viên phản biện 1..."} />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Load from API */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Giảng viên phản biện 2</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Chọn giáo viên phản biện 2..." />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Load from API */}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ngày phản biện</label>
              <Input type="date" defaultValue={editingSchedule?.scheduledDate || ''} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Giờ bắt đầu</label>
              <Input type="time" defaultValue={editingSchedule?.scheduledTime || ''} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Địa điểm</label>
            <Input placeholder="VD: Phòng họp A - Tầng 3" defaultValue={editingSchedule?.location || ''} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Trạng thái</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={editingSchedule?.status || "Chọn trạng thái..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang diễn ra</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu thay đổi</Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
