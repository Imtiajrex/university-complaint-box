import React, { useState } from 'react';
import { useComplaints } from '../contexts/ComplaintsContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Select from '../components/ui/Select';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ComplaintCategory, ComplaintStatus, Department } from '../types';
import { getCategoryLabel, getDepartmentLabel, getStatusLabel } from '../data/mockData';

const AnalyticsPage: React.FC = () => {
  const { complaints } = useComplaints();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Calculate statistics
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const averageResponseTime = "2.5 days"; // Mock data

  // Calculate category distribution
  const categoryDistribution = complaints.reduce((acc, complaint) => {
    acc[complaint.category] = (acc[complaint.category] || 0) + 1;
    return acc;
  }, {} as Record<ComplaintCategory, number>);

  // Calculate department distribution
  const departmentDistribution = complaints.reduce((acc, complaint) => {
    acc[complaint.department] = (acc[complaint.department] || 0) + 1;
    return acc;
  }, {} as Record<Department, number>);

  // Calculate status distribution
  const statusDistribution = complaints.reduce((acc, complaint) => {
    acc[complaint.status] = (acc[complaint.status] || 0) + 1;
    return acc;
  }, {} as Record<ComplaintStatus, number>);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Comprehensive overview of complaint statistics and trends
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
          options={[
            { value: 'week', label: 'Last 7 Days' },
            { value: 'month', label: 'Last 30 Days' },
            { value: 'year', label: 'Last 12 Months' }
          ]}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{totalComplaints}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <BarChartIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedComplaints}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{pendingComplaints}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
                <p className="text-2xl font-bold text-purple-600">{averageResponseTime}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Complaints by Category</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categoryDistribution).map(([category, count]) => (
                <div key={category} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">
                    {getCategoryLabel(category as ComplaintCategory)}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-blue-600 rounded-full"
                        style={{ width: `${(count / totalComplaints) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <BarChartIcon className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Complaints by Department</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(departmentDistribution).map(([department, count]) => (
                <div key={department} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">
                    {getDepartmentLabel(department as Department)}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-green-600 rounded-full"
                        style={{ width: `${(count / totalComplaints) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Complaints by Status</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">
                    {getStatusLabel(status as ComplaintStatus)}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-purple-600 rounded-full"
                        style={{ width: `${(count / totalComplaints) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Trends */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold">Response Time Trends</h2>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center text-gray-500">
              <p>Response time visualization would go here</p>
              <p className="text-sm">(Data visualization to be implemented)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;