import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Download, UploadCloud, Search, Trash2, FolderOpen, Loader2, Sparkles } from 'lucide-react';
import { documentService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import type { OfficialDocument, DocumentCategory } from '@/types/api';

export function OfficialDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Modal upload document (Head/Admin)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('TEMPLATE');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const canManage = user?.role === 'HEAD' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN' || user?.role === 'admin' || user?.role === 'head';

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, search]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (search) params.search = search;

      const data = await documentService.getDocuments(params);
      setDocuments(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      toast.error('Vui lòng nhập tên tài liệu và chọn file tải lên');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('document_file', file);

      await documentService.createDocument(formData);
      toast.success('Đã tải lên tài liệu biểu mẫu thành công!');
      setUploadModalOpen(false);
      setTitle('');
      setDescription('');
      setFile(null);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải lên tài liệu');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    try {
      await documentService.deleteDocument(id);
      toast.success('Đã xóa tài liệu thành công');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa tài liệu');
    }
  };

  const handleDownload = async (doc: OfficialDocument) => {
    try {
      await documentService.downloadDocument(doc.id);
      window.open(doc.file_url, '_blank');
    } catch (err) {
      window.open(doc.file_url, '_blank');
    }
  };

  const getCategoryBadge = (cat: DocumentCategory) => {
    switch (cat) {
      case 'TEMPLATE':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Biểu mẫu chuẩn</Badge>;
      case 'REGULATION':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Quy chế / Quy định</Badge>;
      case 'GUIDE':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Hướng dẫn thực hiện</Badge>;
      case 'FORM':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Đơn từ học vụ</Badge>;
      default:
        return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <PageLayout
      userRole={user?.role as any || 'student'}
      userName={user?.fullName || 'Người dùng'}
      title="Kho Tài liệu & Biểu mẫu Chuẩn"
      subtitle="Quy chế khóa luận, biểu mẫu báo cáo, slide thuyết trình và hướng dẫn chuẩn của Bộ môn"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'TEMPLATE', label: 'Biểu mẫu chuẩn' },
            { id: 'REGULATION', label: 'Quy chế / Quy định' },
            { id: 'GUIDE', label: 'Hướng dẫn làm bài' },
            { id: 'FORM', label: 'Mẫu đơn học vụ' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedCategory === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="h-9 text-xs gap-1.5 shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Thêm tài liệu
            </Button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải kho tài liệu...
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-foreground text-sm">Chưa có tài liệu nào trong danh mục này</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow flex flex-col justify-between border-border/80">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      {getCategoryBadge(doc.category)}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase px-1.5 py-0.5 bg-muted rounded">
                    {doc.file_type || 'FILE'}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-foreground line-clamp-2" title={doc.title}>
                    {doc.title}
                  </h4>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={doc.description}>
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{doc.downloads_count} lượt tải</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </CardContent>

              <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleDownload(doc)}
                  className="w-full h-8 text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về tài liệu
                </Button>
                {canManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc.id)}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Upload Document */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tải lên Tài liệu / Biểu mẫu mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Tên tài liệu / Văn bản *</Label>
              <Input
                placeholder="VD: Mẫu báo cáo tiến độ đồ án tốt nghiệp..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Danh mục *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="TEMPLATE">Biểu mẫu chuẩn (Báo cáo, Đề cương, Slide)</option>
                <option value="REGULATION">Quy chế / Quy định khóa luận</option>
                <option value="GUIDE">Hướng dẫn thực hiện</option>
                <option value="FORM">Đơn từ học vụ</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Mô tả tóm tắt</Label>
              <Textarea
                rows={2}
                placeholder="Mô tả mục đích sử dụng của tài liệu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Tệp đính kèm (PDF, DOCX, XLSX, ZIP) *</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 text-xs"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setUploadModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Tải lên
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
