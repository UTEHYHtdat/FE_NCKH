import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, Loader2, Plus, Save, Upload
} from 'lucide-react';
import JoditEditor from 'jodit-react';
import { toast } from 'sonner';
import { apiClient } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình worker cho pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;


export function HeadGradingTemplates() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2>(1);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    type: 'SUPERVISION'
  });
  
  const [viewTemplate, setViewTemplate] = useState<any>(null);
  const [viewTemplateContent, setViewTemplateContent] = useState<string>('');
  const [isViewLoading, setIsViewLoading] = useState(false);

  const editorConfig = {
    readonly: false,
    placeholder: 'Bắt đầu soạn thảo nội dung phiếu chấm điểm tại đây...',
    height: '100%',
    width: '100%',
    enableDragAndDropFileToEditor: true,
    buttons: [
      'source', '|',
      'bold',
      'strikethrough',
      'underline',
      'italic', '|',
      'ul',
      'ol', '|',
      'outdent', 'indent',  '|',
      'font',
      'fontsize',
      'brush',
      'paragraph', '|',
      'image',
      'video',
      'table',
      'link', '|',
      'align', 'undo', 'redo', '|',
      'hr',
      'eraser',
      'copyformat', '|',
      'symbol',
      'fullsize',
      'print',
      'about'
    ],
    uploader: {
      insertImageAsBase64URI: true
    },
    style: {
      background: 'white',
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: '14pt'
    },
    toolbarAdaptive: false,
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<any[]>('/api/v1/thesis/admin/grading-templates');
      setTemplates(response);
    } catch (error) {
      toast.error('Không thể tải danh sách mẫu phiếu');
    } finally {
      setIsLoading(false);
    }
  };

  const processMammothHtml = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
      const text = table.textContent?.toLowerCase() || '';
      // Phân biệt bảng điểm và bảng layout (header)
      if (text.includes('tiêu chí') || text.includes('điểm') || text.includes('stt') || text.includes('nội dung')) {
        table.classList.add('data-table');
      } else {
        table.classList.add('layout-table');
      }
    });
    return doc.body.innerHTML;
  };

  // Bước 1 → Bước 2: chuyển đổi file để xem trước
  const handlePreviewFile = async () => {
    if (!currentTemplate.name) {
      toast.error('Vui lòng nhập tên phiếu');
      return;
    }
    if (!selectedFile) {
      toast.error('Vui lòng chọn file đính kèm');
      return;
    }
    
    try {
      setIsConverting(true);
      
      if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewHtml(processMammothHtml(result.value));
      } else if (selectedFile.type === 'application/pdf') {
        // PDF sẽ dùng native viewer, không cần convert
        setPreviewHtml('__PDF__');
      } else {
        toast.error('Chỉ hỗ trợ file .doc, .docx và .pdf');
        return;
      }
      
      setUploadStep(2);
    } catch (error) {
      toast.error('Lỗi khi đọc file, vui lòng thử lại');
      console.error(error);
    } finally {
      setIsConverting(false);
    }
  };

  // Bước 2 → Xác nhận: gửi file GỐC lên server
  const handleConfirmAndUpload = async () => {
    try {
      if (!selectedFile || !currentTemplate.name) return;

      const formData = new FormData();
      formData.append('name', currentTemplate.name);
      formData.append('type', currentTemplate.type);
      formData.append('criteria_config', JSON.stringify([{ name: 'Nội dung', max_score: 10 }]));
      formData.append('template_file', selectedFile);

      await apiClient.post('/api/v1/thesis/admin/grading-templates', formData, true, {
        'Content-Type': 'multipart/form-data'
      });

      toast.success('Lưu mẫu phiếu thành công');
      setIsUploadDialogOpen(false);
      setUploadStep(1);
      setPreviewHtml('');
      setSelectedFile(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Lỗi khi lưu mẫu phiếu');
    }
  };



  const handleSaveTemplate = async () => {
    try {
      if (!currentTemplate.name) {
        toast.error('Vui lòng nhập tên phiếu');
        return;
      }

      const formData = new FormData();
      formData.append('name', currentTemplate.name);
      formData.append('type', currentTemplate.type);
      formData.append('criteria_config', JSON.stringify([{ name: 'Nội dung', max_score: 10 }]));

      if (selectedFile) {
        formData.append('template_file', selectedFile);
      } else if (templateContent) {
        const fileBlob = new Blob([templateContent], { type: 'text/html' });
        formData.append('template_file', fileBlob, 'template.html');
      }

      await apiClient.post('/api/v1/thesis/admin/grading-templates', formData, true, {
        'Content-Type': 'multipart/form-data'
      });

      toast.success('Lưu mẫu phiếu thành công');
      setIsDialogOpen(false);
      setIsUploadDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error('Lỗi khi lưu mẫu phiếu');
    }
  };

  const handleViewTemplate = async (tpl: any) => {
    if (!tpl.template_file_url) {
      toast.info('Mẫu phiếu này chưa có nội dung đính kèm');
      return;
    }
    
    setIsViewLoading(true);
    setViewTemplateContent('');
    
    try {
      let fileUrl = `http://localhost:8002${tpl.template_file_url}`;
      
      // Khắc phục tạm thời trường hợp backend lưu thiếu đường dẫn thư mục con
      if (fileUrl.includes('/uploads/') && !fileUrl.includes('/uploads/weekly_reports/')) {
        fileUrl = fileUrl.replace('/uploads/', '/uploads/weekly_reports/');
        tpl = { ...tpl, template_file_url: tpl.template_file_url.replace('/uploads/', '/uploads/weekly_reports/') };
      }
      
      setViewTemplate(tpl);
      
      if (fileUrl.toLowerCase().endsWith('.pdf')) {
        setViewTemplateContent('__PDF__');
      } else if (fileUrl.toLowerCase().endsWith('.html')) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('File not found');
        const text = await response.text();
        setViewTemplateContent(text);
      } else if (fileUrl.toLowerCase().endsWith('.docx') || fileUrl.toLowerCase().endsWith('.doc')) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('File not found');
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setViewTemplateContent(processMammothHtml(result.value));
      } else {
        setViewTemplateContent('__UNSUPPORTED__');
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải nội dung mẫu phiếu');
      setViewTemplate(null);
    } finally {
      setIsViewLoading(false);
    }
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'Trưởng bộ môn'}
      title="Quản lý Phiếu chấm điểm"
      subtitle="Thiết lập các tiêu chí đánh giá và tải lên file mẫu (Word/PDF)"
    >


      <style>{`
        .jodit-container {
          border: none !important;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .jodit-toolbar__box {
          background: #f8fafc !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 8px 16px !important;
        }
        .jodit-workplace {
          background: #f1f5f9 !important;
          display: block !important;
          padding: 2.5rem 0 !important;
          overflow-y: auto !important;
        }
        .jodit-wysiwyg {
          background: white !important;
          width: 21cm !important;
          min-height: 29.7cm !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          padding: 2.5cm !important;
          margin: 0 auto !important;
          border: 1px solid #e2e8f0 !important;
        }
        .docx-preview table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }
        .docx-preview table.data-table, .docx-preview table.data-table th, .docx-preview table.data-table td {
          border: 1px solid black;
        }
        .docx-preview table.layout-table, .docx-preview table.layout-table th, .docx-preview table.layout-table td {
          border: none !important;
        }
        .docx-preview th, .docx-preview td {
          padding: 4px 8px;
        }
        .docx-preview table.layout-table td {
          padding: 0px 4px;
        }
        .docx-preview table.layout-table td:nth-child(2) {
          text-align: center;
        }
        .docx-preview p {
          margin-bottom: 0.5rem;
          margin-top: 0;
        }
        .docx-preview h1, .docx-preview h2, .docx-preview h3, .docx-preview h4 {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        .docx-preview h1 { font-size: 1.5em; text-align: center; }
        .docx-preview h2 { font-size: 1.25em; }
        .docx-preview img {
          max-width: 100%;
          height: auto;
        }
      `}</style>

      <div className="flex justify-end gap-4 mb-6">
        {/* Nút Upload File riêng */}
        <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) { setUploadStep(1); setPreviewHtml(''); setSelectedFile(null); }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => {
              setCurrentTemplate({ name: '', type: 'SUPERVISION' });
              setSelectedFile(null);
              setUploadStep(1);
              setPreviewHtml('');
            }}>
              <Upload className="h-4 w-4 mr-2" /> Tải lên file
            </Button>
          </DialogTrigger>

          {/* === BƯỚC 1: Chọn file === */}
          {uploadStep === 1 && (
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tải lên mẫu phiếu (Word/PDF)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tên phiếu</Label>
                  <Input 
                    placeholder="VD: Phiếu chấm hướng dẫn K16..."
                    value={currentTemplate.name}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại phiếu</Label>
                  <Select 
                    value={currentTemplate.type}
                    onValueChange={(val) => setCurrentTemplate({ ...currentTemplate, type: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPERVISION">Hướng dẫn</SelectItem>
                      <SelectItem value="REVIEW">Phản biện</SelectItem>
                      <SelectItem value="DEFENSE">Hội đồng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chọn file đính kèm</Label>
                  <div className="flex flex-col gap-3">
                    <Input 
                      type="file" 
                      id="main-template-upload"
                      className="hidden" 
                      accept=".doc,.docx,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Label 
                      htmlFor="main-template-upload" 
                      className={`flex-1 flex items-center justify-center cursor-pointer border-2 border-dashed p-6 rounded-lg hover:bg-slate-50 transition-colors ${
                        selectedFile ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      <Upload className="w-5 h-5 mr-2 shrink-0" />
                      <span className="truncate">{selectedFile ? selectedFile.name : 'Nhấn để chọn file (.doc, .docx, .pdf)'}</span>
                    </Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsUploadDialogOpen(false)}>Hủy</Button>
                <Button onClick={handlePreviewFile} disabled={isConverting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isConverting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Xem trước
                </Button>
              </div>
            </DialogContent>
          )}

          {/* === BƯỚC 2: Xem trước toàn màn hình === */}
          {uploadStep === 2 && (
            <DialogContent className="max-w-none sm:max-w-none w-screen h-screen max-h-screen p-0 m-0 overflow-hidden bg-white border-0 rounded-none flex flex-col">
              <div className="w-full flex flex-col h-full flex-1">
                {/* Header */}
                <DialogHeader className="px-8 py-4 bg-white border-b border-slate-200 m-0 flex flex-row items-center justify-between gap-4 shrink-0 shadow-sm relative z-20">
                  <DialogTitle className="text-xl font-bold text-slate-800 whitespace-nowrap">Xem trước mẫu phiếu</DialogTitle>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <span className="text-sm text-slate-500">Tên phiếu:</span>
                    <span className="font-semibold text-slate-800">{currentTemplate.name}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-sm text-slate-500">Loại:</span>
                    <span className="font-semibold text-slate-800">
                      {currentTemplate.type === 'SUPERVISION' ? 'Hướng dẫn' : currentTemplate.type === 'REVIEW' ? 'Phản biện' : 'Hội đồng'}
                    </span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-sm text-slate-500">File:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]">{selectedFile?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Button variant="outline" onClick={() => { setUploadStep(1); setPreviewHtml(''); }}>Quay lại</Button>
                    <Button onClick={handleConfirmAndUpload} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-full px-6">
                      <Save className="h-4 w-4 mr-2" /> Xác nhận & Lưu
                    </Button>
                  </div>
                </DialogHeader>

                {/* Preview content */}
                <div className="flex-1 overflow-y-auto bg-slate-100">
                  {previewHtml === '__PDF__' && selectedFile ? (
                    <iframe 
                      src={URL.createObjectURL(selectedFile)}
                      className="w-full h-full border-0"
                      title="Xem trước PDF"
                    />
                  ) : (
                    <div className="flex justify-center py-10 px-4">
                      <div 
                        className="bg-white shadow-xl border border-slate-200 p-[2.5cm] font-serif text-[14pt] leading-relaxed docx-preview" 
                        style={{ width: '21cm', minHeight: '29.7cm', fontFamily: "'Times New Roman', Times, serif" }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Nút Tạo mẫu bằng Editor */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setCurrentTemplate({ name: '', type: 'SUPERVISION' });
              setTemplateContent('');
              setSelectedFile(null);
            }}>
              <Plus className="h-4 w-4 mr-2" /> Tạo mẫu mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-none sm:max-w-none w-screen h-screen max-h-screen p-0 m-0 overflow-hidden bg-white border-0 rounded-none flex flex-col">
            <div className="w-full flex flex-col h-full flex-1">
              <DialogHeader className="px-8 py-4 bg-white border-b border-slate-200 m-0 flex flex-row items-center justify-between gap-6 shrink-0 shadow-sm relative z-20">
                <DialogTitle className="text-xl font-bold text-slate-800 pr-4 border-r border-slate-200 whitespace-nowrap">Thiết lập Mẫu phiếu</DialogTitle>
                
                <div className="flex-1 flex items-center justify-center gap-4 max-w-4xl mx-4">
                  <div className="flex-1 flex items-center gap-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tên phiếu</Label>
                    <Input 
                      placeholder="VD: Phiếu chấm hướng dẫn K16..."
                      value={currentTemplate.name}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 h-9 text-sm shadow-sm rounded-lg flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-[180px]">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Loại</Label>
                    <Select 
                      value={currentTemplate.type}
                      onValueChange={(val) => setCurrentTemplate({ ...currentTemplate, type: val })}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-sm shadow-sm rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPERVISION">Hướng dẫn</SelectItem>
                        <SelectItem value="REVIEW">Phản biện</SelectItem>
                        <SelectItem value="DEFENSE">Hội đồng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-md shadow-blue-500/20 rounded-full px-6 transition-all">
                  <Save className="h-4 w-4 mr-2" /> Lưu
                </Button>
              </DialogHeader>

              <div className="m-0 border-0 p-0 flex flex-col overflow-hidden bg-slate-100 flex-1">
                <JoditEditor
                  value={templateContent}
                  config={editorConfig}
                  onBlur={newContent => setTemplateContent(newContent)}
                  onChange={newContent => {}}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card 
              key={tpl.id}
              className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
              onClick={() => handleViewTemplate(tpl)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-start">
                  <span>{tpl.name}</span>
                  <span className="text-xs font-normal px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {tpl.type}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tiêu chí đánh giá:</p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                    {tpl.criteria_config?.map((c: any, i: number) => (
                      <li key={i}>{c.name} ({c.max_score}đ)</li>
                    ))}
                  </ul>
                  <p className="text-sm font-medium pt-2 border-t text-right">
                    Tổng điểm: {tpl.criteria_config?.reduce((sum: number, c: any) => sum + (c.max_score || 0), 0)}đ
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog xem trước mẫu phiếu đã lưu */}
      <Dialog open={!!viewTemplate} onOpenChange={(open) => !open && setViewTemplate(null)}>
        <DialogContent className="max-w-none sm:max-w-none w-screen h-screen max-h-screen p-0 m-0 overflow-hidden bg-white border-0 rounded-none flex flex-col">
          <div className="w-full flex flex-col h-full flex-1">
            <DialogHeader className="px-8 py-4 bg-white border-b border-slate-200 m-0 flex flex-row items-center justify-between gap-4 shrink-0 shadow-sm relative z-20">
              <DialogTitle className="text-xl font-bold text-slate-800 whitespace-nowrap">Nội dung mẫu phiếu</DialogTitle>
              {viewTemplate && (
                <div className="flex-1 flex items-center justify-center gap-2">
                  <span className="text-sm text-slate-500">Tên phiếu:</span>
                  <span className="font-semibold text-slate-800">{viewTemplate.name}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-sm text-slate-500">Loại:</span>
                  <span className="font-semibold text-slate-800">
                    {viewTemplate.type === 'SUPERVISION' ? 'Hướng dẫn' : viewTemplate.type === 'REVIEW' ? 'Phản biện' : 'Hội đồng'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 shrink-0">
                {viewTemplate?.template_file_url && (
                  <Button variant="outline" onClick={() => window.open(`http://localhost:8002${viewTemplate.template_file_url}`, '_blank')}>
                    <FileText className="h-4 w-4 mr-2" /> Tải xuống
                  </Button>
                )}
                <Button variant="outline" onClick={() => setViewTemplate(null)}>Đóng</Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto bg-slate-100 flex flex-col items-center">
              {isViewLoading ? (
                <div className="flex flex-col items-center gap-4 m-auto">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-slate-500">Đang tải nội dung...</p>
                </div>
              ) : viewTemplateContent === '__PDF__' ? (
                <iframe 
                  src={`http://localhost:8002${viewTemplate?.template_file_url}`}
                  className="w-full h-full border-0 flex-1"
                  title="PDF Viewer"
                />
              ) : viewTemplateContent === '__UNSUPPORTED__' ? (
                <div className="text-center p-8 m-auto">
                  <p className="text-slate-500 mb-4">Định dạng file không hỗ trợ xem trước trực tiếp.</p>
                  <Button onClick={() => window.open(`http://localhost:8002${viewTemplate?.template_file_url}`, '_blank')}>
                    Tải file về máy
                  </Button>
                </div>
              ) : (
                <div className="py-10 px-4 w-full flex justify-center">
                  <div 
                    className="bg-white shadow-xl border border-slate-200 p-[2.5cm] font-serif text-[14pt] leading-relaxed max-w-full docx-preview" 
                    style={{ width: '21cm', minHeight: '29.7cm', fontFamily: "'Times New Roman', Times, serif" }}
                    dangerouslySetInnerHTML={{ __html: viewTemplateContent }}
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
