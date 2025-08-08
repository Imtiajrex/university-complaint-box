import { User, Complaint, ComplaintStatus, ComplaintCategory, Department } from "../types";

// Mock users data
export const users: User[] = [
  {
    id: "u1",
    name: "John Doe",
    email: "student@example.com",
    role: "student",
    studentId: "STU001",
    department: "computer-science"
  },
  {
    id: "u2",
    name: "Jane Smith",
    email: "admin@example.com",
    role: "admin",
    department: "computer-science"
  }
];

// Helper function to generate a random date within the last 30 days
const randomDate = (start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Mock complaints data
export const complaints: Complaint[] = [
  {
    id: "c1",
    title: "Slow Wi-Fi in Library",
    description: "The Wi-Fi connection in the main library is extremely slow during peak hours. This is affecting my ability to research and complete assignments.",
    category: "technical",
    department: "it-services",
    status: "pending",
    createdAt: randomDate(),
    updatedAt: randomDate(),
    studentId: "u1",
    studentName: "John Doe",
    isAnonymous: false,
    responses: []
  },
  {
    id: "c2",
    title: "Broken AC in Room 302",
    description: "The air conditioning in Room 302 of the Engineering building has been broken for two weeks now. The room is too hot for classes.",
    category: "facilities",
    department: "facilities-management",
    status: "in-progress",
    createdAt: randomDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
    updatedAt: randomDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    studentId: "u1",
    studentName: "John Doe",
    isAnonymous: false,
    responses: [
      {
        id: "r1",
        content: "We have dispatched a technician to inspect the issue.",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        adminName: "Jane Smith",
        adminId: "u2"
      }
    ]
  },
  {
    id: "c3",
    title: "Issue with Course Registration",
    description: "I'm unable to register for CS401 even though I've completed all prerequisites.",
    category: "academic",
    department: "computer-science",
    status: "resolved",
    createdAt: randomDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
    updatedAt: randomDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    studentId: "u1",
    studentName: "John Doe",
    isAnonymous: false,
    responses: [
      {
        id: "r2",
        content: "We've checked your record and fixed the issue. You should be able to register now.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        adminName: "Jane Smith",
        adminId: "u2"
      }
    ],
    feedback: {
      rating: 4,
      comment: "Issue was resolved, but it took longer than expected."
    }
  },
  {
    id: "c4",
    title: "Concerns about Exam Schedule",
    description: "The final exams for CS301 and MATH201 are scheduled at the same time. I need help resolving this conflict.",
    category: "academic",
    department: "computer-science",
    status: "under-review",
    createdAt: randomDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    updatedAt: randomDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    studentId: "u1",
    studentName: null,
    isAnonymous: true,
    responses: []
  },
  {
    id: "c5",
    title: "Poor Cafeteria Food Quality",
    description: "The quality of food in the main cafeteria has deteriorated significantly in the last month.",
    category: "facilities",
    department: "student-affairs",
    status: "rejected",
    createdAt: randomDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
    updatedAt: randomDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)),
    studentId: "u1",
    studentName: "John Doe",
    isAnonymous: false,
    responses: [
      {
        id: "r3",
        content: "After investigation, we found that the food meets university standards. However, we'll continue monitoring the situation.",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        adminName: "Jane Smith",
        adminId: "u2"
      }
    ]
  }
];

export const getCategoryLabel = (category: ComplaintCategory): string => {
  const labels: Record<ComplaintCategory, string> = {
    'academic': 'Academic',
    'administrative': 'Administrative',
    'facilities': 'Facilities',
    'technical': 'Technical',
    'other': 'Other'
  };
  return labels[category];
};

export const getDepartmentLabel = (department: Department): string => {
  const labels: Record<Department, string> = {
    'computer-science': 'Computer Science',
    'engineering': 'Engineering',
    'business': 'Business',
    'arts': 'Arts',
    'sciences': 'Sciences',
    'student-affairs': 'Student Affairs',
    'facilities-management': 'Facilities Management',
    'it-services': 'IT Services',
    'other': 'Other'
  };
  return labels[department];
};

export const getStatusLabel = (status: ComplaintStatus): string => {
  const labels: Record<ComplaintStatus, string> = {
    'pending': 'Pending',
    'under-review': 'Under Review',
    'in-progress': 'In Progress',
    'resolved': 'Resolved',
    'rejected': 'Rejected'
  };
  return labels[status];
};

export const getStatusColor = (status: ComplaintStatus): string => {
  const colors: Record<ComplaintStatus, string> = {
    'pending': 'bg-amber-100 text-amber-800 border-amber-300',
    'under-review': 'bg-blue-100 text-blue-800 border-blue-300',
    'in-progress': 'bg-purple-100 text-purple-800 border-purple-300',
    'resolved': 'bg-green-100 text-green-800 border-green-300',
    'rejected': 'bg-red-100 text-red-800 border-red-300'
  };
  return colors[status];
};

export const allCategories: ComplaintCategory[] = [
  'academic', 'administrative', 'facilities', 'technical', 'other'
];

export const allDepartments: Department[] = [
  'computer-science', 'engineering', 'business', 'arts', 'sciences', 
  'student-affairs', 'facilities-management', 'it-services', 'other'
];

export const allStatuses: ComplaintStatus[] = [
  'pending', 'under-review', 'in-progress', 'resolved', 'rejected'
];