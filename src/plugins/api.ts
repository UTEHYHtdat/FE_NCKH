import axios from "./axios";
import qs from "qs";

const filterObject = (obj: any) => {
  const filtered: any = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
      filtered[key] = obj[key];
    }
  }
  return filtered;
};

export const APIHelper = (api: string) => ({
  search: (params: any, option?: any) =>
    axios.get(api, { params: filterObject(params), ...option }),
  count: (params: any, option?: any) =>
    axios.get(api + "count", { params: filterObject(params), ...option }),
  fetch: (params: any, option?: any) =>
    axios.get(api, { params: filterObject(params), ...option }),
  fetchOne: (id: string | number, option?: any) => axios.get(api + id, option),
  create: (params: any, options?: any) =>
    axios.post(api, filterObject(params), options),
  update: (id: string | number, params: any, option?: any) =>
    axios.put(api + id, params, option),
  remove: (id: string | number, option?: any) => axios.delete(api + id, option),
  fetchRaw: (params: any) => axios.get(api, { params }),

  qsFetch: (params: any) => {
    const query = qs.stringify(filterObject(params));
    return axios.get(`${api}?${query}`);
  },
});

export const APIRespository = APIHelper;

// ==============================================
// LEGACY API CLIENT & SERVICES
// ==============================================

class ApiError extends Error {
  status: number;
  response?: any;
  statusText?: string;

  constructor(
    message: string,
    status: number,
    response?: any,
    statusText?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
    this.statusText = statusText;
  }
}

class ApiClient {
  private async handleRequest<T>(request: Promise<any>): Promise<T> {
    try {
      const response = await request;
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMessage =
          errorData?.error ||
          errorData?.message ||
          `HTTP error! status: ${error.response.status}`;
        throw new ApiError(
          errorMessage,
          error.response.status,
          errorData,
          error.response.statusText,
        );
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.handleRequest<T>(axios.get(endpoint));
  }

  async post<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true,
    customHeaders?: HeadersInit,
  ): Promise<T> {
    return this.handleRequest<T>(axios.post(endpoint, data));
  }

  async put<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true,
  ): Promise<T> {
    return this.handleRequest<T>(axios.put(endpoint, data));
  }

  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.handleRequest<T>(axios.delete(endpoint));
  }
}

export const apiClient = new ApiClient();

// --- adminService.ts ---
import type {
  Faculty,
  CreateFacultyRequest,
  UpdateFacultyRequest,
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  Class,
  CreateClassRequest,
  UpdateClassRequest,
  UserManagement,
  CreateUserRequest,
  UpdateUserRequest,
  CreateStudentRequest,
  CreateInstructorRequest,
} from "@/types/api";

export const adminService = {
  // Faculty Management
  /**
   * Get all faculties
   * GET /api/admin/faculties
   */
  async getFaculties(): Promise<Faculty[]> {
    return apiClient.get<Faculty[]>("/api/admin/faculties");
  },

  /**
   * Get faculty by ID
   * GET /api/admin/faculties/:id
   */
  async getFacultyById(id: number): Promise<Faculty> {
    return apiClient.get<Faculty>(`/api/admin/faculties/${id}`);
  },

  /**
   * Create faculty
   * POST /api/admin/faculties
   */
  async createFaculty(data: CreateFacultyRequest): Promise<Faculty> {
    return apiClient.post<Faculty>("/api/admin/faculties", data);
  },

  /**
   * Update faculty
   * PUT /api/admin/faculties/:id
   */
  async updateFaculty(
    id: number,
    data: UpdateFacultyRequest,
  ): Promise<Faculty> {
    return apiClient.put<Faculty>(`/api/admin/faculties/${id}`, data);
  },

  /**
   * Delete faculty
   * DELETE /api/admin/faculties/:id
   */
  async deleteFaculty(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/admin/faculties/${id}`);
  },

  // Department Management
  /**
   * Get all departments
   * GET /api/admin/departments
   */
  async getDepartments(params?: {
    faculty_id?: number;
  }): Promise<Department[]> {
    const queryParams = new URLSearchParams();
    if (params?.faculty_id) {
      queryParams.append("faculty_id", params.faculty_id.toString());
    }
    const queryString = queryParams.toString();
    return apiClient.get<Department[]>(
      `/api/admin/departments${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get department by ID
   * GET /api/admin/departments/:id
   */
  async getDepartmentById(id: number): Promise<Department> {
    return apiClient.get<Department>(`/api/admin/departments/${id}`);
  },

  /**
   * Create department
   * POST /api/admin/departments
   */
  async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    return apiClient.post<Department>("/api/admin/departments", data);
  },

  /**
   * Update department
   * PUT /api/admin/departments/:id
   */
  async updateDepartment(
    id: number,
    data: UpdateDepartmentRequest,
  ): Promise<Department> {
    return apiClient.put<Department>(`/api/admin/departments/${id}`, data);
  },

  /**
   * Delete department
   * DELETE /api/admin/departments/:id
   */
  async deleteDepartment(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      `/api/admin/departments/${id}`,
    );
  },

  // Class Management
  /**
   * Get all classes
   * GET /api/admin/classes
   */
  async getClasses(params?: { major_id?: number }): Promise<Class[]> {
    const queryParams = new URLSearchParams();
    if (params?.major_id) {
      queryParams.append("major_id", params.major_id.toString());
    }
    const queryString = queryParams.toString();
    return apiClient.get<Class[]>(
      `/api/admin/classes${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get all majors
   * GET /api/admin/classes/majors
   */
  async getMajors(): Promise<any[]> {
    return apiClient.get<any[]>('/api/admin/classes/majors');
  },

  /**
   * Get class by ID
   * GET /api/admin/classes/:id
   */
  async getClassById(id: number): Promise<Class> {
    return apiClient.get<Class>(`/api/admin/classes/${id}`);
  },

  /**
   * Create class
   * POST /api/admin/classes
   */
  async createClass(data: CreateClassRequest): Promise<Class> {
    return apiClient.post<Class>("/api/admin/classes", data);
  },

  /**
   * Update class
   * PUT /api/admin/classes/:id
   */
  async updateClass(id: number, data: UpdateClassRequest): Promise<Class> {
    return apiClient.put<Class>(`/api/admin/classes/${id}`, data);
  },

  /**
   * Delete class
   * DELETE /api/admin/classes/:id
   */
  async deleteClass(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/admin/classes/${id}`);
  },

  // User Management
  /**
   * Get all users
   * GET /api/admin/users
   */
  async getUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    class_id?: number | string;
  }): Promise<UserManagement[]> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append("role", params.role);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.class_id)
      queryParams.append("class_id", params.class_id.toString());

    const queryString = queryParams.toString();
    return apiClient.get<UserManagement[]>(
      `/api/admin/users${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get user by ID
   * GET /api/admin/users/:id
   */
  async getUserById(id: number): Promise<UserManagement> {
    return apiClient.get<UserManagement>(`/api/admin/users/${id}`);
  },

  /**
   * Create user
   * POST /api/admin/users
   */
  async createUser(data: CreateUserRequest): Promise<UserManagement> {
    return apiClient.post<UserManagement>("/api/admin/users", data);
  },

  /**
   * Update user
   * PUT /api/admin/users/:id
   */
  async updateUser(
    id: number,
    data: UpdateUserRequest,
  ): Promise<UserManagement> {
    return apiClient.put<UserManagement>(`/api/admin/users/${id}`, data);
  },

  /**
   * Delete user
   * DELETE /api/admin/users/:id
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/admin/users/${id}`);
  },

  /**
   * Create student with user
   * POST /api/admin/students
   */
  async createStudent(data: CreateStudentRequest): Promise<any> {
    return apiClient.post<any>("/api/admin/users/students", data);
  },

  /**
   * Create instructor with user
   * POST /api/admin/instructors
   */
  async createInstructor(data: CreateInstructorRequest): Promise<any> {
    return apiClient.post<any>("/api/admin/users/instructors", data);
  },

  /**
   * Import students from Excel and batch create user accounts
   * POST /api/admin/users/import-excel
   */
  async importStudentsExcel(formData: FormData): Promise<any> {
    return apiClient.post<any>(
      "/api/admin/users/import-excel",
      formData,
      true,
      {
        "Content-Type": "multipart/form-data",
      },
    );
  },

  /**
   * Get system statistics
   * GET /api/admin/statistics
   */
  async getStatistics(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalFaculties: number;
    totalDepartments: number;
    totalClasses: number;
  }> {
    return apiClient.get<any>("/api/admin/statistics");
  },
};

