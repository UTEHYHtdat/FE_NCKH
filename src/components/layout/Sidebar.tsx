import { 
  Home, FileText, Users, ClipboardList, MessageSquare, Settings, 
  BookOpen, CheckSquare, Shield, UserPlus, GraduationCap, Clock, 
  Library, Bell, FileCheck, BookmarkCheck, HelpCircle, LifeBuoy, AlertCircle, KeyRound 
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { cn } from '@/utils/cn';

interface SidebarProps {
  userRole?: 'student' | 'instructor' | 'head' | 'department_head' | 'admin';
  userName?: string;
  userAvatar?: string;
}

const menuItems = {
  student: [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Bell, label: 'Bảng tin', path: '/announcements' },
    { icon: Clock, label: 'Timeline', path: '/timeline' },
    { icon: Users, label: 'Nhóm của tôi', path: '/groups' },
    { icon: FileText, label: 'Đề tài', path: '/topic-registration' },
    { icon: ClipboardList, label: 'Báo cáo tuần', path: '/reports' },
    { icon: BookOpen, label: 'Điểm số', path: '/scores' },
    { icon: LifeBuoy, label: 'Yêu cầu học vụ', path: '/requests' },
    { icon: FileCheck, label: 'Kho biểu mẫu', path: '/documents' },
    { icon: BookmarkCheck, label: 'Thư viện số', path: '/repository' },
    { icon: HelpCircle, label: 'Khảo sát', path: '/surveys' },
    { icon: Library, label: 'Khóa học', path: '/courses' },
    { icon: MessageSquare, label: 'Tin nhắn', path: '/messages' },
  ],
  instructor: [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Bell, label: 'Bảng tin', path: '/announcements' },
    { icon: FileText, label: 'Đề tài của tôi', path: '/my-topics' },
    { icon: Users, label: 'Sinh viên hướng dẫn', path: '/students' },
    { icon: GraduationCap, label: 'Chấm điểm', path: '/grading' },
    { icon: AlertCircle, label: 'Chấm phúc khảo', path: '/grade-reviews' },
    { icon: ClipboardList, label: 'Báo cáo', path: '/reports' },
    { icon: CheckSquare, label: 'Lịch phản biện', path: '/reviews' },
    { icon: FileCheck, label: 'Kho biểu mẫu', path: '/documents' },
    { icon: BookmarkCheck, label: 'Thư viện số', path: '/repository' },
    { icon: HelpCircle, label: 'Khảo sát', path: '/surveys' },
    { icon: Library, label: 'Khóa học', path: '/instructor-courses' },
    { icon: MessageSquare, label: 'Tin nhắn', path: '/messages' },
  ],
  head: [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Bell, label: 'Bảng tin', path: '/announcements' },
    { icon: BookOpen, label: 'Đợt khóa luận', path: '/rounds' },
    { icon: UserPlus, label: 'Phân công giáo viên', path: '/assign-instructors' },
    { icon: FileText, label: 'Duyệt đề tài', path: '/approve-topics' },
    { icon: Clock, label: 'Lịch phản biện', path: '/review-schedule' },
    { icon: Shield, label: 'Hội đồng', path: '/councils' },
    { icon: AlertCircle, label: 'Duyệt phúc khảo', path: '/grade-reviews' },
    { icon: LifeBuoy, label: 'Yêu cầu học vụ', path: '/requests' },
    { icon: HelpCircle, label: 'Khảo sát chất lượng', path: '/surveys' },
    { icon: FileCheck, label: 'Kho biểu mẫu', path: '/documents' },
    { icon: BookmarkCheck, label: 'Thư viện số', path: '/repository' },
    { icon: FileText, label: 'Tạo form mẫu', path: '/grading-templates' },
    { icon: Library, label: 'Quản lý khóa học', path: '/manage-courses' },
    { icon: ClipboardList, label: 'Báo cáo', path: '/reports' },
    { icon: MessageSquare, label: 'Tin nhắn', path: '/messages' },
  ],
  admin: [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Bell, label: 'Quản lý thông báo', path: '/admin/announcements' },
    { icon: Shield, label: 'Tổ chức', path: '/organization' },
    { icon: Users, label: 'Người dùng', path: '/users' },
    { icon: KeyRound, label: 'Phân quyền vai trò', path: '/policies' },
    { icon: FileCheck, label: 'Kho biểu mẫu', path: '/documents' },
    { icon: BookmarkCheck, label: 'Thư viện số', path: '/repository' },
    { icon: Settings, label: 'Cấu hình hệ thống', path: '/settings' },
  ],
};

export function Sidebar({ userRole = 'student', userName = 'Nguyễn Văn A', userAvatar }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const roleKey = userRole === 'department_head' ? 'head' : userRole;
  const items = menuItems[roleKey] || menuItems['student'];

  return (
    <div className="w-60 h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <Link to="/dashboard" className="p-6 border-b border-sidebar-border block">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>ThesisHub</h1>
            <p className="text-xs text-sidebar-accent-foreground">Quản lý khóa luận</p>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
