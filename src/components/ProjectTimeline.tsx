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
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  User,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

import { Button } from './ui/button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  avatarText: string;
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
  /* Task Form States */
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [assignee, setAssignee] = React.useState('');
  const [priority, setPriority] = React.useState('MEDIUM');
  const [startDate, setStartDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [status, setStatus] = React.useState('PENDING');
  const [progress, setProgress] = React.useState('0');
  const [notes, setNotes] = React.useState('');

  /* UI Tabs & Collapsibles */
  const [isSubtasksOpen, setIsSubtasksOpen] = React.useState(false);
  const [activeActivityTab, setActiveActivityTab] = React.useState<
    'comments' | 'notes'
  >('comments');

  /* Comments */
  const [comment, setComment] = React.useState('');
  const [comments, setComments] = React.useState<MockComment[]>([]);

  /* Subtasks */
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [isCreatingSubtask, setIsCreatingSubtask] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = React.useState('');

  const [editingSubtaskId, setEditingSubtaskId] = React.useState<number | null>(
    null,
  );
  const [editingSubtaskTitle, setEditingSubtaskTitle] = React.useState('');
  const [editingSubtaskAssignee, setEditingSubtaskAssignee] =
    React.useState('');
  const [editingSubtaskStatus, setEditingSubtaskStatus] = React.useState<
    'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  >('PENDING');

  const [isSaving, setIsSaving] = React.useState(false);

  /* Helper Functions */
  const toDateInputValue = (value?: string) =>
    value ? new Date(value).toISOString().split('T')[0] : '';

  const getMember = (memberId?: number) => {
    if (!memberId) return null;
    return groupMembers.find((item: any) => {
      const id = item.student_id || item.students?.id;
      return Number(id) === Number(memberId);
    });
  };

  const getMemberName = (memberId?: number) => {
    const member = getMember(memberId);
    return member?.students?.users?.full_name || 'Chưa phân công';
  };

  const getMemberInitials = (memberId?: number) => {
    const name = getMemberName(memberId);
    if (name === 'Chưa phân công' || name === 'Unknown') return '?';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.charAt(0).toUpperCase() || 'U';
  };

  /* Sync Task Data on Dialog Open */
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
    setSubtasks(selectedTask.subtasks || []);

    setIsSubtasksOpen(false);
    setIsCreatingSubtask(false);
    setNewSubtaskTitle('');
    setNewSubtaskAssignee('');
    setEditingSubtaskId(null);

    setComments([
      {
        id: selectedTask.id * 10 + 1,
        author: 'Nguyễn Văn A',
        avatarText: 'A',
        content:
          'Đã hoàn thiện thiết kế UI ban đầu trên Figma, đang đợi review.',
        createdAt: 'Hôm qua lúc 14:20',
      },
    ]);
    setComment('');
  }, [selectedTask]);

  /* Handlers */
  const handleSave = async () => {
    if (!selectedTask || !onTaskUpdated) return;
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
        subtasks,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setComments((current) => [
      ...current,
      {
        id: Date.now(),
        author: 'Tôi',
        avatarText: 'T',
        content: comment.trim(),
        createdAt: 'Vừa xong',
      },
    ]);
    setComment('');
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: Date.now(),
      title: newSubtaskTitle.trim(),
      assigned_to: newSubtaskAssignee ? Number(newSubtaskAssignee) : undefined,
      status: 'PENDING',
    };
    setSubtasks((current) => [...current, newSubtask]);
    setNewSubtaskTitle('');
    setNewSubtaskAssignee('');
    setIsCreatingSubtask(false);
  };

  const handleToggleSubtaskStatus = (id: number) => {
    setSubtasks((current) =>
      current.map((st) => {
        if (st.id === id) {
          const nextStatus: Subtask['status'] =
            st.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
          return { ...st, status: nextStatus };
        }
        return st;
      }),
    );
  };

  const handleDeleteSubtask = (id: number) => {
    setSubtasks((current) => current.filter((item) => item.id !== id));
  };

  const handleStartEditSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
    setEditingSubtaskAssignee(subtask.assigned_to?.toString() || '');
    setEditingSubtaskStatus(subtask.status);
  };

  const handleSaveEditSubtask = () => {
    if (editingSubtaskId === null || !editingSubtaskTitle.trim()) return;
    setSubtasks((current) =>
      current.map((st) =>
        st.id === editingSubtaskId
          ? {
              ...st,
              title: editingSubtaskTitle.trim(),
              assigned_to: editingSubtaskAssignee
                ? Number(editingSubtaskAssignee)
                : undefined,
              status: editingSubtaskStatus,
            }
          : st,
      ),
    );
    setEditingSubtaskId(null);
  };

  const completedCount = subtasks.filter(
    (s) => s.status === 'COMPLETED',
  ).length;
  const subtaskProgressPercent = subtasks.length
    ? Math.round((completedCount / subtasks.length) * 100)
    : 0;

  return (
    <>
      {/* ======================================================== */}
      {/* TIMELINE VIEW (Mốc thời gian dự án) */}
      {/* ======================================================== */}
      <Card className="w-full border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                {isLeader ? 'Mốc tiến độ đồ án' : 'Timeline khóa luận'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Theo dõi các mốc nộp bài và đánh giá quan trọng
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-white text-xs font-normal text-slate-600 border-slate-200"
            >
              {deadlines.length} mốc
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {deadlines.length > 0 ? (
            <div className="flex flex-row items-start justify-between w-full overflow-x-auto pb-4 gap-4 px-2">
              {deadlines.map((deadline, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center flex-1 relative min-w-[130px] group"
                >
                  {index < deadlines.length - 1 && (
                    <div
                      className={`absolute top-4 w-full h-[2px] -z-10 transition-colors ${
                        deadline.completed ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                      style={{ left: '50%' }}
                    />
                  )}

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ring-4 ring-white ${
                      deadline.completed
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                        : 'bg-white border-2 border-blue-500 text-blue-600'
                    }`}
                  >
                    {deadline.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <span className="font-semibold text-xs text-slate-700 block line-clamp-1">
                      {deadline.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {deadline.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8 text-sm">
              Chưa có dữ liệu timeline
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* JIRA-STYLE ISSUE DETAIL DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={Boolean(selectedTask)}
        onOpenChange={(open) => !open && onTaskClose?.()}
      >
        <DialogContent className="w-[95vw] max-w-[1400px] sm:max-w-[1000px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white sm:rounded-xl shadow-2xl border-slate-200">
          {/* Top Bar Header */}
          <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200/80 rounded text-blue-700 font-mono text-xs font-semibold">
                <CheckSquare className="w-3.5 h-3.5" />
                TASK-{selectedTask?.id || '01'}
              </div>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Chi tiết nhiệm vụ
              </span>
            </div>
          </DialogHeader>

          {/* Body: 2 Columns Jira Layout */}
          <div className="flex-1 overflow-y-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ======================================= */}
            {/* LEFT COLUMN: MAIN CONTENT (col-span-7) */}
            {/* ======================================= */}
            <div className="lg:col-span-7 space-y-6">
              {/* Task Title */}
              <div className="space-y-1.5">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề công việc..."
                  className="text-lg font-bold border-transparent hover:border-slate-200 focus:border-blue-500 px-2.5 py-2 -ml-2.5 rounded-lg text-slate-900 transition-all"
                />
              </div>

              {/* Task Description */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Mô tả chi tiết
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Thêm mô tả chi tiết cho công việc này..."
                  rows={4}
                  className="resize-none text-sm text-slate-700 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border-slate-200/80 focus:ring-1 focus:ring-blue-500 rounded-lg"
                />
              </div>

              {/* Jira Subtasks Section */}
              <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-xs space-y-3">
                {/* Header Subtask & Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSubtasksOpen((prev) => !prev)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    >
                      {isSubtasksOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      Công việc con (Subtasks)
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      ({completedCount}/{subtasks.length})
                    </span>
                  </div>

                  {!isCreatingSubtask && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsSubtasksOpen(true);
                        setIsCreatingSubtask(true);
                      }}
                      className="h-7 px-2.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Tạo việc con
                    </Button>
                  )}
                </div>

                {/* Subtask Progress bar */}
                {subtasks.length > 0 && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${subtaskProgressPercent}%` }}
                    />
                  </div>
                )}

                {/* Subtasks List */}
                {isSubtasksOpen && (
                  <div className="space-y-2 pt-1">
                    {subtasks.map((st) => {
                      const isEditing = editingSubtaskId === st.id;
                      const isDone = st.status === 'COMPLETED';

                      return (
                        <div
                          key={st.id}
                          className="group border border-slate-100 hover:border-slate-200 rounded-lg p-2.5 bg-slate-50/40 hover:bg-white hover:shadow-xs transition-all"
                        >
                          {isEditing ? (
                            <div className="space-y-2.5 p-1">
                              <Input
                                value={editingSubtaskTitle}
                                onChange={(e) =>
                                  setEditingSubtaskTitle(e.target.value)
                                }
                                placeholder="Tiêu đề subtask..."
                                className="h-8 text-xs font-medium"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  value={editingSubtaskAssignee}
                                  onValueChange={setEditingSubtaskAssignee}
                                >
                                  <SelectTrigger className="h-8 text-xs bg-white">
                                    <SelectValue placeholder="Phân công" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {groupMembers.map((member: any) => {
                                      const memberId =
                                        member.student_id?.toString() ||
                                        member.students?.id?.toString() ||
                                        '';
                                      return (
                                        <SelectItem
                                          key={memberId}
                                          value={memberId}
                                        >
                                          {member.students?.users?.full_name}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={editingSubtaskStatus}
                                  onValueChange={(v) =>
                                    setEditingSubtaskStatus(v as any)
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PENDING">
                                      Chưa làm
                                    </SelectItem>
                                    <SelectItem value="IN_PROGRESS">
                                      Đang làm
                                    </SelectItem>
                                    <SelectItem value="COMPLETED">
                                      Hoàn thành
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex justify-end gap-1.5 pt-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => setEditingSubtaskId(null)}
                                >
                                  Hủy
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                  onClick={handleSaveEditSubtask}
                                >
                                  Lưu
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {/* Custom Checkbox */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleSubtaskStatus(st.id)
                                  }
                                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-blue-500 bg-white'
                                  }`}
                                >
                                  {isDone && (
                                    <CheckSquare className="w-3 h-3" />
                                  )}
                                </button>

                                <span
                                  className={`text-xs font-medium truncate ${
                                    isDone
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {st.title}
                                </span>
                              </div>

                              {/* Assignee & Actions */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">
                                  <div className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold">
                                    {getMemberInitials(st.assigned_to)}
                                  </div>
                                  <span className="max-w-[80px] truncate">
                                    {getMemberName(st.assigned_to)}
                                  </span>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditSubtask(st)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubtask(st.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {subtasks.length === 0 && !isCreatingSubtask && (
                      <div className="py-4 text-center border border-dashed border-slate-200 rounded-lg">
                        <span className="text-xs text-slate-400">
                          Chưa có công việc con nào được tạo.
                        </span>
                      </div>
                    )}

                    {/* Inline Create Form */}
                    {isCreatingSubtask && (
                      <div className="p-3 border border-blue-200 bg-blue-50/30 rounded-lg space-y-2.5 animate-in fade-in-50 duration-200">
                        <Input
                          autoFocus
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="Cần làm gì tiếp theo?"
                          className="h-8 text-xs bg-white"
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleAddSubtask()
                          }
                        />
                        <div className="flex items-center justify-between gap-2">
                          <Select
                            value={newSubtaskAssignee}
                            onValueChange={setNewSubtaskAssignee}
                          >
                            <SelectTrigger className="h-7 text-xs w-[180px] bg-white">
                              <SelectValue placeholder="Giao cho..." />
                            </SelectTrigger>
                            <SelectContent>
                              {groupMembers.map((member: any) => {
                                const id =
                                  member.student_id?.toString() ||
                                  member.students?.id?.toString() ||
                                  '';
                                return (
                                  <SelectItem key={id} value={id}>
                                    {member.students?.users?.full_name}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setIsCreatingSubtask(false)}
                            >
                              Hủy
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                              onClick={handleAddSubtask}
                              disabled={!newSubtaskTitle.trim()}
                            >
                              Tạo
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Activity Section (Comments & Notes Tabs) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveActivityTab('comments')}
                    className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
                      activeActivityTab === 'comments'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Bình luận ({comments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActivityTab('notes')}
                    className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
                      activeActivityTab === 'notes'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Ghi chú cá nhân
                  </button>
                </div>

                {activeActivityTab === 'comments' ? (
                  <div className="space-y-3">
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {comments.map((item) => (
                        <div key={item.id} className="flex gap-2.5 text-xs">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {item.avatarText}
                          </div>
                          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                              <span>{item.author}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {item.createdAt}
                              </span>
                            </div>
                            <p className="text-slate-600">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 items-center pt-1">
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Viết bình luận cho công việc..."
                        className="text-xs h-9 bg-slate-50/50 focus:bg-white"
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleAddComment()
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 px-3 bg-blue-600 hover:bg-blue-700"
                        onClick={handleAddComment}
                        disabled={!comment.trim()}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ghi chú riêng về tiến độ, blockers..."
                    rows={3}
                    className="text-xs bg-slate-50/50 border-slate-200 rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* ======================================= */}
            {/* RIGHT COLUMN: JIRA SIDEBAR (col-span-5) */}
            {/* ======================================= */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-200/60">
                  Thông tin thuộc tính
                </div>

                {/* Trạng thái */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 font-medium">
                    Trạng thái
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9 bg-white border-slate-200 font-semibold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Chưa bắt đầu
                        </span>
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Đang thực hiện
                        </span>
                      </SelectItem>
                      <SelectItem value="COMPLETED">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Hoàn thành
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Người thực hiện (Assignee) */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 font-medium">
                    Người thực hiện
                  </Label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger className="h-9 bg-white border-slate-200 text-xs">
                      <SelectValue placeholder="Chọn thành viên đảm nhiệm" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupMembers.map((member: any) => {
                        const id =
                          member.student_id?.toString() ||
                          member.students?.id?.toString() ||
                          '';
                        return (
                          <SelectItem key={id} value={id}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center">
                                {member.students?.users?.full_name?.charAt(0)}
                              </div>
                              <span>{member.students?.users?.full_name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Độ ưu tiên */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 font-medium">
                    Mức độ ưu tiên
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9 bg-white border-slate-200 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">
                        <span className="text-slate-600">⚪ Thấp (Low)</span>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <span className="text-amber-600 font-medium">
                          🟡 Trung bình (Medium)
                        </span>
                      </SelectItem>
                      <SelectItem value="HIGH">
                        <span className="text-rose-600 font-bold">
                          🔴 Cao (High)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tiến độ (%) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="text-slate-500 font-medium">
                      Tiến độ hoàn thành
                    </Label>
                    <span className="font-bold text-slate-700">
                      {progress}%
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                {/* Thời gian thực hiện */}
                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-400">
                      Ngày bắt đầu
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-400">
                      Hạn chót (Due date)
                    </Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between sm:justify-between">
            <span className="text-xs text-slate-400">
              Nhấn Lưu để đồng bộ trạng thái đồ án
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onTaskClose}
                disabled={isSaving}
                className="text-xs font-medium"
              >
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold px-4"
              >
                {isSaving ? 'Đang cập nhật...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