// --- aiChatService.ts ---
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const aiChatService = {
  /**
   * Send message to AI
   * POST /api/chat/message
   * Headers: Authorization: Bearer <jwt_token>, x-api-key: <your_api_key>
   */
  async sendMessage(
    message: string,
    conversationId?: string,
    context?: any,
    apiKey?: string,
  ): Promise<{ reply: string; conversationId: string }> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(`${BASE_URL}/api/chat/message`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        conversationId,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to send message" }));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    return response.json();
  },

  /**
   * Get conversation history
   * GET /api/chat/conversations/:id
   * Headers: Authorization: Bearer <jwt_token>, x-api-key: <your_api_key>
   */
  async getConversation(id: string, apiKey?: string): Promise<any> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(`${BASE_URL}/api/chat/conversations/${id}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to get conversation" }));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    return response.json();
  },
};

// --- authService.ts ---
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  Profile,
  User,
  Policy,
  RoleWithPolicies,
} from "@/types/api";

export const authService = {
  /**
   * Login to the system
   * POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<{
      success: boolean;
      data: LoginResponse;
      message: string;
    }>("/api/v1/auth/login", credentials, false);

    // Extract data from new response format
    const loginData = response.data;

    // Store token in localStorage
    if (loginData.token) {
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));
    }

    return loginData;
  },

  /**
   * Logout from the system
   * POST /api/auth/logout
   */
  async logout(): Promise<LogoutResponse | null> {
    try {
      // Send auth token to backend so it can log req.user.id
      const response = await apiClient.post<{
        success: boolean;
        data: LogoutResponse;
        message: string;
      }>("/api/auth/logout", undefined, true);
      return response.data;
    } catch (error) {
      console.error("Logout API failed:", error);
      return null;
    } finally {
      // Clear token and user from localStorage regardless of API success
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  async getProfile(
    userId: number,
    role: "student" | "instructor",
  ): Promise<Profile> {
    const queryParams = `?user_id=${userId}&role=${role}`;
    const response = await apiClient.get<{
      success: boolean;
      data: Profile;
      message: string;
    }>(`/api/v1/auth/profile${queryParams}`);
    return response.data;
  },

  /**
   * Get current user information
   * GET /api/auth/me
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<{
      success: boolean;
      data: User;
      message: string;
    }>("/api/v1/auth/me");
    return response.data;
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.role) {
          user.role = user.role.toLowerCase();
        }
        if (user && user.roles) {
          user.roles = user.roles.map((r: string) => r.toLowerCase());
        }
        return user;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Get stored token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem("token");
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("policies");
  },
};

// --- policyService.ts ---
export const policyService = {
  /**
   * Lấy danh sách toàn bộ chính sách
   * GET /api/policies
   */
  async getPolicies(): Promise<{
    policies: Policy[];
    grouped: Record<string, Policy[]>;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: { policies: Policy[]; grouped: Record<string, Policy[]> };
    }>("/api/policies");
    return response.data;
  },

  /**
   * Lấy danh sách Roles kèm Policies
   * GET /api/roles
   */
  async getRolesWithPolicies(): Promise<RoleWithPolicies[]> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: RoleWithPolicies[];
    }>("/api/roles");
    return response.data;
  },

  /**
   * Lấy danh sách Policies của một Role cụ thể
   * GET /api/roles/:id/policies
   */
  async getRolePolicies(
    roleId: number,
  ): Promise<{
    roleId: number;
    roleCode: string;
    roleName: string;
    policies: string[];
  }> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: {
        roleId: number;
        roleCode: string;
        roleName: string;
        policies: string[];
      };
    }>(`/api/roles/${roleId}/policies`);
    return response.data;
  },

  /**
   * Cập nhật danh sách Policies cho Role
   * PUT /api/roles/:id/policies
   */
  async updateRolePolicies(
    roleId: number,
    policies: string[],
  ): Promise<{ roleId: number; roleCode: string; policies: string[] }> {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: { roleId: number; roleCode: string; policies: string[] };
    }>(`/api/roles/${roleId}/policies`, { policies });
    return response.data;
  },
};

// --- chatboxService.ts ---

// ─── Types đồng bộ với backend ─────────────────────────────────────────────

export interface MessageAttachment {
  id: number;
  message_id?: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number | null;
  thumbnail_path?: string | null;
}

export interface MessageReaction {
  id: number;
  message_id?: number;
  user_id: number;
  reaction_type: string;
  reaction_icon?: string;
  users?: {
    id: number;
    full_name: string;
    avatar?: string;
  };
}

export interface MessageMention {
  id: number;
  message_id?: number;
  mentioned_user_id: number;
  users?: {
    id: number;
    full_name: string;
    avatar?: string;
  };
}

export interface ConversationMember {
  user_id: number;
  role: string;
  unread_count: number;
  is_active?: boolean;
  users: {
    id: number;
    username: string;
    full_name: string;
    avatar?: string;
    status?: boolean;
  };
}

export interface Conversation {
  id: number;
  conversation_name?: string;
  conversation_avatar?: string;
  conversation_type_id: number;
  thesis_id?: number;
  last_message_at?: string;
  created_at: string;
  conversation_members: ConversationMember[];
  messages?: ChatMessage[];
  lastMessage?: ChatMessage | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  deleted_at?: string | null;
  parent_message_id?: number | null;
  parentMessage?: {
    id: number;
    content: string;
    sender_id: number;
    users?: { id: number; full_name: string };
  } | null;
  created_at: string;
  updated_at?: string;
  users: {
    id: number;
    username: string;
    full_name: string;
    avatar?: string;
  };
  message_read_status?: { user_id: number; read_at: string }[];
  message_attachments?: MessageAttachment[];
  message_reactions?: MessageReaction[];
  message_mentions?: MessageMention[];
}

export interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: number | null;
}

export const chatboxService = {
  /**
   * Lấy danh sách conversation của user hiện tại
   * GET /api/v1/chatbox/conversations
   */
  async getConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>("/api/v1/chatbox/conversations");
  },

  /**
   * Lấy tin nhắn của 1 conversation (cursor pagination)
   * GET /api/v1/chatbox/conversations/:id/messages?cursor=X
   */
  async getMessages(
    conversationId: number,
    cursor?: number,
  ): Promise<MessagesResponse> {
    const query = cursor ? `?cursor=${cursor}` : "";
    return apiClient.get<MessagesResponse>(
      `/api/v1/chatbox/conversations/${conversationId}/messages${query}`,
    );
  },

  /**
   * Gửi tin nhắn qua HTTP (fallback khi socket mất kết nối)
   * POST /api/v1/chatbox/conversations/:id/messages
   */
  async sendMessage(
    conversationId: number,
    content: string,
  ): Promise<{ success: boolean; message: ChatMessage }> {
    return apiClient.post(
      `/api/v1/chatbox/conversations/${conversationId}/messages`,
      { content },
    );
  },

  /**
   * Upload file đính kèm vào cuộc trò chuyện
   * POST /api/v1/chatbox/conversations/:id/attachments
   */
  async uploadAttachments(
    conversationId: number,
    files: File[],
    content?: string,
  ): Promise<{
    success: boolean;
    message: ChatMessage;
    attachments: MessageAttachment[];
  }> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (content) formData.append("content", content);

    return apiClient.post(
      `/api/v1/chatbox/conversations/${conversationId}/attachments`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },

  /**
   * Lấy danh sách thành viên của cuộc trò chuyện
   * GET /api/v1/chatbox/conversations/:id/members
   */
  async getMembers(
    conversationId: number,
  ): Promise<{ success: boolean; data: ConversationMember[] }> {
    return apiClient.get(
      `/api/v1/chatbox/conversations/${conversationId}/members`,
    );
  },

  /**
   * Thêm thành viên vào cuộc trò chuyện
   * POST /api/v1/chatbox/conversations/:id/members
   */
  async addMember(
    conversationId: number,
    userId: number,
    role: string = "MEMBER",
  ): Promise<{ success: boolean; data: any }> {
    return apiClient.post(
      `/api/v1/chatbox/conversations/${conversationId}/members`,
      { userId, role },
    );
  },

  /**
   * Xóa thành viên khỏi cuộc trò chuyện
   * DELETE /api/v1/chatbox/conversations/:id/members/:userId
   */
  async removeMember(
    conversationId: number,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(
      `/api/v1/chatbox/conversations/${conversationId}/members/${userId}`,
    );
  },

  /**
   * Cập nhật vai trò thành viên
   * PUT /api/v1/chatbox/conversations/:id/members/:userId/role
   */
  async updateMemberRole(
    conversationId: number,
    userId: number,
    role: string,
  ): Promise<{ success: boolean; data: any }> {
    return apiClient.put(
      `/api/v1/chatbox/conversations/${conversationId}/members/${userId}/role`,
      { role },
    );
  },
};

// --- cmsService.ts ---

export interface Content {
  id: string;
  title: string;
  body: string;
  type: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export const cmsService = {
  /**
   * Get all content
   * GET /api/content
   * Headers: Authorization: Bearer <token>
   */
  async getContent(params?: {
    type?: string;
    authorId?: string;
    limit?: number;
  }): Promise<Content[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append("type", params.type);
    if (params?.authorId) queryParams.append("authorId", params.authorId);
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get<Content[]>(
      `/api/content${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get content by ID
   * GET /api/content/:id
   * Headers: Authorization: Bearer <token>
   */
  async getContentById(id: string): Promise<Content> {
    return apiClient.get<Content>(`/api/content/${id}`);
  },

  /**
   * Create new content
   * POST /api/content
   * Headers: Authorization: Bearer <token>
   */
  async createContent(data: {
    title: string;
    body: string;
    type: string;
    authorId: string;
  }): Promise<Content> {
    return apiClient.post<Content>("/api/content", data);
  },

  /**
   * Update content
   * PUT /api/content/:id
   * Headers: Authorization: Bearer <token>
   */
  async updateContent(id: string, data: Partial<Content>): Promise<Content> {
    return apiClient.put<Content>(`/api/content/${id}`, data);
  },

  /**
   * Delete content
   * DELETE /api/content/:id
   * Headers: Authorization: Bearer <token>
   */
  async deleteContent(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/content/${id}`);
  },
};

// --- councilService.ts ---
import type {
  CreateCouncilRequest,
  Council,
  UpdateCouncilRequest,
  DeleteCouncilResponse,
  StandardResponse,
} from "@/types/api";

export const councilService = {
  /**
   * Create a new defense council (public endpoint - no auth required)
   * POST /api/admin/councils
   */
  async createCouncil(data: CreateCouncilRequest): Promise<Council> {
    return apiClient.post<Council>("/api/admin/councils", data);
  },

  /**
   * Get list of defense councils with optional filters
   * GET /api/admin/councils
   */
  async getCouncils(params?: {
    thesis_round_id?: number;
    status?: string;
    council_code?: string;
  }): Promise<Council[]> {
    const queryParams = new URLSearchParams();
    if (params?.thesis_round_id)
      queryParams.append("thesis_round_id", params.thesis_round_id.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.council_code)
      queryParams.append("council_code", params.council_code);

    const queryString = queryParams.toString();
    return apiClient.get<Council[]>(
      `/api/admin/councils${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get council details by ID
   * GET /api/admin/councils/:id
   */
  async getCouncilById(id: number): Promise<Council> {
    return apiClient.get<Council>(`/api/admin/councils/${id}`);
  },

  /**
   * Update council information (ADMIN only)
   * PUT /api/admin/councils/:id
   */
  async updateCouncil(
    id: number,
    data: UpdateCouncilRequest,
  ): Promise<Council> {
    return apiClient.put<Council>(`/api/admin/councils/${id}`, data);
  },

  /**
   * Delete a council (ADMIN only)
   * DELETE /api/admin/councils/:id
   */
  async deleteCouncil(id: number): Promise<DeleteCouncilResponse> {
    return apiClient.delete<DeleteCouncilResponse>(`/api/admin/councils/${id}`);
  },
};

// --- defenseService.ts ---
import type {
  CreateDefenseCouncilRequest,
  DefenseCouncil,
  AddCouncilMemberRequest,
  CouncilMember,
  CouncilMemberWithInstructor,
  CreateDefenseAssignmentRequest,
  DefenseAssignment,
  SubmitDefenseResultRequest,
  DefenseResult,
  DefenseSchedule,
  DefenseResults,
} from "@/types/api";

export const defenseService = {
  /**
   * Create a defense council (Admin only)
   * POST /api/defense-councils
   */
  async createDefenseCouncil(
    data: CreateDefenseCouncilRequest,
  ): Promise<DefenseCouncil> {
    return apiClient.post<DefenseCouncil>("/api/defense-councils", data);
  },

  /**
   * Add a member to defense council (Admin only)
   * POST /api/defense-councils/:id/members
   */
  async addCouncilMember(
    id: number,
    data: AddCouncilMemberRequest,
  ): Promise<CouncilMember> {
    return apiClient.post<CouncilMember>(
      `/api/defense-councils/${id}/members`,
      data,
    );
  },

  /**
   * Create a defense assignment (Admin only)
   * POST /api/defense-assignments
   */
  async createDefenseAssignment(
    data: CreateDefenseAssignmentRequest,
  ): Promise<DefenseAssignment> {
    return apiClient.post<DefenseAssignment>("/api/defense-assignments", data);
  },

  /**
   * Submit defense result (Instructor only)
   * POST /api/defense-results
   */
  async submitDefenseResult(
    data: SubmitDefenseResultRequest,
  ): Promise<DefenseResult> {
    return apiClient.post<DefenseResult>("/api/defense-results", data);
  },

  /**
   * Complete a defense council (Admin only)
   * PUT /api/defense-councils/:id/complete
   */
  async completeDefenseCouncil(id: number): Promise<DefenseCouncil> {
    return apiClient.put<DefenseCouncil>(
      `/api/defense-councils/${id}/complete`,
    );
  },

  /**
   * Get defense schedule for a thesis
   * GET /api/defense-schedule/:thesisId
   */
  async getDefenseSchedule(thesisId: number): Promise<DefenseSchedule> {
    return apiClient.get<DefenseSchedule>(`/api/defense-schedule/${thesisId}`);
  },

  /**
   * Get defense results for a thesis
   * GET /api/defense-results/:thesisId
   */
  async getDefenseResults(thesisId: number): Promise<DefenseResults> {
    return apiClient.get<DefenseResults>(`/api/defense-results/${thesisId}`);
  },

  /**
   * Finalize a thesis (Admin only)
   * PUT /api/theses/:id/finalize
   */
  async finalizeThesis(id: number): Promise<any> {
    return apiClient.put(`/api/theses/${id}/finalize`);
  },
};

// --- gradingService.ts ---
import type {
  CreateReviewAssignmentRequest,
  ReviewAssignment,
  SubmitReviewResultRequest,
  ReviewResult,
  SubmitSupervisionCommentRequest,
  SupervisionComment,
  SubmitPeerEvaluationRequest,
  PeerEvaluation,
  ReviewWeeklyReportRequest,
  ThesisScores,
  SupervisionStudent,
  ReviewStudent,
  SupervisionCommentRequest,
  SupervisionCommentResponse,
  ReviewResultRequest,
  ReviewResultResponse,
  ThesisScoresResponse,
  WeeklyReportReviewRequest,
  WeeklyReportReviewResponse,
} from "@/types/api";

export const gradingService = {
  /**
   * Get supervision students (Instructor only)
   * GET /api/v1/thesis/instructor/grading/supervision-students
   */
  async getSupervisionStudents(
    instructorId?: number,
    thesisRoundId?: number,
  ): Promise<SupervisionStudent[]> {
    const params = new URLSearchParams();
    if (instructorId) params.append("instructorId", instructorId.toString());
    if (thesisRoundId) params.append("thesisRoundId", thesisRoundId.toString());
    const queryString = params.toString();
    return apiClient.get<SupervisionStudent[]>(
      `/api/v1/thesis/instructor/grading/supervision-students${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get review students (Instructor only)
   * GET /api/v1/thesis/instructor/grading/review-students
   */
  async getReviewStudents(
    instructorId?: number,
    thesisRoundId?: number,
  ): Promise<ReviewStudent[]> {
    const params = new URLSearchParams();
    if (instructorId) params.append("instructorId", instructorId.toString());
    if (thesisRoundId) params.append("thesisRoundId", thesisRoundId.toString());
    const queryString = params.toString();
    return apiClient.get<ReviewStudent[]>(
      `/api/v1/thesis/instructor/grading/review-students${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get defense council students/theses assigned to this instructor
   * GET /api/v1/thesis/instructor/defense/assigned-theses
   */
  async getDefenseStudents(thesisRoundId?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (thesisRoundId) params.append("thesisRoundId", thesisRoundId.toString());
    const queryString = params.toString();
    return apiClient.get<any[]>(
      `/api/v1/thesis/instructor/defense/assigned-theses${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get grading templates configured by Head
   * GET /api/v1/thesis/admin/grading-templates
   */
  async getGradingTemplates(type?: string): Promise<any[]> {
    const endpoint = `/api/v1/thesis/admin/grading-templates${type ? `?type=${type}` : ""}`;
    return apiClient.get<any[]>(endpoint);
  },

  /**
   * Create grading template
   * POST /api/v1/thesis/admin/grading-templates
   */
  async createGradingTemplate(formData: FormData | any): Promise<any> {
    return apiClient.post<any>(
      "/api/v1/thesis/admin/grading-templates",
      formData,
      true,
      {
        "Content-Type": "multipart/form-data",
      },
    );
  },

  /**
   * Update grading template
   * PUT /api/v1/thesis/admin/grading-templates/:id
   */
  async updateGradingTemplate(
    id: number | string,
    formData: FormData | any,
  ): Promise<any> {
    return apiClient.put<any>(
      `/api/v1/thesis/admin/grading-templates/${id}`,
      formData,
      {
        "Content-Type": "multipart/form-data",
      },
    );
  },

  /**
   * Delete grading template
   * DELETE /api/v1/thesis/admin/grading-templates/:id
   */
  async deleteGradingTemplate(id: number | string): Promise<any> {
    return apiClient.delete<any>(
      `/api/v1/thesis/admin/grading-templates/${id}`,
    );
  },

  /**
   * Get student's own thesis scores (all 4 parts)
   * GET /api/v1/thesis/student/grading/my-scores
   */
  async getStudentMyScores(): Promise<any> {
    return apiClient.get<any>("/api/v1/thesis/student/grading/my-scores");
  },

  /**
   * Submit supervision comment (Instructor only)
   * POST /api/v1/thesis/instructor/grading/supervision-comments
   */
  async submitSupervisionComment(data: any): Promise<any> {
    return apiClient.post<any>(
      "/api/v1/thesis/instructor/grading/supervision-comments",
      data,
    );
  },

  /**
   * Submit review result (Instructor only)
   * POST /api/v1/thesis/instructor/grading/review-results
   */
  async submitReviewResult(data: any): Promise<any> {
    return apiClient.post<any>(
      "/api/v1/thesis/instructor/grading/review-results",
      data,
    );
  },

  /**
   * Submit defense result (Instructor only)
   * POST /api/v1/thesis/instructor/defense/results
   */
  async submitDefenseResult(data: any): Promise<any> {
    return apiClient.post<any>(
      "/api/v1/thesis/instructor/defense/results",
      data,
    );
  },

  /**
   * Get thesis scores
   * GET /api/v1/thesis/student/grading/thesis-scores/:thesisId
   */
  async getThesisScores(thesisId: number): Promise<ThesisScoresResponse> {
    return apiClient.get<ThesisScoresResponse>(
      `/api/v1/thesis/student/grading/thesis-scores/${thesisId}`,
    );
  },

  /**
   * Review weekly report (Instructor only)
   * PUT /api/weekly-reports/:id/review
   */
  async reviewWeeklyReport(
    id: number,
    data: WeeklyReportReviewRequest,
  ): Promise<WeeklyReportReviewResponse> {
    return apiClient.put<WeeklyReportReviewResponse>(
      `/api/weekly-reports/${id}/review`,
      data,
    );
  },

  /**
   * Create a review assignment (Admin only)
   * POST /api/review-assignments
   */
  async createReviewAssignment(
    data: CreateReviewAssignmentRequest,
  ): Promise<ReviewAssignment> {
    return apiClient.post<ReviewAssignment>("/api/review-assignments", data);
  },

  /**
   * Submit a review result (Instructor only) - legacy
   * POST /api/review-results
   */
  async submitReviewResultLegacy(
    data: SubmitReviewResultRequest,
  ): Promise<ReviewResult> {
    return apiClient.post<ReviewResult>("/api/review-results", data);
  },

  /**
   * Submit a supervision comment (Instructor only) - legacy
   * POST /api/supervision-comments
   */
  async submitSupervisionCommentLegacy(
    data: SubmitSupervisionCommentRequest,
  ): Promise<SupervisionComment> {
    return apiClient.post<SupervisionComment>(
      "/api/supervision-comments",
      data,
    );
  },

  /**
   * Submit a peer evaluation (Student only)
   * POST /api/peer-evaluations
   */
  async submitPeerEvaluation(
    data: SubmitPeerEvaluationRequest,
  ): Promise<PeerEvaluation> {
    return apiClient.post<PeerEvaluation>("/api/peer-evaluations", data);
  },

  /**
   * Review a weekly report (Instructor only) - legacy
   * PUT /api/weekly-reports/:id/review
   */
  async reviewWeeklyReportLegacy(
    id: number,
    data: ReviewWeeklyReportRequest,
  ): Promise<any> {
    return apiClient.put(`/api/weekly-reports/${id}/review`, data);
  },

  /**
   * Get thesis scores - legacy
   * GET /api/thesis-scores/:thesisId
   */
  async getThesisScoresLegacy(thesisId: number): Promise<ThesisScores> {
    return apiClient.get<ThesisScores>(`/api/thesis-scores/${thesisId}`);
  },
};

// --- instructorService.ts ---

export const instructorService = {
  /**
   * Get instructors
   * GET /api/instructors
   * No authentication required
   */
  async getInstructors(params?: {
    thesis_round_id?: number;
    search?: string;
    department_id?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.thesis_round_id)
      queryParams.append("thesis_round_id", params.thesis_round_id.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.department_id)
      queryParams.append("department_id", params.department_id.toString());

    const queryString = queryParams.toString();
    return apiClient.get<any[]>(
      `/api/v1/instructors${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get instructor by ID
   * GET /api/instructors/:id
   * No authentication required
   */
  async getInstructorById(id: number): Promise<any> {
    return apiClient.get<any>(`/api/v1/instructors/${id}`);
  },

  /**
   * Get instructor by user ID
   * GET /api/instructors/by-user/:user_id
   * No authentication required
   */
  async getInstructorByUserId(userId: number): Promise<any> {
    return apiClient.get<any>(`/api/v1/instructors/by-user/${userId}`);
  },

  /**
   * Create instructor
   * POST /api/instructors
   * No authentication required
   */
  async createInstructor(data: {
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
    phone: string;
  }): Promise<any> {
    return apiClient.post<any>(`/api/v1/instructors`, data);
  },

  /**
   * Get active thesis rounds for instructors
   * GET /api/instructors/thesis-rounds/active
   * Authentication required
   */
  async getActiveThesisRounds(): Promise<any[]> {
    return apiClient.get<any[]>(
      `/api/v1/instructors/thesis-rounds/active`,
      true,
    );
  },

  /**
   * Get supervised students for an instructor
   * GET /api/instructors/:id/supervised-students
   * Authentication required
   */
  async getSupervisedStudents(
    instructorId: number,
    params?: {
      thesis_round_id?: number;
      status?: string;
    },
  ): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.thesis_round_id)
      queryParams.append("thesis_round_id", params.thesis_round_id.toString());
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    return apiClient.get<any[]>(
      `/api/v1/instructors/${instructorId}/supervised-students${queryString ? `?${queryString}` : ""}`,
      true,
    );
  },
};

// --- lmsService.ts ---

export interface Course {
  id: string;
  name: string;
  description: string;
  instructor: string;
  credits: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
}

export const lmsService = {
  /**
   * Get all courses
   * GET /api/courses
   * Headers: Authorization: Bearer <token>
   */
  async getCourses(): Promise<Course[]> {
    return apiClient.get<Course[]>("/api/courses");
  },

  /**
   * Get course by ID
   * GET /api/courses/:id
   * Headers: Authorization: Bearer <token>
   */
  async getCourseById(id: string): Promise<Course> {
    return apiClient.get<Course>(`/api/courses/${id}`);
  },

  /**
   * Create a new course
   * POST /api/courses
   * Headers: Authorization: Bearer <token>
   */
  async createCourse(data: {
    name: string;
    description: string;
    instructor: string;
    credits: number;
  }): Promise<Course> {
    return apiClient.post<Course>("/api/courses", data);
  },

  /**
   * Update a course
   * PUT /api/courses/:id
   * Headers: Authorization: Bearer <token>
   */
  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    return apiClient.put<Course>(`/api/courses/${id}`, data);
  },

  /**
   * Delete a course
   * DELETE /api/courses/:id
   * Headers: Authorization: Bearer <token>
   */
  async deleteCourse(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/courses/${id}`);
  },

  /**
   * Get enrollments for a course
   * GET /api/courses/:id/enrollments
   * Headers: Authorization: Bearer <token>
   */
  async getCourseEnrollments(id: string): Promise<Enrollment[]> {
    return apiClient.get<Enrollment[]>(`/api/courses/${id}/enrollments`);
  },

  /**
   * Enroll in a course
   * POST /api/courses/:id/enroll
   * Headers: Authorization: Bearer <token>
   */
  async enrollInCourse(id: string): Promise<Enrollment> {
    return apiClient.post<Enrollment>(`/api/courses/${id}/enroll`);
  },
};

// --- notificationService.ts ---

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  /**
   * Get all notifications
   * GET /api/notifications
   * Headers: Authorization: Bearer <token>
   * Query Parameters: ?read=true/false, ?limit=10
   */
  async getNotifications(params?: {
    read?: boolean;
    limit?: number;
  }): Promise<Notification[]> {
    const queryParams = new URLSearchParams();
    if (params?.read !== undefined)
      queryParams.append("read", params.read.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get<Notification[]>(
      `/api/notifications${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get notification by ID
   * GET /api/notifications/:id
   * Headers: Authorization: Bearer <token>
   */
  async getNotificationById(id: string): Promise<Notification> {
    return apiClient.get<Notification>(`/api/notifications/${id}`);
  },

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   * Headers: Authorization: Bearer <token>
   */
  async markAsRead(id: string): Promise<Notification> {
    return apiClient.put<Notification>(`/api/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   * Headers: Authorization: Bearer <token>
   */
  async markAllAsRead(): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>("/api/notifications/read-all");
  },

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   * Headers: Authorization: Bearer <token>
   */
  async deleteNotification(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/notifications/${id}`);
  },
};

// --- registrationService.ts ---
import type {
  InstructorReviewRequest,
  HeadReviewRequest,
  StandardResponse,
} from "@/types/api";

export const registrationService = {
  /**
   * Get registrations for instructor (Instructor only)
   * GET /api/instructor/registrations
   */
  async getInstructorRegistrations(params?: {
    status?: string;
    roundId?: number;
  }): Promise<StandardResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.roundId)
      queryParams.append("roundId", params.roundId.toString());

    const queryString = queryParams.toString();
    return apiClient.get<StandardResponse<any[]>>(
      `/api/instructor/registrations${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Instructor approve/reject registration (Instructor only)
   * PATCH /api/registrations/:registrationId/instructor-review
   */
  async instructorReview(
    registrationId: number,
    data: InstructorReviewRequest,
  ): Promise<StandardResponse<any>> {
    return apiClient.patch<StandardResponse<any>>(
      `/api/registrations/${registrationId}/instructor-review`,
      data,
    );
  },

  /**
   * Get registrations for department head (Department Head only)
   * GET /api/head/registrations
   */
  async getHeadRegistrations(params?: {
    roundId?: number;
    instructorStatus?: string;
    headStatus?: string;
  }): Promise<StandardResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.roundId)
      queryParams.append("roundId", params.roundId.toString());
    if (params?.instructorStatus)
      queryParams.append("instructorStatus", params.instructorStatus);
    if (params?.headStatus) queryParams.append("headStatus", params.headStatus);

    const queryString = queryParams.toString();
    return apiClient.get<StandardResponse<any[]>>(
      `/api/head/registrations${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Head approve/reject/override registration (Department Head only)
   * PATCH /api/registrations/:registrationId/head-review
   */
  async headReview(
    registrationId: number,
    data: HeadReviewRequest,
  ): Promise<StandardResponse<any>> {
    return apiClient.patch<StandardResponse<any>>(
      `/api/registrations/${registrationId}/head-review`,
      data,
    );
  },
};

// --- reportService.ts ---
import type {
  CreateThesisTaskRequest,
  UpdateThesisTaskRequest,
  ThesisTask,
  CreateWeeklyReportRequest,
  UpdateWeeklyReportRequest,
  WeeklyReport,
  AddContributionRequest,
  WeeklyReportContribution,
  SubmitFinalReportRequest,
  ThesisProgress,
  SubmitWeeklyReportRequest,
  WeeklyReportFeedbackRequest,
  StandardResponse,
} from "@/types/api";

export const reportService = {
  /**
   * Create a thesis task (Student only)
   * POST /api/thesis-tasks
   */
  async createThesisTask(data: CreateThesisTaskRequest): Promise<ThesisTask> {
    return apiClient.post<ThesisTask>("/api/v1/thesis/student/tasks", data);
  },

  /**
   * Update a thesis task
   * PUT /api/thesis-tasks/:id
   */
  async updateThesisTask(
    id: number,
    data: UpdateThesisTaskRequest,
  ): Promise<ThesisTask> {
    return apiClient.put<ThesisTask>(
      `/api/v1/thesis/student/tasks/${id}`,
      data,
    );
  },

  /**
   * Get thesis tasks
   * GET /api/thesis-tasks
   */
  async getThesisTasks(thesisId: number): Promise<ThesisTask[]> {
    return apiClient.get<ThesisTask[]>(
      `/api/v1/thesis/student/tasks/${thesisId}`,
    );
  },

  /**
   * Get Kanban lists for a thesis
   * GET /api/v1/thesis/student/tasks/lists/:thesisId
   */
  async getKanbanLists(thesisId: number): Promise<any[]> {
    return apiClient.get<any[]>(
      `/api/v1/thesis/student/tasks/lists/${thesisId}`,
    );
  },

  /**
   * Giảng viên nộp điểm phản biện
   * POST /api/gradings/review-results
   */
  async submitReviewResult(data: any): Promise<any> {
    if (data.grading_file || data.gradingFile) {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return apiClient.post<any>(
        "/api/v1/thesis/instructor/grading/review-results",
        formData,
        true,
        { "Content-Type": "multipart/form-data" },
      );
    }
    return apiClient.post<any>(
      "/api/v1/thesis/instructor/grading/review-results",
      data,
    );
  },

  /**
   * Giảng viên nộp điểm hướng dẫn
   * POST /api/gradings/supervision-comments
   */
  async submitSupervisionComment(data: any): Promise<any> {
    if (data.grading_file || data.gradingFile) {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return apiClient.post<any>(
        "/api/v1/thesis/instructor/grading/supervision-comments",
        formData,
        true,
        { "Content-Type": "multipart/form-data" },
      );
    }
    return apiClient.post<any>(
      "/api/v1/thesis/instructor/grading/supervision-comments",
      data,
    );
  },

  /**
   * Create a Kanban list
   * POST /api/v1/thesis/student/tasks/lists
   */
  async createKanbanList(data: {
    thesis_id: number;
    name: string;
  }): Promise<any> {
    return apiClient.post<any>("/api/v1/thesis/student/tasks/lists", data);
  },

  /**
   * Create a weekly report (Student only)
   * POST /api/weekly-reports
   */
  async createWeeklyReport(
    thesisId: number,
    data: CreateWeeklyReportRequest,
  ): Promise<WeeklyReport> {
    return apiClient.post<WeeklyReport>(
      `/api/v1/thesis/student/reports/weekly/${thesisId}`,
      data,
    );
  },

  /**
   * Update a weekly report
   * PUT /api/weekly-reports/:id
   */
  async updateWeeklyReport(
    id: number,
    data: UpdateWeeklyReportRequest,
  ): Promise<WeeklyReport> {
    return apiClient.put<WeeklyReport>(
      `/api/v1/thesis/student/reports/weekly/${id}`,
      data,
    ); // Assuming id is reportId
  },

  /**
   * Get weekly reports
   * GET /api/weekly-reports
   */
  async getWeeklyReports(thesisId?: number): Promise<WeeklyReport[]> {
    if (thesisId) {
      return apiClient.get<WeeklyReport[]>(
        `/api/v1/thesis/student/reports/weekly/${thesisId}`,
      );
    } else {
      return apiClient.get<WeeklyReport[]>(
        `/api/v1/thesis/instructor/reports/weekly`,
      );
    }
  },

  /**
   * Add individual contribution to weekly report (Student only)
   * POST /api/weekly-report-contributions
   */
  async addContribution(
    data: AddContributionRequest,
  ): Promise<WeeklyReportContribution> {
    return apiClient.post<WeeklyReportContribution>(
      "/api/weekly-report-contributions",
      data,
    );
  },

  /**
   * Submit final report (Student only)
   * PUT /api/theses/:id/submit-final-report
   */
  async submitFinalReport(
    id: number,
    data: SubmitFinalReportRequest,
  ): Promise<any> {
    return apiClient.put(`/api/theses/${id}/submit-final-report`, data);
  },

  /**
   * Get thesis progress
   * GET /api/reports/thesis-progress/:thesisId
   */
  async getThesisProgress(thesisId: number): Promise<ThesisProgress> {
    return apiClient.get<ThesisProgress>(
      `/api/reports/thesis-progress/${thesisId}`,
    );
  },

  /**
   * Submit weekly report for thesis (Student only)
   * POST /api/theses/:thesisId/weekly-reports
   */
  async submitWeeklyReport(
    thesisId: number,
    data: SubmitWeeklyReportRequest,
  ): Promise<StandardResponse<WeeklyReport>> {
    return apiClient.post<StandardResponse<WeeklyReport>>(
      `/api/v1/thesis/student/reports/weekly/${thesisId}`,
      data,
    );
  },

  /**
   * Upload an attachment for a weekly report
   * POST /api/v1/thesis/student/reports/upload
   */
  async uploadAttachment(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("attachmentFile", file);
    return apiClient.post<{ url: string }>(
      "/api/v1/thesis/student/reports/upload",
      formData,
    );
  },

  /**
   * Get weekly reports for thesis (Student member or Instructor supervisor)
   * GET /api/theses/:thesisId/weekly-reports
   */
  async getThesisWeeklyReports(
    thesisId: number,
  ): Promise<StandardResponse<WeeklyReport[]>> {
    return apiClient.get<StandardResponse<WeeklyReport[]>>(
      `/api/v1/thesis/student/reports/weekly/${thesisId}`,
    );
  },

  /**
   * Get weekly reports for thesis (Instructor supervisor)
   * GET /api/v1/thesis/instructor/reports/weekly/:thesisId
   */
  async getThesisWeeklyReportsForInstructor(
    thesisId: number,
  ): Promise<StandardResponse<WeeklyReport[]>> {
    return apiClient.get<StandardResponse<WeeklyReport[]>>(
      `/api/v1/thesis/instructor/reports/weekly/${thesisId}`,
    );
  },

  /**
   * Provide feedback on weekly report (Instructor only)
   * PATCH /api/weekly-reports/:reportId/feedback
   */
  async provideWeeklyReportFeedback(
    reportId: number,
    data: WeeklyReportFeedbackRequest,
  ): Promise<StandardResponse<WeeklyReport>> {
    return apiClient.put<StandardResponse<WeeklyReport>>(
      `/api/v1/thesis/instructor/reports/weekly/${reportId}/feedback`,
      data,
    );
  },

  /**
   * Get individual thesis reports for a student
   * GET /api/reports/individual-thesis-reports
   */
  async getIndividualThesisReports(
    studentId: number,
  ): Promise<StandardResponse<any[]>> {
    return apiClient.get<StandardResponse<any[]>>(
      `/api/reports/individual-thesis-reports?student_id=${studentId}`,
    );
  },
};

// --- socketService.ts ---
import { io, Socket } from "socket.io-client";

// Socket.IO kết nối TRỰC TIẾP đến ChatService (bypass API Gateway)
// Vì Gateway không proxy WebSocket
const SOCKET_URL =
  import.meta.env.VITE_CHAT_SOCKET_URL || "http://localhost:8006";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

/**
 * Khởi tạo kết nối Socket.IO với JWT token
 * Gọi hàm này sau khi user đăng nhập thành công
 */
export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token }, // ChatService socket middleware đọc token từ đây
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("[Socket] ✅ Kết nối thành công, socketId:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] ❌ Lỗi kết nối:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("[Socket] ⚠️ Mất kết nối:", reason);
  });

  return socket;
}

/** Ngắt kết nối socket (khi logout hoặc unmount) */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Tham gia phòng chat của 1 conversation */
export function joinConversation(conversationId: number): void {
  socket?.emit("joinConversation", { conversationId });
}

/** Rời khỏi phòng chat của 1 conversation */
export function leaveConversation(conversationId: number): void {
  socket?.emit("leaveConversation", { conversationId });
}

/** Gửi tin nhắn qua socket */
export function sendSocketMessage(
  conversationId: number,
  content: string,
  options?: {
    parentMessageId?: number;
    attachments?: Array<{
      fileName: string;
      filePath: string;
      fileType?: string;
      fileSize?: number;
      thumbnailPath?: string;
    }>;
    mentionedUserIds?: number[];
  },
): void {
  socket?.emit("sendMessage", {
    conversationId,
    content,
    parentMessageId: options?.parentMessageId,
    attachments: options?.attachments,
    mentionedUserIds: options?.mentionedUserIds,
  });
}

/** Chỉnh sửa tin nhắn qua socket */
export function editSocketMessage(messageId: number, content: string): void {
  socket?.emit("editMessage", { messageId, content });
}

/** Xóa/thu hồi tin nhắn qua socket */
export function deleteSocketMessage(messageId: number): void {
  socket?.emit("deleteMessage", { messageId });
}

/** Thêm cảm xúc (reaction) cho tin nhắn qua socket */
export function addSocketReaction(
  messageId: number,
  reactionType: string,
  reactionIcon?: string,
): void {
  socket?.emit("addReaction", { messageId, reactionType, reactionIcon });
}

/** Xóa cảm xúc qua socket */
export function removeSocketReaction(messageId: number): void {
  socket?.emit("removeReaction", { messageId });
}

/** Đánh dấu đã đọc hội thoại qua socket */
export function markSocketRead(conversationId: number): void {
  socket?.emit("markRead", { conversationId });
}

/** Báo đang gõ phím */
export function startTyping(conversationId: number): void {
  socket?.emit("startTyping", { conversationId });
}

/** Báo ngừng gõ phím */
export function stopTyping(conversationId: number): void {
  socket?.emit("stopTyping", { conversationId });
}

// --- studentService.ts ---
import type {
  StudentInstructor,
  GetInstructorsParams,
  StudentClass,
  StudentClassDetail,
  GetClassesParams,
} from "@/types/api";

export const studentService = {
  /**
   * Get list of instructors for students
   * GET /api/students/instructors
   * Authentication required
   */
  async getInstructors(
    params?: GetInstructorsParams,
  ): Promise<StudentInstructor[]> {
    const queryParams = new URLSearchParams();

    if (params?.thesis_round_id) {
      queryParams.append("thesis_round_id", params.thesis_round_id.toString());
    }
    if (params?.department_id) {
      queryParams.append("department_id", params.department_id.toString());
    }
    if (params?.search) {
      queryParams.append("search", params.search);
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/students/instructors${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<StudentInstructor[]>(endpoint);
  },

  /**
   * Get all classes
   * GET /api/students/classes
   */
  async getClasses(params?: GetClassesParams): Promise<StudentClass[]> {
    const queryParams = new URLSearchParams();

    if (params?.department_id) {
      queryParams.append("department_id", params.department_id.toString());
    }
    if (params?.major_id) {
      queryParams.append("major_id", params.major_id.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/students/classes${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<any>(endpoint);
    return response.data || response;
  },

  /**
   * Get class by ID with students
   * GET /api/students/classes/:id
   */
  async getClassById(id: number): Promise<StudentClassDetail> {
    const response = await apiClient.get<any>(`/api/students/classes/${id}`);
    return response.data || response;
  },
};

// --- studentThesisService.ts ---
import type {
  ThesisRound,
  ProposedTopic,
  TopicRegistration,
  StandardResponse,
} from "@/types/api";

export const studentThesisService = {
  /**
   * Get all thesis rounds for student
   * GET /api/thesis/thesis-rounds
   */
  async getAllThesisRounds(): Promise<StandardResponse<ThesisRound[]>> {
    return apiClient.get<StandardResponse<ThesisRound[]>>(
      "/api/thesis/thesis-rounds",
    );
  },

  /**
   * Get available topics for student
   * GET /api/thesis/available-topics
   */
  async getAvailableTopics(): Promise<StandardResponse<ProposedTopic[]>> {
    return apiClient.get<StandardResponse<ProposedTopic[]>>(
      "/api/thesis/available-topics",
    );
  },

  /**
   * Get student's registrations
   * GET /api/thesis/my-registrations
   */
  async getMyRegistrations(): Promise<StandardResponse<TopicRegistration[]>> {
    return apiClient.get<StandardResponse<TopicRegistration[]>>(
      "/api/thesis/my-registrations",
    );
  },
};

// --- thesisGroupsService.ts ---
import type {
  CreateThesisGroupRequest,
  ThesisGroup,
  CreateGroupInvitationRequest,
  GroupInvitation,
} from "@/types/api";

export const thesisGroupsService = {
  /**
   * Create a thesis group (Student only)
   * POST /api/thesis-groups
   * Request body includes: group_name, thesis_round_id, group_type, min_members, max_members, student_id
   */
  async createThesisGroup(
    data: CreateThesisGroupRequest,
  ): Promise<ThesisGroup> {
    return apiClient.post<ThesisGroup>("/api/thesis-groups", data);
  },

  /**
   * Get thesis groups
   * GET /api/thesis-groups
   * Query params: student_id (optional), thesis_round_id (optional)
   */
  async getThesisGroups(
    studentId?: number,
    thesisRoundId?: number,
  ): Promise<ThesisGroup[]> {
    const params = new URLSearchParams();
    if (studentId) params.append("student_id", studentId.toString());
    if (thesisRoundId)
      params.append("thesis_round_id", thesisRoundId.toString());
    const queryParams = params.toString();
    return apiClient.get<ThesisGroup[]>(
      `/api/thesis-groups${queryParams ? "?" + queryParams : ""}`,
    );
  },

  /**
   * Get thesis group by ID
   * GET /api/thesis-groups/:id
   */
  async getThesisGroupById(id: string | number): Promise<ThesisGroup> {
    return apiClient.get<ThesisGroup>(`/api/thesis-groups/${id}`);
  },

  /**
   * Update thesis group
   * PUT /api/thesis-groups/:id
   */
  async updateThesisGroup(
    id: string | number,
    data: Partial<CreateThesisGroupRequest> | any,
  ): Promise<ThesisGroup> {
    return apiClient.put<ThesisGroup>(`/api/thesis-groups/${id}`, data);
  },

  /**
   * Delete thesis group
   * DELETE /api/thesis-groups/:id
   */
  async deleteThesisGroup(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/thesis-groups/${id}`);
  },

  /**
   * Create a group invitation (Student - LEADER only)
   * POST /api/thesis-groups/invitations
   * Request body includes: thesis_group_id, invited_student_id, invitation_message, student_id
   */
  async createGroupInvitation(
    data: CreateGroupInvitationRequest,
  ): Promise<GroupInvitation> {
    return apiClient.post<GroupInvitation>(
      "/api/thesis-groups/invitations",
      data,
    );
  },

  /**
   * Accept a group invitation (Student only)
   * PUT /api/thesis-groups/invitations/:id/accept
   * Request body includes: student_id
   */
  async acceptInvitation(
    id: number,
    studentId: number,
  ): Promise<GroupInvitation> {
    return apiClient.put<GroupInvitation>(
      `/api/thesis-groups/invitations/${id}/accept`,
      { student_id: studentId },
    );
  },

  /**
   * Reject a group invitation (Student only)
   * PUT /api/thesis-groups/invitations/:id/reject
   * Request body includes: student_id
   */
  async rejectInvitation(
    id: number,
    studentId: number,
  ): Promise<GroupInvitation> {
    return apiClient.put<GroupInvitation>(
      `/api/thesis-groups/invitations/${id}/reject`,
      { student_id: studentId },
    );
  },

  /**
   * Get invitations for current student
   * GET /api/thesis-groups/invitations
   * Query param: student_id (required)
   */
  async getInvitations(studentId: number): Promise<GroupInvitation[]> {
    return apiClient.get<GroupInvitation[]>(
      `/api/thesis-groups/invitations?student_id=${studentId}`,
    );
  },

  /**
   * Leave a thesis group (Student only)
   * POST /api/thesis-groups/leave
   * Request body includes: student_id, thesis_group_id
   */
  async leaveGroup(studentId: number, thesisGroupId: number): Promise<any> {
    return apiClient.post<any>("/api/thesis-groups/leave", {
      student_id: studentId,
      thesis_group_id: thesisGroupId,
    });
  },

  /**
   * Lock thesis group (Student only)
   * PUT /api/thesis-groups/:id/lock
   */
  async lockThesisGroup(id: number): Promise<ThesisGroup> {
    return apiClient.put<ThesisGroup>(`/api/thesis-groups/${id}/lock`);
  },

  /**
   * Dissolve thesis group (Student only)
   * PUT /api/thesis-groups/:id/dissolve
   */
  async dissolveThesisGroup(
    id: number,
    studentId: number,
    dissolutionReason: string = "",
  ): Promise<any> {
    return apiClient.put<any>(`/api/thesis-groups/${id}/dissolve`, {
      student_id: studentId,
      dissolution_reason: dissolutionReason,
    });
  },

  /**
   * Add group member (Admin only)
   * POST /api/thesis-groups/:id/members
   */
  async addGroupMember(id: number, data: any): Promise<any> {
    return apiClient.post<any>(`/api/thesis-groups/${id}/members`, data);
  },

  /**
   * Remove group member (Admin only)
   * DELETE /api/thesis-groups/:id/members/:memberId
   */
  async removeGroupMember(id: number, memberId: number): Promise<any> {
    return apiClient.delete<any>(
      `/api/thesis-groups/${id}/members/${memberId}`,
    );
  },
};

// --- thesisRoundsService.ts ---
import type {
  CreateThesisRoundRequest,
  ThesisRound,
  ThesisRoundClass,
  GuidanceProcess,
  InstructorAssignment,
  AssignedInstructor,
  AssignClassesRequest,
  AssignedClass,
  AddGuidanceProcessRequest,
  GuidanceProcessResponse,
  UpdateThesisRoundStatusRequest,
  StandardResponse,
} from "@/types/api";

export const thesisRoundsService = {
  // ==========================================
  // ADMIN / HEAD ROUTES (/api/admin/thesis-rounds)
  // ==========================================

  /**
   * Create a new thesis round
   * POST /api/admin/thesis-rounds
   */
  async createThesisRound(
    data: CreateThesisRoundRequest,
  ): Promise<ThesisRound> {
    return apiClient.post<ThesisRound>("/api/admin/thesis-rounds", data);
  },

  /**
   * Get all thesis rounds
   * GET /api/admin/thesis-rounds
   */
  async getThesisRounds(): Promise<ThesisRound[]> {
    return apiClient.get<ThesisRound[]>("/api/admin/thesis-rounds");
  },

  /**
   * Get active thesis rounds
   * GET /api/admin/thesis-rounds/active
   */
  async getActiveThesisRoundsForAdmin(): Promise<ThesisRound[]> {
    return apiClient.get<ThesisRound[]>("/api/admin/thesis-rounds/active");
  },

  /**
   * Get thesis round by ID
   * GET /api/admin/thesis-rounds/:id
   */
  async getThesisRoundById(id: number): Promise<ThesisRound> {
    return apiClient.get<ThesisRound>(`/api/admin/thesis-rounds/${id}`);
  },

  /**
   * Activate a thesis round
   * PUT /api/admin/thesis-rounds/:id/activate
   */
  async activateThesisRound(id: number): Promise<ThesisRound> {
    return apiClient.put<ThesisRound>(
      `/api/admin/thesis-rounds/${id}/activate`,
    );
  },

  /**
   * Update thesis round status
   * PUT /api/admin/thesis-rounds/:roundId/status
   */
  async updateThesisRoundStatus(
    roundId: number,
    data: UpdateThesisRoundStatusRequest,
  ): Promise<StandardResponse<ThesisRound>> {
    return apiClient.put<StandardResponse<ThesisRound>>(
      `/api/admin/thesis-rounds/${roundId}/status`,
      data,
    );
  },

  /**
   * Auto-update status (cron job trigger)
   * POST /api/admin/thesis-rounds/auto-update-status
   */
  async autoUpdateStatus(): Promise<{ updated: number }> {
    return apiClient.post<{ updated: number }>(
      "/api/admin/thesis-rounds/auto-update-status",
    );
  },

  /**
   * Assign instructors to a thesis round
   * POST /api/admin/thesis-rounds/:id/assign-instructors
   */
  async assignInstructors(
    id: number,
    data: { instructorIds: number[]; supervisionQuota: number },
  ): Promise<any> {
    return apiClient.post<any>(
      `/api/admin/thesis-rounds/${id}/instructors`,
      data,
    );
  },

  /**
   * Get instructor assignments for a thesis round
   */
  async getInstructorAssignments(
    id: number,
  ): Promise<StandardResponse<InstructorAssignment[]>> {
    return apiClient.get<StandardResponse<InstructorAssignment[]>>(
      `/api/v1/thesis/thesis-rounds/${id}/instructors`,
    );
  },

  /**
   * Assign classes to a thesis round
   * POST /api/admin/thesis-rounds/:id/assign-classes
   */
  async assignClasses(
    id: number,
    data: AssignClassesRequest,
  ): Promise<AssignedClass[]> {
    return apiClient.post<AssignedClass[]>(
      `/api/admin/thesis-rounds/${id}/assign-classes`,
      data,
    );
  },

  /**
   * Add guidance process to a thesis round
   * POST /api/admin/thesis-rounds/:id/guidance-process
   */
  async addGuidanceProcess(
    id: number,
    data: AddGuidanceProcessRequest,
  ): Promise<GuidanceProcessResponse[]> {
    return apiClient.post<GuidanceProcessResponse[]>(
      `/api/admin/thesis-rounds/${id}/guidance-process`,
      data,
    );
  },

  // ==========================================
  // ALIASES FOR COMPATIBILITY WITH HEAD USAGE
  // ==========================================
  async createThesisRoundForHead(
    data: CreateThesisRoundRequest,
  ): Promise<ThesisRound> {
    return this.createThesisRound(data);
  },
  async assignInstructorsToRound(
    roundId: number,
    data: { instructorIds: number[]; supervisionQuota: number },
  ): Promise<StandardResponse<any>> {
    const result = await this.assignInstructors(roundId, data);
    return { data: result };
  },

  async getThesisRoundsForHead(): Promise<ThesisRound[]> {
    return this.getThesisRounds();
  },
  async getActiveThesisRoundsForHead(): Promise<
    StandardResponse<ThesisRound[]>
  > {
    const rounds = await this.getActiveThesisRoundsForAdmin();
    return { data: rounds };
  },
  async getThesisRoundByIdForHead(
    id: number,
  ): Promise<StandardResponse<ThesisRound>> {
    const round = await this.getThesisRoundById(id);
    return { data: round };
  },
  async activateThesisRoundForHead(id: number): Promise<ThesisRound> {
    return this.activateThesisRound(id);
  },
  async assignClassesForHead(
    id: number,
    data: AssignClassesRequest,
  ): Promise<StandardResponse<ThesisRoundClass[]>> {
    const classes = await this.assignClasses(id, data);
    return { data: classes as any };
  },
  async addGuidanceProcessForHead(
    id: number,
    data: AddGuidanceProcessRequest,
  ): Promise<StandardResponse<GuidanceProcess[]>> {
    const process = await this.addGuidanceProcess(id, data);
    return { data: process as any };
  },
  async updateThesisRoundForHead(id: number, data: any): Promise<ThesisRound> {
    return apiClient.put<ThesisRound>(`/api/admin/thesis-rounds/${id}`, data);
  },
  async startThesisRoundForHead(id: number): Promise<ThesisRound> {
    const res = await this.updateThesisRoundStatus(id, {
      status: "Ongoing",
    } as any);
    return res.data as any;
  },

  // ==========================================
  // INSTRUCTOR ROUTES
  // ==========================================

  /**
   * Get active thesis rounds for instructor
   */
  async getThesisRoundsForInstructor(): Promise<ThesisRound[]> {
    return apiClient.get<ThesisRound[]>("/api/v1/thesis/thesis-rounds/active");
  },

  /**
   * Get active thesis rounds (for instructor grading)
   */
  async getActiveThesisRounds(): Promise<ThesisRound[]> {
    return apiClient.get<ThesisRound[]>("/api/v1/thesis/thesis-rounds/active");
  },

  // ==========================================
  // STUDENT ROUTES
  // ==========================================

  /**
   * Get active thesis rounds for student
   */
  async getThesisRoundsForStudent(): Promise<StandardResponse<ThesisRound[]>> {
    try {
      const rounds = await apiClient.get<ThesisRound[]>(
        "/api/v1/thesis/thesis-rounds/active",
      );
      return { success: true, data: rounds, message: "Success" } as any;
    } catch (error: any) {
      console.error("Error fetching student thesis rounds:", error);
      return { success: false, data: [], message: error.message } as any;
    }
  },
};

export const thesisRoundService = thesisRoundsService;

// --- thesisService.ts ---

export interface Thesis {
  id: string;
  title: string;
  description: string;
  studentId: string;
  advisorId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopicRegistration {
  id: string;
  thesisId: string;
  topic: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReport {
  id: string;
  thesisId: string;
  weekNumber: number;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisTask {
  id: string;
  thesisId: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const thesisService = {
  /**
   * Get current student's thesis / topic registration
   * GET /api/thesis/my-registrations
   */
  async getMyThesis(): Promise<any> {
    try {
      const res = await apiClient.get<any>("/api/thesis/my-registrations");
      if (Array.isArray(res) && res.length > 0) return res[0];
      if (res?.data && Array.isArray(res.data) && res.data.length > 0)
        return res.data[0];
      return res?.data || res;
    } catch {
      return null;
    }
  },

  // Legacy Routes for /api/thesis
  /**
   * Get all theses
   * GET /api/thesis
   * Headers: Authorization: Bearer <token>
   */
  async getTheses(): Promise<Thesis[]> {
    return apiClient.get<Thesis[]>("/api/thesis");
  },

  /**
   * Get thesis by ID
   * GET /api/thesis/:id
   * Headers: Authorization: Bearer <token>
   */
  async getThesisById(id: string): Promise<Thesis> {
    return apiClient.get<Thesis>(`/api/thesis/${id}`);
  },

  /**
   * Create new thesis
   * POST /api/thesis
   * Headers: Authorization: Bearer <token>
   */
  async createThesis(data: Partial<Thesis>): Promise<Thesis> {
    return apiClient.post<Thesis>("/api/thesis", data);
  },

  /**
   * Update thesis
   * PUT /api/thesis/:id
   * Headers: Authorization: Bearer <token>
   */
  async updateThesis(id: string, data: Partial<Thesis>): Promise<Thesis> {
    return apiClient.put<Thesis>(`/api/thesis/${id}`, data);
  },

  /**
   * Delete thesis
   * DELETE /api/thesis/:id
   * Headers: Authorization: Bearer <token>
   */
  async deleteThesis(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/thesis/${id}`);
  },

  // Legacy Routes for /api/topic-registrations
  /**
   * Get all topic registrations
   * GET /api/topic-registrations
   * Headers: Authorization: Bearer <token>
   */
  async getTopicRegistrations(): Promise<TopicRegistration[]> {
    return apiClient.get<TopicRegistration[]>("/api/topic-registrations");
  },

  /**
   * Create topic registration
   * POST /api/topic-registrations
   * Headers: Authorization: Bearer <token>
   */
  async createTopicRegistration(
    data: Partial<TopicRegistration>,
  ): Promise<TopicRegistration> {
    return apiClient.post<TopicRegistration>("/api/topic-registrations", data);
  },

  /**
   * Update topic registration
   * PUT /api/topic-registrations/:id
   * Headers: Authorization: Bearer <token>
   */
  async updateTopicRegistration(
    id: string,
    data: Partial<TopicRegistration>,
  ): Promise<TopicRegistration> {
    return apiClient.put<TopicRegistration>(
      `/api/topic-registrations/${id}`,
      data,
    );
  },

  /**
   * Delete topic registration
   * DELETE /api/topic-registrations/:id
   * Headers: Authorization: Bearer <token>
   */
  async deleteTopicRegistration(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      `/api/topic-registrations/${id}`,
    );
  },

  // Legacy Routes for /api/weekly-reports
  /**
   * Get all weekly reports
   * GET /api/weekly-reports
   * Headers: Authorization: Bearer <token>
   */
  async getWeeklyReports(): Promise<WeeklyReport[]> {
    return apiClient.get<WeeklyReport[]>("/api/weekly-reports");
  },

  /**
   * Create weekly report
   * POST /api/weekly-reports
   * Headers: Authorization: Bearer <token>
   */
  async createWeeklyReport(data: Partial<WeeklyReport>): Promise<WeeklyReport> {
    return apiClient.post<WeeklyReport>("/api/weekly-reports", data);
  },

  /**
   * Update weekly report
   * PUT /api/weekly-reports/:id
   * Headers: Authorization: Bearer <token>
   */
  async updateWeeklyReport(
    id: string,
    data: Partial<WeeklyReport>,
  ): Promise<WeeklyReport> {
    return apiClient.put<WeeklyReport>(`/api/weekly-reports/${id}`, data);
  },

  /**
   * Delete weekly report
   * DELETE /api/weekly-reports/:id
   * Headers: Authorization: Bearer <token>
   */
  async deleteWeeklyReport(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/weekly-reports/${id}`);
  },

  // Legacy Routes for /api/thesis-tasks
  /**
   * Get all thesis tasks
   * GET /api/thesis-tasks
   * Headers: Authorization: Bearer <token>
   */
  async getThesisTasks(): Promise<ThesisTask[]> {
    return apiClient.get<ThesisTask[]>("/api/thesis-tasks");
  },

  /**
   * Create thesis task
   * POST /api/thesis-tasks
   * Headers: Authorization: Bearer <token>
   */
  async createThesisTask(data: Partial<ThesisTask>): Promise<ThesisTask> {
    return apiClient.post<ThesisTask>("/api/thesis-tasks", data);
  },

  /**
   * Update thesis task
   * PUT /api/thesis-tasks/:id
   * Headers: Authorization: Bearer <token>
   */
  async updateThesisTask(
    id: string,
    data: Partial<ThesisTask>,
  ): Promise<ThesisTask> {
    return apiClient.put<ThesisTask>(`/api/thesis-tasks/${id}`, data);
  },

  /**
   * Delete thesis task
   * DELETE /api/thesis-tasks/:id
   * Headers: Authorization: Bearer <token>
   */
  async deleteThesisTask(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/thesis-tasks/${id}`);
  },
};

// --- topicRegistrationService.ts ---
import type {
  CreateProposedTopicRequest,
  ProposedTopic,
  CreateTopicRegistrationRequest,
  TopicRegistration,
} from "@/types/api";

export const topicRegistrationService = {
  // ─── Proposed Topics ──────────────────────────────────────────────────────

  async createProposedTopic(
    data: CreateProposedTopicRequest,
  ): Promise<ProposedTopic> {
    return apiClient.post<ProposedTopic>(
      "/api/topic-registrations/proposed-topics",
      data,
    );
  },

  async getProposedTopics(thesisRoundId?: number): Promise<ProposedTopic[]> {
    const q = thesisRoundId ? `?thesis_round_id=${thesisRoundId}` : "";
    return apiClient.get<ProposedTopic[]>(
      `/api/topic-registrations/proposed-topics${q}`,
    );
  },

  async getProposedTopicsByInstructor(
    instructorId: number,
    thesisRoundId?: number,
  ): Promise<ProposedTopic[]> {
    const p = new URLSearchParams({ instructor_id: instructorId.toString() });
    if (thesisRoundId) p.append("thesis_round_id", thesisRoundId.toString());
    return apiClient.get<ProposedTopic[]>(
      `/api/topic-registrations/proposed-topics?${p.toString()}`,
    );
  },

  // ─── Student: Đăng ký đề tài ──────────────────────────────────────────────
  // Gateway: /api/topic-registrations/** → ThesisService /api/v1/thesis/student/topic-registrations/**

  async createTopicRegistration(
    data: CreateTopicRegistrationRequest,
  ): Promise<TopicRegistration> {
    return apiClient.post<TopicRegistration>("/api/topic-registrations", data);
  },

  async getTopicRegistrations(
    studentId?: number,
    status?: string,
  ): Promise<TopicRegistration[]> {
    const p = new URLSearchParams();
    if (studentId) p.append("student_id", studentId.toString());
    if (status) p.append("status", status);
    const q = p.toString();
    return apiClient.get<TopicRegistration[]>(
      `/api/topic-registrations${q ? "?" + q : ""}`,
    );
  },

  async getTopicRegistrationById(id: number): Promise<TopicRegistration> {
    return apiClient.get<TopicRegistration>(`/api/topic-registrations/${id}`);
  },

  // ─── Instructor: Duyệt đề tài ─────────────────────────────────────────────
  // Đi thẳng qua gateway route: /api/v1/thesis/** → ThesisService /api/v1/thesis/**

  async getRegistrationsForInstructor(
    status?: string,
  ): Promise<TopicRegistration[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: TopicRegistration[];
    }>(
      `/api/v1/thesis/instructor/topic-registrations${status ? `?instructor_status=${status}` : ""}`,
    );
    return res.data ?? [];
  },

  /** Giảng viên duyệt đề tài */
  async instructorApprove(id: number): Promise<any> {
    return apiClient.put(
      `/api/v1/thesis/instructor/topic-registrations/${id}/approve`,
    );
  },

  /** Giảng viên từ chối đề tài */
  async instructorReject(id: number, reason: string): Promise<any> {
    return apiClient.put(
      `/api/v1/thesis/instructor/topic-registrations/${id}/reject`,
      { reason },
    );
  },

  // ─── Trưởng Bộ Môn: Duyệt đề tài ─────────────────────────────────────────
  // Gateway: /api/admin/** → ThesisService /api/v1/thesis/admin/**

  async getRegistrationsForHead(params?: {
    instructor_status?: string;
    head_status?: string;
  }): Promise<TopicRegistration[]> {
    const q = params ? "?" + new URLSearchParams(params as any).toString() : "";
    const res = await apiClient.get<{
      success: boolean;
      data: TopicRegistration[];
    }>(`/api/admin/topic-registrations${q}`);
    return res.data ?? [];
  },

  /** Trưởng bộ môn duyệt đề tài */
  async headApprove(id: number): Promise<any> {
    return apiClient.put(`/api/admin/topic-registrations/${id}/approve`);
  },

  /** Trưởng bộ môn từ chối đề tài */
  async headReject(id: number, reason: string): Promise<any> {
    return apiClient.put(`/api/admin/topic-registrations/${id}/reject`, {
      reason,
    });
  },

  // ─── Backward compatibility (các page cũ dùng, sẽ dần thay thế) ─────────

  /** @deprecated dùng instructorApprove / instructorReject */
  async approveRegistration(
    id: number,
    data: { status: string; rejection_reason?: string },
  ): Promise<any> {
    return data.status === "APPROVED"
      ? this.instructorApprove(id)
      : this.instructorReject(id, data.rejection_reason || "");
  },

  /** @deprecated dùng headApprove / headReject */
  async headApproveRegistration(
    id: number,
    data: { status: string; rejection_reason?: string },
  ): Promise<any> {
    return data.status === "APPROVED"
      ? this.headApprove(id)
      : this.headReject(id, data.rejection_reason || "");
  },

  async getPendingRegistrations(
    _instructorId: number,
  ): Promise<TopicRegistration[]> {
    return this.getRegistrationsForInstructor("PENDING");
  },

  async getPendingRegistrationsForHead(
    _departmentId: number,
  ): Promise<TopicRegistration[]> {
    return this.getRegistrationsForHead({
      instructor_status: "APPROVED",
      head_status: "PENDING",
    });
  },
};

// --- topicService.ts ---
import type {
  CreateTopicRequest,
  ProposedTopic,
  StandardResponse,
} from "@/types/api";

export const topicService = {
  /**
   * Create a new topic for a thesis round (Instructor only)
   * POST /api/thesis-rounds/:roundId/topics
   */
  async createTopic(
    roundId: number,
    data: CreateTopicRequest,
  ): Promise<StandardResponse<ProposedTopic>> {
    return apiClient.post<StandardResponse<ProposedTopic>>(
      `/api/thesis-rounds/${roundId}/topics`,
      data,
    );
  },

  /**
   * Get topics for a thesis round
   * GET /api/thesis-rounds/:roundId/topics
   */
  async getTopics(
    roundId: number,
    params?: { isTaken?: boolean; instructorId?: number },
  ): Promise<StandardResponse<ProposedTopic[]>> {
    const queryParams = new URLSearchParams();
    if (params?.isTaken !== undefined)
      queryParams.append("isTaken", params.isTaken.toString());
    if (params?.instructorId)
      queryParams.append("instructorId", params.instructorId.toString());

    const queryString = queryParams.toString();
    return apiClient.get<StandardResponse<ProposedTopic[]>>(
      `/api/thesis-rounds/${roundId}/topics${queryString ? `?${queryString}` : ""}`,
    );
  },
};

// --- reviewScheduleService.ts ---
import type {
  ReviewScheduleItemData,
  AutoScheduleReviewsRequest,
} from "@/types/api";

export const reviewScheduleService = {
  /**
   * Lấy danh sách lịch phản biện
   * GET /api/admin/review-schedules
   */
  async getReviewSchedules(params?: {
    thesis_round_id?: number;
    status?: string;
    search?: string;
  }): Promise<ReviewScheduleItemData[]> {
    const query = new URLSearchParams();
    if (params?.thesis_round_id)
      query.append("thesisRoundId", params.thesis_round_id.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString();
    const res = await apiClient.get<any>(
      `/api/admin/review-schedules${queryString ? `?${queryString}` : ""}`,
    );
    return Array.isArray(res) ? res : res?.data || [];
  },

  /**
   * Lấy danh sách tất cả đề tài trong đợt để chọn xếp lịch
   * GET /api/admin/review-schedules/theses
   */
  async getThesesByRound(thesisRoundId: number): Promise<any[]> {
    const res = await apiClient.get<any>(
      `/api/admin/review-schedules/theses?thesisRoundId=${thesisRoundId}`,
    );
    return Array.isArray(res) ? res : res?.data || [];
  },

  /**
   * Tạo danh sách lịch phản biện
   * POST /api/admin/review-schedules
   */
  async createReviewSchedules(data: any[]): Promise<any> {
    return apiClient.post("/api/admin/review-schedules", data);
  },

  /**
   * Cập nhật lịch phản biện theo thesisId
   * PUT /api/admin/review-schedules/:thesisId
   */
  async updateReviewSchedule(thesisId: number, data: any): Promise<any> {
    return apiClient.put(`/api/admin/review-schedules/${thesisId}`, data);
  },

  /**
   * Hủy lịch phản biện
   * DELETE /api/admin/review-schedules/:thesisId
   */
  async deleteReviewSchedule(thesisId: number): Promise<any> {
    return apiClient.delete(`/api/admin/review-schedules/${thesisId}`);
  },

  /**
   * Xếp lịch phản biện tự động
   * POST /api/admin/review-schedules/auto
   */
  async autoScheduleReviews(data: AutoScheduleReviewsRequest): Promise<any> {
    return apiClient.post("/api/admin/review-schedules/auto", data);
  },
};

// ─── 1. Grade Review Service ────────────────────────────────────────────────
export const gradeReviewService = {
  async createReview(data: FormData | any) {
    return apiClient.post("/api/v1/thesis/student/grade-reviews", data);
  },
  async getStudentReviews() {
    const res = await apiClient.get<any>(
      "/api/v1/thesis/student/grade-reviews",
    );
    return Array.isArray(res) ? res : res?.data || [];
  },
  async getAdminReviews(params?: any) {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get<any>(
      `/api/v1/thesis/admin/grade-reviews${query ? `?${query}` : ""}`,
    );
    return Array.isArray(res) ? res : res?.data || [];
  },
  async assignInstructor(id: number, instructorId: number) {
    return apiClient.put(`/api/v1/thesis/afe-reviews/${id}/assign`, {
      instructor_id: instructorId,
    });
  },
  async getInstructorReviews() {
    const res = await apiClient.get<any>(
      "/api/v1/thesis/instructor/grade-reviews",
    );
    return Array.isArray(res) ? res : res?.data || [];
  },
  async reassessReview(
    id: number,
    data: { reassessed_score: number; reassessment_notes: string },
  ) {
    return apiClient.put(
      `/api/v1/thesis/instructor/grade-reviews/${id}/reassess`,
      data,
    );
  },
  async resolveReview(
    id: number,
    data: { status: string; head_feedback?: string; apply_score?: boolean },
  ) {
    return apiClient.put(
      `/api/v1/thesis/admin/grade-reviews/${id}/resolve`,
      data,
    );
  },
};

// ─── 2. Document & Repository Service ───────────────────────────────────────
export const documentService = {
  async getDocuments(params?: any) {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get<any>(
      `/api/v1/thesis/documents${query ? `?${query}` : ""}`,
    );
    return Array.isArray(res) ? res : res?.data || [];
  },
  async createDocument(data: FormData | any) {
    return apiClient.post("/api/v1/thesis/documents", data);
  },
  async downloadDocument(id: number) {
    return apiClient.get(`/api/v1/thesis/documents/${id}/download`);
  },
  async deleteDocument(id: number) {
    return apiClient.delete(`/api/v1/thesis/documents/${id}`);
  },
  async getRepository(params?: any) {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get<any>(
      `/api/v1/thesis/documents/repository${query ? `?${query}` : ""}`,
    );
    return Array.isArray(res) ? res : res?.data || [];
  },
  async getRepositoryById(id: number) {
    const res = await apiClient.get<any>(
      `/api/v1/thesis/documents/repository/${id}`,
    );
    return res?.data || res;
  },
  async publishThesis(thesisId: number) {
    return apiClient.post(
      `/api/v1/thesis/documents/repository/publish/${thesisId}`,
    );
  },
};

// ─── 3. Excel Batch Service ────────────────────────────────────────────────
export const excelBatchService = {
  async importStudents(formData: FormData) {
    return apiClient.post("/api/v1/thesis/excel/import/students", formData);
  },
  async importProposedTopics(formData: FormData) {
    return apiClient.post(
      "/api/v1/thesis/excel/import/proposed-topics",
      formData,
    );
  },
  getScoresExportUrl(thesisRoundId?: number | string) {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    return `${base}/api/v1/thesis/excel/export/scores?thesis_round_id=${thesisRoundId || "all"}`;
  },
  getDefenseScheduleExportUrl(thesisRoundId?: number | string) {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    return `${base}/api/v1/thesis/excel/export/defense-schedule?thesis_round_id=${thesisRoundId || "all"}`;
  },
};

// ─── 4. Survey Service ──────────────────────────────────────────────────────
export const surveyService = {
  async getActiveSurveys() {
    const res = await apiClient.get<any>("/api/v1/thesis/surveys/active");
    return Array.isArray(res) ? res : res?.data || [];
  },
  async getSurveyById(id: number) {
    const res = await apiClient.get<any>(`/api/v1/thesis/surveys/${id}`);
    return res?.data || res;
  },
  async submitSurvey(id: number, data: any) {
    return apiClient.post(`/api/v1/thesis/surveys/${id}/submit`, data);
  },
  async getAdminSurveys(params?: any) {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get<any>(
      `/api/v1/thesis/surveys/admin/list${query ? `?${query}` : ""}`,
    );
    return Array.isArray(res) ? res : res?.data || [];
  },
  async createSurvey(data: any) {
    return apiClient.post("/api/v1/thesis/surveys/admin/create", data);
  },
  async getSurveyAnalytics(id: number) {
    const res = await apiClient.get<any>(
      `/api/v1/thesis/surveys/admin/${id}/analytics`,
    );
    return res?.data || res;
  },
};

// ─── 5. Academic Ticket Service ─────────────────────────────────────────────
export const academicTicketService = {
  async createTicket(data: FormData | any) {
    return apiClient.post("/api/v1/thesis/student/tickets", data);
  },
  async getStudentTickets() {
    const res = await apiClient.get<any>("/api/v1/thesis/student/tickets");
    return Array.isArray(res) ? res : res?.data || [];
  },
  async getAdminTickets(params?: any) {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get<any>(
      `/api/v1/thesis/admin/tickets${query ? `?${query}` : ""}`,
    );
    return Array.isArray(res) ? res : res?.data || [];
  },
  async getTicketById(id: number) {
    const res = await apiClient.get<any>(`/api/v1/thesis/admin/tickets/${id}`);
    return res?.data || res;
  },
  async resolveTicket(
    id: number,
    data: {
      status: string;
      resolution_notes?: string;
      new_topic_title?: string;
    },
  ) {
    return apiClient.put(`/api/v1/thesis/admin/tickets/${id}/resolve`, data);
  },
};

// ─── 6. Announcement Service ───────────────────────────────────────────────
export const announcementService = {
  async getAnnouncements(params?: any) {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get<any>(
      `/api/v1/thesis/announcements${query ? `?${query}` : ""}`,
    );
    return Array.isArray(res) ? res : res?.data || [];
  },
  async getAnnouncementById(idOrSlug: string | number) {
    const res = await apiClient.get<any>(
      `/api/v1/thesis/announcements/${idOrSlug}`,
    );
    return res?.data || res;
  },
  async createAnnouncement(data: FormData | any) {
    return apiClient.post("/api/v1/thesis/announcements", data);
  },
  async updateAnnouncement(id: number, data: FormData | any) {
    return apiClient.put(`/api/v1/thesis/announcements/${id}`, data);
  },
  async deleteAnnouncement(id: number) {
    return apiClient.delete(`/api/v1/thesis/announcements/${id}`);
  },
};
