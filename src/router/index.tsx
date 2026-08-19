import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from '@/views/Auth/Login';
import { StudentDashboard } from '@/views/Student/Dashboard/StudentDashboard';
import { InstructorDashboard } from '@/views/Instructor/Dashboard/InstructorDashboard';
import { HeadDashboard } from '@/views/Head/Dashboard/HeadDashboard';
import { AdminDashboard } from '@/views/Admin/Dashboard/AdminDashboard';
import { AdminOrganizationManagement } from '@/views/Admin/Organization/AdminOrganizationManagement';
import { AdminUserManagement } from '@/views/Admin/Users/AdminUserManagement';
import { PolicyManagement } from '@/views/Admin/Policies/PolicyManagement';
import { GroupManagement } from '@/views/Student/Groups/GroupManagement';
import { TopicRegistration } from '@/views/Student/TopicRegistration/TopicRegistration';
import { HeadApproveTopics } from '@/views/Head/ApproveTopics/HeadApproveTopics';
import { DefenseCouncils } from '@/views/Head/DefenseCouncils/DefenseCouncils';
import { SystemSettings } from '@/views/Admin/Settings/SystemSettings';
import { HeadReports } from '@/views/Head/Reports/HeadReports';
import { HeadMessages } from '@/views/Head/Messages/HeadMessages';
import { HeadAssignInstructors } from '@/views/Head/AssignInstructors/HeadAssignInstructors';
import { HeadAssignReviewers } from '@/views/Head/AssignReviewers/HeadAssignReviewers';
import { HeadReviewSchedule } from '@/views/Head/ReviewSchedule/HeadReviewSchedule';
import { HeadGradingTemplates } from '@/views/Head/GradingTemplates/HeadGradingTemplates';
import { ThesisRounds } from '@/views/Head/ThesisRounds/ThesisRounds';
import { Messages } from '@/views/Shared/Messages/Messages';
import { TimelinePage } from '@/views/Student/Timeline/TimelinePage';
import { WeeklyReports } from '@/views/Student/Reports/WeeklyReports';
import { Scores } from '@/views/Student/Scores/Scores';
import { MyTopics } from '@/views/Instructor/MyTopics/MyTopic';
import { MyStudents } from '@/views/Instructor/Students/MyStudents';
import { InstructorReports } from '@/views/Instructor/Reports/InstructorReports';
import { InstructorAllReports } from '@/views/Instructor/Reports/InstructorAllReports';
import { InstructorGrading } from '@/views/Instructor/Grading/InstructorGrading';
import { ReviewSchedule } from '@/views/Instructor/ReviewSchedule/ReviewSchedule';
import { Courses } from '@/views/Student/Courses/Courses';
import { InstructorCourse } from '@/views/Instructor/Courses/InstructorCourse';
import { ManageCourses } from '@/views/Head/ManageCourses/ManageCourses';

// 6 New Integrated Modules
import { OfficialDocuments } from '@/views/Shared/Documents/OfficialDocuments';
import { DigitalRepository } from '@/views/Shared/Repository/DigitalRepository';
import { AnnouncementsFeed } from '@/views/Shared/Announcements/AnnouncementsFeed';
import { AnnouncementDetail } from '@/views/Shared/Announcements/AnnouncementDetail';
import { AdminAnnouncements } from '@/views/Admin/Announcements/AdminAnnouncements';
import { StudentAcademicRequests } from '@/views/Student/Requests/StudentAcademicRequests';
import { HeadAcademicRequests } from '@/views/Head/Requests/HeadAcademicRequests';
import { HeadGradeReviews } from '@/views/Head/GradeReviews/HeadGradeReviews';
import { InstructorGradeReviews } from '@/views/Instructor/GradeReviews/InstructorGradeReviews';
import { SurveysList } from '@/views/Shared/Surveys/SurveysList';
import { HeadSurveys } from '@/views/Head/Surveys/HeadSurveys';



export function ProtectedRoute({ 
  children, 
  requiredRoles,
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredRoles?: any;
  requiredPermission?: string;
}) {
  const { isAuthenticated, isLoading, canAccess, hasPermission } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRoles && !canAccess(requiredRoles)) return <Navigate to="/dashboard" replace />;
  if (requiredPermission && !hasPermission(requiredPermission)) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

