import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Loader2, Plus, Save, Upload, Trash2, Edit3, Layers, RefreshCw, Sparkles, CheckCircle2
} from 'lucide-react';
import JoditEditor from 'jodit-react';
import { toast } from 'sonner';
import { gradingService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình worker cho pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface CriteriaItem {
  id: string | number;
  name: string;
  max_score: number;
}

const getDefaultCriteria = (type: string): CriteriaItem[] => {
  if (type === 'SUPERVISION') {
    return [
      { id: 1, name: 'Tinh thần thái độ và sự chủ động trong quá trình thực hiện', max_score: 2.0 },
      { id: 2, name: 'Khả năng tìm hiểu tài liệu và áp dụng kiến thức chuyên môn', max_score: 3.0 },
      { id: 3, name: 'Khối lượng và tiến độ hoàn thành các nội dung công việc', max_score: 2.5 },
      { id: 4, name: 'Chất lượng báo cáo quyển khóa luận và sản phẩm demo', max_score: 2.5 },
    ];
  } else if (type === 'REVIEW') {
    return [
      { id: 1, name: 'Tính cấp thiết và ý nghĩa thực tiễn của đề tài', max_score: 2.0 },
      { id: 2, name: 'Độ sâu và chất lượng giải pháp kỹ thuật đề xuất', max_score: 4.0 },
      { id: 3, name: 'Hình thức trình bày báo cáo và tài liệu đính kèm', max_score: 2.0 },
      { id: 4, name: 'Kết quả đạt được so với mục tiêu đề ra', max_score: 2.0 },
    ];
  } else {
    return [
      { id: 1, name: 'Chất lượng báo cáo và tài liệu luận văn', max_score: 2.0 },
      { id: 2, name: 'Kỹ năng thuyết trình và trình bày sản phẩm', max_score: 3.0 },
      { id: 3, name: 'Khả năng trả lời các câu hỏi chất vấn của Hội đồng', max_score: 3.0 },
      { id: 4, name: 'Đóng góp và mức độ hoàn thiện sản phẩm thực tế', max_score: 2.0 },
    ];
  }
};

/**
 * Trích xuất tự động danh sách tiêu chí và điểm tối đa từ bảng trong file HTML do Mammoth chuyển đổi
 */
export const extractCriteriaFromHtml = (html: string): CriteriaItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');
  
  for (const table of Array.from(tables)) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) continue;

    let nameColIdx = -1;
    let scoreColIdx = -1;
    let startRowIdx = 0;

    // Kiểm tra dòng tiêu đề ở 1-2 hàng đầu
    for (let r = 0; r < Math.min(3, rows.length); r++) {
      const cells = Array.from(rows[r].querySelectorAll('th, td')).map(c => c.textContent?.trim().toLowerCase() || '');
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (
          cell.includes('tiêu chí') ||
          cell.includes('nội dung') ||
          cell.includes('chỉ tiêu') ||
          cell.includes('yêu cầu') ||
          cell.includes('hạng mục')
        ) {
          nameColIdx = i;
        }
        if (
          cell.includes('điểm tối đa') ||
          cell.includes('điểm tối') ||
          cell.includes('điểm chuẩn') ||
          cell.includes('thang điểm') ||
          cell.includes('trọng số') ||
          cell.includes('max score') ||
          (cell.includes('điểm') && !cell.includes('chấm') && !cell.includes('đánh giá'))
        ) {
          scoreColIdx = i;
        }
      }
      if (nameColIdx !== -1 && scoreColIdx !== -1) {
        startRowIdx = r + 1;
        break;
      }
    }

    // Dự phòng theo vị trí cột thông dụng nếu không tìm thấy chính xác header
    if (nameColIdx === -1 || scoreColIdx === -1) {
      const firstRowCells = Array.from(rows[0].querySelectorAll('th, td')).map(c => c.textContent?.trim() || '');
      if (firstRowCells.length === 2) {
        nameColIdx = 0;
        scoreColIdx = 1;
        startRowIdx = 1;
      } else if (firstRowCells.length === 3) {
        // [Tiêu chí, Điểm tối đa, Điểm chấm]
        nameColIdx = 0;
        scoreColIdx = 1;
        startRowIdx = 1;
      } else if (firstRowCells.length >= 4) {
        // [STT, Tiêu chí, Điểm tối đa, Điểm chấm]
        nameColIdx = 1;
        scoreColIdx = 2;
        startRowIdx = 1;
      }
    }

    if (nameColIdx !== -1 && scoreColIdx !== -1) {
      const extracted: CriteriaItem[] = [];
      for (let r = startRowIdx; r < rows.length; r++) {
        const cells = Array.from(rows[r].querySelectorAll('th, td')).map(c => c.textContent?.trim() || '');
        if (cells.length <= Math.max(nameColIdx, scoreColIdx)) continue;
        
        const rawName = cells[nameColIdx];
        const rawScore = cells[scoreColIdx];

        if (!rawName) continue;

        const lowerName = rawName.toLowerCase();
        // Bỏ qua dòng tổng kết hoặc dòng tiêu đề lặp lại
        if (
          lowerName.includes('tổng điểm') ||
          lowerName.includes('tổng cộng') ||
          lowerName.includes('total') ||
          lowerName.includes('kết luận') ||
          lowerName.includes('nhận xét') ||
          lowerName === 'tiêu chí'
        ) {
          continue;
        }

        // Làm sạch và chuyển đổi điểm số (hỗ trợ cả dạng "1", "2.5", "2,5", "5 (năm)")
        const cleanedScoreStr = rawScore.replace(',', '.').replace(/[^\d.]/g, '');
        const scoreNum = parseFloat(cleanedScoreStr);

        if (!isNaN(scoreNum) && scoreNum > 0 && scoreNum <= 10) {
          extracted.push({
            id: Date.now() + r,
            name: rawName,
            max_score: scoreNum,
          });
        }
      }

      if (extracted.length > 0) {
        return extracted;
      }
    }
  }

  return [];
};

