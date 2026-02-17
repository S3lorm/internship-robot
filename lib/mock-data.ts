import type { 
  Internship, 
  Application, 
  Notice, 
  Notification, 
  DashboardStats,
  ApplicationsByMonth,
  InternshipsByCategory,
  User,
  RegionalCompany
} from '@/types';

// Companies by region - apply via email
export const mockRegionalCompanies: RegionalCompany[] = [
  { id: 'rc1', name: 'Ghana Ports and Harbours Authority', region: 'Tema', email: 'hr@gpfa.gov.gh', industry: 'Marine Engineering' },
  { id: 'rc2', name: 'Maersk Ghana Ltd', region: 'Accra', email: 'careers.ghana@maersk.com', industry: 'Shipping & Logistics' },
  { id: 'rc3', name: 'Tema Port Authority', region: 'Tema', email: 'internships@temaport.gov.gh', industry: 'Safety & Security' },
  { id: 'rc4', name: 'Blue Ocean Technologies', region: 'Accra', email: 'recruit@blueocean.tech', industry: 'Information Technology' },
  { id: 'rc5', name: 'RMU Research Department', region: 'Accra', email: 'research@rmu.edu.gh', industry: 'Research' },
  { id: 'rc6', name: 'Western Region Port Services', region: 'Takoradi', email: 'hr@wrps.com.gh', industry: 'Port Management' },
];

