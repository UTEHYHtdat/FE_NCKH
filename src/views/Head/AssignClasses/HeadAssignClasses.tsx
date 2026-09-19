import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { 
  School, 
  Search, 
  Check, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  Calendar,
  CheckSquare,
  Square,
  UserPlus,
  Trash2,
  GraduationCap,
  Sparkles,
  UserCheck,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { thesisRoundsService, adminService } from '@/plugins/api';
import type { ThesisRound } from '@/types/api';
import { translateStatus } from '@/helpers/constant';
import { toast } from 'sonner';

interface ClassItem {
  id: number;
  class_code: string;
  class_name: string;
  major_id: number;
  academic_year?: string;
  student_count?: number;
  status?: boolean;
  major?: {
    id: number;
    major_code: string;
    major_name: string;
    department?: {
      id: number;
      department_name: string;
    };
  };
}

interface AssignedStudentItem {
  id: number;
  student_id: number;
  student_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  class_id?: number;
  class_code?: string;
  class_name?: string;
  added_at?: string;
}

interface SearchStudentResult {
  student_id: number;
  user_id: number;
  student_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  class_id?: number;
  class_code?: string;
  class_name?: string;
}

export function HeadAssignClasses() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoundId = searchParams.get('roundId') ? Number(searchParams.get('roundId')) : null;

  // Main navigation tab: 'classes' (Lớp tham gia) or 'students' (Sinh viên thêm lẻ)
  const [mainTab, setMainTab] = useState<'classes' | 'students'>('classes');

  // Thesis Rounds
  const [rounds, setRounds] = useState<ThesisRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<ThesisRound | null>(null);
  const [isFetchingRounds, setIsFetchingRounds] = useState(false);

  // Tab 1: Classes state
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<Set<number>>(new Set());
  const [initialAssignedClassIds, setInitialAssignedClassIds] = useState<Set<number>>(new Set());
  const [isFetchingClasses, setIsFetchingClasses] = useState(false);
  const [isSavingClasses, setIsSavingClasses] = useState(false);

  // Filters for 2 split tables (Classes)
  const [unassignedSearchTerm, setUnassignedSearchTerm] = useState('');
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
  const [filterMajor, setFilterMajor] = useState<string>('all');

  // Tab 2: Individual Students state
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudentItem[]>([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [studentSearchKeyword, setStudentSearchKeyword] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<SearchStudentResult[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedStudentIdsToAdd, setSelectedStudentIdsToAdd] = useState<Set<number>>(new Set());
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);

  // 1. Tải danh sách các đợt đồ án / môn học
  useEffect(() => {
    const fetchRounds = async () => {
      setIsFetchingRounds(true);
      try {
        const data = await thesisRoundsService.getThesisRoundsForHead();
        let roundsList: ThesisRound[] = [];
        if (Array.isArray(data)) {
          roundsList = data;
        } else if (data && typeof data === 'object') {
          const dataObj = data as any;
          roundsList = dataObj.data || dataObj.thesis_rounds || [];
        }

        setRounds(roundsList);

        if (roundsList.length > 0) {
          if (initialRoundId) {
            const found = roundsList.find((r) => r.id === initialRoundId);
            setSelectedRound(found || roundsList[0]);
          } else {
            const activeRound = roundsList.find(
              (r) => r.status?.toUpperCase() === 'ACTIVE' || r.status === 'Preparing'
            );
            setSelectedRound(activeRound || roundsList[0]);
          }
        }
      } catch (err: any) {
        console.error('Lỗi khi tải danh sách đợt:', err);
        toast.error('Không thể tải danh sách đợt đồ án / khóa luận');
      } finally {
        setIsFetchingRounds(false);
      }
    };

    fetchRounds();
  }, []);

  // 2. Tải danh mục lớp học & chuyên ngành (hệ thống)
  useEffect(() => {
    const fetchClassesAndMajors = async () => {
      setIsFetchingClasses(true);
      try {
        const [classesData, majorsData] = await Promise.all([
          adminService.getClasses(),
          adminService.getMajors().catch(() => []),
        ]);

        setAllClasses(Array.isArray(classesData) ? (classesData as any) : []);
        setMajors(Array.isArray(majorsData) ? majorsData : []);
      } catch (err: any) {
        console.error('Lỗi tải danh mục lớp học:', err);
        toast.error('Không thể tải danh sách lớp học');
      } finally {
        setIsFetchingClasses(false);
      }
    };

    fetchClassesAndMajors();
  }, []);

  // 3. Tải danh sách lớp & sinh viên đã gán cho đợt được chọn
  const fetchRoundAssignments = async (roundId: number) => {
    // 3.1 Lấy các lớp đã gán
    try {
      const data = await thesisRoundsService.getClassesByRoundForHead(roundId);
      const rawList = Array.isArray(data) ? data : (data as any)?.data || [];
      const classIdSet = new Set<number>(
        rawList.map((item: any) => Number(item.class_id || item.class?.id)).filter(Boolean)
      );
      setAssignedClassIds(classIdSet);
      setInitialAssignedClassIds(new Set(classIdSet));
    } catch (err: any) {
      console.error('Lỗi lấy danh sách lớp của đợt:', err);
      if (selectedRound && selectedRound.thesis_round_classes) {
        const fallbackSet = new Set<number>(
          selectedRound.thesis_round_classes.map((rc: any) => rc.class_id)
        );
        setAssignedClassIds(fallbackSet);
        setInitialAssignedClassIds(new Set(fallbackSet));
      }
    }

    // 3.2 Lấy sinh viên thêm lẻ đã gán
    setIsFetchingStudents(true);
    try {
      const stuData = await thesisRoundsService.getAssignedStudentsForHead(roundId);
      const rawStuList = Array.isArray(stuData) ? stuData : (stuData as any)?.data || [];
      setAssignedStudents(rawStuList);
    } catch (err: any) {
      console.error('Lỗi lấy danh sách sinh viên lẻ:', err);
      setAssignedStudents([]);
    } finally {
      setIsFetchingStudents(false);
    }
  };

  useEffect(() => {
    if (selectedRound) {
      setSearchParams({ roundId: selectedRound.id.toString() });
      fetchRoundAssignments(selectedRound.id);
    }
  }, [selectedRound?.id]);

  // Set tập hợp các student_id đã được thêm lẻ
  const assignedStudentIdSet = useMemo(() => {
    return new Set<number>(assignedStudents.map((s) => s.student_id));
  }, [assignedStudents]);

  // ─── TAB 1: THAO TÁC LỚP HỌC (2 BẢNG CHIA 2 BÊN) ────────────────────────
  const handleAddClass = (classId: number) => {
    setAssignedClassIds((prev) => {
      const next = new Set(prev);
      next.add(classId);
      return next;
    });
  };

  const handleRemoveClass = (classId: number) => {
    setAssignedClassIds((prev) => {
      const next = new Set(prev);
      next.delete(classId);
      return next;
    });
  };

  const handleAddAllFilteredUnassigned = () => {
    setAssignedClassIds((prev) => {
      const next = new Set(prev);
      unassignedClasses.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleRemoveAllAssigned = () => {
    setAssignedClassIds((prev) => {
      const next = new Set(prev);
      assignedClasses.forEach((c) => next.delete(c.id));
      return next;
    });
  };

  const handleSaveClassAssignments = async () => {
    if (!selectedRound) return;

    setIsSavingClasses(true);
    try {
      const classIdsArray = Array.from(assignedClassIds);
      await thesisRoundsService.assignClassesForHead(selectedRound.id, {
        class_ids: classIdsArray,
      });

      setInitialAssignedClassIds(new Set(assignedClassIds));
      toast.success(
        `Đã cập nhật phân công ${classIdsArray.length} lớp cho đợt "${selectedRound.round_name}"`
      );
    } catch (err: any) {
      console.error('Lỗi lưu phân công lớp:', err);
      toast.error(err.message || 'Lỗi khi lưu phân công lớp học');
    } finally {
      setIsSavingClasses(false);
    }
  };

  // Danh sách Lớp CHƯA THÊM vào đợt (Bảng bên trái)
  const unassignedClasses = useMemo(() => {
    return allClasses.filter((c) => {
      if (assignedClassIds.has(c.id)) return false;

      if (filterMajor !== 'all' && c.major_id !== Number(filterMajor)) {
        return false;
      }

      if (unassignedSearchTerm.trim()) {
        const query = unassignedSearchTerm.toLowerCase();
        const codeMatch = c.class_code?.toLowerCase().includes(query);
        const nameMatch = c.class_name?.toLowerCase().includes(query);
        const majorMatch = c.major?.major_name?.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !majorMatch) return false;
      }

      return true;
    });
  }, [allClasses, assignedClassIds, filterMajor, unassignedSearchTerm]);

  // Danh sách Lớp ĐÃ THÊM vào đợt (Bảng bên phải)
  const assignedClasses = useMemo(() => {
    return allClasses.filter((c) => {
      if (!assignedClassIds.has(c.id)) return false;

      if (assignedSearchTerm.trim()) {
        const query = assignedSearchTerm.toLowerCase();
        const codeMatch = c.class_code?.toLowerCase().includes(query);
        const nameMatch = c.class_name?.toLowerCase().includes(query);
        const majorMatch = c.major?.major_name?.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !majorMatch) return false;
      }

      return true;
    });
  }, [allClasses, assignedClassIds, assignedSearchTerm]);

  const hasUnsavedClassChanges = useMemo(() => {
    if (assignedClassIds.size !== initialAssignedClassIds.size) return true;
    for (const id of assignedClassIds) {
      if (!initialAssignedClassIds.has(id)) return true;
    }
    return false;
  }, [assignedClassIds, initialAssignedClassIds]);

  // ─── TAB 2: THAO TÁC HỌC SINH THÊM LẺ ────────────────────────────────────────
  const handleSearchStudents = async (keyword?: string) => {
    const q = keyword !== undefined ? keyword : studentSearchKeyword;
    if (!q.trim()) {
      setStudentSearchResults([]);
      return;
    }

    setIsSearchingStudents(true);
    try {
      const res: any = await adminService.getUsers({
        role: 'student',
        search: q.trim(),
      });
      const usersList: any[] = Array.isArray(res) ? res : res?.data || [];
      const studentItems: SearchStudentResult[] = usersList
        .filter((u: any) => u.students && u.students.id)
        .map((u: any) => ({
          student_id: u.students.id,
          user_id: u.id,
          student_code: u.students.student_code,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          class_id: u.students.class_id,
          class_code: u.students.classes?.class_code,
          class_name: u.students.classes?.class_name,
        }));

      setStudentSearchResults(studentItems);
    } catch (err: any) {
      console.error('Lỗi tìm kiếm sinh viên:', err);
      toast.error('Không tìm thấy kết quả sinh viên');
    } finally {
      setIsSearchingStudents(false);
    }
  };

  const handleToggleSelectStudentToAdd = (studentId: number) => {
    setSelectedStudentIdsToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleAddStudentsToRound = async (studentIds: number[]) => {
    if (!selectedRound || studentIds.length === 0) return;

    setIsAddingStudents(true);
    try {
      await thesisRoundsService.assignIndividualStudentsForHead(selectedRound.id, studentIds);
      toast.success(
        `Đã thêm thành công ${studentIds.length} sinh viên vào môn học/đợt "${selectedRound.round_name}"`
      );
      setSelectedStudentIdsToAdd(new Set());
      // Refresh danh sách sinh viên lẻ
      if (selectedRound) {
        const stuData = await thesisRoundsService.getAssignedStudentsForHead(selectedRound.id);
        setAssignedStudents(Array.isArray(stuData) ? stuData : (stuData as any)?.data || []);
      }
    } catch (err: any) {
      console.error('Lỗi thêm sinh viên:', err);
      toast.error(err.message || 'Lỗi khi thêm sinh viên vào môn học');
    } finally {
      setIsAddingStudents(false);
    }
  };

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!selectedRound) return;

    setRemovingStudentId(studentId);
    try {
      await thesisRoundsService.removeIndividualStudentForHead(selectedRound.id, studentId);
      toast.success(`Đã gỡ sinh viên ${studentName} khỏi môn học`);
      setAssignedStudents((prev) => prev.filter((s) => s.student_id !== studentId));
    } catch (err: any) {
      console.error('Lỗi gỡ sinh viên:', err);
      toast.error(err.message || 'Không thể gỡ sinh viên');
    } finally {
      setRemovingStudentId(null);
    }
  };

  // ─── THỐNG KÊ TỔNG THỂ ───────────────────────────────────────────────────────
  const totalClassStudents = useMemo(() => {
    return allClasses
      .filter((c) => assignedClassIds.has(c.id))
      .reduce((sum, c) => sum + (c.student_count || 0), 0);
  }, [allClasses, assignedClassIds]);

  const totalIndividualStudents = assignedStudents.length;

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'Trưởng bộ môn'}
      title="Phân công Lớp & Sinh viên tham gia Đợt Đề tài"
      subtitle="Chỉ định danh sách lớp học hoặc thêm sinh viên (học ghép, học lại) được phép tham gia đợt đề tài / khóa luận tốt nghiệp"
      actions={
        <div className="flex items-center gap-2">
          {mainTab === 'classes' && hasUnsavedClassChanges && (
            <Badge variant="amber" className="text-xs animate-pulse">
              Có lớp chưa lưu
            </Badge>
          )}
          {mainTab === 'classes' && (
            <Button
              onClick={handleSaveClassAssignments}
              disabled={!selectedRound || isSavingClasses}
              className="flex items-center gap-2 shadow-sm"
            >
              {isSavingClasses ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu phân công lớp ({assignedClassIds.size} lớp)
            </Button>
          )}
        </div>
      }
    >
      {/* 1. KHỐI CHỌN ĐỢT ĐỀ TÀI / KHÓA LUẬN & THỐNG KÊ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Bộ chọn đợt */}
        <Card className="md:col-span-1 shadow-sm border-primary/20 bg-primary/[0.01]">
          <CardContent className="p-4">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              1. Chọn Đợt Đề tài / Khóa luận:
            </label>
            {isFetchingRounds ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang tải danh sách đợt...
              </div>
            ) : (
              <Select
                value={selectedRound?.id.toString() || ''}
                onValueChange={(val) => {
                  const r = rounds.find((item) => item.id === Number(val));
                  if (r) setSelectedRound(r);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn đợt đề tài / khóa luận..." />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id.toString()}>
                      {round.round_name} ({round.academic_year || 'N/A'} - HK{round.semester || 1})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedRound && (
              <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    {selectedRound.round_code || `ĐK${selectedRound.id}`}
                  </span>
                  <Badge
                    variant={getStatusBadgeVariant(selectedRound.status as any)}
                    className="text-[10px]"
                  >
                    {translateStatus(selectedRound.status as string)}
                  </Badge>
                </div>
                <span className="flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  Năm học: {selectedRound.academic_year} (HK{selectedRound.semester})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thống kê số lớp đã gán */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Lớp đã gán
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {assignedClassIds.size}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ {allClasses.length}</span>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Các lớp chính khóa tham gia
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Thống kê sinh viên thêm lẻ */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sinh viên thêm lẻ
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {totalIndividualStudents}{' '}
                <span className="text-xs font-normal text-muted-foreground">sinh viên</span>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Học ghép, học lại, chuyển đợt
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Tổng sinh viên được tham gia */}
        <Card className="shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Tổng SV có quyền ĐK
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">
                {totalClassStudents + totalIndividualStudents}{' '}
                <span className="text-xs font-normal text-muted-foreground">sinh viên</span>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totalClassStudents} theo lớp + {totalIndividualStudents} thêm lẻ
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. CHUYỂN ĐỔI 2 TAB CHÍNH */}
      <div className="flex border-b border-border mb-6 gap-2">
        <button
          onClick={() => setMainTab('classes')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            mainTab === 'classes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <School className="w-4 h-4" />
          Phân công theo Lớp học
          <Badge variant="outline" className="ml-1 text-xs">
            {assignedClassIds.size} lớp
          </Badge>
        </button>

        <button
          onClick={() => setMainTab('students')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            mainTab === 'students'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Thêm lẻ Sinh viên (Học ghép / Học lại)
          <Badge variant="amber" className="ml-1 text-xs">
            {totalIndividualStudents} SV
          </Badge>
        </button>
      </div>

      {/* ─── TAB 1: PHÂN CÔNG THEO LỚP HỌC (2 BẢNG CHIA 2 BÊN) ──────────── */}
      {mainTab === 'classes' && (
        <div className="space-y-4">
          {/* Cảnh báo thay đổi chưa lưu */}
          {hasUnsavedClassChanges && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Bạn có thay đổi phân công lớp <strong>chưa lưu</strong> (Hiện chọn <strong>{assignedClassIds.size}</strong> lớp). Hãy bấm nút <strong>"Lưu phân công lớp"</strong> để hệ thống cập nhật.
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveClassAssignments}
                disabled={!selectedRound || isSavingClasses}
                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
              >
                {isSavingClasses ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Lưu thay đổi ngay
              </Button>
            </div>
          )}

          {/* Grid 2 Bảng: Bên Trái (Chưa thêm) - Bên Phải (Đã thêm) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ─── BẢNG 1 (BÊN TRÁI): LỚP CHƯA THÊM VÀO ĐỢT ─── */}
            <Card className="shadow-sm border border-border flex flex-col h-[650px]">
              <CardContent className="p-4 flex flex-col h-full">
                {/* Header Bảng 1 */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                      <School className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Lớp chưa thêm vào đợt
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Danh sách lớp khả dụng có thể gán vào đợt đề tài này
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {unassignedClasses.length} lớp
                    </Badge>
                    {unassignedClasses.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddAllFilteredUnassigned}
                        className="text-xs h-7 px-2.5 flex items-center gap-1 text-primary border-primary/30 hover:bg-primary/5"
                        title="Thêm tất cả lớp đang hiển thị sang đợt"
                      >
                        <ArrowRight className="w-3 h-3" />
                        Thêm tất cả
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bộ lọc Bảng 1 */}
                <div className="flex flex-col sm:flex-row gap-2 py-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Tìm mã lớp, tên lớp chưa gán..."
                      value={unassignedSearchTerm}
                      onChange={(e) => setUnassignedSearchTerm(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                  <select
                    value={filterMajor}
                    onChange={(e) => setFilterMajor(e.target.value)}
                    className="px-2.5 py-1 border border-input rounded-md bg-background text-xs h-8 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">Tất cả ngành</option>
                    {majors.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.major_name || m.major_code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Table Bảng 1 */}
                <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 sticky top-0 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Mã lớp</th>
                        <th className="py-2.5 px-3 text-left">Tên lớp & Ngành</th>
                        <th className="py-2.5 px-2 text-center w-14">Sĩ số</th>
                        <th className="py-2.5 px-3 text-right w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isFetchingClasses ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-muted-foreground">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5" />
                            Đang tải danh sách lớp...
                          </td>
                        </tr>
                      ) : unassignedClasses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-16 text-center text-muted-foreground">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                            <p className="font-medium text-foreground">Không còn lớp nào chưa gán</p>
                            <p className="text-[11px] mt-0.5">
                              Tất cả lớp học phù hợp đã được gán vào đợt này
                            </p>
                          </td>
                        </tr>
                      ) : (
                        unassignedClasses.map((cls) => (
                          <tr key={cls.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-primary">
                              {cls.class_code}
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-medium text-foreground truncate max-w-[170px]">
                                {cls.class_name}
                              </p>
                              <span className="text-[10px] text-muted-foreground block truncate max-w-[170px]">
                                {cls.major?.major_name || 'Chuyên ngành chung'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                {cls.student_count || 0}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                size="sm"
                                onClick={() => handleAddClass(cls.id)}
                                className="text-xs h-7 px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 ml-auto"
                              >
                                <Plus className="w-3 h-3" />
                                Thêm vào
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ─── BẢNG 2 (BÊN PHẢI): LỚP ĐÃ THÊM VÀO ĐỢT ─── */}
            <Card className="shadow-sm border border-emerald-500/30 bg-emerald-500/[0.02] flex flex-col h-[650px]">
              <CardContent className="p-4 flex flex-col h-full">
                {/* Header Bảng 2 */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Lớp đã thêm vào đợt
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Các lớp chính khóa chính thức được tham gia đợt đề tài này
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="emerald" className="text-xs font-semibold">
                      {assignedClasses.length} lớp ({totalClassStudents} SV)
                    </Badge>
                    {assignedClasses.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveAllAssigned}
                        className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
                        title="Gỡ toàn bộ lớp khỏi đợt"
                      >
                        <Trash2 className="w-3 h-3" />
                        Gỡ tất cả
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bộ lọc Bảng 2 */}
                <div className="py-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm trong danh sách lớp đã gán..."
                      value={assignedSearchTerm}
                      onChange={(e) => setAssignedSearchTerm(e.target.value)}
                      className="pl-8 text-xs h-8 bg-background"
                    />
                  </div>
                </div>

                {/* Table Bảng 2 */}
                <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 sticky top-0 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Mã lớp</th>
                        <th className="py-2.5 px-3 text-left">Tên lớp & Ngành</th>
                        <th className="py-2.5 px-2 text-center w-14">Sĩ số</th>
                        <th className="py-2.5 px-3 text-right w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isFetchingClasses ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-muted-foreground">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5" />
                            Đang tải danh sách lớp đã gán...
                          </td>
                        </tr>
                      ) : assignedClasses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-16 text-center text-muted-foreground">
                            <School className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="font-medium text-foreground">Chưa có lớp nào được gán vào đợt</p>
                            <p className="text-[11px] mt-0.5">
                              Nhấn nút "Thêm vào" từ bảng bên trái để gán lớp vào đợt đề tài này
                            </p>
                          </td>
                        </tr>
                      ) : (
                        assignedClasses.map((cls) => (
                          <tr key={cls.id} className="hover:bg-muted/40 transition-colors bg-emerald-500/[0.03]">
                            <td className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                              {cls.class_code}
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-medium text-foreground truncate max-w-[170px]">
                                {cls.class_name}
                              </p>
                              <span className="text-[10px] text-muted-foreground block truncate max-w-[170px]">
                                {cls.major?.major_name || 'Chuyên ngành chung'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 font-mono text-emerald-700 border-emerald-500/30"
                              >
                                {cls.student_count || 0}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveClass(cls.id)}
                                className="text-xs h-7 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex items-center gap-1 ml-auto"
                              >
                                <X className="w-3 h-3" />
                                Gỡ bỏ
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB 2: THÊM LẺ SINH VIÊN ─────────────────────────────────────────── */}
      {mainTab === 'students' && (
        <div className="space-y-6">
          {/* Hộp hướng dẫn và tìm kiếm sinh viên */}
          <Card className="shadow-sm border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    Thêm lẻ sinh viên vào Môn học / Đợt đồ án
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dành cho các sinh viên học ghép, học lại, sinh viên trả nợ môn hoặc làm bù đợt tốt nghiệp.
                    Sinh viên được thêm ở đây sẽ có quyền nhìn thấy môn học này và được đăng ký đề tài như sinh viên chính khóa.
                  </p>

                  {/* Thanh tìm kiếm sinh viên */}
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Nhập Mã sinh viên, Họ và tên, hoặc Email để tìm kiếm..."
                        value={studentSearchKeyword}
                        onChange={(e) => setStudentSearchKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchStudents()}
                        className="pl-9 text-xs h-9 bg-background"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSearchStudents()}
                      disabled={isSearchingStudents || !studentSearchKeyword.trim()}
                      className="text-xs h-9 px-4 shrink-0 flex items-center gap-1.5"
                    >
                      {isSearchingStudents ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      Tìm kiếm
                    </Button>
                  </div>
                </div>
              </div>

              {/* Kết quả tìm kiếm sinh viên */}
              {studentSearchResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-amber-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">
                      Kết quả tìm kiếm ({studentSearchResults.length} sinh viên):
                    </span>
                    {selectedStudentIdsToAdd.size > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleAddStudentsToRound(Array.from(selectedStudentIdsToAdd))}
                        disabled={isAddingStudents}
                        className="text-xs h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                      >
                        {isAddingStudents ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        Thêm {selectedStudentIdsToAdd.size} sinh viên đã chọn
                      </Button>
                    )}
                  </div>

                  <div className="border border-border rounded-lg bg-background overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3 text-left w-10">
                            <span className="sr-only">Tích chọn</span>
                          </th>
                          <th className="py-2 px-3 text-left">Mã SV</th>
                          <th className="py-2 px-3 text-left">Họ và tên</th>
                          <th className="py-2 px-3 text-left">Lớp sinh hoạt</th>
                          <th className="py-2 px-3 text-left">Email</th>
                          <th className="py-2 px-3 text-center">Tình trạng</th>
                          <th className="py-2 px-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-b border-border">
                        {studentSearchResults.map((stu) => {
                          const isAlreadyIndividual = assignedStudentIdSet.has(stu.student_id);
                          const isAlreadyInAssignedClass = stu.class_id
                            ? assignedClassIds.has(stu.class_id)
                            : false;
                          const isSelectedToAdd = selectedStudentIdsToAdd.has(stu.student_id);

                          return (
                            <tr
                              key={stu.student_id}
                              className={`hover:bg-muted/40 transition-colors ${
                                isSelectedToAdd ? 'bg-primary/5' : ''
                              }`}
                            >
                              <td className="py-2 px-3">
                                {!isAlreadyIndividual && !isAlreadyInAssignedClass && (
                                  <input
                                    type="checkbox"
                                    checked={isSelectedToAdd}
                                    onChange={() => handleToggleSelectStudentToAdd(stu.student_id)}
                                    className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-input cursor-pointer"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-3 font-semibold text-primary">
                                {stu.student_code}
                              </td>
                              <td className="py-2 px-3 font-medium text-foreground">
                                {stu.full_name}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {stu.class_code || 'Chưa phân lớp'}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {stu.email || 'N/A'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {isAlreadyInAssignedClass ? (
                                  <Badge variant="emerald" className="text-[10px]">
                                    <School className="w-3 h-3 mr-1" />
                                    Theo lớp ({stu.class_code})
                                  </Badge>
                                ) : isAlreadyIndividual ? (
                                  <Badge variant="amber" className="text-[10px]">
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Đã thêm lẻ
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    Chưa tham gia
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {isAlreadyIndividual ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveStudent(stu.student_id, stu.full_name)}
                                    disabled={removingStudentId === stu.student_id}
                                    className="text-[11px] h-6 px-2 text-destructive hover:bg-destructive/10"
                                  >
                                    {removingStudentId === stu.student_id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      'Gỡ bỏ'
                                    )}
                                  </Button>
                                ) : isAlreadyInAssignedClass ? (
                                  <span className="text-[11px] text-muted-foreground italic">
                                    Đã có theo lớp
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddStudentsToRound([stu.student_id])}
                                    disabled={isAddingStudents}
                                    className="text-[11px] h-6 px-2 bg-primary hover:bg-primary/90"
                                  >
                                    + Thêm vào
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bảng danh sách sinh viên đã thêm lẻ */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    Danh sách sinh viên đã thêm lẻ ({assignedStudents.length} sinh viên)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Các sinh viên này không phụ thuộc vào việc lớp của họ có được phân công hay không
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                      <th className="py-3 px-4 text-center w-12">STT</th>
                      <th className="py-3 px-4 text-left">Mã sinh viên</th>
                      <th className="py-3 px-4 text-left">Họ và tên</th>
                      <th className="py-3 px-4 text-left">Lớp sinh hoạt</th>
                      <th className="py-3 px-4 text-left">Email liên hệ</th>
                      <th className="py-3 px-4 text-center">Thời gian thêm</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {isFetchingStudents ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Đang tải danh sách sinh viên...
                        </td>
                      </tr>
                    ) : assignedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          Chưa có sinh viên nào được thêm lẻ vào môn học/đợt này.
                          <span className="block text-xs mt-1 text-muted-foreground">
                            Sử dụng ô tìm kiếm ở trên để thêm sinh viên học ghép, học lại hoặc làm bù đợt.
                          </span>
                        </td>
                      </tr>
                    ) : (
                      assignedStudents.map((item, idx) => (
                        <tr key={item.id || item.student_id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-semibold text-primary">
                            {item.student_code}
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            {item.full_name}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {item.class_code || 'Chưa phân lớp'}
                            {item.class_name && (
                              <span className="block text-[11px] opacity-75">
                                {item.class_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {item.email || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                            {item.added_at
                              ? new Date(item.added_at).toLocaleDateString('vi-VN')
                              : 'Vừa xong'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveStudent(item.student_id, item.full_name)}
                              disabled={removingStudentId === item.student_id}
                              className="text-xs h-7 px-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            >
                              {removingStudentId === item.student_id ? (
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Trash2 className="w-3 h-3 mr-1" />
                              )}
                              Gỡ khỏi môn
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
