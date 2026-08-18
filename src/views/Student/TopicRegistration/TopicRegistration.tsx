import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Search, FileText } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { topicRegistrationService, thesisGroupsService, thesisRoundsService, instructorService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';

export function TopicRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [topicMode, setTopicMode] = useState<'proposed' | 'self'>('proposed');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<any[]>([]);
  const [instructorSearch, setInstructorSearch] = useState('');
  const [proposedTopics, setProposedTopics] = useState<any[]>([]);
  const [thesisGroups, setThesisGroups] = useState<any[]>([]);
  const [thesisRounds, setThesisRounds] = useState<any[]>([]);
  
  // Self-proposed topic form state
  const [selfProposedTitle, setSelfProposedTitle] = useState('');
  const [selfProposedDescription, setSelfProposedDescription] = useState('');
  const [selectionReason, setSelectionReason] = useState('');
  
  // Student info from auth context
  const { user } = useAuth();
  const studentId = user?.studentId || 1; // Fallback to 1 if not available, though backend validates
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [registrationMode, setRegistrationMode] = useState<'group' | 'individual'>('group');
  const [approvedRegistration, setApprovedRegistration] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get thesis rounds for students
        console.log('Fetching thesis rounds for students...');
        const response = await thesisRoundsService.getThesisRoundsForStudent();
        console.log('Thesis rounds response:', response);

        // Handle response with success/data format
        const rounds = response.success ? response.data : [];
        console.log('Thesis rounds:', rounds);
        setThesisRounds(rounds);

        // Get thesis groups for this student
        try {
          const groups = await thesisGroupsService.getThesisGroups(studentId);
          setThesisGroups(groups);
        } catch (e) {
          console.error('Error fetching groups:', e);
        }

        // Check for existing approved registrations
        try {
          const registrations = await topicRegistrationService.getTopicRegistrations();
          if (registrations && registrations.length > 0) {
            const approved = registrations.find((r: any) => 
              r.instructor_status === 'APPROVED' && r.head_status === 'APPROVED'
            );
            if (approved) {
              setApprovedRegistration(approved);
            }
          }
        } catch (e) {
          console.error('Error fetching registrations:', e);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch instructors when a round is selected
  useEffect(() => {
    const fetchInstructorsForRound = async () => {
      if (!selectedRound) {
        setInstructors([]);
        setFilteredInstructors([]);
        setProposedTopics([]);
        return;
      }

      try {
        setLoading(true);

        // Get proposed topics for the selected round
        try {
          const topics = await topicRegistrationService.getProposedTopics(selectedRound);
          setProposedTopics(topics.map((t: any) => ({
            id: t.id,
            code: t.topic_code,
            title: t.topic_title,
            description: t.topic_description,
            technologies: t.technologies_used?.split(', ') || [],
            groupMode: t.proposed_topic_rules?.group_mode === 'GROUP_ONLY' ? 'Nhóm' : t.proposed_topic_rules?.group_mode === 'INDIVIDUAL_ONLY' ? 'Cá nhân' : 'Cả hai',
            minMembers: t.proposed_topic_rules?.min_members || 1,
            maxMembers: t.proposed_topic_rules?.max_members || 1,
            isTaken: t.is_taken,
            instructorId: t.instructor_id || t.instructors?.id,
          })));
        } catch (e) {
          console.error('Error fetching topics:', e);
        }

        // Get instructors from API
        console.log('Fetching instructors for thesis round:', selectedRound);
        try {
          const assignmentsData = await thesisRoundsService.getInstructorAssignments(selectedRound);
          // apiClient.get unwraps { data: ... } automatically if present, but just in case:
          const assignments = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData as any).data || [];
          console.log('Instructors assignments fetched:', assignments);
          
          const mappedInstructors = assignments.map((assignment: any) => {
            const instructor = assignment.instructors || {};
            return {
              id: instructor.id || assignment.instructor_id,
              instructorCode: instructor.instructor_code || '',
              name: instructor.users?.full_name || 'Unknown',
              degree: instructor.academic_title || instructor.degree || 'Giảng viên',
              specialization: instructor.specialization || '',
              currentLoad: assignment.current_load || 0,
              quota: assignment.supervision_quota || 0,
              department: instructor.departments_instructors_department_idTodepartments?.department_name || instructor.department?.department_name || '',
              email: instructor.users?.email || '',
              phone: instructor.users?.phone || '',
              yearsOfExperience: instructor.years_of_experience || 0,
              avatar: instructor.users?.avatar || '',
              status: instructor.status !== false,
            };
          });
          console.log('Mapped instructors:', mappedInstructors);
          setInstructors(mappedInstructors);
          setFilteredInstructors(mappedInstructors);
        } catch (e) {
          console.error('Error fetching instructors:', e);
          alert('Lỗi khi tải danh sách giảng viên: ' + (e as any).message);
        }
      } catch (error) {
        console.error('Error fetching data for round:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorsForRound();
  }, [selectedRound]);

  const steps = [
    { number: 1, title: 'Chọn đợt & GVHD' },
    { number: 2, title: 'Thông tin đề tài' },
    { number: 3, title: 'Xác nhận' },
  ];

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleInstructorSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.toLowerCase();
    setInstructorSearch(searchValue);
    
    const filtered = instructors.filter((instructor) => 
      instructor.name.toLowerCase().includes(searchValue) ||
      instructor.specialization.toLowerCase().includes(searchValue) ||
      instructor.department.toLowerCase().includes(searchValue) ||
      instructor.degree.toLowerCase().includes(searchValue)
    );
    setFilteredInstructors(filtered);
  };

  const handleSubmit = async () => {
    if (!selectedInstructor) {
      alert('Vui lòng chọn giảng viên');
      return;
    }

    if (registrationMode === 'group' && !selectedGroupId) {
      alert('Vui lòng chọn nhóm');
      return;
    }

    const activeRound = thesisRounds.find((r: any) => r.status?.toUpperCase() === 'ACTIVE');
    if (!activeRound) {
      alert('Không tìm thấy đợt đồ án hoạt động');
      return;
    }

    if (topicMode === 'proposed' && !selectedTopic) {
      alert('Vui lòng chọn đề tài');
      return;
    }

    if (topicMode === 'self' && (!selfProposedTitle || !selfProposedDescription || !selectionReason)) {
      alert('Vui lòng điền đầy đủ thông tin đề tài tự đề xuất');
      return;
    }

    try {
      setSubmitting(true);

      const registrationData = {
        thesis_group_id: registrationMode === 'group' ? (selectedGroupId ?? undefined) : undefined,
        thesis_round_id: activeRound.id,
        instructor_id: selectedInstructor,
        proposed_topic_id: topicMode === 'proposed' ? selectedTopic ?? undefined : undefined,
        self_proposed_title: topicMode === 'self' ? selfProposedTitle : undefined,
        self_proposed_description: topicMode === 'self' ? selfProposedDescription : undefined,
        selection_reason: selectionReason,
        applied_group_mode: registrationMode === 'group' ? ('GROUP_ONLY' as const) : ('INDIVIDUAL_ONLY' as const),
        applied_min_members: registrationMode === 'group' ? 2 : 1,
        applied_max_members: registrationMode === 'group' ? 4 : 1,
        student_id: studentId,
      };

      await topicRegistrationService.createTopicRegistration(registrationData);
      alert('Đăng ký đề tài thành công!');
      
      // Reset form
      setCurrentStep(1);
      setSelectedInstructor(null);
      setSelectedTopic(null);
      setSelectedGroupId(null);
      setSelfProposedTitle('');
      setSelfProposedDescription('');
      setSelectionReason('');
      setRegistrationMode('group');
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      alert(`Lỗi đăng ký: ${error.message || 'Đã có lỗi xảy ra'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (approvedRegistration) {
    return (
      <PageLayout title="Đăng ký đề tài khóa luận">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Đề tài của bạn đã được phê duyệt!</h2>
            <p className="text-muted-foreground mb-6">
              Bạn không thể đăng ký thêm đề tài khác. Đề tài hiện tại của bạn là:
            </p>
            <div className="p-6 bg-muted/50 rounded-lg w-full text-left">
              <h3 className="font-semibold text-lg mb-2">{approvedRegistration.proposed_topics?.topic_title || approvedRegistration.self_proposed_title}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Giảng viên hướng dẫn: <span className="font-medium text-foreground">{approvedRegistration.instructors?.users?.full_name || 'Không rõ'}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Ngày phê duyệt: <span className="font-medium text-foreground">{approvedRegistration.head_approval_date ? new Date(approvedRegistration.head_approval_date).toLocaleDateString('vi-VN') : 'Không rõ'}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      userRole="student"
      userName="Nguyễn Văn A"
      title="Đăng ký đề tài"
      subtitle="Đăng ký đề tài khóa luận cho nhóm của bạn"
    >
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                    currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : currentStep === step.number
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.number ? <Check className="w-6 h-6" /> : step.number}
                </div>
                <p className={`mt-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-24 h-1 mx-4 rounded ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Period & Instructor */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Select Registration Period */}
          <div>
            <h2 className="text-lg font-semibold mb-4">1. CHỌN ĐỢT ĐĂNG KÝ</h2>
            <div className="space-y-4">
              {thesisRounds.map((round: any) => {
                const isActive = round.status?.toUpperCase() === 'ACTIVE';
                const isUpcoming = round.status?.toUpperCase() === 'UPCOMING';
                const isSelected = selectedRound === round.id;
                const registrationDeadline = round.registration_deadline || 'N/A';
                const reportDeadline = round.report_deadline || 'N/A';
                const remainingQuota = round.remaining_quota || 0;
                const totalQuota = round.total_quota || 1;
                const registeredPercent = totalQuota > 0 ? ((totalQuota - remainingQuota) / totalQuota * 100).toFixed(0) : '0';
                
                return (
                  <Card
                    key={round.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:shadow-lg'
                    } ${!isActive && !isUpcoming ? 'opacity-50' : ''}`}
                    onClick={() => isActive && setSelectedRound(round.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-base mb-1">
                            {round.round_name || round.roundName || `Đợt ${round.id}`}
                          </h3>
                          <Badge variant={isActive ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
                            {isActive ? 'Đang mở' : isUpcoming ? 'Sắp mở' : 'Đã đóng'}
                          </Badge>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hạn đăng ký:</span>
                          <span className="font-medium">{registrationDeadline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hạn nộp báo cáo:</span>
                          <span className="font-medium">{reportDeadline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Còn trống:</span>
                          <span className="font-medium">{remainingQuota}/{totalQuota}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Đã đăng ký:</span>
                          <span className="font-medium">{registeredPercent}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${registeredPercent}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Column: Select Supervisor */}
          <div>
            <h2 className="text-lg font-semibold mb-4">2. CHỌN GIÁO VIÊN HƯỚNG DẪN</h2>
            
            {!selectedRound ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-6xl">👆</div>
                    <p className="text-muted-foreground text-lg">Chọn đợt để xem giáo viên hướng dẫn</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {selectedRound && (
                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Tìm kiếm giảng viên..."
                          className="pl-10"
                          value={instructorSearch}
                          onChange={handleInstructorSearch}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {loading ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-muted-foreground">Đang tải danh sách giảng viên...</div>
                    </CardContent>
                  </Card>
                ) : filteredInstructors.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-muted-foreground">
                        {instructors.length === 0
                          ? 'Không có giảng viên nào cho đợt khóa luận này. Vui lòng liên hệ quản trị viên.'
                          : 'Không tìm thấy giảng viên phù hợp với tìm kiếm.'}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {filteredInstructors.map((instructor) => (
                      <Card
                        key={instructor.id}
                        className={`cursor-pointer transition-all ${
                          selectedInstructor === instructor.id
                            ? 'ring-2 ring-primary'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => setSelectedInstructor(instructor.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar name={instructor.name} size="lg" />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">{instructor.name}</h3>
                                  <p className="text-sm text-muted-foreground">{instructor.degree}</p>
                                  <p className="text-xs text-muted-foreground">Mã GV: {instructor.instructorCode}</p>
                                </div>
                                {selectedInstructor === instructor.id && (
                                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">{instructor.specialization}</p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>Khoa: {instructor.department}</span>
                                <span>Kinh nghiệm: {instructor.yearsOfExperience} năm</span>
                              </div>
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Hạn mức</span>
                                  <span className={`font-medium ${
                                    instructor.currentLoad >= instructor.quota ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {instructor.currentLoad}/{instructor.quota}
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      instructor.currentLoad >= instructor.quota ? 'bg-red-600' : 'bg-green-600'
                                    }`}
                                    style={{ width: `${(instructor.currentLoad / instructor.quota) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {selectedRound && selectedInstructor && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleNext}>
                  Tiếp tục chọn đề tài
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Topic */}
      {currentStep === 2 && (
        <div>
          <Tabs defaultValue="proposed" onValueChange={(value) => setTopicMode(value as 'proposed' | 'self')}>
            <TabsList className="mb-6">
              <TabsTrigger value="proposed">Đề tài GV đề xuất</TabsTrigger>
              <TabsTrigger value="self">Tự đề xuất đề tài</TabsTrigger>
            </TabsList>

            <TabsContent value="proposed">
              <Card className="mb-6">
                <CardContent className="p-4">
                  <Input placeholder="Tìm kiếm đề tài..." />
                </CardContent>
              </Card>

              <div className="space-y-4">
                {proposedTopics.filter(t => t.instructorId === selectedInstructor).map((topic) => (
                  <Card
                    key={topic.id}
                    className={`cursor-pointer transition-all ${
                      selectedTopic === topic.id
                        ? 'ring-2 ring-primary'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => !topic.isTaken && setSelectedTopic(topic.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{topic.title}</h3>
                            {selectedTopic === topic.id && (
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">Mã: {topic.code}</p>
                        </div>
                        <Badge variant={topic.isTaken ? 'outline' : 'default'}>
                          {topic.isTaken ? 'Đã có nhóm' : 'Còn trống'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {topic.description}
                      </p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex gap-2">
                          {topic.technologies.map((tech) => (
                            <Badge key={tech} variant="blue">{tech}</Badge>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {topic.groupMode} • {topic.minMembers}-{topic.maxMembers} thành viên
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="self">
              <Card>
                <CardContent className="p-6">
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tên đề tài</label>
                      <Input
                        placeholder="Nhập tên đề tài tự đề xuất..."
                        value={selfProposedTitle}
                        onChange={(e) => setSelfProposedTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Mô tả đề tài</label>
                      <textarea
                        className="w-full px-3 py-2 bg-input-background border border-input rounded-lg min-h-32 resize-y"
                        placeholder="Mô tả chi tiết về đề tài..."
                        value={selfProposedDescription}
                        onChange={(e) => setSelfProposedDescription(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Lý do chọn đề tài</label>
                      <textarea
                        className="w-full px-3 py-2 bg-input-background border border-input rounded-lg min-h-24 resize-y"
                        placeholder="Giải thích tại sao nhóm muốn thực hiện đề tài này..."
                        value={selectionReason}
                        onChange={(e) => setSelectionReason(e.target.value)}
                        required
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Xác nhận thông tin đăng ký</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Hình thức đăng ký</h4>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="registrationMode"
                      value="group"
                      checked={registrationMode === 'group'}
                      onChange={(e) => setRegistrationMode(e.target.value as 'group' | 'individual')}
                      className="w-4 h-4"
                    />
                    <span>Nhóm</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="registrationMode"
                      value="individual"
                      checked={registrationMode === 'individual'}
                      onChange={(e) => setRegistrationMode(e.target.value as 'group' | 'individual')}
                      className="w-4 h-4"
                    />
                    <span>Cá nhân</span>
                  </label>
                </div>
              </div>

              {registrationMode === 'group' && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Nhóm</h4>
                  <select
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg"
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                    required
                  >
                    <option value="">Chọn nhóm</option>
                    {thesisGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.group_name} ({group.thesis_group_members?.length || 0} thành viên)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Giảng viên hướng dẫn</h4>
                <div className="flex items-center gap-3">
                  <Avatar name={instructors.find(i => i.id === selectedInstructor)?.name || ''} />
                  <div>
                    <p className="text-sm font-medium">{instructors.find(i => i.id === selectedInstructor)?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {instructors.find(i => i.id === selectedInstructor)?.specialization}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Đề tài</h4>
                {topicMode === 'proposed' ? (
                  <>
                    <p className="text-sm font-medium mb-1">
                      {proposedTopics.find(t => t.id === selectedTopic)?.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mã: {proposedTopics.find(t => t.id === selectedTopic)?.code}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">{selfProposedTitle}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{selfProposedDescription}</p>
                  </>
                )}
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ Vui lòng kiểm tra kỹ thông tin trước khi nộp. Sau khi nộp, bạn cần chờ sự phê duyệt từ giảng viên và trưởng bộ môn.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </Button>
        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !selectedInstructor) ||
              (currentStep === 2 && topicMode === 'proposed' && !selectedTopic)
            }
          >
            Tiếp theo
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            <Check className="w-4 h-4" />
            {submitting ? 'Đang nộp...' : 'Nộp đăng ký'}
          </Button>
        )}
      </div>
    </PageLayout>
  );
}
