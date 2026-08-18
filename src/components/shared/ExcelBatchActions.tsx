import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExcelBatchActionsProps {
  title?: string;
  onImport?: (file: File) => Promise<any>;
  exportUrl?: string;
  templateUrl?: string;
  onExport?: () => void;
  importLabel?: string;
  exportLabel?: string;
  sampleColumns?: string[];
}

export const ExcelBatchActions: React.FC<ExcelBatchActionsProps> = ({
  onImport,
  exportUrl,
  onExport,
  importLabel = 'Nhập Excel',
  exportLabel = 'Xuất Excel',
  sampleColumns = []
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      return;
    }

    if (onImport) {
      try {
        setIsImporting(true);
        const res = await onImport(file);
        if (res?.data?.errors?.length > 0) {
          toast.warning(`Đã nhập thành công ${res.data.success}/${res.data.total} dòng. Có ${res.data.errors.length} dòng lỗi.`);
        } else {
          toast.success(`Nhập dữ liệu thành công ${res?.data?.success || ''} dòng!`);
        }
      } catch (err: any) {
        toast.error(err.message || 'Lỗi khi nhập dữ liệu từ Excel');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleExportClick = () => {
    if (onExport) {
      onExport();
    } else if (exportUrl) {
      window.open(exportUrl, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {onImport && (
        <button
          type="button"
          disabled={isImporting}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-600/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          title={sampleColumns.length > 0 ? `Cột yêu cầu: ${sampleColumns.join(', ')}` : 'Nhập dữ liệu hàng loạt từ Excel'}
        >
          {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{importLabel}</span>
        </button>
      )}

      {(exportUrl || onExport) && (
        <button
          type="button"
          onClick={handleExportClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-600/30 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700/50 transition-colors shadow-sm cursor-pointer"
          title="Tải bảng dữ liệu dạng Excel"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{exportLabel}</span>
        </button>
      )}
    </div>
  );
};
