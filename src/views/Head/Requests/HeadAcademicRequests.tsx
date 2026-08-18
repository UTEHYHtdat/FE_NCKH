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
import { Search, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, FileText, ArrowRight } from 'lucide-react';
import { academicTicketService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AcademicTicket, TicketRequestType, TicketStatus } from '@/types/api';

export function HeadAcademicRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<AcademicTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal Resolve
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<AcademicTicket | null>(null);
  const [resolveStatus, setResolveStatus] = useState<TicketStatus>('APPROVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, typeFilter, search]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.request_type = typeFilter;
      if (search) params.search = search;

      const data = await academicTicketService.getAdminTickets(params);
      setTickets(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách yêu cầu học vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolve = (tk: AcademicTicket) => {
    setSelectedTicket(tk);
    setResolveStatus('APPROVED');
    setResolutionNotes('');
    setNewTopicTitle(tk.request_type === 'CHANGE_TOPIC_TITLE' ? tk.title.replace(/^Xin đổi tên đề tài thành:?\s*/i, '') : '');
    setResolveModalOpen(true);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setResolving(true);
      await academicTicketService.resolveTicket(selectedTicket.id, {
        status: resolveStatus,
        resolution_notes: resolutionNotes,
        new_topic_title: newTopicTitle || undefined
      });
      toast.success('Đã cập nhật trạng thái và biên bản xử lý yêu cầu thành công!');
      setResolveModalOpen(false);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xử lý yêu cầu');
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Chờ xử lý</Badge>;
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
      case 'CHANGE_TOPIC_TITLE': return 'Đổi tên đề tài';
      case 'EXTEND_DEADLINE': return 'Gia hạn nộp bài';
      case 'LEAVE_GROUP': return 'Rút khỏi nhóm';
      case 'POSTPONE_DEFENSE': return 'Hoãn bảo vệ';
      default: return 'Thủ tục khác';
    }
  };

  return (
    <PageLayout
      userRole="head"
      userName={user?.fullName || 'Trưởng bộ môn'}
      title="Tiếp nhận & Xử lý Yêu cầu Học vụ"
      subtitle="Xử lý các thủ tục chính thức: Đổi tên đề tài, gia hạn nộp báo cáo, rút nhóm và kết nối phòng chat trao đổi"
    >
      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Tìm mã đơn, tên SV, nội dung..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="OPEN">Chờ xử lý (Mới)</option>
              <option value="IN_PROGRESS">Đang giải quyết</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả loại thủ tục</option>
              <option value="CHANGE_TOPIC_TITLE">Đổi tên đề tài</option>
              <option value="EXTEND_DEADLINE">Gia hạn nộp bài</option>
              <option value="LEAVE_GROUP">Rút khỏi nhóm</option>
              <option value="POSTPONE_DEFENSE">Hoãn bảo vệ</option>
              <option value="OTHER">Thủ tục khác</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Danh sách Yêu cầu Học vụ ({tickets.length})</CardTitle>
          <CardDescription>Các đơn từ, sự cố học vụ cần Bộ môn tiếp nhận và xử lý</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải danh sách yêu cầu...
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Không có yêu cầu học vụ nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Mã đơn</th>
                    <th className="p-3">Sinh viên</th>
                    <th className="p-3">Thủ tục</th>
                    <th className="p-3">Tiêu đề yêu cầu</th>
                    <th className="p-3">Mức độ</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((tk) => (
                    <tr key={tk.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-primary">{tk.ticket_code}</td>
                      <td className="p-3 font-medium">
                        <div className="font-semibold text-foreground">{tk.students?.users?.full_name}</div>
                        <div className="text-muted-foreground">{tk.students?.student_code} - {tk.students?.classes?.class_name}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{getRequestTypeName(tk.request_type)}</Badge>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="font-medium text-foreground truncate">{tk.title}</div>
                        <div className="text-muted-foreground truncate">{tk.content}</div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          tk.priority === 'URGENT' || tk.priority === 'HIGH'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {tk.priority}
                        </span>
                      </td>
                      <td className="p-3">{getStatusBadge(tk.status)}</td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate('/messages')}
                          className="h-7 text-xs gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Trao đổi trong Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleOpenResolve(tk)}
                          className="h-7 text-xs"
                        >
                          Xử lý đơn
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Resolve Ticket */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xử lý Yêu cầu: {selectedTicket?.ticket_code}</DialogTitle>
            <DialogDescription>
              Sinh viên: {selectedTicket?.students?.users?.full_name} ({selectedTicket?.students?.student_code})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResolve} className="space-y-3.5 py-2">
            <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
              <div><strong>Tiêu đề:</strong> {selectedTicket?.title}</div>
              <div><strong>Nội dung:</strong> {selectedTicket?.content}</div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Quyết định phê duyệt *</Label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="APPROVED">Chấp thuận (Đồng ý yêu cầu)</option>
                <option value="REJECTED">Từ chối (Không chấp thuận)</option>
                <option value="IN_PROGRESS">Đang tiến hành xác minh</option>
                <option value="CLOSED">Đóng yêu cầu</option>
              </select>
            </div>

            {selectedTicket?.request_type === 'CHANGE_TOPIC_TITLE' && resolveStatus === 'APPROVED' && (
              <div>
                <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Tên đề tài mới (sẽ tự động cập nhật vào CSDL đồ án) *
                </Label>
                <Input
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Biên bản / Ý kiến xử lý của Bộ môn *</Label>
              <Textarea
                rows={3}
                placeholder="Ghi rõ lý do phê duyệt hoặc hướng dẫn thêm cho sinh viên..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-1 text-sm"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setResolveModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={resolving}>
                {resolving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Lưu kết quả xử lý
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
