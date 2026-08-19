// Base Types

export type UserRole = 'student' | 'instructor' | 'head' | 'department_head' | 'admin';

export type GroupMode = 'BOTH' | 'GROUP_ONLY' | 'INDIVIDUAL_ONLY';

export type Status = 'DRAFT' | 'Active' | 'COMPLETED' | 'FORMING' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export type ReviewStatus = 'PENDING_REVIEW' | 'REVIEW_COMPLETED' | 'PENDING_DEFENSE' | 'DEFENSE_COMPLETED' | 'PREPARING';

export type CouncilRole = 'CHAIRMAN' | 'SECRETARY' | 'MEMBER' | 'REVIEWER';

export type CouncilStatus = 'PREPARING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type MemberRole = 'LEADER' | 'MEMBER';



// Authentication Types

export interface LoginRequest {

  username: string;

  password: string;

}



export interface LoginResponse {
  token: string;
  user: User;
  policies?: string[];
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  roles?: string[];
  policies?: string[];
  studentId?: number;
  studentCode?: string;
  className?: string;
  instructorId?: number;
  instructorCode?: string;
  departmentName?: string;
}

export interface Policy {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleWithPolicies {
  id: number;
  role_code: string;
  role_name: string;
  description?: string;
  status: boolean;
  policies: string[];
  policies_detail?: Policy[];
}

export interface UpdateRolePoliciesRequest {
  policies?: string[];
  policyIds?: number[];
}




export interface Profile {

  id: number;

  email: string;

  full_name: string;

  phone?: string;

  avatar?: string;

  created_at: string;

  studentCode?: string;

  className?: string;

  majorName?: string;

  gpa?: number;

  creditsEarned?: number;

  instructorCode?: string;

  departmentName?: string;

  degree?: string;

  academicTitle?: string;

  role: UserRole;

}



export interface LogoutResponse {

  message: string;

}



// Thesis Rounds Types

export interface CreateThesisRoundRequest {

  roundCode: string;

  roundName: string;

  thesisTypeId: number;

  departmentId: number;

  facultyId: number;

  academicYear: string;

  semester: number;

  startDate: string;

  endDate: string;

  topicProposalDeadline: string;

  registrationDeadline: string;

  reportSubmissionDeadline: string;

  notes?: string;

}



export interface ThesisRound {

  id: number;

  round_code: string;

  round_name: string;

  thesis_type_id: number;

  department_id: number;

  faculty_id: number;

  academic_year: string;

  semester: number;

  start_date: string;

  end_date: string;

  topic_proposal_deadline: string;

  registration_deadline: string;

  report_submission_deadline: string;

  notes?: string;

  status: 'Preparing' | 'Open' | 'In Progress' | 'Closed' | 'Completed' | 'ACTIVE';

  created_at: string;

  updated_at: string;

  thesis_round_rules?: {

    id: number;

    thesis_round_id: number;

    default_group_mode: GroupMode;

    default_min_members: number;

    default_max_members: number;

  };

  faculties?: {

    id: number;

    faculty_code: string;

    faculty_name: string;

  };

  departments?: {

    id: number;

    department_code: string;

    department_name: string;

  };

  instructor_assignments?: InstructorAssignment[];

  thesis_round_classes?: ThesisRoundClass[];

  guidance_processes?: GuidanceProcess[];

}



export interface InstructorAssignment {

  id: number;

  thesis_round_id: number;

  instructor_id: number;

  supervision_quota: number;

  current_load: number;

  notes?: string;

  status: boolean;

  created_at: string;

  updated_at: string;

  instructors?: {

    id: number;

    instructor_code: string;

    users?: {

      id: number;

      full_name: string;

      email: string;

      phone?: string;

      avatar?: string;

    };

    departments_instructors_department_idTodepartments?: {

      id: number;

      department_code: string;

      department_name: string;

    };

  };

}



export interface ThesisRoundClass {

  id: number;

  thesis_round_id: number;

  class_id: number;

  classes?: {

    id: number;

    class_code: string;

    class_name: string;

  };

}



export interface GuidanceProcess {

  id: number;

  thesis_round_id: number;

