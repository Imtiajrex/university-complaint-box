import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, AuthContextType } from '../types';
import { api } from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  // On mount, if token exists try fetching /me
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { data: meData, isLoading: meLoading, error: meError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.me(),
    enabled: Boolean(token),
    retry: 1,
  });

  useEffect(() => {
    if (meData) {
      const mapped: User = {
        id: meData.id,
        name: meData.name,
        email: meData.email,
        role: meData.role,
        department: meData.department,
        studentId: meData.studentId,
      };
      setUser(mapped);
      setIsLoading(false);
    } else if (!token) {
      setIsLoading(false);
    }
  }, [meData, token]);

  useEffect(() => {
    if (meError) {
      setError(meError instanceof Error ? meError.message : 'Failed to authenticate');
      setIsLoading(false);
    }
  }, [meError]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
  });

  const registerMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; password: string; role: 'student'|'admin'; department?: string; studentId?: string }) => api.register(payload),
  });

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await loginMutation.mutateAsync({ email, password });
      localStorage.setItem('token', resp.access_token);
      // refetch /me
      const me = await api.me();
      const mapped: User = {
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        department: me.department,
        studentId: me.studentId,
      };
      setUser(mapped);
      localStorage.setItem('user', JSON.stringify(mapped));
      await qc.invalidateQueries({ queryKey: ['complaints'] });
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'student' | 'admin',
    department?: string,
    studentId?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await registerMutation.mutateAsync({ name, email, password, role, department, studentId });
      localStorage.setItem('token', resp.access_token);
      const me = await api.me();
      const mapped: User = {
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        department: me.department,
        studentId: me.studentId,
      };
      setUser(mapped);
      localStorage.setItem('user', JSON.stringify(mapped));
      await qc.invalidateQueries({ queryKey: ['complaints'] });
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    qc.clear();
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading: isLoading || meLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};