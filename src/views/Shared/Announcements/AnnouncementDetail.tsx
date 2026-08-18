import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Eye, Download, FileText, Pin, Loader2 } from 'lucide-react';
import { announcementService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Announcement } from '@/types/api';

export function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncementById(id!);
      setPost(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải nội dung thông báo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      userRole={user?.role as any || 'student'}
      userName={user?.fullName || 'Người dùng'}
      title="Chi tiết Thông báo"
      subtitle="Nội dung văn bản thông báo chính thức"
    >
      <div className="mb-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-xs gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại bảng tin
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải thông báo...
        </div>
      ) : !post ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p className="text-sm">Không tìm thấy thông báo này hoặc đã bị xóa.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-4xl mx-auto border-border/80 shadow-sm">
          <CardHeader className="p-6 border-b border-border/60 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {post.is_pinned && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 gap-1 text-xs">
                  <Pin className="w-3.5 h-3.5 fill-amber-600" /> Ghim đầu trang
                </Badge>
              )}
              {post.thesis_rounds?.round_name && (
                <Badge variant="blue" className="text-xs">{post.thesis_rounds.round_name}</Badge>
              )}
            </div>

            <CardTitle className="text-xl sm:text-2xl font-bold leading-snug text-foreground">
              {post.title}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Ngày đăng: {new Date(post.published_at || post.created_at).toLocaleString('vi-VN')}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> {post.views_count} lượt xem
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {post.summary && (
              <div className="p-4 bg-muted/40 rounded-lg text-xs leading-relaxed font-medium italic border-l-4 border-primary">
                {post.summary}
              </div>
            )}

            <div
              className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.announcement_attachments && post.announcement_attachments.length > 0 && (
              <div className="pt-4 border-t border-border space-y-2.5">
                <h5 className="font-bold text-xs text-foreground uppercase tracking-wide">
                  Tệp đính kèm ({post.announcement_attachments.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {post.announcement_attachments.map((att) => (
                    <div
                      key={att.id}
                      onClick={() => window.open(att.file_url, '_blank')}
                      className="p-3 border border-border rounded-lg bg-muted/20 hover:bg-muted/50 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">{att.file_name}</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
