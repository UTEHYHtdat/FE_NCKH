import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, BookOpen, GraduationCap, Eye, Download, Code, Sparkles, Loader2, Calendar } from 'lucide-react';
import { documentService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DigitalRepositoryItem } from '@/types/api';

export function DigitalRepository() {
  const { user } = useAuth();
  const [items, setItems] = useState<DigitalRepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [academicYear, setAcademicYear] = useState('all');

  // Modal view detail
  const [selectedItem, setSelectedItem] = useState<DigitalRepositoryItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchRepository();
  }, [academicYear, search]);

  const fetchRepository = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (academicYear !== 'all') params.academic_year = academicYear;
      if (search) params.search = search;

      const data = await documentService.getRepository(params);
      setItems(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải kho lưu trữ khóa luận số');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (item: DigitalRepositoryItem) => {
    try {
      const data = await documentService.getRepositoryById(item.id);
      setSelectedItem(data);
      setDetailModalOpen(true);
    } catch (err) {
      setSelectedItem(item);
      setDetailModalOpen(true);
    }
  };

  return (
    <PageLayout
      userRole={user?.role as any || 'student'}
      userName={user?.fullName || 'Người dùng'}
      title="Thư viện Khóa luận Số"
      subtitle="Kho lưu trữ các đề tài khóa luận xuất sắc qua các khóa học để sinh viên tra cứu & tham khảo"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên đề tài, tác giả, công nghệ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
          >
            <option value="all">Tất cả năm học</option>
            <option value="2024-2025">Năm học 2024 - 2025</option>
            <option value="2023-2024">Năm học 2023 - 2024</option>
            <option value="2022-2023">Năm học 2022 - 2023</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Tổng cộng: <strong>{items.length}</strong> đề tài lưu trữ
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tra cứu kho lưu trữ số...
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-foreground text-sm">Chưa tìm thấy đề tài nào</p>
            <p className="text-xs mt-1">Hãy thử tìm kiếm với từ khóa khác.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <Card
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className="hover:shadow-lg transition-all border-border/80 cursor-pointer flex flex-col justify-between group"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="blue" className="text-[10px]">
                    {item.academic_year} {item.semester ? `(Kỳ ${item.semester})` : ''}
                  </Badge>
                  {item.final_score !== undefined && item.final_score !== null && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Điểm: {item.final_score}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors" title={item.topic_title}>
                    {item.topic_title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {item.abstract}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate"><strong>Tác giả:</strong> {item.authors}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate"><strong>GVHD:</strong> {item.supervisors}</span>
                  </div>
                </div>

                {item.keywords && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.keywords.split(',').map((kw, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        #{kw.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>

              <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {item.views_count} lượt xem
                </span>
                <span className="text-primary font-medium group-hover:underline">
                  Xem chi tiết &rarr;
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal View Detail */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug">{selectedItem?.topic_title}</DialogTitle>
            <DialogDescription>
              Năm học: {selectedItem?.academic_year} • Điểm bảo vệ: {selectedItem?.final_score || 'N/A'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs leading-relaxed">
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
              <div>
                <span className="text-muted-foreground block">Sinh viên thực hiện:</span>
                <strong className="text-foreground text-sm">{selectedItem?.authors}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block">Giảng viên hướng dẫn:</span>
                <strong className="text-foreground text-sm">{selectedItem?.supervisors}</strong>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-sm text-foreground mb-1">Tóm tắt đề tài (Abstract)</h5>
              <p className="text-muted-foreground whitespace-pre-line bg-card p-3 rounded-lg border border-border">
                {selectedItem?.abstract}
              </p>
            </div>

            {selectedItem?.keywords && (
              <div>
                <h5 className="font-bold text-xs text-foreground mb-1">Công nghệ & Từ khóa</h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.keywords.split(',').map((kw, i) => (
                    <Badge key={i} variant="secondary">{kw.trim()}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {selectedItem?.report_file_url && (
                <Button
                  size="sm"
                  onClick={() => window.open(selectedItem?.report_file_url, '_blank')}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Tải Toàn văn Báo cáo (PDF)
                </Button>
              )}
              {selectedItem?.slide_file_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(selectedItem?.slide_file_url, '_blank')}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Tải Slide trình chiếu
                </Button>
              )}
              {selectedItem?.source_code_url && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(selectedItem?.source_code_url, '_blank')}
                  className="gap-1.5 text-xs"
                >
                  <Code className="w-3.5 h-3.5" /> Kho mã nguồn (GitHub / Git)
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
