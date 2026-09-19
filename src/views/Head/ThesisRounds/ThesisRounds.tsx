import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Power,
  PlayCircle,
  School,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { thesisRoundsService, thesisTypesService } from "@/plugins/api";
import type { ThesisRound, ThesisType } from "@/types/api";
import { translateStatus } from "@/helpers/constant";
import {
  getCurrentAcademicYear,
  getCurrentSemester,
  getAcademicYearOptions,
} from "@/helpers/academicYear";

export function ThesisRounds() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || "head";
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<ThesisRound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRounds, setIsFetchingRounds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rounds, setRounds] = useState<ThesisRound[]>([]);
  const [thesisTypes, setThesisTypes] = useState<ThesisType[]>([]);

  // Helper function to handle different response formats
  const handleRoundsResponse = (data: any): ThesisRound[] => {
    console.log("ThesisRounds - API Response:", data);

    let roundsArray: ThesisRound[] = [];
    if (Array.isArray(data)) {
      roundsArray = data;
    } else if (data && typeof data === "object") {
      const dataObj = data as any;
      if (dataObj.data && Array.isArray(dataObj.data)) {
        roundsArray = dataObj.data;
      } else if (
        dataObj.success &&
        dataObj.data &&
        Array.isArray(dataObj.data)
      ) {
        roundsArray = dataObj.data;
      } else {
        const values = Object.values(dataObj);
        if (values.length > 0 && Array.isArray(values[0])) {
          roundsArray = values[0];
        } else {
          roundsArray = values as ThesisRound[];
        }
      }
    }

    console.log("ThesisRounds - Final rounds array:", roundsArray);
    return roundsArray;
  };

  const userFacultyId = (user as any)?.facultyId || (user as any)?.faculty_id || 1;
  const userDepartmentId = (user as any)?.departmentId || (user as any)?.department_id || 1;

  // Form state
  const [formData, setFormData] = useState({
    roundCode: "",
    roundName: "",
    thesisTypeId: 1,
    semester: getCurrentSemester(),
    academicYear: getCurrentAcademicYear(),
    startDate: "",
    endDate: "",
    topicProposalDeadline: "",
    registrationDeadline: "",
    reportSubmissionDeadline: "",
    notes: "",
    facultyId: userFacultyId,
    departmentId: userDepartmentId,
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    roundCode: "",
    roundName: "",
    thesisTypeId: 1,
    semester: 1,
    academicYear: "",
    startDate: "",
    endDate: "",
    topicProposalDeadline: "",
    registrationDeadline: "",
    reportSubmissionDeadline: "",
    notes: "",
    facultyId: userFacultyId,
    departmentId: userDepartmentId,
    defaultGroupMode: "BOTH",
    defaultMinMembers: 1,
    defaultMaxMembers: 1,
  });

  // Fetch thesis types and rounds on component mount
  useEffect(() => {
    const fetchThesisTypes = async () => {
      try {
        const data: any = await thesisTypesService.getThesisTypes();
        const types = Array.isArray(data) ? data : data?.data || [];
        setThesisTypes(types);
        if (types.length > 0) {
          setFormData((prev) => ({
            ...prev,
            thesisTypeId: prev.thesisTypeId || types[0].id,
          }));
        }
      } catch (err) {
        console.error("Error fetching thesis types:", err);
      }
    };

    const fetchRounds = async () => {
      setIsFetchingRounds(true);
      setError(null);
      try {
        const data = await thesisRoundsService.getThesisRoundsForHead();
        setRounds(handleRoundsResponse(data));
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách đợt khóa luận");
      } finally {
        setIsFetchingRounds(false);
      }
    };

    fetchThesisTypes();
    fetchRounds();
  }, []);

  // Update faculty/department if user context loads later
  useEffect(() => {
    if (user) {
      const fId = (user as any)?.facultyId || (user as any)?.faculty_id || 1;
      const dId = (user as any)?.departmentId || (user as any)?.department_id || 1;
      setFormData((prev) => ({
        ...prev,
        facultyId: fId,
        departmentId: dId,
      }));
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "semester" ||
        name === "thesisTypeId" ||
        name === "facultyId" ||
        name === "departmentId"
          ? Number(value)
          : value,
    }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]:
        name === "semester" ||
        name === "thesisTypeId" ||
        name === "facultyId" ||
        name === "departmentId" ||
        name === "defaultMinMembers" ||
        name === "defaultMaxMembers"
          ? Number(value)
          : value,
    }));
  };

  const handleOpenEditModal = (round: ThesisRound) => {
    setSelectedRound(round);
    setEditFormData({
      roundCode: round.round_code || "",
      roundName: round.round_name || "",
      thesisTypeId: round.thesis_type_id || 1,
      semester:
        typeof round.semester === "string"
          ? parseInt(round.semester)
          : round.semester || 1,
      academicYear: round.academic_year || "",
      startDate: round.start_date ? round.start_date.split("T")[0] : "",
      endDate: round.end_date ? round.end_date.split("T")[0] : "",
      topicProposalDeadline: round.topic_proposal_deadline
        ? round.topic_proposal_deadline.split("T")[0]
        : "",
      registrationDeadline: round.registration_deadline
        ? round.registration_deadline.split("T")[0]
        : "",
      reportSubmissionDeadline: round.report_submission_deadline
        ? round.report_submission_deadline.split("T")[0]
        : "",
      notes: round.notes || "",
      facultyId: round.faculty_id || 1,
      departmentId: round.department_id || 1,
      defaultGroupMode: round.thesis_round_rules?.default_group_mode || "BOTH",
      defaultMinMembers: round.thesis_round_rules?.default_min_members || 1,
      defaultMaxMembers: round.thesis_round_rules?.default_max_members || 1,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await thesisRoundsService.updateThesisRoundForHead(
        selectedRound.id,
        editFormData,
      );

      setSuccessMessage("Cập nhật đợt khóa luận thành công!");
      setIsEditModalOpen(false);

      // Refresh rounds list
      const fetchRounds = async () => {
        setIsFetchingRounds(true);
        try {
          const data = await thesisRoundsService.getThesisRoundsForHead();
          setRounds(handleRoundsResponse(data));
        } catch (err: any) {
          console.error("Error refreshing rounds:", err);
        } finally {
          setIsFetchingRounds(false);
        }
      };
      fetchRounds();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật đợt khóa luận");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateRound = async (id: number) => {
    try {
      await thesisRoundsService.activateThesisRoundForHead(id);
      setSuccessMessage("Kích hoạt đợt khóa luận thành công!");
      // Refresh rounds list
      const fetchRounds = async () => {
        setIsFetchingRounds(true);
        try {
          const data = await thesisRoundsService.getThesisRoundsForHead();
          setRounds(handleRoundsResponse(data));
        } catch (err: any) {
          console.error("Error refreshing rounds:", err);
        } finally {
          setIsFetchingRounds(false);
        }
      };
      fetchRounds();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi kích hoạt đợt khóa luận");
    }
  };

  const handleStartRound = async (id: number) => {
    try {
      await thesisRoundsService.startThesisRoundForHead(id);
      setSuccessMessage("Bắt đầu đợt khóa luận thành công!");
      // Refresh rounds list
      const fetchRounds = async () => {
        setIsFetchingRounds(true);
        try {
          const data = await thesisRoundsService.getThesisRoundsForHead();
          setRounds(handleRoundsResponse(data));
        } catch (err: any) {
          console.error("Error refreshing rounds:", err);
        } finally {
          setIsFetchingRounds(false);
        }
      };
      fetchRounds();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi bắt đầu đợt khóa luận");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Auto-generate roundCode
    const generatedRoundCode = `DOT${formData.semester}-${formData.academicYear.replace("-", "")}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0")}`;
    const submitData = { ...formData, roundCode: generatedRoundCode };

    console.log("Submitting form data:", submitData);

    try {
      await thesisRoundsService.createThesisRoundForHead(submitData);
      setSuccessMessage("Tạo đợt khóa luận thành công!");
      setIsCreateModalOpen(false);
      // Reset form
      setFormData({
        roundCode: "",
        roundName: "",
        thesisTypeId: thesisTypes[0]?.id || 1,
        semester: getCurrentSemester(),
        academicYear: getCurrentAcademicYear(),
        startDate: "",
        endDate: "",
        topicProposalDeadline: "",
        registrationDeadline: "",
        reportSubmissionDeadline: "",
        notes: "",
        facultyId: userFacultyId,
        departmentId: userDepartmentId,
      });
      // Refresh the rounds list
      const fetchRounds = async () => {
        setIsFetchingRounds(true);
        try {
          const data = await thesisRoundsService.getThesisRoundsForHead();
          setRounds(handleRoundsResponse(data));
        } catch (err: any) {
          console.error("Error refreshing rounds:", err);
        } finally {
          setIsFetchingRounds(false);
        }
      };
      fetchRounds();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo đợt khóa luận");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout
      userRole={userRole as any}
      userName={user?.fullName || "PGS. TS. Nguyễn Văn A"}
      title="Quản lý đợt khóa luận"
      subtitle="Tạo và quản lý các đợt khóa luận tốt nghiệp"
      actions={
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Tạo đợt mới
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm đợt khóa luận..."
                className="pl-10"
              />
            </div>
            <Select
              options={[
                { value: "all", label: "Tất cả năm học" },
                ...getAcademicYearOptions(3, 2),
              ]}
            />
            <Select
              options={[
                { value: "all", label: "Tất cả học kỳ" },
                { value: "HK1", label: "Học kỳ 1" },
                { value: "HK2", label: "Học kỳ 2" },
                { value: "HK3", label: "Học kỳ 3" },
              ]}
            />
            <Select
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "Preparing", label: "Chuẩn bị" },
                { value: "Ongoing", label: "Đang diễn ra" },
                { value: "Completed", label: "Hoàn thành" },
                { value: "Cancelled", label: "Đã hủy" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Mã đợt
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Tên đợt
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Loại
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Năm học
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    HK
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Thời gian
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Lớp tham gia
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isFetchingRounds ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : rounds.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Chưa có đợt khóa luận nào
                    </td>
                  </tr>
                ) : (
                  rounds.map((round) => (
                    <tr
                      key={round.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <span className="font-medium text-primary">
                          {round.round_code || `ĐK${round.id}`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium">{round.round_name}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {round.thesis_type?.type_name ||
                          thesisTypes.find((t) => t.id === round.thesis_type_id)?.type_name ||
                          "Khóa luận"}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {round.academic_year}
                      </td>
                      <td className="py-4 px-6 text-sm">HK{round.semester}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(round.start_date).toLocaleDateString("vi-VN")}{" "}
                        → {new Date(round.end_date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-4 px-6">
                        {round.thesis_round_classes &&
                        round.thesis_round_classes.length > 0 ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal text-blue-600 bg-blue-50/60 border-blue-200"
                          >
                            <School className="w-3 h-3 mr-1" />
                            {round.thesis_round_classes.length} lớp
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            Chưa gán
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant={getStatusBadgeVariant(round.status as any)}
                        >
                          {translateStatus(round.status as string)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/assign-classes?roundId=${round.id}`);
                            }}
                            title="Xếp lớp & Sinh viên tham gia"
                          >
                            <School className="w-4 h-4 text-emerald-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEditModal(round)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4 text-amber-500" />
                          </Button>
                          {round.status === "Preparing" && (
                            <Button
                              size="icon"
                              variant="default"
                              onClick={() => handleActivateRound(round.id)}
                              title="Kích hoạt"
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                          )}
                          {round.status === "ACTIVE" && (
                            <Button
                              size="icon"
                              variant="default"
                              onClick={() => handleStartRound(round.id)}
                              title="Bắt đầu"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          {error}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo đợt khóa luận mới"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tên đợt khóa luận <span className="text-destructive">*</span>
                </label>
                <Input
                  name="roundName"
                  value={formData.roundName}
                  onChange={handleInputChange}
                  placeholder="VD: Khóa luận tốt nghiệp Học kỳ 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Loại khóa luận / Đồ án <span className="text-destructive">*</span>
                </label>
                <select
                  name="thesisTypeId"
                  value={formData.thesisTypeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  required
                >
                  {thesisTypes.length > 0 ? (
                    thesisTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.type_name} ({type.type_code})
                      </option>
                    ))
                  ) : (
                    <option value="1">Khóa luận tốt nghiệp (KLTN)</option>
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Năm học <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    placeholder={getCurrentAcademicYear()}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Học kỳ <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    placeholder={getCurrentSemester().toString()}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thời gian */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Thời gian</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ngày bắt đầu <span className="text-destructive">*</span>
                </label>
                <Input
                  name="startDate"
                  type="date"
                  disablePast
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ngày kết thúc <span className="text-destructive">*</span>
                </label>
                <Input
                  name="endDate"
                  type="date"
                  min={
                    formData.startDate || new Date().toISOString().split("T")[0]
                  }
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hạn đề xuất đề tài <span className="text-destructive">*</span>
                </label>
                <Input
                  name="topicProposalDeadline"
                  type="date"
                  min={
                    formData.startDate || new Date().toISOString().split("T")[0]
                  }
                  max={formData.endDate || undefined}
                  value={formData.topicProposalDeadline}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hạn đăng ký <span className="text-destructive">*</span>
                </label>
                <Input
                  name="registrationDeadline"
                  type="date"
                  min={
                    formData.topicProposalDeadline ||
                    formData.startDate ||
                    new Date().toISOString().split("T")[0]
                  }
                  max={formData.endDate || undefined}
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hạn nộp báo cáo <span className="text-destructive">*</span>
                </label>
                <Input
                  name="reportSubmissionDeadline"
                  type="date"
                  min={
                    formData.registrationDeadline ||
                    formData.startDate ||
                    new Date().toISOString().split("T")[0]
                  }
                  max={formData.endDate || undefined}
                  value={formData.reportSubmissionDeadline}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ghi chú
                </label>
                <Input
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Ghi chú về đợt khóa luận..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang tạo..." : "Tạo đợt khóa luận"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa đợt khóa luận"
        size="lg"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-6">
          {/* Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tên đợt khóa luận <span className="text-destructive">*</span>
                </label>
                <Input
                  name="roundName"
                  value={editFormData.roundName}
                  onChange={handleEditInputChange}
                  placeholder="VD: Khóa luận tốt nghiệp Học kỳ 1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Thời gian */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Thời gian</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ngày bắt đầu <span className="text-destructive">*</span>
                </label>
                <Input
                  name="startDate"
                  type="date"
                  max={editFormData.endDate || undefined}
                  value={editFormData.startDate}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ngày kết thúc <span className="text-destructive">*</span>
                </label>
                <Input
                  name="endDate"
                  type="date"
                  min={editFormData.startDate || undefined}
                  value={editFormData.endDate}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hạn đăng ký <span className="text-destructive">*</span>
                </label>
                <Input
                  name="registrationDeadline"
                  type="date"
                  min={editFormData.startDate || undefined}
                  max={editFormData.endDate || undefined}
                  value={editFormData.registrationDeadline}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hạn đề xuất đề tài
                </label>
                <Input
                  name="topicProposalDeadline"
                  type="date"
                  min={editFormData.startDate || undefined}
                  max={editFormData.endDate || undefined}
                  value={editFormData.topicProposalDeadline}
                  onChange={handleEditInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hạn nộp báo cáo
                </label>
                <Input
                  name="reportSubmissionDeadline"
                  type="date"
                  min={
                    editFormData.registrationDeadline ||
                    editFormData.startDate ||
                    undefined
                  }
                  max={editFormData.endDate || undefined}
                  value={editFormData.reportSubmissionDeadline}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ghi chú
                </label>
                <Input
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditInputChange}
                  placeholder="Ghi chú về đợt khóa luận..."
                />
              </div>
            </div>
          </div>

          {/* Quy định nhóm */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-lg text-foreground">
              Quy định nhóm
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Chế độ làm <span className="text-destructive">*</span>
                </label>
                <select
                  name="defaultGroupMode"
                  value={editFormData.defaultGroupMode}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="BOTH">Cho phép cả hai</option>
                  <option value="GROUP_ONLY">Chỉ làm Nhóm</option>
                  <option value="INDIVIDUAL_ONLY">Chỉ làm Cá nhân</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tối thiểu (SV) <span className="text-destructive">*</span>
                </label>
                <Input
                  name="defaultMinMembers"
                  type="number"
                  min="1"
                  step="1"
                  value={editFormData.defaultMinMembers}
                  onChange={handleEditInputChange}
                  disabled={editFormData.defaultGroupMode === "INDIVIDUAL_ONLY"}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tối đa (SV) <span className="text-destructive">*</span>
                </label>
                <Input
                  name="defaultMaxMembers"
                  type="number"
                  min={editFormData.defaultMinMembers || "1"}
                  step="1"
                  value={editFormData.defaultMaxMembers}
                  onChange={handleEditInputChange}
                  disabled={editFormData.defaultGroupMode === "INDIVIDUAL_ONLY"}
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang cập nhật..." : "Cập nhật đợt khóa luận"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
