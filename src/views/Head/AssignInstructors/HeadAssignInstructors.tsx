import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { RefreshCw, Save } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { thesisRoundsService, adminService } from '@/plugins/api';
import type { ThesisRound } from '@/types/api';
import { toast } from 'sonner';

import type { InstructorItem } from './types';
import { AssignInstructorsStats } from './components/AssignInstructorsStats';
import { UnsavedChangesBanner } from './components/UnsavedChangesBanner';
import { UnassignedInstructorsTable } from './components/UnassignedInstructorsTable';
import { AssignedInstructorsTable } from './components/AssignedInstructorsTable';
import { InstructorDetailModal } from './components/InstructorDetailModal';

export function HeadAssignInstructors() {
  const { user } = useAuth();
  const userRole = user?.role || 'head';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoundId = searchParams.get('roundId') ? Number(searchParams.get('roundId')) : null;

  // ─── THESIS ROUNDS STATE ─────────────────────────────────────────────────
  const [rounds, setRounds] = useState<ThesisRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<ThesisRound | null>(null);
  const [isFetchingRounds, setIsFetchingRounds] = useState(false);

  // ─── INSTRUCTORS & DEPARTMENTS STATE ──────────────────────────────────────
  const [allInstructors, setAllInstructors] = useState<InstructorItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isFetchingInstructors, setIsFetchingInstructors] = useState(false);
  const [isSavingInstructors, setIsSavingInstructors] = useState(false);

  // ─── ASSIGNED STATE FOR SELECTED ROUND ────────────────────────────────────
  const [assignedInstructorIds, setAssignedInstructorIds] = useState<Set<number>>(new Set());
  const [initialAssignedInstructorIds, setInitialAssignedInstructorIds] = useState<Set<number>>(new Set());
  const [instructorQuotas, setInstructorQuotas] = useState<Record<number, number>>({});
  const [initialInstructorQuotas, setInitialInstructorQuotas] = useState<Record<number, number>>({});

  // ─── FILTERS STATE ────────────────────────────────────────────────────────
  const [unassignedSearchTerm, setUnassignedSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterDegree, setFilterDegree] = useState<string>('all');
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');

  // ─── MODAL DETAIL STATE ───────────────────────────────────────────────────
  const [selectedDetailInstructor, setSelectedDetailInstructor] = useState<InstructorItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 1. Tải danh sách các đợt đề tài / khóa luận
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
              (r) => r.status?.toUpperCase() === 'ACTIVE' || r.status === 'Preparing' || r.status === 'Ongoing'
            );
            setSelectedRound(activeRound || roundsList[0]);
          }
        }
      } catch (err: any) {
        console.error('Lỗi khi tải danh sách đợt:', err);
        toast.error('Không thể tải danh sách đợt đề tài / khóa luận');
      } finally {
        setIsFetchingRounds(false);
      }
    };

    fetchRounds();
  }, []);

  // 2. Tải toàn bộ danh mục Giảng viên và Bộ môn
  useEffect(() => {
    const fetchInstructorsAndDepartments = async () => {
      setIsFetchingInstructors(true);
      try {
        const [usersData, deptsData] = await Promise.all([
          adminService.getUsers({ role: 'instructor' }),
          adminService.getDepartments().catch(() => []),
        ]);

        const deptsList = Array.isArray(deptsData) ? deptsData : [];
        setDepartments(deptsList);

        const deptMap = new Map<number, any>();
        deptsList.forEach((d: any) => deptMap.set(d.id, d));

        const userList: any[] = Array.isArray(usersData) ? usersData : (usersData as any)?.data || [];
        const formattedInstructors: InstructorItem[] = userList
          .filter((u) => u.instructors && u.instructors.id)
          .map((u) => {
            const ins = u.instructors;
            const deptId = ins.department_id;
            const dept = deptMap.get(deptId) || ins.departments_instructors_department_idTodepartments;

            return {
              id: ins.id,
              user_id: u.id,
              instructor_code: ins.instructor_code,
              department_id: deptId,
              degree: ins.degree || 'Thạc sĩ',
              academic_title: ins.academic_title || 'Giảng viên',
              specialization: ins.specialization || 'Chưa cập nhật',
              years_of_experience: ins.years_of_experience || 0,
              status: ins.status !== false,
              full_name: u.full_name,
              email: u.email,
              phone: u.phone,
              avatar: u.avatar,
              department: dept
                ? {
                    id: dept.id,
                    department_code: dept.department_code,
                    department_name: dept.department_name,
                  }
                : undefined,
            };
          });

        formattedInstructors.sort((a, b) => a.instructor_code.localeCompare(b.instructor_code, undefined, { numeric: true }));
        setAllInstructors(formattedInstructors);
      } catch (err: any) {
        console.error('Lỗi khi tải dữ liệu giảng viên / bộ môn:', err);
        toast.error('Không thể tải danh sách giảng viên');
      } finally {
        setIsFetchingInstructors(false);
      }
    };

    fetchInstructorsAndDepartments();
  }, []);

  // 3. Tải danh sách Giảng viên đã gán cho đợt được chọn
  const fetchRoundInstructorAssignments = async (roundId: number) => {
    try {
      const data = await thesisRoundsService.getInstructorAssignmentsForHead(roundId);
      const rawList = Array.isArray(data) ? data : (data as any)?.data || [];

      const assignedSet = new Set<number>();
      const quotasMap: Record<number, number> = {};

      rawList.forEach((item: any) => {
        const insId = Number(item.instructor_id || item.instructors?.id);
        if (insId) {
          assignedSet.add(insId);
          quotasMap[insId] = item.supervision_quota || 5;
        }
      });

      setAssignedInstructorIds(assignedSet);
      setInitialAssignedInstructorIds(new Set(assignedSet));
      setInstructorQuotas(quotasMap);
      setInitialInstructorQuotas({ ...quotasMap });
    } catch (err: any) {
      console.error('Lỗi lấy danh sách giảng viên của đợt:', err);
      if (selectedRound && (selectedRound as any).instructor_assignments) {
        const fallbackSet = new Set<number>();
        const fallbackQuotas: Record<number, number> = {};
        (selectedRound as any).instructor_assignments.forEach((ia: any) => {
          fallbackSet.add(ia.instructor_id);
          fallbackQuotas[ia.instructor_id] = ia.supervision_quota || 5;
        });
        setAssignedInstructorIds(fallbackSet);
        setInitialAssignedInstructorIds(new Set(fallbackSet));
        setInstructorQuotas(fallbackQuotas);
        setInitialInstructorQuotas({ ...fallbackQuotas });
      } else {
        setAssignedInstructorIds(new Set());
        setInitialAssignedInstructorIds(new Set());
        setInstructorQuotas({});
        setInitialInstructorQuotas({});
      }
    }
  };

  useEffect(() => {
    if (selectedRound) {
      setSearchParams({ roundId: selectedRound.id.toString() });
      fetchRoundInstructorAssignments(selectedRound.id);
    }
  }, [selectedRound?.id]);

  // ─── THAO TÁC THÊM / GỠ GIẢNG VIÊN ───────────────────────────────────────
  const handleAddInstructor = (instructorId: number) => {
    setAssignedInstructorIds((prev) => {
      const next = new Set(prev);
      next.add(instructorId);
      return next;
    });
    setInstructorQuotas((prev) => {
      if (!prev[instructorId]) {
        return { ...prev, [instructorId]: 5 };
      }
      return prev;
    });
  };

  const handleRemoveInstructor = (instructorId: number) => {
    setAssignedInstructorIds((prev) => {
      const next = new Set(prev);
      next.delete(instructorId);
      return next;
    });
  };

  const handleAddAllFilteredUnassigned = () => {
    setAssignedInstructorIds((prev) => {
      const next = new Set(prev);
      unassignedInstructors.forEach((ins) => next.add(ins.id));
      return next;
    });
    setInstructorQuotas((prev) => {
      const next = { ...prev };
      unassignedInstructors.forEach((ins) => {
        if (!next[ins.id]) next[ins.id] = 5;
      });
      return next;
    });
  };

  const handleRemoveAllAssigned = () => {
    setAssignedInstructorIds((prev) => {
      const next = new Set(prev);
      assignedInstructors.forEach((ins) => next.delete(ins.id));
      return next;
    });
  };

  const handleChangeQuota = (instructorId: number, value: number) => {
    const val = Math.max(1, Math.min(30, Number(value) || 1));
    setInstructorQuotas((prev) => ({
      ...prev,
      [instructorId]: val,
    }));
  };

  const handleSaveInstructorAssignments = async () => {
    if (!selectedRound) return;

    setIsSavingInstructors(true);
    try {
      const instructorIdsArray = Array.from(assignedInstructorIds);
      await thesisRoundsService.assignInstructorsForHead(selectedRound.id, {
        instructor_ids: instructorIdsArray,
        quotas: instructorQuotas,
        supervision_quota: 5,
      });

      setInitialAssignedInstructorIds(new Set(assignedInstructorIds));
      setInitialInstructorQuotas({ ...instructorQuotas });
      toast.success(
        `Đã cập nhật phân công ${instructorIdsArray.length} giảng viên cho đợt "${selectedRound.round_name}" thành công!`
      );
    } catch (err: any) {
      console.error('Lỗi lưu phân công giảng viên:', err);
      toast.error(err.message || 'Lỗi khi lưu phân công giảng viên cho đợt');
    } finally {
      setIsSavingInstructors(false);
    }
  };

  // ─── DANH SÁCH LỌC ────────────────────────────────────────────────────────
  const unassignedInstructors = useMemo(() => {
    return allInstructors.filter((ins) => {
      if (assignedInstructorIds.has(ins.id)) return false;

      if (filterDepartment !== 'all' && ins.department_id !== Number(filterDepartment)) {
        return false;
      }

      if (filterDegree !== 'all' && ins.degree !== filterDegree) {
        return false;
      }

      if (unassignedSearchTerm.trim()) {
        const query = unassignedSearchTerm.toLowerCase();
        const codeMatch = ins.instructor_code.toLowerCase().includes(query);
        const nameMatch = ins.full_name.toLowerCase().includes(query);
        const emailMatch = ins.email?.toLowerCase().includes(query);
        const specMatch = ins.specialization?.toLowerCase().includes(query);
        const deptMatch = ins.department?.department_name.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !emailMatch && !specMatch && !deptMatch) return false;
      }

      return true;
    });
  }, [allInstructors, assignedInstructorIds, filterDepartment, filterDegree, unassignedSearchTerm]);

  const assignedInstructors = useMemo(() => {
    return allInstructors.filter((ins) => {
      if (!assignedInstructorIds.has(ins.id)) return false;

      if (assignedSearchTerm.trim()) {
        const query = assignedSearchTerm.toLowerCase();
        const codeMatch = ins.instructor_code.toLowerCase().includes(query);
        const nameMatch = ins.full_name.toLowerCase().includes(query);
        const emailMatch = ins.email?.toLowerCase().includes(query);
        const specMatch = ins.specialization?.toLowerCase().includes(query);
        const deptMatch = ins.department?.department_name.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !emailMatch && !specMatch && !deptMatch) return false;
      }

      return true;
    });
  }, [allInstructors, assignedInstructorIds, assignedSearchTerm]);

  const hasUnsavedChanges = useMemo(() => {
    if (assignedInstructorIds.size !== initialAssignedInstructorIds.size) return true;
    for (const id of assignedInstructorIds) {
      if (!initialAssignedInstructorIds.has(id)) return true;
      if (instructorQuotas[id] !== initialInstructorQuotas[id]) return true;
    }
    return false;
  }, [assignedInstructorIds, initialAssignedInstructorIds, instructorQuotas, initialInstructorQuotas]);

  const totalSupervisionQuota = useMemo(() => {
    return Array.from(assignedInstructorIds).reduce((sum, id) => sum + (instructorQuotas[id] || 5), 0);
  }, [assignedInstructorIds, instructorQuotas]);

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || 'Trưởng bộ môn'}
      title="Phân công Giáo viên tham gia Đợt Đề tài"
      subtitle="Chỉ định danh sách giảng viên tham gia hướng dẫn / phản biện và thiết lập hạn mức số lượng đề tài tối đa cho từng giảng viên trong đợt"
      actions={
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="amber" className="text-xs animate-pulse">
              Có thay đổi chưa lưu
            </Badge>
          )}
          <Button
            onClick={handleSaveInstructorAssignments}
            disabled={!selectedRound || isSavingInstructors}
            className="flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {isSavingInstructors ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu phân công giáo viên ({assignedInstructorIds.size} GV)
          </Button>
        </div>
      }
    >
      {/* 1. KHỐI CHỌN ĐỢT ĐỀ TÀI & 4 CARD THỐNG KÊ */}
      <AssignInstructorsStats
        rounds={rounds}
        selectedRound={selectedRound}
        onSelectRound={setSelectedRound}
        isFetchingRounds={isFetchingRounds}
        assignedCount={assignedInstructorIds.size}
        totalInstructorsCount={allInstructors.length}
        totalSupervisionQuota={totalSupervisionQuota}
        unassignedCount={unassignedInstructors.length}
      />

      {/* 2. CẢNH BÁO THAY ĐỔI CHƯA LƯU */}
      <UnsavedChangesBanner
        hasUnsavedChanges={hasUnsavedChanges}
        assignedCount={assignedInstructorIds.size}
        isSaving={isSavingInstructors}
        disabled={!selectedRound}
        onSave={handleSaveInstructorAssignments}
      />

      {/* 3. BỐ CỤC 2 BẢNG CHIA ĐÔI: BÊN TRÁI (CHƯA THÊM) - BÊN PHẢI (ĐÃ THÊM) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <UnassignedInstructorsTable
          instructors={unassignedInstructors}
          departments={departments}
          searchTerm={unassignedSearchTerm}
          onSearchChange={setUnassignedSearchTerm}
          filterDepartment={filterDepartment}
          onFilterDepartmentChange={setFilterDepartment}
          filterDegree={filterDegree}
          onFilterDegreeChange={setFilterDegree}
          isLoading={isFetchingInstructors}
          onAddInstructor={handleAddInstructor}
          onAddAll={handleAddAllFilteredUnassigned}
          onViewDetail={(ins) => {
            setSelectedDetailInstructor(ins);
            setIsDetailModalOpen(true);
          }}
        />

        <AssignedInstructorsTable
          instructors={assignedInstructors}
          searchTerm={assignedSearchTerm}
          onSearchChange={setAssignedSearchTerm}
          instructorQuotas={instructorQuotas}
          onChangeQuota={handleChangeQuota}
          totalSupervisionQuota={totalSupervisionQuota}
          onRemoveInstructor={handleRemoveInstructor}
          onRemoveAll={handleRemoveAllAssigned}
          onViewDetail={(ins) => {
            setSelectedDetailInstructor(ins);
            setIsDetailModalOpen(true);
          }}
        />
      </div>

      {/* 4. MODAL XEM CHI TIẾT HỒ SƠ GIẢNG VIÊN */}
      <InstructorDetailModal
        instructor={selectedDetailInstructor}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </PageLayout>
  );
}
