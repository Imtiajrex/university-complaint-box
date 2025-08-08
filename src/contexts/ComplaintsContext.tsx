import React, { createContext, useContext, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Complaint, ComplaintStatus, ComplaintsContextType } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

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
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', user?.id],
    queryFn: async () => {
      const list = await api.getComplaints();
      // map date strings to Date objects to match types
      const mapped: Complaint[] = list.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        responses: (c.responses || []).map((r: any) => ({ ...r, createdAt: new Date(r.createdAt) })),
      }));
      return mapped;
    },
    enabled: Boolean(user),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) =>
      api.createComplaint({
        title: payload.title,
        description: payload.description,
        category: payload.category,
        department: payload.department,
        isAnonymous: payload.isAnonymous,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ complaintId, status }: { complaintId: string; status: ComplaintStatus }) =>
      api.updateComplaintStatus(complaintId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });

  const responseMutation = useMutation({
    mutationFn: ({ complaintId, content }: { complaintId: string; content: string }) =>
      api.addResponse(complaintId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ complaintId, rating, comment }: { complaintId: string; rating: number; comment: string }) =>
      api.addFeedback(complaintId, rating, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });

  const addComplaint = (
    complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'responses'>
  ) => {
    if (!user) return;
    createMutation.mutate(complaintData as any);
  };

  const updateComplaintStatus = (complaintId: string, status: ComplaintStatus) => {
    if (!user || user.role !== 'admin') return;
    statusMutation.mutate({ complaintId, status });
  };

  const addResponse = (complaintId: string, content: string) => {
    if (!user || user.role !== 'admin') return;
    responseMutation.mutate({ complaintId, content });
  };

  const addFeedback = (complaintId: string, rating: number, comment: string) => {
    if (!user || user.role !== 'student') return;
    feedbackMutation.mutate({ complaintId, rating, comment });
  };

  const value: ComplaintsContextType = {
    complaints: data || [],
    addComplaint,
    updateComplaintStatus,
    addResponse,
    addFeedback,
    isLoading: isLoading,
    error: error ? (error as any).message || 'Failed to load complaints' : null,
  };

  return <ComplaintsContext.Provider value={value}>{children}</ComplaintsContext.Provider>;
};