export function HeadGradingTemplates() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2>(1);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Form Template State
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    type: 'SUPERVISION'
  });
  const [criteriaList, setCriteriaList] = useState<CriteriaItem[]>(getDefaultCriteria('SUPERVISION'));

  // Edit Template State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editCriteriaList, setEditCriteriaList] = useState<CriteriaItem[]>([]);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateType, setEditTemplateType] = useState('SUPERVISION');
  const [isUpdating, setIsUpdating] = useState(false);

  // View Template State
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
      const response = await gradingService.getGradingTemplates();
      setTemplates(Array.isArray(response) ? response : []);
    } catch (error) {
      toast.error('Không thể tải danh sách mẫu phiếu');
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật danh sách tiêu chí mẫu khi thay đổi Loại phiếu
  const handleTypeChange = (newType: string) => {
    setCurrentTemplate(prev => ({ ...prev, type: newType }));
    setCriteriaList(getDefaultCriteria(newType));
  };

  // Tính tổng điểm tối đa các tiêu chí
  const totalMaxScore = Number(
    criteriaList.reduce((sum, c) => sum + (Number(c.max_score) || 0), 0).toFixed(2)
  );
  const isValidTotal = Math.abs(totalMaxScore - 10.0) < 0.01;

  const totalEditMaxScore = Number(
    editCriteriaList.reduce((sum, c) => sum + (Number(c.max_score) || 0), 0).toFixed(2)
  );
  const isValidEditTotal = Math.abs(totalEditMaxScore - 10.0) < 0.01;

  // Thêm tiêu chí mới
  const handleAddCriterion = () => {
    setCriteriaList(prev => [
      ...prev,
      { id: Date.now(), name: '', max_score: 2.0 }
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteriaList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCriterionChange = (index: number, field: 'name' | 'max_score', value: any) => {
    setCriteriaList(prev => {
      const next = [...prev];
      if (field === 'max_score') {
        next[index].max_score = parseFloat(value) || 0;
      } else {
        next[index].name = value;
      }
      return next;
    });
  };

  // Xử lý khi chọn file upload: Tự động trích xuất bảng tiêu chí
  const handleFileSelected = async (file: File | null) => {
    setSelectedFile(file);
    if (!file) return;

    // Gợi ý tên phiếu nếu đang để trống
    if (!currentTemplate.name.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setCurrentTemplate(prev => ({ ...prev, name: cleanName }));
    }

    // Nếu là file Word, tự động đọc và trích xuất bảng tiêu chí
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      try {
        setIsExtracting(true);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const extracted = extractCriteriaFromHtml(result.value);
        if (extracted.length > 0) {
          setCriteriaList(extracted);
          const total = extracted.reduce((sum, c) => sum + c.max_score, 0);
          toast.success(`✨ Đã tự động trích xuất ${extracted.length} tiêu chí (Tổng điểm: ${total}đ) từ file Word!`);
        }
      } catch (err) {
        console.error('Error auto-extracting criteria:', err);
      } finally {
        setIsExtracting(false);
      }
    }
  };

  // Nút bấm kích hoạt trích xuất lại từ file
  const handleManualExtractFromFile = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file đính kèm trước');
      return;
    }

    if (!selectedFile.name.endsWith('.docx') && !selectedFile.name.endsWith('.doc')) {
      toast.info('Tính năng trích xuất tự động tối ưu nhất cho file Word (.docx, .doc)');
      return;
    }

    try {
      setIsExtracting(true);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const extracted = extractCriteriaFromHtml(result.value);
      if (extracted.length > 0) {
        setCriteriaList(extracted);
        const total = extracted.reduce((sum, c) => sum + c.max_score, 0);
        toast.success(`✨ Đã trích xuất thành công ${extracted.length} tiêu chí (Tổng điểm: ${total}đ) từ bảng trong file!`);
      } else {
        toast.warning('Không tìm thấy bảng tiêu chí phù hợp trong file. Vui lòng kiểm tra lại cấu trúc bảng trong file Word.');
      }
    } catch (err) {
      toast.error('Lỗi khi đọc bảng từ file');
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Edit Handlers
  const handleAddEditCriterion = () => {
    setEditCriteriaList(prev => [
      ...prev,
      { id: Date.now(), name: '', max_score: 2.0 }
    ]);
  };

  const handleRemoveEditCriterion = (index: number) => {
    setEditCriteriaList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleEditCriterionChange = (index: number, field: 'name' | 'max_score', value: any) => {
    setEditCriteriaList(prev => {
      const next = [...prev];
      if (field === 'max_score') {
        next[index].max_score = parseFloat(value) || 0;
      } else {
        next[index].name = value;
      }
      return next;
    });
  };

  const processMammothHtml = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
      const text = table.textContent?.toLowerCase() || '';
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
    if (!currentTemplate.name.trim()) {
      toast.error('Vui lòng nhập tên phiếu');
      return;
    }
    if (!selectedFile) {
      toast.error('Vui lòng chọn file đính kèm');
      return;
    }
    if (!isValidTotal) {
      toast.error(`Tổng điểm các tiêu chí hiện là ${totalMaxScore}đ. Bắt buộc phải bằng 10.0đ.`);
      return;
    }
    
    try {
      setIsConverting(true);
      if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewHtml(processMammothHtml(result.value));
      } else if (selectedFile.type === 'application/pdf') {
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
      if (!selectedFile || !currentTemplate.name.trim()) return;

      const formData = new FormData();
      formData.append('name', currentTemplate.name.trim());
      formData.append('type', currentTemplate.type);
      formData.append('criteria_config', JSON.stringify(criteriaList));
      formData.append('template_file', selectedFile);

      await gradingService.createGradingTemplate(formData);

      toast.success('Lưu mẫu phiếu và tiêu chí thành công');
      setIsUploadDialogOpen(false);
      setUploadStep(1);
      setPreviewHtml('');
      setSelectedFile(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Lỗi khi lưu mẫu phiếu');
    }
  };

  // Lưu tạo mẫu bằng Editor
  const handleSaveTemplate = async () => {
    try {
      if (!currentTemplate.name.trim()) {
        toast.error('Vui lòng nhập tên phiếu');
        return;
      }
      if (!isValidTotal) {
        toast.error(`Tổng điểm các tiêu chí hiện là ${totalMaxScore}đ. Bắt buộc phải bằng 10.0đ.`);
        return;
      }

      const formData = new FormData();
      formData.append('name', currentTemplate.name.trim());
      formData.append('type', currentTemplate.type);
      formData.append('criteria_config', JSON.stringify(criteriaList));

      if (selectedFile) {
        formData.append('template_file', selectedFile);
      } else if (templateContent) {
        const fileBlob = new Blob([templateContent], { type: 'text/html' });
        formData.append('template_file', fileBlob, 'template.html');
      }

      await gradingService.createGradingTemplate(formData);

      toast.success('Tạo mẫu phiếu và tiêu chí thành công');
      setIsDialogOpen(false);
      setIsUploadDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error('Lỗi khi lưu mẫu phiếu');
    }
  };

  // Mở modal sửa mẫu phiếu đã có
  const handleOpenEdit = (tpl: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(tpl);
    setEditTemplateName(tpl.name || '');
    setEditTemplateType(tpl.type || 'SUPERVISION');
    
    let config = tpl.criteria_config;
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch { config = []; }
    }
    if (Array.isArray(config) && config.length > 0) {
      setEditCriteriaList(config.map((c: any, idx: number) => ({
        id: c.id || idx + 1,
        name: c.name || c.title || `Tiêu chí ${idx + 1}`,
        max_score: Number(c.max_score ?? c.maxScore ?? c.weight ?? 2.5),
      })));
    } else {
      setEditCriteriaList(getDefaultCriteria(tpl.type || 'SUPERVISION'));
    }
    
    setIsEditDialogOpen(true);
  };

  // Lưu chỉnh sửa mẫu phiếu
  const handleSaveEdit = async () => {
    if (!editingTemplate) return;
    if (!editTemplateName.trim()) {
      toast.error('Vui lòng nhập tên mẫu phiếu');
      return;
    }
    if (!isValidEditTotal) {
      toast.error(`Tổng điểm các tiêu chí hiện là ${totalEditMaxScore}đ. Bắt buộc phải bằng đúng 10.0đ.`);
      return;
    }

    try {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append('name', editTemplateName.trim());
      formData.append('type', editTemplateType);
      formData.append('criteria_config', JSON.stringify(editCriteriaList));

      await gradingService.updateGradingTemplate(editingTemplate.id, formData);
      toast.success('Cập nhật tiêu chí mẫu phiếu thành công!');
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Lỗi khi cập nhật mẫu phiếu');
    } finally {
      setIsUpdating(false);
    }
  };

  // Xóa mẫu phiếu
  const handleDeleteTemplate = async (tpl: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu phiếu "${tpl.name}" không?`)) {
      return;
    }

    try {
      await gradingService.deleteGradingTemplate(tpl.id);
      toast.success('Đã xóa mẫu phiếu thành công');
      fetchTemplates();
    } catch (error) {
      toast.error('Lỗi khi xóa mẫu phiếu');
    }
  };

  const handleViewTemplate = async (tpl: any) => {
    if (!tpl.template_file_url) {
      toast.info('Mẫu phiếu này chưa có nội dung file đính kèm');
      return;
    }
    
    setIsViewLoading(true);
    setViewTemplateContent('');
    
    try {
      let fileUrl = `http://localhost:8002${tpl.template_file_url}`;
      
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
      title="Quản lý Phiếu chấm điểm & Tiêu chí"
      subtitle="Thiết lập các tiêu chí đánh giá trên thang điểm 10 và tải lên file mẫu (Word/PDF)"
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs text-muted-foreground">
            Các tiêu chí được cấu hình ở đây sẽ tự động hiển thị trong Form chấm điểm của Giảng viên và Bảng điểm của Sinh viên.
          </p>
        </div>
        <div className="flex gap-3">
          {/* Nút Upload File */}
          <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
            setIsUploadDialogOpen(open);
            if (!open) { setUploadStep(1); setPreviewHtml(''); setSelectedFile(null); }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setCurrentTemplate({ name: '', type: 'SUPERVISION' });
                setCriteriaList(getDefaultCriteria('SUPERVISION'));
                setSelectedFile(null);
                setUploadStep(1);
                setPreviewHtml('');
              }}>
                <Upload className="h-4 w-4 mr-2" /> Tải lên file
              </Button>
            </DialogTrigger>

            {/* BƯỚC 1: Chọn file & Cấu hình tiêu chí */}
            {uploadStep === 1 && (
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tải lên mẫu phiếu & Thiết lập Tiêu chí (Rubric)</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Tên phiếu đánh giá</Label>
                      <Input 
                        placeholder="VD: Phiếu chấm hướng dẫn chuẩn K16..."
                        value={currentTemplate.name}
                        onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Loại phiếu</Label>
                      <Select 
                        value={currentTemplate.type}
                        onValueChange={handleTypeChange}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUPERVISION">Phiếu Hướng dẫn</SelectItem>
                          <SelectItem value="REVIEW">Phiếu Phản biện</SelectItem>
                          <SelectItem value="DEFENSE">Phiếu Hội đồng bảo vệ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">File đính kèm (.doc, .docx, .pdf)</Label>
                      {selectedFile && (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) && (
                        <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" /> Hệ thống tự động đọc bảng điểm từ file
                        </span>
                      )}
                    </div>
                    <Input 
                      type="file" 
                      id="main-template-upload"
                      className="hidden" 
                      accept=".doc,.docx,.pdf"
                      onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                    />
                    <Label 
                      htmlFor="main-template-upload" 
                      className={`flex items-center justify-center cursor-pointer border-2 border-dashed p-4 rounded-lg hover:bg-slate-50 transition-colors ${
                        selectedFile ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      {isExtracting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Đang đọc bảng tiêu chí từ file Word...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 shrink-0" />
                          <span className="truncate text-xs font-medium">
                            {selectedFile ? selectedFile.name : 'Nhấn để chọn file Word (.docx) hoặc PDF'}
                          </span>
                        </div>
                      )}
                    </Label>
                  </div>

                  {/* BẢNG CẤU HÌNH TIÊU CHÍ */}
                  <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Danh mục tiêu chí đánh giá (Thang điểm 10)
                        </span>
                      </div>
                      <Badge variant={isValidTotal ? 'default' : 'destructive'} className={isValidTotal ? 'bg-emerald-600 text-white' : ''}>
                        Tổng điểm: {totalMaxScore} / 10.0 đ
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {criteriaList.map((c, idx) => (
                        <div key={c.id || idx} className="flex items-center gap-2 p-2 bg-background rounded-md border text-xs">
                          <span className="w-6 font-bold text-muted-foreground text-center">{idx + 1}.</span>
                          <Input 
                            value={c.name}
                            onChange={(e) => handleCriterionChange(idx, 'name', e.target.value)}
                            placeholder={`Tên tiêu chí ${idx + 1}`}
                            className="h-8 text-xs flex-1"
                          />
                          <div className="flex items-center gap-1 w-24 shrink-0">
                            <Input 
                              type="number"
                              step="0.25"
                              min="0.25"
                              max="10"
                              value={c.max_score}
                              onChange={(e) => handleCriterionChange(idx, 'max_score', e.target.value)}
                              className="h-8 text-xs text-right font-bold w-16"
                            />
                            <span className="text-muted-foreground font-semibold">đ</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveCriterion(idx)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={criteriaList.length <= 1}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddCriterion}
                        className="text-xs h-7 gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                      </Button>
                      <div className="flex items-center gap-2">
                        {selectedFile && (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={handleManualExtractFromFile}
                            disabled={isExtracting}
                            className="text-xs h-7 gap-1 text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Trích xuất lại từ file
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setCriteriaList(getDefaultCriteria(currentTemplate.type))}
                          className="text-xs h-7 gap-1 text-muted-foreground"
                        >
                          <RefreshCw className="w-3 h-3" /> Gợi ý tiêu chuẩn
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t">
                  <Button variant="ghost" onClick={() => setIsUploadDialogOpen(false)}>Hủy</Button>
                  <Button onClick={handlePreviewFile} disabled={isConverting || !isValidTotal} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isConverting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Xem trước & Tiếp tục
                  </Button>
                </div>
              </DialogContent>
            )}

            {/* BƯỚC 2: Xem trước toàn màn hình */}
            {uploadStep === 2 && (
              <DialogContent className="max-w-none sm:max-w-none w-screen h-screen max-h-screen p-0 m-0 overflow-hidden bg-white border-0 rounded-none flex flex-col">
                <div className="w-full flex flex-col h-full flex-1">
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
                      <Badge variant="default" className="bg-emerald-600">
                        {criteriaList.length} tiêu chí ({totalMaxScore}đ)
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Button variant="outline" onClick={() => { setUploadStep(1); setPreviewHtml(''); }}>Quay lại sửa</Button>
                      <Button onClick={handleConfirmAndUpload} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 rounded-full px-6">
                        <Save className="h-4 w-4 mr-2" /> Xác nhận & Lưu
                      </Button>
                    </div>
                  </DialogHeader>

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
                setCriteriaList(getDefaultCriteria('SUPERVISION'));
                setTemplateContent('');
                setSelectedFile(null);
              }} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Tạo mẫu mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-none sm:max-w-none w-screen h-screen max-h-screen p-0 m-0 overflow-hidden bg-white border-0 rounded-none flex flex-col">
              <div className="w-full flex flex-col h-full flex-1">
                <DialogHeader className="px-8 py-3 bg-white border-b border-slate-200 m-0 flex flex-row items-center justify-between gap-6 shrink-0 shadow-sm relative z-20">
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
                        onValueChange={handleTypeChange}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200 h-9 text-sm shadow-sm rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUPERVISION">Hướng dẫn</SelectItem>
                          <SelectItem value="REVIEW">Phản biện</SelectItem>
                          <SelectItem value="DEFENSE">Hội đồng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant={isValidTotal ? 'default' : 'destructive'} className={isValidTotal ? 'bg-emerald-600 text-white whitespace-nowrap' : 'whitespace-nowrap'}>
                      Tổng tiêu chí: {totalMaxScore} / 10đ
                    </Badge>
                  </div>

                  <Button onClick={handleSaveTemplate} disabled={!isValidTotal} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-md shadow-blue-500/20 rounded-full px-6 transition-all">
                    <Save className="h-4 w-4 mr-2" /> Lưu mẫu phiếu
                  </Button>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-4 flex-1 overflow-hidden bg-slate-100">
                  {/* Cột trái: Quản lý Tiêu chí chấm điểm */}
                  <div className="lg:col-span-1 bg-white border-r p-4 overflow-y-auto space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700">
                        <Layers className="w-4 h-4 text-blue-600" />
                        Tiêu chí Rubric (Thang 10)
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCriteriaList(getDefaultCriteria(currentTemplate.type))}
                        className="text-[11px] h-6 px-1.5 text-muted-foreground"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Mặc định
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {criteriaList.map((c, idx) => (
                        <div key={c.id || idx} className="p-2.5 bg-slate-50 border rounded-lg space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700">Tiêu chí #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <Input 
                                type="number"
                                step="0.25"
                                min="0.25"
                                max="10"
                                value={c.max_score}
                                onChange={(e) => handleCriterionChange(idx, 'max_score', e.target.value)}
                                className="h-6 w-14 text-right text-xs font-bold bg-white"
                              />
                              <span className="text-muted-foreground text-[11px]">đ</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveCriterion(idx)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-1"
                                disabled={criteriaList.length <= 1}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <Input 
                            value={c.name}
                            onChange={(e) => handleCriterionChange(idx, 'name', e.target.value)}
                            placeholder="Nhập tên tiêu chí..."
                            className="h-7 text-xs bg-white"
                          />
                        </div>
                      ))}
                    </div>

                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddCriterion}
                      className="w-full text-xs h-8 border-dashed"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Thêm tiêu chí đánh giá
                    </Button>
                  </div>

                  {/* Cột phải: Soạn thảo văn bản Jodit */}
                  <div className="lg:col-span-3 flex flex-col overflow-hidden">
                    <JoditEditor
                      value={templateContent}
                      config={editorConfig}
                      onBlur={newContent => setTemplateContent(newContent)}
                      onChange={() => {}}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => {
            let criteria: any[] = [];
            if (Array.isArray(tpl.criteria_config)) {
              criteria = tpl.criteria_config;
            } else if (typeof tpl.criteria_config === 'string') {
              try { criteria = JSON.parse(tpl.criteria_config); } catch { criteria = []; }
            }
            const totalScore = criteria.reduce((sum: number, c: any) => sum + (Number(c.max_score ?? c.maxScore ?? c.weight ?? 0)), 0);

            return (
              <Card 
                key={tpl.id}
                className="hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-bold text-foreground line-clamp-1">{tpl.name}</CardTitle>
                    <Badge variant={tpl.type === 'SUPERVISION' ? 'default' : tpl.type === 'REVIEW' ? 'secondary' : 'outline'}>
                      {tpl.type === 'SUPERVISION' ? 'Hướng dẫn' : tpl.type === 'REVIEW' ? 'Phản biện' : 'Hội đồng'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase">
                      <span>Tiêu chí đánh giá ({criteria.length}):</span>
                      <span className="text-primary font-bold">{totalScore}đ / 10đ</span>
                    </div>
                    <ul className="text-xs space-y-1.5 pl-3 border-l-2 border-blue-200 dark:border-blue-900">
                      {criteria.map((c: any, i: number) => (
                        <li key={i} className="flex justify-between items-center text-muted-foreground">
                          <span className="line-clamp-1 flex-1 pr-2">• {c.name || c.title || `Tiêu chí ${i + 1}`}</span>
                          <span className="font-semibold text-foreground shrink-0">{c.max_score ?? c.maxScore ?? 2.5}đ</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewTemplate(tpl)}
                      className="text-xs h-7 gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Xem file
                    </Button>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleOpenEdit(tpl, e)}
                        className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Sửa tiêu chí
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleDeleteTemplate(tpl, e)}
                        className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5"
                        title="Xóa mẫu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* DIALOG CHỈNH SỬA TIÊU CHÍ MẪU PHIẾU ĐÃ CÓ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Tiêu chí Phiếu chấm điểm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tên mẫu phiếu</Label>
                <Input 
                  value={editTemplateName}
                  onChange={(e) => setEditTemplateName(e.target.value)}
                  placeholder="Tên phiếu đánh giá..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Loại phiếu</Label>
                <Select 
                  value={editTemplateType}
                  onValueChange={setEditTemplateType}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERVISION">Phiếu Hướng dẫn</SelectItem>
                    <SelectItem value="REVIEW">Phiếu Phản biện</SelectItem>
                    <SelectItem value="DEFENSE">Phiếu Hội đồng bảo vệ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* BẢNG SỬA TIÊU CHÍ */}
            <div className="border rounded-lg p-3.5 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-foreground">Danh sách tiêu chí đánh giá</span>
                <Badge variant={isValidEditTotal ? 'default' : 'destructive'} className={isValidEditTotal ? 'bg-emerald-600 text-white' : ''}>
                  Tổng điểm: {totalEditMaxScore} / 10.0 đ
                </Badge>
              </div>

              <div className="space-y-2">
                {editCriteriaList.map((c, idx) => (
                  <div key={c.id || idx} className="flex items-center gap-2 p-2 bg-background rounded-md border text-xs">
                    <span className="w-5 font-bold text-muted-foreground text-center">{idx + 1}.</span>
                    <Input 
                      value={c.name}
                      onChange={(e) => handleEditCriterionChange(idx, 'name', e.target.value)}
                      placeholder={`Tên tiêu chí ${idx + 1}`}
                      className="h-8 text-xs flex-1"
                    />
                    <div className="flex items-center gap-1 w-20 shrink-0">
                      <Input 
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="10"
                        value={c.max_score}
                        onChange={(e) => handleEditCriterionChange(idx, 'max_score', e.target.value)}
                        className="h-8 text-xs text-right font-bold w-14"
                      />
                      <span className="text-muted-foreground font-semibold">đ</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveEditCriterion(idx)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={editCriteriaList.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddEditCriterion}
                  className="text-xs h-7 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditCriteriaList(getDefaultCriteria(editTemplateType))}
                  className="text-xs h-7 gap-1 text-muted-foreground"
                >
                  <RefreshCw className="w-3 h-3" /> Gợi ý chuẩn
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating || !isValidEditTotal} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Cập nhật tiêu chí
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG XEM NỘI DUNG FILE MẪU ĐÃ LƯU */}
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