// Mock Internships
export const mockInternships: Internship[] = [
  {
    id: '1',
    title: 'Marine Engineering Intern',
    company: 'Ghana Ports and Harbours Authority',
    location: 'Tema, Ghana',
    description: 'Join our marine engineering team to gain hands-on experience in port operations, vessel maintenance, and maritime engineering projects. You will work alongside experienced engineers on real-world projects.',
    requirements: [
      'Currently enrolled in Marine Engineering or related program',
      'Minimum 2nd year student',
      'Strong analytical and problem-solving skills',
      'Good communication skills',
      'Willingness to learn and adapt'
    ],
    responsibilities: [
      'Assist in vessel inspection and maintenance',
      'Support engineering documentation',
      'Participate in port infrastructure projects',
      'Conduct safety compliance checks',
      'Prepare technical reports'
    ],
    duration: '3 months',
    stipend: 'GHS 1,500/month',
    applicationDeadline: '2026-02-28T23:59:59Z',
    startDate: '2026-03-15T00:00:00Z',
    endDate: '2026-06-15T00:00:00Z',
    slots: 5,
    applicationsCount: 23,
    status: 'published',
    category: 'Marine Engineering',
    isRemote: false,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
    createdBy: '2'
  },
  {
    id: '2',
    title: 'Shipping Operations Trainee',
    company: 'Maersk Ghana Ltd',
    location: 'Accra, Ghana',
    description: 'Gain comprehensive exposure to international shipping operations, logistics management, and supply chain processes at one of the world\'s leading shipping companies.',
    requirements: [
      'Studying Nautical Science, Maritime Studies, or Logistics',
      'Strong organizational skills',
      'Proficiency in Microsoft Office',
      'Interest in global trade and logistics',
      'Team player with good interpersonal skills'
    ],
    responsibilities: [
      'Support daily shipping operations',
      'Track and monitor cargo movements',
      'Assist in documentation and customs clearance',
      'Coordinate with internal teams and clients',
      'Learn shipping software systems'
    ],
    duration: '6 months',
    stipend: 'GHS 2,000/month',
    applicationDeadline: '2026-03-15T23:59:59Z',
    startDate: '2026-04-01T00:00:00Z',
    slots: 3,
    applicationsCount: 45,
    status: 'published',
    category: 'Shipping & Logistics',
    isRemote: false,
    createdAt: '2026-01-08T10:00:00Z',
    updatedAt: '2026-01-08T10:00:00Z',
    createdBy: '2'
  },
  {
    id: '3',
    title: 'Naval Architecture Research Assistant',
    company: 'RMU Research Department',
    location: 'Accra, Ghana',
    description: 'Assist in cutting-edge research projects related to ship design, hull optimization, and marine vehicle development.',
    requirements: [
      'Enrolled in Naval Architecture or Marine Engineering',
      'Strong mathematics background',
      'Experience with CAD software preferred',
      'Research aptitude',
      'Attention to detail'
    ],
    responsibilities: [
      'Conduct literature reviews',
      'Assist in computational modeling',
      'Collect and analyze research data',
      'Prepare presentations and reports',
      'Participate in team meetings'
    ],
    duration: '4 months',
    stipend: 'GHS 1,200/month',
    applicationDeadline: '2026-02-15T23:59:59Z',
    startDate: '2026-03-01T00:00:00Z',
    slots: 2,
    applicationsCount: 12,
    status: 'published',
    category: 'Research',
    isRemote: true,
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-05T10:00:00Z',
    createdBy: '2'
  },
  {
    id: '4',
    title: 'Port Safety & Security Intern',
    company: 'Tema Port Authority',
    location: 'Tema, Ghana',
    description: 'Learn about maritime security protocols, safety management systems, and risk assessment in port operations.',
    requirements: [
      'Studying Maritime Safety or related field',
      'Interest in safety and security management',
      'Good observation skills',
      'Physical fitness',
      'Ability to work in shifts'
    ],
    responsibilities: [
      'Assist in safety inspections',
      'Monitor security protocols',
      'Document safety incidents',
      'Participate in emergency drills',
      'Support safety training sessions'
    ],
    duration: '3 months',
    stipend: 'GHS 1,300/month',
    applicationDeadline: '2026-01-31T23:59:59Z',
    startDate: '2026-02-15T00:00:00Z',
    slots: 4,
    applicationsCount: 18,
    status: 'published',
    category: 'Safety & Security',
    isRemote: false,
    createdAt: '2026-01-03T10:00:00Z',
    updatedAt: '2026-01-03T10:00:00Z',
    createdBy: '2'
  },
  {
    id: '5',
    title: 'Maritime IT Support Intern',
    company: 'Blue Ocean Technologies',
    location: 'Remote',
    description: 'Support maritime IT systems, vessel tracking software, and communication systems used in the shipping industry.',
    requirements: [
      'IT or Computer Science background',
      'Interest in maritime technology',
      'Basic networking knowledge',
      'Problem-solving skills',
      'Good communication skills'
    ],
    responsibilities: [
      'Provide technical support to users',
      'Assist in system maintenance',
      'Document technical issues',
      'Test software updates',
      'Create user guides'
    ],
    duration: '4 months',
    stipend: 'GHS 1,800/month',
    applicationDeadline: '2026-03-01T23:59:59Z',
    startDate: '2026-03-20T00:00:00Z',
    slots: 2,
    applicationsCount: 31,
    status: 'published',
    category: 'Information Technology',
    isRemote: true,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
    createdBy: '2'
  }
];

// Mock Applications
export const mockApplications: Application[] = [
  {
    id: '1',
    internshipId: '1',
    internship: mockInternships[0],
    studentId: '1',
    coverLetter: 'I am excited to apply for this Marine Engineering internship position...',
    cvUrl: '/uploads/cv/john_mensah_cv.pdf',
    status: 'pending',
    createdAt: '2026-01-15T14:30:00Z',
    updatedAt: '2026-01-15T14:30:00Z',
  },
  {
    id: '2',
    internshipId: '2',
    internship: mockInternships[1],
    studentId: '1',
    coverLetter: 'With my background in nautical science, I believe I would be a great fit...',
    cvUrl: '/uploads/cv/john_mensah_cv.pdf',
    status: 'approved',
    adminNotes: 'Strong candidate with relevant experience',
    reviewedBy: '2',
    reviewedAt: '2026-01-16T10:00:00Z',
    createdAt: '2026-01-14T09:00:00Z',
    updatedAt: '2026-01-16T10:00:00Z',
  },
  {
    id: '3',
    internshipId: '3',
    internship: mockInternships[2],
    studentId: '1',
    coverLetter: 'I am passionate about research and would love to contribute...',
    cvUrl: '/uploads/cv/john_mensah_cv.pdf',
    status: 'under_review',
    createdAt: '2026-01-13T11:00:00Z',
    updatedAt: '2026-01-17T08:00:00Z',
  }
];