  week_number: number;

  phase_name: string;

  work_description: string;

  expected_outcome: string;

  status: boolean;

  created_at: string;

}



export interface AssignedInstructor {

  id: number;

  thesis_round_id: number;

  instructor_id: number;

  supervision_quota: number;

  current_load: number;

  notes?: string;

}



export interface AssignedClass {

  id: number;

  thesis_round_id: number;

  class_id: number;

}



export interface UpdateThesisRoundStatusRequest {

  status: 'Open' | 'Closed' | 'In Progress' | 'Completed';

}



export interface UpdateThesisRoundRequest {

  roundCode?: string;

  roundName?: string;

  thesisTypeId?: number;

  semester?: number;

  academicYear?: string;

  startDate?: string;

  endDate?: string;

  topicProposalDeadline?: string;

  registrationDeadline?: string;

  reportSubmissionDeadline?: string;

  notes?: string;

  facultyId?: number;

  departmentId?: number;

}



export interface AssignInstructorsRequest {

  instructorIds: number[];

  supervisionQuota: number;

}



export interface AssignClassesRequest {

  class_ids: number[];

}



export interface AddGuidanceProcessRequest {

  processes: {

    week_number: number;

    phase_name: string;

    work_description: string;

    expected_outcome: string;

  }[];

}



export interface GuidanceProcessResponse {

  id: number;

  thesis_round_id: number;

  week_number: number;

  phase_name: string;

  work_description: string;

  expected_outcome: string;

}



// Topic Registration Types

export interface CreateProposedTopicRequest {

  topic_code: string;

  topic_title: string;

  topic_description: string;

  objectives: string;

  student_requirements: string;

  technologies_used: string;

  topic_references: string;

  thesis_round_id: number;

  group_mode: GroupMode;

  min_members: number;

  max_members: number;

  reason?: string;

  instructor_id: number;

}



export interface ProposedTopic {

  id: number;

  topic_code: string;

  topic_title: string;

  topic_description?: string;

  objectives?: string;

  technologies_used?: string;

  is_taken: boolean;

  status: boolean;

  instructor_id?: number;

  thesis_round_id?: number;

  proposed_topic_rules?: {

    group_mode: GroupMode;

    min_members: number;

    max_members: number;

  };

  instructors?: {

    id: number;

    instructor_code: string;

    users: {

      full_name: string;

      email: string;

    };

  };

}



export interface CreateTopicRegistrationRequest {

  thesis_group_id?: number;

  thesis_round_id: number;

  instructor_id: number;

  proposed_topic_id?: number;

  self_proposed_title?: string;

  self_proposed_description?: string;

  selection_reason: string;

  applied_group_mode: GroupMode;

  applied_min_members: number;

  applied_max_members: number;

  student_id: number;

}



export interface TopicRegistration {

  id: number;

  thesis_group_id: number;

  thesis_round_id: number;

  instructor_id: number;

  proposed_topic_id?: number;

  self_proposed_title?: string;

  self_proposed_description?: string;

  instructor_status: Status;

  head_status: Status | null;

  registration_date: string;

  instructor_rejection_reason?: string;

  instructor_approval_date?: string;

  head_rejection_reason?: string;

  head_approval_date?: string;

  head_override_group_mode?: GroupMode;

  head_override_min_members?: number;

  head_override_max_members?: number;

  head_override_reason?: string;

  proposed_topics?: ProposedTopic;

  thesis_groups?: ThesisGroup;

  thesis_rounds?: ThesisRound;
  
  theses?: {
    id: number;
    status: string;
  };

  instructors?: {

    id: number;

    instructor_code: string;

    users: {

      full_name: string;

      email: string;

    };

    departments?: {

      department_name: string;

    };

  };

}



export interface ApproveRegistrationRequest {

  status: 'APPROVED' | 'REJECTED';

  rejection_reason?: string;

  instructor_id: number;

}



export interface HeadApproveRegistrationRequest {

  status: 'APPROVED' | 'REJECTED';

  rejection_reason?: string;

  head_override_group_mode?: GroupMode;

  head_override_min_members?: number;

  head_override_max_members?: number;

