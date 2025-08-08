import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

const AuthLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // If logged in, redirect to dashboard
  if (user && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <MessageSquare size={32} className="text-white" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
            University Complaint Box
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Submit and track complaints securely and efficiently
          </p>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;