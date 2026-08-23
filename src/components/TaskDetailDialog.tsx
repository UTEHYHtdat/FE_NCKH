import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckSquare,
  Paperclip,
  Plus,
  Send,
  User,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface TaskDetailDialogProps {
  task: any | null;
  isOpen: boolean;
  onClose: () => void;
  groupMembers: any[];
  onUpdateTask: (updatedTask: any) => Promise<void>;
  currentUser?: any;
}

export function TaskDetailDialog({
  task,
  isOpen,
  onClose,
  groupMembers,
  onUpdateTask,
  currentUser,
}: TaskDetailDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        id: task.id,
        title: task.task_name || task.title || '',
        description: task.description || task.task_description || '',
        status: task.status || 'IN_PROGRESS',
        priority: task.priority || 'MEDIUM',
        assignee:
          task.assigned_to?.toString() || task.assignee?.toString() || '',
        startDate: task.start_date ? task.start_date.split('T')[0] : '',
        dueDate: task.due_date ? task.due_date.split('T')[0] : '',
      });
      setComments(task.comments || []);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async (customFields?: any) => {
    const payload = { ...formData, ...customFields };
    setIsSaving(true);
    try {
      await onUpdateTask(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentItem = {
      id: Date.now(),
      author: currentUser?.fullName || 'Người dùng',
      content: newComment,
      createdAt: 'Vừa xong',
    };
    setComments((prev) => [commentItem, ...prev]);
    setNewComment('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogTitle className="sr-only">Chi tiết nhiệm vụ</DialogTitle>

        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <CheckSquare className="w-4 h-4" /> KAN-{task.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Cải thiện mô tả bằng AI
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-y-auto divide-y md:divide-y-0 md:divide-x">
          {/* Cột trái: Title, Description, Activity */}
          <div className="p-6 md:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                onBlur={() => handleSave()}
                placeholder="Tên nhiệm vụ..."
                className="text-xl font-bold border-transparent hover:border-input focus:border-input px-2 shadow-none"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <Paperclip className="w-3.5 h-3.5" /> Đính kèm
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Subtask
              </Button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Mô tả (Description)
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                onBlur={() => handleSave()}
                placeholder="Thêm mô tả chi tiết cho nhiệm vụ..."
                className="min-h-[120px] resize-y"
              />
            </div>

            {/* Activity & Comments */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="w-4 h-4" /> Hoạt động & Bình luận
              </div>

              {/* Input bình luận */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="min-h-[70px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Gửi
                    </Button>
                  </div>
                </div>
              </div>

              {/* Danh sách bình luận */}
              <div className="space-y-4 pt-2">
                {comments.map((cmt) => (
                  <div key={cmt.id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {cmt.author?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{cmt.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {cmt.createdAt}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        {cmt.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Thuộc tính (Details) */}
          <div className="p-6 space-y-5 bg-muted/20">
            {/* Trạng thái */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Trạng thái
              </label>
              <Select
                value={formData.status}
                onValueChange={(val) => {
                  setFormData({ ...formData, status: val });
                  handleSave({ status: val });
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">In Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phân công */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Người thực hiện
              </label>
              <Select
                value={formData.assignee}
                onValueChange={(val) => {
                  setFormData({ ...formData, assignee: val });
                  handleSave({ assignee: val });
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Chọn thành viên" />
                </SelectTrigger>
                <SelectContent>
                  {groupMembers.map((m) => {
                    const idStr =
                      m.student_id?.toString() ||
                      m.students?.id?.toString() ||
                      '';
                    return (
                      <SelectItem key={idStr} value={idStr}>
                        {m.students?.users?.full_name || 'Thành viên'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Mức độ ưu tiên */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Ưu tiên
              </label>
              <Select
                value={formData.priority}
                onValueChange={(val) => {
                  setFormData({ ...formData, priority: val });
                  handleSave({ priority: val });
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">🟢 Low</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                  <SelectItem value="HIGH">🔴 High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ngày bắt đầu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Ngày bắt đầu
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                onBlur={() => handleSave()}
                className="bg-background"
              />
            </div>

            {/* Ngày kết thúc */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Hạn chót (Due date)
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                onBlur={() => handleSave()}
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
