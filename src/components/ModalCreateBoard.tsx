import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Badge } from './ui/badge';
import { councilService, instructorService, thesisRoundsService } from '@/plugins/api';
import type { CreateCouncilRequest, ThesisRound } from '@/types/api';
import { Users, AlertCircle, CheckCircle2, Crown, FileText, Info } from 'lucide-react';

interface ModalCreateBoardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  thesisRoundId?: number;
}

export function ModalCreateBoard({ isOpen, onClose, onSuccess, thesisRoundId }: ModalCreateBoardProps) {
  const [formData, setFormData] = useState({
    council_code: '',
    council_name: '',
    notes: '',
    thesis_round_id: thesisRoundId || 0,
    chairman_id: 0,
    secretary_id: 0,
    defense_date: '',
    start_time: '',
    end_time: '',
    venue: '',
  });
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [thesisRounds, setThesisRounds] = useState<ThesisRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingInstructors, setFetchingInstructors] = useState(false);
  const [fetchingThesisRounds, setFetchingThesisRounds] = useState(false);
  const [error, setError] = useState('');

  // Fetch instructors and thesis rounds when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setFetchingInstructors(true);
        setFetchingThesisRounds(true);
        setError('');
        try {
          const [instructorsData, thesisRoundsData] = await Promise.all([
            instructorService.getInstructors(),
            thesisRoundsService.getActiveThesisRoundsForHead(),
          ]);

          const instructorsArray = Array.isArray(instructorsData)
            ? instructorsData
            : (instructorsData as any)?.data || [];
          setInstructors(instructorsArray);

          const roundsArray = Array.isArray(thesisRoundsData)
            ? thesisRoundsData
            : (thesisRoundsData as any)?.data || [];
          setThesisRounds(roundsArray);

          if (thesisRoundId && !formData.thesis_round_id) {
            setFormData((prev) => ({ ...prev, thesis_round_id: thesisRoundId }));
          }
        } catch (err: any) {
          console.error('Error fetching data:', err);
          setError(err.message || 'Không thể tải dữ liệu');
        } finally {
          setFetchingInstructors(false);
          setFetchingThesisRounds(false);
        }
      };

      fetchData();
    }
  }, [isOpen, thesisRoundId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Tính tổng số lượng thành viên hội đồng
  const chairmanCount = formData.chairman_id ? 1 : 0;
  const secretaryCount = formData.secretary_id ? 1 : 0;
  const memberCount = selectedMembers.length;
  const totalMembers = chairmanCount + secretaryCount + memberCount;

  const isOdd = totalMembers % 2 !== 0;
  const isValidCount = totalMembers >= 3 && isOdd;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (totalMembers < 3) {
      setError('Hội đồng phải có tối thiểu 3 thành viên (1 Chủ tịch, 1 Thư ký và ít nhất 1 Ủy viên).');
      return;
    }

    if (!isOdd) {
      setError(`Số lượng thành viên hội đồng bắt buộc phải là số lẻ (3, 5, 7...). Hiện tại có ${totalMembers} thành viên (Số chẵn).`);
      return;
    }

    if (!formData.chairman_id) {
      setError('Vui lòng chọn Chủ tịch hội đồng.');
      return;
    }

    if (formData.chairman_id === formData.secretary_id) {
      setError('Chủ tịch và Thư ký hội đồng không được là cùng một người.');
      return;
    }

    setLoading(true);

    try {
      const requestData: CreateCouncilRequest = {
        council_code: formData.council_code,
        council_name: formData.council_name,
        thesis_round_id: formData.thesis_round_id,
        chairman_id: formData.chairman_id,
        secretary_id: formData.secretary_id || undefined,
        defense_date: formData.defense_date || undefined,
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
        venue: formData.venue || undefined,
        notes: formData.notes || undefined,
        members: selectedMembers.map((instructorId, index) => ({
          instructor_id: instructorId,
          role: 'MEMBER',
          order_number: index + 1,
        })),
      };

      await councilService.createCouncil(requestData);

      // Reset form
      setFormData({
        council_code: '',
        council_name: '',
        notes: '',
        thesis_round_id: thesisRoundId || 0,
        chairman_id: 0,
        secretary_id: 0,
        defense_date: '',
        start_time: '',
        end_time: '',
        venue: '',
      });
      setSelectedMembers([]);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo hội đồng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Hội đồng bảo vệ mới" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-md text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Thanh trạng thái cơ cấu số lẻ */}
        <div
          className={`p-3.5 rounded-lg border text-sm flex items-center justify-between gap-3 ${
            isValidCount
              ? 'bg-green-50/70 dark:bg-green-950/20 border-green-200 text-green-800 dark:text-green-300'
              : totalMembers === 0
              ? 'bg-muted/40 border-border text-muted-foreground'
              : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isValidCount ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-semibold block">
                Cơ cấu: {totalMembers} thành viên ({isOdd ? 'Số lẻ' : 'Số chẵn'})
              </span>
              <span className="text-xs opacity-90">
                {chairmanCount > 0 ? `1 Chủ tịch` : `Chưa chọn Chủ tịch`}
                {secretaryCount > 0 ? ` + 1 Thư ký` : ` + Chưa chọn Thư ký`}
                {memberCount > 0 ? ` + ${memberCount} Ủy viên` : ``}
              </span>
            </div>
          </div>
          <Badge
            variant={isValidCount ? 'default' : 'secondary'}
            className={isValidCount ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 text-white'}
          >
            {isValidCount
              ? 'Hợp lệ (Số lẻ ≥ 3)'
              : totalMembers < 3
              ? 'Chưa đủ tối thiểu 3 người'
              : 'Phải là số lẻ (3, 5, 7...)'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="council_name" className="text-sm font-medium">
              Tên hội đồng <span className="text-destructive">*</span>
            </label>
            <Input
              id="council_name"
              name="council_name"
              placeholder="VD: Hội đồng Bảo vệ KLTN số 01"
              value={formData.council_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="council_code" className="text-sm font-medium">
              Mã hội đồng <span className="text-destructive">*</span>
            </label>
            <Input
              id="council_code"
              name="council_code"
              placeholder="VD: HD-KLTN-01"
              value={formData.council_code}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="thesis_round_id" className="text-sm font-medium">
            Đợt khóa luận / Đồ án <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData.thesis_round_id ? formData.thesis_round_id.toString() : undefined}
            onValueChange={(value: string) =>
              setFormData((prev) => ({ ...prev, thesis_round_id: parseInt(value) }))
            }
            disabled={fetchingThesisRounds}
          >
            <SelectTrigger>
              <SelectValue placeholder={fetchingThesisRounds ? 'Đang tải...' : 'Chọn đợt khóa luận'} />
            </SelectTrigger>
            <SelectContent>
              {thesisRounds.map((round) => (
                <SelectItem key={round.id} value={round.id.toString()}>
                  {round.round_name} ({round.round_code || 'ĐK' + round.id}) - {round.academic_year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chọn Chủ tịch & Thư ký */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg border border-border/80">
          <div className="space-y-1.5">
            <label htmlFor="chairman_id" className="text-sm font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Crown className="w-4 h-4" /> Chủ tịch hội đồng <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.chairman_id ? formData.chairman_id.toString() : undefined}
              onValueChange={(value: string) =>
                setFormData((prev) => {
                  const id = parseInt(value);
                  // Tự động gỡ khỏi selectedMembers nếu trùng
                  setSelectedMembers((m) => m.filter((mid) => mid !== id));
                  return { ...prev, chairman_id: id };
                })
              }
              disabled={fetchingInstructors}
            >
              <SelectTrigger>
                <SelectValue placeholder={fetchingInstructors ? 'Đang tải...' : 'Chọn chủ tịch hội đồng'} />
              </SelectTrigger>
              <SelectContent>
                {instructors
                  .filter((inst) => inst.id !== formData.secretary_id)
                  .map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.users?.full_name} ({instructor.instructor_code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="secretary_id" className="text-sm font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
              <FileText className="w-4 h-4" /> Thư ký hội đồng <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.secretary_id ? formData.secretary_id.toString() : undefined}
              onValueChange={(value: string) =>
                setFormData((prev) => {
                  const id = parseInt(value);
                  setSelectedMembers((m) => m.filter((mid) => mid !== id));
                  return { ...prev, secretary_id: id };
                })
              }
              disabled={fetchingInstructors}
            >
              <SelectTrigger>
                <SelectValue placeholder={fetchingInstructors ? 'Đang tải...' : 'Chọn thư ký hội đồng'} />
              </SelectTrigger>
              <SelectContent>
                {instructors
                  .filter((inst) => inst.id !== formData.chairman_id)
                  .map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.users?.full_name} ({instructor.instructor_code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chọn danh sách Ủy viên hội đồng */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              Chọn các Ủy viên hội đồng (Để tổng thành viên là số lẻ: 3, 5, 7...)
            </label>
            <span className="text-xs text-muted-foreground">Đã chọn: {memberCount} ủy viên</span>
          </div>

          <div className="border border-border rounded-md p-3 max-h-44 overflow-y-auto space-y-1.5 bg-background">
            {fetchingInstructors ? (
              <p className="text-xs text-muted-foreground p-2">Đang tải danh sách giảng viên...</p>
            ) : (
              instructors
                .filter(
                  (inst) => inst.id !== formData.chairman_id && inst.id !== formData.secretary_id
                )
                .map((instructor) => {
                  const isChecked = selectedMembers.includes(instructor.id);
                  return (
                    <label
                      key={instructor.id}
                      className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-primary/10 border border-primary/30 font-medium' : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers((prev) => [...prev, instructor.id]);
                            } else {
                              setSelectedMembers((prev) => prev.filter((id) => id !== instructor.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-primary"
                        />
                        <span>{instructor.users?.full_name}</span>
                      </div>
                      <span className="text-muted-foreground font-mono">{instructor.instructor_code}</span>
                    </label>
                  );
                })
            )}
          </div>
        </div>

        {/* Lịch và địa điểm */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="defense_date" className="text-xs font-medium">
              Ngày bảo vệ
            </label>
            <Input
              id="defense_date"
              name="defense_date"
              type="date"
              value={formData.defense_date}
              onChange={handleChange}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="start_time" className="text-xs font-medium">
              Giờ bắt đầu
            </label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              value={formData.start_time}
              onChange={handleChange}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="venue" className="text-xs font-medium">
              Địa điểm / Phòng
            </label>
            <Input
              id="venue"
              name="venue"
              placeholder="VD: Phòng Hội thảo A1"
              value={formData.venue}
              onChange={handleChange}
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="notes" className="text-xs font-medium">
            Ghi chú
          </label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Ghi chú thêm về hội đồng..."
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            className="text-xs"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading || !isValidCount}
            className={isValidCount ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
          >
            {loading ? 'Đang tạo hội đồng...' : 'Tạo Hội đồng bảo vệ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
