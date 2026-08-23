import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProjectTimeline } from '@/components/ProjectTimeline';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskDetailDialog } from '@/components/TaskDetailDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  thesisGroupsService,
  topicRegistrationService,
  reportService,
  thesisRoundsService,
} from '@/plugins/api';

export function TimelinePage() {
  const { user } = useAuth();
  const userRole = user?.role || 'student';
  const [loading, setLoading] = useState(true);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [kanbanLists, setKanbanLists] = useState<any[]>([]);
  const [isLeader, setIsLeader] = useState<boolean>(false);
  const [currentThesisIdState, setCurrentThesisIdState] = useState<
    number | undefined
  >();
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | undefined>();

  // State tạo task mới
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    startDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State mở xem & chỉnh sửa chi tiết task
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleUpdateTask = async (updatedFields: any) => {
    try {
      if ((reportService as any).updateThesisTask) {
        await (reportService as any).updateThesisTask(updatedFields.id, {
          task_name: updatedFields.title,
          description: updatedFields.description,
          assigned_to: updatedFields.assignee
            ? parseInt(updatedFields.assignee)
            : undefined,
          status: updatedFields.status,
          priority: updatedFields.priority,
          start_date: updatedFields.startDate
            ? new Date(updatedFields.startDate).toISOString()
            : undefined,
          due_date: updatedFields.dueDate
            ? new Date(updatedFields.dueDate).toISOString()
            : undefined,
        });
      }
      fetchData();
    } catch (e) {
      console.error('Failed to update task', e);
    }
  };

  const handleCreateTask = async () => {
    if (
      !currentThesisIdState ||
      !newTask.title ||
      !newTask.dueDate ||
      !newTask.assignee
    )
      return;

    setIsSubmitting(true);
    try {
      await reportService.createThesisTask({
        thesis_id: currentThesisIdState,
        task_title: newTask.title,
        task_description: newTask.description,
        assigned_to: parseInt(newTask.assignee),
        due_date: new Date(newTask.dueDate).toISOString(),
        start_date: new Date(newTask.startDate).toISOString(),
        priority: newTask.priority as any,
        student_id: user?.id as number,
        list_id: selectedListId,
      });
      setIsCreateTaskOpen(false);
      setNewTask({
        title: '',
        description: '',
        assignee: '',
        dueDate: '',
        startDate: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM',
      });
      fetchData();
    } catch (e) {
      console.error('Failed to create task', e);
      alert('Có lỗi xảy ra khi tạo công việc!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      let currentThesisId: number | undefined;

      try {
        const registrations =
          await topicRegistrationService.getTopicRegistrations();
        if (registrations && registrations.length > 0) {
          currentThesisId = registrations[0].theses?.id;
          setCurrentThesisIdState(currentThesisId);
        }
      } catch (e) {
        console.error('Error fetching registrations:', e);
      }

      let projectTimeline: any[] = [];
      if (currentThesisId) {
        try {
          const [thesisTasks, listsResponse] = await Promise.all([
            reportService.getThesisTasks(currentThesisId),
            reportService.getKanbanLists(currentThesisId),
          ]);
          setRawTasks(Array.isArray(thesisTasks) ? thesisTasks : []);
          setKanbanLists(Array.isArray(listsResponse) ? listsResponse : []);
          projectTimeline = (Array.isArray(thesisTasks) ? thesisTasks : [])
            .map((task: any) => ({
              label: task?.task_name || 'Unknown',
              date: task?.due_date
                ? new Date(task.due_date).toLocaleDateString('vi-VN')
                : '',
              completed: task?.status === 'COMPLETED',
              rawDate: task?.due_date ? new Date(task.due_date).getTime() : 0,
            }))
            .sort((a: any, b: any) => a.rawDate - b.rawDate);
        } catch (e) {
          console.error('Error fetching tasks and lists:', e);
        }
      }

      let roundTimeline: any[] = [];
      try {
        const roundsResponse =
          await thesisRoundsService.getThesisRoundsForStudent();
        const activeRounds = roundsResponse.data;

        if (activeRounds && activeRounds.length > 0) {
          const currentRound = activeRounds[0];
          const now = new Date();
          roundTimeline = [
            {
              label: 'Bắt đầu đợt',
              date: new Date(currentRound.start_date).toLocaleDateString(
                'vi-VN',
              ),
              completed: new Date(currentRound.start_date) <= now,
            },
            {
              label: 'Đề xuất đề tài',
              date: new Date(
                currentRound.topic_proposal_deadline,
              ).toLocaleDateString('vi-VN'),
              completed: new Date(currentRound.topic_proposal_deadline) <= now,
            },
            {
              label: 'Đăng ký đề tài',
              date: new Date(
                currentRound.registration_deadline,
              ).toLocaleDateString('vi-VN'),
              completed: new Date(currentRound.registration_deadline) <= now,
            },
            {
              label: 'Nộp báo cáo',
              date: new Date(
                currentRound.report_submission_deadline,
              ).toLocaleDateString('vi-VN'),
              completed:
                new Date(currentRound.report_submission_deadline) <= now,
            },
            {
              label: 'Kết thúc đợt',
              date: new Date(currentRound.end_date).toLocaleDateString('vi-VN'),
              completed: new Date(currentRound.end_date) <= now,
            },
          ];
        }
      } catch (e) {
        console.error('Error fetching thesis rounds:', e);
      }

      let userIsLeader = false;
      try {
        const groups = await thesisGroupsService.getThesisGroups(user?.id);
        if (groups && groups.length > 0) {
          const members = groups[0].thesis_group_members || [];
          setGroupMembers(members);
          userIsLeader =
            members.find((m: any) => m.students?.users?.id === user?.id)
              ?.role === 'LEADER';
        }
      } catch (e) {
        console.error('Error checking leader status:', e);
      }
      setIsLeader(userIsLeader);

      if (userIsLeader && projectTimeline.length > 0) {
        setDeadlines(projectTimeline);
      } else {
        setDeadlines(roundTimeline);
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageLayout
        userRole={userRole as any}
        userName={user?.fullName || 'Nguyễn Văn A'}
        title="Timeline"
        subtitle="Chi tiết các mốc thời gian"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      </PageLayout>
    );
  }

  const handleAddKanbanList = async (name: string) => {
    if (!currentThesisIdState) return;
    try {
      await reportService.createKanbanList({
        thesis_id: currentThesisIdState,
        name,
      });
      fetchData();
    } catch (e) {
      console.error('Failed to create list', e);
      throw e;
    }
  };

  const handleOpenCreateDialog = (listId?: number) => {
    setSelectedListId(listId);
    setIsCreateTaskOpen(true);
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'Nguyễn Văn A'}
      title="Timeline"
      subtitle={
        isLeader
          ? 'Timeline dự án theo từng công việc'
          : 'Các mốc thời gian của đợt khóa luận'
      }
    >
      <div className="flex flex-col gap-8 h-full min-h-[calc(100vh-12rem)]">
        {/* Project Timeline mốc thời gian */}
        <div className="w-full shrink-0">
          <ProjectTimeline deadlines={deadlines} isLeader={isLeader} />
        </div>

        {/* Bảng Kanban */}
        <div className="flex-1 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Bảng Công Việc (Kanban)</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <KanbanBoard
              tasks={rawTasks}
              lists={kanbanLists}
              onAddList={handleAddKanbanList}
              onOpenCreateDialog={handleOpenCreateDialog}
              onTaskClick={handleTaskClick}
            />
          </div>
        </div>
      </div>

      {/* Modal Tạo Task Mới */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo công việc / Phân công mới</DialogTitle>
            <DialogDescription>
              Tạo một công việc mới và phân công cho thành viên trong nhóm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Tên công việc <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Nhập tên công việc"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả (Tùy chọn)</Label>
              <Textarea
                placeholder="Nhập mô tả chi tiết công việc..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Người thực hiện <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newTask.assignee}
                  onValueChange={(val) =>
                    setNewTask({ ...newTask, assignee: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupMembers.map((member: any) => {
                      const studentIdStr =
                        member.student_id?.toString() ||
                        member.students?.id?.toString() ||
                        '';
                      return (
                        <SelectItem
                          key={studentIdStr || Math.random()}
                          value={studentIdStr}
                        >
                          {member.students?.users?.full_name || 'Unknown'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mức độ ưu tiên</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(val) =>
                    setNewTask({ ...newTask, priority: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Thấp (Low)</SelectItem>
                    <SelectItem value="MEDIUM">Trung bình (Medium)</SelectItem>
                    <SelectItem value="HIGH">Cao (High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Hạn chót (Deadline) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateTaskOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={
                isSubmitting ||
                !newTask.title ||
                !newTask.dueDate ||
                !newTask.assignee
              }
            >
              {isSubmitting ? 'Đang tạo...' : 'Lưu công việc'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Chi Tiết & Chỉnh Sửa Task */}
      <TaskDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        task={selectedTask}
        groupMembers={groupMembers}
        onUpdateTask={handleUpdateTask}
        currentUser={user}
      />
    </PageLayout>
  );
}
