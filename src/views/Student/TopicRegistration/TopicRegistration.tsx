import { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { topicRegistrationService, thesisGroupsService, thesisRoundsService } from '@/plugins/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  RoundsOverviewTable,
  RegisteredTopicCard,
  StepSelectInstructor,
  StepSelectTopic,
  StepConfirmRegistration,
} from './components';

export function TopicRegistration() {
  const { user } = useAuth();
  const studentId = user?.studentId || user?.id || 1;

  // Master Data State
  const [thesisRounds, setThesisRounds] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [thesisGroups, setThesisGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Context State (Which round is being viewed/registered)
  const [selectedRound, setSelectedRound] = useState<any | null>(null);
  const [viewingRegistration, setViewingRegistration] = useState<any | null>(null);

  // Stepper Registration State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState<boolean>(false);
  const [proposedTopics, setProposedTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [topicMode, setTopicMode] = useState<'proposed' | 'self'>('proposed');
  const [selfProposedTitle, setSelfProposedTitle] = useState('');
  const [selfProposedDescription, setSelfProposedDescription] = useState('');
  const [selectionReason, setSelectionReason] = useState('');
  const [registrationMode, setRegistrationMode] = useState<'group' | 'individual'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Master Data on Mount
  useEffect(() => {
    fetchInitialData();
  }, [user?.id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch thesis rounds for student
      try {
        const roundsRes = await thesisRoundsService.getThesisRoundsForStudent();
        const roundsList = roundsRes.success ? roundsRes.data : Array.isArray(roundsRes) ? roundsRes : [];
        setThesisRounds(roundsList);
      } catch (err: any) {
        console.error('Error fetching student rounds:', err);
      }

      // 2. Fetch all student's registrations
      try {
        const regs = await topicRegistrationService.getTopicRegistrations(user?.id);
        setRegistrations(Array.isArray(regs) ? regs : []);
      } catch (err: any) {
        console.error('Error fetching registrations:', err);
      }

      // 3. Fetch student's groups
      try {
        const groups = await thesisGroupsService.getThesisGroups(user?.id);
        setThesisGroups(Array.isArray(groups) ? groups : []);
      } catch (err: any) {
        console.error('Error fetching thesis groups:', err);
      }
    } catch (err: any) {
      console.error('Initial data fetch error:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng tải lại trang.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Instructors and Proposed Topics when a round is chosen for new registration
  const loadRoundRegistrationData = async (round: any) => {
    try {
      setLoadingInstructors(true);

      // Fetch instructors assigned to this round
      try {
        const assignmentsData = await thesisRoundsService.getInstructorAssignments(round.id);
        const assignments = Array.isArray(assignmentsData)
          ? assignmentsData
          : (assignmentsData as any).data || [];

        const mappedInstructors = assignments.map((assignment: any) => {
          const instructor = assignment.instructors || {};
          return {
            id: instructor.id || assignment.instructor_id,
            instructorCode: instructor.instructor_code || '',
            name: instructor.users?.full_name || 'Giảng viên',
            degree: instructor.academic_title || instructor.degree || 'Giảng viên',
            specialization: instructor.specialization || '',
            currentLoad: assignment.current_load || 0,
            quota: assignment.supervision_quota || 10,
            department:
              instructor.departments_instructors_department_idTodepartments?.department_name ||
              instructor.department?.department_name ||
              'Bộ môn CNTT',
            email: instructor.users?.email || '',
            yearsOfExperience: instructor.years_of_experience || 0,
            avatar: instructor.users?.avatar || '',
          };
        });
        setInstructors(mappedInstructors);
      } catch (e) {
        console.error('Error fetching instructors for round:', e);
        setInstructors([]);
      }

      // Fetch proposed topics for this round
      try {
        const topics = await topicRegistrationService.getProposedTopics(round.id);
        setProposedTopics(
          topics.map((t: any) => ({
            id: t.id,
            code: t.topic_code,
            title: t.topic_title,
            description: t.topic_description,
            technologies: t.technologies_used?.split(', ') || [],
            groupMode:
              t.proposed_topic_rules?.group_mode === 'GROUP_ONLY'
                ? 'Nhóm'
                : t.proposed_topic_rules?.group_mode === 'INDIVIDUAL_ONLY'
                ? 'Cá nhân'
                : 'Cả hai',
            minMembers: t.proposed_topic_rules?.min_members || 1,
            maxMembers: t.proposed_topic_rules?.max_members || 4,
            isTaken: t.is_taken,
            instructorId: t.instructor_id || t.instructors?.id,
          }))
        );
      } catch (e) {
        console.error('Error fetching proposed topics for round:', e);
        setProposedTopics([]);
      }
    } finally {
      setLoadingInstructors(false);
    }
  };

  // Action: Select round for registering a new topic
  const handleSelectRoundForRegistration = (round: any) => {
    setSelectedRound(round);
    setViewingRegistration(null);
    setCurrentStep(1);
    setSelectedInstructor(null);
    setSelectedTopic(null);
    setTopicMode('proposed');
    setSelfProposedTitle('');
    setSelfProposedDescription('');
    setSelectionReason('');
    loadRoundRegistrationData(round);
  };

  // Action: View an already registered topic in a round
  const handleViewRegisteredTopic = (round: any, registration: any) => {
    setSelectedRound(round);
    setViewingRegistration(registration);
  };

  // Action: Back to Rounds Overview Table
  const handleBackToRounds = () => {
    setSelectedRound(null);
    setViewingRegistration(null);
    setCurrentStep(1);
    setSelectedInstructor(null);
    setSelectedTopic(null);
  };

  // Action: Submit topic registration
  const handleSubmitRegistration = async () => {
    if (!selectedRound) return;

    if (topicMode === 'proposed' && !selectedTopic) {
      alert('Vui lòng chọn đề tài');
      return;
    }

    if (topicMode === 'self' && (!selfProposedTitle.trim() || !selfProposedDescription.trim())) {
      alert('Vui lòng điền đầy đủ tên và mô tả đề tài tự đề xuất');
      return;
    }

    try {
      setSubmitting(true);

      const registrationData = {
        thesis_group_id: registrationMode === 'group' ? (selectedGroupId ?? undefined) : undefined,
        thesis_round_id: selectedRound.id,
        instructor_id: selectedInstructor,
        proposed_topic_id: topicMode === 'proposed' ? selectedTopic ?? undefined : undefined,
        self_proposed_title: topicMode === 'self' ? selfProposedTitle : undefined,
        self_proposed_description: topicMode === 'self' ? selfProposedDescription : undefined,
        selection_reason: selectionReason,
        applied_group_mode:
          registrationMode === 'group' ? ('GROUP_ONLY' as const) : ('INDIVIDUAL_ONLY' as const),
        applied_min_members: registrationMode === 'group' ? 2 : 1,
        applied_max_members: registrationMode === 'group' ? 4 : 1,
        student_id: studentId,
      };

      await topicRegistrationService.createTopicRegistration(registrationData);
      alert('Đăng ký đề tài thành công! Hồ sơ đã được gửi đến Giảng viên hướng dẫn.');

      // Refresh data
      await fetchInitialData();

      // Return to overview table
      handleBackToRounds();
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      alert(`Lỗi đăng ký: ${error.message || 'Đã có lỗi xảy ra khi nộp đơn'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedInstructorInfo = instructors.find((i) => i.id === selectedInstructor);
  const selectedTopicInfo = proposedTopics.find((t) => t.id === selectedTopic);

  const steps = [
    { number: 1, title: 'Chọn GVHD' },
    { number: 2, title: 'Thông tin đề tài' },
    { number: 3, title: 'Xác nhận đăng ký' },
  ];

  return (
    <PageLayout
      userRole="student"
      userName={user?.fullName || 'Sinh viên'}
      title="Đăng ký đề tài"
      subtitle="Quản lý và đăng ký đề tài cho các đợt đồ án, bài tập lớn, khóa luận tốt nghiệp"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Đóng
          </Button>
        </div>
      )}

      {/* VIEW 1: Initial Rounds Overview Table (Default) */}
      {!selectedRound && (
        <RoundsOverviewTable
          thesisRounds={thesisRounds}
          registrations={registrations}
          loading={loading}
          onSelectRoundForRegistration={handleSelectRoundForRegistration}
          onViewRegisteredTopic={handleViewRegisteredTopic}
        />
      )}

      {/* VIEW 2: Viewing an already registered topic */}
      {selectedRound && viewingRegistration && (
        <RegisteredTopicCard
          round={selectedRound}
          registration={viewingRegistration}
          onBack={handleBackToRounds}
        />
      )}

      {/* VIEW 3: 3-Step Registration Stepper Flow */}
      {selectedRound && !viewingRegistration && (
        <div className="space-y-8">
          {/* Progress Stepper Header */}
          <div className="flex items-center justify-center pt-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                      currentStep > step.number
                        ? 'bg-emerald-600 text-white'
                        : currentStep === step.number
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.number ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.number}
                  </div>
                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      currentStep >= step.number ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-3 rounded mb-5 transition-colors ${
                      currentStep > step.number ? 'bg-emerald-600' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Instructor */}
          {currentStep === 1 && (
            <StepSelectInstructor
              round={selectedRound}
              instructors={instructors}
              selectedInstructor={selectedInstructor}
              loading={loadingInstructors}
              onSelectInstructor={(id) => setSelectedInstructor(id)}
              onNext={() => setCurrentStep(2)}
              onBackToRounds={handleBackToRounds}
            />
          )}

          {/* Step 2: Select Topic */}
          {currentStep === 2 && (
            <StepSelectTopic
              round={selectedRound}
              selectedInstructorInfo={selectedInstructorInfo}
              proposedTopics={proposedTopics.filter((t) => t.instructorId === selectedInstructor)}
              selectedTopic={selectedTopic}
              topicMode={topicMode}
              selfProposedTitle={selfProposedTitle}
              selfProposedDescription={selfProposedDescription}
              selectionReason={selectionReason}
              onSelectTopic={(id) => setSelectedTopic(id)}
              onSetTopicMode={setTopicMode}
              onSetSelfProposedTitle={setSelfProposedTitle}
              onSetSelfProposedDescription={setSelfProposedDescription}
              onSetSelectionReason={setSelectionReason}
              onNext={() => setCurrentStep(3)}
              onPrev={() => setCurrentStep(1)}
            />
          )}

          {/* Step 3: Confirm Registration */}
          {currentStep === 3 && (
            <StepConfirmRegistration
              round={selectedRound}
              selectedInstructorInfo={selectedInstructorInfo}
              selectedTopicInfo={selectedTopicInfo}
              topicMode={topicMode}
              selfProposedTitle={selfProposedTitle}
              selfProposedDescription={selfProposedDescription}
              selectionReason={selectionReason}
              registrationMode={registrationMode}
              selectedGroupId={selectedGroupId}
              thesisGroups={thesisGroups}
              submitting={submitting}
              onSetRegistrationMode={setRegistrationMode}
              onSetSelectedGroupId={setSelectedGroupId}
              onSubmit={handleSubmitRegistration}
              onPrev={() => setCurrentStep(2)}
            />
          )}
        </div>
      )}
    </PageLayout>
  );
}