// Mock Notices
export const mockNotices: Notice[] = [
  {
    id: '1',
    title: 'Internship Application Portal Opens for 2026 Academic Year',
    content: 'We are pleased to announce that the internship application portal is now open for the 2026 academic year. Students in their 2nd year and above are encouraged to browse available opportunities and submit their applications. The application deadline varies by internship, so please check individual listings for specific dates.',
    type: 'general',
    priority: 'high',
    targetAudience: 'students',
    publishDate: '2026-01-10T00:00:00Z',
    isPinned: true,
    isActive: true,
    createdBy: '2',
    createdAt: '2026-01-09T10:00:00Z',
    updatedAt: '2026-01-09T10:00:00Z',
  },
  {
    id: '2',
    title: 'Deadline Reminder: Ghana Ports Internship Application',
    content: 'This is a reminder that applications for the Marine Engineering Intern position at Ghana Ports and Harbours Authority close on February 28, 2026. Ensure your application is complete with all required documents before the deadline.',
    type: 'deadline',
    priority: 'high',
    targetAudience: 'students',
    publishDate: '2026-01-18T00:00:00Z',
    expiryDate: '2026-02-28T23:59:59Z',
    isPinned: false,
    isActive: true,
    createdBy: '2',
    createdAt: '2026-01-18T08:00:00Z',
    updatedAt: '2026-01-18T08:00:00Z',
  },
  {
    id: '3',
    title: 'CV Writing Workshop - January 25th',
    content: 'Join us for a comprehensive CV writing workshop designed specifically for maritime students. Learn how to highlight your skills, experiences, and achievements effectively. The workshop will be held in the Main Auditorium from 10:00 AM to 2:00 PM.',
    type: 'info',
    priority: 'medium',
    targetAudience: 'students',
    publishDate: '2026-01-15T00:00:00Z',
    expiryDate: '2026-01-25T23:59:59Z',
    isPinned: false,
    isActive: true,
    createdBy: '2',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    id: '4',
    title: 'New Partnership with Maersk Ghana',
    content: 'We are excited to announce a new partnership with Maersk Ghana Ltd that will provide more internship opportunities for our students in shipping operations and logistics. This partnership demonstrates our commitment to providing world-class practical experience.',
    type: 'general',
    priority: 'medium',
    targetAudience: 'all',
    publishDate: '2026-01-08T00:00:00Z',
    isPinned: false,
    isActive: true,
    createdBy: '2',
    createdAt: '2026-01-08T10:00:00Z',
    updatedAt: '2026-01-08T10:00:00Z',
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'Application Approved',
    message: 'Congratulations! Your application for Shipping Operations Trainee at Maersk Ghana Ltd has been approved.',
    type: 'application_status',
    isRead: false,
    link: '/dashboard/applications/2',
    createdAt: '2026-01-16T10:00:00Z',
  },
  {
    id: '2',
    userId: '1',
    title: 'New Internship Posted',
    message: 'A new internship opportunity "Maritime IT Support Intern" at Blue Ocean Technologies has been posted.',
    type: 'new_internship',
    isRead: false,
    link: '/dashboard/internships/5',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: '3',
    userId: '1',
    title: 'Application Under Review',
    message: 'Your application for Naval Architecture Research Assistant is now under review.',
    type: 'application_status',
    isRead: true,
    link: '/dashboard/applications/3',
    createdAt: '2026-01-17T08:00:00Z',
  },
  {
    id: '4',
    userId: '1',
    title: 'Deadline Approaching',
    message: 'The application deadline for Port Safety & Security Intern is in 5 days.',
    type: 'deadline_reminder',
    isRead: true,
    link: '/dashboard/internships/4',
    createdAt: '2026-01-26T09:00:00Z',
  }
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalApplications: 156,
  pendingApplications: 42,
  approvedApplications: 78,
  rejectedApplications: 36,
  totalInternships: 12,
  activeInternships: 5,
  totalStudents: 234,
  applicationsThisMonth: 45,
};

