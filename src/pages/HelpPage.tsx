import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { HelpCircle, Book, FileText, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

const HelpPage: React.FC = () => {
  const faqs = [
    {
      question: "How do I submit a complaint?",
      answer: "To submit a complaint, click on the 'Submit New Complaint' button in the navigation menu. Fill out the complaint form with details about your issue, select the appropriate category and department, and click submit."
    },
    {
      question: "Can I submit an anonymous complaint?",
      answer: "Yes, when submitting a complaint, you can check the 'Submit anonymously' option. Your name will not be visible to administrators, but they can still respond to your complaint."
    },
    {
      question: "How can I track my complaint's status?",
      answer: "All your submitted complaints appear on your dashboard. Each complaint card shows its current status, and you'll receive notifications when there are updates."
    },
    {
      question: "What do the different status types mean?",
      answer: "Pending: Newly submitted complaint\nUnder Review: Being evaluated by admin\nIn Progress: Action being taken\nResolved: Issue has been addressed\nRejected: Complaint cannot be processed"
    },
    {
      question: "How do I provide feedback?",
      answer: "Once your complaint is marked as resolved, you'll see a 'Provide Feedback' button on the complaint card. Click it to rate the resolution and leave comments."
    }
  ];

  const guides = [
    {
      title: "Getting Started",
      icon: <Book className="w-5 h-5" />,
      content: "Learn how to use the University Complaint Box system effectively."
    },
    {
      title: "Submitting Complaints",
      icon: <FileText className="w-5 h-5" />,
      content: "Step-by-step guide to submitting and managing your complaints."
    },
    {
      title: "Communication",
      icon: <MessageSquare className="w-5 h-5" />,
      content: "Best practices for communicating with administrators."
    },
    {
      title: "Status Updates",
      icon: <AlertCircle className="w-5 h-5" />,
      content: "Understanding complaint statuses and notification system."
    },
    {
      title: "Resolution & Feedback",
      icon: <CheckCircle className="w-5 h-5" />,
      content: "How to provide feedback and close resolved complaints."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
        <p className="mt-1 text-sm text-gray-600">
          Find answers to common questions and learn how to use the system effectively
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {guides.map((guide, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600">
                  {guide.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{guide.title}</h3>
                  <p className="text-sm text-gray-500">{guide.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader className="py-3 px-4">
                <h3 className="font-medium text-gray-900">{faq.question}</h3>
              </CardHeader>
              <CardContent className="py-3 px-4 bg-gray-50">
                <p className="text-sm text-gray-600 whitespace-pre-line">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Still Need Help?</h2>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              If you couldn't find the answer you were looking for, please contact the support team:
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>Email: support@university.edu</li>
              <li>Phone: (555) 123-4567</li>
              <li>Office Hours: Monday - Friday, 9:00 AM - 5:00 PM</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpPage;