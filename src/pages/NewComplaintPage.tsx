import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ComplaintForm from '../components/complaints/ComplaintForm';

const NewComplaintPage: React.FC = () => {
  const { user } = useAuth();
  
  // If user is not a student, they shouldn't be here
  if (user?.role !== 'student') {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">
          Only students can submit complaints.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit a New Complaint</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill out the form below to submit your complaint to the university administration.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <ComplaintForm />
      </div>
    </div>
  );
};

export default NewComplaintPage;