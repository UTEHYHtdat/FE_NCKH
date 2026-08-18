import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Pin, Calendar, Eye, Search, ArrowRight, Loader2, FileText } from 'lucide-react';
import { announcementService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Announcement } from '@/types/api';

export function AnnouncementsFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const canManage = user?.role === 'HEAD' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN' || user?.role === 'admin' || user?.role === 'head';

  useEffect(() => {
    fetchAnnouncements();
  }, [search]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      const data = await announcementService.getAnnouncements(params);
      setAnnouncements(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải bảng tin thông báo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      userRole={user?.role as any || 'student'}
      userName={user?.fullName || 'Người dùng'}
      title="Bảng tin & Thông báo Khóa luận"
      subtitle="Kế hoạch, lịch trình bảo vệ và các thông báo chính thức từ Ban chủ nhiệm Khoa & Bộ môn"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thông báo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => navigate('/admin/announcements')}
            className="text-xs h-9 gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" /> Quản lý thông báo
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải bảng tin thông báo...
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-foreground text-sm">Chưa có thông báo nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((post) => (
            <Card
              key={post.id}
              onClick={() => navigate(`/announcements/${post.id}`)}
              className={`hover:shadow-md transition-all border-border/80 cursor-pointer ${
                post.is_pinned ? 'border-amber-400/60 bg-amber-50/20 dark:bg-amber-950/10' : ''
              }`}
            >
              <CardContent className="p-5 flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.is_pinned && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 gap-1 text-[10px]">
                        <Pin className="w-3 h-3 fill-amber-600" /> Ghim đầu trang
                      </Badge>
                    )}
                    {post.thesis_rounds?.round_name && (
                      <Badge variant="blue" className="text-[10px]">
                        {post.thesis_rounds.round_name}
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-foreground hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  {post.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {post.views_count} lượt xem
                    </span>
                    {post.announcement_attachments && post.announcement_attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-primary">
                        <FileText className="w-3 h-3" /> {post.announcement_attachments.length} tệp đính kèm
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1 text-primary self-end md:self-center shrink-0"
                >
                  Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
