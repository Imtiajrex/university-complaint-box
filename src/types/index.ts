export type User = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  department?: string;
  studentId?: string;
};

export type ComplaintStatus = 'pending' | 'under-review' | 'in-progress' | 'resolved' | 'rejected';

export type ComplaintCategory = 
  | 'academic' 
  | 'administrative' 
  | 'facilities' 
  | 'technical' 
  | 'other';

export type Department = 
  | 'computer-science' 
  | 'engineering' 
  | 'business' 
  | 'arts' 
  | 'sciences' 
  | 'student-affairs' 
  | 'facilities-management' 
  | 'it-services'
  | 'other';

export type Complaint = {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  department: Department;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  studentId: string;
  studentName: string | null; // null if anonymous
  isAnonymous: boolean;
  responses: ComplaintResponse[];
  feedback?: {
    rating: number;
    comment: string;
  };
};

export type ComplaintResponse = {
  id: string;
  content: string;
  createdAt: Date;
  adminName: string;
  adminId: string;
};

export type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'student' | 'admin', department?: string, studentId?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
};

export type ComplaintsContextType = {
  complaints: Complaint[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) => void;
  updateComplaintStatus: (complaintId: string, status: ComplaintStatus) => void;
  addResponse: (complaintId: string, content: string) => void;
  addFeedback: (complaintId: string, rating: number, comment: string) => void;
  isLoading: boolean;
  error: string | null;
};