export function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  const role = (user?.role || 'student').toLowerCase();
  const isStudent = role === 'student';
  const isInstructor = role === 'instructor';
  const isHead = role === 'head' || role === 'department_head';
  const isAdmin = role === 'admin';

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute>{isStudent && <StudentDashboard />}{isInstructor && <InstructorDashboard />}{isHead && <HeadDashboard />}{isAdmin && <AdminDashboard />}</ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute>{isStudent && <GroupManagement />}</ProtectedRoute>} />
      <Route path="/topic-registration" element={<ProtectedRoute>{isStudent && <TopicRegistration />}</ProtectedRoute>} />
      <Route path="/timeline" element={<ProtectedRoute>{isStudent && <TimelinePage />}</ProtectedRoute>} />
      <Route path="/rounds" element={<ProtectedRoute>{(isHead || isAdmin) && <ThesisRounds />}</ProtectedRoute>} />
      <Route path="/assign-instructors" element={<ProtectedRoute>{(isHead || isAdmin) && <HeadAssignInstructors />}</ProtectedRoute>} />
      <Route path="/assign-reviewers" element={<ProtectedRoute>{(isHead || isAdmin) && <HeadAssignReviewers />}</ProtectedRoute>} />
      <Route path="/review-schedule" element={<ProtectedRoute>{(isHead || isAdmin) && <HeadReviewSchedule />}</ProtectedRoute>} />
      <Route path="/grading-templates" element={<ProtectedRoute>{(isHead || isAdmin) && <HeadGradingTemplates />}</ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute>{isStudent && <Messages />}{isHead && <HeadMessages />}{isInstructor && <Messages />}{isAdmin && <HeadMessages />}</ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute>{isStudent && <WeeklyReports />}{isInstructor && <InstructorAllReports />}{(isHead || isAdmin) && <HeadReports />}</ProtectedRoute>} />
      <Route path="/scores" element={<ProtectedRoute>{isStudent && <Scores />}</ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute>{isStudent && <Courses />}</ProtectedRoute>} />
      <Route path="/my-topics" element={<ProtectedRoute>{isInstructor && <MyTopics />}</ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute>{isInstructor && <MyStudents />}</ProtectedRoute>} />
      <Route path="/students/:thesisId/reports" element={<ProtectedRoute>{isInstructor && <InstructorReports />}</ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute>{isInstructor && <ReviewSchedule />}</ProtectedRoute>} />
      <Route path="/grading" element={<ProtectedRoute>{isInstructor && <InstructorGrading />}</ProtectedRoute>} />
      <Route path="/instructor-courses" element={<ProtectedRoute>{isInstructor && <InstructorCourse />}</ProtectedRoute>} />
      <Route path="/approve-topics" element={<ProtectedRoute>{(isHead || isAdmin) && <HeadApproveTopics />}</ProtectedRoute>} />
      <Route path="/councils" element={<ProtectedRoute>{(isHead || isAdmin) && <DefenseCouncils />}</ProtectedRoute>} />
      <Route path="/manage-courses" element={<ProtectedRoute>{(isHead || isAdmin) && <ManageCourses />}</ProtectedRoute>} />
      <Route path="/organization" element={<ProtectedRoute>{isAdmin && <AdminOrganizationManagement />}</ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute>{isAdmin && <AdminUserManagement />}</ProtectedRoute>} />
      <Route path="/policies" element={<ProtectedRoute>{isAdmin && <PolicyManagement />}</ProtectedRoute>} />
      <Route path="/admin/policies" element={<ProtectedRoute>{isAdmin && <PolicyManagement />}</ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute>{isAdmin && <SystemSettings />}</ProtectedRoute>} />

      {/* 6 New Module Routes */}
      <Route path="/documents" element={<ProtectedRoute><OfficialDocuments /></ProtectedRoute>} />
      <Route path="/repository" element={<ProtectedRoute><DigitalRepository /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><AnnouncementsFeed /></ProtectedRoute>} />
      <Route path="/announcements/:id" element={<ProtectedRoute><AnnouncementDetail /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute>{(isHead || isAdmin) && <AdminAnnouncements />}</ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute>{isStudent ? <StudentAcademicRequests /> : <HeadAcademicRequests />}</ProtectedRoute>} />
      <Route path="/grade-reviews" element={<ProtectedRoute>{(isHead || isAdmin) ? <HeadGradeReviews /> : isInstructor ? <InstructorGradeReviews /> : <Scores />}</ProtectedRoute>} />
      <Route path="/surveys" element={<ProtectedRoute>{(isHead || isAdmin) ? <HeadSurveys /> : <SurveysList />}</ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
