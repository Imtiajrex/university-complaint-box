import React, { useState } from 'react';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { useComplaints } from '../../contexts/ComplaintsContext';

interface FeedbackFormProps {
  complaintId: string;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ complaintId, onCancel }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addFeedback } = useComplaints();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!comment.trim()) {
      setCommentError('Please provide feedback comment');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addFeedback(complaintId, rating, comment);
      onCancel();
    } catch (error) {
      console.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t pt-3">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rating
        </label>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none"
              onClick={() => setRating(star)}
            >
              <svg 
                className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} transition-colors duration-150 ease-in-out`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
        </div>
      </div>

      <Textarea
        label="Feedback"
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          if (e.target.value.trim()) setCommentError('');
        }}
        placeholder="Please share your experience with how this complaint was handled..."
        error={commentError}
      />

      <div className="flex justify-end space-x-2">
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
          Submit Feedback
        </Button>
      </div>
    </form>
  );
};

export default FeedbackForm;