  head_override_reason?: string;

}



// Thesis Groups Types

export interface CreateThesisGroupRequest {

  group_name: string;

  thesis_round_id: number;

  group_type: GroupMode;

  min_members: number;

  max_members: number;

}



export interface ThesisGroup {

  id: number;

  group_name: string;

  thesis_round_id: number;

  group_type: GroupMode;

  status: Status;

  min_members: number;

  max_members: number;

  thesis_group_members?: ThesisGroupMember[];

}



export interface ThesisGroupMember {

  id: number;

  thesis_group_id: number;

  student_id: number;

  role: MemberRole;

  students?: {

    student_code: string;

    users: {

      full_name: string;

      email: string;

    };

    classes?: {

      class_name: string;

    };

  };

}



export interface CreateGroupInvitationRequest {

  thesis_group_id: number;

  invited_student_id: number;

  invitation_message?: string;

}



export interface GroupInvitation {

  id: number;

  thesis_group_id: number;

  invited_student_id: number;

  invited_by: number;

  invitation_message?: string;

  status: Status;

  thesis_groups?: {

    group_name: string;

  };

  students_invited_by?: {

    student_code: string;

    users: {

      full_name: string;

    };

  };

}



// Grading Types

export interface CreateReviewAssignmentRequest {

  thesis_id: number;

  reviewer_id: number;

  review_order: number;

  review_deadline: string;

}



export interface ReviewAssignment {

  id: number;

  thesis_id: number;

  reviewer_id: number;

  review_order: number;

  assignment_date: string;

  review_deadline: string;

  status: ReviewStatus;

}



export interface SubmitReviewResultRequest {

  review_assignment_id: number;

  review_content: string;

  topic_evaluation: string;

  result_evaluation: string;

  improvement_suggestions?: string;

  review_score: number;

  defense_approval: boolean;

  rejection_reason?: string;

  review_file?: string;

}



export interface ReviewResult {

  id: number;

  review_assignment_id: number;

  review_content: string;

  review_score: number;

  defense_approval: boolean;

  review_date: string;

}



export interface SubmitSupervisionCommentRequest {

  thesis_id: number;

  instructor_id: number;

  comment_content: string;

  attitude_evaluation?: string;

  capability_evaluation?: string;

  result_evaluation?: string;

  supervision_score: number;

  defense_approval: boolean;

  rejection_reason?: string;

}



export interface SupervisionComment {

  id: number;

  thesis_id: number;

  instructor_id: number;

  comment_content: string;

  supervision_score: number;

  defense_approval: boolean;

  comment_date: string;

}



export interface SubmitPeerEvaluationRequest {

  thesis_id: number;

  evaluator_id: number;

  evaluated_id: number;

  evaluation_round: number;

  teamwork_score: number;

  responsibility_score: number;

  technical_skill_score: number;

  communication_score: number;

  contribution_score: number;

  average_score: number;

  strengths?: string;

  weaknesses?: string;

  suggestions?: string;

  is_anonymous: boolean;

}



export interface PeerEvaluation {

  id: number;

  thesis_id: number;

  evaluator_id: number;

  evaluated_id: number;

  evaluation_round: number;

  average_score: number;

  evaluation_date: string;

}



export interface ReviewWeeklyReportRequest {

  instructor_feedback: string;

  review_score: number;

  review_status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';

}



export interface ThesisScores {

  thesis_id: number;

  supervision_score?: number;

  review_scores?: ReviewResult[];

  peer_evaluation_scores?: PeerEvaluation[];

  final_score?: number;

}



// Report Types

export interface CreateThesisTaskRequest {

  thesis_id: number;

  task_title: string;

  task_description?: string;

  assigned_to: number;

  due_date: string;

  priority: Priority;

  start_date: string;

  student_id: number;

  list_id?: number;

}



export interface UpdateThesisTaskRequest {

  status?: TaskStatus;

  progress_percentage?: number;

  notes?: string;

}



export interface ThesisTask {

  id: number;

  thesis_id: number;

  task_title: string;

  task_description?: string;

  assigned_to: number;

  due_date: string;

  priority: Priority;

