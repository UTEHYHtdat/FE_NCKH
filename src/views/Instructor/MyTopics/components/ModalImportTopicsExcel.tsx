import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { topicRegistrationService } from "@/plugins/api";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  FileText,
  Check,
  AlertTriangle,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { ThesisRound } from "@/types/api";

const EXCEL_TEMPLATE_URL = "/Mau_Danh_Sach_De_Tai_Khoa_Luan.xlsx";

interface ModalImportTopicsExcelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedRound: ThesisRound | null;
  quotaInfo?: { quota: number; currentLoad: number } | null;
}

interface ParsedTopicRow {
  index: number;
  title: string;
  code?: string;
  description?: string;
  tech?: string;
  mode: string;
  minMembers: number;
  maxMembers: number;
  isValid: boolean;
  error?: string;
}

export function ModalImportTopicsExcel({
  isOpen,
  onClose,
  onSuccess,
  selectedRound,
  quotaInfo,
}: ModalImportTopicsExcelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedTopicRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    success: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "xls" && ext !== "csv") {
        toast.error("Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc .csv");
        return;
      }
      setFile(selectedFile);
      setResult(null);
      parseExcelPreview(selectedFile);
    }
  };

  const parseExcelPreview = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rawRows: any[] = XLSX.utils.sheet_to_json(
          workbook.Sheets[sheetName],
        );

        if (!rawRows || rawRows.length === 0) {
          toast.warning("File Excel không có dữ liệu hoặc sheet rỗng");
          setPreviewRows([]);
          return;
        }

        const parsed: ParsedTopicRow[] = rawRows.map((row, idx) => {
          const title = (
            row["Tên đề tài"] ||
            row["Tên đề tài khóa luận"] ||
            row["topic_title"] ||
            ""
          )
            .toString()
            .trim();
          const code = (row["Mã đề tài"] || row["topic_code"] || "")
            .toString()
            .trim();
          const description = (
            row["Mô tả"] ||
            row["Mô tả đề tài"] ||
            row["topic_description"] ||
            ""
          )
            .toString()
            .trim();
          const tech = (
            row["Công nghệ"] ||
            row["Công nghệ sử dụng"] ||
            row["technologies_used"] ||
            ""
          )
            .toString()
            .trim();
          const rawMode = (row["Hình thức"] || row["group_mode"] || "Nhóm")
            .toString()
            .trim();
          const min = parseInt(
            row["SV tối thiểu"] || row["min_members"] || "1",
          );
          const max = parseInt(row["SV tối đa"] || row["max_members"] || "4");

          const isValid = Boolean(title);
          return {
            index: idx + 1,
            title,
            code,
            description,
            tech,
            mode: rawMode,
            minMembers: isNaN(min) ? 1 : Math.max(1, min),
            maxMembers: isNaN(max) ? 4 : Math.max(min || 1, max),
            isValid,
            error: isValid ? undefined : "Thiếu tên đề tài",
          };
        });

        setPreviewRows(parsed);
      } catch (err: any) {
        console.error("Lỗi đọc preview file Excel:", err);
        toast.error(
          "Không thể đọc dữ liệu từ file Excel. Vui lòng kiểm tra định dạng.",
        );
        setPreviewRows([]);
      }
    };
    reader.readAsArrayBuffer(fileToParse);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(EXCEL_TEMPLATE_URL);
      if (!response.ok) {
        throw new Error("Không thể tải file mẫu");
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "Mau_Danh_Sach_De_Tai_Khoa_Luan.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Đã tải xuống file Excel mẫu từ hệ thống!");
    } catch (err: any) {
      console.error("Lỗi khi tải file mẫu:", err);
      // Fallback: trực tiếp đến URL file
      const link = document.createElement("a");
      link.href = EXCEL_TEMPLATE_URL;
      link.download = "Mau_Danh_Sach_De_Tai_Khoa_Luan.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải xuống file Excel mẫu từ hệ thống!");
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file Excel để tải lên");
      return;
    }

    if (!selectedRound) {
      toast.error("Vui lòng chọn đợt khóa luận trước khi tải lên");
      return;
    }

    const validRows = previewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Không tìm thấy đề tài hợp lệ nào trong file để tải lên");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await topicRegistrationService.importProposedTopicsFromExcel(
        selectedRound.id,
        file,
      );
      const dataPayload = res?.data || res;

      const normalizedResult = {
        total: Number(dataPayload?.total || validRows.length),
        success: Number(dataPayload?.success || 0),
        errors: Array.isArray(dataPayload?.errors) ? dataPayload.errors : [],
      };

      setResult(normalizedResult);

      if (normalizedResult.success > 0) {
        toast.success(
          `Đã thêm thành công ${normalizedResult.success} đề tài vào đợt "${selectedRound.round_name}"!`,
        );
        onSuccess();
      } else {
        toast.warning(
          "Không có đề tài nào được tạo thành công. Vui lòng xem thông báo lỗi.",
        );
      }
    } catch (error: any) {
      console.error("Import Excel error:", error);
      toast.error(error.message || "Lỗi khi tải lên file Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewRows([]);
    setResult(null);
    onClose();
  };

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.length - validCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={`Nhập danh sách đề tài từ Excel — ${selectedRound?.round_name || "Đợt khóa luận"}`}
    >
      <div className="space-y-4 py-1 max-h-[78vh] overflow-y-auto pr-1">
        {/* Banner thông tin đợt & hạn mức */}
        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-xs space-y-1.5 text-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Đợt đề tài: {selectedRound?.round_name}
            </div>
            {quotaInfo && quotaInfo.quota > 0 && (
              <Badge
                variant="outline"
                className="text-[11px] bg-white dark:bg-card border-blue-300 text-blue-700 dark:text-blue-300 font-medium"
              >
                Hạn mức của bạn: {quotaInfo.quota} đề tài
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Hệ thống hỗ trợ tải lên hàng loạt đề tài từ file Excel (.xlsx,
            .xls). Các đề tài sau khi tải lên sẽ ở trạng thái sẵn sàng để sinh
            viên đăng ký.
          </p>
        </div>

        {/* Nút tải template mẫu */}
        <div className="flex items-center justify-between p-3 border border-dashed border-border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Tải file Excel mẫu (.xlsx)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Bao gồm các cột: Tên đề tài, Mô tả, Mục tiêu, Yêu cầu, Công
                nghệ, Hình thức...
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="text-xs h-8 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Tải mẫu
          </Button>
        </div>

        {/* Khu vực chọn / kéo thả file */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Chọn file Excel danh sách đề tài:
          </label>
          <div className="relative border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-5 text-center transition-colors bg-card hover:bg-muted/10 cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {file ? (
                    <span className="text-primary font-semibold">
                      {file.name}
                    </span>
                  ) : (
                    "Kéo thả file vào đây hoặc bấm để duyệt file"
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Định dạng hỗ trợ: .xlsx, .xls, .csv (Tối đa 15MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview danh sách đề tài đọc được */}
        {previewRows.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">
                  Xem trước dữ liệu ({previewRows.length} dòng):
                </p>
                <Badge variant="emerald" className="text-[10px] h-5">
                  {validCount} hợp lệ
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5">
                    {invalidCount} lỗi
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPreviewRows([]);
                }}
                className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Xóa file
              </Button>
            </div>

            {/* Cảnh báo hạn mức nếu vượt */}
            {quotaInfo &&
              quotaInfo.quota > 0 &&
              quotaInfo.currentLoad + validCount > quotaInfo.quota && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Chú ý về hạn mức hướng dẫn:</p>
                    <p className="text-[11px] mt-0.5">
                      Bạn hiện có hạn mức tối đa là <b>{quotaInfo.quota}</b> đề
                      tài (đã nhận: {quotaInfo.currentLoad}). File này có{" "}
                      <b>{validCount}</b> đề tài. Bạn vẫn có thể tải lên toàn bộ
                      danh sách để sinh viên chọn, nhưng tổng số nhóm hướng dẫn
                      chính thức sẽ dừng lại ở hạn mức {quotaInfo.quota}.
                    </p>
                  </div>
                </div>
              )}

            {/* Bảng preview tối đa 10 dòng */}
            <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/70 sticky top-0 border-b border-border text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="py-1.5 px-2 text-center w-10">STT</th>
                    <th className="py-1.5 px-2 text-left">Tên đề tài</th>
                    <th className="py-1.5 px-2 text-center w-20">Hình thức</th>
                    <th className="py-1.5 px-2 text-center w-16">Số SV</th>
                    <th className="py-1.5 px-2 text-center w-20">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewRows.slice(0, 15).map((row) => (
                    <tr
                      key={row.index}
                      className={
                        row.isValid
                          ? "hover:bg-muted/30"
                          : "bg-red-50/50 dark:bg-red-950/20"
                      }
                    >
                      <td className="py-1.5 px-2 text-center text-muted-foreground">
                        {row.index}
                      </td>
                      <td className="py-1.5 px-2 font-medium">
                        <span
                          className={
                            row.isValid
                              ? "text-foreground"
                              : "text-destructive font-semibold"
                          }
                        >
                          {row.title || "(Chưa có tên đề tài)"}
                        </span>
                        {row.tech && (
                          <span className="block text-[10px] text-muted-foreground truncate max-w-xs">
                            Công nghệ: {row.tech}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-center text-muted-foreground">
                        {row.mode}
                      </td>
                      <td className="py-1.5 px-2 text-center text-muted-foreground">
                        {row.minMembers} - {row.maxMembers}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <Check className="w-3 h-3" /> Hợp lệ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-medium">
                            <X className="w-3 h-3" /> Thiếu tên
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRows.length > 15 && (
                <div className="p-2 text-center text-[11px] text-muted-foreground bg-muted/30 border-t border-border">
                  ... và còn {previewRows.length - 15} đề tài khác nữa
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kết quả sau khi Import */}
        {result && (
          <div className="p-3.5 bg-muted/40 border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Kết quả xử lý:
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="emerald" className="text-xs">
                  Thành công: {result.success} / {result.total}
                </Badge>
                {result.errors.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Lỗi: {result.errors.length}
                  </Badge>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[11px] font-semibold text-destructive">
                  Chi tiết các dòng bị lỗi:
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {result.errors.map((err, i) => (
                    <div
                      key={i}
                      className="text-[11px] p-1.5 bg-destructive/10 text-destructive rounded flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Dòng {err.row}: {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={loading}
            className="text-xs cursor-pointer"
          >
            {result?.success ? "Đóng" : "Hủy"}
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || validCount === 0 || loading}
            className="text-xs gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang tải lên ({validCount} đề tài)...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Tải lên & Lưu ({validCount} đề tài)
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
