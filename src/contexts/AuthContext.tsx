import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/plugins/api';
import type { User, Profile, LoginRequest, UserRole } from '@/types/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole;
  policies: string[];
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (requiredRoles: UserRole | UserRole[]) => boolean;
}

// Default fallback role permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  student: [
    'view_dashboard',
    'view-dashboard',
    'view_groups',
    'view-group-list',
    'register_topic',
    'register-topic',
    'submit_reports',
    'submit-weekly-report',
    'view_scores',
    'view-final-grades',
    'send_messages',
    'send-messages',
  ],
  instructor: [
    'view_dashboard',
    'view-dashboard',
    'manage_topics',
    'view-topic-list',
    'create-topic',
    'update-topic',
    'approve-topic-instructor',
    'view_students',
    'view-students',
    'review_thesis',
    'evaluate-weekly-report',
    'enter-defense-score',
    'enter-review-score',
    'send_messages',
    'send-messages',
  ],
  head: [
    'view_dashboard',
    'view-dashboard',
    'view-statistical',
    'manage_rounds',
    'view-round-list',
    'create-round',
    'update-round',
    'config-round-rules',
    'approve_topics',
    'approve-topic-head',
    'manage_councils',
    'view-council-list',
    'create-council',
    'update-council',
    'assign-council-members',
    'assign-thesis-defense',
    'view_reports',
    'view-weekly-reports',
    'manage-guidance-process',
    'send_messages',
    'send-messages',
  ],
  department_head: [
    'view_dashboard',
    'view-dashboard',
    'view-statistical',
    'manage_rounds',
    'view-round-list',
    'create-round',
    'update-round',
    'config-round-rules',
    'approve_topics',
    'approve-topic-head',
    'manage_councils',
    'view-council-list',
    'create-council',
    'update-council',
    'assign-council-members',
    'assign-thesis-defense',
    'view_reports',
    'view-weekly-reports',
    'manage-guidance-process',
    'send_messages',
    'send-messages',
  ],
  admin: [
    'view_dashboard',
    'view-dashboard',
    'view-statistical',
    'manage-roles',
    'system_settings',
    'system-settings',
    'full_access',
    'send_messages',
    'send-messages',
  ],
  academic_affairs: [
    'view_dashboard',
    'view-dashboard',
    'view-statistical',
    'manage_organization',
    'view-faculties',
    'manage-faculties',
    'view-departments',
    'manage-departments',
    'view-classes',
    'manage-classes',
    'view-students',
    'manage-students',
    'view-instructors',
    'manage-instructors',
    'manage_users',
    'manage-users',
    'view-documents',
    'view-repository',
    'view-round-list',
    'send_messages',
    'send-messages',
  ],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [policies, setPolicies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userRole: UserRole = user?.role || 'student';

  useEffect(() => {
    // Check for stored user and policies on mount
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getToken();
    const storedPoliciesStr = localStorage.getItem('policies');
    
    if (storedUser && storedToken) {
      const normalizedUser = {
        ...storedUser,
        fullName: (storedUser as any).full_name || (storedUser as any).fullName || storedUser.username,
        role: storedUser.role.toLowerCase() as UserRole,
      };
      setUser(normalizedUser);

      if (storedPoliciesStr) {
        try {
          const parsed = JSON.parse(storedPoliciesStr);
          if (Array.isArray(parsed)) {
            setPolicies(parsed);
          }
        } catch (e) {
          console.error('Error parsing stored policies:', e);
        }
      } else if (normalizedUser.policies && Array.isArray(normalizedUser.policies)) {
        setPolicies(normalizedUser.policies);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    console.log('Login response user:', response.user);
    console.log('User role:', response.user?.role);
    
    // Extract dynamic policies
    const userPolicies = response.policies || response.user?.policies || [];
    setPolicies(userPolicies);
    localStorage.setItem('policies', JSON.stringify(userPolicies));

    // Convert role to lowercase to handle backend returning uppercase roles
    // Map full_name to fullName
    const normalizedUser = response.user ? {
      ...response.user,
      fullName: (response.user as any).full_name || (response.user as any).fullName || response.user.username,
      role: response.user.role.toLowerCase() as UserRole,
      policies: userPolicies,
    } : null;
    
    // Validate role
    if (normalizedUser?.role && !ROLE_PERMISSIONS[normalizedUser.role]) {
      throw new Error(`Invalid role: ${normalizedUser.role}`);
    }
    
    setUser(normalizedUser);
    await refreshProfile();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setProfile(null);
      setPolicies([]);
      localStorage.removeItem('policies');
    }
  };

  const refreshProfile = async () => {
    try {
      if (!user?.id) {
        console.error('User ID is missing');
        return;
      }
      const role = user.role === 'instructor' ? 'instructor' : 'student';
      const profileData = await authService.getProfile(user.id, role);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  };

  // Check if user has specific role(s)
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user?.role) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    return rolesArray.some(r => userRoles.includes(r) ||
      (r === 'department_head' && userRoles.includes('head')) ||
      (r === 'head' && userRoles.includes('department_head'))
    );
  };

  // Check if user has specific permission / policy code
  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;

    // Super admin hoặc full_access luôn có quyền
    if (user.role === 'admin' || policies.includes('full_access')) {
      return true;
    }

    // 1. Kiểm tra chính sách động trong DB trước
    const normalizedTarget = permission.toLowerCase();
    const normalizedWithDash = normalizedTarget.replace(/_/g, '-');
    const normalizedWithUnderscore = normalizedTarget.replace(/-/g, '_');

    const inDynamicPolicies = policies.some(p => {
      const pLower = p.toLowerCase();
      return pLower === normalizedTarget || pLower === normalizedWithDash || pLower === normalizedWithUnderscore;
    });

    if (inDynamicPolicies) {
      return true;
    }

    // 2. Fallback kiểm tra trong bảng map tĩnh
    const fallbackPerms = ROLE_PERMISSIONS[user.role] || [];
    return fallbackPerms.includes(permission) || fallbackPerms.includes(normalizedWithDash) || fallbackPerms.includes(normalizedWithUnderscore);
  };

  // Check if user can access based on required roles
  const canAccess = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!user?.role) return false;
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    return rolesArray.some(r => userRoles.includes(r) ||
      (r === 'department_head' && userRoles.includes('head')) ||
      (r === 'head' && userRoles.includes('department_head'))
    );
  };

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: authService.isAuthenticated(),
    isLoading,
    userRole,
    policies,
    login,
    logout,
    refreshProfile,
    hasRole,
    hasPermission,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

