import React, { useState } from 'react';
import { Complaint } from '../../types';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { getStatusColor, getStatusLabel, getCategoryLabel, getDepartmentLabel } from '../../data/mockData';
import { MessageSquare, Clock, User } from 'lucide-react';
import FeedbackForm from './FeedbackForm';
import ResponseForm from './ResponseForm';

interface ComplaintCardProps {
  complaint: Complaint;
  isAdmin: boolean;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, isAdmin }) => {
  const [showResponses, setShowResponses] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const canProvideFeedback = 
    !isAdmin && 
    complaint.status === 'resolved' && 
    !complaint.feedback;
  
  const canRespond = isAdmin;

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="bg-gray-50 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-lg text-gray-900">{complaint.title}</h3>
            <Badge className={getStatusColor(complaint.status)}>
              {getStatusLabel(complaint.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" /> {formattedDate}
            </span>
            <span>•</span>
            <span>{getCategoryLabel(complaint.category)}</span>
            <span>•</span>
            <span>{getDepartmentLabel(complaint.department)}</span>
            {complaint.isAnonymous ? (
              <span className="flex items-center">
                • <User className="w-3 h-3 mx-1" /> Anonymous
              </span>
            ) : (
              <span>• {complaint.studentName}</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-4">
        <p className="text-gray-700 mb-4">{complaint.description}</p>
        
        {complaint.responses.length > 0 && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowResponses(!showResponses)}
              className="mb-2"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {showResponses ? 'Hide Responses' : `Show Responses (${complaint.responses.length})`}
            </Button>
            
            {showResponses && (
              <div className="mt-2 space-y-3">
                {complaint.responses.map((response) => (
                  <div 
                    key={response.id} 
                    className="bg-blue-50 p-3 rounded-md"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-blue-700">
                        {response.adminName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(response.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{response.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {complaint.feedback && (
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <h4 className="font-medium text-sm text-green-700 mb-1">Feedback</h4>
            <div className="flex items-center mb-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star}
                    className={`w-4 h-4 ${star <= complaint.feedback!.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-1 text-sm text-gray-600">
                {complaint.feedback.rating}/5
              </span>
            </div>
            <p className="text-sm text-gray-700">{complaint.feedback.comment}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="space-x-2">
          {canProvideFeedback && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
            >
              {showFeedbackForm ? 'Cancel' : 'Provide Feedback'}
            </Button>
          )}
          
          {canRespond && !showResponseForm && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => setShowResponseForm(true)}
            >
              Respond
            </Button>
          )}
          
          {showResponseForm && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowResponseForm(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardFooter>
      
      {showFeedbackForm && (
        <div className="px-6 pb-4">
          <FeedbackForm 
            complaintId={complaint.id} 
            onCancel={() => setShowFeedbackForm(false)}
          />
        </div>
      )}
      
      {showResponseForm && (
        <div className="px-6 pb-4">
          <ResponseForm 
            complaintId={complaint.id} 
            onCancel={() => setShowResponseForm(false)}
          />
        </div>
      )}
    </Card>
  );
};

export default ComplaintCard;