  status: TaskStatus;

  progress_percentage: number;

}



export interface CreateWeeklyReportRequest {

  thesis_id: number;

  week_number: number;

  report_content: string;

  progress_percentage: number;

  challenges: string;

  next_plan: string;

  student_id: number;

}



export interface UpdateWeeklyReportRequest {

  report_content?: string;

  progress_percentage?: number;

  challenges?: string;

  next_plan?: string;

}



export interface WeeklyReport {

  id: number;

  thesis_id: number;

  week_number: number;

  report_date: string;

  work_completed: string;

  results_achieved: string;

  difficulties_encountered: string;

  next_week_plan: string;

  attachment_file?: string;

  submitted_by: number;

  student_status: 'SUBMITTED';

  instructor_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEED_CHANGES';

  instructor_feedback?: string;

  weekly_score?: number;

  feedback_date?: string;

  weekly_report_individual_contributions?: WeeklyReportIndividualContribution[];

}



export interface WeeklyReportIndividualContribution {

  id: number;

  weekly_report_id: number;

  student_id: number;

  individual_work: string;

  individual_results: string;

  hours_spent: number;

  self_evaluation: string;

  students?: {

    id: number;

    student_code: string;

    users: {

      id: number;

      full_name: string;

      email: string;

    };

  };

}



export interface AddContributionRequest {

  weekly_report_id: number;

  student_id: number;

  contribution_description: string;

  hours_spent: number;

  tasks_completed: string;

}



export interface WeeklyReportContribution {

  id: number;

  weekly_report_id: number;

  student_id: number;

  contribution_description: string;

  hours_spent: number;

  tasks_completed: string;

}



export interface SubmitWeeklyReportRequest {

  weekNumber: number;

  workCompleted: string;

  resultsAchieved: string;

  difficultiesEncountered: string;

  nextWeekPlan: string;

  attachmentFile?: string;

  studentId: number;

  contributions?: IndividualContribution[];

}



export interface IndividualContribution {

  studentId: number;

  individualWork: string;

  individualResults: string;

  hoursSpent: number;

  selfEvaluation: string;

}



export interface WeeklyReportFeedbackRequest {

  instructorStatus: 'APPROVED' | 'REJECTED' | 'NEED_CHANGES';

  instructorFeedback?: string;

  weeklyScore?: number;

}



export interface SubmitFinalReportRequest {

  final_report_file: string;

  outline_file: string;

  start_date: string;

  end_date: string;

}



export interface ThesisProgress {

  taskProgress: number;

  avgProgress: number;

  totalTasks: number;

  completedTasks: number;

  totalReports: number;

  submittedReports: number;

}



// Defense Types

export interface CreateDefenseCouncilRequest {

  council_code: string;

  council_name: string;

  thesis_round_id: number;

  chairman_id: number;

  secretary_id: number;

  defense_date: string;

  start_time: string;

  end_time: string;

  venue: string;

}



export interface DefenseCouncil {

  id: number;

  council_code: string;

  council_name: string;

  thesis_round_id: number;

  chairman_id: number;

  secretary_id: number;

  defense_date: string;

  start_time: string;

  end_time: string;

  venue: string;

  status: ReviewStatus;

}



export interface AddCouncilMemberRequest {

  instructor_id: number;

  role: CouncilRole;

  order_number: number;

}



export interface CouncilMember {

  id: number;

  defense_council_id: number;

  instructor_id: number;

  role: CouncilRole;

  order_number?: number;

}



export interface CouncilMemberWithInstructor extends CouncilMember {

  instructors?: {

    id: number;

    instructor_code: string;

    users?: {

      id: number;

      full_name: string;

      email: string;

    };

  };

}



export interface CreateDefenseAssignmentRequest {

  defense_council_id: number;

  thesis_id: number;

  defense_order: number;

  defense_time: string;

}



export interface DefenseAssignment {

  id: number;

  defense_council_id: number;

  thesis_id: number;

  defense_order: number;

  defense_time: string;

  status: ReviewStatus;

}



export interface SubmitDefenseResultRequest {

  defense_assignment_id: number;

  instructor_id: number;

