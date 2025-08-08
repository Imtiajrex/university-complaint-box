import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Shield, Clock, UserCheck, BarChart2, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Anonymous",
      description: "Submit complaints securely with optional anonymity to protect your identity"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Real-time Tracking",
      description: "Monitor the status of your complaints in real-time with instant updates"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Direct Communication",
      description: "Engage in direct dialogue with university administrators"
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "Easy Registration",
      description: "Quick and simple registration process for students"
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics for administrators to track and improve response times"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Feedback System",
      description: "Rate and provide feedback on how your complaint was handled"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.95), rgba(30, 64, 175, 0.95)), url('https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 md:py-28">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                University Complaint Box
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                A secure and efficient platform for students to submit and track complaints while enabling administrators to manage and resolve issues effectively.
              </p>
              <div className="space-x-4">
                {user ? (
                  <Link to="/dashboard">
                    <Button size="lg">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button size="lg">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Effective Complaint Management
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools needed for efficient complaint submission, tracking, and resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-12 md:p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join our platform and make your voice heard.
              </p>
              {!user && (
                <Link to="/register">
                  <Button 
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Create an Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;