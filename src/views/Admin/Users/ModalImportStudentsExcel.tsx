import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { adminService } from '@/plugins/api';
import { toast } from 'sonner';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, Loader2, Info 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ModalImportStudentsExcelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (targetClassId?: string) => void;
  classes?: any[];
  defaultClassId?: string;
}

export function ModalImportStudentsExcel({ 
  isOpen, 
  onClose, 
  onSuccess,
  classes = [],
  defaultClassId = ''
}: ModalImportStudentsExcelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    success: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedClassId(defaultClassId);
    }
  }, [isOpen, defaultClassId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Chỉ chấp nhận file Excel (.xlsx, .xls)');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Mã SV': '10121001',
        'Họ và tên': 'Nguyễn Văn An',
        'Email': '10121001@student.edu.vn',
        'Số điện thoại': '0987111222',
        'Lớp': 'K16-CNTT1',
        'GPA': 3.45,
        'Số tín chỉ': 120,
      },
      {
        'Mã SV': '10121002',
        'Họ và tên': 'Trần Thị Bình',
        'Email': '10121002@student.edu.vn',
        'Số điện thoại': '0987333444',
        'Lớp': 'K16-CNTT1',
        'GPA': 3.60,
        'Số tín chỉ': 122,
      },
      {
        'Mã SV': '10121003',
        'Họ và tên': 'Lê Hoàng Cường',
        'Email': '10121003@student.edu.vn',
        'Số điện thoại': '0987555666',
        'Lớp': 'K16-CNTT2',
        'GPA': 3.20,
        'Số tín chỉ': 118,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachSinhVien');
    XLSX.writeFile(workbook, 'Template_Danh_Sach_Sinh_Vien.xlsx');
    toast.success('Đã tải xuống file Excel mẫu');
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Vui lòng chọn file Excel để tải lên');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedClassId) {
        formData.append('class_id', selectedClassId);
      }

      const res: any = await adminService.importStudentsExcel(formData);
      
      const dataPayload = res?.data || res;
      const normalizedResult = {
        total: Number(dataPayload?.total || 0),
        success: Number(dataPayload?.success || 0),
        errors: Array.isArray(dataPayload?.errors) ? dataPayload.errors : []
      };

      setResult(normalizedResult);

      if (normalizedResult.success > 0) {
        toast.success(`Tạo thành công ${normalizedResult.success} tài khoản sinh viên!`);
        onSuccess(selectedClassId);
      } else {
        toast.warning('Không có tài khoản nào được tạo. Vui lòng kiểm tra lại file.');
      }
    } catch (error: any) {
      console.error('Import Excel error:', error);
      toast.error(error.message || 'Lỗi khi import file Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="Nhập danh sách Sinh viên từ Excel">
      <div className="space-y-4 py-1">
        {/* Banner lưu ý tài khoản & mật khẩu */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-xs space-y-1 text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-4 h-4 text-blue-600" />
            Cơ chế tạo tài khoản tự động:
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-muted-foreground">
            <li>Tên đăng nhập (Username): <b>Mã sinh viên</b></li>
            <li>Mật khẩu khởi tạo mặc định: <b className="text-emerald-600 font-mono text-xs">123456</b></li>
            <li>Vai trò hệ thống: <b>Sinh viên (STUDENT)</b></li>
          </ul>
        </div>

        {/* Phân lớp cho sinh viên */}
        {classes.length > 0 && (
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-foreground">
              Phân vào lớp học:
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Tự động nhận diện theo cột "Lớp" trong file Excel</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Gán vào lớp: {cls.class_name} ({cls.class_code})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              {selectedClassId 
                ? 'Toàn bộ sinh viên trong file sẽ được gán trực tiếp vào lớp đã chọn.' 
                : 'Hệ thống sẽ tự nhận diện theo tên hoặc mã lớp ở cột "Lớp" trong file.'}
            </p>
          </div>
        )}

        {/* Nút tải template */}
        <div className="flex justify-between items-center pb-2 border-b">
          <span className="text-xs text-muted-foreground">Chưa có file mẫu chuẩn?</span>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadTemplate}
            className="text-xs h-7 gap-1 border-emerald-500/40 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <Download className="w-3.5 h-3.5" /> Tải file Excel mẫu (.xlsx)
          </Button>
        </div>

        {/* Dropzone / Chọn file */}
        <div className="space-y-2">
          <input
            type="file"
            id="excel-student-import"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <label
            htmlFor="excel-student-import"
            className={`flex flex-col items-center justify-center cursor-pointer border-2 border-dashed p-6 rounded-lg transition-colors ${
              file 
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200' 
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
            }`}
          >
            <FileSpreadsheet className={`w-8 h-8 mb-2 ${file ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-xs font-semibold">
              {file ? file.name : 'Nhấn vào đây để chọn file Excel (.xlsx, .xls)'}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Hoặc kéo thả file vào khung này'}
            </span>
          </label>
        </div>

        {/* Kết quả import nếu có */}
        {result && (
          <div className="p-3.5 bg-muted/40 rounded-lg border space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Thành công: {result.success} / {result.total}
              </span>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="w-4 h-4" /> Thất bại: {result.errors.length}
                </span>
              )}
            </div>

            {Array.isArray(result.errors) && result.errors.length > 0 && (
              <div className="max-h-28 overflow-y-auto space-y-1 pt-1 border-t text-[11px]">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="text-red-600 flex gap-2">
                    <span className="font-semibold">Dòng {err.row}:</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
            {result ? 'Đóng' : 'Hủy'}
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || loading} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Tiến hành tạo tài khoản
          </Button>
        </div>
      </div>
    </Modal>
  );
}