  defense_score: number;

  comments?: string;

  suggestions?: string;

}



export interface DefenseResult {

  id: number;

  defense_assignment_id: number;

  instructor_id: number;

  defense_score: number;

  comments?: string;

  suggestions?: string;

  created_at: string;

}



export interface DefenseSchedule {

  thesis_id: number;

  defense_council?: {

    council_name: string;

    defense_date: string;

    start_time: string;

    end_time: string;

    venue: string;

  };

  defense_assignment?: {

    defense_order: number;

    defense_time: string;

    status: ReviewStatus;

  };

  council_members?: CouncilMember[];

}



export interface DefenseResults {

  thesis_id: number;

  defense_results: DefenseResult[];

  average_defense_score?: number;

}



// Error Response

export interface ErrorResponse {

  error: string;

}



// Generic API Response

export interface ApiResponse<T> {

  data?: T;

  error?: string;

}



// Standard API Response with success and message fields

export interface StandardResponse<T> {

  success: boolean;

  data: T;

  message: string;

}



// Instructor Grading Types

export interface SupervisionStudent {

  thesis_id: number;

  thesis_code: string;

  topic_title: string;

  thesis_round_id: number;

  status: string;

  is_graded: boolean;

  graded_date: string | null;

  supervision_score: number | null;

  members: SupervisionStudentMember[];

}



export interface SupervisionStudentMember {

  student_id: number;

  student_code: string;

  full_name: string;

  email: string;

  class_name: string;

  role: 'LEADER' | 'MEMBER';

}



export interface ReviewStudent {

  thesis_id: number;

  thesis_code: string;

  topic_title: string;

  thesis_round_id: number;

  status: string;

  supervisor: {

    instructor_id: number;

    instructor_code: string;

    full_name: string;

  };

  review_assignment_id: number;

  review_order: number;

  review_deadline: string;

  is_graded: boolean;

  graded_date: string | null;

  review_score: number | null;

  members: ReviewStudentMember[];

}



export interface ReviewStudentMember {

  student_id: number;

  student_code: string;

  full_name: string;

  email: string;

  class_name: string;

  role: 'LEADER' | 'MEMBER';

}



export interface SupervisionCommentRequest {

  thesis_id: number;

  comment_content: string;

  attitude_evaluation: string;

  capability_evaluation: string;

  result_evaluation: string;

  supervision_score: number;

  defense_approval: boolean;

  rejection_reason: string | null;

  instructor_id: number;

}



export interface SupervisionCommentResponse {

  id: number;

  thesis_id: number;

  instructor_id: number;

  comment_content: string;

  attitude_evaluation: string;

  capability_evaluation: string;

  result_evaluation: string;

  supervision_score: number;

  defense_approval: boolean;

  comment_date: string;

}



export interface ReviewResultRequest {

  review_assignment_id: number;

  review_content: string;

  topic_evaluation: string;

  result_evaluation: string;

  improvement_suggestions: string | null;

  review_score: number;

  defense_approval: boolean;

  rejection_reason: string | null;

  review_file: string | null;

  instructor_id: number;

}



export interface ReviewResultResponse {

  id: number;

  review_assignment_id: number;

  review_content: string;

  topic_evaluation: string;

  result_evaluation: string;

  improvement_suggestions: string | null;

  review_score: number;

  defense_approval: boolean;

  review_date: string;

}



export interface ThesisScoresResponse {

  id: number;

  thesis_code: string;

  topic_title: string;

  supervision_score: number | null;

  review_score: number | null;

  defense_score: number | null;

  status: string;

  review_assignments: ThesisScoreReviewAssignment[];

  supervision_comments: ThesisScoreSupervisionComment[];

}



export interface ThesisScoreReviewAssignment {

  id: number;

  review_order: number;

  status: string;

  review_results: {

    review_score: number;

  };

  instructors: {

    instructor_code: string;

    users: {

      full_name: string;

    };

  };

}



export interface ThesisScoreSupervisionComment {

  id: number;

  supervision_score: number;

  comment_date: string;

  instructors: {

    instructor_code: string;

    users: {

      full_name: string;

    };

  };

}



export interface WeeklyReportReviewRequest {

