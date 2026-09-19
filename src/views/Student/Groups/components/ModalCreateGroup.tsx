import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ThesisRound } from '@/types/api';

export interface CreateGroupFormData {
  group_name: string;
  thesis_round_id: string;
  group_type: 'GROUP' | 'INDIVIDUAL';
  min_members: number;
  max_members: number;
}

interface ModalCreateGroupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateGroupFormData) => Promise<void>;
  thesisRounds: ThesisRound[];
  isSubmitting: boolean;
}

export function ModalCreateGroup({
  isOpen,
  onClose,
  onSubmit,
  thesisRounds,
  isSubmitting,
}: ModalCreateGroupProps) {
  const [formData, setFormData] = useState<CreateGroupFormData>({
    group_name: '',
    thesis_round_id: '',
    group_type: 'GROUP',
    min_members: 2,
    max_members: 4,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        group_name: '',
        thesis_round_id: thesisRounds.length > 0 ? thesisRounds[0].id.toString() : '',
        group_type: 'GROUP',
        min_members: 2,
        max_members: 4,
      });
    }
  }, [isOpen, thesisRounds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.group_name.trim() || !formData.thesis_round_id) return;
    await onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo nhóm mới"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tên nhóm */}
        <div>
          <Label htmlFor="group_name">Tên nhóm</Label>
          <Input
            id="group_name"
            placeholder="VD: Nhóm nghiên cứu AI, Đề tài Hệ thống gợi ý..."
            required
            value={formData.group_name}
            onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
            className="mt-1.5"
          />
        </div>

        {/* Đợt đồ án / Khóa luận */}
        <div>
          <Label htmlFor="thesis_round_id">Đợt khóa luận / Đồ án</Label>
          <Select
            value={formData.thesis_round_id}
            onValueChange={(value) => setFormData({ ...formData, thesis_round_id: value })}
          >
            <SelectTrigger id="thesis_round_id" className="mt-1.5">
              <SelectValue placeholder="Chọn đợt đăng ký..." />
            </SelectTrigger>
            <SelectContent>
              {thesisRounds.map((round) => (
                <SelectItem key={round.id} value={round.id.toString()}>
                  {round.round_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loại hình thức: Nhóm / Cá nhân */}
        <div>
          <Label className="text-sm font-medium">Hình thức làm việc</Label>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="groupType"
                value="INDIVIDUAL"
                checked={formData.group_type === 'INDIVIDUAL'}
                onChange={() =>
                  setFormData({
                    ...formData,
                    group_type: 'INDIVIDUAL',
                    min_members: 1,
                    max_members: 1,
                  })
                }
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">Cá nhân (1 sinh viên)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="groupType"
                value="GROUP"
                checked={formData.group_type === 'GROUP'}
                onChange={() =>
                  setFormData({
                    ...formData,
                    group_type: 'GROUP',
                    min_members: 2,
                    max_members: 4,
                  })
                }
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">Theo nhóm (Nhiều sinh viên)</span>
            </label>
          </div>
        </div>

        {/* Giới hạn số lượng thành viên (nếu là GROUP) */}
        {formData.group_type === 'GROUP' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_members">Số thành viên tối thiểu</Label>
              <Input
                id="min_members"
                type="number"
                min="1"
                step="1"
                value={formData.min_members}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_members: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="max_members">Số thành viên tối đa</Label>
              <Input
                id="max_members"
                type="number"
                min={formData.min_members || 1}
                step="1"
                value={formData.max_members}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_members: Math.max(formData.min_members || 1, parseInt(e.target.value) || 1),
                  })
                }
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.group_name.trim() || !formData.thesis_round_id}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              'Tạo nhóm'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