// Mock Applications by Month
export const mockApplicationsByMonth: ApplicationsByMonth[] = [
  { month: 'Aug', applications: 28, approved: 18, rejected: 6 },
  { month: 'Sep', applications: 45, approved: 32, rejected: 8 },
  { month: 'Oct', applications: 38, approved: 25, rejected: 9 },
  { month: 'Nov', applications: 52, approved: 35, rejected: 12 },
  { month: 'Dec', applications: 34, approved: 22, rejected: 8 },
  { month: 'Jan', applications: 45, approved: 28, rejected: 10 },
];

// Mock Internships by Category
export const mockInternshipsByCategory: InternshipsByCategory[] = [
  { category: 'Marine Engineering', count: 4 },
  { category: 'Shipping & Logistics', count: 3 },
  { category: 'Research', count: 2 },
  { category: 'Safety & Security', count: 2 },
  { category: 'Information Technology', count: 1 },
];

// Mock Students for Admin
export const mockStudents: User[] = [
  {
    id: '1',
    email: 'john.mensah@st.rmu.edu.gh',
    firstName: 'John',
    lastName: 'Mensah',
    role: 'student',
    studentId: 'RMU/2024/001',
    phone: '+233 24 123 4567',
    department: 'Marine Engineering',
    program: 'BSc Marine Engineering',
    yearOfStudy: 3,
    isEmailVerified: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    email: 'akua.asante@st.rmu.edu.gh',
    firstName: 'Akua',
    lastName: 'Asante',
    role: 'student',
    studentId: 'RMU/2024/015',
    phone: '+233 24 987 6543',
    department: 'Nautical Science',
    program: 'BSc Nautical Science',
    yearOfStudy: 4,
    isEmailVerified: true,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '4',
    email: 'kwame.owusu@st.rmu.edu.gh',
    firstName: 'Kwame',
    lastName: 'Owusu',
    role: 'student',
    studentId: 'RMU/2024/022',
    phone: '+233 20 555 1234',
    department: 'Port Management',
    program: 'BSc Port & Shipping Administration',
    yearOfStudy: 2,
    isEmailVerified: true,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '5',
    email: 'ama.darko@st.rmu.edu.gh',
    firstName: 'Ama',
    lastName: 'Darko',
    role: 'student',
    studentId: 'RMU/2024/030',
    phone: '+233 27 333 4444',
    department: 'Marine Engineering',
    program: 'BSc Marine Engineering',
    yearOfStudy: 3,
    isEmailVerified: false,
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-10T10:00:00Z',
  }
];

// Mock Users (includes both students and admins)
export const mockUsers: User[] = [
  ...mockStudents,
  {
    id: '2',
    email: 'admin@rmu.edu.gh',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isEmailVerified: true,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  }
];

// Categories for internships
export const internshipCategories = [
  'Marine Engineering',
  'Shipping & Logistics',
  'Nautical Science',
  'Port Management',
  'Safety & Security',
  'Information Technology',
  'Research',
  'Administration',
];

// Departments at RMU
export const departments = [
  'Marine Engineering',
  'Nautical Science',
  'Port & Shipping Administration',
  'Maritime Safety & Security',
  'Electrical/Electronic Engineering',
  'Computer Science',
];

// Programs at RMU
export const programs = [
  'BSc Marine Engineering',
  'BSc Nautical Science',
  'BSc Port & Shipping Administration',
  'BSc Maritime Safety & Security',
  'BSc Electrical/Electronic Engineering',
  'BSc Computer Science',
  'Diploma in Maritime Studies',
];
