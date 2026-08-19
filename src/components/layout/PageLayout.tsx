import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Avatar } from '../ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface PageLayoutProps {
  children: ReactNode;
  userRole?: 'student' | 'instructor' | 'head' | 'department_head' | 'admin';
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

  const userRole = propUserRole || user?.role || 'student';
  const userName = propUserName || user?.fullName || (user as any)?.username || (user as any)?.full_name || 'Quản trị viên';
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
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userRole={userRole}
        userName={userName}
        userAvatar={userAvatar}
      />

      <div className="flex-1 ml-60">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {actions && <div className="flex items-center gap-3">{actions}</div>}
              <div className="h-8 w-px bg-border hidden sm:block"></div>
              
              <div className="relative group flex items-center gap-2 cursor-pointer pb-2">
                <Avatar src={userAvatar} name={userName || 'User'} size="sm" />
                <div className="hidden md:block">
                  <p className="text-sm font-medium leading-none mb-1">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {userRole === 'student' && 'Sinh viên'}
                    {userRole === 'instructor' && 'Giảng viên'}
                    {(userRole === 'head' || userRole === 'department_head') && 'Trưởng bộ môn'}
                    {userRole === 'admin' && 'Quản trị viên'}
                  </p>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-0 w-48 py-1 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-muted transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
