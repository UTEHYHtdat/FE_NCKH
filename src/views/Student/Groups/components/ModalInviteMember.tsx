import { useState, useEffect } from 'react';
import { Loader2, Search, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { studentService } from '@/plugins/api';
import type { StudentClassStudent } from '@/types/api';

interface ModalInviteMemberProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvitation: (invitedStudentIds: string[], message: string) => Promise<void>;
  isSubmitting: boolean;
  currentStudentId?: number;
  currentUserId?: number;
  existingMemberStudentIds?: number[];
  studentClassId?: number;
  studentClassName?: string;
  studentClassCode?: string;
}

export function ModalInviteMember({
  isOpen,
  onClose,
  onSendInvitation,
  isSubmitting,
  currentStudentId,
  currentUserId,
  existingMemberStudentIds = [],
  studentClassId,
  studentClassName,
  studentClassCode,
}: ModalInviteMemberProps) {
  const [invitedStudentIds, setInvitedStudentIds] = useState<string[]>([]);
  const [invitationMessage, setInvitationMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classStudents, setClassStudents] = useState<StudentClassStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [resolvedClassName, setResolvedClassName] = useState<string>('');
  const [resolvedClassCode, setResolvedClassCode] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setInvitedStudentIds([]);
      setInvitationMessage('');
      setSearchTerm('');
      
      if (studentClassId) {
        loadStudentsFromClass(studentClassId);
      }
    }
  }, [isOpen, studentClassId]);

  const loadStudentsFromClass = async (classId: number) => {
    try {
      setLoadingStudents(true);
      const classData = await studentService.getClassById(classId);
      if (classData) {
        setResolvedClassName(classData.class_name || studentClassName || '');
        setResolvedClassCode(classData.class_code || studentClassCode || '');
        setClassStudents(classData.students || []);
      }
    } catch (error) {
      console.error('Error loading class students for invitation:', error);
      setClassStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectStudent = (student: StudentClassStudent) => {
    const studentIdStr = student.id.toString();
    if (invitedStudentIds.includes(studentIdStr)) {
      setInvitedStudentIds(invitedStudentIds.filter(id => id !== studentIdStr));
    } else {
      setInvitedStudentIds([...invitedStudentIds, studentIdStr]);
    }
  };

  // Filter students by search term and exclude current user and existing members
  const filteredStudents = classStudents.filter((student) => {
    // Exclude current student
    if (currentStudentId && student.id === currentStudentId) return false;
    if (currentUserId && student.user_id === currentUserId) return false;
    
    // Exclude existing members in the group
    if (existingMemberStudentIds.includes(student.id)) return false;

    // Filter by name or student code
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = student.users?.full_name?.toLowerCase() || '';
    const studentCode = student.student_code?.toLowerCase() || '';
    const email = student.users?.email?.toLowerCase() || '';
    return fullName.includes(term) || studentCode.includes(term) || email.includes(term);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invitedStudentIds.length === 0) return;
    await onSendInvitation(invitedStudentIds, invitationMessage);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mời thành viên vào nhóm"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Class Scoping Notice (Locked to Student's Class) */}
        <div>
          <Label className="text-sm font-medium">Lớp sinh hoạt (Phạm vi mời)</Label>
          <div className="mt-1.5 p-3 bg-muted/60 border border-border rounded-lg flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm">
                {resolvedClassName || studentClassName || 'Lớp của bạn'}
              </span>
              {(resolvedClassCode || studentClassCode) && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({resolvedClassCode || studentClassCode})
                </span>
              )}
            </div>
            <Badge variant="outline" className="text-xs bg-background">
              Chỉ mời trong lớp
            </Badge>
          </div>
          {!studentClassId && (
            <div className="mt-2 p-2.5 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900 rounded flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Chưa xác định được mã lớp của bạn. Vui lòng kiểm tra lại thông tin hồ sơ.</span>
            </div>
          )}
        </div>

        {/* Student Search */}
        <div>
          <Label htmlFor="student_search">Tìm kiếm sinh viên trong lớp</Label>
          <div className="relative mt-1.5">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="student_search"
              placeholder="Nhập họ tên, mã sinh viên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              disabled={loadingStudents || !studentClassId}
            />
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Danh sách sinh viên ({filteredStudents.length})
            </Label>
            {invitedStudentIds.length > 0 && (
              <span className="text-xs text-primary font-medium">
                Đã chọn: {invitedStudentIds.length}
              </span>
            )}
          </div>

          <div className="border border-border rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Đang tải danh sách sinh viên...</span>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredStudents.map((student) => {
                  const isSelected = invitedStudentIds.includes(student.id.toString());
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className={`p-2.5 border rounded-lg cursor-pointer transition-colors flex items-start justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm truncate">
                          {student.users?.full_name || 'Không rõ tên'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MSSV: {student.student_code}
                        </p>
                        {student.users?.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {student.users.email}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-muted-foreground/40'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                {searchTerm ? 'Không tìm thấy sinh viên phù hợp trong lớp' : 'Không có sinh viên nào khả dụng để mời'}
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <Label htmlFor="invitation_message">Lời nhắn gửi kèm (Tùy chọn)</Label>
          <Input
            id="invitation_message"
            placeholder="VD: Mời bạn tham gia nhóm làm đồ án AI cùng mình..."
            value={invitationMessage}
            onChange={(e) => setInvitationMessage(e.target.value)}
            className="mt-1.5"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || invitedStudentIds.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              `Gửi lời mời (${invitedStudentIds.length})`
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
