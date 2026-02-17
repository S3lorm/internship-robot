// User types
export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  studentId?: string;
  phone?: string;
  department?: string;
  program?: string;
  yearOfStudy?: number;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Internship types
export type InternshipStatus = 'draft' | 'published' | 'closed' | 'archived';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  duration: string;
  stipend?: string;
  applicationDeadline: string;
  startDate: string;
  endDate?: string;
  slots: number;
  applicationsCount: number;
  status: InternshipStatus;
  category: string;
  isRemote: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Application {
  id: string;
  internshipId: string;
  internship?: Internship;
  studentId: string;
  student?: User;
  coverLetter: string;
  cvUrl: string;
  status: ApplicationStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Regional company (apply via email)
export interface RegionalCompany {
  id: string;
  name: string;
  region: string;
  email: string;
  industry: string;
  description?: string;
}

// Notice/Announcement types
export type NoticeType = 'general' | 'deadline' | 'urgent' | 'info';
export type NoticePriority = 'low' | 'medium' | 'high';

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  priority: NoticePriority;
  targetAudience: 'all' | 'students' | 'admins';
  publishDate: string;
  expiryDate?: string;
  isPinned: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export type NotificationType = 'application_status' | 'new_internship' | 'deadline_reminder' | 'announcement';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Analytics types
export interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalInternships: number;
  activeInternships: number;
  totalStudents: number;
  applicationsThisMonth: number;
}

export interface ApplicationsByMonth {
  month: string;
  applications: number;
  approved: number;
  rejected: number;
}

export interface InternshipsByCategory {
  category: string;
  count: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  studentId: string;
  department: string;
  program: string;
  yearOfStudy: number;
  phone: string;
}

export interface InternshipFormData {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  duration: string;
  stipend?: string;
  applicationDeadline: string;
  startDate: string;
  endDate?: string;
  slots: number;
  category: string;
  isRemote: boolean;
  status: InternshipStatus;
}

export interface ApplicationFormData {
  internshipId: string;
  coverLetter: string;
  cvFile: File | null;
}

export interface NoticeFormData {
  title: string;
  content: string;
  type: NoticeType;
  priority: NoticePriority;
  targetAudience: 'all' | 'students' | 'admins';
  publishDate: string;
  expiryDate?: string;
  isPinned: boolean;
}

// Filter types
export interface InternshipFilters {
  search?: string;
  category?: string;
  location?: string;
  isRemote?: boolean;
  status?: InternshipStatus;
}

export interface ApplicationFilters {
  search?: string;
  status?: ApplicationStatus;
  internshipId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
