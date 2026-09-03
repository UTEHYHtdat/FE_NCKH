import { ReactNode, useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Avatar } from '../ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

import type { UserRole } from '@/types/api';

interface PageLayoutProps {
  children: ReactNode;
  userRole?: UserRole;
  userName?: string;
  userAvatar?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageLayout({
  children,
  userRole: propUserRole,
  userName: propUserName,
  userAvatar: propUserAvatar,
  title,
  subtitle,
  actions,
}: PageLayoutProps) {
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userRole = user?.role || propUserRole || 'student';
  const userName = user?.fullName || (user as any)?.full_name || (user as any)?.username || propUserName || 'Người dùng';
  const userAvatar = propUserAvatar || (user as any)?.avatar;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row w-full overflow-x-hidden">
      {/* Sidebar Responsive */}
      <Sidebar
        userRole={userRole}
        userName={userName}
        userAvatar={userAvatar}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 lg:ml-60 flex flex-col min-h-screen w-full">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger Button for Mobile/Tablet */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-1 rounded-lg text-foreground hover:bg-muted lg:hidden flex-shrink-0 transition-colors"
                aria-label="Mở menu điều hướng"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                {title && (
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {actions && <div className="flex items-center gap-2">{actions}</div>}
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              
              <div className="relative group flex items-center gap-2 cursor-pointer py-1">
                <Avatar src={userAvatar} name={userName || 'User'} size="sm" />
                <div className="hidden md:block text-left">
                  <p className="text-xs sm:text-sm font-medium leading-none mb-1 max-w-[140px] truncate">{userName}</p>
                  <p className="text-[11px] text-muted-foreground leading-none">
                    {userRole === 'student' && 'Sinh viên'}
                    {userRole === 'instructor' && 'Giảng viên'}
                    {(userRole === 'head' || userRole === 'department_head') && 'Trưởng bộ môn'}
                    {userRole === 'admin' && 'Quản trị viên'}
                    {userRole === 'academic_affairs' && 'Giáo vụ / Đào tạo'}
                  </p>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-muted transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
