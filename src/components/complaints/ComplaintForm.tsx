import React, { useState } from 'react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useComplaints } from '../../contexts/ComplaintsContext';
import { useAuth } from '../../contexts/AuthContext';
import { ComplaintCategory, Department } from '../../types';
import { allCategories, allDepartments, getCategoryLabel, getDepartmentLabel } from '../../data/mockData';

const ComplaintForm: React.FC = () => {
  const { user } = useAuth();
  const { addComplaint } = useComplaints();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('academic');
  const [department, setDepartment] = useState<Department>('computer-science');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form validation errors
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setTitleError('');
    setDescriptionError('');
    setFormError('');

    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.length < 5) {
      setTitleError('Title must be at least 5 characters');
      isValid = false;
    }

    // Validate description
    if (!description.trim()) {
      setDescriptionError('Description is required');
      isValid = false;
    } else if (description.length < 20) {
      setDescriptionError('Description must be at least 20 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setFormError('You must be logged in to submit a complaint');
      return;
    }
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addComplaint({
        title,
        description,
        category,
        department,
        status: 'pending',
        studentId: user.id,
        studentName: isAnonymous ? null : user.name,
        isAnonymous,
      });
      
      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategory('academic');
      setDepartment('computer-science');
      setIsAnonymous(false);

      // Reset success message after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (error) {
      setFormError('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 p-4 rounded-md mb-4">
          <p className="text-sm text-green-700">
            Your complaint has been submitted successfully. You can track its status in the dashboard.
          </p>
        </div>
      )}

      <Input
        label="Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Brief title of your complaint"
        error={titleError}
        maxLength={100}
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Please provide details about your complaint..."
        error={descriptionError}
        className="min-h-[120px]"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
          options={allCategories.map(cat => ({
            value: cat,
            label: getCategoryLabel(cat)
          }))}
        />

        <Select
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value as Department)}
          options={allDepartments.map(dept => ({
            value: dept,
            label: getDepartmentLabel(dept)
          }))}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
        />
        <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
          Submit anonymously (your name will not be visible to administrators)
        </label>
      </div>

      <Button 
        type="submit" 
        isLoading={isSubmitting}
      >
        Submit Complaint
      </Button>
    </form>
  );
};

export default ComplaintForm;