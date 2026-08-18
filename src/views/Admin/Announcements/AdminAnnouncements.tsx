import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pin, Edit3, Trash2, Calendar, Eye, Loader2, Sparkles } from 'lucide-react';
import { announcementService, thesisRoundService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Announcement } from '@/types/api';

export function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [roundId, setRoundId] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [annData, roundsData] = await Promise.all([
        announcementService.getAnnouncements({ limit: 100 }).catch(() => []),
        thesisRoundService.getThesisRounds().catch(() => [])
      ]);
      const aList = Array.isArray(annData) ? annData : (annData as any)?.data || [];
      const rList = Array.isArray(roundsData) ? roundsData : (roundsData as any)?.data || [];
      setAnnouncements(Array.isArray(aList) ? aList : []);
      setRounds(Array.isArray(rList) ? rList : []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách thông báo');
      setAnnouncements([]);
      setRounds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setSummary('');
    setContent('');
    setRoundId('');
    setIsPinned(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (post: Announcement) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSummary(post.summary || '');
    setContent(post.content);
    setRoundId(post.thesis_round_id?.toString() || '');
    setIsPinned(post.is_pinned);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        summary,
        content,
        thesis_round_id: roundId ? parseInt(roundId) : null,
        is_pinned: isPinned
      };

      if (editingId) {
        await announcementService.updateAnnouncement(editingId, payload);
        toast.success('Đã cập nhật thông báo thành công!');
      } else {
        await announcementService.createAnnouncement(payload);
        toast.success('Đã đăng thông báo mới thành công!');
      }

      setModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu thông báo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài thông báo này?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      toast.success('Đã xóa thông báo thành công');
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa thông báo');
    }
  };

  return (
    <PageLayout
      userRole={user?.role as any || 'admin'}
      userName={user?.fullName || 'Quản trị viên'}
      title="Quản lý Bảng tin Thông báo"
      subtitle="Đăng bài, ghim tin tức quan trọng và thông báo kế hoạch bảo vệ khóa luận"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="text-xs text-muted-foreground">
          Tổng cộng: <strong>{announcements.length}</strong> bài thông báo
        </div>
        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="text-xs h-9 gap-1.5"
        >
          <Plus className="w-4 h-4" /> Soạn thông báo mới
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải danh sách bài đăng...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Chưa có thông báo nào được đăng
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Tiêu đề thông báo</th>
                    <th className="p-3">Đợt áp dụng</th>
                    <th className="p-3">Ghim</th>
                    <th className="p-3">Lượt xem</th>
                    <th className="p-3">Ngày đăng</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {announcements.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium max-w-md">
                        <div className="font-bold text-foreground truncate">{post.title}</div>
                        {post.summary && <div className="text-muted-foreground line-clamp-1">{post.summary}</div>}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{post.thesis_rounds?.round_name || 'Chung'}</Badge>
                      </td>
                      <td className="p-3">
                        {post.is_pinned ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Đã ghim
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-muted-foreground">{post.views_count}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(post)}
                          className="h-7 w-7 p-0"
                          title="Sửa bài"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(post.id)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          title="Xóa bài"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Create/Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Chỉnh sửa Thông báo' : 'Soạn Thông báo Mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Tiêu đề thông báo *</Label>
              <Input
                placeholder="VD: Thông báo Lịch nộp Báo cáo hoàn chỉnh và phân công Hội đồng BV..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Đợt khóa luận áp dụng</Label>
                <select
                  value={roundId}
                  onChange={(e) => setRoundId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Tất cả các đợt (Chung) --</option>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>{r.round_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is-pinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-input text-primary w-4 h-4 cursor-pointer"
                />
                <label htmlFor="is-pinned" className="text-xs font-medium cursor-pointer">
                  Ghim bài viết lên đầu bảng tin
                </label>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Tóm tắt ngắn (Summary)</Label>
              <Textarea
                rows={2}
                placeholder="Nội dung tóm tắt hiển thị trên danh sách bảng tin..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Nội dung chi tiết (Hỗ trợ định dạng HTML/Văn bản) *</Label>
              <Textarea
                rows={8}
                placeholder="Nhập nội dung thông báo đầy đủ..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 text-sm font-mono"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingId ? 'Cập nhật' : 'Đăng thông báo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
