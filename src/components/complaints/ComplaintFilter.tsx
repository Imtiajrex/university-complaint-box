import React from 'react';
import Select from '../ui/Select';
import { ComplaintCategory, ComplaintStatus, Department } from '../../types';
import { allCategories, allDepartments, allStatuses, getCategoryLabel, getDepartmentLabel, getStatusLabel } from '../../data/mockData';

interface ComplaintFilterProps {
  category: ComplaintCategory | 'all';
  setCategory: (category: ComplaintCategory | 'all') => void;
  status: ComplaintStatus | 'all';
  setStatus: (status: ComplaintStatus | 'all') => void;
  department: Department | 'all';
  setDepartment: (department: Department | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ComplaintFilter: React.FC<ComplaintFilterProps> = ({
  category,
  setCategory,
  status,
  setStatus,
  department,
  setDepartment,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h3 className="font-medium text-gray-800 mb-3">Filter Complaints</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as ComplaintStatus | 'all')}
          options={[
            { value: 'all', label: 'All Statuses' },
            ...allStatuses.map(s => ({ value: s, label: getStatusLabel(s) }))
          ]}
        />
        
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as ComplaintCategory | 'all')}
          options={[
            { value: 'all', label: 'All Categories' },
            ...allCategories.map(c => ({ value: c, label: getCategoryLabel(c) }))
          ]}
        />
        
        <Select
          value={department}
          onChange={(e) => setDepartment(e.target.value as Department | 'all')}
          options={[
            { value: 'all', label: 'All Departments' },
            ...allDepartments.map(d => ({ value: d, label: getDepartmentLabel(d) }))
          ]}
        />
      </div>
    </div>
  );
};

export default ComplaintFilter;