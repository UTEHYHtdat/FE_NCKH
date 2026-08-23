import React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card';

import { Badge } from './ui/badge';

import {
  CheckCircle2,
  Clock,
  Calendar,
  MessageCircle,
  Send,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  User,
} from 'lucide-react';

import { Button } from './ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

import { Input } from './ui/input';
import { Label } from './ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

import { Textarea } from './ui/textarea';

/* ============================= */
/* INTERFACES */
/* ============================= */

interface Deadline {
  label: string;
  date: string;
  completed: boolean;
}

interface Subtask {
  id: number;
  title: string;
  assigned_to?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface ProjectTimelineProps {
  deadlines: Deadline[];
  isLeader: boolean;

  selectedTask?: {
    id: number;
    task_name: string;
    task_description?: string;
    assigned_to?: number;
    due_date?: string;
    start_date?: string;
    priority?: string;
    status: string;
    progress_percentage?: number;
    notes?: string;

    subtasks?: Subtask[];
  } | null;

  onTaskUpdated?: (task: ProjectTimelineProps['selectedTask']) => Promise<void>;

  onTaskClose?: () => void;

  groupMembers?: any[];
}

interface MockComment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

/* ============================= */
/* COMPONENT */
/* ============================= */

export function ProjectTimeline({
  deadlines,
  isLeader,
  selectedTask,
  onTaskUpdated,
  onTaskClose,
  groupMembers = [],
}: ProjectTimelineProps) {
  /* ============================= */
  /* TASK STATES */
  /* ============================= */

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [assignee, setAssignee] = React.useState('');
  const [priority, setPriority] = React.useState('MEDIUM');
  const [startDate, setStartDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [status, setStatus] = React.useState('PENDING');
  const [progress, setProgress] = React.useState('0');
  const [notes, setNotes] = React.useState('');

  /* ============================= */
  /* COMMENTS */
  /* ============================= */

  const [comment, setComment] = React.useState('');
  const [comments, setComments] = React.useState<MockComment[]>([]);

  /* ============================= */
  /* SUBTASK */
  /* ============================= */

  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);

  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');

  const [newSubtaskAssignee, setNewSubtaskAssignee] = React.useState('');

  const [newSubtaskStatus, setNewSubtaskStatus] = React.useState<
    'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  >('PENDING');

  /*
   * ID của Subtask đang chỉnh sửa
   */
  const [editingSubtaskId, setEditingSubtaskId] = React.useState<number | null>(
    null,
  );

  /*
   * Dữ liệu khi chỉnh sửa Subtask
   */
  const [editingSubtaskTitle, setEditingSubtaskTitle] = React.useState('');

  const [editingSubtaskAssignee, setEditingSubtaskAssignee] =
    React.useState('');

  const [editingSubtaskStatus, setEditingSubtaskStatus] = React.useState<
    'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  >('PENDING');

  const [isSaving, setIsSaving] = React.useState(false);

  /* ============================= */
  /* HELPERS */
  /* ============================= */

  const toDateInputValue = (value?: string) =>
    value ? new Date(value).toISOString().split('T')[0] : '';

  const getMemberName = (memberId?: number) => {
    if (!memberId) {
      return 'Chưa phân công';
    }

    const member = groupMembers.find((item: any) => {
      const id = item.student_id || item.students?.id;

      return Number(id) === Number(memberId);
    });

    return member?.students?.users?.full_name || 'Chưa xác định';
  };

  const getStatusLabel = (taskStatus: string) => {
    switch (taskStatus) {
      case 'PENDING':
        return 'Chưa bắt đầu';

      case 'IN_PROGRESS':
        return 'Đang thực hiện';

      case 'COMPLETED':
        return 'Hoàn thành';

      default:
        return taskStatus;
    }
  };

  const getStatusClass = (taskStatus: string) => {
    switch (taskStatus) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';

      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  /* ============================= */
  /* LOAD TASK */
  /* ============================= */

  React.useEffect(() => {
    if (!selectedTask) return;

    setTitle(selectedTask.task_name || '');

    setDescription(selectedTask.task_description || '');

    setAssignee(selectedTask.assigned_to?.toString() || '');

    setPriority(selectedTask.priority || 'MEDIUM');

    setStartDate(toDateInputValue(selectedTask.start_date));

    setDueDate(toDateInputValue(selectedTask.due_date));

    setStatus(selectedTask.status || 'PENDING');

    setProgress(String(selectedTask.progress_percentage ?? 0));

    setNotes(selectedTask.notes || '');

    /* Load subtasks */

    setSubtasks(selectedTask.subtasks || []);

    /* Reset form */

    setNewSubtaskTitle('');
    setNewSubtaskAssignee('');
    setNewSubtaskStatus('PENDING');

    setEditingSubtaskId(null);

    /* Mock comments */

    setComments([
      {
        id: selectedTask.id * 10 + 1,
        author: 'Nguyễn Văn A',
        content: 'Mình đã cập nhật tiến độ nhiệm vụ này.',
        createdAt: 'Hôm qua, 09:30',
      },
    ]);

    setComment('');
  }, [selectedTask]);

  /* ============================= */
  /* SAVE TASK */
  /* ============================= */

  const handleSave = async () => {
    if (!selectedTask || !onTaskUpdated) {
      return;
    }

    setIsSaving(true);

    try {
      await onTaskUpdated({
        ...selectedTask,

        task_name: title,

        task_description: description,

        assigned_to: assignee ? Number(assignee) : selectedTask.assigned_to,

        priority,

        start_date: startDate,

        due_date: dueDate,

        status,

        progress_percentage: Math.min(100, Math.max(0, Number(progress) || 0)),

        notes,

        /*
         * Gửi toàn bộ Subtasks
         */

        subtasks,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ============================= */
  /* COMMENTS */
  /* ============================= */

  const handleAddComment = () => {
    if (!comment.trim()) {
      return;
    }

    setComments((current) => [
      ...current,
      {
        id: Date.now(),
        author: 'Bạn',
        content: comment.trim(),
        createdAt: 'Vừa xong',
      },
    ]);

    setComment('');
  };

  /* ============================= */
  /* ADD SUBTASK */
  /* ============================= */

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      return;
    }

    const newSubtask: Subtask = {
      id: Date.now(),

      title: newSubtaskTitle.trim(),

      assigned_to: newSubtaskAssignee ? Number(newSubtaskAssignee) : undefined,

      status: newSubtaskStatus,
    };

    setSubtasks((current) => [...current, newSubtask]);

    /* Reset form */

    setNewSubtaskTitle('');
    setNewSubtaskAssignee('');
    setNewSubtaskStatus('PENDING');
  };

  /* ============================= */
  /* DELETE SUBTASK */
  /* ============================= */

  const handleDeleteSubtask = (id: number) => {
    setSubtasks((current) => current.filter((subtask) => subtask.id !== id));
  };

  /* ============================= */
  /* START EDIT SUBTASK */
  /* ============================= */

  const handleStartEditSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);

    setEditingSubtaskTitle(subtask.title);

    setEditingSubtaskAssignee(subtask.assigned_to?.toString() || '');

    setEditingSubtaskStatus(subtask.status);
  };

  /* ============================= */
  /* CANCEL EDIT */
  /* ============================= */

  const handleCancelEditSubtask = () => {
    setEditingSubtaskId(null);

    setEditingSubtaskTitle('');

    setEditingSubtaskAssignee('');

    setEditingSubtaskStatus('PENDING');
  };

  /* ============================= */
  /* SAVE EDIT SUBTASK */
  /* ============================= */

  const handleSaveEditSubtask = () => {
    if (editingSubtaskId === null || !editingSubtaskTitle.trim()) {
      return;
    }

    setSubtasks((current) =>
      current.map((subtask) => {
        if (subtask.id !== editingSubtaskId) {
          return subtask;
        }

        return {
          ...subtask,

          title: editingSubtaskTitle.trim(),

          assigned_to: editingSubtaskAssignee
            ? Number(editingSubtaskAssignee)
            : undefined,

          status: editingSubtaskStatus,
        };
      }),
    );

    handleCancelEditSubtask();
  };

  /* ============================= */
  /* COUNT COMPLETED */
  /* ============================= */

  const completedSubtasks = subtasks.filter(
    (subtask) => subtask.status === 'COMPLETED',
  ).length;

  /* ============================= */
  /* RENDER */
  /* ============================= */

  return (
    <>
      {/* ============================= */}
      {/* TIMELINE */}
      {/* ============================= */}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {isLeader ? 'Timeline dự án' : 'Timeline đợt khóa luận'}
          </CardTitle>

          <CardDescription>
            Các mốc quan trọng trong quá trình thực hiện
          </CardDescription>
        </CardHeader>

        <CardContent>
          {deadlines.length > 0 ? (
            <div className="flex flex-row items-start justify-between w-full overflow-x-auto pb-4 gap-4 px-4">
              {deadlines.map((deadline, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center flex-1 relative min-w-[120px]"
                >
                  {index < deadlines.length - 1 && (
                    <div
                      className={`absolute top-5 w-full h-0.5 -z-10 ${
                        deadline.completed ? 'bg-green-200' : 'bg-gray-200'
                      }`}
                      style={{
                        left: '50%',
                      }}
                    />
                  )}

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                      deadline.completed ? 'bg-green-100' : 'bg-blue-100'
                    }`}
                  >
                    {deadline.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <h4 className="font-medium text-sm">{deadline.label}</h4>

                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />

                      <span>{deadline.date}</span>
                    </div>

                    {deadline.completed && (
                      <Badge
                        variant="default"
                        className="mt-2 text-[10px] px-1.5 py-0"
                      >
                        Hoàn thành
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Không có timeline
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================= */}
      {/* DIALOG TASK */}
      {/* ============================= */}

      <Dialog
        open={Boolean(selectedTask)}
        onOpenChange={(open) => !open && onTaskClose?.()}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhiệm vụ</DialogTitle>

            <DialogDescription>{selectedTask?.task_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* TÊN TASK */}

            <div className="space-y-2">
              <Label>Tên công việc</Label>

              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            {/* MÔ TẢ */}

            <div className="space-y-2">
              <Label>Mô tả</Label>

              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Nhập mô tả chi tiết..."
              />
            </div>

            {/* ASSIGNEE + PRIORITY */}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Người thực hiện</Label>

                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành viên" />
                  </SelectTrigger>

                  <SelectContent>
                    {groupMembers.map((member: any) => {
                      const memberId =
                        member.student_id?.toString() ||
                        member.students?.id?.toString() ||
                        '';

                      return (
                        <SelectItem key={memberId} value={memberId}>
                          {member.students?.users?.full_name || 'Unknown'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mức độ ưu tiên</Label>

                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="LOW">Thấp</SelectItem>

                    <SelectItem value="MEDIUM">Trung bình</SelectItem>

                    <SelectItem value="HIGH">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* DATE */}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>

                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Hạn chót</Label>

                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>

            {/* STATUS */}

            <div className="space-y-2">
              <Label>Trạng thái</Label>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="PENDING">Chưa bắt đầu</SelectItem>

                  <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>

                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PROGRESS */}

            <div className="space-y-2">
              <Label>Tiến độ (%)</Label>

              <Input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(event) => setProgress(event.target.value)}
              />
            </div>

            {/* ============================= */}
            {/* SUBTASK SECTION */}
            {/* ============================= */}

            <div className="border-t pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Công việc con</h3>

                  <p className="text-sm text-muted-foreground">
                    {completedSubtasks}/{subtasks.length} công việc đã hoàn
                    thành
                  </p>
                </div>
              </div>

              {/* ============================= */}
              {/* LIST SUBTASK */}
              {/* ============================= */}

              <div className="space-y-3">
                {subtasks.map((subtask) => {
                  const isEditing = editingSubtaskId === subtask.id;

                  return (
                    <div key={subtask.id} className="rounded-lg border p-4">
                      {isEditing ? (
                        /* ================= */
                        /* EDIT MODE */
                        /* ================= */

                        <div className="space-y-3">
                          <Input
                            value={editingSubtaskTitle}
                            onChange={(event) =>
                              setEditingSubtaskTitle(event.target.value)
                            }
                            placeholder="Tên công việc con"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            {/* ASSIGNEE */}

                            <Select
                              value={editingSubtaskAssignee}
                              onValueChange={setEditingSubtaskAssignee}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn người thực hiện" />
                              </SelectTrigger>

                              <SelectContent>
                                {groupMembers.map((member: any) => {
                                  const memberId =
                                    member.student_id?.toString() ||
                                    member.students?.id?.toString() ||
                                    '';

                                  return (
                                    <SelectItem key={memberId} value={memberId}>
                                      {member.students?.users?.full_name ||
                                        'Unknown'}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>

                            {/* STATUS */}

                            <Select
                              value={editingSubtaskStatus}
                              onValueChange={(value) =>
                                setEditingSubtaskStatus(
                                  value as
                                    | 'PENDING'
                                    | 'IN_PROGRESS'
                                    | 'COMPLETED',
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectItem value="PENDING">
                                  Chưa bắt đầu
                                </SelectItem>

                                <SelectItem value="IN_PROGRESS">
                                  Đang thực hiện
                                </SelectItem>

                                <SelectItem value="COMPLETED">
                                  Hoàn thành
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* BUTTON */}

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEditSubtask}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Hủy
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveEditSubtask}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Lưu
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ================= */
                        /* VIEW MODE */
                        /* ================= */

                        <div className="flex items-center gap-3">
                          {/* ICON */}

                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center ${
                              subtask.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-600'
                                : subtask.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {subtask.status === 'COMPLETED' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Clock className="w-5 h-5" />
                            )}
                          </div>

                          {/* INFO */}

                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                subtask.status === 'COMPLETED'
                                  ? 'line-through text-muted-foreground'
                                  : ''
                              }`}
                            >
                              {subtask.title}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* USER */}

                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />

                                {getMemberName(subtask.assigned_to)}
                              </div>

                              {/* STATUS */}

                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getStatusClass(
                                  subtask.status,
                                )}`}
                              >
                                {getStatusLabel(subtask.status)}
                              </span>
                            </div>
                          </div>

                          {/* ACTION */}

                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleStartEditSubtask(subtask)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteSubtask(subtask.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {subtasks.length === 0 && (
                  <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                    Chưa có công việc con
                  </div>
                )}
              </div>

              {/* ============================= */}
              {/* ADD SUBTASK */}
              {/* ============================= */}

              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <h4 className="font-medium text-sm">Thêm công việc con</h4>

                {/* TITLE */}

                <Input
                  value={newSubtaskTitle}
                  onChange={(event) => setNewSubtaskTitle(event.target.value)}
                  placeholder="Ví dụ: Thiết kế giao diện Dashboard"
                />

                <div className="grid grid-cols-2 gap-3">
                  {/* ASSIGNEE */}

                  <Select
                    value={newSubtaskAssignee}
                    onValueChange={setNewSubtaskAssignee}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn người thực hiện" />
                    </SelectTrigger>

                    <SelectContent>
                      {groupMembers.map((member: any) => {
                        const memberId =
                          member.student_id?.toString() ||
                          member.students?.id?.toString() ||
                          '';

                        return (
                          <SelectItem key={memberId} value={memberId}>
                            {member.students?.users?.full_name || 'Unknown'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* STATUS */}

                  <Select
                    value={newSubtaskStatus}
                    onValueChange={(value) =>
                      setNewSubtaskStatus(
                        value as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="PENDING">Chưa bắt đầu</SelectItem>

                      <SelectItem value="IN_PROGRESS">
                        Đang thực hiện
                      </SelectItem>

                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* BUTTON ADD */}

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm công việc con
                </Button>
              </div>
            </div>

            {/* ============================= */}
            {/* COMMENTS */}
            {/* ============================= */}

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <MessageCircle className="w-4 h-4" />
                Bình luận
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {comments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-muted/50 p-3 text-sm"
                  >
                    <div className="flex justify-between gap-2 font-medium">
                      <span>{item.author}</span>

                      <span className="text-xs text-muted-foreground">
                        {item.createdAt}
                      </span>
                    </div>

                    <p className="mt-1 text-muted-foreground">{item.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Viết bình luận..."
                  onKeyDown={(event) =>
                    event.key === 'Enter' && handleAddComment()
                  }
                />

                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  aria-label="Gửi bình luận"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* NOTES */}

            <div className="space-y-2">
              <Label>Ghi chú</Label>

              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Nhập ghi chú cho nhiệm vụ..."
              />
            </div>
          </div>

          {/* FOOTER */}

          <DialogFooter>
            <Button variant="outline" onClick={onTaskClose} disabled={isSaving}>
              Hủy
            </Button>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
