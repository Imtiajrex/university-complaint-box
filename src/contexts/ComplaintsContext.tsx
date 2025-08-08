import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Complaint, ComplaintStatus, ComplaintsContextType } from '../types';
import { complaints as mockComplaints } from '../data/mockData';
import { useAuth } from './AuthContext';

const ComplaintsContext = createContext<ComplaintsContextType | undefined>(undefined);

export const useComplaints = () => {
  const context = useContext(ComplaintsContext);
  if (context === undefined) {
    throw new Error('useComplaints must be used within a ComplaintsProvider');
  }
  return context;
};

type ComplaintsProviderProps = {
  children: ReactNode;
};

export const ComplaintsProvider: React.FC<ComplaintsProviderProps> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Load complaints
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      setComplaints(mockComplaints);
    } catch (err) {
      setError('Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addComplaint = (
    complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'responses'>
  ) => {
    if (!user) return;
    
    const newComplaint: Complaint = {
      ...complaintData,
      id: `c${complaints.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: [],
    };
    
    setComplaints(prev => [newComplaint, ...prev]);
  };

  const updateComplaintStatus = (complaintId: string, status: ComplaintStatus) => {
    if (!user || user.role !== 'admin') return;
    
    setComplaints(prev =>
      prev.map(complaint =>
        complaint.id === complaintId
          ? { ...complaint, status, updatedAt: new Date() }
          : complaint
      )
    );
  };

  const addResponse = (complaintId: string, content: string) => {
    if (!user || user.role !== 'admin') return;
    
    setComplaints(prev =>
      prev.map(complaint => {
        if (complaint.id === complaintId) {
          const newResponse = {
            id: `r${complaint.responses.length + 1}`,
            content,
            createdAt: new Date(),
            adminName: user.name,
            adminId: user.id,
          };
          
          return {
            ...complaint,
            responses: [...complaint.responses, newResponse],
            updatedAt: new Date(),
          };
        }
        return complaint;
      })
    );
  };

  const addFeedback = (complaintId: string, rating: number, comment: string) => {
    if (!user || user.role !== 'student') return;
    
    setComplaints(prev =>
      prev.map(complaint =>
        complaint.id === complaintId
          ? {
              ...complaint,
              feedback: { rating, comment },
              updatedAt: new Date(),
            }
          : complaint
      )
    );
  };

  const value = {
    complaints,
    addComplaint,
    updateComplaintStatus,
    addResponse,
    addFeedback,
    isLoading,
    error,
  };

  return <ComplaintsContext.Provider value={value}>{children}</ComplaintsContext.Provider>;
};