  instructor_feedback: string;

  review_score: number;

  review_status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';

  rejection_reason: string | null;

  instructor_id: number;

}



export interface WeeklyReportReviewResponse {

  id: number;

  instructor_feedback: string;

  review_score: number;

  review_status: string;

  reviewed_at: string;

}



// Council API Types

export interface CreateCouncilRequest {

  council_code: string;

  council_name: string;

  thesis_round_id: number;

  chairman_id: number;

  secretary_id?: number;

  defense_date?: string;

  start_time?: string;

  end_time?: string;

  venue?: string;

  notes?: string;

  members?: CouncilMemberRequest[];

}



export interface CouncilMemberRequest {

  instructor_id: number;

  role?: CouncilRole;

  order_number?: number;

}



export interface UpdateCouncilRequest {

  council_name?: string;

  secretary_id?: number;

  defense_date?: string;

  start_time?: string;

  end_time?: string;

  venue?: string;

  notes?: string;

  status?: CouncilStatus;

}



export interface Council {

  id: number;

  council_code: string;

  council_name: string;

  thesis_round_id: number;

  chairman_id: number;

  secretary_id?: number;

  defense_date?: string;

  start_time?: string;

  end_time?: string;

  venue?: string;

  status: CouncilStatus;

  notes?: string;

  created_at: string;

  updated_at: string;

  council_members?: CouncilMemberDetail[];

  instructors_defense_councils_chairman_idToinstructors?: InstructorDetail;

  instructors_defense_councils_secretary_idToinstructors?: InstructorDetail;

  thesis_rounds?: ThesisRoundDetail;

  defense_assignments?: DefenseAssignmentDetail[];

}



export interface CouncilMemberDetail {

  id: number;

  defense_council_id: number;

  instructor_id: number;

  role: CouncilRole;

  order_number?: number;

  created_at: string;

  instructors?: {

    id: number;

    instructor_code: string;

    users?: {

      id: number;

      full_name: string;

      email: string;

    };

  };

}



export interface InstructorDetail {

  id: number;

  instructor_code: string;

  users?: {

    id: number;

    full_name: string;

    email: string;

  };

}



export interface ThesisRoundDetail {

  id: number;

  round_code: string;

  round_name: string;

  start_date: string;

  end_date: string;

}



export interface DefenseAssignmentDetail {
  id: number;
  defense_council_id: number;
  thesis_id: number;
  defense_order?: number;
  defense_time?: string;
  status?: string;
  theses?: {
    id: number;
    thesis_code: string;
    topic_title: string;
    topic_description?: string;
    defense_score?: number;
    thesis_members?: ThesisMemberDetail[];
    instructors?: {
      id?: number;
      instructor_code?: string;
      users?: {
        id?: number;
        full_name?: string;
        email?: string;
      };
    };
  };
  defense_results?: Array<{
    id: number;
    defense_score?: number;
    comments?: string;
    suggestions?: string;
    instructors?: {
      id: number;
      instructor_code: string;
      users?: {
        full_name: string;
      };
    };
  }>;
}

export interface ThesisMemberDetail {
  id?: number;
  students?: {
    id?: number;
    student_code?: string;
    users?: {
      id?: number;
      full_name?: string;
      email?: string;
    };
  };
}




export interface DeleteCouncilResponse {

  message: string;

  data: Council;

}



// Student Service Types

export interface StudentInstructor {

  id: number;

  instructor_code: string;

  full_name: string;

  email: string;

  department_name?: string;

  degree?: string;

  academic_title?: string;

  specialization?: string;

  status: boolean;

}



export interface GetInstructorsParams {

  thesis_round_id?: number;

  department_id?: number;

  search?: string;

}



export interface StudentClass {

  id: number;

  class_code: string;

  class_name: string;

  department_id?: number;

  major_id?: number;

  status: boolean;

}



export interface StudentClassDetail extends StudentClass {

  department?: {

    id: number;

    department_code: string;

    department_name: string;

  };

  major?: {

    id: number;

    major_code: string;

    major_name: string;

  };

