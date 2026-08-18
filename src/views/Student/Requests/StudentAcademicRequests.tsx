import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, MessageSquare, Clock, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { academicTicketService, thesisService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AcademicTicket, TicketRequestType, TicketPriority } from '@/types/api';

export function StudentAcademicRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<AcademicTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentThesis, setStudentThesis] = useState<any>(null);

  // Modal Create Ticket
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<TicketRequestType>('CHANGE_TOPIC_TITLE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal View Detail
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<AcademicTicket | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [ticketsData, thesisData] = await Promise.all([
        academicTicketService.getStudentTickets(),
        thesisService.getMyThesis().catch(() => null)
      ]);
      setTickets(ticketsData);
      setStudentThesis(thesisData);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách yêu cầu học vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung giải trình');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (studentThesis?.id) formData.append('thesis_id', studentThesis.id.toString());
      formData.append('request_type', requestType);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('priority', priority);
      if (file) formData.append('attachment_file', file);

      await academicTicketService.createTicket(formData);
      toast.success('Đã gửi yêu cầu học vụ thành công! Hệ thống đã tạo kênh chat hỗ trợ trực tiếp.');
      setCreateModalOpen(false);
      setTitle('');
      setContent('');
      setFile(null);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Đang chờ xử lý</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Đang giải quyết</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Đã phê duyệt</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Từ chối</Badge>;
      case 'CLOSED':
        return <Badge variant="outline">Đã đóng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeName = (type: TicketRequestType) => {
    switch (type) {
      case 'CHANGE_TOPIC_TITLE': return 'Đơn xin đổi tên đề tài';
      case 'EXTEND_DEADLINE': return 'Đơn xin gia hạn nộp báo cáo';
      case 'LEAVE_GROUP': return 'Đơn xin rút khỏi nhóm đồ án';
      case 'POSTPONE_DEFENSE': return 'Đơn xin hoãn bảo vệ';
      default: return 'Yêu cầu / Sự cố học vụ khác';
    }
  };

  return (
    <PageLayout
      userRole="student"
      userName={user?.fullName || 'Sinh viên'}
      title="Yêu cầu Học vụ & Xử lý Sự cố"
      subtitle="Gửi các đơn từ chính thức: Đổi tên đề tài, gia hạn nộp bài, hoãn bảo vệ kèm luồng giải quyết có lưu vết"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="text-xs text-muted-foreground">
          Tổng cộng: <strong>{tickets.length}</strong> đơn yêu cầu
        </div>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 text-xs h-9"
        >
          <Plus className="w-4 h-4" /> Gửi đơn yêu cầu mới
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu yêu cầu...
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-foreground text-sm">Bạn chưa gửi yêu cầu học vụ nào</p>
            <p className="text-xs mt-1">Khi bạn cần làm thủ tục đổi tên đề tài hoặc giải quyết sự cố, hãy nhấn nút "Gửi đơn yêu cầu mới".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((tk) => (
            <Card key={tk.id} className="hover:shadow-md transition-shadow border-border/80">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{tk.ticket_code}</span>
                    <Badge variant="outline" className="text-[11px]">{getRequestTypeName(tk.request_type)}</Badge>
                    {getStatusBadge(tk.status)}
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{tk.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{tk.content}</p>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
                    <Clock className="w-3 h-3" /> Ngày gửi: {new Date(tk.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTicket(tk);
                      setDetailModalOpen(true);
                    }}
                    className="text-xs h-8"
                  >
                    Xem chi tiết
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => navigate('/messages')}
                    className="text-xs h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Trao đổi qua Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Create Ticket */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gửi Đơn Yêu cầu Học vụ Mới</DialogTitle>
            <DialogDescription>
              Yêu cầu của bạn sẽ được chuyển đến Giảng viên hướng dẫn và Ban chủ nhiệm khoa/Bộ môn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Loại thủ tục / Yêu cầu *</Label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as TicketRequestType)}
                className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CHANGE_TOPIC_TITLE">Đơn xin đổi tên đề tài khóa luận</option>
                <option value="EXTEND_DEADLINE">Đơn xin gia hạn nộp báo cáo / đồ án</option>
                <option value="LEAVE_GROUP">Đơn xin rút khỏi nhóm đồ án</option>
                <option value="POSTPONE_DEFENSE">Đơn xin hoãn bảo vệ khóa luận</option>
                <option value="OTHER">Thắc mắc & Sự cố học vụ khác</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Tiêu đề yêu cầu *</Label>
              <Input
                placeholder={
                  requestType === 'CHANGE_TOPIC_TITLE'
                    ? 'VD: Xin đổi tên đề tài thành: Xây dựng hệ thống...'
                    : 'VD: Xin gia hạn nộp báo cáo đợt 2 thêm 3 ngày...'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Mức độ ưu tiên</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="LOW">Bình thường (Low)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HIGH">Ưu tiên cao (High)</option>
                <option value="URGENT">Khẩn cấp (Urgent)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Nội dung giải trình chi tiết *</Label>
              <Textarea
                rows={4}
                placeholder="Nêu rõ lý do cụ thể, diễn biến và nguyện vọng của nhóm..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 text-sm"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Tệp đính kèm / Đơn xin có chữ ký (PDF, DOCX, ZIP)</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Gửi yêu cầu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal View Detail */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-primary">{selectedTicket?.ticket_code}</span>
              {selectedTicket && getStatusBadge(selectedTicket.status)}
            </div>
            <DialogTitle className="text-base pt-1">{selectedTicket?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1">
              <div><strong>Loại yêu cầu:</strong> {selectedTicket && getRequestTypeName(selectedTicket.request_type)}</div>
              <div><strong>Thời gian gửi:</strong> {selectedTicket && new Date(selectedTicket.created_at).toLocaleString('vi-VN')}</div>
            </div>

            <div>
              <span className="font-semibold block mb-1">Nội dung giải trình:</span>
              <p className="p-3 border border-border rounded-lg bg-card text-foreground whitespace-pre-line">
                {selectedTicket?.content}
              </p>
            </div>

            {selectedTicket?.resolution_notes && (
              <div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 block mb-1">Biên bản kết luận của Bộ môn:</span>
                <p className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 rounded-lg text-foreground">
                  {selectedTicket.resolution_notes}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                setDetailModalOpen(false);
                navigate('/messages');
              }}
              className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Mở phòng chat hỗ trợ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
