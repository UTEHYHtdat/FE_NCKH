import { 
  Home, FileText, Users, ClipboardList, MessageSquare, Settings, 
  BookOpen, CheckSquare, Shield, UserPlus, GraduationCap, Clock, 
  Library, Bell, FileCheck, BookmarkCheck, HelpCircle, LifeBuoy, AlertCircle, KeyRound, Building2, X, School 
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/utils/cn';

interface SidebarProps {
  userRole?: 'student' | 'instructor' | 'head' | 'department_head' | 'admin' | 'academic_affairs';
  userName?: string;
  userAvatar?: string;
  isOpen?: boolean;
  onClose?: () => void;
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
    { icon: KeyRound, label: 'Phân quyền vai trò', path: '/policies' },
    { icon: Settings, label: 'Cấu hình hệ thống', path: '/settings' },
    { icon: MessageSquare, label: 'Tin nhắn & Hỗ trợ', path: '/messages' },
  ],
  academic_affairs: [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Bell, label: 'Thông báo học vụ', path: '/admin/announcements' },
    { icon: Building2, label: 'Tổ chức đào tạo', path: '/organization' },
    { icon: GraduationCap, label: 'Quản lý Sinh viên', path: '/academic/students' },
    { icon: School, label: 'Quản lý Lớp học', path: '/academic/classes' },
    { icon: Users, label: 'Quản lý Giảng viên', path: '/academic/instructors' },
    { icon: Clock, label: 'Lịch phản biện', path: '/review-schedule' },
    { icon: Shield, label: 'Lịch bảo vệ khóa luận', path: '/councils' },
    { icon: FileCheck, label: 'Kho biểu mẫu', path: '/documents' },
    { icon: BookmarkCheck, label: 'Thư viện số', path: '/repository' },
    { icon: MessageSquare, label: 'Tin nhắn', path: '/messages' },
  ],
};

export function Sidebar({ 
  userRole = 'student', 
  userName = 'Nguyễn Văn A', 
  userAvatar,
  isOpen = false,
  onClose
}: SidebarProps) {
  const location = useLocation();
  const roleKey = userRole === 'department_head' ? 'head' : userRole;
  const items = menuItems[roleKey] || menuItems['student'];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "w-60 h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-sidebar-border",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Logo & Close Button */}
        <div className="p-4 sm:p-5 border-b border-sidebar-border flex items-center justify-between">
          <Link 
            to="/dashboard" 
            onClick={onClose}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="w-9 h-9 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate" style={{ fontFamily: 'var(--font-heading)' }}>ThesisHub</h1>
              <p className="text-[11px] text-sidebar-accent-foreground truncate">Quản lý khóa luận</p>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent lg:hidden transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
