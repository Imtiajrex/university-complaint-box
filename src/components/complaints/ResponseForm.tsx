import React, { useState } from 'react';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useComplaints } from '../../contexts/ComplaintsContext';
import { ComplaintStatus } from '../../types';
import { allStatuses, getStatusLabel } from '../../data/mockData';

interface ResponseFormProps {
  complaintId: string;
  onCancel: () => void;
}

const ResponseForm: React.FC<ResponseFormProps> = ({ complaintId, onCancel }) => {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<ComplaintStatus>('in-progress');
  const [responseError, setResponseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addResponse, updateComplaintStatus } = useComplaints();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!response.trim()) {
      setResponseError('Response message is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addResponse(complaintId, response);
      updateComplaintStatus(complaintId, status);
      onCancel();
    } catch (error) {
      console.error('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t pt-3">
      <Textarea
        label="Response"
        value={response}
        onChange={(e) => {
          setResponse(e.target.value);
          if (e.target.value.trim()) setResponseError('');
        }}
        placeholder="Enter your response to this complaint..."
        error={responseError}
      />

      <Select
        label="Update Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
        options={allStatuses.map(status => ({
          value: status,
          label: getStatusLabel(status)
        }))}
      />

      <div className="flex justify-end space-x-2 mt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          isLoading={isSubmitting}
        >
          Submit Response
        </Button>
      </div>
    </form>
  );
};

export default ResponseForm;