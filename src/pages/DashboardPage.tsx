import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useComplaints } from '../contexts/ComplaintsContext';
import { Complaint, ComplaintCategory, ComplaintStatus, Department } from '../types';
import ComplaintCard from '../components/complaints/ComplaintCard';
import ComplaintFilter from '../components/complaints/ComplaintFilter';
import { AlertCircle } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { complaints, isLoading, error } = useComplaints();

  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [category, setCategory] = useState<ComplaintCategory | 'all'>('all');
  const [status, setStatus] = useState<ComplaintStatus | 'all'>('all');
  const [department, setDepartment] = useState<Department | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const isAdmin = user?.role === 'admin';

  // Filter and sort complaints based on filter settings
  useEffect(() => {
    let filtered = [...complaints];
    
    // If user is a student, only show their complaints
    if (!isAdmin) {
      filtered = filtered.filter(complaint => complaint.studentId === user?.id);
    }
    
    // Apply filters
    if (category !== 'all') {
      filtered = filtered.filter(complaint => complaint.category === category);
    }
    
    if (status !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === status);
    }
    
    if (department !== 'all') {
      filtered = filtered.filter(complaint => complaint.department === department);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        complaint => 
          complaint.title.toLowerCase().includes(query) || 
          complaint.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered = filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });
    
    setFilteredComplaints(filtered);
  }, [complaints, category, status, department, searchQuery, sortOrder, user, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md flex items-center">
        <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Admin Dashboard' : 'Your Complaints'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {isAdmin 
            ? 'Manage and respond to student complaints' 
            : 'View and track the status of your submitted complaints'}
        </p>
      </div>

      <ComplaintFilter
        category={category}
        setCategory={setCategory}
        status={status}
        setStatus={setStatus}
        department={department}
        setDepartment={setDepartment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <span className="text-sm text-gray-600">
            Showing {filteredComplaints.length} complaints
          </span>
        </div>
        <div>
          <label className="text-sm text-gray-600 mr-2">Sort by:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>
      
      {filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-600">
            {isAdmin 
              ? 'There are no complaints matching your current filters'
              : 'You have not submitted any complaints yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard 
              key={complaint.id} 
              complaint={complaint} 
              isAdmin={isAdmin} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;