export interface InstructorItem {
  id: number;
  user_id: number;
  instructor_code: string;
  department_id: number;
  degree?: string;
  academic_title?: string;
  specialization?: string;
  years_of_experience?: number;
  status?: boolean;
  full_name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  department?: {
    id: number;
    department_code: string;
    department_name: string;
  };
}