  students?: {

    id: number;

    student_code: string;

    users: {

      full_name: string;

      email: string;

    };

  }[];

}



export interface GetClassesParams {

  department_id?: number;

  major_id?: number;

}



// Admin Service Types

export interface Faculty {

  id: number;

  faculty_code: string;

  faculty_name: string;

  status: boolean;

  created_at: string;

  updated_at: string;

}



export interface CreateFacultyRequest {

  faculty_code: string;

  faculty_name: string;

  status?: boolean;

}



export interface UpdateFacultyRequest {

  faculty_code?: string;

  faculty_name?: string;

  status?: boolean;

}



export interface Department {

  id: number;

  department_code: string;

  department_name: string;

  faculty_id?: number;

  status: boolean;

  created_at: string;

  updated_at: string;

  faculties?: {

    id: number;

    faculty_code: string;

    faculty_name: string;

  };

}



export interface CreateDepartmentRequest {

  department_code: string;

  department_name: string;

  faculty_id?: number;

  status?: boolean;

}



export interface UpdateDepartmentRequest {

  department_code?: string;

  department_name?: string;

  faculty_id?: number;

  status?: boolean;

}



export interface Class {

  id: number;

  class_code: string;

  class_name: string;

  department_id?: number;

  major_id?: number;

  status: boolean;

  created_at: string;

  updated_at: string;

  departments?: {

    id: number;

    department_code: string;

    department_name: string;

  };

}



export interface CreateClassRequest {

  class_code: string;

  class_name: string;

  department_id?: number;

  major_id?: number;

  status?: boolean;

}



export interface UpdateClassRequest {

  class_code?: string;

  class_name?: string;

  department_id?: number;

  major_id?: number;

  status?: boolean;

}



export interface UserManagement {

  id: number;

  email: string;

  full_name: string;

  phone?: string;

  avatar?: string;

  role: UserRole;

  status: boolean;

  created_at: string;

  updated_at: string;

  students?: {

    id: number;

    student_code: string;

  };

  instructors?: {

    id: number;

    instructor_code: string;

  };

}



export interface CreateUserRequest {

  email: string;

  password: string;

  full_name: string;

  phone?: string;

  avatar?: string;

  role: UserRole;

  status?: boolean;

}



export interface UpdateUserRequest {

  email?: string;

  full_name?: string;

  phone?: string;

  avatar?: string;

  role?: UserRole;

  status?: boolean;

}



export interface CreateStudentRequest {

  student_code: string;

  class_id: number;

  major_id: number;

  gpa?: number;

  credits_earned?: number;

  username: string;

  password: string;

  email: string;

  full_name: string;

  phone?: string;

}



export interface CreateInstructorRequest {

  instructor_code: string;

  department_id: number;

  degree: string;

  academic_title: string;

  specialization: string;

  years_of_experience: number;

  username: string;

  password: string;

  email: string;

  full_name: string;

  phone?: string;
}

export interface ReviewScheduleItemData {
  id: number;
  thesisId: number;
  thesisCode: string;
  thesisTitle: string;
  groupName: string;
  students: string[];
  supervisor: string;
  supervisorId?: number;
  reviewer1: string;
  reviewer1Id?: number;
  reviewer2?: string;
  reviewer2Id?: number;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  status: 'NOT_SCHEDULED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  hasSchedule?: boolean;
  reviewScore1?: number;
  reviewScore2?: number;
  notes?: string;
}

export interface AutoScheduleReviewsRequest {
  thesisRoundId: number;
  scheduledDate: string;
  location: string;
  startHour?: number;
  durationMinutes?: number;
}

// ─── 1. Grade Review Types ──────────────────────────────────────────────────
export type GradeReviewType = 'SUPERVISION' | 'REVIEWER' | 'DEFENSE' | 'FINAL';
export type GradeReviewStatus = 'PENDING' | 'ASSIGNED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface GradeReview {
  id: number;
  thesis_id: number;
  student_id: number;
  review_type: GradeReviewType;
  original_score: number;
  desired_score?: number;
  reason: string;
  attachment_file?: string;
  reassigned_instructor_id?: number;
  reassessed_score?: number;
  reassessment_notes?: string;
  status: GradeReviewStatus;
  head_feedback?: string;
  head_id?: number;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  theses?: {
    id: number;
    topic_title: string;
    thesis_code: string;
    final_report_file?: string;
  };
  students?: {
    id: number;
    student_code: string;
    users?: { full_name: string; email: string; phone?: string };
    classes?: { class_name: string };
  };
  instructors?: {
    id: number;
    users?: { full_name: string; email: string };
  };
}

