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

interface Deadline {
  label: string;
  date: string;
  completed: boolean;
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

export function ProjectTimeline({
  deadlines,
  isLeader,
  selectedTask,
  onTaskUpdated,
  onTaskClose,
  groupMembers = [],
}: ProjectTimelineProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [assignee, setAssignee] = React.useState('');
  const [priority, setPriority] = React.useState('MEDIUM');
  const [startDate, setStartDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [status, setStatus] = React.useState('PENDING');
  const [progress, setProgress] = React.useState('0');
  const [notes, setNotes] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [comments, setComments] = React.useState<MockComment[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const toDateInputValue = (value?: string) =>
    value ? new Date(value).toISOString().split('T')[0] : '';

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
        author: 'Bạn',
        content: comment.trim(),
        createdAt: 'Vừa xong',
      },
    ]);
    setComment('');
  };

  return (
    <>
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
                  {/* Horizontal line connector */}
                  {index < deadlines.length - 1 && (
                    <div
                      className={`absolute top-5 w-full h-0.5 -z-10 ${deadline.completed ? 'bg-green-200' : 'bg-gray-200'}`}
                      style={{ left: '50%' }}
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

      <Dialog
        open={Boolean(selectedTask)}
        onOpenChange={(open) => !open && onTaskClose?.()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhiệm vụ</DialogTitle>
            <DialogDescription>{selectedTask?.task_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên công việc</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Nhập mô tả chi tiết công việc..."
              />
            </div>
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
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hạn chót (Deadline)</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>
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
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <MessageCircle className="w-4 h-4" /> Bình luận
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
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Nhập ghi chú cho nhiệm vụ..."
              />
            </div>
          </div>
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