export interface CreateGradeReviewRequest {
  thesis_id: number;
  review_type: GradeReviewType;
  original_score: number;
  desired_score?: number;
  reason: string;
  attachment_file?: File;
}

// ─── 2. Official Documents & Repository Types ───────────────────────────────
export type DocumentCategory = 'TEMPLATE' | 'REGULATION' | 'GUIDE' | 'FORM';

export interface OfficialDocument {
  id: number;
  category: DocumentCategory;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  department_id?: number;
  faculty_id?: number;
  downloads_count: number;
  uploaded_by: number;
  created_at: string;
}

export interface DigitalRepositoryItem {
  id: number;
  thesis_id?: number;
  topic_title: string;
  abstract: string;
  keywords?: string;
  authors: string;
  supervisors: string;
  academic_year: string;
  semester?: number;
  department_id?: number;
  faculty_id?: number;
  final_score?: number;
  grade?: string;
  report_file_url?: string;
  slide_file_url?: string;
  source_code_url?: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
}

// ─── 3. Survey Types ────────────────────────────────────────────────────────
export type SurveyQuestionType = 'RATING_1_5' | 'RATING_1_10' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';

export interface SurveyQuestion {
  id: number;
  survey_id: number;
  question_text: string;
  question_type: SurveyQuestionType;
  options?: any;
  is_required: boolean;
  order_index: number;
}

export interface Survey {
  id: number;
  title: string;
  description?: string;
  thesis_round_id?: number;
  target_role: string;
  is_anonymous: boolean;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  thesis_rounds?: { id: number; round_name: string };
  survey_questions?: SurveyQuestion[];
  hasSubmitted?: boolean;
  _count?: { survey_questions: number; survey_responses: number };
}

export interface SurveyAnalyticsItem {
  id: number;
  question_text: string;
  question_type: SurveyQuestionType;
  total_answers: number;
  avg_rating?: number;
  rating_distribution: Record<number, number>;
  text_responses: string[];
}

export interface SurveyAnalyticsData {
  survey: {
    id: number;
    title: string;
    description?: string;
    total_responses: number;
  };
  analytics: SurveyAnalyticsItem[];
}

// ─── 4. Academic Ticket Types ───────────────────────────────────────────────
export type TicketRequestType = 'CHANGE_TOPIC_TITLE' | 'EXTEND_DEADLINE' | 'LEAVE_GROUP' | 'POSTPONE_DEFENSE' | 'OTHER';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface AcademicTicket {
  id: number;
  ticket_code: string;
  thesis_id?: number;
  student_id: number;
  request_type: TicketRequestType;
  title: string;
  content: string;
  attachment_file?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: number;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  theses?: {
    id: number;
    topic_title: string;
    thesis_code: string;
  };
  students?: {
    id: number;
    student_code: string;
    users?: { full_name: string; email: string; phone?: string };
    classes?: { class_name: string };
  };
  conversations?: Array<{
    id: number;
    conversation_name: string;
  }>;
}

export interface CreateTicketRequest {
  thesis_id?: number;
  request_type: TicketRequestType;
  title: string;
  content: string;
  priority?: TicketPriority;
  attachment_file?: File;
}

// ─── 5. Announcement Types ─────────────────────────────────────────────────
export interface AnnouncementAttachment {
  id: number;
  announcement_id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
}

export interface Announcement {
  id: number;
  thesis_round_id?: number;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  thumbnail_url?: string;
  author_id: number;
  target_roles?: string[];
  is_pinned: boolean;
  is_published: boolean;
  views_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  thesis_rounds?: { round_name: string };
  announcement_attachments?: AnnouncementAttachment[];
}


